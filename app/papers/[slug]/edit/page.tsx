import { notFound } from "next/navigation";
import SiteNav from "../../../../components/site-nav";
import Masthead from "../../../../components/masthead";
import SiteFooter from "../../../../components/site-footer";
import NewNoteForm from "../../../../components/new-note-form";
import { getAllPapers, getPaper } from "../../../../data/papers";
import { emptyNoteInput, type NoteInput } from "../../../../shared/note-format";
export function generateStaticParams() { return getAllPapers().map(paper => ({ slug: paper.slug })); }
export const dynamicParams = false;
export default async function EditPaperPage({ params }: { params: Promise<{ slug: string }> }) {
  const paper = getPaper((await params).slug); if (!paper) notFound();
  const value = (label: string) => paper.meta.find(m => m.label === label)?.value || "";
  const initialForm: NoteInput = { ...emptyNoteInput,
    title: paper.title, subtitle: paper.subtitle, summary: paper.summary, tags: paper.tags.join(", "),
    kind: paper.kind, template: paper.template, readingStatus: paper.readingStatus,
    journal: value("发表期刊"), year: value("发表年份 / 卷期"), authors: value("作者"), affiliation: value("单位"),
    paperUrl: value("论文链接"), code: value("开源代码"), task: value("核心任务"), model: value("模型名称"), body: paper.body,
  };
  return <><SiteNav overlay/><Masthead title="理解，也会更新" subtitle="保留原有文章链接，继续补上新的思考。"/><main className="writer-shell shell" id="main-content"><NewNoteForm key={paper.slug} existingMetadata={paper.metadata} mode="edit" slug={paper.slug} sourceSha={paper.contentSha} initialForm={initialForm}/></main><SiteFooter/></>;
}
