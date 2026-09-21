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

  if (token) {
    return (
      <Link className="edit-paper-button" href={`/papers/${slug}/edit/`}>
        编辑笔记 <span>↗</span>
      </Link>
    );
  }

  return (
    <button type="button" className="edit-paper-button" onClick={startLogin}>
      登录后编辑 <span>↗</span>
    </button>
  );
}
