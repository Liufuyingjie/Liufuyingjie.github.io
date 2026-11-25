import { site } from "../data/site";

export const NOTE_SESSION_KEY = "yingjie-research-session";

export function canUseNotesApi(origin: string) {
  return origin === new URL(site.homepageUrl).origin || origin === "http://localhost:3000";
}

export function clearNoteSession(token: string) {
  try {
    if (localStorage.getItem(NOTE_SESSION_KEY) === token) localStorage.removeItem(NOTE_SESSION_KEY);
  } catch {}
}
