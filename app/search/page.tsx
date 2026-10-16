import type { Metadata } from "next";
import SiteNav from "../../components/site-nav";
import Masthead from "../../components/masthead";
import NotesSection from "../../components/notes-section";
import Sidebar from "../../components/sidebar";
import SiteFooter from "../../components/site-footer";
export const metadata: Metadata = { title: "搜索笔记" };
export default function SearchPage() { return <><SiteNav overlay/><Masthead title="找回一个想法" subtitle="搜索标题、正文与主题，重新遇见读过的论文。"/><main className="blog-layout shell" id="main-content"><NotesSection mode="search"/><Sidebar/></main><SiteFooter/></>; }
