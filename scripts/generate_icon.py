"""One-shot generator for the StudyMateAI app icon."""
import asyncio
import base64
import os
import sys
from pathlib import Path

from dotenv import load_dotenv
from emergentintegrations.llm.chat import LlmChat, UserMessage

ROOT = Path(__file__).resolve().parents[1]
load_dotenv(ROOT / "backend" / ".env")

PROMPT = (
    "A bold, neo-brutalist mobile app icon for a study assistant called "
    "'StudyMateAI'. Square 1:1 composition with thick 8px solid black border. "
    "Centered illustration: a glowing colorful brain (pastel pink, mint green, "
    "lavender, sunny yellow gradient) sitting on a small stack of three books "
    "(peach, blue, lavender colored book spines). Above the brain, two small "
    "shiny stars/sparkles. Pastel mint-green background (#C4F1DE). "
    "Hard black drop-shadow under the books. Flat illustration style, no text, "
    "no logo, no letters. Cute, playful, modern Gen-Z aesthetic. "
    "Clean edges, suitable for an iOS/Android app icon, designed to look great "
    "even when rounded. High contrast, vibrant, instantly recognizable."
)


async def main() -> int:
    api_key = os.getenv("EMERGENT_LLM_KEY")
    if not api_key:
        print("EMERGENT_LLM_KEY missing", file=sys.stderr)
        return 1

    chat = LlmChat(
        api_key=api_key,
        session_id="studymate-icon-gen",
        system_message="You are an expert mobile app icon designer.",
    )
    chat.with_model("gemini", "gemini-3.1-flash-image-preview").with_params(
        modalities=["image", "text"]
    )

    msg = UserMessage(text=PROMPT)
    text, images = await chat.send_message_multimodal_response(msg)
    print("Model text:", (text or "")[:120])
    if not images:
        print("No images returned", file=sys.stderr)
        return 2

    out_dir = ROOT / "frontend" / "assets" / "images"
    out_dir.mkdir(parents=True, exist_ok=True)
    saved = []
    for i, img in enumerate(images):
        data = base64.b64decode(img["data"])
        name = "icon.png" if i == 0 else f"icon_alt_{i}.png"
        path = out_dir / name
        path.write_bytes(data)
        saved.append(str(path))
    print("Saved:", saved)
    return 0


if __name__ == "__main__":
    sys.exit(asyncio.run(main()))
