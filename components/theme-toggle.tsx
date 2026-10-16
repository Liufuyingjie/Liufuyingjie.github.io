"use client";
import { useEffect, useState } from "react";
import Icon from "./icons";
export default function ThemeToggle() {
  const [dark, setDark] = useState(false);
  useEffect(() => { setDark(document.documentElement.dataset.theme === "dark"); }, []);
  function toggle() {
    const value = !dark;
    document.documentElement.dataset.theme = value ? "dark" : "light";
    setDark(value);
    try { localStorage.setItem("paper-notes-theme", value ? "dark" : "light"); } catch {}
  }
  return <button className="theme-toggle icon-button" type="button" onClick={toggle} aria-label={dark ? "切换浅色模式" : "切换深色模式"} title={dark ? "切换浅色" : "切换深色"}><Icon name={dark ? "sun" : "moon"}/></button>;
}
