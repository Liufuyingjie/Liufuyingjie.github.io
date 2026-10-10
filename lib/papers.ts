import fs from "node:fs";
import { createHash } from "node:crypto";
import path from "node:path";
import { parse } from "yaml";
import { splitFrontMatter, plainText, type NoteKind, type NoteTemplate } from "../shared/note-format";

export type Paper = {
  slug: string; title: string; subtitle: string; eyebrow: string; date: string;
  readingStatus: string; kind: NoteKind; template: NoteTemplate;
  summary: string; tags: string[]; createdAt: string; updatedAt: string;
  body: string; metadata: Record<string, unknown>; contentSha: string; readMinutes: number; meta: Array<{ label: string; value: string }>;
  sections: Array<{ number: string; title: string; content: string }>;
};

const PAPERS_DIR = path.join(process.cwd(), "content", "papers");
const str = (value: unknown) => value === undefined || value === null ? "" : String(value);

function inferredTags(title: string, data: Record<string, unknown>) {
  const source = `${title} ${str(data.task)} ${str(data.model)}`;
  const result: string[] = [];
  if (/fine.grained|细[粒致]度|FGIR/i.test(source)) result.push("细粒度图像检索");
  if (/ViT|Transformer/i.test(source)) result.push("Vision Transformer");
  if (/DINO|foundation/i.test(source)) result.push("视觉基础模型");
  if (/distill|蒸馏/i.test(source)) result.push("知识蒸馏");
  if (/VPR|place recognition|AnyLoc/i.test(source)) result.push("视觉位置识别");
  if (/patch/i.test(source)) result.push("Patch Tokens");
  if (/哈希|hash|EET/i.test(source)) result.push("深度哈希");
  if (!result.length && data.kind === "journal") result.push("研究随记");
  if (!result.length) result.push("图像检索");
  return result;
}

function parsePaperFile(filename: string): Paper {
  const raw = fs.readFileSync(path.join(PAPERS_DIR, filename), "utf8");
  const contentSha = createHash("sha1").update(`blob ${Buffer.byteLength(raw)}\0`).update(raw).digest("hex");
  const { header, body } = splitFrontMatter(raw);
  const data = (header ? parse(header) : {}) as Record<string, unknown>;
  if (!data || typeof data !== "object" || Array.isArray(data)) throw new Error(`${filename}: 无效的 Markdown 元数据`);
  const slug = str(data.slug) || filename.replace(/\.md$/, "");
  const title = str(data.title) || "未命名记录";
  const kind = data.kind === "journal" ? "journal" : "paper";
  const template = data.template === "quick" || data.template === "free" ? data.template : "detailed";
  const metaFields: Array<[string, unknown]> = [
    ["发表期刊", data.journal], ["发表年份 / 卷期", data.year], ["作者", data.authors], ["单位", data.affiliation],
    ["论文链接", data.paperUrl], ["开源代码", data.code], ["核心任务", data.task], ["模型名称", data.model],
  ];
  const meta = metaFields.filter(([, value]) => str(value).trim()).map(([label, value]) => ({ label, value: str(value).trim() }));
  const sections: Paper["sections"] = [];
  const matches = [...body.matchAll(/^##\s+(0[1-9])\s+(.+)$/gm)];
  matches.forEach((match, i) => sections.push({ number: match[1], title: match[2], content: body.slice((match.index || 0) + match[0].length, matches[i + 1]?.index ?? body.length).trim() }));
  const summarySource = str(data.summary) || sections.find(s => s.number === "02")?.content || body.replace(/^##\s+01[\s\S]*?(?=^##\s+|$)/m, "");
  const summary = plainText(summarySource).slice(0, 160);
  const suppliedTags = Array.isArray(data.tags) ? data.tags.map(str) : str(data.tags).split(/[,，;；]/);
  const tags = [...new Set(suppliedTags.map(s => s.trim()).filter(Boolean))];
  const text = plainText(body);
  const chinese = (text.match(/[\u3400-\u9fff]/g) || []).length;
  const english = text.replace(/[\u3400-\u9fff]/g, " ").split(/\s+/).filter(Boolean).length;
  return {
    slug, title, subtitle: str(data.subtitle), eyebrow: str(data.eyebrow) || "Paper Note",
    date: str(data.date || data.year), readingStatus: str(data.readingStatus) || (kind === "paper" ? "阅读笔记" : "研究随记"),
    kind, template, summary, tags: tags.length ? tags : inferredTags(title, data),
    createdAt: str(data.createdAt), updatedAt: str(data.updatedAt), body, metadata: data, contentSha, readMinutes: Math.max(1, Math.ceil(chinese / 450 + english / 220)), meta, sections,
  };
}

export function getAllPapers(): Paper[] {
  if (!fs.existsSync(PAPERS_DIR)) return [];
  return fs.readdirSync(PAPERS_DIR).filter(f => f.endsWith(".md") && !f.startsWith("_"))
    .map(parsePaperFile).sort((a, b) => {
      const aDate = a.createdAt || a.date;
      const bDate = b.createdAt || b.date;
      return bDate.localeCompare(aDate) || a.title.localeCompare(b.title);
    });
}
export const papers = getAllPapers();
export function getPaper(slug: string) { return papers.find(p => p.slug === slug); }
export function getTags() {
  const counts = new Map<string, number>();
  getAllPapers().forEach(p => p.tags.forEach(t => counts.set(t, (counts.get(t) || 0) + 1)));
  return [...counts].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}
export function archiveYear(paper: Paper) { return (paper.createdAt || paper.date).match(/(?:19|20)\d{2}/)?.[0] || "未注明年份"; }
