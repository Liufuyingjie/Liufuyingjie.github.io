import type { Paper } from "../data/papers";

export const LOCAL_PAPERS_KEY = "yingjie-paper-notes-v1";

export function readLocalPapers(): Paper[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(LOCAL_PAPERS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function writeLocalPapers(papers: Paper[]) {
  window.localStorage.setItem(LOCAL_PAPERS_KEY, JSON.stringify(papers));
}

export function appendLocalPaper(paper: Paper) {
  const existing = readLocalPapers();
  writeLocalPapers([paper, ...existing]);
}

export function splitParagraphs(value: string) {
  return value
    .split(/\n\s*\n/g)
    .map((part) => part.trim())
    .filter(Boolean);
}
