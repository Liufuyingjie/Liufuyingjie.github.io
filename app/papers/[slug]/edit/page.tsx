import type { Metadata } from "next";
import { notFound } from "next/navigation";
import NewNoteForm from "../../../../components/new-note-form";
import NoteWriterLayout from "../../../../components/note-writer-layout";
import { getPaper, getPaperStaticParams } from "../../../../data/papers";
import { emptyNoteInput, parsePublicationDate, parseVenueType, type NoteInput } from "../../../../shared/note-format";
export function generateStaticParams() { return getPaperStaticParams(); }
export const dynamicParams = false;
export const metadata: Metadata = { title: "编辑笔记" };
export default async function EditPaperPage({ params }: { params: Promise<{ slug: string }> }) {
  const paper = getPaper((await params).slug); if (!paper) notFound();
  const value = (label: string) => paper.meta.find(m => m.label === label)?.value || "";
  const { summary, venueType, publicationDate, year, date } = paper.metadata;
  const legacyPublicationDate = paper.kind === "paper" ? parsePublicationDate(year) || date : "";
  const initialForm: NoteInput = { ...emptyNoteInput,
    title: paper.title, subtitle: paper.subtitle, summary: String(summary ?? ""), tags: paper.tags.join(", "),
    kind: paper.kind, template: paper.template, readingStatus: paper.readingStatus,
    venueType: parseVenueType(venueType),
    publicationDate: parsePublicationDate(publicationDate ?? legacyPublicationDate),
    journal: value("发表期刊"), year: value("发表年份 / 卷期"), authors: value("作者"), affiliation: value("单位"),
    paperUrl: value("论文链接"), code: value("开源代码"), task: value("核心任务"), model: value("模型名称"), body: paper.body,
  };
  return <NoteWriterLayout>
    <NewNoteForm key={paper.slug} existingMetadata={paper.metadata} mode="edit"
      slug={paper.slug} sourceSha={paper.contentSha} initialForm={initialForm}/>
  </NoteWriterLayout>;
}
