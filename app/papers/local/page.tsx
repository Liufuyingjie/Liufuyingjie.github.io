"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import ThemeToggle from "../../../components/theme-toggle";
import type { Paper } from "../../../data/papers";
import { readLocalPapers } from "../../../lib/local-notes";
import { site } from "../../../data/site";

export default function LocalPaperPage() {
  const [paper, setPaper] = useState<Paper | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const slug = new URLSearchParams(window.location.search).get("slug");
    const found = readLocalPapers().find((item) => item.slug === slug) ?? null;
    setPaper(found);
    setReady(true);
  }, []);

  if (!ready) return <main />;
  if (!paper) {
    return (
      <main>
        <nav className="site-nav">
          <a className="brand" href={site.githubUrl} target="_blank" rel="noreferrer"><span>{site.name}</span><span className="brand-arrow">↗</span></a>
          <div className="nav-links"><Link href="/">返回首页</Link><ThemeToggle /></div>
        </nav>
        <div className="shell empty-note"><p className="kicker">NOTE NOT FOUND</p><h1>这篇记录不存在。</h1><Link className="primary-button" href="/#notes">回到论文记录</Link></div>
      </main>
    );
  }

  return (
    <main className="paper-page">
      <nav className="site-nav">
        <a className="brand" href={site.githubUrl} target="_blank" rel="noreferrer" aria-label="Open YingJie GitHub">
          <span>{site.name}</span><span className="brand-arrow">↗</span>
        </a>
        <div className="nav-links"><Link href="/#notes">返回论文记录</Link><ThemeToggle /></div>
      </nav>

      <article className="paper-shell">
        <header className="paper-header reveal">
          <div className="paper-header-topline">
            <p className="kicker">{paper.eyebrow}</p>
            <span className="paper-index">LOCAL NOTE</span>
          </div>
          <h1>{paper.title}</h1>
          {paper.subtitle && <p className="paper-subtitle">{paper.subtitle}</p>}
          <div className="paper-header-meta"><span>{paper.date}</span><span>·</span><span>阅读笔记</span></div>
        </header>

        <div className="paper-divider" />

        <section className="paper-section reveal">
          <div className="section-number">01</div>
          <div className="section-content">
            <p className="section-label">PAPER BASICS</p>
            <h2>论文基础信息</h2>
            <div className="info-table">
              {paper.meta.map((item) => (
                <div className="info-row" key={item.label}><span>{item.label}</span><strong>{item.value}</strong></div>
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
                {section.content.length ? section.content.map((paragraph, index) => <p key={index}>{paragraph}</p>) : <p className="empty-copy">暂未填写。</p>}
              </div>
            </div>
          </section>
        ))}

        <div className="paper-end-card reveal">
          <span>END OF NOTE</span>
          <p>一篇论文，到这里先留下一个清晰的理解。</p>
          <Link href="/#notes">← 回到论文记录</Link>
        </div>
      </article>
    </main>
  );
}
