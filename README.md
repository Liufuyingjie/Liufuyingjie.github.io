# YingJie · 理解，而不是收藏。

基于原 `Liufuyingjie.github.io` 项目的博客改版。保留 Next.js 静态导出、GitHub Pages 和原 Cloudflare Worker 登录发布架构。

## 本次改版

- 参考 sysin.org 的「海岸图片横幅＋文章摘要列表＋右侧信息栏」，重新实现页面，不复制其品牌、文章、广告或统计脚本。
- 首页横幅不再占满一屏；文章之间使用细分隔线、小间距，不再使用大块展示卡片。
- 保留「理解，而不是收藏。」；关于信息仍来自原项目。
- 原有 **7 篇 Markdown、文件名、slug 和文章链接未改变**。原文件无需导入其他系统，也没有把正文塞进数据库。
- 完整论文、快速阅读、研究随记三种写作模板，正文可以自由删改。支持预览、本机草稿、Markdown 导出、全文搜索、标签、归档、RSS、移动导航和深色模式。
- 新保存服务兼容旧论文表单请求；继续使用原 GitHub App、白名单、Worker 地址和 Secrets。更新时保留未知元数据，并检查远端版本，防止覆盖别人刚保存的修改。
- 旧 Worker 不支持完整自由正文时，前端会阻止发布并提示更新，防止「看似保存成功，正文却丢了」。

> 本次交付基于原仓库提交 `450d513`。`docs/original-records-sha256.json` 记录交付时 7 篇原始文件的 SHA-256，均与该提交逐字节一致。这是交付快照，不限制你以后正常修改笔记。

## 你应该使用哪个包

| 文件 | 用途 |
| --- | --- |
| `yingjie-v5-update.zip` | **推荐用于更新你的现有仓库**。只有新增/修改的代码和素材，**不包含 `content/papers/`**，不会覆盖你后来新增或修改的论文。 |
| `yingjie-v5-source.zip` | 完整源码备份，含交付时的 7 篇记录。适合离线保存或另开项目；不要用旧快照覆盖现有仓库里的最新记录。 |

不直接向你的 GitHub 推送，不直接部署线上 Worker。当前实时预览也不会连接你的线上保存服务；可以阅读、搜索、写作、预览和导出草稿。

---

## 推荐部署顺序：更新 Worker → 发布前端

因为你确认原登录发布流程正常，本次**不需要重新创建 GitHub App，不需要重置 Secrets，不需要更换域名**。

### 1. 准备环境和备份仓库

安装 Git，以及 **Node.js 22.12 或更新版本**。推荐 Node.js 22 LTS。先在终端检查：

```bash
node -v
npm -v
```

如果还没有本地仓库：

```bash
git clone https://github.com/Liufuyingjie/Liufuyingjie.github.io.git
cd Liufuyingjie.github.io
```

如果已有本地仓库，直接进入该目录。先确认没有尚未备份的本地修改，再更新并建立备份分支：

```bash
git status
git switch main
git pull --ff-only
git branch backup-before-blog-redesign
git push origin backup-before-blog-redesign
```

同名备份分支已经存在时，换一个分支名。不要使用 `git reset --hard` 或强制推送来解决本地修改冲突。

### 2. 覆盖升级文件，保留你的论文

下载并解压 `yingjie-v5-update.zip`。

将其中的文件按目录结构复制到本地仓库的**根目录**，覆盖同名代码文件。根目录就是现有 `package.json` 所在的位置；不要再套一层文件夹。注意复制 `.github` 文件夹，macOS 可用 `Command + Shift + .` 显示隐藏文件。

**不要删除原项目；不要清空 `content/papers/`；不要把完整源码快照里的旧记录覆盖到最新仓库。**

升级包没有 `.git`、`node_modules`、`.next`、`out`、`.dev.vars`、`.env` 或任何私钥。原 Worker 公共配置没有改动，现有 Secrets 保留在 Cloudflare。

检查 `data/site.ts` 中的两个地址：

```text
homepageUrl = https://liufuyingjie.github.io
apiBaseUrl  = https://yingjie-research-notes-api.1335322392.workers.dev
```

如果你后来改过域名或 Worker 地址，保留你自己的最新地址，同时核对 `worker/wrangler.jsonc`，不要盲目覆盖自定义配置。

安装、检查和构建前端：

```bash
npm ci
npm run check
npm run lint
npm run build
```

成功后会生成 `out/`，并自动生成 RSS、站点地图和 `.nojekyll`。**不用提交 `out/`，GitHub Actions 会重新构建。**

想先在本机看效果：

```bash
npm run dev -- --hostname 0.0.0.0
```

浏览器打开 `http://localhost:3000`。如果占用了 3000 端口，关闭占用它的程序，或换端口做纯阅读预览；本机登录保存仅默认允许 `http://localhost:3000`。

### 3. 更新原 Cloudflare Worker（本次只需要一次）

从项目根目录进入 Worker：

```bash
cd worker
npm ci
npx wrangler login
npx wrangler whoami
npm run typecheck
npm run deploy
cd ..
```

- 登录**原 Worker 所在的 Cloudflare 账号**。
- 名称保持 `yingjie-research-notes-api`。
- 根目录 `shared/` 必须已复制到位。不要只上传 `worker/src/index.ts`。
- 现有 `GITHUB_APP_ID`、`GITHUB_APP_CLIENT_ID`、`GITHUB_APP_CLIENT_SECRET`、`GITHUB_PRIVATE_KEY`、`SESSION_SECRET` **无需重新设置**。
- 不要重建 Worker；不要为这次改版重置 `SESSION_SECRET`，否则原会话会失效。
- 若输出的 Worker 地址与原地址不同，先停止前端发布，确认是否登录错账号。

在浏览器访问：

```text
https://yingjie-research-notes-api.1335322392.workers.dev/health
```

应看到类似：

```json
{
  "ok": true,
  "service": "yingjie-research-notes-api",
  "schemaVersion": 5,
  "capabilities": ["markdown-body", "journal", "metadata", "optimistic-edit"]
}
```

只返回 `{"ok":true,...}` 而没有版本字段，说明 Worker 还是旧版。暂时不要发布新模板；先检查 Worker 部署是否完成。

### 4. 提交前端，让 GitHub Pages 自动部署

回到仓库根目录，将改版文件加入提交：

```bash
git add app components data lib shared public scripts tests docs .github .gitignore
git add package.json package-lock.json next.config.ts tsconfig.json eslint.config.mjs playwright.config.ts next-env.d.ts README.md
git add worker/src/index.ts worker/package.json worker/package-lock.json worker/README.md
git diff --cached --stat
git commit -m "Redesign research blog with compact notes and flexible templates"
git push origin main
```

检查 `git diff --cached --stat`：不应该出现删除论文、提交私钥或提交 `.dev.vars`。本次升级包本身不会修改任何论文。

如果 Git 推送要求身份验证，使用 GitHub Desktop、Git Credential Manager 或 GitHub CLI 的浏览器登录；不要把 Token、私钥或账号密码发到聊天中。

打开你的仓库：

```text
https://github.com/Liufuyingjie/Liufuyingjie.github.io
```

1. **Settings → Pages → Build and deployment → Source**，确认选择 **GitHub Actions**。原先已是这一项则不用修改。
2. 打开 **Actions**，找到 `Deploy Next.js to GitHub Pages`。
3. 等待 `build` 和 `deploy` 都成功。如果失败，打开红色步骤查看日志。
4. 访问 `https://liufuyingjie.github.io/`，硬刷新一次：Windows `Ctrl + F5`，macOS `Command + Shift + R`。

页面还是旧版时，先看 Actions 是否完成，再清缓存。不要反复删掉仓库或重建 Pages。

### 5. 线上验收

按这个顺序检查：

- 首页看到「理解，而不是收藏。」和原来的 7 篇记录。
- 原链接 `/papers/eet/` 等都能打开，正文、表格和代码能正常阅读。
- 标签筛选、搜索正文关键词、归档与手机导航正常。
- 进入「写笔记」，使用原 `Liufuyingjie` 账号登录。
- 写一篇短随记并发布。得到 GitHub 提交提示后，等待 Actions 部署完成，再刷新首页。
- 打开它的编辑页修改一句话，保存后确认文章链接没变。

**浏览器显示提交成功并不等于 Pages 已经部署完成。** GitHub 提交、构建与发布是分开的三个步骤。

---

## 平时怎么记录

### 三种模板

- **完整论文**：保留原来问题、方案、流程、创新、实验、扩展的结构；基础信息自动整合。适合精读。
- **快速阅读**：一句话理解、问题与方法、证据与局限、疑问和下一步。适合初读或暂时不需要写满全部栏目。
- **研究随记**：自由 Markdown，适合「对 patch 的研究」这样的专题整理，也适合普通博客。

只有标题和正文必填。摘要、标签、作者、会议/期刊、代码等是可选项；没有填写摘要时，首页会从正文提取。

切换模板时，如果你已经写了正文，**正文不会被清空**。需要自己调整栏目。7 篇旧记录仍默认归类为论文，不自动改写或猜测你的文章类型；你可以在编辑页选择研究随记，保留正文后发布。

### 草稿与导出

- 草稿自动保存在**当前浏览器、当前域名**，不是云端，也不会自动公开。
- 检测到旧草稿时，先选「恢复草稿」或「使用当前版本」，再继续写作。
- GitHub 登录、网络或部署出现问题时，可以先导出 Markdown，不必重新输入。
- 导出的文件名与 frontmatter 的 `slug` 一致。若手动上传，将它放到 `content/papers/`，不要随便改文件名或 slug，否则网页编辑找不到原文件。
- 清理浏览器存储或更换浏览器会丢失本机草稿；重要内容请导出，或发布到仓库。

### 旧文章和日期

原文章正文直接从 Markdown 读取，不再依赖六个栏目才能显示，因此自定义标题、段落和随记正文不会被模板过滤。

旧数据多数只有论文年份，页面明确标注「2026 年论文」，不会把它假装成真实的笔记发布日期。旧文章按原年份归档，新记录保存 `createdAt` / `updatedAt`，并按记录日期归档。

---

## 常见问题

| 情况 | 处理 |
| --- | --- |
| 提示保存服务仍是旧版 | 更新 Worker，再检查 `/health` 是否有 `schemaVersion: 5`。前端阻止发布是为了保护正文。 |
| GitHub 登录后说账号没权限 | 使用原 `Liufuyingjie` 账号，检查 Worker 白名单。不要开放所有访客的写入权限。 |
| 发布时出现 CORS / Failed to fetch | 核对 `data/site.ts` 的 API 地址及 Worker `ALLOWED_ORIGINS`；正式站点须为 `https://liufuyingjie.github.io`。不要把白名单改成 `*`。 |
| 实时预览里不能登录发布 | 这是有意的保护：预览域名不是你的正式站点，不会操作线上仓库。可以使用编辑、预览和导出；部署后再登录。 |
| 写入 GitHub 失败 | 检查原 GitHub App 是否安装在该仓库、Contents 是否具有写权限，以及 Worker Secrets 是否还在。可以用 `npx wrangler secret list` 查看名称，无法也不应读取明文。 |
| 保存返回 409，提示远端已更新 | 先导出草稿，再刷新编辑页，合并新的内容后保存。不要强行覆盖远端。 |
| 已保存，首页却没有新文章 | 看 GitHub Actions 是否构建/发布完成，再硬刷新。 |
| 文章图片加载不出来 | 使用 HTTPS 图片地址，或将图片放在 `public/images/`，Markdown 引用 `/images/文件名`；GitHub Pages 不存储你电脑上的本地文件路径。 |
| 安装时提示 Node 版本不满足 | 更新到 Node.js 22.12 或更新版本，再运行 `npm ci`。 |
| `npm audit` 显示开发依赖警告 | 本次生产依赖审计为 0；目前 ESLint 的上游 glob 工具链仍有开发依赖通告。不要用 `npm audit fix --force` 强制降级 Next.js。关注上游修复后更新工具链。 |

如需换域名，须同步修改 `data/site.ts` 的 `homepageUrl`、Worker `SITE_ORIGIN` / `ALLOWED_ORIGINS`，以及 Pages 域名设置。仅改其中一个会影响登录跳转或 CORS。

## 回退

保留论文目录不动。立即回退本次改版时，可以反向提交改版 Commit：

```bash
git revert <本次改版的commit号>
git push origin main
```

Worker v5 兼容旧结构化表单请求，通常不需要一起回退。若已经新增自由随记，旧阅读器可能不能完整展示自由正文，但 Markdown 文件依然存在；这时建议仅回退样式，保留新解析器，或先导出随记备份后再调整。不要删除笔记来“修复”页面。

## 交付检查

- 原始 7 篇记录与 `450d513` 逐字节一致。
- 前端生产静态构建、TypeScript、ESLint 通过。
- 9 项数据/Markdown/Worker 单元检查通过。
- 6 项浏览器检查通过：筛选、原文章、全文搜索、模板、草稿、导出、模拟发布与冲突、旧接口保护、手机导航、深色模式。
- Worker TypeScript 与离线部署打包检查通过。
- 真实 GitHub OAuth 和线上写入不使用你的账号代测；发布流程浏览器检查使用模拟接口，需按上面的线上验收步骤用你自己的账号确认。

## 素材与维护

海岸头图为本项目新生成的摄影风格素材，位于 `public/images/coast.webp`；头像来自你公开的 GitHub 头像，位于 `public/images/avatar.webp`。可替换为你自己的图片，保持文件名即可。

```text
app/                    页面：主页、归档、标签、搜索、文章、新增、编辑
components/             列表、侧栏、阅读目录、Markdown 编辑器、导航
content/papers/         原始 Markdown 记录（保留）
shared/note-format.ts   前后端通用的笔记格式与模板
lib/papers.ts           兼容读取旧记录与新自由正文
lib/markdown.ts         Markdown 渲染与 HTML 安全过滤
worker/                 原登录发布后端，新增 v5 保存字段
scripts/                构建后生成 RSS、站点地图
.github/workflows/      GitHub Pages 自动发布
```
