"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import Icon from "./icons";
import MarkdownWorkspace from "./markdown-workspace";
import styles from "./note-writer.module.css";
import { site } from "../data/site";
import { canUseNotesApi, clearNoteSession, NOTE_SESSION_KEY } from "../lib/note-session";
import { buildNoteMarkdown, emptyNoteInput, normalizeNoteInput, noteBody, parsePublicationDate, parseVenueType, plainText, templateBody, type NoteInput, type NoteTemplate } from "../shared/note-format";

export type PaperFormState = NoteInput;
export const emptyPaperForm = emptyNoteInput;
const templates: Array<{ id: NoteTemplate; name: string; hint: string }> = [
  { id: "detailed", name: "完整论文", hint: "问题 · 方法 · 流程 · 实验" },
  { id: "quick", name: "快速阅读", hint: "核心理解 · 证据 · 下一步" },
  { id: "free", name: "研究随记", hint: "专题梳理，或自由写作" },
];

function Field({ label, value, onChange, className, type = "text", placeholder, multiline = false, required = false }: {
  label: string; value: string; onChange: (value: string) => void; className?: string;
  type?: "text" | "date"; placeholder?: string; multiline?: boolean; required?: boolean;
}) {
  return <label className={className ? styles.field + " " + className : styles.field}>
    <span>{label}</span>
    {multiline
      ? <textarea rows={3} value={value} onChange={event => onChange(event.target.value)} placeholder={placeholder}/>
      : <input type={type} value={value} onChange={event => onChange(event.target.value)} placeholder={placeholder} required={required}/>}
  </label>;
}

type Props = { mode?: "new" | "edit"; slug?: string; sourceSha?: string; existingMetadata?: Record<string, unknown>; initialForm?: NoteInput };
type Draft = { form: NoteInput; savedAt: string; sourceSha?: string };

export default function NewNoteForm({ mode = "new", slug, sourceSha, existingMetadata, initialForm }: Props) {
  const editing = mode === "edit";
  const [form, setForm] = useState<NoteInput>(() => initialForm || { ...emptyNoteInput, body: templateBody("detailed") });
  const initialSnapshot = useRef(JSON.stringify(initialForm || { ...emptyNoteInput, body: templateBody("detailed") }));
  const publishedSnapshot = useRef("");
  const [pendingDraft, setPendingDraft] = useState<Draft | null>(null);
  const [draftChecked, setDraftChecked] = useState(false);
  const [draftStatus, setDraftStatus] = useState("草稿保存在此浏览器");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [online, setOnline] = useState<boolean | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [login, setLogin] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [backendReady, setBackendReady] = useState(false);
  const [supportsPublicationFields, setSupportsPublicationFields] = useState(false);
  const [backendMessage, setBackendMessage] = useState("");
  const [connectionAttempt, setConnectionAttempt] = useState(0);
  const [redirecting, setRedirecting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState<{ path: string; commitUrl?: string; slug?: string } | null>(null);
  const draftKey = `yingjie-note-draft:v5:${editing ? slug : "new"}`;
  const api = site.apiBaseUrl.replace(/\/$/, "");
  const publicationFieldsBlocked = form.kind === "paper" && !supportsPublicationFields
    && Boolean(form.venueType || form.publicationDate || initialForm?.venueType || initialForm?.publicationDate);
  const publicationFieldsMessage = "保存服务仍是旧版。更新 Worker 后即可保存期刊或会议类型及发布日期。";

  useEffect(() => {
    try {
      const raw = localStorage.getItem(draftKey);
      if (raw) {
        const parsed = JSON.parse(raw) as Draft;
        if (parsed?.form && typeof parsed.form.body === "string") {
          const form = normalizeNoteInput({
            ...parsed.form,
            venueType: parsed.form.venueType ?? initialForm?.venueType,
            publicationDate: parsed.form.publicationDate ?? (parsePublicationDate(parsed.form.year) || initialForm?.publicationDate),
          }, existingMetadata);
          setPendingDraft({ ...parsed, form });
        }
      }
    } catch { setDraftStatus("浏览器无法读取草稿，请及时导出 Markdown"); }
    setDraftChecked(true);
  }, [draftKey, existingMetadata, initialForm?.venueType, initialForm?.publicationDate]);

  useEffect(() => {
    if (!draftChecked || pendingDraft) return;
    const snapshot = JSON.stringify(form);
    if (snapshot === initialSnapshot.current || snapshot === publishedSnapshot.current) return;
    const timer = setTimeout(() => {
      if (snapshot === publishedSnapshot.current) return;
      try {
        localStorage.setItem(draftKey, JSON.stringify({ form, savedAt: new Date().toISOString(), sourceSha }));
        setDraftStatus("草稿已自动保存在本机");
      } catch { setDraftStatus("无法自动保存，请及时导出 Markdown"); }
    }, 650);
    return () => clearTimeout(timer);
  }, [form, draftKey, draftChecked, pendingDraft, sourceSha]);

  useEffect(() => {
    const allowed = canUseNotesApi(window.location.origin);
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
      if (hashToken) localStorage.setItem(NOTE_SESSION_KEY, hashToken);
      if (authError) {
        const errors: Record<string, string> = { not_allowed: "请使用 Liufuyingjie 的 GitHub 账号登录。", invalid_state: "登录校验已过期，请重新登录。", github_error: "GitHub 授权未完成，请重试。" };
        setError(errors[authError] || "登录未完成，请重新尝试。");
      }
      if (hashToken || authError) window.history.replaceState(null, "", window.location.pathname + window.location.search);
      existing = localStorage.getItem(NOTE_SESSION_KEY);
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
        setSupportsPublicationFields(data.capabilities?.includes("paper-publication-fields") === true);
        setBackendMessage(ready ? "" : "保存服务仍是旧版。请先更新 Worker，再发布新模板；你的草稿可以先导出，不会被旧接口截断。");
      } catch {
        if (!cancelled) {
          setBackendReady(false);
          setSupportsPublicationFields(false);
          setBackendMessage("暂时无法连接保存服务。草稿仍保存在本机，可以导出 Markdown 后手动提交 GitHub。");
        }
      }
    }
    async function session() {
      if (!existing) { if (!cancelled) setLogin(null); return; }
      try {
        const response = await fetch(`${api}/api/me`, { headers: { Authorization: `Bearer ${existing}` }, signal: controller.signal });
        if (response.status === 401) {
          clearNoteSession(existing);
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

  function setField<Key extends keyof NoteInput>(key: Key, value: NoteInput[Key]) {
    setForm(current => ({ ...current, [key]: value }));
    setSaved(null);
  }
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
  function logout() { if (token) clearNoteSession(token); setToken(null); setLogin(null); }
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
    if (pendingDraft || saving) return;
    setError(""); setSaved(null);
    if (!form.title.trim()) { setError(form.kind === "paper" ? "请填写论文题目。" : "请填写记录标题。"); return; }
    if (!plainText(form.body.replace(/^#{1,6}[^\n]*$/gm, "")).trim()) { setError("请至少写下一段自己的理解，不能只发布空模板。"); return; }
    if (!online) { setError("预览环境不会写入你的线上仓库，请导出 Markdown，或部署后再登录发布。"); return; }
    if (!token || !login) { setError("草稿已保留，请先使用 GitHub 登录，再发布。"); return; }
    if (!backendReady) { setError("保存服务需要更新或重新连接。为避免正文丢失，本次没有提交任何内容。"); return; }
    if (publicationFieldsBlocked) { setError(publicationFieldsMessage); return; }
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

  const returnHref = editing && slug ? "/papers/" + slug + "/" : "/";
  const canPublish = !saving && !pendingDraft && !authLoading && online && backendReady && !publicationFieldsBlocked && token && login;
  const serviceNotice = backendMessage || (publicationFieldsBlocked ? publicationFieldsMessage : "");

  return <form onSubmit={submit}>
    <header className={styles.header} id="note-writer-top">
      <div>
        <Link className={styles.back} href={returnHref}>{editing ? "返回笔记" : "返回首页"}</Link>
        <h1>{editing ? "编辑笔记" : "写笔记"}</h1>
      </div>
      <div className={styles.publishControls}>
        <span className={styles.draftStatus} aria-live="polite">{draftStatus}</span>
        <div className={styles.headerButtons}>
          <button type="button" className={styles.exportButton} onClick={exportMarkdown}>
            <Icon name="download" width="16" height="16"/>导出 Markdown
          </button>
          <button type="submit" className={"primary-button " + styles.publishButton} disabled={!canPublish}>
            {saving ? "正在提交…" : editing ? "保存修改" : "发布笔记"}
          </button>
        </div>
      </div>
    </header>

    <div className={styles.account}>
      {authLoading ? <span>正在确认保存服务…</span> : online === false ? <span>{backendMessage}</span> : token && login ? <>
        <span>已登录 @{login}</span>
        <button type="button" className={styles.textButton} onClick={logout}>退出登录</button>
      </> : <>
        <span>发布需要站主登录</span>
        <button type="button" className={"github-login-button " + styles.loginButton} onClick={startLogin} disabled={redirecting}>
          <Icon name="github" width="16" height="16"/>{redirecting ? "前往 GitHub…" : "GitHub 登录"}
        </button>
      </>}
    </div>
    {online && serviceNotice && !authLoading && (
      <div className={"writer-message " + styles.notice}>
        <span>{serviceNotice}</span>
        <button type="button" className={styles.textButton} onClick={() => setConnectionAttempt(n => n + 1)}>重新连接</button>
      </div>
    )}
    {pendingDraft && (
      <div className={"draft-recovery " + styles.notice}>
        <span>发现一份本机草稿{pendingDraft.savedAt ? " · " + pendingDraft.savedAt.slice(0, 10) : ""}</span>
        <div className={styles.recoveryButtons}>
          <button type="button" className={styles.textButton} onClick={restoreDraft}>恢复草稿</button>
          <button type="button" className={styles.textButton} onClick={dismissDraft}>使用当前版本</button>
        </div>
      </div>
    )}
    {message && <p className={styles.notice} role="status">{message}</p>}
    {error && <p className={"form-error " + styles.notice + " " + styles.error} role="alert">{error}</p>}
    {saved && (
      <div className={"save-success " + styles.notice} role="status">
        <Icon name="check"/>
        <div>
          <strong>{editing ? "修改已提交，原文章链接不变。" : "笔记已写入 GitHub。"}</strong>
          <p>部署完成后，刷新首页即可看到更新。</p>
          {saved.commitUrl && <a href={saved.commitUrl} target="_blank" rel="noreferrer">查看 GitHub 提交</a>}
        </div>
      </div>
    )}

    <fieldset className={styles.workspace} disabled={!!pendingDraft || saving}>
      {form.kind === "paper" ? (
        <div className={styles.paperInfo} role="group" aria-label="论文信息">
          <div className={styles.paperInfoHeading}>
            <h2>论文信息</h2>
            <a href="#note-markdown-editor" className={styles.skipEditor}>跳到正文</a>
          </div>
          <div className={styles.paperFields}>
            <Field className={styles.paperTitle} label="论文题目" value={form.title}
              onChange={value => setField("title", value)} placeholder="输入论文原题" required/>
            <Field className={styles.paperTitle} label="中文题目" value={form.subtitle}
              onChange={value => setField("subtitle", value)} placeholder="输入中文题目"/>
            <label className={styles.field + " " + styles.venueType}>
              <span>期刊还是会议</span>
              <select value={form.venueType} onChange={event => setField("venueType", parseVenueType(event.target.value))}>
                <option value="">请选择</option>
                <option value="journal">期刊</option>
                <option value="conference">会议</option>
              </select>
            </label>
            <Field className={styles.venueName} label="期刊/会议名称" value={form.journal}
              onChange={value => setField("journal", value)} placeholder="例如 CVPR、TPAMI"/>
            <Field className={styles.publicationDate} label="发布日期" type="date" value={form.publicationDate}
              onChange={value => setField("publicationDate", value)}/>
            <Field className={styles.researchField} label="领域" value={form.tags}
              onChange={value => setField("tags", value)} placeholder="多个领域用逗号分隔"/>
          </div>
        </div>
      ) : (
        <div className={styles.title}>
          <Field label="记录标题" value={form.title} onChange={value => setField("title", value)}
            placeholder="给这个想法起个名字" required/>
        </div>
      )}
      <aside className={styles.settings} aria-label="笔记设置">
        <button type="button" className={styles.settingsToggle} aria-expanded={showSettings}
          aria-controls="note-settings-content" onClick={() => setShowSettings(open => !open)}>
          笔记设置 <span>{templates.find(template => template.id === form.template)?.name}</span>
        </button>
        <div id="note-settings-content" className={styles.settingsContents} data-expanded={showSettings}>
          <section className={styles.templates}>
            <h2>笔记模板</h2>
            <div className={styles.templateList} role="group" aria-label="选择笔记模板">
              {templates.map(template => (
                <button type="button" key={template.id} className={"template-option " + styles.template}
                  onClick={() => chooseTemplate(template.id)} aria-pressed={form.template === template.id}>
                  <strong>{template.name}</strong>
                  <span>{template.hint}</span>
                  {form.template === template.id && <Icon name="check" width="15" height="15"/>}
                </button>
              ))}
            </div>
          </section>
          {form.kind === "journal" && <details className={styles.details}>
            <summary>文章信息 <span>可选</span></summary>
            <div className={styles.metadata}>
              <Field label="一句话理解 / 首页摘要" value={form.summary} onChange={value => setField("summary", value)}
                placeholder="留空时从正文提取" multiline/>
              <Field label="副标题" value={form.subtitle} onChange={value => setField("subtitle", value)}
                placeholder="用一句话概括"/>
              <Field label="主题标签" value={form.tags} onChange={value => setField("tags", value)}
                placeholder="多个标签用逗号分隔"/>
            </div>
          </details>}
        </div>
      </aside>
      <div id="note-markdown-editor" className={styles.editor} tabIndex={-1}>
        <MarkdownWorkspace value={form.body} previewMarkdown={noteBody(form)} onChange={value => setField("body", value)}/>
        <a className={styles.topLink} href="#note-writer-top">回到发布区</a>
      </div>
    </fieldset>
  </form>;
}
