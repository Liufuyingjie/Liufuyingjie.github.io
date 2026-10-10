import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { parse } from "yaml";
import { getAllPapers } from "../lib/papers";
import { buildNoteMarkdown, emptyNoteInput, normalizeNoteInput, splitFrontMatter, templateBody } from "../shared/note-format";
import { renderMarkdown } from "../lib/markdown";

const originalSlugs = [
  "eet", "an-image-is-worth-16x16-words-transformers-for-image-recognition-at-scal-1789998208583-fsoj8z",
  "anyloc-towards-universal-visual-place-recognition-1791510047892-h3hd36",
  "dit-distill-open-set-fine-grained-retrieval-via-generative-curriculum-kn-1789993613086-2nld72",
  "efficient-fine-grained-image-retrieval-with-vision-foundation-models-for-1789982572950-nm5wcq",
  "fine-grained-image-retrieval-via-dual-vision-adaptation-1790064199413-v4zi9r", "patch-1791535305273-r1mwk6",
];

test("all original records and URLs remain available; Markdown body is not filtered by a template", () => {
  const papers = getAllPapers();
  for (const slug of originalSlugs) {
    const paper = papers.find(p => p.slug === slug); assert.ok(paper, slug);
    const raw = fs.readFileSync(path.join(process.cwd(), "content", "papers", `${slug}.md`), "utf8");
    assert.equal(paper.body, splitFrontMatter(raw).body);
    assert.ok(paper.contentSha.match(/^[0-9a-f]{40}$/));
  }
  assert.equal(new Set(papers.map(p => p.slug)).size, papers.length);
  for (const paper of papers) { assert.match(paper.slug, /^[a-z0-9][a-z0-9-]*$/i); assert.ok(fs.existsSync(path.join(process.cwd(), "content", "papers", `${paper.slug}.md`)), "文件名必须与 slug 对应，保证网页编辑能够找到原文件"); }
});

test("old API requests still generate their original six sections", () => {
  const input = normalizeNoteInput({ title: "Test", year: "2026", problem: "Problem", solution: "Answer", extensions: "A new question" });
  const raw = buildNoteMarkdown(input, "test");
  assert.match(raw, /## 02 论文要解决的核心问题\n\nProblem/);
  assert.match(raw, /## 07 适用场景与扩展\n\nA new question/);
});

test("free journals keep complete arbitrary Markdown and unknown metadata on edit", () => {
  const body = "## A custom title\n\nMy idea.\n\n| A | B |\n|---|---|\n| 1 | 2 |\n\n```py\nprint('ok')\n```\n";
  const input = { ...emptyNoteInput, kind: "journal" as const, template: "free" as const, title: "Journal", body };
  const old = { customField: ["one", "two"], createdAt: "2026-01-03T00:00:00.000Z", slug: "journal" };
  const result = splitFrontMatter(buildNoteMarkdown(input, "journal", old, "2026-10-10T12:00:00.000Z"));
  assert.equal(result.body.trim(), body.trim());
  const data = parse(result.header); assert.deepEqual(data.customField, old.customField); assert.equal(data.createdAt, old.createdAt);
  assert.equal(data.kind, "journal"); assert.equal(data.updatedAt, "2026-10-10T12:00:00.000Z");
});

test("structured edits update metadata, retain custom text, and do not duplicate section 01", () => {
  const input = { ...emptyNoteInput, title: "Updated", body: "## 01 论文基础信息\n\n- **论文标题：** Original\n\nA custom annotation.\n\n## 02 论文要解决的核心问题\n\nKept exactly.\n" };
  const body = splitFrontMatter(buildNoteMarkdown(input, "test")).body;
  assert.equal((body.match(/## 01 论文基础信息/g) || []).length, 1);
  assert.match(body, /Updated/); assert.match(body, /A custom annotation/); assert.match(body, /Kept exactly/);
});

test("rendering safely handles Markdown, headings, tables and dangerous HTML", () => {
  const { html, headings } = renderMarkdown('## Heading\n\n[link](https://example.com)\n\n<script>alert(1)</script><img src="x" onerror="alert(1)">\n\n| A | B |\n|---|---|\n|1|2|');
  assert.equal(headings[0].id, "heading-1"); assert.ok(html.includes('id="heading-1"'));
  assert.ok(html.includes('class="table-scroll"')); assert.ok(html.includes('rel="noopener noreferrer"'));
  assert.ok(!html.includes("<script")); assert.ok(!html.includes("onerror"));
});

test("all three starter templates are selectable and detailed paper metadata is preserved", () => {
  for (const t of ["detailed", "quick", "free"] as const) assert.ok(templateBody(t).includes("## "));
  const result = buildNoteMarkdown({ ...emptyNoteInput, title: "Paper", year: "2026 · Vol. 28", body: templateBody("detailed") }, "paper");
  const data = parse(splitFrontMatter(result).header); assert.equal(data.year, "2026 · Vol. 28"); assert.equal(data.date, "2026");
});
