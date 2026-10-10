import { site } from "../data/site";
export default function Masthead({ title, subtitle, home = false }: { title?: string; subtitle?: string; home?: boolean }) {
  return <header className={`masthead ${home ? "masthead-home" : "masthead-inner"}`}>
    <div className="masthead-shade"/>
    <div className="masthead-copy">
      {home ? <><p className="masthead-eyebrow">PAPERS, THOUGHTS & A LITTLE CURIOSITY</p><h1>{site.name}</h1><p className="masthead-tagline">{site.tagline}</p></> : <><h1>{title}</h1><p className="masthead-subtitle">{subtitle}</p></>}
    </div>
    <svg className="masthead-waves" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 55" preserveAspectRatio="none" aria-hidden="true">
      <path d="M0 14C238 55 403-12 720 17S1199 59 1440 10V55H0Z" fill="var(--bg)" opacity=".3"/>
      <path d="M0 23C276 0 503 53 741 29S1190-1 1440 31V55H0Z" fill="var(--bg)" opacity=".55"/>
      <path d="M0 35C244 58 442 22 720 39S1171 62 1440 34V55H0Z" fill="var(--bg)"/>
    </svg>
  </header>;
}
