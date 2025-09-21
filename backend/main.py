import os
import re
import json
from flask import Flask, request, jsonify
from dotenv import load_dotenv
import vertexai
from flask_cors import CORS
from sentence_transformers import SentenceTransformer
import re
from pinecone import Pinecone
from vertexai.generative_models import GenerativeModel
from helper import extract_interest_rate, search_tool
from langchain_google_genai import ChatGoogleGenerativeAI
from helper import extract_interest_rate, tavily_search_tool

load_dotenv()

app = Flask(__name__)
CORS(app)
PROJECT_ID = os.environ.get("GCP_PROJECT_ID")
REGION = os.environ.get("GCP_REGION")
GOOGLE_API_KEY = os.environ.get("GOOGLE_API_KEY")
vertexai.init(project=PROJECT_ID, location=REGION)

generation_model = GenerativeModel("gemini-2.5-pro")
embedding_model = SentenceTransformer("sentence-transformers/all-mpnet-base-v2")  
llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash",api_key = GOOGLE_API_KEY)
llm_tools = llm.bind_tools([tavily_search_tool])

PINECONE_API_KEY = os.environ.get("PINECONE_API_KEY")
RENTAL_INDEX_NAME = "karnataka-rental-lows"
EMPLOYMENT_INDEX_NAME = "employment-laws"
LOAN_INDEX_NAME = "loan-laws"
pc = Pinecone(api_key=PINECONE_API_KEY)
rental_pinecone_index = pc.Index(RENTAL_INDEX_NAME)
employment_pinecone_index = pc.Index(EMPLOYMENT_INDEX_NAME)
loan_pinecone_index = pc.Index(LOAN_INDEX_NAME)

print("Initializations complete. Server is ready.")

key_entity_extraction_prompt = """
You are an expert legal analyst tasked with extracting ONLY the most critical entities from a legal document. Your output will be used for a high-level summary, so it must be concise.

**Instructions:**
1.  **Be Selective:** Focus only on the primary entities that define the agreement.
2.  **Primary Parties:** Identify the main parties (e.g., Lender, Borrower, Landlord).
3.  **Core Financials:** Extract the main financial figures (e.g., Loan Amount, Monthly Rent, Interest Rate).
4.  **Essential Terms & Dates:** Pinpoint crucial dates and terms (e.g., First Payment Date, Repayment Term, Collateral).
5.  **Omit Secondary Info:** Do NOT include witnesses, full street addresses (unless it's collateral), or general city names.
6.  **Formatting:**
    - Do NOT include headers or introductory sentences.
    - Present the result as a simple bulleted list, with each point starting with '*'.
    - **Crucially, use the format: `* Label: Value`**.

**Example for a Loan Agreement:**
* Lender: Rajesh Kumar
* Borrower: Priya Sharma
* Loan Amount: Rs. 10,00,000
* Interest Rate: 12% per annum
* Repayment Term: 24 months
* Collateral: Apartment in Bangalore
* Default Penalty Interest: 3% per month

**Example for a Rental Agreement:**
* Landlord: Aarav Singh
* Tenant: Sneha Gupta
* Monthly Rent: ₹25,000
* Security Deposit: ₹50,000
* Lease Term: 11 Months

Document Text:
\"\"\"{document_text}\"\"\"
"""

def process_contract(document_text: str, summary_prompt: str, analysis_prompt_template: str, pinecone_index, contract_type: str):
    # --- New Stage 0: Key Entity Extraction ---
    print("starting stage 0: key entity extraction...")
    try:
        entity_prompt = key_entity_extraction_prompt.format(document_text=document_text)
        entity_response = generation_model.generate_content(entity_prompt)
        key_entities_result = entity_response.text.strip()
        print("✅ key entities extracted successfully.")
    except Exception as e:
        print(f"❌ error during key entity extraction: {e}")
        key_entities_result = "Could not extract key entities from this document."

    # --- Stage 1: High-level summary ---
    print("starting stage 1: high-level summary...")
    try:
        summary_response = generation_model.generate_content(summary_prompt.format(document_text=document_text))
        summary_result = summary_response.text.strip()
        print("✅ summary generated successfully.")
    except Exception as e:
        print(f"❌ error during summary generation: {e}")
        summary_result = "Could not generate a summary for this document."

    # --- New Stage 1.5: In-Hand Salary Calculation (for employment contracts) ---
    salary_analysis_result = None
    if contract_type == 'employment':
        print("starting stage 1.5: in-hand salary analysis...")
        try:
            salary_prompt = salary_extraction_prompt.format(document_text=document_text)
            salary_response = generation_model.generate_content(salary_prompt)
            clean_json_string = salary_response.text.strip().replace('```json', '').replace('```', '')
            salary_components = json.loads(clean_json_string)
            salary_analysis_result = calculate_in_hand_salary(salary_components)
            print("✅ in-hand salary analysis complete.")
        except Exception as e:
            print(f"❌ error during salary analysis: {e}")
            salary_analysis_result = {"error": "Could not perform salary analysis."}

    mermaid_code = get_flowchart_mermaid_from_summary(summary_result)

    # --- Stage 2: Clause-by-clause analysis ---
    print("starting stage 2: detailed clause analysis...")
    chunks = [chunk.strip() for chunk in re.split(r'\n\s*\n|\n(?=\s*(\d+\.|\*|\([a-zA-Z]\)|\b[IVX]+\.))', document_text) if len(chunk.strip()) > 50]
    risk_analysis_results = []

    for i, chunk in enumerate(chunks):
        print(f"analyzing chunk {i+1}/{len(chunks)}...")
        try:
            chunk_embedding = embedding_model.encode(chunk).tolist()
            query_response = pinecone_index.query(
                vector=chunk_embedding,
                top_k=4,
                include_metadata=True
            )

            # build expert context
            similar_clauses_context = ""
            for match in query_response['matches']:
                metadata = match.get('metadata', {})
                similar_clauses_context += (
                    f"- Context: '{metadata.get('clause_text', 'N/A')}'\n"
                    f"  - Risk: {metadata.get('risk_level', 'N/A')}\n"
                    f"  - Explanation: {metadata.get('risk_explanation', 'N/A')}\n"
                )

            # fill the analysis prompt
            analysis_prompt = analysis_prompt_template.format(
                chunk=chunk,
                similar_clauses_context=similar_clauses_context
            )

            analysis_response = generation_model.generate_content(analysis_prompt)
            clean_json_string = analysis_response.text.strip().replace('```json', '').replace('```', '')
            analysis_json = json.loads(clean_json_string)

            risk_analysis_results.append({
                "original_clause": chunk,
                "analysis": analysis_json
            })
        except Exception as e:
            print(f"❌ error processing chunk {i+1}: {e}")
            continue

    print("✅ detailed analysis complete.")
    response_data = {
        "key_entities": key_entities_result,
        "summary": summary_result,
        "detailed_analysis": risk_analysis_results,
        "flowchart": mermaid_code
    }
    if salary_analysis_result:
        response_data["salary_analysis"] = salary_analysis_result
        
    return response_data


# ---- Rental Prompts ----
rental_summary_prompt = """
You are an expert legal analyst. Your task is to explain a rental agreement in simple, plain English for someone in Bengaluru, Karnataka.

**Instructions:**
1.  **Narrative Only:** Write a narrative summary explaining what the agreement means. Describe the key terms like rent, deposit, and lease duration within the story.
2.  **No Lists:** Do NOT create a separate bulleted or itemized list of "Key Details".
3.  **No Intros/Outros:** Do NOT start with conversational phrases like "Of course, here is..." and do NOT add a disclaimer at the end.
4.  **Just the Summary:** Your entire response must be only the narrative summary text.

Here is the document:
{document_text}
"""

rental_analysis_prompt = """
You are a legal risk analyzer for Indian residential rental agreements.

Analyze the "User's Clause" using BOTH:
1) the "Expert Context" (if substantive), and
2) your domain knowledge of typical Indian rental practices.

If the Expert Context is empty or insufficient, DO NOT say "no context" or "N/A".
You MUST still classify risk and provide one-sentence advice based on the clause itself
and general norms for Indian rental agreements (Bengaluru/Karnataka context).

Return ONLY a VALID JSON object with EXACTLY these keys:
- "risk_level": one of "Red", "Yellow", "Green", or "Neutral"
- "risk_explanation": one concise sentence
- "actionable_advice": one concise sentence tailored to the clause
- "clause_category": concise category (e.g., "Security Deposit", "Termination", "Maintenance", "Rent & Payment", etc.)

**User's Clause to Analyze:**
\"\"\"{chunk}\"\"\"

**Expert Context from Knowledge Base:**
{similar_clauses_context}
"""

# ---- Employment Prompts ----
employment_summary_prompt = """
You are an expert legal analyst. Your task is to explain an employment agreement in simple, plain English for someone in Bengaluru, Karnataka.

**Instructions:**
1.  **Narrative Only:** Write a narrative summary explaining what the agreement means. Describe the key terms like salary, job role, and notice period within the story.
2.  **No Lists:** Do NOT create a separate bulleted or itemized list of "Key Details".
3.  **No Intros/Outros:** Do NOT start with conversational phrases like "Of course, here is..." and do NOT add a disclaimer at the end.
4.  **Just the Summary:** Your entire response must be only the narrative summary text.

Here is the document:
{document_text}
"""

employment_analysis_prompt = """
You are a legal risk analyzer for Indian employment agreements.

Analyze the "User's Clause" using BOTH:
1) the "Expert Context" (if substantive), and
2) your domain knowledge of typical Indian employment practices and labor laws.

If the Expert Context is empty or insufficient, DO NOT say "no context" or "N/A".
You MUST still classify risk and provide one-sentence advice based on the clause itself
and general norms for employment agreements in Bengaluru/Karnataka.

Return ONLY a VALID JSON object with EXACTLY these keys:
- "risk_level": one of "Red", "Yellow", "Green", or "Neutral"
- "risk_explanation": one concise sentence
- "actionable_advice": one concise sentence tailored to the clause
- "clause_category": concise category (e.g., "Salary & Compensation", "Probation", "Termination", "Non-Compete", "Leave Policy", etc.)

**User's Clause to Analyze:**
\"\"\"{chunk}\"\"\"

**Expert Context from Knowledge Base:**
{similar_clauses_context}
"""

salary_extraction_prompt = """
You are an expert financial analyst reading an Indian employment offer letter. Your goal is to determine the monthly salary components.

**Primary Task:**
First, try to find the explicit monthly values for:
- Basic Salary
- House Rent Allowance (HRA)
- Special Allowance

**Contingency Plan:**
If the document only mentions a total "Cost to Company" (CTC) or "Gross Annual Salary", you must estimate the monthly components based on standard Indian salary structures. A common structure is:
- **Basic Salary:** 40% of the annual CTC, divided by 12.
- **HRA:** 50% of the monthly Basic Salary.
- **Special Allowance:** The remaining amount to make up the total monthly salary.

**Instructions:**
1.  Read the document text provided.
2.  If explicit monthly components are present, use them.
3.  If only an annual total is present, calculate the estimated monthly components.
4.  Return ONLY a valid JSON object with EXACTLY these keys: "basic_salary", "hra", "special_allowance".
5.  The values must be numbers. If a component cannot be found or calculated, use 0.

Document Text:
\"\"\"{document_text}\"\"\"
"""
date_extraction_prompt = """
You are an expert at identifying important dates in legal documents.
Analyze the document below and extract all key dates and their significance.

**Instructions:**
1.  Identify dates like start dates, end dates, notice deadlines, payment due dates, etc.
2.  For each date, provide a clear, concise description of what it represents.
3.  Format the output as a valid JSON array of objects. Each object must have two keys: "date" (in YYYY-MM-DD format) and "description" (a string).
4.  If no significant dates are found, return an empty array `[]`.

**Example Output:**
[
  {
    "date": "2025-09-10",
    "description": "Employment Start Date"
  },
  {
    "date": "2026-03-10",
    "description": "Probation Period Ends"
  }
]

Document Text:
\"\"\"{document_text}\"\"\"
"""

# ---- Loan Prompts ----
loan_summary_prompt = """
You are an expert legal analyst. Your task is to explain a loan agreement in simple, plain English for someone in Bengaluru, Karnataka.

**Instructions:**
1.  **Narrative Only:** Write a narrative summary explaining what the agreement means. Describe who is lending money to whom, the amount, interest, repayment plan, and any important conditions like collateral or penalties.
2.  **No Lists:** Do NOT create a separate bulleted or itemized list of "Key Details".
3.  **No Intros/Outros:** Do NOT start with conversational phrases like "Of course, here is..." and do NOT add a disclaimer at the end.
4.  **Just the Summary:** Your entire response must be only the narrative summary text.

Here is the document:
{document_text}
"""

loan_analysis_prompt = """
You are a legal risk analyzer for Indian loan agreements.

Analyze the "User's Clause" using BOTH:
1) the "Expert Context" (if substantive), and
2) your domain knowledge of Indian lending practices and RBI guidelines.

Return ONLY a VALID JSON object with EXACTLY these keys:
- "risk_level": one of "Red", "Yellow", "Green", or "Neutral"
- "risk_explanation": one concise sentence
- "actionable_advice": one concise sentence
- "clause_category": concise category (e.g., "Interest Rate", "Repayment", "Default", "Collateral", "Prepayment")

**User's Clause to Analyze:**
\"\"\"{chunk}\"\"\"

**Expert Context from Knowledge Base:**
{similar_clauses_context}
"""

# ---- Wrappers ----
def rental_response(document_text: str):
    return jsonify(process_contract(
        document_text,
        summary_prompt=rental_summary_prompt,
        analysis_prompt_template=rental_analysis_prompt,
        pinecone_index=rental_pinecone_index,
        contract_type='rental'
    ))

def employment_response(document_text: str):
    return jsonify(process_contract(
        document_text,
        summary_prompt=employment_summary_prompt,
        analysis_prompt_template=employment_analysis_prompt,
        pinecone_index=employment_pinecone_index,
        contract_type='employment'
    ))

def loan_response(document_text: str):
    return jsonify(process_contract(
        document_text,
        summary_prompt=loan_summary_prompt,
        analysis_prompt_template=loan_analysis_prompt,
        pinecone_index=loan_pinecone_index,
        contract_type='loan'
    ))


# ---- Endpoint ----
@app.route('/analyze', methods=['POST'])
def analyze_document():
    data = request.get_json()
    if not data or 'text' not in data:
        return jsonify({"error": "Request body must contain 'text'"}), 400
    
    document_text = data['text']
    contract_type = detect_contract_type(document_text)

    print(f"Detected contract type: {contract_type}")

    if contract_type == 'rental':
        return rental_response(document_text)
    elif contract_type == 'employment':
        return employment_response(document_text)
    elif contract_type == 'loan':
        return loan_response(document_text)
    else:
        return jsonify({"error": "Unsupported contract type. Only rental and employment agreements are supported."}), 400


@app.route('/chatbot', methods=['POST'])
def chatbot():
    """
    Chatbot endpoint to answer user questions about the contract.
    Expects JSON input with:
      - 'summary': summary of the contract
      - 'detailed_analysis': list of clause analyses
      - 'question': user's question
    """
    data = request.get_json()
    if not data or 'summary' not in data or 'detailedAnalysis' not in data :
        return jsonify({"error": "Request body must contain 'summary', 'detailed_analysis'"}), 400

    summary = parse_summary(data['summary'])
    detailed_analysis = data['detailedAnalysis']
    question = data['question']

    # Prepare context for the LLM
    context = f"""
    You are a legal assistant specializing in Indian rental, employment and loan agreements. 

    Your job:
    1. First, check the provided summary and clause analyses for explicit rules. 
    2. If the agreement is silent on the issue, point this out clearly.
    3. Then, explain the *typical legal or common practice in India* that would apply in such a case. 
    4. Suggest what the tenant should clarify or negotiate with the landlord.

    Keep your answer simple, practical, and written for a non-lawyer.

    **Contract Summary:**
    {summary}

    **Detailed Analysis of Clauses:**
    {detailed_analysis}

    **User Question:**
    {question}

    Keep the response small and one liner points"
    """

    try:
        response = generation_model.generate_content(context)
        answer = response.text.strip()
        return jsonify({"answer": answer})
    except Exception as e:
        print(f"❌ error during chatbot response: {e}")
        return jsonify({"error": "Could not generate a response."}), 500

@app.route('/loan_comparison', methods=['POST'])
def loan_comparison():
    data = request.get_json()
    if 'summary' not in data:
        return jsonify({"error": "Request body must contain 'summary'"}), 400

    summary = parse_summary(data['summary'])
    agreement_rate = extract_interest_rate(summary)

    query = f"current personal loan interest rates India September 2025"

    # Step 1: Ask Gemini with tool binding
    response = llm_tools.invoke(
        f"The loan agreement has {agreement_rate}% interest. "
        f"Search for banks offering lower rates. Query: {query}"
    )

    # Step 2: Check if Gemini tried to call a tool
    if response.tool_calls:
        tool_call = response.tool_calls[0]
        if tool_call["name"] == "tavily_search_tool":
            tool_args = tool_call["args"]
            tool_result = tavily_search_tool(**tool_args)   # actually call your function

            # Step 3: Send tool result back to Gemini for reasoning
            followup = llm_tools.invoke(
                f"The agreement interest rate is {agreement_rate}%. "
                f"Here are the current market loan rates: {tool_result}. "
                f"Compare and suggest the best option."
            )
            return jsonify({"comparison": followup.content})

    return jsonify({"answer": response.content})

# put flowchart api here
def get_flowchart_mermaid_from_summary(summary_text: str) -> str:
    """Generates Mermaid flowchart code from a summary text using the generative model."""
    prompt = f"""
    You are a helpful assistant that converts a summary of a legal document into a Mermaid.js flowchart.
    Based on the following summary, create a Mermaid.js flowchart that visualizes the key stages and decision points of the rental agreement process.

    The flowchart should be simple and easy to understand for a layperson.
    Your response should only contain the Mermaid code, starting with ```mermaid and ending with ```.

    Summary:
    {summary_text}
    """
    try:
        print("🤖 generating flowchart...")
        response = generation_model.generate_content(prompt)
        # Extract the mermaid code from the response
        mermaid_code = response.text.strip()

        # Remove starting ```mermaid if present
        if mermaid_code.startswith("```mermaid"):
            mermaid_code = mermaid_code[len("```mermaid"):]

        # Remove ending ``` if present
        if mermaid_code.endswith("```"):
            mermaid_code = mermaid_code[:-len("```")]

        # Remove extra whitespace
        mermaid_code = mermaid_code.strip()

        print("✅ flowchart generated successfully.")
        return mermaid_code
    except Exception as e:
        print(f"❌ error during flowchart generation: {e}")
        return "graph TD;\n    A[Error generating flowchart];"

    
def parse_summary(summary: str) -> str:
    """
    Parse the markdown-style summary into a clean, structured text block
    for the LLM context.
    """
    lines = summary.split("\n")
    parsed_lines = []

    for line in lines:
        # Extract bold headings like **Key:** Value
        match = re.match(r"\*\*(.*?)\*\*[:\-]*\s*(.*)", line.strip())
        if match:
            key, value = match.groups()
            parsed_lines.append(f"{key.strip()}: {value.strip()}")
        else:
            # Keep non-empty plain lines
            if line.strip():
                parsed_lines.append(line.strip())

    return "\n".join(parsed_lines)

def detect_contract_type(document_text: str) -> str:
    """
    Identify contract type from text. Returns one of 'rental', 'employment', 'loan' or 'unknown'.
    """
    try:
        classification_prompt = f"""
        You are a contract classifier.
        Based ONLY on the text provided, decide if this contract is:
        - Rental Agreement
        - Employment Agreement
        - Loan Agreement

        Return only one word: "rental", "employment", "loan".

        Document:
        {document_text[:3000]}  # truncate to avoid token overload
        """
        response = generation_model.generate_content(classification_prompt)
        label = response.text.strip().lower()

        if "rental" in label:
            return "rental"
        elif "employment" in label:
            return "employment"
        elif "loan" in label:
            return "loan"
        else:
            return "unknown"
    except Exception as e:
        print(f"❌ error in contract classification: {e}")
        return "unknown"

def calculate_in_hand_salary(salary_components: dict) -> dict:
    """Calculates in-hand salary based on extracted components for Karnataka."""
    try:
        basic = salary_components.get("basic_salary", 0)
        hra = salary_components.get("hra", 0)
        special_allowance = salary_components.get("special_allowance", 0)

        if basic == 0:
            return {"error": "Basic Salary could not be determined, cannot calculate in-hand salary."}

        gross_monthly = basic + hra + special_allowance
        annual_gross = gross_monthly * 12

        employee_pf = 0.12 * basic

        professional_tax = 200 if gross_monthly > 15000 else 0

        taxable_income = annual_gross - 50000
        annual_tax = 0
        if taxable_income > 1500000:
            annual_tax = 150000 + (taxable_income - 1500000) * 0.30
        elif taxable_income > 1200000:
            annual_tax = 90000 + (taxable_income - 1200000) * 0.20
        elif taxable_income > 900000:
            annual_tax = 45000 + (taxable_income - 900000) * 0.15
        elif taxable_income > 600000:
            annual_tax = 15000 + (taxable_income - 600000) * 0.10
        elif taxable_income > 300000:
            annual_tax = (taxable_income - 300000) * 0.05
        
        monthly_tds = annual_tax / 12 if annual_tax > 0 else 0

        # Final Calculation
        total_deductions = employee_pf + professional_tax + monthly_tds
        in_hand_salary = gross_monthly - total_deductions

        return {
            "estimated_monthly_in_hand": round(in_hand_salary),
            "gross_monthly_salary": round(gross_monthly),
            "deductions": {
                "employee_pf": round(employee_pf),
                "professional_tax": round(professional_tax),
                "estimated_tds": round(monthly_tds),
                "total_deductions": round(total_deductions)
            }
        }
    except Exception as e:
        return {"error": f"An error occurred during salary calculation: {e}"}

if __name__ == "__main__":
    app.run(host='0.0.0.0', port=int(os.environ.get('PORT', 8080)),debug=True)