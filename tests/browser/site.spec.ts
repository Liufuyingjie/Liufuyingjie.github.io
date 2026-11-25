import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { test, expect } from "@playwright/test";
const worker = "**/yingjie-research-notes-api.1335322392.workers.dev/**";
const currentWorker = { ok: true, schemaVersion: 7, capabilities: ["markdown-body", "journal", "delete-paper", "paper-publication-fields"] };
test.beforeEach(async ({ page }) => {
  await page.route(worker, route => {
    const path = new URL(route.request().url()).pathname;
    if (path === "/health") return route.fulfill({ json: currentWorker });
    return route.fulfill({ status: 401, json: { error: "mock: unauthorized" } });
  });
});
test("home retains motto and all 7 records, article links and tag filters work", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator(".masthead-tagline")).toHaveText("理解，而不是收藏。");
  await expect(page.locator(".post-preview")).toHaveCount(7);
  await page.locator(".post-tags button").filter({ hasText: "知识蒸馏" }).first().click();
  await expect(page.locator(".post-preview")).toHaveCount(1);
  await page.getByRole("button", { name: /清除筛选/ }).click();
  await page.locator(".post-main-link").filter({ hasText: "Rethinking Vision Transformer" }).click();
  await expect(page.locator(".article-hero-copy h1")).toContainText("Rethinking Vision Transformer");
  await expect(page.locator(".article-markdown")).toContainText("内容驱动 token 剪枝");
  await expect(page.locator(".article-toc a").first()).toHaveAttribute("href", "#heading-1");
  await expect(page.getByRole("button", { name: "删除笔记", exact: true })).toHaveCount(0);
});

test("homepage waves move continuously and become static with reduced motion", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  const frame = page.locator(".masthead-home-waves");
  const tracks = frame.locator("svg");
  await expect(frame).toHaveAttribute("aria-hidden", "true");
  await expect(tracks).toHaveCount(3);
  await expect.poll(() => tracks.evaluateAll(elements => elements.every(element =>
    element.getAnimations().some(animation => animation.playState === "running" && animation.effect?.getTiming().iterations === Infinity),
  ))).toBe(true);
  const leftEdges = () => tracks.evaluateAll(elements => elements.map(element => element.getBoundingClientRect().left));
  const before = await leftEdges();
  await expect.poll(leftEdges).not.toEqual(before);

  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect.poll(() => tracks.evaluateAll(elements => elements.flatMap(element => element.getAnimations()).length)).toBe(0);
  await expect(frame).toBeVisible();
  await page.goto("/about/");
  await expect(frame).toHaveCount(0);
});

test("an unverified session cannot show deletion controls", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("yingjie-research-session", "mock-expired-session"));
  const rejected = page.waitForResponse(response => new URL(response.url()).pathname === "/api/me" && response.status() === 401);
  await page.goto("/papers/eet/");
  await rejected;
  await expect(page.getByRole("button", { name: "删除笔记", exact: true })).toHaveCount(0);
});

test("owner deletion confirms the published revision and reports when the site is rebuilding", async ({ page }) => {
  const token = "mock-owner-session";
  const source = readFileSync("content/papers/eet.md");
  const expectedSha = createHash("sha1").update(`blob ${source.length}\0`).update(source).digest("hex");
  const conflict = "远端笔记已有更新，请刷新页面并核对后重试。";
  let deletions = 0;
  await page.addInitScript(session => localStorage.setItem("yingjie-research-session", session), token);
  await page.route(worker, async route => {
    const request = route.request();
    const pathname = new URL(request.url()).pathname;
    if (request.method() === "OPTIONS") {
      return route.fulfill({ status: 204, headers: {
        "access-control-allow-origin": "*",
        "access-control-allow-methods": "GET, DELETE, OPTIONS",
        "access-control-allow-headers": "Authorization, Content-Type, X-Research-Notes-Request",
      } });
    }
    if (pathname === "/api/me") {
      expect(request.headers().authorization).toBe(`Bearer ${token}`);
      return route.fulfill({ json: { login: "Liufuyingjie", expiresAt: Date.now() + 60_000 } });
    }
    if (request.method() !== "DELETE") return route.fallback();

    deletions += 1;
    expect(pathname).toBe("/api/papers/eet");
    expect(request.headers().authorization).toBe(`Bearer ${token}`);
    expect(request.headers()["x-research-notes-request"]).toBe("delete-paper");
    expect(request.postDataJSON()).toEqual({ expectedSha });
    if (deletions === 1) return route.fulfill({ status: 409, json: { error: conflict } });
    return route.fulfill({ json: { ok: true, slug: "eet", siteRebuild: "triggered" } });
  });

  await page.goto("/papers/eet/");
  const deleteButton = page.getByRole("button", { name: "删除笔记", exact: true });
  const dialog = page.locator("dialog[open]");
  const confirm = dialog.getByRole("button", { name: "确认删除", exact: true });
  await deleteButton.click();
  await expect(dialog).toBeVisible();
  expect(deletions).toBe(0);
  await dialog.getByRole("button", { name: "取消", exact: true }).click();
  await expect(dialog).toBeHidden();
  expect(deletions).toBe(0);

  await deleteButton.click();
  await confirm.click();
  await expect(dialog.getByRole("alert")).toHaveText(conflict);
  await expect(confirm).toBeDisabled();
  expect(deletions).toBe(1);

  await page.reload();
  await deleteButton.click();
  await confirm.click();
  await expect(dialog).toContainText("笔记已从 GitHub 删除。");
  await expect(dialog).toContainText("已触发站点重建");
  await expect(dialog.getByRole("link", { name: "返回首页", exact: true })).toHaveAttribute("href", "/");
  expect(deletions).toBe(2);
});

test("the desktop reading reminder stays below the table of contents while scrolling", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 760 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/papers/eet/");
  const contents = page.locator(".article-toc");
  const reminder = page.locator(".article-sidebar-note");
  await expect(contents.getByRole("link").first()).toHaveAttribute("href", "#heading-1");
  await expect(reminder.getByRole("link")).toHaveAttribute("href", "/new/");

  const position = await page.locator(".article-layout").evaluate(layout => layout.getBoundingClientRect().top + window.scrollY);
  const scroll = (offset: number) => page.evaluate(top => window.scrollTo(0, top), position + offset);
  await scroll(160);
  const first = await reminder.boundingBox();
  expect(first).not.toBeNull();
  await scroll(430);
  expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(position + 400);
  const second = await reminder.boundingBox();
  const toc = await contents.boundingBox();
  expect(second).not.toBeNull();
  expect(toc).not.toBeNull();
  expect(second!.y + second!.height).toBeLessThanOrEqual(760);
  expect(second!.y).toBeGreaterThanOrEqual(toc!.y + toc!.height);
  expect(Math.abs(second!.y - first!.y)).toBeLessThan(2);
});
test("full text search, archives, topic links, and empty journal filter work", async ({ page }) => {
  await page.goto("/search/");
  await page.getByRole("searchbox", { name: "搜索笔记" }).fill("GeM");
  await expect(page.locator(".post-preview")).toHaveCount(1);
  await expect(page.locator(".post-preview h2")).toContainText("AnyLoc");
  await page.goto("/archives/"); await expect(page.locator(".archive-entry")).toHaveCount(7);
  await page.goto("/tags/?tag=视觉位置识别"); await expect(page.locator(".post-preview")).toHaveCount(1);
  await page.goto("/"); await page.getByRole("button", { name: "研究随记", exact: true }).click();
  await expect(page.locator(".list-empty")).toContainText("随记");
});
test("templates retain written body, Markdown previews, draft restoration, export, and existing edits", async ({ page }) => {
  await page.goto("/new/");
  await page.getByRole("button", { name: /研究随记 专题梳理/ }).click();
  await expect(page.getByRole("group", { name: "论文信息", exact: true })).toBeHidden();
  await page.getByRole("textbox", { name: "记录标题", exact: true }).fill("本机草稿测试");
  await page.getByRole("textbox", { name: "笔记正文" }).fill("## 我的问题\n\n**保留这一段**，不要丢失。");
  await page.getByRole("button", { name: /快速阅读 核心理解/ }).click();
  await expect(page.getByRole("textbox", { name: "笔记正文" })).toHaveValue(/保留这一段/);
  await page.getByRole("button", { name: "预览", exact: true }).click();
  await expect(page.locator(".editor-preview strong")).toHaveText("保留这一段");
  await expect.poll(async () => page.evaluate(() => localStorage.getItem("yingjie-note-draft:v5:new"))).not.toBeNull();
  await page.reload(); await expect(page.locator(".draft-recovery")).toBeVisible();
  await page.getByRole("button", { name: "恢复草稿" }).click();
  await expect(page.getByLabel("论文题目", { exact: true })).toHaveValue("本机草稿测试");
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "导出 Markdown", exact: true }).click();
  expect((await download).suggestedFilename()).toMatch(/\.md$/);
  await page.goto("/papers/eet/edit/");
  await expect(page.getByRole("textbox", { name: "笔记正文" })).toHaveValue(/## 04 训练 \/ 推理完整流程/);
  await expect(page.getByRole("textbox", { name: "笔记正文" })).toHaveValue(/DKT/);
});

test("the six paper fields survive a draft restore, publish, and edit prefill", async ({ page }) => {
  const paper = {
    title: "Paper publication test",
    subtitle: "论文信息测试",
    venueType: "conference",
    journal: "CVPR",
    publicationDate: "2026-10-15",
    tags: "图像检索",
  };
  const body = "## 方法\n\n这是提交给浏览器模拟接口的正文。";
  let published: unknown;
  await page.addInitScript(() => localStorage.setItem("yingjie-research-session", "mock-session-only"));
  await page.route(worker, route => {
    const request = route.request();
    const pathname = new URL(request.url()).pathname;
    if (pathname === "/api/me") return route.fulfill({ json: { login: "Liufuyingjie" } });
    if (request.method() !== "POST" || pathname !== "/api/papers") return route.fallback();
    published = request.postDataJSON();
    return route.fulfill({ status: 201, json: { path: "content/papers/mock-publication.md", slug: "mock-publication" } });
  });

  await page.goto("/new/");
  const paperInfo = page.getByRole("group", { name: "论文信息", exact: true });
  const fields = paperInfo.locator(':is(input, select, textarea, [role="combobox"]):visible');
  const title = page.getByLabel("论文题目", { exact: true });
  const subtitle = page.getByLabel("中文题目", { exact: true });
  const venueType = page.getByRole("combobox", { name: "期刊还是会议", exact: true });
  const venueName = page.getByLabel("期刊/会议名称", { exact: true });
  const date = page.getByLabel("发布日期", { exact: true });
  const area = page.getByLabel("领域", { exact: true });
  const editor = page.getByRole("textbox", { name: "笔记正文" });
  await expect(fields).toHaveCount(6);
  for (const field of [title, subtitle, venueType, venueName, date, area, editor]) await expect(field).toBeVisible();
  await expect(date).toHaveAttribute("type", "date");
  await expect(venueType.getByRole("option", { name: "期刊", exact: true })).toBeAttached();
  await expect(venueType.getByRole("option", { name: "会议", exact: true })).toBeAttached();

  await title.fill(paper.title);
  await subtitle.fill(paper.subtitle);
  await venueType.selectOption({ label: "会议" });
  await venueName.fill(paper.journal);
  await date.fill(paper.publicationDate);
  await area.fill(paper.tags);
  await editor.fill(body);
  await expect.poll(() => page.evaluate(() => {
    const draft = localStorage.getItem("yingjie-note-draft:v5:new");
    return draft ? JSON.parse(draft).form?.body : null;
  })).toBe(body);

  await page.reload();
  await page.getByRole("button", { name: "恢复草稿", exact: true }).click();
  await expect(title).toHaveValue(paper.title);
  await expect(subtitle).toHaveValue(paper.subtitle);
  await expect(venueType).toHaveValue(paper.venueType);
  await expect(venueName).toHaveValue(paper.journal);
  await expect(date).toHaveValue(paper.publicationDate);
  await expect(area).toHaveValue(paper.tags);
  await expect(editor).toHaveValue(body);
  await page.getByRole("button", { name: "发布笔记", exact: true }).click();
  await expect(page.locator(".save-success")).toBeVisible();
  expect(published).toMatchObject({ ...paper, kind: "paper", body });

  await page.goto("/papers/anyloc-towards-universal-visual-place-recognition-1791510047892-h3hd36/edit/");
  await expect(fields).toHaveCount(6);
  await expect(title).toHaveValue(/AnyLoc/);
  await expect(venueType).toHaveValue("conference");
  await expect(venueName).toHaveValue("演示视觉研讨会");
  await expect(date).toHaveValue("2026-05-18");
  await expect(area).toHaveValue("视觉位置识别");
  await expect(editor).toHaveValue(/GeM/);
});

test("an older Worker keeps ordinary publishing but cannot discard the paper type or date", async ({ page }) => {
  let writes = 0;
  await page.addInitScript(() => localStorage.setItem("yingjie-research-session", "mock-session-only"));
  await page.route(worker, route => {
    const request = route.request();
    const pathname = new URL(request.url()).pathname;
    if (pathname === "/health") return route.fulfill({ json: { ok: true, schemaVersion: 6, capabilities: ["markdown-body", "journal", "delete-paper"] } });
    if (pathname === "/api/me") return route.fulfill({ json: { login: "Liufuyingjie" } });
    if (request.method() === "POST" || request.method() === "PUT") writes += 1;
    return route.fallback();
  });

  await page.goto("/new/");
  const publish = page.getByRole("button", { name: "发布笔记", exact: true });
  const date = page.getByLabel("发布日期", { exact: true });
  await page.getByLabel("论文题目", { exact: true }).fill("Older Worker gate test");
  await page.getByRole("textbox", { name: "笔记正文" }).fill("仅验证旧版本保存服务的兼容性。");
  await expect(publish).toBeEnabled();
  await date.fill("2026-10-15");
  await expect(publish).toBeDisabled();
  await date.fill("");
  await expect(publish).toBeEnabled();
  await page.getByRole("combobox", { name: "期刊还是会议", exact: true }).selectOption({ label: "期刊" });
  await expect(publish).toBeDisabled();
  expect(writes).toBe(0);
});

test("long Markdown notes scroll with the page in the editor and preview", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/papers/eet/edit/");
  const body = Array.from({ length: 50 }, (_, index) =>
    `## 笔记段落 ${index + 1}\n\n这一段用于验证长笔记在编辑和预览时跟随页面滚动。`,
  ).join("\n\n");
  const editor = page.getByRole("textbox", { name: "笔记正文" });
  await editor.fill(body);
  await expect.poll(() => editor.evaluate(element => element.clientHeight)).toBeGreaterThan(1_200);
  await expect.poll(() => editor.evaluate(element => element.scrollHeight - element.clientHeight)).toBeLessThanOrEqual(2);
  const top = await editor.evaluate(element => element.getBoundingClientRect().top + window.scrollY);
  await page.evaluate(y => window.scrollTo(0, y), top + 400);
  expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(top + 350);
  await expect(page.getByRole("button", { name: "粗体", exact: true })).toBeInViewport();

  await page.getByRole("button", { name: "预览", exact: true }).click();
  const preview = page.locator(".editor-preview");
  await expect(preview.getByRole("heading", { name: "笔记段落 50", exact: true })).toBeAttached();
  await expect.poll(() => preview.evaluate(element => element.clientHeight)).toBeGreaterThan(1_200);
  await expect.poll(() => preview.evaluate(element => element.scrollHeight - element.clientHeight)).toBeLessThanOrEqual(2);
});

test("split editing formats the selection, updates the preview and preserves the draft", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/new/");
  const editor = page.getByRole("textbox", { name: "笔记正文" });
  const preview = page.locator(".editor-preview");
  const selection = "所选文字";
  const emphasized = preview.locator("strong").filter({ hasText: selection });
  const original = `## 研究问题\n\n前后的正文都保留，只将${selection}标为粗体。`;
  const formatted = original.replace(selection, `**${selection}**`);
  await page.getByLabel("论文题目", { exact: true }).fill("分栏编辑测试");
  await editor.fill(original);
  await page.getByRole("button", { name: "分栏", exact: true }).click();
  await expect(editor).toBeVisible();
  await expect(preview.getByRole("heading", { name: "研究问题", exact: true })).toBeVisible();
  const sourceBounds = await editor.boundingBox();
  const previewBounds = await preview.boundingBox();
  expect(sourceBounds).not.toBeNull();
  expect(previewBounds).not.toBeNull();
  expect(previewBounds!.x).toBeGreaterThanOrEqual(sourceBounds!.x + sourceBounds!.width - 1);

  await editor.evaluate((element, text) => {
    const input = element as HTMLTextAreaElement;
    const start = input.value.indexOf(text);
    input.focus();
    input.setSelectionRange(start, start + text.length);
  }, selection);
  await page.getByRole("button", { name: "粗体", exact: true }).click();
  await expect(editor).toHaveValue(formatted);
  await expect(editor).toBeFocused();
  await expect.poll(() => editor.evaluate(element => {
    const input = element as HTMLTextAreaElement;
    return input.value.slice(input.selectionStart, input.selectionEnd);
  })).toBe(selection);
  await expect(emphasized).toHaveText(selection);

  await page.getByRole("button", { name: "预览", exact: true }).click();
  await expect(editor).toBeHidden();
  await expect(emphasized).toHaveText(selection);
  await page.getByRole("button", { name: "撰写", exact: true }).click();
  await expect(editor).toHaveValue(formatted);
  await expect.poll(() => page.evaluate(() => {
    const draft = localStorage.getItem("yingjie-note-draft:v5:new");
    return draft ? JSON.parse(draft).form?.body : null;
  })).toBe(formatted);
});

test("publishing uses the existing endpoint and keeps drafts safe on edit conflicts", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("yingjie-research-session", "mock-session-only"));
  await page.route(worker, route => {
    const p = new URL(route.request().url()).pathname;
    if (p === "/health") return route.fulfill({ json: { ok: true, schemaVersion: 5, capabilities: ["markdown-body", "journal"] } });
    if (p === "/api/me") return route.fulfill({ json: { login: "Liufuyingjie" } });
    if (route.request().method() === "POST") {
      const data = route.request().postDataJSON();
      expect(data.body).toContain("发布测试"); expect(data.kind).toBe("journal");
      return route.fulfill({ status: 201, json: { path: "content/papers/mock-note.md", slug: "mock-note" } });
    }
    return route.fulfill({ status: 409, json: { error: "远端记录已有更新，本次没有覆盖原记录。" } });
  });
  await page.goto("/new/"); await page.getByRole("button", { name: /研究随记 专题梳理/ }).click();
  await page.getByRole("textbox", { name: "记录标题", exact: true }).fill("发布测试");
  await page.getByRole("textbox", { name: "笔记正文" }).fill("## 发布测试\n\n只提交到浏览器模拟接口。");
  await page.getByRole("button", { name: "发布笔记", exact: true }).click();
  await expect(page.locator(".save-success")).toBeVisible();
  await page.goto("/papers/eet/edit/"); await page.getByRole("button", { name: "保存修改", exact: true }).click();
  await expect(page.locator(".form-error")).toContainText("没有覆盖");
  await expect(page.getByRole("textbox", { name: "笔记正文" })).toHaveValue(/DKT/);
});
test("an old Worker cannot silently discard free-form Markdown", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("yingjie-research-session", "mock-session-only"));
  await page.route(worker, route => route.fulfill({ json: new URL(route.request().url()).pathname === "/health" ? { ok: true } : { login: "Liufuyingjie" } }));
  await page.goto("/new/"); await expect(page.locator(".writer-message")).toContainText("保存服务仍是旧版");
  await expect(page.getByRole("button", { name: "发布笔记", exact: true })).toBeDisabled();
});
test("mobile navigation, no horizontal overflow, and theme preference persist", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 }); await page.goto("/");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBeTruthy();
  await page.getByRole("button", { name: "展开导航" }).click();
  await page.locator("#primary-navigation").getByRole("link", { name: "归档", exact: true }).click();
  await expect(page.locator(".archive-entry")).toHaveCount(7);
  await page.getByRole("button", { name: "切换深色模式" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.reload(); await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.goto("/papers/eet/"); expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBeTruthy();
  await expect(page.locator(".article-sidebar-note").getByRole("link")).toBeVisible();
  await page.goto("/new/");
  await expect(page.getByRole("textbox", { name: "笔记正文" })).toBeVisible();
  const settings = page.getByRole("button", { name: /笔记设置/ });
  const templates = page.getByRole("group", { name: "选择笔记模板" });
  await expect(settings).toHaveAttribute("aria-expanded", "false");
  await expect(templates).toBeHidden();
  await settings.click();
  await expect(templates).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBeTruthy();
});
