"use client";

import Link from "next/link";
import { useState } from "react";
import { appendLocalPaper, splitParagraphs } from "../lib/local-notes";
import type { Paper } from "../data/papers";

const initial = {
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

type FormState = typeof initial;

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
        <textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={7} />
      ) : (
        <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
      )}
    </label>
  );
}

export default function NewNoteForm() {
  const [form, setForm] = useState<FormState>(initial);
  const [error, setError] = useState("");

  const set = (key: keyof FormState) => (value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (!form.title.trim()) {
      setError("请至少填写论文标题。");
      return;
    }

    const slug = `note-${Date.now()}`;
    const newPaper: Paper = {
      slug,
      title: form.title.trim(),
      subtitle: form.subtitle.trim(),
      eyebrow: "Paper Note · 本地记录",
      date: form.year.trim() || new Date().getFullYear().toString(),
      readingStatus: "Reading note",
      meta: [
        ["发表期刊", form.journal],
        ["发表年份 / 卷期", form.year],
        ["作者", form.authors],
        ["单位", form.affiliation],
        ["开源代码", form.code],
        ["核心任务", form.task],
        ["模型名称", form.model],
      ]
        .filter(([, value]) => value.trim())
        .map(([label, value]) => ({ label, value: value.trim() })),
      sections: [
        ["02", "论文要解决的核心问题", form.problem],
        ["03", "核心解决方案", form.solution],
        ["04", "训练 / 推理完整流程", form.pipeline],
        ["05", "核心创新点", form.innovations],
        ["06", "实验效果", form.experiments],
        ["07", "适用场景与扩展", form.extensions],
      ].map(([number, title, content]) => ({
        number,
        title,
        content: splitParagraphs(content),
      })),
    };

    appendLocalPaper(newPaper);
    window.dispatchEvent(new Event("paper-notes-updated"));
    window.location.href = "/#notes";
  };

  return (
    <form className="new-note-form" onSubmit={handleSubmit}>
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

      {[
        ["02", "论文要解决的核心问题", "problem", "记录现有方法的不足、具体瓶颈，以及作者为什么要解决这个问题。"],
        ["03", "核心解决方案", "solution", "按照模块拆解整篇方法，用自己的话说明它是怎么解决问题的。"],
        ["04", "训练 / 推理完整流程", "pipeline", "从输入开始写清训练与推理的完整路径、损失函数和检索流程。"],
        ["05", "核心创新点", "innovations", "建议按 3–5 个关键设计记录，并说明每个设计解决了什么问题。"],
        ["06", "实验效果", "experiments", "写清数据集、指标、baseline、性能变化以及消融实验。"],
        ["07", "适用场景与扩展", "extensions", "记录适用范围、局限、可迁移设计，以及读完之后自己的疑问。"],
      ].map(([number, title, key, placeholder]) => (
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
            value={form[key as keyof FormState]}
            onChange={set(key as keyof FormState)}
            placeholder={placeholder}
            multiline
          />
          <p className="form-hint">段落之间空一行，网页会自动按段落排版。</p>
        </div>
      ))}

      {error && <p className="form-error">{error}</p>}

      <div className="form-actions">
        <Link className="secondary-link" href="/#notes">取消</Link>
        <button className="primary-button" type="submit">保存论文记录 <span>↗</span></button>
      </div>
      <p className="storage-note">记录会保存在当前浏览器中。GitHub Pages 本身是静态网站，不会自动把这里的内容写回 GitHub 仓库。</p>
    </form>
  );
}
