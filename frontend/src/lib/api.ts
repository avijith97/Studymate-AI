// Centralized API client for Study Matrai
const BASE_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

async function request<T>(path: string, body: any): Promise<T> {
  const res = await fetch(`${BASE_URL}/api${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Request failed (${res.status})`);
  }
  return res.json();
}

export type ExplainResponse = {
  id: string;
  type: "explain";
  title: string;
  content: string;
  created_at: string;
};

export type SummarizeResponse = {
  id: string;
  type: "summarize";
  title: string;
  content: string;
  created_at: string;
};

export type QuizQuestion = {
  question: string;
  options: string[];
  correct_index: number;
  explanation: string;
};

export type QuizResponse = {
  id: string;
  type: "quiz";
  title: string;
  questions: QuizQuestion[];
  created_at: string;
};

export type Flashcard = { front: string; back: string };

export type FlashcardsResponse = {
  id: string;
  type: "flashcards";
  title: string;
  cards: Flashcard[];
  created_at: string;
};

export type Payload = {
  topic?: string;
  text?: string;
  image_base64?: string;
  pdf_base64?: string;
};

export const api = {
  explain: (p: Payload & { level?: string }) =>
    request<ExplainResponse>("/explain", p),
  summarize: (p: Payload) => request<SummarizeResponse>("/summarize", p),
  quiz: (p: Payload & { num_questions?: number }) =>
    request<QuizResponse>("/quiz", p),
  flashcards: (p: Payload & { num_cards?: number }) =>
    request<FlashcardsResponse>("/flashcards", p),
};
