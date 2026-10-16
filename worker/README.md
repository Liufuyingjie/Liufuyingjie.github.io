# 笔记保存服务（v5）

仍使用原来的 GitHub App OAuth、账号白名单和 installation token；只扩展完整 Markdown、随记、标签与摘要的保存能力。

**更新时必须保留完整目录结构。** 本 Worker 现在引用根目录 `shared/note-format.ts`，不要仅覆盖 `worker/src/index.ts` 后孤立部署。

从项目根目录执行（Node.js 22.12 或更新版本）：

```bash
npm ci
cd worker
npm ci
npx wrangler login
npx wrangler whoami
npm run typecheck
npm run deploy
```

确认登录的是原 Worker 所在的 Cloudflare 账号。Worker 名称及地址保持不变，现有五项 Secrets 无需重建、无需重新上传私钥。

访问原 Worker 的 `/health`，确认包含 `schemaVersion: 5` 和 `markdown-body`。随后发布前端。

详细升级、GitHub Pages 发布、排错和回退步骤见根目录 `README.md`。
