"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { papers as seedPapers, type Paper } from "../data/papers";
import { readLocalPapers } from "../lib/local-notes";

export default function NotesSection() {
  const [localPapers, setLocalPapers] = useState<Paper[]>([]);

  useEffect(() => {
    setLocalPapers(readLocalPapers());

    const sync = () => setLocalPapers(readLocalPapers());
    window.addEventListener("paper-notes-updated", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("paper-notes-updated", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const allPapers = useMemo(() => [...localPapers, ...seedPapers], [localPapers]);

  return (
    <section className="notes-section shell" id="notes">
      <div className="section-heading reveal">
        <div>
          <p className="kicker">SELECTED NOTES</p>
          <div className="notes-title-row">
            <h2>论文记录</h2>
            <Link className="add-note-button" href="/new/">
              <span className="add-note-icon" aria-hidden="true">＋</span>
              新增论文记录
            </Link>
          </div>
        </div>
        <span className="section-count">{String(allPapers.length).padStart(2, "0")} 篇</span>
      </div>

      <div className="paper-list">
        {allPapers.map((paper, index) => {
          const href = localPapers.some((item) => item.slug === paper.slug)
            ? `/papers/local/?slug=${encodeURIComponent(paper.slug)}`
            : `/papers/${paper.slug}/`;

          return (
            <Link
              className="paper-card reveal"
              style={{ animationDelay: `${index * 100 + 120}ms` }}
              href={href}
              key={paper.slug}
            >
              <span className="card-index">{String(index + 1).padStart(2, "0")}</span>
              <div className="card-main">
                <p className="card-eyebrow">{paper.eyebrow}</p>
                <h3>{paper.title}</h3>
                <p className="card-subtitle">{paper.subtitle}</p>
                <div className="card-meta">
                  <span>{paper.date}</span>
                  <span>·</span>
                  <span>阅读笔记</span>
                </div>
              </div>
              <span className="card-arrow" aria-hidden="true">↗</span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
