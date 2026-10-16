import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import SiteNav from "../../components/site-nav";
import Masthead from "../../components/masthead";
import Sidebar from "../../components/sidebar";
import SiteFooter from "../../components/site-footer";
import { site } from "../../data/site";
export const metadata: Metadata = { title: "关于我" };
export default function AboutPage() {
  return <><SiteNav overlay/><Masthead title="你好，我是 YingJie" subtitle="计算机视觉，图像检索，以及一点好奇心。"/><main className="blog-layout shell" id="main-content"><article className="about-content markdown-body"><div className="about-profile"><Image src="/images/avatar.webp" width={104} height={104} alt="YingJie 的 GitHub 头像"/><div><p className="eyebrow">ABOUT ME</p><h2>{site.name}</h2><p>计算机专业研究生 · 计算机视觉 / 图像检索</p></div></div><h2>理解，而不是收藏。</h2><p>这个网站，是我的论文阅读记录，也是一本个人研究笔记。</p><p>我想留下的不是一串论文标题，而是阅读时真正理解下来的东西：论文在解决什么问题，方法为什么有效，实验说明了什么，以及还有哪些地方值得继续追问。</p><blockquote>把论文拆开，再重新理解一遍。</blockquote><h2>我在关注什么</h2><ul><li>细粒度图像检索与局部表征</li><li>Vision Foundation Models</li><li>Patch Tokens、模型适配与高效检索</li></ul><h2>这本笔记怎么写</h2><p><strong>论文笔记</strong>整理问题、方法、流程、证据与局限；<strong>研究随记</strong>留给专题梳理、实验中的疑问，或一个还没完全想清楚的想法。</p><p>它们不一定完整，但希望每一篇都比“收藏了”多一点自己的理解。</p><div className="about-links"><Link href="/archives/">浏览所有笔记 →</Link><a href={site.githubUrl} target="_blank" rel="noreferrer">在 GitHub 找到我 ↗</a></div></article><Sidebar/></main><SiteFooter/></>;
}
