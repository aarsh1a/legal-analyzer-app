import re
from tavily import TavilyClient
import os
from vertexai.generative_models import Tool, FunctionDeclaration, GenerativeModel
import json
from dotenv import load_dotenv
load_dotenv()

TAVILY_KEY = os.environ.get("TAVILY_API_KEY")
tavily_client = TavilyClient(api_key=TAVILY_KEY)

def extract_interest_rate(summary: str) -> float:
    """
    Extracts the interest rate from the summary text.
    Returns a float (e.g., 12.0 for 12%) or None if not found.
    """
    match = re.search(r'(\d+(?:\.\d+)?)\s*%.*interest', summary, re.IGNORECASE)
    if match:
        return float(match.group(1))
    return None

def tavily_search_tool(query: str) -> str:
    """
    Wrapper around Tavily search, returning raw text results for Gemini to interpret.
    """
    search_results = tavily_client.search(query, max_results=10)
    texts = []
    for r in search_results.get("results", []):
        snippet = r.get("content", "")
        link = r.get("url", "")
        title = r.get("title", "")
        texts.append(f"{title} :: {snippet} (Link: {link})")
    return "\n".join(texts)


# Define the tool function
search_func = FunctionDeclaration(
    name="search_web",
    description="Searches the internet for current bank loan interest rates",
    parameters={
        "type": "object",
        "properties": {
            "query": {"type": "string", "description": "Search query for loan rates"}
        },
        "required": ["query"],
    },
)

search_tool = Tool(function_declarations=[search_func])

def find_better_loan_options(summary: str):
    # Step A: extract interest rate
    agreement_rate = extract_interest_rate(summary)
    if not agreement_rate:
        return {"error": "Could not extract interest rate from summary"}
    
    # Step B: let Gemini reason with web tool
    prompt = f"""
    The loan agreement has an interest rate of {agreement_rate}%.
    Use the search_web tool to look up current personal loan interest rates in India (Sep 2025).
    Find banks offering lower rates than {agreement_rate}%.
    
    Return a JSON list with objects like:
    {{
      "bank": "<Bank Name>",
      "rate": <float>,
      "application_link": "<URL>",
      "advice": "<short one-line advice>"
    }}
    """
    
    response = generation_model.generate_content(
        prompt,
        tools=[search_tool],
        tool_config={"function_calling_config": "AUTO"}  # let Gemini decide when to call
    )
    
    try:
        return json.loads(response.text.strip())
    except:
        return {"raw_response": response.text}
