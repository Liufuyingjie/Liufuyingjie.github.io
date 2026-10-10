import type { Metadata } from "next";
import SiteNav from "../../components/site-nav";
import Masthead from "../../components/masthead";
import Sidebar from "../../components/sidebar";
import SiteFooter from "../../components/site-footer";
import ArchiveList from "../../components/archive-list";
import { getAllPapers, archiveYear } from "../../data/papers";
export const metadata: Metadata = { title: "笔记归档" };
export default function ArchivesPage() {
  const items = getAllPapers().map(p => ({ slug: p.slug, title: p.title, subtitle: p.subtitle, kind: p.kind, year: archiveYear(p), date: p.date }));
  return <><SiteNav overlay/><Masthead title="一点点，积累起来" subtitle="读过的论文，走过的思路，都在这里。"/><main className="blog-layout shell" id="main-content"><ArchiveList items={items}/><Sidebar/></main><SiteFooter/></>;
}
