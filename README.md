# YingJie · Research Notes

一个基于 Next.js 的个人论文阅读记录网站，采用静态导出，可部署到 GitHub Pages。

## 本地运行

安装 Node.js 后，在项目目录执行：

```bash
npm install
npm run dev
```

然后访问：

```text
http://localhost:3000
```

## 新增论文记录

首页“论文记录”区域右侧有“新增论文记录”。点击后可以按照固定模板填写：

1. 论文基础信息
2. 论文要解决的核心问题
3. 核心解决方案
4. 训练 / 推理完整流程
5. 核心创新点
6. 实验效果
7. 适用场景与扩展

网页新增的记录会保存在当前浏览器的 `localStorage` 中，并可以从首页进入独立的阅读页面。

> 说明：GitHub Pages 是静态托管，没有后端数据库，因此网页表单不能直接把内容写回 GitHub 仓库。要让新增记录成为所有访问者都能看到的线上永久内容，需要后端/API 或在 GitHub 仓库里提交数据后重新构建。

## GitHub

GitHub 地址配置在：

```text
data/site.ts
```

当前配置为：

```text
https://github.com/Liufuyingjie
```

## GitHub Pages

项目已包含：

```text
.github/workflows/deploy.yml
```

将项目推送到 GitHub 后，可在仓库的 `Settings → Pages` 中选择 `GitHub Actions` 作为部署来源。
