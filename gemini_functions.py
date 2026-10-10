from google import genai
import google
from google.genai import types
import json
import os
from dotenv import load_dotenv

load_dotenv()
key = os.getenv("GEMINI_API_KEY")

class EmptyResponseError(Exception):
    """Gemini answered without any text (e.g. a blocked or empty response)."""

def response_text(response, error_message):
    text = (response.text or "").strip()
    if not text:
        raise EmptyResponseError(error_message)
    return text

def get_key_concepts(photo_path):
    with open(photo_path, 'rb') as f:
        image_bytes = f.read()
    mime_type = 'image/png' if photo_path.lower().endswith('.png') else 'image/jpeg'
    client = genai.Client(api_key=key)
    response = client.models.generate_content(
        model='gemini-2.5-flash',
        contents=[
            types.Part.from_bytes(
                data=image_bytes,
                mime_type=mime_type,
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
    return response_text(response, "Gemini couldn't read anything from this image")

def gemini_quizzes(concepts):
    client = genai.Client(api_key=key)
    try:
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=f"Generate quiz questions based on this text: {concepts}\n\n"
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
        text = response_text(response, "Gemini returned an empty response for the quiz. Please try again.")
        return json.loads(text.strip("```json").strip("```"))
    except google.genai.errors.ServerError:
        return None
    except json.JSONDecodeError:
        return None

def get_quizzes(photo_path, concepts=None):
    if concepts is None:
        concepts = get_key_concepts(photo_path)
    return concepts, gemini_quizzes(concepts)

if __name__ == "__main__":
    import sys
    print(get_quizzes(sys.argv[1]))

