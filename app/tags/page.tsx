import type { Metadata } from "next";
import SiteNav from "../../components/site-nav";
import Masthead from "../../components/masthead";
import NotesSection from "../../components/notes-section";
import Sidebar from "../../components/sidebar";
import SiteFooter from "../../components/site-footer";
export const metadata: Metadata = { title: "主题标签" };
export default function TagsPage() { return <><SiteNav overlay/><Masthead title="主题标签" subtitle="沿着一个主题，把零散的理解连起来。"/><main className="blog-layout shell" id="main-content"><NotesSection mode="tags"/><Sidebar/></main><SiteFooter/></>; }
