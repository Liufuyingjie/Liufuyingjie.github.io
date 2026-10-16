# YingJie · 理解，而不是收藏。

个人论文阅读与研究记录网站，用于整理论文笔记、研究随记和阅读过程中的想法。

- **网站：** https://liufuyingjie.github.io/
- **仓库：** https://github.com/Liufuyingjie/Liufuyingjie.github.io

## 功能

- 使用 Markdown 记录论文、快速阅读笔记和研究随记。
- 支持编辑、预览，以及本地草稿和 Markdown 导出。
- 论文记录以 Markdown 文件保存在仓库中，便于长期维护和版本管理。
- 使用 GitHub Pages 发布网站；笔记发布服务由 Cloudflare Worker 提供。

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
├── content/papers/      # 论文笔记 Markdown 文件
├── data/                # 网站配置
├── lib/                 # 通用逻辑
├── public/              # 静态资源
├── shared/              # 前后端共用代码
├── worker/              # Cloudflare Worker 笔记保存服务
└── .github/workflows/   # 自动构建与部署流程
```

## 添加或修改论文笔记

1. 优先通过网站的笔记编辑界面创建、编辑和发布记录。
2. 如需手动维护文件，在 `content/papers/` 中编辑对应的 Markdown 文件。
3. 手动修改已有记录时，尽量保留原文件名和 `slug`，否则可能改变文章链接或影响编辑器定位文件。
4. 草稿保存在当前浏览器中，并不等于已发布；重要内容请导出 Markdown 或发布到仓库。

## 部署

网站通过 GitHub Actions 构建并发布到 GitHub Pages。将更新推送到 `main` 分支后，在仓库的 **Actions** 页面检查部署是否成功，再访问网站确认结果。

笔记保存服务需要单独部署到 Cloudflare。相关操作、环境要求和健康检查见 [`worker/README.md`](worker/README.md)。一般修改网站页面不需要重新部署 Worker；只有涉及保存服务代码或其共享接口时，才需要检查是否要一起更新。

## 安全注意事项

- 不要把访问令牌、私钥、`.env`、`.dev.vars` 或其他密钥提交到仓库。
- 不要随意删除 `content/papers/` 中的文件；删除前先备份，并确认是否会影响现有文章链接。
- 如果发布失败，先查看 GitHub Actions 的构建日志，不要通过强制推送或清空仓库来尝试修复。
