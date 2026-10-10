"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
type Entry = { slug: string; title: string; subtitle: string; kind: "paper" | "journal"; year: string; date: string };
export default function ArchiveList({ items }: { items: Entry[] }) {
  const [kind, setKind] = useState("all");
  useEffect(() => { const value = new URLSearchParams(window.location.search).get("kind"); if (value === "paper" || value === "journal") setKind(value); }, []);
  const visible = items.filter(i => kind === "all" || i.kind === kind);
  const years = [...new Set(visible.map(i => i.year))].sort((a, b) => b.localeCompare(a));
  return <section className="archives-section"><div className="list-toolbar"><div className="list-tabs">{[["all", "全部记录"], ["paper", "论文笔记"], ["journal", "研究随记"]].map(([v, label]) => <button type="button" key={v} className={kind === v ? "selected" : ""} aria-pressed={kind === v} onClick={() => setKind(v)}>{label}</button>)}</div><span className="quiet-count">{visible.length} 篇</span></div><p className="archive-description">旧论文按原有论文年份归档；新笔记按记录日期归档。</p>{years.map(year => <section className="archive-year" key={year}><h2>{year}<span>{visible.filter(i => i.year === year).length} 篇</span></h2><div className="archive-entries">{visible.filter(i => i.year === year).map(i => <Link href={`/papers/${i.slug}/`} className="archive-entry" key={i.slug}><span className="archive-dot"/><div><h3>{i.title}</h3>{i.subtitle && <p>{i.subtitle}</p>}<span className="archive-entry-type">{i.kind === "paper" ? "论文笔记" : "研究随记"}</span></div><span className="archive-arrow">↗</span></Link>)}</div></section>)}{!visible.length && <div className="list-empty"><div className="empty-symbol">✎</div><h2>第一篇随记，还在酝酿中。</h2><p>原来的论文记录已全部保留，新的自由随记可以从这里开始。</p><Link href="/new/" className="text-link">写下第一个想法 →</Link></div>}</section>;
}
