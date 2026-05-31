import { storage } from "@/src/utils/storage";

export type HistoryItem = {
  id: string;
  type: "explain" | "summarize" | "quiz" | "flashcards";
  title: string;
  content?: string;
  questions?: any[];
  cards?: any[];
  created_at: string;
};

export type Exam = {
  id: string;
  name: string;
  date: string; // ISO date
  color: string;
};

const HISTORY_KEY = "sm.history";
const EXAMS_KEY = "sm.exams";

export async function getHistory(): Promise<HistoryItem[]> {
  const raw = await storage.getItem<string>(HISTORY_KEY, "[]");
  try {
    return JSON.parse(raw ?? "[]") as HistoryItem[];
  } catch {
    return [];
  }
}

export async function addHistory(item: HistoryItem): Promise<void> {
  const list = await getHistory();
  list.unshift(item);
  await storage.setItem(HISTORY_KEY, JSON.stringify(list.slice(0, 50)));
}

export async function removeHistory(id: string): Promise<void> {
  const list = await getHistory();
  await storage.setItem(
    HISTORY_KEY,
    JSON.stringify(list.filter((x) => x.id !== id)),
  );
}

export async function getExams(): Promise<Exam[]> {
  const raw = await storage.getItem<string>(EXAMS_KEY, "[]");
  try {
    return JSON.parse(raw ?? "[]") as Exam[];
  } catch {
    return [];
  }
}

export async function addExam(exam: Exam): Promise<void> {
  const list = await getExams();
  list.push(exam);
  list.sort((a, b) => a.date.localeCompare(b.date));
  await storage.setItem(EXAMS_KEY, JSON.stringify(list));
}

export async function removeExam(id: string): Promise<void> {
  const list = await getExams();
  await storage.setItem(EXAMS_KEY, JSON.stringify(list.filter((x) => x.id !== id)));
}

export function daysUntil(dateISO: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateISO);
  target.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}
