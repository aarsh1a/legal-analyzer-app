import re
from tavily import TavilyClient
import os
from vertexai.generative_models import Tool, FunctionDeclaration
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
    print('Extracted agreement rate:', match)
    if match:
        return float(match.group(1))
    return None

def tavily_search_tool(query: str) -> list:
    """
    Search Tavily for current loan interest rates.
    Returns a list of dicts with bank name, rate, and URL.
    """
    search_results = tavily_client.search(query, max_results=5)
    parsed = []
    for r in search_results.get("results", []):
        parsed.append({
            "title": r.get("title", ""),
            "snippet": r.get("content", ""),
            "url": r.get("url", "")
        })
    print("✅ Tavily Search Done")
    return parsed


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

