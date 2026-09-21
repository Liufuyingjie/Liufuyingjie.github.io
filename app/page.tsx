import Link from "next/link";
import ThemeToggle from "../components/theme-toggle";
import { site } from "../data/site";
import NotesSection from "../components/notes-section";


export default function Home() {
  return (
    <main>
      <nav className="site-nav">
        <a className="brand" href={site.githubUrl} target="_blank" rel="noreferrer" aria-label="Open YingJie GitHub">
          <span>{site.name}</span>
          <span className="brand-arrow" aria-hidden="true">↗</span>
        </a>
        <div className="nav-links">
          <Link href="#notes">论文记录</Link>
          <Link href="#about">关于我</Link>
          <ThemeToggle />
        </div>
      </nav>

      <section className="hero shell">
        <div className="hero-copy reveal">
          <p className="kicker">PERSONAL RESEARCH NOTEBOOK</p>
          <h1>
            One paper.
            <br />
            <span>One clear idea.</span>
          </h1>
          <p className="hero-description">
            记录我阅读论文时真正理解下来的东西：问题、方法、实验，以及值得继续思考的地方。
          </p>
          <div className="hero-actions">
            <Link className="primary-button" href="#notes">
              查看论文记录 <span>↓</span>
            </Link>
            <a className="secondary-link" href={site.githubUrl} target="_blank" rel="noreferrer">
              GitHub <span>↗</span>
            </a>
          </div>
        </div>

        <div className="hero-panel reveal delay-1" aria-hidden="true">
          <div className="hero-panel-grid" />
          <div className="hero-panel-card hero-panel-card-back" />
          <div className="hero-panel-card hero-panel-card-front">
            <div className="hero-panel-top">
              <span>01</span>
              <span>RESEARCH NOTE</span>
            </div>
            <div className="hero-panel-title">理解，而不是收藏。</div>
            <div className="hero-panel-rule" />
            <div className="hero-panel-foot">
              <span>Computer Vision</span>
              <span>Image Retrieval</span>
            </div>
          </div>
          <div className="hero-panel-orb" />
        </div>
      </section>

      <section className="statement shell reveal">
        <p className="statement-label">THE PURPOSE</p>
        <p className="statement-text">
          把论文拆开，
          <br />
          再重新理解一遍。
        </p>
      </section>

      <NotesSection />

      <section className="about-section shell reveal" id="about">
        <div className="about-heading">
          <p className="kicker">ABOUT</p>
          <p className="about-intro">关于我</p>
        </div>
        <div className="about-list">
          <div className="about-row">
            <span>身份</span>
            <strong>计算机专业研究生</strong>
          </div>
          <div className="about-row">
            <span>研究方向</span>
            <strong>计算机视觉 · 图像检索</strong>
          </div>
          <div className="about-row">
            <span>当前关注</span>
            <strong>细粒度图像检索 / Vision Foundation Models</strong>
          </div>
          <div className="about-row">
            <span>这个网站</span>
            <strong>把阅读过的论文整理成自己的研究理解</strong>
          </div>
          <div className="about-row">
            <span>GitHub</span>
            <a href={site.githubUrl} target="_blank" rel="noreferrer">访问我的 GitHub ↗</a>
          </div>
        </div>
      </section>

      <footer className="site-footer shell">
        <span>{site.name} · Research Notes</span>
        <span>Built with Next.js</span>
      </footer>
    </main>
  );
}
