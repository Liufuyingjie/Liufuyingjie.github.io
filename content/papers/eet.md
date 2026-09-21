---
slug: "eet"
title: "Rethinking Vision Transformer for Large-Scale Fine-Grained Image Retrieval"
subtitle: "重新思考视觉 Transformer 用于大规模细粒度图像检索"
eyebrow: "Paper Note · 2026"
date: "2026"
year: "2026 · Vol. 28"
journal: "IEEE Transactions on Multimedia (TMM)"
authors: "Xin Jiang, Hao Tang, Yonghua Pan, Zechao Li（通讯作者）"
affiliation: "南京理工大学、香港理工大学、广西科学院"
code: "https://github.com/WhiteJiang/EET"
task: "大规模细粒度图像检索 + 深度哈希 + ViT 高效化"
model: "EET（Efficient and Effective ViT）"
readingStatus: "阅读笔记"
---

## 01 论文基础信息

- **论文标题：** Rethinking Vision Transformer for Large-Scale Fine-Grained Image Retrieval
- **中文标题：** 重新思考视觉 Transformer 用于大规模细粒度图像检索
- **发表期刊：** IEEE Transactions on Multimedia (TMM)
- **发表年份 / 卷期：** 2026 · Vol. 28
- **作者：** Xin Jiang, Hao Tang, Yonghua Pan, Zechao Li（通讯作者）
- **单位：** 南京理工大学、香港理工大学、广西科学院
- **开源代码：** https://github.com/WhiteJiang/EET
- **核心任务：** 大规模细粒度图像检索 + 深度哈希 + ViT 高效化
- **模型名称：** EET（Efficient and Effective ViT）

## 02 论文要解决的核心问题

细粒度图像类间差异小、类内差异大；
ViT 推理太慢，生成哈希码的推理延迟成为瓶颈；
现有 token 剪枝方法又主要面向粗粒度，容易把细粒度关键 token 剪掉；
#### 设计一个高效且有效的 ViT 哈希框架，在显著降低推理延迟的同时，保留甚至提升细粒度判别力。

## 03 核心解决方案

对应方案就是 EET：

CTP：内容驱动 token 剪枝，剪掉背景和低判别 token，提升效率；
DKT：训练时从完整 ViT 蒸馏哈希知识，补回剪枝损失的判别力；
DRG：遮住最显著区域，逼 EViT 关注次显著但更有区分度的细节；
推理时只跑剪枝后的 EViT，所以又快又省。

## 04 训练 / 推理完整流程



## 05 核心创新点



## 06 实验效果



## 07 适用场景与扩展


