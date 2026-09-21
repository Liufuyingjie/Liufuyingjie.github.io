# v4.2 登录流程修复更新

把这些文件按原目录覆盖到现有 `paper-notes-blog-v2`：

- `worker/src/index.ts`
- `components/new-note-form.tsx`
- `components/edit-paper-button.tsx`

修复内容：

1. GitHub OAuth 回调现在允许 `/new/` 和 `/papers/<slug>/edit/`，编辑登录不会再被送到新增论文页面。
2. “使用 GitHub 登录”点击后立即显示跳转状态。
3. “编辑笔记”点击后立即显示验证状态，并防止重复点击。
4. 没有改变任何 GitHub App、Cloudflare Secret 或仓库权限配置。
