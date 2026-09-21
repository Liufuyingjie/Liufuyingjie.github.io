# v4.3 OAuth 修复更新

把以下文件按原目录覆盖到现有 `paper-notes-blog-v2`：

- `worker/src/index.ts`
- `components/new-note-form.tsx`

## 修复

1. GitHub App OAuth 增加 PKCE（S256）。
2. 授权码交换时显式提交与 Callback URL 完全一致的 `redirect_uri`。
3. GitHub 登录失败时，页面会显示明确的错误信息，不再静默回到登录卡片。
4. `/api/me` 会话校验失败时也会显示原因提示。
5. 仍然只允许 `Liufuyingjie` 写入 `Liufuyingjie.github.io`。

Callback URL 保持：
`https://yingjie-research-notes-api.1335322392.workers.dev/auth/callback`
