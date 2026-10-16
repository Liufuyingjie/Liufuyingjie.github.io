import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import SiteNav from "../../../components/site-nav";
import SiteFooter from "../../../components/site-footer";
import EditPaperButton from "../../../components/edit-paper-button";
import ArticleToc from "../../../components/article-toc";
import { getPaper, getAllPapers } from "../../../data/papers";
import { renderMarkdown } from "../../../lib/markdown";
export function generateStaticParams() { return getAllPapers().map(paper => ({ slug: paper.slug })); }
export const dynamicParams = false;
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const paper = getPaper((await params).slug);
  return { title: paper?.title || "笔记未找到", description: paper?.summary, alternates: { canonical: `/papers/${paper?.slug}/` } };
}
function safeUrl(value: string) { try { const u = new URL(value.replace(/\s+/g, "")); return ["http:", "https:"].includes(u.protocol) ? u.toString() : ""; } catch { return ""; } }
export default async function PaperPage({ params }: { params: Promise<{ slug: string }> }) {
  const paper = getPaper((await params).slug);
  if (!paper) notFound();
  const { html, headings } = renderMarkdown(paper.body);
  const all = getAllPapers();
  const index = all.findIndex(p => p.slug === paper.slug);
  const before = all[index - 1]; const after = all[index + 1];
  const links = paper.meta.filter(m => ["论文链接", "开源代码"].includes(m.label) && safeUrl(m.value));
  return <><SiteNav overlay/><header className="masthead article-masthead"><div className="masthead-shade"/><div className="article-hero-copy shell"><div className="article-hero-label">{paper.kind === "paper" ? "PAPER NOTE" : "RESEARCH JOURNAL"}</div><h1>{paper.title}</h1>{paper.subtitle && <p className="article-hero-subtitle">{paper.subtitle}</p>}<div className="article-hero-meta"><span>{paper.kind === "paper" ? `${paper.date} 年论文` : paper.createdAt.slice(0, 10)}</span><i>·</i><span>{paper.readingStatus}</span><i>·</i><span>约 {paper.readMinutes} 分钟</span></div></div><svg className="masthead-waves" viewBox="0 0 1440 55" preserveAspectRatio="none" aria-hidden="true"><path d="M0 30C250 60 420 18 720 37S1180 60 1440 29V55H0Z" fill="var(--bg)"/></svg></header><main id="main-content" className="article-layout shell"><article className="article-content"><div className="article-topbar"><Link href="/">← 所有笔记</Link><EditPaperButton slug={paper.slug}/></div><div className="article-tags">{paper.tags.map(t => <Link className="tag" key={t} href={`/tags/?tag=${encodeURIComponent(t)}`}>{t}</Link>)}</div>{links.length > 0 && <div className="article-source-links">{links.map(m => <a key={m.label} href={safeUrl(m.value)} target="_blank" rel="noreferrer">{m.label} ↗</a>)}</div>}<div className="markdown-body article-markdown" dangerouslySetInnerHTML={{ __html: html }}/><div className="article-end"><p>理解，而不是收藏。</p><span>把论文留下来，也把自己的理解留下来。</span>{paper.updatedAt && <small>最近更新：{paper.updatedAt.slice(0, 10)}</small>}</div><nav className="adjacent-posts" aria-label="相邻笔记">{before ? <Link href={`/papers/${before.slug}/`}><span>← 上一篇</span><strong>{before.title}</strong></Link> : <span/>}{after ? <Link href={`/papers/${after.slug}/`}><span>下一篇 →</span><strong>{after.title}</strong></Link> : <span/>}</nav></article><aside className="article-sidebar"><ArticleToc headings={headings}/><div className="article-sidebar-note"><p>问题 → 方法 → 证据</p><span>读完，试着用自己的话讲一遍。</span><Link href="/new/">记录一个新理解 →</Link></div></aside></main><SiteFooter/></>;
}
