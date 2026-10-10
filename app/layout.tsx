import type { Metadata } from "next";
import { site } from "../data/site";
import "./globals.css";
export const metadata: Metadata = {
  metadataBase: new URL(site.homepageUrl),
  title: { default: `${site.name} · 理解，而不是收藏。`, template: `%s · ${site.name}` },
  description: site.description,
  icons: { icon: "/favicon.svg" },
  alternates: { types: { "application/rss+xml": "/feed.xml" } },
};
const themeScript = `try{var t=localStorage.getItem('paper-notes-theme');document.documentElement.dataset.theme=t==='dark'?'dark':'light';}catch(e){document.documentElement.dataset.theme='light';}`;
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="zh-CN" suppressHydrationWarning><head><script dangerouslySetInnerHTML={{ __html: themeScript }}/></head><body><a href="#main-content" className="skip-link">跳到主要内容</a>{children}</body></html>;
}
