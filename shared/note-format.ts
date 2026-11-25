export type NoteKind = "paper" | "journal";
export type NoteTemplate = "detailed" | "quick" | "free";
export type VenueType = "" | "journal" | "conference";

export type NoteInput = {
  title: string; subtitle: string; summary: string; tags: string;
  kind: NoteKind; template: NoteTemplate; readingStatus: string;
  journal: string; venueType: VenueType; publicationDate: string;
  year: string; authors: string; affiliation: string;
  paperUrl: string; code: string; task: string; model: string; body: string;
};

export const emptyNoteInput: NoteInput = {
  title: "", subtitle: "", summary: "", tags: "", kind: "paper", template: "detailed",
  readingStatus: "阅读笔记", journal: "", venueType: "", publicationDate: "", year: "", authors: "", affiliation: "",
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

const paperDetailFields = [
  ["发表年份 / 卷期", "year"], ["作者", "authors"], ["单位", "affiliation"],
  ["论文链接", "paperUrl"], ["开源代码", "code"], ["核心任务", "task"], ["模型名称", "model"],
] as const;

export function parseVenueType(value: unknown): VenueType {
  return value === "journal" || value === "conference" ? value : "";
}

export function parsePublicationDate(value: unknown): string {
  if (typeof value !== "string") return "";
  const date = value.trim();
  if (!/^(?!0000)\d{4}-\d{2}-\d{2}$/.test(date)) return "";
  const midnight = new Date(`${date}T00:00:00Z`);
  return Number.isFinite(midnight.getTime()) && midnight.toISOString().slice(0, 10) === date ? date : "";
}

export function templateBody(template: NoteTemplate) {
  if (template === "detailed") return paperSections.map(([n, title]) => `## ${n} ${title}\n\n`).join("\n");
  if (template === "quick") return "## 一句话理解\n\n\n## 问题与方法\n\n\n## 证据与局限\n\n\n## 我的疑问 / 下一步\n\n";
  return "## 从一个问题开始\n\n\n## 我的理解\n\n\n## 接下来\n\n";
}

export function splitFrontMatter(raw: string) {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)([\s\S]*)$/);
  return match ? { header: match[1], body: match[2] } : { header: "", body: raw };
}

export function normalizeNoteInput(input: Record<string, unknown>, existing?: Record<string, unknown>): NoteInput {
  const result = { ...emptyNoteInput };
  for (const key of Object.keys(emptyNoteInput) as Array<keyof NoteInput>) {
    if (key === "kind" || key === "template" || key === "venueType" || key === "publicationDate") continue;
    if (typeof input[key] === "string") result[key] = key === "body" ? input[key] as string : (input[key] as string).trim();
  }
  for (const [, key] of paperDetailFields) {
    if (input[key] === undefined && existing?.[key] != null) result[key] = String(existing[key]).trim();
  }
  result.kind = input.kind === "journal" ? "journal" : "paper";
  result.template = input.template === "quick" || input.template === "free" ? input.template : "detailed";
  result.venueType = parseVenueType(input.venueType ?? existing?.venueType);
  const legacyDate = result.kind === "paper" && existing?.kind !== "journal"
    ? parsePublicationDate(result.year) || parsePublicationDate(existing?.year) || existing?.date
    : "";
  result.publicationDate = parsePublicationDate(input.publicationDate ?? existing?.publicationDate ?? legacyDate);
  if (typeof input.body !== "string") {
    result.body = paperSections.map(([n, title, key]) => `## ${n} ${title}\n\n${typeof input[key] === "string" ? (input[key] as string).trim() : ""}`).join("\n\n") + "\n";
  }
  return result;
}

export function paperBasics(input: NoteInput) {
  const publicationDate = parsePublicationDate(input.publicationDate);
  const venueType = input.venueType === "conference" ? "会议" : input.venueType === "journal" ? "期刊" : "";
  const fields = [
    ["论文标题", input.title], ["中文标题", input.subtitle], ["发表类型", venueType],
    ["期刊 / 会议名称", input.journal], ["发表日期", publicationDate],
    ...paperDetailFields.map(([label, key]) => {
      const value = input[key];
      if (key === "year" && publicationDate && (/^\d{4}$/.test(value) || parsePublicationDate(value))) return [label, ""];
      return [label, value];
    }),
  ];
  return "## 01 论文基础信息\n\n" + fields.filter(([, value]) => value.trim()).map(([label, value]) => `- **${label}：** ${value}`).join("\n") + "\n\n";
}

export function noteBody(input: NoteInput) {
  let body = input.body;
  if (input.kind === "paper" && input.template === "detailed") {
    const basics = paperBasics(input);
    const section = /^##\s+01\s+论文基础信息[^\n]*\n[\s\S]*?(?=^##\s+(?:0[2-9]|[1-9]\d)\s+|$(?![\s\S]))/m;
    if (section.test(body)) body = body.replace(section, (original) => {
      const replaced = new Set(["论文标题", "中文标题", "发表期刊", "期刊 / 会议名称", "发表类型", "发表日期"]);
      for (const [label, key] of paperDetailFields) {
        if (input[key].trim()) replaced.add(label);
      }
      const extra = original.replace(/^##\s+01\s+论文基础信息[^\n]*\n/, "")
        .replace(/^- \*\*([^：\r\n]+)：\*\*[^\n]*\n?/gm, (line, label: string) => replaced.has(label) ? "" : line)
        .trim();
      return basics + (extra ? extra + "\n\n" : "");
    });
    else body = basics + body.replace(/^\s*\n/, "");
  }
  return body.endsWith("\n") ? body : body + "\n";
}

export function buildNoteMarkdown(input: NoteInput, slug: string, existing?: Record<string, unknown>, now = new Date().toISOString()) {
  const publicationDate = parsePublicationDate(input.publicationDate);
  const publicationYear = publicationDate.slice(0, 4) || input.year.match(/\b(?:19|20)\d{2}\b/)?.[0];
  const previousDate = String(existing?.date || now.slice(0, 4));
  const date = input.kind === "paper"
    ? publicationYear || parsePublicationDate(previousDate).slice(0, 4) || previousDate
    : String(existing?.createdAt || now).slice(0, 10);
  const data: Record<string, unknown> = {
    ...existing, slug, title: input.title.trim(), subtitle: input.subtitle, kind: input.kind,
    template: input.template, summary: input.summary, tags: input.tags.split(/[,，;；\n]/).map(s => s.trim()).filter(Boolean),
    ...(input.kind === "paper" ? { venueType: input.venueType, publicationDate } : {}),
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
