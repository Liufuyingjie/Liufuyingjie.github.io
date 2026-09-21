import Link from "next/link";
import { notFound } from "next/navigation";
import ThemeToggle from "../../../../components/theme-toggle";
import NewNoteForm, { PaperFormState } from "../../../../components/new-note-form";
import { getAllPapers, getPaper } from "../../../../data/papers";
import { site } from "../../../../data/site";

export function generateStaticParams() {
  return getAllPapers().map((paper) => ({ slug: paper.slug }));
}

export const dynamicParams = false;

function metaValue(paper: NonNullable<ReturnType<typeof getPaper>>, label: string) {
  return paper.meta.find((item) => item.label === label)?.value || "";
}

export default async function EditPaperPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const paper = getPaper(slug);

  if (!paper) notFound();

  const initialForm: PaperFormState = {
    title: paper.title,
    subtitle: paper.subtitle,
    journal: metaValue(paper, "发表期刊"),
    year: metaValue(paper, "发表年份 / 卷期"),
    authors: metaValue(paper, "作者"),
    affiliation: metaValue(paper, "单位"),
    code: metaValue(paper, "开源代码"),
    task: metaValue(paper, "核心任务"),
    model: metaValue(paper, "模型名称"),
    problem: paper.sections.find((section) => section.number === "02")?.content || "",
    solution: paper.sections.find((section) => section.number === "03")?.content || "",
    pipeline: paper.sections.find((section) => section.number === "04")?.content || "",
    innovations: paper.sections.find((section) => section.number === "05")?.content || "",
    experiments: paper.sections.find((section) => section.number === "06")?.content || "",
    extensions: paper.sections.find((section) => section.number === "07")?.content || "",
  };

  return (
    <main className="new-page">
      <nav className="site-nav">
        <a className="brand" href={site.githubUrl} target="_blank" rel="noreferrer" aria-label="Open YingJie GitHub">
          <span>{site.name}</span>
          <span className="brand-arrow" aria-hidden="true">↗</span>
        </a>
        <div className="nav-links">
          <Link href={`/papers/${paper.slug}/`}>返回论文</Link>
          <ThemeToggle />
        </div>
      </nav>

      <header className="new-page-header shell reveal">
        <p className="kicker">EDIT PAPER</p>
        <h1>修改论文记录</h1>
        <p>保持同样的阅读结构，只修改你真正想留下来的内容。</p>
      </header>

      <div className="shell">
        <NewNoteForm mode="edit" slug={paper.slug} initialForm={initialForm} />
      </div>
    </main>
  );
}
