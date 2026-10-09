import os

import google
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel

from gemini_functions import EmptyResponseError, get_key_concepts, get_quizzes

PHOTO_PATH = "saved_photo.jpg"
ALLOWED_EXTENSIONS = (".jpg", ".jpeg", ".png")
BUSY_MESSAGE = "Sorry, the server is busy now. Please, try later"

app = FastAPI(title="Notes with AI")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class QuizRequest(BaseModel):
    concepts: str | None = None


def require_photo():
    if not os.path.exists(PHOTO_PATH):
        raise HTTPException(status_code=404, detail="Upload a photo of your notes first")


@app.post("/api/photo")
def upload_photo(file: UploadFile = File(...)):
    if not (file.filename or "").lower().endswith(ALLOWED_EXTENSIONS):
        raise HTTPException(status_code=400, detail="Only jpg, jpeg and png images are supported")
    with open(PHOTO_PATH, "wb") as f:
        f.write(file.file.read())
    return {"ok": True}


@app.get("/api/photo")
def get_photo():
    require_photo()
    return FileResponse(PHOTO_PATH, headers={"Cache-Control": "no-store"})


@app.post("/api/key-concepts")
def key_concepts():
    require_photo()
    try:
        return {"concepts": get_key_concepts()}
    except EmptyResponseError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except google.genai.errors.ServerError:
        raise HTTPException(status_code=503, detail=BUSY_MESSAGE)
    except google.genai.errors.APIError as e:
        raise HTTPException(status_code=502, detail=f"Gemini error: {e.message}")


@app.post("/api/quizzes")
def quizzes(body: QuizRequest):
    require_photo()
    try:
        concepts, quiz = get_quizzes(body.concepts)
    except EmptyResponseError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except google.genai.errors.ServerError:
        raise HTTPException(status_code=503, detail=BUSY_MESSAGE)
    except google.genai.errors.APIError as e:
        raise HTTPException(status_code=502, detail=f"Gemini error: {e.message}")
    return {"concepts": concepts, "quizzes": quiz}
