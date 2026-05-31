from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import re
import json
import base64
import logging
import tempfile
import uuid
from pathlib import Path
from datetime import datetime, timezone
from typing import List, Optional
from pydantic import BaseModel, Field

from emergentintegrations.llm.chat import LlmChat, UserMessage, FileContentWithMimeType, ImageContent


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

EMERGENT_LLM_KEY = os.environ.get("EMERGENT_LLM_KEY", "")
GEMINI_MODEL = "gemini-3-flash-preview"

app = FastAPI(title="Study Matrai")
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


# ------------------------------------------------------------------
# Models
# ------------------------------------------------------------------
class ExplainRequest(BaseModel):
    topic: Optional[str] = None
    text: Optional[str] = None
    image_base64: Optional[str] = None  # JPEG/PNG bytes (base64-encoded)
    pdf_base64: Optional[str] = None    # PDF bytes (base64-encoded)
    level: Optional[str] = "student"     # student | beginner | advanced


class SummarizeRequest(BaseModel):
    text: Optional[str] = None
    image_base64: Optional[str] = None
    pdf_base64: Optional[str] = None


class QuizRequest(BaseModel):
    topic: Optional[str] = None
    text: Optional[str] = None
    image_base64: Optional[str] = None
    pdf_base64: Optional[str] = None
    num_questions: int = 5


class FlashcardsRequest(BaseModel):
    topic: Optional[str] = None
    text: Optional[str] = None
    image_base64: Optional[str] = None
    pdf_base64: Optional[str] = None
    num_cards: int = 8


class QuizItem(BaseModel):
    question: str
    options: List[str]
    correct_index: int
    explanation: str


class Flashcard(BaseModel):
    front: str
    back: str


# ------------------------------------------------------------------
# Helpers
# ------------------------------------------------------------------
def _extract_json(text: str):
    """Strip markdown fences and parse JSON. Tries to recover with regex if needed."""
    cleaned = text.strip()
    # Remove ```json ... ``` or ``` ... ``` fences
    cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned)
    cleaned = re.sub(r"\s*```\s*$", "", cleaned)
    try:
        return json.loads(cleaned)
    except Exception:
        # Try first {...} or [...] block
        match = re.search(r"(\[.*\]|\{.*\})", cleaned, flags=re.DOTALL)
        if match:
            return json.loads(match.group(1))
        raise


def _write_temp_file(data_b64: str, suffix: str) -> str:
    raw = base64.b64decode(data_b64)
    fd, path = tempfile.mkstemp(suffix=suffix)
    with os.fdopen(fd, "wb") as f:
        f.write(raw)
    return path


def _build_attachments(image_base64: Optional[str], pdf_base64: Optional[str]):
    """Return (file_contents_list, temp_paths_to_cleanup)."""
    files = []
    temp_paths = []
    if pdf_base64:
        p = _write_temp_file(pdf_base64, ".pdf")
        temp_paths.append(p)
        files.append(FileContentWithMimeType(file_path=p, mime_type="application/pdf"))
    if image_base64:
        p = _write_temp_file(image_base64, ".jpg")
        temp_paths.append(p)
        files.append(FileContentWithMimeType(file_path=p, mime_type="image/jpeg"))
    return files, temp_paths


def _cleanup(paths):
    for p in paths:
        try:
            os.remove(p)
        except Exception:
            pass


async def _ask_gemini(system_message: str, user_text: str, image_b64=None, pdf_b64=None) -> str:
    if not EMERGENT_LLM_KEY:
        raise HTTPException(status_code=500, detail="LLM key not configured")

    chat = LlmChat(
        api_key=EMERGENT_LLM_KEY,
        session_id=str(uuid.uuid4()),
        system_message=system_message,
    ).with_model("gemini", GEMINI_MODEL)

    files, temp_paths = _build_attachments(image_b64, pdf_b64)
    try:
        msg = UserMessage(text=user_text, file_contents=files if files else None)
        response = await chat.send_message(msg)
        return response
    finally:
        _cleanup(temp_paths)


# ------------------------------------------------------------------
# Routes
# ------------------------------------------------------------------
@api_router.get("/")
async def root():
    return {"message": "Study Matrai API is running"}


@api_router.post("/explain")
async def explain_concept(req: ExplainRequest):
    system = (
        "You are Study Matrai, a friendly study assistant for students. "
        "Explain concepts clearly with simple language, real-world analogies, and structure. "
        "Use short paragraphs, bullet points for key ideas, and a quick recap at the end. "
        "If an image or PDF is provided, base the explanation on its content."
    )
    parts = []
    if req.topic:
        parts.append(f"Topic: {req.topic}")
    if req.text:
        parts.append(f"Content to explain:\n{req.text}")
    if not parts and not (req.image_base64 or req.pdf_base64):
        raise HTTPException(status_code=400, detail="Provide topic, text, image, or pdf")
    parts.append(f"Audience level: {req.level or 'student'}")
    parts.append("Return a clear explanation in markdown.")

    try:
        explanation = await _ask_gemini("\n\n".join([system]), "\n\n".join(parts),
                                        req.image_base64, req.pdf_base64)
    except Exception as e:
        logger.exception("explain failed")
        raise HTTPException(status_code=500, detail=f"AI error: {e}")

    record = {
        "id": str(uuid.uuid4()),
        "type": "explain",
        "title": (req.topic or (req.text or "")[:60] or "From file"),
        "content": explanation,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.history.insert_one(record.copy())
    return record


@api_router.post("/summarize")
async def summarize_content(req: SummarizeRequest):
    if not (req.text or req.image_base64 or req.pdf_base64):
        raise HTTPException(status_code=400, detail="Provide text, image, or pdf")

    system = (
        "You are Study Matrai's summarizer. Produce a concise, scannable summary: "
        "1) a TL;DR sentence, 2) 5-8 bullet key points, 3) 'Why it matters' line. "
        "Use markdown. Bold the most important terms."
    )
    user = req.text or "Summarize the attached content."

    try:
        summary = await _ask_gemini(system, user, req.image_base64, req.pdf_base64)
    except Exception as e:
        logger.exception("summarize failed")
        raise HTTPException(status_code=500, detail=f"AI error: {e}")

    record = {
        "id": str(uuid.uuid4()),
        "type": "summarize",
        "title": (req.text or "")[:60] or "Summary from file",
        "content": summary,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.history.insert_one(record.copy())
    return record


@api_router.post("/quiz")
async def generate_quiz(req: QuizRequest):
    if not (req.topic or req.text or req.image_base64 or req.pdf_base64):
        raise HTTPException(status_code=400, detail="Provide topic, text, image, or pdf")

    n = max(3, min(req.num_questions or 5, 10))
    system = (
        "You are Study Matrai's quiz generator. Create multiple choice questions to test understanding. "
        "Return ONLY valid JSON, no markdown fences, no commentary. "
        "Format: a JSON array of objects with keys: question (string), options (array of 4 strings), "
        "correct_index (integer 0-3), explanation (short string)."
    )
    parts = []
    if req.topic:
        parts.append(f"Topic: {req.topic}")
    if req.text:
        parts.append(f"Source content:\n{req.text}")
    parts.append(f"Generate exactly {n} questions. Mix difficulty levels.")

    try:
        raw = await _ask_gemini(system, "\n\n".join(parts), req.image_base64, req.pdf_base64)
        data = _extract_json(raw)
        if not isinstance(data, list):
            raise ValueError("Expected JSON array")
        questions = []
        for item in data[:n]:
            try:
                q = QuizItem(**item)
                if len(q.options) == 4 and 0 <= q.correct_index <= 3:
                    questions.append(q.model_dump())
            except Exception:
                continue
        if not questions:
            raise ValueError("No valid questions parsed")
    except Exception as e:
        logger.exception("quiz failed")
        raise HTTPException(status_code=500, detail=f"AI error: {e}")

    record = {
        "id": str(uuid.uuid4()),
        "type": "quiz",
        "title": req.topic or (req.text or "")[:60] or "Quiz from file",
        "questions": questions,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.history.insert_one(record.copy())
    return record


@api_router.post("/flashcards")
async def generate_flashcards(req: FlashcardsRequest):
    if not (req.topic or req.text or req.image_base64 or req.pdf_base64):
        raise HTTPException(status_code=400, detail="Provide topic, text, image, or pdf")

    n = max(4, min(req.num_cards or 8, 15))
    system = (
        "You are Study Matrai's flashcard maker. Create clear, atomic flashcards. "
        "Return ONLY valid JSON, no markdown fences. "
        "Format: a JSON array of objects with keys: front (the term/question, short), "
        "back (concise definition with 1 mnemonic or example, max ~40 words)."
    )
    parts = []
    if req.topic:
        parts.append(f"Topic: {req.topic}")
    if req.text:
        parts.append(f"Source content:\n{req.text}")
    parts.append(f"Generate exactly {n} flashcards.")

    try:
        raw = await _ask_gemini(system, "\n\n".join(parts), req.image_base64, req.pdf_base64)
        data = _extract_json(raw)
        if not isinstance(data, list):
            raise ValueError("Expected JSON array")
        cards = []
        for item in data[:n]:
            try:
                c = Flashcard(**item)
                if c.front and c.back:
                    cards.append(c.model_dump())
            except Exception:
                continue
        if not cards:
            raise ValueError("No valid cards parsed")
    except Exception as e:
        logger.exception("flashcards failed")
        raise HTTPException(status_code=500, detail=f"AI error: {e}")

    record = {
        "id": str(uuid.uuid4()),
        "type": "flashcards",
        "title": req.topic or (req.text or "")[:60] or "Flashcards from file",
        "cards": cards,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.history.insert_one(record.copy())
    return record


@api_router.get("/history")
async def list_history(limit: int = 50):
    cursor = db.history.find({}, {"_id": 0}).sort("created_at", -1).limit(limit)
    items = await cursor.to_list(length=limit)
    return items


@api_router.delete("/history/{item_id}")
async def delete_history(item_id: str):
    res = await db.history.delete_one({"id": item_id})
    return {"deleted": res.deleted_count}


# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
