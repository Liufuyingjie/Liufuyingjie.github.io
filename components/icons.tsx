import type { SVGProps } from "react";
export default function Icon({ name, ...props }: SVGProps<SVGSVGElement> & { name: "search" | "github" | "pen" | "arrow" | "sun" | "moon" | "menu" | "close" | "download" | "check" }) {
  const paths = {
    search: <><circle cx="10.8" cy="10.8" r="6.8"/><path d="m16 16 4.3 4.3"/></>,
    github: <><path d="M8.5 20.5v-3.1c-3 .7-3.8-1.3-3.8-1.3M15.5 20.5v-4c0-1 .1-1.7-.5-2.3 3.2-.4 4.5-1.9 4.5-4.4 0-1.1-.4-2-1.1-2.8.3-.9.2-2-.3-2.8-1-.1-2.5.6-3.2 1-1.8-.4-3.7-.4-5.4 0-.8-.4-2.3-1.1-3.2-1-.5.8-.6 1.9-.3 2.8-.7.8-1.1 1.7-1.1 2.8 0 2.5 1.3 4 4.5 4.4-.6.6-.5 1.3-.5 2.3v4"/></>,
    pen: <><path d="m14.5 4.5 5 5M4 20l4.5-1 12-12a1.8 1.8 0 0 0 0-2.5l-1-1a1.8 1.8 0 0 0-2.5 0L5 15.5Z"/></>,
    arrow: <><path d="M5 12h14m-6-6 6 6-6 6"/></>,
    sun: <><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5"/></>,
    moon: <path d="M20.3 14.2A8.5 8.5 0 0 1 9.8 3.7a8.5 8.5 0 1 0 10.5 10.5Z"/>,
    menu: <path d="M4 6h16M4 12h16M4 18h16"/>,
    close: <path d="m5 5 14 14M5 19 19 5"/>,
    download: <><path d="M12 3v12m-4-4 4 4 4-4M4 16v5h16v-5"/></>,
    check: <path d="m5 12 4 4L19 6"/>,
  };
  return <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>{paths[name]}</svg>;
}
