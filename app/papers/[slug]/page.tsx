import Link from "next/link";
import { notFound } from "next/navigation";
import ThemeToggle from "../../../components/theme-toggle";
import { getPaper, papers } from "../../../data/papers";
import { site } from "../../../data/site";


export function generateStaticParams() {
  return papers.map((paper) => ({ slug: paper.slug }));
}

export const dynamicParams = false;

export default async function PaperPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const paper = getPaper(slug);

  if (!paper) {
    notFound();
  }

  return (
    <main className="paper-page">
      <nav className="site-nav">
        <a className="brand" href={site.githubUrl} target="_blank" rel="noreferrer" aria-label="Open YingJie GitHub">
          <span>{site.name}</span>
          <span className="brand-arrow" aria-hidden="true">↗</span>
        </a>
        <div className="nav-links">
          <Link href="/">返回首页</Link>
          <ThemeToggle />
        </div>
      </nav>

      <article className="paper-shell">
        <header className="paper-header reveal">
          <div className="paper-header-topline">
            <p className="kicker">{paper.eyebrow}</p>
            <span className="paper-index">01 / NOTE</span>
          </div>
          <h1>{paper.title}</h1>
          <p className="paper-subtitle">{paper.subtitle}</p>
          <div className="paper-header-meta">
            <span>{paper.date}</span>
            <span>·</span>
            <span>阅读笔记</span>
          </div>
        </header>

        <div className="paper-divider" />

        <section className="paper-section reveal">
          <div className="section-number">01</div>
          <div className="section-content">
            <p className="section-label">PAPER BASICS</p>
            <h2>论文基础信息</h2>
            <div className="info-table">
              {paper.meta.map((item) => (
                <div className="info-row" key={item.label}>
                  <span>{item.label}</span>
                  <strong>{item.value}</strong>
                </div>
              ))}
            </div>
          </div>
        </section>

        {paper.sections.map((section) => (
          <section className="paper-section reveal" key={section.number}>
            <div className="section-number">{section.number}</div>
            <div className="section-content">
              <p className="section-label">RESEARCH NOTE</p>
              <h2>{section.title}</h2>
              <div className="section-body">
                {section.content.map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ))}
              </div>
            </div>
          </section>
        ))}

        <div className="paper-end-card reveal">
          <span>END OF NOTE</span>
          <p>一篇论文，到这里先留下一个清晰的理解。</p>
          <Link href="/">← 回到论文记录</Link>
        </div>
      </article>

      <footer className="site-footer shell">
        <span>{site.name} · Research Notes</span>
        <span>{paper.title}</span>
      </footer>
    </main>
  );
}
