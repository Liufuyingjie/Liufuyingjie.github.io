# Research Notes API Worker

这个 Worker 是论文博客的“保存服务”。它不保存论文正文，也不持有前端可见的 GitHub Token。

它做四件事：

1. 把用户导向 GitHub App 登录授权。
2. 检查登录账号是否为 `Liufuyingjie`。
3. 通过 GitHub App installation token，把 Markdown 文件写入 `Liufuyingjie.github.io`。
4. 返回 GitHub commit 信息，让前端告诉你保存成功。

## Deploy

```bash
npm install
npx wrangler login
npm run deploy
```

然后按根目录 `README.md` 配置 GitHub App、Secrets 和 `wrangler.jsonc`。
