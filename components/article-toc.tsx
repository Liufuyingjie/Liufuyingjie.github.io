"use client";
import { useEffect, useState } from "react";
import type { Heading } from "../lib/markdown";
export default function ArticleToc({ headings }: { headings: Heading[] }) {
  const [active, setActive] = useState(headings[0]?.id || "");
  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      const shown = entries.filter(e => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
      if (shown.length) setActive(shown[0].target.id);
    }, { rootMargin: "-85px 0px -58% 0px", threshold: 0 });
    headings.forEach(h => { const el = document.getElementById(h.id); if (el) observer.observe(el); });
    return () => observer.disconnect();
  }, [headings]);
  if (!headings.length) return null;
  return <details className="article-toc" open><summary>这篇笔记 <span>CONTENTS</span></summary><ol>{headings.slice(0, 35).map(h => <li className={`${h.level > 2 ? "toc-nested" : ""} ${h.id === active ? "toc-active" : ""}`} key={h.id}><a href={`#${h.id}`} onClick={() => setActive(h.id)}>{h.text.replace(/^0\d\s+/, "")}</a></li>)}</ol></details>;
}
