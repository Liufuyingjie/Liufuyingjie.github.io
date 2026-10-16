import { getAllPapers } from "../data/papers";
import NotesExplorer from "./notes-explorer";
import { plainText } from "../shared/note-format";
export default function NotesSection({ mode = "home" }: { mode?: "home" | "tags" | "search" }) {
  const items = getAllPapers().map(p => ({
    slug: p.slug, title: p.title, subtitle: p.subtitle, summary: p.summary,
    date: p.date, createdAt: p.createdAt, kind: p.kind, readingStatus: p.readingStatus,
    tags: p.tags, readMinutes: p.readMinutes, venue: p.meta.find(m => m.label === "发表期刊")?.value || "",
    searchText: `${p.body} ${plainText(p.body)} ${p.meta.map(m => m.value).join(" ")}`,
  }));
  return <NotesExplorer items={items} mode={mode}/>;
}
