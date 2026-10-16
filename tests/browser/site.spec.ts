import { test, expect } from "@playwright/test";
const worker = "**/yingjie-research-notes-api.1335322392.workers.dev/**";
test.beforeEach(async ({ page }) => {
  await page.route(worker, route => {
    const path = new URL(route.request().url()).pathname;
    if (path === "/health") return route.fulfill({ json: { ok: true, schemaVersion: 5, capabilities: ["markdown-body", "journal"] } });
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
  await page.getByRole("textbox", { name: "记录标题", exact: true }).fill("本机草稿测试");
  await page.getByRole("textbox", { name: "笔记正文" }).fill("## 我的问题\n\n**保留这一段**，不要丢失。");
  await page.getByRole("button", { name: /快速阅读 核心理解/ }).click();
  await expect(page.getByRole("textbox", { name: "笔记正文" })).toHaveValue(/保留这一段/);
  await page.getByRole("button", { name: "预览", exact: true }).click();
  await expect(page.locator(".editor-preview strong")).toHaveText("保留这一段");
  await expect.poll(async () => page.evaluate(() => localStorage.getItem("yingjie-note-draft:v5:new"))).not.toBeNull();
  await page.reload(); await expect(page.locator(".draft-recovery")).toBeVisible();
  await page.getByRole("button", { name: "恢复草稿" }).click();
  await expect(page.getByRole("textbox", { name: "记录标题", exact: true })).toHaveValue("本机草稿测试");
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "导出 Markdown", exact: true }).click();
  expect((await download).suggestedFilename()).toMatch(/\.md$/);
  await page.goto("/papers/eet/edit/");
  await expect(page.getByRole("textbox", { name: "笔记正文" })).toHaveValue(/## 04 训练 \/ 推理完整流程/);
  await expect(page.getByRole("textbox", { name: "笔记正文" })).toHaveValue(/DKT/);
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
});
