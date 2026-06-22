import streamlit as st
from google import genai
import google
from google.genai import types
import json
import os
from dotenv import load_dotenv

load_dotenv()
key = os.getenv("GEMINI_API_KEY")
def get_key_concepts():
    with open('saved_photo.jpg', 'rb') as f:
        image_bytes = f.read()
    client = genai.Client(api_key=key)
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

def gemini_quizzes():
    client = genai.Client(api_key=key)
    try:
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=f"Generate quiz questions based on this text: {st.session_state['concepts']}\n\n"
            "Count how many distinct concepts or terms are present in the text, and generate "
            "one question per distinct concept, with a minimum of 3 and a maximum of 7 questions.\n\n"
            "Each question must be about a concept or term mentioned in the text above. "
            "You may use your own general knowledge to write the question and the three "
            "answer options, as long as the topic itself comes from the text.\n\n"
            "Return ONLY valid JSON, with no other words before or after it, in exactly this format:\n"
            '[{"question": "...", "options": ["...", "...", "..."], "correct": "..."}]\n\n'
            "Each question must have exactly 3 options, and the \"correct\" value must exactly "
            "match one of the strings in \"options\"."
        )
        return json.loads(response.text.strip().strip("```json").strip("```"))
    except google.errors.ServerError:
        return None
    except json.JSONDecodeError:
        return None

def get_quizzes():
    if "concepts" not in st.session_state:
        st.session_state["concepts"] = get_key_concepts()
    return gemini_quizzes()

if __name__ == "__main__":
    print(get_quizzes())
    print(type(get_quizzes()))

