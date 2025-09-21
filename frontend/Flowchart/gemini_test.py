import os
from dotenv import load_dotenv
import google.generativeai as genai

# Load environment variables from .env file
load_dotenv()

if not api_key:
    raise ValueError("API key not found! Please add it to your .env file as GOOGLE_API_KEY=your_api_key_here")

# Configure Gemini with the API key
genai.configure(api_key=api_key)

# Load the Gemini model
model = genai.GenerativeModel("gemini-1.5-flash")

def chat_with_gemini():
    print("🤖 Gemini AI Chat (type 'exit' to quit)")
    chat = model.start_chat()

    while True:
        user_input = input("You: ")
        if user_input.lower() in ["exit", "quit", "bye"]:
            print("Gemini: Goodbye! 👋")
            break

        response = chat.send_message(user_input)
        print("Gemini:", response.text)

if __name__ == "__main__":
    chat_with_gemini()
