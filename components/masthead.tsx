import { site } from "../data/site";
import styles from "./masthead.module.css";

// Each curve travels 1440 units and meets its next copy at the same height and tangent.
const homeWaves = [
  {
    name: "distant",
    start: 39,
    curve: "c 110 0 204 -25 350 -25 c 153 0 226 29 370 29 c 153 0 229 -18 365 -18 c 135 0 250 14 355 14",
  },
  {
    name: "middle",
    start: 55,
    curve: "c 147 0 237 21 399 21 c 167 0 220 -42 424 -42 c 202 0 371 21 617 21",
  },
  {
    name: "near",
    start: 68,
    curve: "c 238 0 317 -26 557 -26 c 214 0 293 30 500 30 c 164 0 224 -4 383 -4",
  },
] as const;

export default function Masthead({ title, subtitle, home = false }: { title?: string; subtitle?: string; home?: boolean }) {
  return <header className={`masthead ${home ? "masthead-home" : "masthead-inner"}`}>
    <div className="masthead-shade"/>
    <div className="masthead-copy">
      {home ? <><p className="masthead-eyebrow">PAPERS, THOUGHTS & A LITTLE CURIOSITY</p><h1 className={styles.homeTitle}>{site.name}</h1><p className="masthead-tagline">{site.tagline}</p></> : <><h1>{title}</h1><p className="masthead-subtitle">{subtitle}</p></>}
    </div>
    {home ? <div className={`masthead-home-waves ${styles.waves}`} aria-hidden="true">
      {homeWaves.map(({ name, start, curve }) => {
        const line = `M0 ${start} ${curve} ${curve}`;
        return <svg key={name} className={`${styles.waveTrack} ${styles[name]}`} viewBox="0 0 2880 100" preserveAspectRatio="none" focusable="false">
          <path d={`${line} V100 H0 Z`} fill="currentColor"/>
          {name === "distant" && <path className={styles.foam} d={line} vectorEffect="non-scaling-stroke"/>}
        </svg>;
      })}
    </div> : <svg className="masthead-waves" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 55" preserveAspectRatio="none" aria-hidden="true">
      <path d="M0 14C238 55 403-12 720 17S1199 59 1440 10V55H0Z" fill="var(--bg)" opacity=".3"/>
      <path d="M0 23C276 0 503 53 741 29S1190-1 1440 31V55H0Z" fill="var(--bg)" opacity=".55"/>
      <path d="M0 35C244 58 442 22 720 39S1171 62 1440 34V55H0Z" fill="var(--bg)"/>
    </svg>}
  </header>;
}
