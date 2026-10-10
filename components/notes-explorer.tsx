"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import Icon from "./icons";
type Item = { slug: string; title: string; subtitle: string; summary: string; date: string; createdAt: string; kind: "paper" | "journal"; readingStatus: string; tags: string[]; readMinutes: number; venue: string; searchText: string };
const PAGE_SIZE = 8;
export default function NotesExplorer({ items, mode = "home" }: { items: Item[]; mode?: "home" | "tags" | "search" }) {
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState("all");
  const [tag, setTag] = useState("");
  const [page, setPage] = useState(1);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setQuery(params.get("q") || "");
    setTag(params.get("tag") || "");
    if (["paper", "journal"].includes(params.get("kind") || "")) setKind(params.get("kind")!);
  }, []);
  const tags = useMemo(() => [...new Set(items.flatMap(p => p.tags))], [items]);
  const filtered = useMemo(() => {
    const words = query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
    return items.filter(p => (kind === "all" || p.kind === kind) && (!tag || p.tags.includes(tag)) && words.every(w => `${p.title} ${p.subtitle} ${p.summary} ${p.tags.join(" ")} ${p.searchText}`.toLocaleLowerCase().includes(w)));
  }, [items, query, kind, tag]);
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const activePage = Math.min(page, pages);
  const visible = filtered.slice((activePage - 1) * PAGE_SIZE, activePage * PAGE_SIZE);
  const changeTag = (value: string) => { setTag(value === tag ? "" : value); setPage(1); };
  function goToPage(value: number) { setPage(value); document.getElementById("notes")?.scrollIntoView({ behavior: "smooth", block: "start" }); }
  return <section className="notes-section" id="notes" aria-label="笔记列表">
    <div className="list-toolbar"><div className="list-tabs" role="group" aria-label="按记录类型筛选">{[["all", "全部记录"], ["paper", "论文笔记"], ["journal", "研究随记"]].map(([value, label]) => <button type="button" key={value} className={kind === value ? "selected" : ""} onClick={() => { setKind(value); setPage(1); }} aria-pressed={kind === value}>{label}{value === "all" && <span>{items.length}</span>}</button>)}</div><Link className="list-write" href="/new/" aria-label="写一篇新笔记"><Icon name="pen" width="16" height="16"/><span>写笔记</span></Link></div>
    {mode !== "home" && <div className="search-box"><Icon name="search"/><input type="search" aria-label="搜索笔记" placeholder="搜索标题、正文、模型或一个关键词…" value={query} onChange={e => { setQuery(e.target.value); setPage(1); }} autoFocus={mode === "search"}/>{query && <button type="button" className="icon-button" aria-label="清空搜索" onClick={() => setQuery("")}><Icon name="close" width="17" height="17"/></button>}</div>}
    {mode === "tags" && <div className="explorer-tags"><button className={`tag ${!tag ? "tag-active" : ""}`} onClick={() => { setTag(""); setPage(1); }}>所有主题</button>{tags.map(t => <button className={`tag ${tag === t ? "tag-active" : ""}`} onClick={() => changeTag(t)} key={t}>{t}<span>{items.filter(p => p.tags.includes(t)).length}</span></button>)}</div>}
    {(tag || query) && <div className="filter-status"><span>{tag ? `主题：${tag}` : `搜索：${query}`} · {filtered.length} 篇记录</span><button type="button" onClick={() => { setTag(""); setQuery(""); setPage(1); }}>清除筛选 <span>×</span></button></div>}
    <div className="paper-list">
      {visible.map(p => <article className="post-preview" key={p.slug}>
        <Link className="post-main-link" href={`/papers/${p.slug}/`}><h2>{p.title}</h2>{p.subtitle && <h3>{p.subtitle}</h3>}<p className="post-excerpt">{p.summary || "这是一篇还在慢慢整理的笔记，点击阅读全文。"}</p></Link>
        <div className="post-meta"><span className="post-kind">{p.kind === "paper" ? "论文笔记" : "研究随记"}</span>{p.kind === "paper" && p.date && <><i>·</i><span>{p.date.match(/(?:19|20)\d{2}/)?.[0] || p.date} 年论文</span></>}{p.kind === "journal" && p.createdAt && <><i>·</i><time dateTime={p.createdAt}>{p.createdAt.slice(0, 10)}</time></>}{p.venue && <><i>·</i><span>{p.venue}</span></>}<i>·</i><span>约 {p.readMinutes} 分钟</span></div>
        <div className="post-bottom"><div className="post-tags">{p.tags.map(t => <button type="button" className="tag" key={t} onClick={() => changeTag(t)}>{t}</button>)}</div><Link className="read-link" href={`/papers/${p.slug}/`}>阅读全文 <span>→</span></Link></div>
      </article>)}
    </div>
    {!filtered.length && <div className="list-empty"><div className="empty-symbol">{kind === "journal" ? "✎" : "⌕"}</div><h2>{kind === "journal" && !query && !tag ? "随记，留给下一个灵感。" : "没有找到这篇笔记"}</h2><p>{kind === "journal" && !query && !tag ? `已有的 ${items.filter(p => p.kind === "paper").length} 篇论文记录仍保留。可以用自由模板写下第一篇研究随记。` : "试试更短的关键词，或清除当前筛选。"}</p>{kind === "journal" && !query && !tag ? <Link className="text-link" href="/new/">写一篇研究随记 →</Link> : <button type="button" className="text-link" onClick={() => { setKind("all"); setQuery(""); setTag(""); }}>显示所有记录 →</button>}</div>}
    {pages > 1 ? <nav className="pagination" aria-label="笔记分页"><button disabled={activePage === 1} onClick={() => goToPage(activePage - 1)}>← 上一页</button><span>{activePage} / {pages}</span><button disabled={activePage === pages} onClick={() => goToPage(activePage + 1)}>下一页 →</button></nav> : !!filtered.length && <div className="list-end"><span>共 {filtered.length} 篇 · 慢慢读，慢慢理解。</span><Link href="/archives/">查看归档 →</Link></div>}
  </section>;
}
