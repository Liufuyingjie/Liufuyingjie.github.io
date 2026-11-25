"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { site } from "../data/site";
import { canUseNotesApi, clearNoteSession, NOTE_SESSION_KEY } from "../lib/note-session";
import Icon from "./icons";
import styles from "./delete-paper-button.module.css";

const api = site.apiBaseUrl.replace(/\/$/, "");

type OwnerSession = { token: string; expiresAt: number };

function storedSession() {
  try {
    return localStorage.getItem(NOTE_SESSION_KEY);
  } catch {
    return null;
  }
}

function useOwnerWithDeleteAccess() {
  const [owner, setOwner] = useState<OwnerSession | null>(null);

  useEffect(() => {
    if (!canUseNotesApi(window.location.origin)) return;

    let request: AbortController | undefined;
    let expiry: ReturnType<typeof setTimeout> | undefined;

    async function verify() {
      const token = storedSession();
      request?.abort();
      clearTimeout(expiry);
      setOwner(current => current?.token === token && current.expiresAt > Date.now() ? current : null);
      if (!token) return;

      request = new AbortController();
      const { signal } = request;
      try {
        const headers = { Authorization: `Bearer ${token}` };
        const [session, service] = await Promise.all([
          fetch(`${api}/api/me`, { headers, signal }),
          fetch(`${api}/health`, { signal }),
        ]);
        if (signal.aborted) return;
        if (session.status === 401) clearNoteSession(token);
        if (!session.ok || !service.ok) {
          setOwner(null);
          return;
        }

        const identity = await session.json() as { login?: string; expiresAt?: number };
        const health = await service.json() as { capabilities?: string[] };
        if (signal.aborted || storedSession() !== token) return;
        const expiresAt = identity.expiresAt ?? 0;
        if (identity.login?.toLowerCase() !== site.author.toLowerCase() ||
            !Number.isFinite(expiresAt) || expiresAt <= Date.now() ||
            !health.capabilities?.includes("delete-paper")) {
          setOwner(null);
          return;
        }

        setOwner({ token, expiresAt });
        expiry = setTimeout(() => setOwner(null), expiresAt - Date.now());
      } catch {
        if (!signal.aborted) setOwner(null);
      }
    }

    function onStorage(event: StorageEvent) {
      if (event.key === NOTE_SESSION_KEY || event.key === null) void verify();
    }

    void verify();
    window.addEventListener("storage", onStorage);
    window.addEventListener("pageshow", verify);
    window.addEventListener("online", verify);
    return () => {
      request?.abort();
      clearTimeout(expiry);
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("pageshow", verify);
      window.removeEventListener("online", verify);
    };
  }, []);

  return { owner, clearOwner: () => setOwner(null) };
}

export default function DeletePaperButton({ slug, title, sourceSha }: {
  slug: string;
  title: string;
  sourceSha: string;
}) {
  const { owner, clearOwner } = useOwnerWithDeleteAccess();
  const dialog = useRef<HTMLDialogElement>(null);
  const cancel = useRef<HTMLButtonElement>(null);
  const result = useRef<HTMLHeadingElement>(null);
  const submitting = useRef(false);
  const dialogTitle = useId();
  const dialogDescription = useId();
  const [busy, setBusy] = useState(false);
  const [stale, setStale] = useState(false);
  const [error, setError] = useState("");
  const [deleted, setDeleted] = useState<"triggered" | "scheduled" | null>(null);

  useEffect(() => {
    if (deleted) result.current?.focus();
  }, [deleted]);

  function openDialog() {
    setError("");
    dialog.current?.showModal();
    cancel.current?.focus();
  }

  async function deletePaper(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current || deleted || stale) return;
    if (!owner || storedSession() !== owner.token || owner.expiresAt <= Date.now()) {
      clearOwner();
      setError("登录已失效，请重新登录后再删除。");
      return;
    }

    submitting.current = true;
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`${api}/api/papers/${encodeURIComponent(slug)}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${owner.token}`,
          "Content-Type": "application/json",
          "X-Research-Notes-Request": "delete-paper",
        },
        body: JSON.stringify({ expectedSha: sourceSha }),
      });
      const data = await response.json().catch(() => ({})) as { ok?: boolean; error?: string; siteRebuild?: string };
      if (response.status === 401) {
        clearNoteSession(owner.token);
        clearOwner();
      }
      if (response.status === 404 || response.status === 409) setStale(true);
      if (!response.ok || data.ok !== true) throw new Error(data.error || "暂时无法确认删除结果，请刷新页面核对后再试。");
      setDeleted(data.siteRebuild === "triggered" ? "triggered" : "scheduled");
    } catch (reason) {
      setError(reason instanceof Error && reason.name !== "TypeError" ? reason.message : "连接中断，请刷新页面核对删除结果。");
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  }

  return <>
    {owner && !deleted && (
      <button type="button" className={`delete-paper-button ${styles.trigger}`} onClick={openDialog}>
        <Icon name="trash" width="15" height="15"/>删除笔记
      </button>
    )}
    <dialog
      ref={dialog}
      className={styles.dialog}
      aria-labelledby={dialogTitle}
      aria-describedby={dialogDescription}
      onCancel={event => { if (submitting.current) event.preventDefault(); }}
    >
      {deleted ? (
        <>
          <div className={styles.successIcon}><Icon name="check"/></div>
          <h2 id={dialogTitle} ref={result} tabIndex={-1}>笔记已从 GitHub 删除。</h2>
          <p id={dialogDescription}>{deleted === "triggered"
            ? "已触发站点重建。部署完成后，公开页面会自动移除这篇笔记。"
            : "暂未能触发即时重建。下次定时部署完成后，公开页面会自动移除这篇笔记。"}</p>
          <div className={styles.actions}>
            <button type="button" className={styles.neutral} onClick={() => dialog.current?.close()}>关闭</button>
            <Link className={styles.home} href="/">返回首页</Link>
          </div>
        </>
      ) : (
        <form onSubmit={deletePaper}>
          <div className={styles.dangerIcon}><Icon name="trash"/></div>
          <h2 id={dialogTitle}>删除这篇笔记？</h2>
          <p id={dialogDescription}>将从笔记仓库中删除《<strong>{title}</strong>》。站点重新部署后，这篇笔记会从公开页面和列表中移除。</p>
          {error && <p className={styles.error} role="alert">{error}</p>}
          <div className={styles.actions}>
            <button ref={cancel} type="button" className={styles.neutral} disabled={busy} onClick={() => dialog.current?.close()}>取消</button>
            <button type="submit" className={styles.confirm} disabled={busy || !owner || stale}>{busy ? "正在删除…" : "确认删除"}</button>
          </div>
        </form>
      )}
    </dialog>
  </>;
}
