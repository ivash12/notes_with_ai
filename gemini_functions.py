from google import genai
import google
from google.genai import types
import os
from dotenv import load_dotenv
from pydantic import BaseModel, TypeAdapter, ValidationError

load_dotenv()
key = os.getenv("GEMINI_API_KEY")

class EmptyResponseError(Exception):
    """Gemini answered without any text (e.g. a blocked or empty response)."""

class UnreadableImageError(Exception):
    """Gemini reported that it can't read the notes in the image."""

class KeyConcepts(BaseModel):
    readable: bool
    concepts: str

class QuizQuestion(BaseModel):
    question: str
    options: list[str]
    correct: str
    explanation: str

QUIZ_LIST = TypeAdapter(list[QuizQuestion])

def valid_quiz(questions):
    # The schema fixes the shape, but not that the answer is one of the options.
    return 0 < len(questions) and all(
        len(q.options) == 3
        and len(set(q.options)) == 3
        and q.correct in q.options
        and q.explanation.strip()
        for q in questions
    )

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
        "Look at this image and identify the most important concepts a student "
        "needs to know to pass an exam on this material.\n\n"
        "Write your response as a single paragraph of 3-5 sentences. "
        "Do not explain what a student should know, just start directly with the concepts. "
        "Focus only on the core ideas, definitions, and facts that are essential — "
        "skip minor details, examples, or repetition.\n\n"
        "Base your answer only on what is visible in the image. Do not add "
        "information from outside knowledge.\n\n"
        "If the image is unclear, blurry, or contains no readable notes, set "
        "\"readable\" to false and leave \"concepts\" empty instead of guessing. "
        "Otherwise set \"readable\" to true and put the paragraph in \"concepts\"."
        ],
        config=types.GenerateContentConfig(
            response_mime_type='application/json',
            response_schema=KeyConcepts,
        ))
    text = response_text(response, "Gemini couldn't read anything from this image")
    try:
        result = KeyConcepts.model_validate_json(text)
    except ValidationError:
        raise EmptyResponseError("Gemini gave an answer we couldn't understand. Please try again.")
    if not result.readable:
        raise UnreadableImageError(
            "We couldn't read the notes in this photo. Try a sharper, well-lit "
            "photo where the text is clearly visible."
        )
    if not result.concepts.strip():
        raise EmptyResponseError("Gemini couldn't read anything from this image")
    return result.concepts.strip()

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
            "Each question must have exactly 3 different options, and the \"correct\" value "
            "must exactly match one of the strings in \"options\".\n\n"
            "For each question, write an \"explanation\" of 1-2 sentences saying why the "
            "correct answer is right, so a student who got it wrong learns from it.",
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=list[QuizQuestion],
            ),
        )
        text = response_text(response, "Gemini returned an empty response for the quiz. Please try again.")
        questions = QUIZ_LIST.validate_json(text)
    except google.genai.errors.ServerError:
        return None
    except ValidationError:
        return None
    if not valid_quiz(questions):
        return None
    return [q.model_dump() for q in questions]

def get_quizzes(photo_path, concepts=None):
    if concepts is None:
        concepts = get_key_concepts(photo_path)
    return concepts, gemini_quizzes(concepts)

if __name__ == "__main__":
    import sys
    print(get_quizzes(sys.argv[1]))

