
import os
import re
import json
import base64
import logging
from contextlib import asynccontextmanager
from typing import Optional
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI, APIRouter, HTTPException, Request
from fastapi.responses import JSONResponse
from starlette.middleware.cors import CORSMiddleware
from starlette.concurrency import run_in_threadpool
from pydantic import BaseModel, Field
from google import genai
from google.genai import types

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("studymate")

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
GEMINI_MODEL = "gemini-flash-latest"

genai_client = (
    genai.Client(api_key=GEMINI_API_KEY, http_options=types.HttpOptions(timeout=90000))
    if GEMINI_API_KEY else None
)

MAX_FILE_SIZE = 10 * 1024 * 1024

class StudyRequest(BaseModel):
    topic: Optional[str] = None
    text: Optional[str] = None
    image_base64: Optional[str] = None
    pdf_base64: Optional[str] = None

class ExplainRequest(StudyRequest):
    level: Optional[str] = "student"

class QuizRequest(StudyRequest):
    num_questions: int = Field(default=5, ge=3, le=10)

class FlashcardsRequest(StudyRequest):
    num_cards: int = Field(default=8, ge=4, le=15)

class QuizItem(BaseModel):
    question: str
    options: list[str]
    correct_index: int
    explanation: str

class Flashcard(BaseModel):
    front: str
    back: str

def validate_input(req):
    if not any([
        getattr(req, "topic", None),
        getattr(req, "text", None),
        getattr(req, "image_base64", None),
        getattr(req, "pdf_base64", None),
    ]):
        raise HTTPException(status_code=400, detail="Please provide a topic, text, image, or PDF.")

    for value in [getattr(req, "image_base64", None), getattr(req, "pdf_base64", None)]:
        if value and len(value) > (MAX_FILE_SIZE * 4 // 3 + 1000):
            raise HTTPException(status_code=413, detail="File is too large. Maximum size is 10 MB.")

def build_parts(text, image_b64=None, pdf_b64=None):
    parts = [text or ""]

    for value, mime in [
        (pdf_b64, "application/pdf"),
        (image_b64, "image/jpeg"),
    ]:
        if value:
            try:
                decoded = base64.b64decode(value, validate=True)
                if len(decoded) > MAX_FILE_SIZE:
                    raise HTTPException(status_code=413, detail="File exceeds 10 MB.")
                parts.append(types.Part.from_bytes(data=decoded, mime_type=mime))
            except HTTPException:
                raise
            except Exception:
                raise HTTPException(status_code=400, detail="Invalid attached file.")

    return parts

def extract_json(text):
    cleaned = (text or "").strip()
    cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned)
    cleaned = re.sub(r"\s*```$", "", cleaned)

    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        match = re.search(r"(\[.*\]|\{.*\})", cleaned, re.DOTALL)
        if match:
            return json.loads(match.group(1))
        raise ValueError("Gemini returned invalid JSON.")

def sync_generate(system, user_text, image_b64=None, pdf_b64=None, json_mode=False):
    if not genai_client:
        raise HTTPException(status_code=503, detail="Gemini API key is not configured.")

    config = {"system_instruction": system}
    if json_mode:
        config["response_mime_type"] = "application/json"

    response = genai_client.models.generate_content(
        model=GEMINI_MODEL,
        contents=build_parts(user_text, image_b64, pdf_b64),
        config=types.GenerateContentConfig(**config),
    )

    if not response.text:
        raise ValueError("Gemini returned an empty response.")

    return response.text

async def ask_gemini(system, user_text, image_b64=None, pdf_b64=None, json_mode=False):
    try:
        return await run_in_threadpool(
            sync_generate, system, user_text, image_b64, pdf_b64, json_mode
        )
    except HTTPException:
        raise
    except Exception:
        logger.exception("Gemini request failed")
        raise HTTPException(
            status_code=502,
            detail="The AI service could not complete your request. Please try again."
        )

@asynccontextmanager
async def lifespan(app):
    logger.info("StudyMate AI backend starting")
    yield
    logger.info("StudyMate AI backend shutting down")

app = FastAPI(
    title="StudyMate AI API",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

router = APIRouter(prefix="/api")

@app.get("/")
async def root():
    return {"status": "online", "message": "StudyMate AI API is running"}

@app.get("/health")
async def health():
    return {
        "status": "healthy",
        "gemini_configured": genai_client is not None
    }

@router.post("/explain")
async def explain(req: ExplainRequest):
    validate_input(req)

    system = (
        "You are StudyMate AI, a friendly study assistant. "
        "Explain concepts clearly with simple language, examples, and a short recap."
    )
    user = (
        f"Topic: {req.topic or ''}\n"
        f"Content: {req.text or ''}\n"
        f"Audience level: {req.level or 'student'}\n"
        "Explain the provided content."
    )

    result = await ask_gemini(
        system, user, req.image_base64, req.pdf_base64
    )

    return {
        "id": __import__("uuid").uuid4().hex,
        "type": "explain",
        "title": req.topic or (req.text or "")[:60] or "From file",
        "content": result,
        "created_at": __import__("datetime").datetime.now(
            __import__("datetime").timezone.utc
        ).isoformat(),
    }

@router.post("/summarize")
async def summarize(req: StudyRequest):
    validate_input(req)

    system = (
        "You are StudyMate AI's summarizer. "
        "Provide a TL;DR, 5-8 key points, and why the content matters. "
        "Use readable Markdown."
    )

    result = await ask_gemini(
        system, req.text or "Summarize the attached content.",
        req.image_base64, req.pdf_base64
    )

    return {
        "id": __import__("uuid").uuid4().hex,
        "type": "summarize",
        "title": (req.text or "")[:60] or "Summary from file",
        "content": result,
        "created_at": __import__("datetime").datetime.now(
            __import__("datetime").timezone.utc
        ).isoformat(),
    }

@router.post("/quiz")
async def quiz(req: QuizRequest):
    validate_input(req)

    n = req.num_questions

    system = (
        "You are StudyMate AI's quiz generator. "
        "Return ONLY a valid JSON array. Each object must contain "
        "question, options (exactly four strings), correct_index (0-3), "
        "and explanation."
    )

    user = (
        f"Topic: {req.topic or ''}\n"
        f"Source content: {req.text or ''}\n"
        f"Generate exactly {n} multiple-choice questions."
    )

    raw = await ask_gemini(
        system, user, req.image_base64, req.pdf_base64, True
    )

    try:
        data = extract_json(raw)
        if not isinstance(data, list):
            raise ValueError("Expected a JSON array.")

        questions = []
        for item in data[:n]:
            q = QuizItem(**item)
            if len(q.options) == 4 and 0 <= q.correct_index <= 3:
                questions.append(q.model_dump())

        if not questions:
            raise ValueError("No valid questions returned.")

    except Exception:
        logger.exception("Quiz response parsing failed")
        raise HTTPException(
            status_code=502,
            detail="The AI returned an invalid quiz. Please try again."
        )

    return {
        "id": __import__("uuid").uuid4().hex,
        "type": "quiz",
        "title": req.topic or (req.text or "")[:60] or "Quiz from file",
        "questions": questions,
        "created_at": __import__("datetime").datetime.now(
            __import__("datetime").timezone.utc
        ).isoformat(),
    }

@router.post("/flashcards")
async def flashcards(req: FlashcardsRequest):
    validate_input(req)

    n = req.num_cards

    system = (
        "You are StudyMate AI's flashcard maker. "
        "Return ONLY a JSON array of objects containing front and back."
    )

    user = (
        f"Topic: {req.topic or ''}\n"
        f"Source content: {req.text or ''}\n"
        f"Generate exactly {n} useful study flashcards."
    )

    raw = await ask_gemini(
        system, user, req.image_base64, req.pdf_base64, True
    )

    try:
        data = extract_json(raw)
        if not isinstance(data, list):
            raise ValueError("Expected a JSON array.")

        cards = []
        for item in data[:n]:
            card = Flashcard(**item)
            if card.front and card.back:
                cards.append(card.model_dump())

        if not cards:
            raise ValueError("No valid flashcards returned.")

    except Exception:
        logger.exception("Flashcard parsing failed")
        raise HTTPException(
            status_code=502,
            detail="The AI returned invalid flashcards. Please try again."
        )

    return {
        "id": __import__("uuid").uuid4().hex,
        "type": "flashcards",
        "title": req.topic or (req.text or "")[:60] or "Flashcards from file",
        "cards": cards,
        "created_at": __import__("datetime").datetime.now(
            __import__("datetime").timezone.utc
        ).isoformat(),
    }

app.include_router(router)



@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
