import type { Metadata } from "next";
import NewNoteForm from "../../components/new-note-form";
import NoteWriterLayout from "../../components/note-writer-layout";

export const metadata: Metadata = { title: "写笔记" };

export default function NewPaperPage() {
  return <NoteWriterLayout><NewNoteForm/></NoteWriterLayout>;
}
