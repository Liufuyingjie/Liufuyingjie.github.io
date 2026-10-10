import type { Metadata } from "next";
import SiteNav from "../../components/site-nav";
import Masthead from "../../components/masthead";
import SiteFooter from "../../components/site-footer";
import NewNoteForm from "../../components/new-note-form";
export const metadata: Metadata = { title: "写笔记" };
export default function NewPaperPage() { return <><SiteNav overlay/><Masthead title="把理解，写下来" subtitle="一篇论文，一个问题，或一个还在生长的想法。"/><main className="writer-shell shell" id="main-content"><NewNoteForm/></main><SiteFooter/></>; }
