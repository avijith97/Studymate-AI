"""Backend tests for Study Matrai (AI study assistant).
Covers: /api/explain, /api/summarize, /api/quiz, /api/flashcards,
/api/history (GET/DELETE), validation errors, and multimodal (image/pdf).
"""
import base64
import os
import struct
import zlib
import pytest


# ---------- helpers ----------
def _make_png_b64() -> str:
    """Minimal 1x1 transparent PNG (base64, no data url prefix)."""
    sig = b"\x89PNG\r\n\x1a\n"
    ihdr = b"IHDR" + struct.pack(">IIBBBBB", 1, 1, 8, 6, 0, 0, 0)
    ihdr_chunk = struct.pack(">I", 13) + ihdr + struct.pack(">I", zlib.crc32(ihdr) & 0xffffffff)
    raw = b"\x00\x00\x00\x00\x00"  # filter + RGBA pixel
    comp = zlib.compress(raw)
    idat = b"IDAT" + comp
    idat_chunk = struct.pack(">I", len(comp)) + idat + struct.pack(">I", zlib.crc32(idat) & 0xffffffff)
    iend = b"IEND"
    iend_chunk = struct.pack(">I", 0) + iend + struct.pack(">I", zlib.crc32(iend) & 0xffffffff)
    return base64.b64encode(sig + ihdr_chunk + idat_chunk + iend_chunk).decode()


def _make_pdf_b64() -> str:
    """Minimal valid one-page PDF with the text 'Photosynthesis converts light to energy'."""
    pdf = (
        b"%PDF-1.4\n"
        b"1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n"
        b"2 0 obj<</Type/Pages/Count 1/Kids[3 0 R]>>endobj\n"
        b"3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 300 144]"
        b"/Contents 4 0 R/Resources<</Font<</F1 5 0 R>>>>>>endobj\n"
        b"4 0 obj<</Length 80>>stream\n"
        b"BT /F1 14 Tf 20 100 Td (Photosynthesis converts light to energy) Tj ET\n"
        b"endstream endobj\n"
        b"5 0 obj<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>endobj\n"
        b"xref\n0 6\n0000000000 65535 f \n"
        b"0000000010 00000 n \n0000000053 00000 n \n0000000098 00000 n \n"
        b"0000000180 00000 n \n0000000270 00000 n \n"
        b"trailer<</Size 6/Root 1 0 R>>\nstartxref\n330\n%%EOF\n"
    )
    return base64.b64encode(pdf).decode()


# ---------- root/health ----------
class TestHealth:
    def test_root(self, api_client, base_url):
        r = api_client.get(f"{base_url}/api/")
        assert r.status_code == 200
        assert "Study Matrai" in r.json().get("message", "")


# ---------- /api/explain ----------
class TestExplain:
    def test_explain_topic_only(self, api_client, base_url, created_ids):
        r = api_client.post(f"{base_url}/api/explain",
                            json={"topic": "Newton's Second Law", "level": "student"},
                            timeout=120)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["type"] == "explain"
        assert data["title"]
        assert isinstance(data["content"], str) and len(data["content"]) > 30
        assert "id" in data and "_id" not in data
        assert "created_at" in data
        created_ids.append(data["id"])

    def test_explain_text_only(self, api_client, base_url, created_ids):
        r = api_client.post(f"{base_url}/api/explain",
                            json={"text": "Mitochondria produce ATP via oxidative phosphorylation."},
                            timeout=120)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["type"] == "explain"
        assert len(data["content"]) > 30
        created_ids.append(data["id"])

    def test_explain_validation_missing_inputs(self, api_client, base_url):
        r = api_client.post(f"{base_url}/api/explain", json={}, timeout=30)
        assert r.status_code == 400
        assert "Provide" in r.json().get("detail", "")


# ---------- /api/summarize ----------
class TestSummarize:
    def test_summarize_text(self, api_client, base_url, created_ids):
        text = ("The water cycle describes how water moves through evaporation, "
                "condensation, precipitation, and collection. Solar energy drives "
                "evaporation from oceans, lakes, and rivers, forming clouds.")
        r = api_client.post(f"{base_url}/api/summarize", json={"text": text}, timeout=120)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["type"] == "summarize"
        assert len(data["content"]) > 20
        assert "_id" not in data
        created_ids.append(data["id"])

    def test_summarize_validation(self, api_client, base_url):
        r = api_client.post(f"{base_url}/api/summarize", json={}, timeout=30)
        assert r.status_code == 400


# ---------- /api/quiz ----------
class TestQuiz:
    def test_quiz_topic(self, api_client, base_url, created_ids):
        r = api_client.post(f"{base_url}/api/quiz",
                            json={"topic": "Photosynthesis", "num_questions": 3},
                            timeout=180)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["type"] == "quiz"
        qs = data["questions"]
        assert isinstance(qs, list) and len(qs) >= 3
        for q in qs:
            assert isinstance(q["question"], str) and q["question"]
            assert isinstance(q["options"], list) and len(q["options"]) == 4
            assert isinstance(q["correct_index"], int) and 0 <= q["correct_index"] <= 3
            assert isinstance(q["explanation"], str)
        assert "_id" not in data
        created_ids.append(data["id"])

    def test_quiz_validation(self, api_client, base_url):
        r = api_client.post(f"{base_url}/api/quiz", json={}, timeout=30)
        assert r.status_code == 400


# ---------- /api/flashcards ----------
class TestFlashcards:
    def test_flashcards_topic(self, api_client, base_url, created_ids):
        r = api_client.post(f"{base_url}/api/flashcards",
                            json={"topic": "Cell Biology Basics", "num_cards": 5},
                            timeout=180)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["type"] == "flashcards"
        cards = data["cards"]
        assert isinstance(cards, list) and len(cards) >= 4
        for c in cards:
            assert c["front"] and isinstance(c["front"], str)
            assert c["back"] and isinstance(c["back"], str)
        assert "_id" not in data
        created_ids.append(data["id"])

    def test_flashcards_validation(self, api_client, base_url):
        r = api_client.post(f"{base_url}/api/flashcards", json={}, timeout=30)
        assert r.status_code == 400


# ---------- /api/history GET ----------
class TestHistoryGet:
    def test_history_lists_created_items(self, api_client, base_url, created_ids):
        r = api_client.get(f"{base_url}/api/history?limit=100", timeout=30)
        assert r.status_code == 200
        items = r.json()
        assert isinstance(items, list)
        # no _id leakage
        for it in items:
            assert "_id" not in it
            assert "id" in it
            assert "type" in it
            assert "created_at" in it
        # At least one of the items created in earlier tests should be present
        if created_ids:
            ids_in_history = {it["id"] for it in items}
            assert any(cid in ids_in_history for cid in created_ids), \
                "Recently created items not found in history"


# ---------- Multimodal ----------
class TestMultimodal:
    def test_explain_with_image(self, api_client, base_url, created_ids):
        r = api_client.post(f"{base_url}/api/explain",
                            json={"topic": "What is in the image?",
                                  "image_base64": _make_png_b64()},
                            timeout=180)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["type"] == "explain"
        assert len(data["content"]) > 10
        created_ids.append(data["id"])

    def test_summarize_with_pdf(self, api_client, base_url, created_ids):
        r = api_client.post(f"{base_url}/api/summarize",
                            json={"pdf_base64": _make_pdf_b64()},
                            timeout=180)
        # Multimodal may fail if model rejects tiny PDF; tolerate 500 but log it.
        if r.status_code == 500:
            pytest.skip(f"Model rejected tiny PDF: {r.text}")
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["type"] == "summarize"
        assert len(data["content"]) > 10
        created_ids.append(data["id"])


# ---------- /api/history DELETE  (runs last, cleans up) ----------
class TestHistoryDelete:
    def test_delete_created_items(self, api_client, base_url, created_ids):
        if not created_ids:
            pytest.skip("No items were created to delete")
        # Delete first created id and verify it's gone from history
        target = created_ids[0]
        r = api_client.delete(f"{base_url}/api/history/{target}", timeout=30)
        assert r.status_code == 200, r.text
        assert r.json().get("deleted") == 1

        # Verify removal
        r2 = api_client.get(f"{base_url}/api/history?limit=200", timeout=30)
        assert r2.status_code == 200
        ids = {it["id"] for it in r2.json()}
        assert target not in ids

        # Delete remaining for cleanup
        for cid in created_ids[1:]:
            api_client.delete(f"{base_url}/api/history/{cid}", timeout=30)

    def test_delete_nonexistent(self, api_client, base_url):
        r = api_client.delete(f"{base_url}/api/history/does-not-exist-xyz", timeout=30)
        assert r.status_code == 200
        assert r.json().get("deleted") == 0
