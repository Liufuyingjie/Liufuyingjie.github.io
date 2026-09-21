import Link from "next/link";
import { notFound } from "next/navigation";
import { Marked } from "marked";
import ThemeToggle from "../../../components/theme-toggle";
import EditPaperButton from "../../../components/edit-paper-button";
import { getPaper, getAllPapers } from "../../../data/papers";
import { site } from "../../../data/site";

export function generateStaticParams() {
  return getAllPapers().map((paper) => ({ slug: paper.slug }));
}

export const dynamicParams = false;

const markdown = new Marked({
  gfm: true,
  breaks: true,
});

function renderMarkdown(value: string) {
  return markdown.parse(value) as string;
}

export default async function PaperPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const paper = getPaper(slug);

  if (!paper) notFound();

  return (
    <main className="paper-page">
      <nav className="site-nav">
        <a className="brand" href={site.githubUrl} target="_blank" rel="noreferrer" aria-label="Open YingJie GitHub">
          <span>{site.name}</span>
          <span className="brand-arrow" aria-hidden="true">↗</span>
        </a>
        <div className="nav-links">
          <Link href="/#notes">返回论文记录</Link>
          <ThemeToggle />
        </div>
      </nav>

      <article className="paper-shell">
        <header className="paper-header reveal">
          <div className="paper-header-topline">
            <p className="kicker">{paper.eyebrow}</p>
            <span className="paper-index">{paper.date}</span>
          </div>
          <h1>{paper.title}</h1>
          {paper.subtitle && <p className="paper-subtitle">{paper.subtitle}</p>}
          <div className="paper-header-actions">
            <div className="paper-header-meta">
              <span>{paper.readingStatus}</span>
              <span>·</span>
              <span>{paper.date}</span>
            </div>
            <EditPaperButton slug={paper.slug} />
          </div>
        </header>

        <div className="paper-divider" />

        <section className="paper-section reveal">
          <div className="section-number">01</div>
          <div className="section-content">
            <p className="section-label">论文基础信息</p>
            <h2>论文基础信息</h2>
            <div className="info-table">
              {paper.meta.map((item) => (
                <div className="info-row" key={item.label}>
                  <span>{item.label}</span>
                  <div className="info-value">{item.value}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {paper.sections.map((section) => (
          <section className="paper-section reveal" key={section.number}>
            <div className="section-number">{section.number}</div>
            <div className="section-content">
              <p className="section-label">阅读笔记</p>
              <h2>{section.title}</h2>
              <div className="section-body markdown-body">
                {section.content ? (
                  <div dangerouslySetInnerHTML={{ __html: renderMarkdown(section.content) }} />
                ) : (
                  <p className="empty-copy">暂未填写。</p>
                )}
              </div>
            </div>
          </section>
        ))}

        <div className="paper-end-card reveal">
          <span>NOTE COMPLETE</span>
          <p>把论文留下来，也把自己的理解留下来。</p>
          <Link href="/#notes">← 回到论文记录</Link>
        </div>
      </article>

      <footer className="site-footer shell">
        <span>{site.name} · Research Notes</span>
        <span>{paper.title}</span>
      </footer>
    </main>
  );
}
