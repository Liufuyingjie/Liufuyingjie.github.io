import Link from "next/link";

export default function NotFound() {
  return (
    <main className="shell" style={{ padding: "140px 0" }}>
      <p className="kicker">404</p>
      <h1 style={{ fontSize: "clamp(48px, 8vw, 96px)", letterSpacing: "-.06em", margin: 0 }}>Note not found.</h1>
      <p style={{ color: "var(--muted)", fontSize: 18, marginTop: 18 }}>The paper you requested does not exist in this notebook.</p>
      <Link className="primary-button" href="/" style={{ marginTop: 28 }}>Back home</Link>
    </main>
  );
}
