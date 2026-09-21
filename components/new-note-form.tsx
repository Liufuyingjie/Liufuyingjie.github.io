"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { site } from "../data/site";

export type PaperFormState = {
  title: string;
  subtitle: string;
  journal: string;
  year: string;
  authors: string;
  affiliation: string;
  code: string;
  task: string;
  model: string;
  problem: string;
  solution: string;
  pipeline: string;
  innovations: string;
  experiments: string;
  extensions: string;
};

export const emptyPaperForm: PaperFormState = {
  title: "",
  subtitle: "",
  journal: "",
  year: "",
  authors: "",
  affiliation: "",
  code: "",
  task: "",
  model: "",
  problem: "",
  solution: "",
  pipeline: "",
  innovations: "",
  experiments: "",
  extensions: "",
};

function Field({
  label,
  value,
  onChange,
  placeholder,
  multiline = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  multiline?: boolean;
}) {
  return (
    <label className="note-field">
      <span>{label}</span>
      {multiline ? (
        <textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={8} />
      ) : (
        <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
      )}
    </label>
  );
}

function normalizeApiBaseUrl(value: string) {
  return value.replace(/\/$/, "");
}

type NewNoteFormProps = {
  mode?: "new" | "edit";
  slug?: string;
  initialForm?: PaperFormState;
};

export default function NewNoteForm({ mode = "new", slug, initialForm = emptyPaperForm }: NewNoteFormProps) {
  const editing = mode === "edit";
  const [form, setForm] = useState<PaperFormState>(initialForm);
  const [token, setToken] = useState<string | null>(null);
  const [login, setLogin] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState<{ path: string; commitUrl?: string } | null>(null);
  const [error, setError] = useState("");

  const apiBaseUrl = useMemo(() => normalizeApiBaseUrl(site.apiBaseUrl), []);
  const configured = !apiBaseUrl.includes("YOUR-WORKER.workers.dev");

  useEffect(() => {
    const params = new URLSearchParams(window.location.hash.slice(1));
    const hashToken = params.get("auth");
    const authError = params.get("auth_error");
    if (hashToken) {
      localStorage.setItem("yingjie-research-session", hashToken);
      window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);
    } else if (authError) {
      const messages: Record<string, string> = {
        not_allowed: "这个 GitHub 账号没有写入权限，请使用 Liufuyingjie 登录。",
        invalid_state: "登录状态校验失败，请重新点击 GitHub 登录。",
        github_error: "GitHub 授权没有完成，请重新尝试。",
      };
      setError(messages[authError] || "GitHub 登录失败，请重新尝试。 ");
      window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);
    }

    const existing = localStorage.getItem("yingjie-research-session");
    if (!existing || !configured) {
      setToken(existing);
      setAuthLoading(false);
      return;
    }

    setToken(existing);
    fetch(`${apiBaseUrl}/api/me`, {
      headers: { Authorization: `Bearer ${existing}` },
    })
      .then(async (response) => {
        if (!response.ok) throw new Error("session-invalid");
        return response.json() as Promise<{ login: string }>;
      })
      .then((data) => setLogin(data.login))
      .catch(() => {
        localStorage.removeItem("yingjie-research-session");
        setToken(null);
        setLogin(null);
      })
      .finally(() => setAuthLoading(false));
  }, [apiBaseUrl, configured]);

  const set = (key: keyof PaperFormState) => (value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const loginReturnPath = editing && slug ? `/papers/${encodeURIComponent(slug)}/edit/` : "/new/";

  const startLogin = () => {
    const returnTo = `${window.location.origin}${loginReturnPath}`;
    window.location.href = `${apiBaseUrl}/auth/login?return_to=${encodeURIComponent(returnTo)}`;
  };

  const logout = () => {
    localStorage.removeItem("yingjie-research-session");
    setToken(null);
    setLogin(null);
    setSaved(null);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSaved(null);

    if (!token) {
      setError("请先使用 GitHub 登录。 ");
      return;
    }
    if (!form.title.trim()) {
      setError("请至少填写论文标题。 ");
      return;
    }
    if (!configured) {
      setError("还没有配置后端地址，请先在 data/site.ts 中填写 Cloudflare Worker 地址。 ");
      return;
    }
    if (editing && !slug) {
      setError("缺少论文标识，无法编辑。 ");
      return;
    }

    setSaving(true);
    try {
      const endpoint = editing ? `${apiBaseUrl}/api/papers/${encodeURIComponent(slug as string)}` : `${apiBaseUrl}/api/papers`;
      const response = await fetch(endpoint, {
        method: editing ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "X-Research-Notes-Request": editing ? "edit-paper" : "save-paper",
        },
        body: JSON.stringify(form),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem("yingjie-research-session");
          setToken(null);
          setLogin(null);
        }
        throw new Error(data.error || (editing ? "更新失败，请稍后重试。" : "保存失败，请稍后重试。 "));
      }

      setSaved({ path: data.path, commitUrl: data.commitUrl });
      if (!editing) setForm(emptyPaperForm);
    } catch (err) {
      setError(err instanceof Error ? err.message : (editing ? "更新失败，请稍后重试。" : "保存失败，请稍后重试。 "));
    } finally {
      setSaving(false);
    }
  };

  if (authLoading) {
    return <div className="auth-card auth-card-loading">正在确认登录状态…</div>;
  }

  if (!configured) {
    return (
      <div className="auth-card">
        <span className="auth-mark">01</span>
        <div>
          <p className="section-label">还差一步</p>
          <h2>先连接你的保存服务</h2>
          <p>部署 Cloudflare Worker 后，把地址写进 <code>data/site.ts</code> 的 <code>apiBaseUrl</code>。</p>
        </div>
      </div>
    );
  }

  if (!token || !login) {
    return (
      <div className="auth-card">
        <span className="auth-mark">01</span>
        <div>
          <p className="section-label">仅作者可写</p>
          <h2>{editing ? "使用 GitHub 登录后编辑" : "使用 GitHub 登录后新增"}</h2>
          <p>只有 GitHub 账号 <strong>Liufuyingjie</strong> 可以修改这个网站的论文记录。</p>
          <button type="button" className="primary-button auth-button" onClick={startLogin}>
            使用 GitHub 登录 <span>↗</span>
          </button>
        </div>
      </div>
    );
  }

  const sections: Array<[string, string, keyof PaperFormState, string]> = [
    ["02", "论文要解决的核心问题", "problem", "记录现有方法的不足、具体瓶颈，以及作者为什么要解决这个问题。"],
    ["03", "核心解决方案", "solution", "按照模块拆解整篇方法，用自己的话说明它是怎么解决问题的。"],
    ["04", "训练 / 推理完整流程", "pipeline", "从输入开始写清训练与推理的完整路径、损失函数和检索流程。"],
    ["05", "核心创新点", "innovations", "记录关键设计，并说明每个设计解决了什么问题。"],
    ["06", "实验效果", "experiments", "写清数据集、指标、baseline、性能变化以及消融实验。"],
    ["07", "适用场景与扩展", "extensions", "记录适用范围、局限、可迁移设计，以及读完后的疑问。"],
  ];

  return (
    <form className="new-note-form" onSubmit={handleSubmit}>
      <div className="auth-strip">
        <div>
          <span className="auth-dot" />
          已登录 {login}
        </div>
        <button type="button" onClick={logout}>退出</button>
      </div>

      <div className="form-section">
        <div className="form-section-heading">
          <span>01</span>
          <div>
            <p className="section-label">PAPER BASICS</p>
            <h2>论文基础信息</h2>
          </div>
        </div>
        <div className="field-grid two">
          <Field label="论文标题" value={form.title} onChange={set("title")} placeholder="Rethinking Vision Transformer..." />
          <Field label="中文标题" value={form.subtitle} onChange={set("subtitle")} placeholder="可选" />
          <Field label="发表期刊" value={form.journal} onChange={set("journal")} placeholder="IEEE Transactions on Multimedia" />
          <Field label="发表年份 / 卷期" value={form.year} onChange={set("year")} placeholder="2026 · Vol. 28" />
          <Field label="作者" value={form.authors} onChange={set("authors")} placeholder="作者姓名" />
          <Field label="单位" value={form.affiliation} onChange={set("affiliation")} placeholder="学校 / 实验室 / 机构" />
          <Field label="开源代码" value={form.code} onChange={set("code")} placeholder="GitHub / 项目主页" />
          <Field label="核心任务" value={form.task} onChange={set("task")} placeholder="图像检索 / VPR / FGIR ..." />
          <Field label="模型名称" value={form.model} onChange={set("model")} placeholder="方法或模型名称" />
        </div>
      </div>

      {sections.map(([number, title, key, placeholder]) => (
        <div className="form-section" key={number}>
          <div className="form-section-heading">
            <span>{number}</span>
            <div>
              <p className="section-label">RESEARCH NOTE</p>
              <h2>{title}</h2>
            </div>
          </div>
          <Field
            label="笔记内容"
            value={form[key]}
            onChange={set(key)}
            placeholder={placeholder}
            multiline
          />
          <p className="form-hint">支持 Markdown：空一行分段，使用 # / ## / - / ``` 等语法可以让阅读页面保持结构感。</p>
        </div>
      ))}

      {error && <p className="form-error">{error}</p>}
      {saved && (
        <div className="save-success">
          <span className="success-mark">✓</span>
          <div>
            <strong>{editing ? "论文记录已更新" : "已经写入 GitHub"}</strong>
            <p>{saved.path} 已提交，GitHub Actions 会自动重新构建网站。</p>
          </div>
          {saved.commitUrl && <a href={saved.commitUrl} target="_blank" rel="noreferrer">查看提交 ↗</a>}
        </div>
      )}

      <div className="form-actions">
        <Link className="secondary-link" href={editing && slug ? `/papers/${slug}/` : "/#notes"}>取消</Link>
        <button className="primary-button" type="submit" disabled={saving}>
          {saving ? (editing ? "正在更新…" : "正在保存…") : (editing ? "保存修改" : "保存论文记录")} <span>↗</span>
        </button>
      </div>
      <p className="storage-note">{editing ? "保存后会更新 GitHub 仓库中的原始 Markdown 笔记，并触发 GitHub Pages 自动部署。" : "保存后会在 GitHub 仓库创建一份 Markdown 笔记，并触发 GitHub Pages 自动部署。"}</p>
    </form>
  );
}
