import Link from "next/link";
import ThemeToggle from "../../components/theme-toggle";
import NewNoteForm from "../../components/new-note-form";
import { site } from "../../data/site";

export default function NewPaperPage() {
  return (
    <main>
      <nav className="site-nav">
        <a className="brand" href={site.githubUrl} target="_blank" rel="noreferrer" aria-label="Open YingJie GitHub">
          <span>{site.name}</span>
          <span className="brand-arrow" aria-hidden="true">↗</span>
        </a>
        <div className="nav-links">
          <Link href="/#notes">论文记录</Link>
          <ThemeToggle />
        </div>
      </nav>

      <section className="new-note-hero shell">
        <div>
          <p className="kicker">NEW PAPER NOTE</p>
          <h1>新增论文记录</h1>
          <p>按照同一套结构，把你真正理解下来的内容留下来。</p>
        </div>
        <span className="new-note-count">01 — 07</span>
      </section>

      <div className="shell new-note-shell">
        <NewNoteForm />
      </div>
    </main>
  );
}
