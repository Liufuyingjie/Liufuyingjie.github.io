# 笔记管理服务（v7）

保存、编辑和删除继续使用原有的 GitHub App 登录与账号白名单。删除需要作者登录，服务会核对网页中的笔记版本和私有仓库的最新版本。删除会提交到私有仓库，并尝试触发 GitHub Pages 重建。重建完成后，公开页面和列表才会同步更新。

论文可以保存发表类型、期刊或会议名称和明确到日的发表日期。旧稿中的年份与卷期仍会保留。

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

访问原 Worker 的 `/health`，确认 `schemaVersion` 为 `7`，且 `capabilities` 包含 `markdown-body`、`delete-paper` 和 `paper-publication-fields`。随后发布前端。

详细升级、GitHub Pages 发布、排错和回退步骤见根目录 `README.md`。
