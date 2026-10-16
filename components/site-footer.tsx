import Link from "next/link";
import { site } from "../data/site";
import Icon from "./icons";
export default function SiteFooter() {
  return <footer className="site-footer"><div className="footer-shell"><div><Link href="/" className="footer-brand">{site.name}<span>.</span></Link><p>{site.tagline}</p></div><div className="footer-right"><a href={site.githubUrl} target="_blank" rel="noreferrer" aria-label="GitHub"><Icon name="github"/></a><a href="/feed.xml" aria-label="RSS 订阅" className="rss-mark">RSS</a><p>© {new Date().getFullYear()} {site.name} · Research Notes</p></div></div></footer>;
}
