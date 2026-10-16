import Link from "next/link";
import SiteNav from "../components/site-nav";
import SiteFooter from "../components/site-footer";
export default function NotFound() { return <><SiteNav/><main id="main-content" className="not-found shell"><p className="eyebrow">404 · NOTE NOT FOUND</p><h1>这个想法，暂时还没写下来。</h1><p>页面不存在，或文章还在部署中。回到笔记里看看吧。</p><Link href="/" className="primary-button">回到首页 →</Link></main><SiteFooter/></>; }
