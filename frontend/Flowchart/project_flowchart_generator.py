import os
import argparse
import google.generativeai as genai
from dotenv import load_dotenv
import graphviz # <--- This is the import that was missing!

# --- Step 1: Set up Gemini Pro API ---
# Loads the API key from your .env file
load_dotenv()
API_KEY = os.getenv("GOOGLE_API_KEY")

if not API_KEY:
    raise SystemExit("Missing GOOGLE_API_KEY in .env file.")

genai.configure(api_key=API_KEY)
model = genai.GenerativeModel("gemini-1.5-flash")

# --- Step 2: Define a Prompt to Generate Flowchart Logic ---
def get_flowchart_dot_from_summary(summary_text: str) -> str:
    """
    Prompts Gemini to generate a flowchart in Graphviz DOT language.
    """
    prompt = (
        "Generate a detailed technical flowchart in Graphviz DOT format for a "
        "legal document analysis system. The system uses AI to extract key "
        "information and generate a flowchart. Use diamonds for decisions and "
        "rectangles for processes. Do not include any extra text, comments, "
        "or markdown fences (```). Output ONLY the 'digraph G { ... }' part.\n\n"
        "Here is a summary of the system's workflow:\n"
        f"{summary_text}"
    )

    try:
        response = model.generate_content(prompt)
        dot_code = response.text.strip()
        if not dot_code.startswith("digraph"):
            start_index = dot_code.find("digraph")
            if start_index != -1:
                dot_code = dot_code[start_index:]
        return dot_code
    except Exception as e:
        print(f"Error generating content: {e}")
        return ""

# --- Step 3: Render the Flowchart ---
def render_dot_to_image(dot_code: str, output_filename: str = "project_flowchart.png"):
    """
    Renders the Graphviz DOT code to a PNG image.
    """
    if not dot_code:
        print("No DOT code to render.")
        return

    try:
        # Pass the DOT code directly to graphviz.Source()
        src = graphviz.Source(dot_code)
        
        # Render the Source object
        src.render(filename=output_filename, format="png", cleanup=True)
        print(f"Successfully generated flowchart: {output_filename}")
    except Exception as e:
        print(f"Error rendering flowchart. Check if Graphviz is installed and in your PATH. Error: {e}")

# --- Main script execution ---
if __name__ == "__main__":
    project_summary = (
        "The system starts when a user uploads a legal document (PDF/DOCX). "
        "The AI first extracts and analyzes text from the document. "
        "Then, it identifies key clauses and categorizes them by risk level: High, Medium, or Safe. "
        "If a clause is High Risk, the system suggests a negotiation path and warns of potential consequences. "
        "If it is Medium Risk, it suggests a simple negotiation path. "
        "If a clause is Safe, the system marks it as acceptable. "
        "Finally, the system presents the user with an auto-generated flowchart of the analysis, "
        "highlighting key decisions and their outcomes."
    )

    print("Generating flowchart from project summary...")
    dot_output = get_flowchart_dot_from_summary(project_summary)

    render_dot_to_image(dot_output)

    print("\nProcess finished.")