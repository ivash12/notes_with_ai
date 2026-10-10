import os
import uuid

import google
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel

from gemini_functions import EmptyResponseError, get_key_concepts, get_quizzes

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "uploads")
ALLOWED_EXTENSIONS = (".jpg", ".jpeg", ".png")
BUSY_MESSAGE = "Sorry, the server is busy now. Please, try later"

os.makedirs(UPLOAD_DIR, exist_ok=True)

app = FastAPI(title="Notes with AI")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class PhotoRequest(BaseModel):
    photo_id: str


class QuizRequest(PhotoRequest):
    concepts: str | None = None


def find_photo(photo_id: str) -> str:
    # Only a real uuid is ever turned into a file name, so an id can't point
    # outside the uploads folder.
    try:
        name = uuid.UUID(photo_id).hex
    except ValueError:
        name = None
    if name is not None:
        for extension in ALLOWED_EXTENSIONS:
            path = os.path.join(UPLOAD_DIR, name + extension)
            if os.path.exists(path):
                return path
    raise HTTPException(status_code=404, detail="Photo not found. Please upload it again.")


@app.post("/api/photo")
def upload_photo(file: UploadFile = File(...)):
    extension = os.path.splitext(file.filename or "")[1].lower()
    if extension not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail="Only jpg, jpeg and png images are supported")
    photo_id = uuid.uuid4().hex
    with open(os.path.join(UPLOAD_DIR, photo_id + extension), "wb") as f:
        f.write(file.file.read())
    return {"photo_id": photo_id}


@app.get("/api/photo/{photo_id}")
def get_photo(photo_id: str):
    return FileResponse(find_photo(photo_id), headers={"Cache-Control": "no-store"})


@app.post("/api/key-concepts")
def key_concepts(body: PhotoRequest):
    path = find_photo(body.photo_id)
    try:
        return {"concepts": get_key_concepts(path)}
    except EmptyResponseError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except google.genai.errors.ServerError:
        raise HTTPException(status_code=503, detail=BUSY_MESSAGE)
    except google.genai.errors.APIError as e:
        raise HTTPException(status_code=502, detail=f"Gemini error: {e.message}")


@app.post("/api/quizzes")
def quizzes(body: QuizRequest):
    path = find_photo(body.photo_id)
    try:
        concepts, quiz = get_quizzes(path, body.concepts)
    except EmptyResponseError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except google.genai.errors.ServerError:
        raise HTTPException(status_code=503, detail=BUSY_MESSAGE)
    except google.genai.errors.APIError as e:
        raise HTTPException(status_code=502, detail=f"Gemini error: {e.message}")
    return {"concepts": concepts, "quizzes": quiz}
