# YingJie · 理解，而不是收藏。

个人论文阅读与研究记录网站，用于整理论文笔记、研究随记和阅读过程中的想法。

- **网站：** https://liufuyingjie.github.io/
- **仓库：** https://github.com/Liufuyingjie/Liufuyingjie.github.io

## 功能

- 使用 Markdown 记录论文、快速阅读笔记和研究随记。
- 支持编辑、预览，以及本地草稿和 Markdown 导出。
- 论文记录以 Markdown 文件长期保存，便于维护和版本管理（笔记文件不在本仓库中，见下文）。
- 使用 GitHub Pages 发布网站；笔记发布服务由 Cloudflare Worker 提供。

## 笔记文件放在哪里

笔记源码存放在**独立的私有仓库**中，不在本仓库里，`content/papers/` 已被 `.gitignore` 忽略。
构建时由 GitHub Actions 使用仓库 Secret `CONTENT_TOKEN` 拉取私有仓库并注入到 `content/papers/`，
所以网站页面照常显示全部笔记，但仓库的提交历史和文件中都查不到笔记内容。

- 想立刻看到刚发布的笔记：到 **Actions** 页面点 **Run workflow**；否则会由定时任务（每 30 分钟）自动重建。
- 本地开发要看笔记：把私有仓库克隆到项目外面的任意目录，再把 `content/papers/*.md` 复制进本项目的 `content/papers/`。
  这一步只是为了让 `npm run dev` 和 `npm run check` 能读到笔记，文件不会被提交。

## 本地运行

环境要求：Node.js **22.12 或更高版本**。

```bash
git clone https://github.com/Liufuyingjie/Liufuyingjie.github.io.git
cd Liufuyingjie.github.io
npm ci
npm run dev
```

在浏览器打开 `http://localhost:3000`。

提交前可以运行以下检查：

```bash
npm run check
npm run lint
npm run build
```

## 项目结构

```text
.
├── app/                 # 页面与路由
├── components/          # 页面组件
├── content/papers/      # 论文笔记 Markdown（构建时注入，已被 .gitignore 忽略）
├── data/                # 网站配置
├── lib/                 # 通用逻辑
├── public/              # 静态资源
├── shared/              # 前后端共用代码
├── worker/              # Cloudflare Worker 笔记保存服务
└── .github/workflows/   # 自动构建与部署流程
```

## 添加或修改论文笔记

1. 优先通过网站的笔记编辑界面创建、编辑和发布记录（会写入私有笔记仓库）。
2. 如需手动维护文件，在私有笔记仓库的 `content/papers/` 中编辑对应的 Markdown 文件。
3. 手动修改已有记录时，尽量保留原文件名和 `slug`，否则可能改变文章链接或影响编辑器定位文件。
4. 草稿保存在当前浏览器中，并不等于已发布；重要内容请导出 Markdown 或发布到仓库。

## 部署

网站通过 GitHub Actions 构建并发布到 GitHub Pages。构建会先从私有笔记仓库拉取笔记，
因此本仓库的提交历史里不含笔记内容。将更新推送到 `main` 分支后，在仓库的 **Actions** 页面检查部署是否成功，再访问网站确认结果。
笔记内容有更新但本仓库没有新提交时，构建由**定时任务（每 30 分钟）**或手动 **Run workflow** 触发。

笔记保存服务需要单独部署到 Cloudflare，且其 `GITHUB_REPO_NAME` 必须指向**私有笔记仓库**，
否则网站新发布的笔记会被写回本仓库、重新暴露。相关操作见 [`worker/README.md`](worker/README.md)。

## 安全注意事项

- 不要把访问令牌、私钥、`.env`、`.dev.vars` 或其他密钥提交到仓库。
- 不要把笔记文件提交回本仓库：`content/papers/` 已加入 `.gitignore`，请勿用 `git add -f` 强行加入。
- 如果发布失败，先查看 GitHub Actions 的构建日志，不要通过清空仓库来尝试修复。
