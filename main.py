import os
import re
import json
from flask import Flask, request, jsonify
from dotenv import load_dotenv
import vertexai

from pinecone import Pinecone

from vertexai.generative_models import GenerativeModel
from vertexai.language_models import TextEmbeddingModel

load_dotenv()

app = Flask(__name__)

PROJECT_ID = os.environ.get("GCP_PROJECT_ID")
REGION = os.environ.get("GCP_REGION")
vertexai.init(project=PROJECT_ID, location=REGION)

generation_model = GenerativeModel("gemini-2.5-pro")
embedding_model = TextEmbeddingModel.from_pretrained("text-embedding-004")

PINECONE_API_KEY = os.environ.get("PINECONE_API_KEY")
INDEX_NAME = "karnataka-rental-lows"
pc = Pinecone(api_key=PINECONE_API_KEY)
pinecone_index = pc.Index(INDEX_NAME)


print("Initializations complete. Server is ready.")


@app.route('/analyze', methods=['POST'])
def analyze_document():
    data = request.get_json()
    if not data or 'text' not in data:
        return jsonify({"error": "Request body must contain 'text'"}), 400
    
    document_text = data['text']

    # high level summary
    print("starting stage 1: high-level summary...")
    summary_prompt = f"""
    You are a helpful assistant who explains legal documents in simple, plain English for someone in Bengaluru, Karnataka as of August 2025.
    Read the following rental agreement and provide a simple summary.

    Extract these key details:
    - Landlord's Name
    - Tenant's Name
    - Property Address
    - Monthly Rent Amount
    - Security Deposit Amount
    - Lease Duration (e.g., 11 months, 3 years)
    - Lock-in Period

    Here is the document:
    {document_text}
    """
    try:
        summary_response = generation_model.generate_content(summary_prompt)
        summary_result = summary_response.text
        print("✅ summary generated successfully.")
    except Exception as e:
        print(f"❌ error during summary generation: {e}")
        summary_result = "Could not generate a summary for this document."

    # clause by clause analysis
    print("🚀 starting stage 2: detailed clause analysis...")
    chunks = [chunk for chunk in re.split(r'\n\s*\n', document_text) if len(chunk.strip()) > 100]
    
    risk_analysis_results = []
    
    for i, chunk in enumerate(chunks):
        print(f"analyzing chunk {i+1}/{len(chunks)}...")
        try:
            chunk_embedding = embedding_model.get_embeddings([chunk])[0].values

            query_response = pinecone_index.query(
                vector=chunk_embedding,
                top_k=4,
                include_metadata=True
            )

            similar_clauses_context = ""
            for match in query_response['matches']:
                metadata = match.get('metadata', {})
                similar_clauses_context += (
                    f"- Context: '{metadata.get('clause_text', 'N/A')}'\n"
                    f"  - Risk: {metadata.get('risk_level', 'N/A')}\n"
                    f"  - Explanation: {metadata.get('risk_explanation', 'N/A')}\n"
                )

            analysis_prompt = f"""
            You are a legal risk analyzer for Indian rental agreements. Analyze the "User's Clause" based ONLY on the provided "Expert Context".

            **User's Clause to Analyze:**
            "{chunk}"

            **Expert Context from Knowledge Base:**
            {similar_clauses_context}

            **Your Task:**
            Respond in a VALID JSON format with four keys: "risk_level" (string: "Red", "Yellow", "Green", or "Neutral"), "risk_explanation" (string: a simple one-sentence explanation of the risk), "actionable_advice" (string: one sentence of advice for the user), and "clause_category" (string: a category like "Security Deposit" or "Termination").
            """
            
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
    
    # final response
    final_response = {
        "summary": summary_result,
        "detailed_analysis": risk_analysis_results
    }
    
    return jsonify(final_response)

if __name__ == "__main__":
    app.run(host='0.0.0.0', port=int(os.environ.get('PORT', 8080)))