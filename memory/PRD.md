# Study Matrai — Product Requirements

## Overview
**Study Matrai** is an AI-powered, no-login study assistant for students. Open the app and start studying instantly — explain a concept, summarize a chapter, generate a quiz, build flashcards, and track exam countdowns.

## Goals
- Zero-friction onboarding: no accounts, no sign-up.
- Multimodal AI: accept topic, free text, photo of notes, or PDF.
- Fast, mobile-first study workflows powered by Gemini 3 Flash.

## Features (MVP)
1. **Home dashboard** with quick action tiles (Explain, Summarize, Quiz, Flashcards).
2. **Explain a Concept** — topic or paste content → AI markdown explanation.
3. **Summarize** — text / image / PDF → TL;DR + bullet key points.
4. **Quiz Me** — topic or source → 3/5/7/10 multiple-choice questions with explanations + score screen.
5. **Flashcards** — topic or source → 5/8/10/15 atomic cards with tap-to-flip animation.
6. **Exam Countdown** — add upcoming exams and see days remaining.
7. **History** — locally stored past sessions (long-press to delete, tap to revisit).

## Tech Stack
- **Frontend**: Expo (SDK 54) + Expo Router (tabs + stack), React Native, Reanimated for flip animation, neo-brutalist design with Outfit + Figtree Google Fonts.
- **Backend**: FastAPI + MongoDB (motor) with endpoints under `/api`.
- **AI**: Gemini 3 Flash via `emergentintegrations` library and `EMERGENT_LLM_KEY` (model: `gemini-3-flash-preview`).
- **Local Storage**: `@/src/utils/storage` (AsyncStorage wrapper) for exams + history.

## API
- `POST /api/explain` `{topic?, text?, image_base64?, pdf_base64?, level?}` → `{id, type, title, content, created_at}`
- `POST /api/summarize` `{text?, image_base64?, pdf_base64?}` → `{id, type, title, content, created_at}`
- `POST /api/quiz` `{topic?, text?, image_base64?, pdf_base64?, num_questions}` → `{id, questions:[{question, options[4], correct_index, explanation}], ...}`
- `POST /api/flashcards` `{topic?, text?, image_base64?, pdf_base64?, num_cards}` → `{id, cards:[{front, back}], ...}`
- `GET /api/history?limit=50` → list
- `DELETE /api/history/{id}` → `{deleted}`

## Non-Goals (for now)
- Accounts / cloud sync of history.
- Push notifications.
- Collaborative study rooms.

## Design
Neo-brutalist Gen-Z aesthetic — pastel surfaces, 3px black borders, hard offset shadows, chunky Outfit headings. See `/app/design_guidelines.json`.
