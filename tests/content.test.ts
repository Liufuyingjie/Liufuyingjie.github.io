import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { parse } from "yaml";
import { getAllPapers } from "../lib/papers";
import { buildNoteMarkdown, emptyNoteInput, normalizeNoteInput, parsePublicationDate, splitFrontMatter, templateBody } from "../shared/note-format";
import { renderMarkdown } from "../lib/markdown";

test("published notes retain their Markdown and have a unique slug matching their source file", () => {
  const papers = getAllPapers();
  assert.equal(new Set(papers.map(p => p.slug)).size, papers.length);
  for (const paper of papers) {
    assert.match(paper.slug, /^[a-z0-9][a-z0-9-]*$/i);
    const raw = fs.readFileSync(path.join(process.cwd(), "content", "papers", `${paper.slug}.md`), "utf8");
    assert.equal(paper.body, splitFrontMatter(raw).body);
    assert.match(paper.contentSha, /^[0-9a-f]{40}$/);
  }
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
  assert.equal(data.publicationDate, undefined); assert.equal(data.venueType, undefined);
});

test("structured edits update metadata, retain custom text, and do not duplicate section 01", () => {
  const input = { ...emptyNoteInput, title: "Updated", body: "## 01 论文基础信息\n\n- **论文标题：** Original\n\nA custom annotation.\n\n## 02 论文要解决的核心问题\n\nKept exactly.\n" };
  const body = splitFrontMatter(buildNoteMarkdown(input, "test")).body;
  assert.equal((body.match(/## 01 论文基础信息/g) || []).length, 1);
  assert.match(body, /Updated/); assert.match(body, /A custom annotation/); assert.match(body, /Kept exactly/);
});

test("publication dates require a real calendar day without guessing from incomplete dates", () => {
  assert.equal(parsePublicationDate(" 2028-02-29 "), "2028-02-29");
  for (const value of ["2027-02-29", "2028-04-31", "2028-03", "2028", "2028-3-14", "0000-01-01", "2028-03-14T00:00:00Z", 2028]) {
    assert.equal(parsePublicationDate(value), "", String(value));
  }
});

test("six-field metadata is stored and detailed edits retain body-only legacy fields", () => {
  const original = [
    "## 01 论文基础信息", "", "- **论文标题：** Old title", "- **发表期刊：** Old venue",
    "- **发表类型：** 期刊", "- **发表日期：** 2026-02-12", "- **作者：** Body-only author",
    "- **模型名称：** Replaced model", "", "Custom annotation.", "", "## 02 论文要解决的核心问题", "", "Original body.",
  ].join("\n");
  const existing = { year: "2027 · Vol. 28", model: "Model in metadata", customField: ["original"] };
  const input = normalizeNoteInput({
    title: "New title", subtitle: "中文标题内容", venueType: "conference", journal: "CVPR",
    publicationDate: "2028-02-29", tags: "图像检索，机器学习", body: original,
  }, existing);
  const { header, body } = splitFrontMatter(buildNoteMarkdown(input, "paper", existing));
  const data = parse(header);
  assert.equal(data.venueType, "conference");
  assert.equal(data.publicationDate, "2028-02-29");
  assert.equal(data.date, "2028");
  assert.equal(data.year, existing.year);
  assert.deepEqual(data.tags, ["图像检索", "机器学习"]);
  assert.deepEqual(data.customField, existing.customField);
  assert.match(body, /\*\*发表类型：\*\* 会议/);
  assert.match(body, /\*\*期刊 \/ 会议名称：\*\* CVPR/);
  assert.match(body, /\*\*发表日期：\*\* 2028-02-29/);
  assert.match(body, /\*\*作者：\*\* Body-only author/);
  assert.match(body, /\*\*模型名称：\*\* Model in metadata/);
  assert.doesNotMatch(body, /Old title|Old venue|2026-02-12|Replaced model/);
  assert.match(body, /Custom annotation\.\n\n## 02[^\n]+\n\nOriginal body\./);
});

test("legacy paper edits keep existing publication fields and distinguish an intentional clear", () => {
  const oldInput = { title: "Paper", journal: "CVPR", body: "## 02 问题\n\nExample." };
  const legacy = normalizeNoteInput(oldInput, { date: "2026-04-10" });
  assert.equal(legacy.venueType, "");
  assert.equal(legacy.publicationDate, "2026-04-10");
  assert.equal(normalizeNoteInput(oldInput, { year: "2026 · Vol. 3" }).publicationDate, "");
  const existing = { venueType: "conference", publicationDate: "2026-04-10" };
  const unchanged = normalizeNoteInput(oldInput, existing);
  assert.equal(unchanged.venueType, "conference");
  assert.equal(unchanged.publicationDate, "2026-04-10");
  const cleared = normalizeNoteInput({ ...oldInput, venueType: "", publicationDate: "" }, existing);
  const { header, body } = splitFrontMatter(buildNoteMarkdown(cleared, "paper", existing));
  const data = parse(header);
  assert.equal(data.venueType, "");
  assert.equal(data.publicationDate, "");
  assert.doesNotMatch(body, /\*\*发表(?:类型|日期)：\*\*/);

  const corrected = normalizeNoteInput({ ...oldInput, year: "2025", publicationDate: "2026-04-10" });
  const correctedNote = splitFrontMatter(buildNoteMarkdown(corrected, "paper"));
  assert.equal(parse(correctedNote.header).year, "2025");
  assert.match(correctedNote.body, /\*\*发表日期：\*\* 2026-04-10/);
  assert.doesNotMatch(correctedNote.body, /\*\*发表年份 \/ 卷期：\*\*/);
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
