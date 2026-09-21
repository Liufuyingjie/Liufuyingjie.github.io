"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { site } from "../data/site";

function normalizeApiBaseUrl(value: string) {
  return value.replace(/\/$/, "");
}

export default function EditPaperButton({ slug }: { slug: string }) {
  const [ready, setReady] = useState(true);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const existing = localStorage.getItem("yingjie-research-session");
    setToken(existing);

    if (!existing) {
      setReady(true);
      return;
    }

    fetch(`${normalizeApiBaseUrl(site.apiBaseUrl)}/api/me`, {
      headers: { Authorization: `Bearer ${existing}` },
    })
      .then((response) => {
        if (!response.ok) throw new Error("invalid");
      })
      .catch(() => {
        localStorage.removeItem("yingjie-research-session");
        setToken(null);
      })
      .finally(() => setReady(true));
  }, []);

  const startLogin = () => {
    const apiBaseUrl = normalizeApiBaseUrl(site.apiBaseUrl);
    const returnTo = `${window.location.origin}/papers/${encodeURIComponent(slug)}/edit/`;
    window.location.href = `${apiBaseUrl}/auth/login?return_to=${encodeURIComponent(returnTo)}`;
  };

  if (!ready) return null;

  const buttonLabel = "编辑笔记";

  const content = (
    <>
      <span className="edit-paper-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M4.5 19.5h4l9.85-9.85a1.77 1.77 0 0 0 0-2.5l-1.5-1.5a1.77 1.77 0 0 0-2.5 0L4.5 15.5v4Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
          <path d="m13.8 6.75 3.45 3.45" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      </span>
      <span>{buttonLabel}</span>
      <span className="edit-paper-arrow" aria-hidden="true">↗</span>
    </>
  );

  if (token) {
    return (
      <Link className="edit-paper-button" href={`/papers/${slug}/edit/`}>
        {content}
      </Link>
    );
  }

  return (
    <button type="button" className="edit-paper-button" onClick={startLogin}>
      {content}
    </button>
  );
}
