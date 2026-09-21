# YingJie · Research Notes

这是你的个人论文阅读网站：Next.js 负责 GitHub Pages 上的公开展示；Cloudflare Worker 负责 GitHub 登录鉴权，并把你提交的新论文写入 GitHub 仓库。

最终结构：

```text
浏览器
  ↓
GitHub Pages（公开网站）
  ↓
新增论文 → Cloudflare Worker
  ↓
只允许 GitHub 用户 Liufuyingjie
  ↓
GitHub App 安装令牌
  ↓
content/papers/xxx.md
  ↓
GitHub commit
  ↓
GitHub Actions
  ↓
重新构建并发布 GitHub Pages
```

## 1. 本地运行网站

安装 Node.js 后，在项目目录：

```bash
npm install
npm run dev
```

访问：

```text
http://localhost:3000
```

## 2. 配置前端连接地址

后台 Worker 部署成功后，会得到类似：

```text
https://yingjie-research-notes-api.<你的账号>.workers.dev
```

把这个地址写进：

```text
data/site.ts
```

例如：

```ts
apiBaseUrl: "https://yingjie-research-notes-api.example.workers.dev"
```

不要在这个文件里放任何 Token、Client Secret、Private Key。

## 3. 创建 GitHub App

进入 GitHub：

```text
Settings → Developer settings → GitHub Apps → New GitHub App
```

建议：

- App name：`YingJie Research Notes`
- Homepage URL：`https://Liufuyingjie.github.io/`
- Callback URL：`https://你的-worker地址.workers.dev/auth/callback`
- Where can this app be installed：选择只允许你自己的账号安装

在 “Identifying and authorizing users” 中：

- 配置上面的 Callback URL
- 不要开启 “Request user authorization (OAuth) during installation”（本项目会在网页点击登录后再发起授权）
- 不需要 Device Flow
- Webhook 可以关闭

Repository permissions 只需要：

```text
Contents: Read and write
```

不需要 Administration、Issues、Pull requests 等权限。

创建后记下：

```text
App ID
Client ID
Client Secret
Private Key
```

然后把这个 App 安装到你的仓库：

```text
Liufuyingjie.github.io
```

GitHub App 的安装令牌是短期令牌，默认约 1 小时过期；Worker 每次保存论文时都会重新生成，因此不会把长期写仓库 Token 暴露给网页。GitHub 的安装令牌接口也支持把访问限制到指定仓库。

## 4. 部署 Worker

进入：

```text
worker/
```

安装依赖：

```bash
npm install
```

登录 Cloudflare：

```bash
npx wrangler login
```

先部署一次：

```bash
npm run deploy
```

记下 Worker 地址，然后把 `worker/wrangler.jsonc` 里的 `WORKER_PUBLIC_ORIGIN` 改成这个地址，再重新部署。之后回到 `data/site.ts` 填好 `apiBaseUrl`。

## 5. 配置 Worker Secrets

在 `worker/` 目录执行：

```bash
npx wrangler secret put GITHUB_APP_ID
npx wrangler secret put GITHUB_APP_CLIENT_ID
npx wrangler secret put GITHUB_APP_CLIENT_SECRET
npx wrangler secret put GITHUB_PRIVATE_KEY
npx wrangler secret put SESSION_SECRET
```

分别填写 GitHub App 对应值。

其中：

- `GITHUB_PRIVATE_KEY`：把 GitHub App 下载的整个 PEM 私钥完整粘贴进去
- `SESSION_SECRET`：自己生成一个很长的随机字符串

不要把这些值写进 `wrangler.jsonc` 的 `vars`，也不要提交 `.dev.vars`。Cloudflare 官方建议敏感值使用 Worker Secrets，而不是普通环境变量。

配置完再次部署：

```bash
npm run deploy
```

## 6. 完整测试

打开：

```text
https://Liufuyingjie.github.io/new/
```

点击：

```text
使用 GitHub 登录
```

只有 `Liufuyingjie` 能完成授权并保存。

填写 01—07 后点击“保存论文记录”，Worker 会创建：

```text
content/papers/新的论文-slug-时间戳.md
```

GitHub 的 Create or update file contents API 支持通过精细权限的 GitHub App installation token 写入仓库内容；这里使用的只是 `Contents: write`。

GitHub 收到 commit 后，仓库里的：

```text
.github/workflows/deploy.yml
```

会自动重新构建网站。

## 7. 之后你怎么记录论文

以后你不需要打开 VS Code 才能记笔记。

直接：

```text
打开主页
→ 论文记录
→ 新增论文记录
→ GitHub 登录
→ 填写固定的 01—07
→ 保存
```

这篇论文会真正保存到 GitHub，并在部署完成后出现在公开网站中。

## 8. 别人能不能新增

别人可以看到“新增论文记录”入口，但无法通过 Worker 的授权检查。

保存接口要求：

```text
GitHub 登录身份 = Liufuyingjie
```

并且 Worker 自己只使用 GitHub App 的仓库安装令牌写入指定仓库；浏览器永远不会得到这个令牌或 App 私钥。

## 9. 论文文件结构

每篇论文都是一个独立 Markdown 文件：

```text
content/
└── papers/
    ├── eet.md
    ├── paper-xxx.md
    └── paper-yyy.md
```

因此你以后既可以在网页填写，也可以直接打开 GitHub 修改 Markdown。

## 10. 重要说明

GitHub Pages 负责静态网页展示，本身没有数据库或服务端写入能力，所以“网页新增 → GitHub 永久保存”必须由额外的后端完成。这里的 Worker 只负责鉴权和写 GitHub，不负责存放论文正文。

GitHub OAuth / GitHub App 的回调流程由 GitHub 官方提供；GitHub 文档明确要求 Web 应用不要泄露 client secret，并支持 GitHub App 的用户授权流程。
