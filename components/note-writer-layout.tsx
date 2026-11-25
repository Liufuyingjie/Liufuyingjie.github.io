import type { ReactNode } from "react";
import SiteNav from "./site-nav";
import SiteFooter from "./site-footer";
import styles from "./note-writer.module.css";

export default function NoteWriterLayout({ children }: { children: ReactNode }) {
  return <div className={styles.page}>
    <SiteNav/>
    <main id="main-content" className={styles.shell}>{children}</main>
    <SiteFooter/>
  </div>;
}
