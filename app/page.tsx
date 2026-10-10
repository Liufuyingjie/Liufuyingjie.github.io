import SiteNav from "../components/site-nav";
import Masthead from "../components/masthead";
import NotesSection from "../components/notes-section";
import Sidebar from "../components/sidebar";
import SiteFooter from "../components/site-footer";
export default function Home() {
  return <><SiteNav overlay/><Masthead home/><main id="main-content" className="blog-layout shell"><NotesSection/><Sidebar/></main><SiteFooter/></>;
}
