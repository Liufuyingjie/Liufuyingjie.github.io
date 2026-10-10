"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { marked } from "marked";
import DOMPurify from "dompurify";
import Icon from "./icons";
import { site } from "../data/site";
import { buildNoteMarkdown, emptyNoteInput, normalizeNoteInput, noteBody, plainText, templateBody, type NoteInput, type NoteTemplate } from "../shared/note-format";

export type PaperFormState = NoteInput;
export const emptyPaperForm = emptyNoteInput;
const SESSION_KEY = "yingjie-research-session";
const templates: Array<{ id: NoteTemplate; name: string; hint: string }> = [
  { id: "detailed", name: "完整论文", hint: "问题 · 方法 · 流程 · 实验" },
  { id: "quick", name: "快速阅读", hint: "核心理解 · 证据 · 下一步" },
  { id: "free", name: "研究随记", hint: "专题梳理，或自由写作" },
];

type TextKey = Exclude<keyof NoteInput, "kind" | "template">;
function Field({ label, value, onChange, placeholder, multiline = false, required = false }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; multiline?: boolean; required?: boolean;
}) {
  return <label className="note-field"><span>{label}{!required && <small>可选</small>}</span>{multiline ? <textarea rows={2} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}/> : <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} required={required}/>}</label>;
}

type Props = { mode?: "new" | "edit"; slug?: string; sourceSha?: string; existingMetadata?: Record<string, unknown>; initialForm?: NoteInput };
type Draft = { form: NoteInput; savedAt: string; sourceSha?: string };

export default function NewNoteForm({ mode = "new", slug, sourceSha, existingMetadata, initialForm }: Props) {
  const editing = mode === "edit";
  const [form, setForm] = useState<NoteInput>(() => initialForm || { ...emptyNoteInput, body: templateBody("detailed") });
  const initialSnapshot = useRef(JSON.stringify(initialForm || { ...emptyNoteInput, body: templateBody("detailed") }));
  const publishedSnapshot = useRef("");
  const [tab, setTab] = useState<"write" | "preview">("write");
  const [previewHtml, setPreviewHtml] = useState("");
  const [pendingDraft, setPendingDraft] = useState<Draft | null>(null);
  const [draftChecked, setDraftChecked] = useState(false);
  const [draftStatus, setDraftStatus] = useState("仅保存在本机，发布后同步 GitHub");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [online, setOnline] = useState<boolean | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [login, setLogin] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [backendReady, setBackendReady] = useState(false);
  const [backendMessage, setBackendMessage] = useState("");
  const [connectionAttempt, setConnectionAttempt] = useState(0);
  const [redirecting, setRedirecting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState<{ path: string; commitUrl?: string; slug?: string } | null>(null);
  const draftKey = `yingjie-note-draft:v5:${editing ? slug : "new"}`;
  const api = site.apiBaseUrl.replace(/\/$/, "");

  useEffect(() => {
    try {
      const raw = localStorage.getItem(draftKey);
      if (raw) {
        const parsed = JSON.parse(raw) as Draft;
        if (parsed?.form && typeof parsed.form.body === "string") setPendingDraft({ ...parsed, form: normalizeNoteInput(parsed.form as unknown as Record<string, unknown>) });
      }
    } catch { setDraftStatus("浏览器无法读取草稿，请及时导出 Markdown"); }
    setDraftChecked(true);
  }, [draftKey]);

  useEffect(() => {
    if (!draftChecked || pendingDraft) return;
    const snapshot = JSON.stringify(form);
    if (snapshot === initialSnapshot.current || snapshot === publishedSnapshot.current) return;
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(draftKey, JSON.stringify({ form, savedAt: new Date().toISOString(), sourceSha }));
        setDraftStatus("草稿已自动保存在本机");
      } catch { setDraftStatus("无法自动保存，请及时导出 Markdown"); }
    }, 650);
    return () => clearTimeout(timer);
  }, [form, draftKey, draftChecked, pendingDraft, sourceSha]);

  useEffect(() => { setPreviewHtml(DOMPurify.sanitize(marked.parse(noteBody(form), { gfm: true }) as string)); }, [form]);

  useEffect(() => {
    const allowed = window.location.origin === new URL(site.homepageUrl).origin || window.location.origin === "http://localhost:3000";
    setOnline(allowed);
    if (!allowed) {
      setAuthLoading(false);
      setBackendMessage("当前为改版预览，不会连接或修改你的线上仓库。可以写作、预览并导出 Markdown。");
      return;
    }
    const controller = new AbortController();
    let cancelled = false;
    setAuthLoading(true);
    let existing: string | null = null;
    try {
      const params = new URLSearchParams(window.location.hash.slice(1));
      const hashToken = params.get("auth");
      const authError = params.get("auth_error");
      if (hashToken) localStorage.setItem(SESSION_KEY, hashToken);
      if (authError) {
        const errors: Record<string, string> = { not_allowed: "请使用 Liufuyingjie 的 GitHub 账号登录。", invalid_state: "登录校验已过期，请重新登录。", github_error: "GitHub 授权未完成，请重试。" };
        setError(errors[authError] || "登录未完成，请重新尝试。");
      }
      if (hashToken || authError) window.history.replaceState(null, "", window.location.pathname + window.location.search);
      existing = localStorage.getItem(SESSION_KEY);
    } catch { setError("浏览器禁止了本地存储，登录信息无法保存。请使用正常浏览模式。"); }
    setToken(existing);
    async function health() {
      try {
        const response = await fetch(`${api}/health`, { signal: controller.signal });
        if (!response.ok) throw new Error("health");
        const data = await response.json() as { schemaVersion?: number; capabilities?: string[] };
        if (cancelled) return;
        const ready = Number(data.schemaVersion) >= 5 && data.capabilities?.includes("markdown-body") === true;
        setBackendReady(ready);
        setBackendMessage(ready ? "" : "保存服务仍是旧版。请先更新 Worker，再发布新模板；你的草稿可以先导出，不会被旧接口截断。");
      } catch {
        if (!cancelled) { setBackendReady(false); setBackendMessage("暂时无法连接保存服务。草稿仍保存在本机，可以导出 Markdown 后手动提交 GitHub。"); }
      }
    }
    async function session() {
      if (!existing) { if (!cancelled) setLogin(null); return; }
      try {
        const response = await fetch(`${api}/api/me`, { headers: { Authorization: `Bearer ${existing}` }, signal: controller.signal });
        if (response.status === 401) {
          try { localStorage.removeItem(SESSION_KEY); } catch {}
          if (!cancelled) { setToken(null); setLogin(null); }
          return;
        }
        if (!response.ok) throw new Error("session");
        const data = await response.json() as { login: string };
        if (!cancelled) setLogin(data.login);
      } catch { if (!cancelled) setLogin(null); }
    }
    void Promise.all([health(), session()]).finally(() => { if (!cancelled) setAuthLoading(false); });
    return () => { cancelled = true; controller.abort(); };
  }, [api, connectionAttempt]);

  function setField(key: TextKey, value: string) { setForm(current => ({ ...current, [key]: value })); setSaved(null); }
  function chooseTemplate(template: NoteTemplate) {
    const untouched = !form.body.trim() || form.body === templateBody(form.template);
    setMessage(untouched ? "" : "模板已切换，原有正文完整保留。你可以直接调整标题与段落，无需按固定栏目填写。");
    setForm({ ...form, kind: template === "free" ? "journal" : "paper", template, readingStatus: template === "free" ? "研究随记" : "阅读笔记", body: untouched ? templateBody(template) : form.body });
    setSaved(null);
  }
  function startLogin() {
    if (!online || redirecting) return;
    setRedirecting(true);
    const returnPath = editing && slug ? `/papers/${encodeURIComponent(slug)}/edit/` : "/new/";
    // External Worker OAuth navigation requires a full redirect, not Next.js routing.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.assign(`${api}/auth/login?return_to=${encodeURIComponent(window.location.origin + returnPath)}`);
  }
  function logout() { try { localStorage.removeItem(SESSION_KEY); } catch {} setToken(null); setLogin(null); }
  function restoreDraft() {
    if (!pendingDraft) return;
    setForm(pendingDraft.form);
    setMessage(pendingDraft.sourceSha && sourceSha && pendingDraft.sourceSha !== sourceSha ? "已恢复旧草稿，但远端笔记可能已经更新。请先核对正文，再发布。" : "本机草稿已恢复；它没有修改线上记录。");
    setPendingDraft(null);
    setDraftStatus("本机草稿已恢复");
  }
  function dismissDraft() { try { localStorage.removeItem(draftKey); } catch {} setPendingDraft(null); }
  function exportMarkdown() {
    const exportSlug = slug || `${form.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 55) || "note"}-${Date.now()}`;
    const markdown = buildNoteMarkdown(form, exportSlug, editing ? existingMetadata : undefined);
    const url = URL.createObjectURL(new Blob([markdown], { type: "text/markdown;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${exportSlug}.md`;
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(""); setSaved(null);
    if (!form.title.trim()) { setError("请填写记录标题。"); return; }
    if (!plainText(form.body.replace(/^#{1,6}[^\n]*$/gm, "")).trim()) { setError("请至少写下一段自己的理解，不能只发布空模板。"); return; }
    if (!online) { setError("预览环境不会写入你的线上仓库，请导出 Markdown，或部署后再登录发布。"); return; }
    if (!token || !login) { setError("草稿已保留，请先使用 GitHub 登录，再发布。"); return; }
    if (!backendReady) { setError("保存服务需要更新或重新连接。为避免正文丢失，本次没有提交任何内容。"); return; }
    if (editing && !slug) { setError("缺少记录标识，无法保存。"); return; }
    setSaving(true);
    try {
      const response = await fetch(editing ? `${api}/api/papers/${encodeURIComponent(slug!)}` : `${api}/api/papers`, {
        method: editing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, "X-Research-Notes-Request": editing ? "edit-paper" : "save-paper" },
        body: JSON.stringify({ ...form, ...(editing && sourceSha ? { expectedSha: sourceSha } : {}) }),
      });
      const data = await response.json().catch(() => ({})) as { error?: string; path: string; commitUrl?: string; slug?: string };
      if (!response.ok) {
        if (response.status === 401) logout();
        throw new Error(data.error || "保存未完成。你的草稿仍保存在本机，可以稍后重试或导出。");
      }
      publishedSnapshot.current = JSON.stringify(form);
      try { localStorage.removeItem(draftKey); } catch {}
      setSaved({ path: data.path, commitUrl: data.commitUrl, slug: data.slug });
      setDraftStatus("已提交 GitHub，等待自动部署");
    } catch (err) { setError(err instanceof Error ? err.message : "保存失败，草稿已保留。"); }
    finally { setSaving(false); }
  }

  const metadataFields: Array<[string, TextKey, string]> = [
    ["发表年份 / 卷期", "year", "如 2026 · Vol. 28"], ["期刊 / 会议", "journal", "如 CVPR / TMM"],
    ["论文链接", "paperUrl", "DOI、arXiv 或论文主页"], ["开源代码", "code", "GitHub / 项目主页"],
    ["作者", "authors", "作者姓名"], ["单位", "affiliation", "学校 / 实验室"],
    ["核心任务", "task", "图像检索 / VPR / FGIR"], ["模型名称", "model", "方法或模型名称"],
  ];
  const textLength = plainText(form.body).length;
  return <form onSubmit={submit} className="new-note-form">
    <div className="writer-intro"><div><h2>{editing ? "编辑这篇笔记" : "选择一个起点"}</h2><p>只有标题和正文必填，写法由你决定。</p></div><span className="draft-status" aria-live="polite">{draftStatus}</span></div>
    {pendingDraft && <div className="draft-recovery"><span>发现一份本机草稿{pendingDraft.savedAt ? ` · ${pendingDraft.savedAt.slice(0, 10)}` : ""}</span><div><button type="button" onClick={restoreDraft}>恢复草稿</button><button type="button" onClick={dismissDraft}>使用当前版本</button></div></div>}
    <fieldset className="writer-fieldset" disabled={!!pendingDraft}>
    <div className="template-picker" role="group" aria-label="选择笔记模板">{templates.map(t => <button key={t.id} type="button" className={`template-option ${form.template === t.id ? "active" : ""}`} onClick={() => chooseTemplate(t.id)} aria-pressed={form.template === t.id}><strong>{t.name}</strong><span>{t.hint}</span>{form.template === t.id && <Icon name="check" width="15" height="15"/>}</button>)}</div>
    {message && <div className="writer-message" role="status">{message}</div>}
    <div className="writer-fields"><div className="title-field"><Field label="记录标题" value={form.title} onChange={v => setField("title", v)} placeholder={form.kind === "paper" ? "这次读的是哪篇论文？" : "给这个想法起个名字"} required/></div><Field label="中文标题 / 副标题" value={form.subtitle} onChange={v => setField("subtitle", v)} placeholder="用一句话解释它在做什么"/><Field label="一句话理解 / 首页摘要" value={form.summary} onChange={v => setField("summary", v)} placeholder="留空时，会从正文自动提取摘要" multiline/><Field label="主题标签" value={form.tags} onChange={v => setField("tags", v)} placeholder="细粒度图像检索, Vision Transformer（用逗号分隔）"/></div>
    <details className="meta-details"><summary>{form.kind === "paper" ? "论文基础信息" : "补充信息"}<span>可按需要填写，不必每项都写</span></summary><div className="field-grid">{metadataFields.map(([label, key, placeholder]) => <Field key={key} label={label} value={form[key]} onChange={v => setField(key, v)} placeholder={placeholder}/>)}</div></details>
    <div className="editor-header"><div className="editor-tabs" role="group" aria-label="编辑器视图"><button type="button" className={tab === "write" ? "active" : ""} onClick={() => setTab("write")} aria-pressed={tab === "write"}>撰写</button><button type="button" className={tab === "preview" ? "active" : ""} onClick={() => setTab("preview")} aria-pressed={tab === "preview"}>预览</button></div><span>Markdown · {textLength} 字符</span></div>
    {tab === "write" ? <textarea className="markdown-editor" aria-label="笔记正文" value={form.body} onChange={e => setField("body", e.target.value)} spellCheck={false} placeholder="从你的问题和理解开始。支持 Markdown 标题、列表、表格、代码与图片。"/> : <div className="editor-preview markdown-body" aria-label="Markdown 预览" dangerouslySetInnerHTML={{ __html: previewHtml }}/>}<p className="form-hint">用 ## 分段，用 - 写列表。支持代码块、表格、链接和图片；模板可以自由删改，不会强迫你填满每一栏。</p></fieldset>
    {authLoading ? <div className="auth-card"><strong>正在确认保存服务…</strong></div> : online === false ? <div className="auth-card"><div><strong>预览模式 · 不会修改线上记录</strong><p>{backendMessage}</p></div><button className="github-login-button" type="button" onClick={exportMarkdown}><Icon name="download" width="15" height="15"/>导出草稿</button></div> : token && login ? <div className="auth-strip"><div><span className="auth-dot"/>已登录 @{login}</div><button type="button" onClick={logout}>退出登录</button></div> : <div className="auth-card"><div><strong>写作可以从现在开始，发布只对作者开放。</strong><p>通过 GitHub 验证身份，继续使用你原来的登录和自动发布流程。</p></div><button className="github-login-button" type="button" onClick={startLogin} disabled={redirecting}><Icon name="github" width="16" height="16"/>{redirecting ? "前往 GitHub…" : "GitHub 登录"}</button></div>}
    {online && backendMessage && !authLoading && <div className="writer-message"><span>{backendMessage}</span><button type="button" className="text-link" style={{ marginLeft: 12 }} onClick={() => setConnectionAttempt(n => n + 1)}>重新连接</button></div>}
    {error && <p className="form-error" role="alert">{error}</p>}
    {saved && <div className="save-success" role="status"><Icon name="check"/><div><strong>{editing ? "修改已提交，原文章链接不变。" : "笔记已写入 GitHub。"}</strong><p>GitHub Actions 将自动构建。部署完成后，刷新首页即可看到新内容。</p>{saved.commitUrl && <a href={saved.commitUrl} target="_blank" rel="noreferrer">查看 GitHub 提交 ↗</a>}</div></div>}
    <div className="form-actions"><div><Link href={editing && slug ? `/papers/${slug}/` : "/"} className="secondary-link">返回</Link><button type="button" className="export-button" onClick={exportMarkdown}><Icon name="download" width="15" height="15"/>导出 Markdown</button></div><button className="primary-button" type="submit" disabled={saving || authLoading || !online || !backendReady || !token || !login}>{saving ? "正在提交…" : editing ? "保存修改" : "发布笔记"}<Icon name="arrow" width="16" height="16"/></button></div>
    <p className="storage-note">本机草稿不会自动公开。发布会写入原来的 content/papers 目录，并触发 GitHub Pages 自动部署。</p>
  </form>;
}
