import Link from "next/link";
import Image from "next/image";
import Icon from "./icons";
import { site } from "../data/site";
import { getAllPapers, getTags } from "../data/papers";
export default function Sidebar() {
  const papers = getAllPapers();
  const tags = getTags();
  return <aside className="blog-sidebar" aria-label="博客信息">
    <section className="sidebar-section sidebar-note"><h2>这个小站</h2><p>论文里的问题、方法与证据，<br/>以及还没想明白的研究日常。</p><Link href="/new/" className="sidebar-write"><Icon name="pen" width="16" height="16"/>记下一个新想法<Icon name="arrow" width="16" height="16"/></Link></section>
    <section className="sidebar-section"><h2>关于我 <span>ABOUT</span></h2><Link href="/about/" className="avatar-link"><Image src="/images/avatar.webp" width={88} height={88} alt="YingJie 的 GitHub 头像" className="avatar"/></Link><h3 className="sidebar-name">{site.name}</h3><p>计算机专业研究生<br/>计算机视觉 · 图像检索</p><p className="sidebar-bio">把阅读过的论文，<br/>整理成自己的研究理解。</p><a href={site.githubUrl} className="sidebar-github" target="_blank" rel="noreferrer"><Icon name="github" width="18" height="18"/><span>GitHub</span><span>↗</span></a></section>
    <section className="sidebar-section"><h2>笔记统计 <span>NOTEBOOK</span></h2><div className="sidebar-stats"><Link href="/archives/"><strong>{papers.length}</strong><span>篇记录</span></Link><Link href="/tags/"><strong>{tags.length}</strong><span>个主题</span></Link><Link href="/archives/?kind=journal"><strong>{papers.filter(p => p.kind === "journal").length}</strong><span>篇随记</span></Link></div></section>
    <section className="sidebar-section"><h2>主题标签 <span>TOPICS</span></h2><div className="tag-cloud">{tags.map(tag => <Link className="tag" href={`/tags/?tag=${encodeURIComponent(tag.name)}`} key={tag.name}>{tag.name}<span>{tag.count}</span></Link>)}</div></section>
    <section className="sidebar-section"><h2>阅读方向 <span>FOCUS</span></h2><ul className="focus-list"><li>细粒度图像检索</li><li>Vision Foundation Models</li><li>Patch 与局部表征</li></ul></section>
    <section className="sidebar-section sidebar-quote"><span>“</span><p>把论文拆开，<br/>再重新理解一遍。</p><Link href="/about/">关于这本笔记 →</Link></section>
  </aside>;
}
