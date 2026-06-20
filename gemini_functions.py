import os
import streamlit as st
from google import genai
from google.genai import types
from dotenv import load_dotenv
def get_key_concepts():
    with open('saved_photo.jpg', 'rb') as f:
        image_bytes = f.read()
    load_dotenv()
    GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
    client = genai.Client(api_key=GEMINI_API_KEY)
    response = client.models.generate_content(
        model='gemini-2.5-flash',
        contents=[
            types.Part.from_bytes(
                data=image_bytes,
                mime_type='image/jpeg',
            ),
        "You are an expert at extracting key information from study notes. "
        "Look at this image and identify the most important concepts a student."
        "needs to know to pass an exam on this material.\n\n"
        "Write your response as a single paragraph of 3-5 sentences."
        "Do not explain what student should know, just start directly with the concepts."
        "Focus only on the core ideas, definitions, and facts that are essential — "
        "skip minor details, examples, or repetition.\n\n"
        "Base your answer only on what is visible in the image. Do not add "
        "information from outside knowledge.\n\n"
        "If the image is unclear, blurry, or contains no readable text, say so "
        "explicitly instead of guessing."
        ])
    return response.text
def get_quizes():
    if "concepts" in st.session_state:
        load_dotenv()
        GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
        client = genai.Client(api_key=GEMINI_API_KEY)
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents= f"Your task is to generate quizes based on text:{st.session_state["concepts"]}. "
                      f"I want you to generate 3-5 quizes (choose how many you want to generate based"
                      f"on the size of the text, that size should be enough for student to remember "
                      f"all concepts from the uploaded text. "
        )

if __name__ == "__main__":
    get_key_concepts()

