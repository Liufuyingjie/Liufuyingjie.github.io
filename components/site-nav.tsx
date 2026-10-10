"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import ThemeToggle from "./theme-toggle";
import Icon from "./icons";
import { site } from "../data/site";
export default function SiteNav({ overlay = false }: { overlay?: boolean }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const handle = () => setScrolled(window.scrollY > 80);
    handle();
    window.addEventListener("scroll", handle, { passive: true });
    return () => window.removeEventListener("scroll", handle);
  }, []);
  const links = [["/", "首页"], ["/archives/", "归档"], ["/tags/", "标签"], ["/about/", "关于"]];
  return <nav className={`site-nav ${overlay ? "nav-overlay" : "nav-solid"} ${scrolled ? "nav-scrolled" : ""} ${open ? "nav-open" : ""}`} aria-label="主导航">
    <div className="nav-shell">
      <Link className="brand" href="/" onClick={() => setOpen(false)}>{site.name}<span className="brand-dot">.</span></Link>
      <div className="nav-right">
        <div className="nav-links" id="primary-navigation">
          {links.map(([href, label]) => <Link key={href} href={href} className={pathname === href ? "active" : ""} aria-current={pathname === href ? "page" : undefined} onClick={() => setOpen(false)}>{label}</Link>)}
          <Link className="nav-search" href="/search/" onClick={() => setOpen(false)}><Icon name="search" width="17" height="17"/><span>搜索</span></Link>
          <Link href="/new/" className="nav-write" onClick={() => setOpen(false)}><Icon name="pen" width="15" height="15"/><span>写笔记</span></Link>
        </div>
        <ThemeToggle/>
        <button type="button" className="menu-toggle icon-button" aria-label={open ? "收起导航" : "展开导航"} aria-expanded={open} aria-controls="primary-navigation" onClick={() => setOpen(v => !v)}><Icon name={open ? "close" : "menu"}/></button>
      </div>
    </div>
  </nav>;
}
