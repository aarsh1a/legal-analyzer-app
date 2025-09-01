import os
import argparse
import google.generativeai as genai
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import graphviz
import json
import re

# --- Step 1: Set up Gemini Pro API ---
# Loads the API key from your .env file
load_dotenv()
API_KEY = os.getenv("GOOGLE_API_KEY")

if not API_KEY:
    raise SystemExit("Missing GOOGLE_API_KEY in .env file.")

genai.configure(api_key=API_KEY)
model = genai.GenerativeModel("gemini-1.5-flash")

# --- FastAPI App Setup ---
app = FastAPI(title="AI Flowchart Generator",
              description="An API that generates Graphviz DOT flowcharts from text summaries using Gemini Pro.",
              version="1.0.0")

# Add CORS middleware to allow your website (frontend) to connect
origins = [
    "*"  # Allows all origins for hackathon simplicity
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Flowchart Generation Logic ---
def get_flowchart_dot_from_summary(summary_text: str) -> str:
    """
    Prompts Gemini to generate a flowchart in Graphviz DOT language.
    """
    prompt = (
        "Generate a concise legal decision flowchart in Graphviz DOT format. The flowchart should not include steps "
        "for document upload, OCR, or text extraction. Instead, it should start with an 'AI Analysis Complete' node "
        "and immediately branch into a risk assessment. For each clause mentioned in the summary, create a decision "
        "path based on its risk level. Use diamonds for decisions and rectangles for processes. "
        "Your output must be a valid 'digraph G { ... }' string with no extra text or markdown fences.\n\n"
        "Here is the legal summary to analyze:\n"
        f"{summary_text}"
    )

    try:
        response = model.generate_content(prompt)
        dot_code = response.text.strip()
        # Clean up any extra text or markdown fences from Gemini's response
        if not dot_code.startswith("digraph"):
            start_index = dot_code.find("digraph")
            if start_index != -1:
                dot_code = dot_code[start_index:]
        return dot_code
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI generation failed: {e}")

# --- API Endpoint ---
@app.post("/generate-flowchart", summary="Generate a flowchart from a legal summary")
async def generate_flowchart(summary: dict):
    """
    Receives a summary from the frontend and returns a flowchart.
    
    - **summary**: A JSON object with a 'text' field containing the legal summary.
    """
    summary_text = summary.get("text", "")
    if not summary_text:
        raise HTTPException(status_code=400, detail="Summary text is missing.")

    dot_code = get_flowchart_dot_from_summary(summary_text)

    # Return the raw DOT code as a string
    return {"dot_code": dot_code}
