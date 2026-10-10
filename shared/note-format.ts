export type NoteKind = "paper" | "journal";
export type NoteTemplate = "detailed" | "quick" | "free";

export type NoteInput = {
  title: string; subtitle: string; summary: string; tags: string;
  kind: NoteKind; template: NoteTemplate; readingStatus: string;
  journal: string; year: string; authors: string; affiliation: string;
  paperUrl: string; code: string; task: string; model: string; body: string;
};

export const emptyNoteInput: NoteInput = {
  title: "", subtitle: "", summary: "", tags: "", kind: "paper", template: "detailed",
  readingStatus: "阅读笔记", journal: "", year: "", authors: "", affiliation: "",
  paperUrl: "", code: "", task: "", model: "", body: "",
};

export const paperSections = [
  ["02", "论文要解决的核心问题", "problem"],
  ["03", "核心解决方案", "solution"],
  ["04", "训练 / 推理完整流程", "pipeline"],
  ["05", "核心创新点", "innovations"],
  ["06", "实验效果", "experiments"],
  ["07", "适用场景与扩展", "extensions"],
] as const;

export function templateBody(template: NoteTemplate) {
  if (template === "detailed") return paperSections.map(([n, title]) => `## ${n} ${title}\n\n`).join("\n");
  if (template === "quick") return "## 一句话理解\n\n\n## 问题与方法\n\n\n## 证据与局限\n\n\n## 我的疑问 / 下一步\n\n";
  return "## 从一个问题开始\n\n\n## 我的理解\n\n\n## 接下来\n\n";
}

export function splitFrontMatter(raw: string) {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)([\s\S]*)$/);
  return match ? { header: match[1], body: match[2] } : { header: "", body: raw };
}

export function normalizeNoteInput(input: Record<string, unknown>): NoteInput {
  const result = { ...emptyNoteInput };
  for (const key of Object.keys(emptyNoteInput) as Array<keyof NoteInput>) {
    if (key === "kind" || key === "template") continue;
    if (typeof input[key] === "string") result[key] = key === "body" ? input[key] as string : (input[key] as string).trim();
  }
  result.kind = input.kind === "journal" ? "journal" : "paper";
  result.template = input.template === "quick" || input.template === "free" ? input.template : "detailed";
  if (typeof input.body !== "string") {
    result.body = paperSections.map(([n, title, key]) => `## ${n} ${title}\n\n${typeof input[key] === "string" ? (input[key] as string).trim() : ""}`).join("\n\n") + "\n";
  }
  return result;
}

export function paperBasics(input: NoteInput) {
  const fields = [
    ["论文标题", input.title], ["中文标题", input.subtitle], ["发表期刊", input.journal],
    ["发表年份 / 卷期", input.year], ["作者", input.authors], ["单位", input.affiliation],
    ["论文链接", input.paperUrl], ["开源代码", input.code], ["核心任务", input.task], ["模型名称", input.model],
  ];
  return "## 01 论文基础信息\n\n" + fields.filter(([, value]) => value.trim()).map(([label, value]) => `- **${label}：** ${value}`).join("\n") + "\n\n";
}

export function noteBody(input: NoteInput) {
  let body = input.body;
  if (input.kind === "paper" && input.template === "detailed") {
    const basics = paperBasics(input);
    const section = /^##\s+01\s+论文基础信息[^\n]*\n[\s\S]*?(?=^##\s+(?:0[2-9]|[1-9]\d)\s+|$(?![\s\S]))/m;
    if (section.test(body)) body = body.replace(section, (original) => {
      const known = /^(?:- \*\*(?:论文标题|中文标题|发表期刊|发表年份 \/ 卷期|作者|单位|论文链接|开源代码|核心任务|模型名称)：\*\*.*|##\s+01\s+论文基础信息.*)$/gm;
      const extra = original.replace(known, "").trim();
      return basics + (extra ? extra + "\n\n" : "");
    });
    else body = basics + body.replace(/^\s*\n/, "");
  }
  return body.endsWith("\n") ? body : body + "\n";
}

export function buildNoteMarkdown(input: NoteInput, slug: string, existing?: Record<string, unknown>, now = new Date().toISOString()) {
  const publicationYear = input.year.match(/\b(?:19|20)\d{2}\b/)?.[0] || "";
  const date = input.kind === "paper" ? (publicationYear || String(existing?.date || now.slice(0, 4))) : String(existing?.createdAt || now).slice(0, 10);
  const data: Record<string, unknown> = {
    ...existing, slug, title: input.title.trim(), subtitle: input.subtitle, kind: input.kind,
    template: input.template, summary: input.summary, tags: input.tags.split(/[,，;；\n]/).map(s => s.trim()).filter(Boolean),
    eyebrow: input.kind === "journal" ? "Research Journal" : `Paper Note · ${date}`,
    date, year: input.year, journal: input.journal, authors: input.authors, affiliation: input.affiliation,
    paperUrl: input.paperUrl, code: input.code, task: input.task, model: input.model,
    readingStatus: input.readingStatus || (input.kind === "journal" ? "研究随记" : "阅读笔记"),
    updatedAt: now,
  };
  if (!existing) data.createdAt = now;
  const header = Object.entries(data).filter(([, v]) => v !== undefined).map(([k, v]) => `${JSON.stringify(k)}: ${JSON.stringify(v)}`).join("\n");
  return `---\n${header}\n---\n\n${noteBody(input).replace(/^\n/, "")}`;
}

export function plainText(markdown: string) {
  return markdown.replace(/```[\s\S]*?```/g, " ").replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1").replace(/<[^>]+>/g, " ")
    .replace(/^\s{0,3}(?:#{1,6}|>|[-*+]\s|\d+\.\s)\s*/gm, "")
    .replace(/[*_`~]/g, "").replace(/\s+/g, " ").trim();
}
