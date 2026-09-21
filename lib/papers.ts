import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

export type Paper = {
  slug: string;
  title: string;
  subtitle: string;
  eyebrow: string;
  date: string;
  readingStatus: string;
  meta: Array<{ label: string; value: string }>;
  sections: Array<{
    number: string;
    title: string;
    content: string;
  }>;
};

const PAPERS_DIR = path.join(process.cwd(), "content", "papers");

const SECTION_DEFINITIONS = [
  ["02", "论文要解决的核心问题"],
  ["03", "核心解决方案"],
  ["04", "训练 / 推理完整流程"],
  ["05", "核心创新点"],
  ["06", "实验效果"],
  ["07", "适用场景与扩展"],
] as const;

function parsePaperFile(filename: string): Paper {
  const raw = fs.readFileSync(path.join(PAPERS_DIR, filename), "utf8");
  const { data, content } = matter(raw);

  const slug = String(data.slug || filename.replace(/\.md$/, ""));
  const title = String(data.title || "未命名论文");
  const subtitle = String(data.subtitle || "");
  const eyebrow = String(data.eyebrow || "Paper Note");
  const date = String(data.date || data.year || "");
  const readingStatus = String(data.readingStatus || "阅读笔记");

  const metaFields: Array<[string, string | undefined]> = [
    ["发表期刊", data.journal],
    ["发表年份 / 卷期", data.year],
    ["作者", data.authors],
    ["单位", data.affiliation],
    ["开源代码", data.code],
    ["核心任务", data.task],
    ["模型名称", data.model],
  ];

  const meta = metaFields
    .filter(([, value]) => value !== undefined && String(value).trim())
    .map(([label, value]) => ({ label, value: String(value).trim() }));

  const sectionBodies = new Map<string, string>();
  const sectionRegex = /^##\s+(02|03|04|05|06|07)\s+(.+)$/gm;
  const matches = [...content.matchAll(sectionRegex)];

  for (let index = 0; index < matches.length; index += 1) {
    const match = matches[index];
    const number = match[1];
    const start = (match.index ?? 0) + match[0].length;
    const end = index + 1 < matches.length ? matches[index + 1].index ?? content.length : content.length;
    sectionBodies.set(number, content.slice(start, end).trim());
  }

  const sections = SECTION_DEFINITIONS.map(([number, sectionTitle]) => ({
    number,
    title: sectionTitle,
    content: sectionBodies.get(number) || "",
  }));

  return { slug, title, subtitle, eyebrow, date, readingStatus, meta, sections };
}

export function getAllPapers(): Paper[] {
  if (!fs.existsSync(PAPERS_DIR)) return [];

  return fs
    .readdirSync(PAPERS_DIR)
    .filter((filename) => filename.endsWith(".md") && !filename.startsWith("_"))
    .map(parsePaperFile)
    .sort((a, b) => {
      const date = b.date.localeCompare(a.date);
      return date || a.title.localeCompare(b.title);
    });
}

export const papers = getAllPapers();

export function getPaper(slug: string) {
  return papers.find((paper) => paper.slug === slug);
}
