# v4 更新说明：论文编辑

这次更新增加了“编辑已有论文记录”功能，同时保留原来的新增论文、GitHub 登录、Cloudflare Worker 和 GitHub Pages 流程。

## 你会得到

- 论文详情页右上角新增“编辑笔记 / 登录后编辑”。
- 未登录用户点击后会先走 GitHub 登录。
- Worker 只接受 `Liufuyingjie` 的有效会话。
- 编辑页面复用新增论文的 7 个固定主题，并自动填充当前内容。
- 保存修改后，Worker 会更新 `content/papers/<slug>.md`，不会因为修改标题而改变原 URL。
- GitHub commit 后继续由 GitHub Actions 自动重新部署 Pages。

## 本次需要部署的 Worker 更新

进入 `worker` 目录：

```bash
npx wrangler deploy
```

不需要重新创建 GitHub App，也不需要重新生成已有的 Secret。

## 本地项目更新后

根目录执行：

```bash
npm run build
```

确认通过后：

```bash
git add .
git commit -m "Add paper editing"
git push
```

## 安全

编辑接口使用与你新增接口相同的登录会话，并在 Worker 端再次检查账号身份。浏览器拿不到 GitHub App Private Key 或 GitHub App Client Secret。


## v4.1 visual update
- Redesigned the paper-page edit action with a quieter Apple-like control.
- Reworked the GitHub authentication panel with no numeric marker, a GitHub mark, clearer Chinese copy, and refined hierarchy.
- Reduced unnecessary English labels on create/edit pages.
