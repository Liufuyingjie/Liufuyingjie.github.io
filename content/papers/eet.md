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

一、训练阶段：输入图 X 同时走两个分支
分支一：
完整ViT教师
输入图X > 完整ViT（不剪枝，所有token保留）> 最后一层class token > 分类头 / 哈希头 > 输出：教师哈希码；第L层token重要性图
这里的ViT给DKT当蒸馏目标；给DRG生成遮挡mask
EViT学生
输入图 > EViT（ViT-small基础上插入 CTP分层剪枝）> class token > 分类头 / 哈希头 > 输出：学生哈希码；分类预测

计算损失：
教师哈希码和学生哈希码计算损失，让学生输出的哈希码接近老师；
分支二：
用ViT教师输出的重要性图，选TopK显著区域，置0，生成mask；输入到EViT中，得到分类预测
参数更新：
只更新EViT学生模型，让分类预测正常，完整教师ViT模型冻结，不更新；
这个分支是推理时要用的模型

二、推理阶段，仅使用EViT
输入查询图
经EViT+CTP剪枝提取特征
生成二进制哈希码
用汉明距离做大规模快速检索

## 05 核心创新点

- 提出EET框架；
- CTP内容驱动token剪枝，看每个head的中间token内容，谁的信息量大，谁的话语权就大。具体做法：计算每个head里每个token的信息量，归一化得到每个head的权重，用这个权重加权求和class，最后保留top token，剪掉其余；
- DKT 在哈希空间从标准 ViT 向 EViT 蒸馏；
- DRG 通过遮住最显著区域迫使 EViT 关注更细微区域。

- 通过“内容驱动剪枝提效 + 训练期判别迁移补强”的方式，让 ViT 在大规模细粒度图像检索中既快又准。

## 06 实验效果

数据集：CUB-200-2011、Stanford Cars、NABirds、VegFru、Food101、iNat2017。
指标：mAP、PR 曲线、GFLOPs、推理延迟

## 07 适用场景与扩展

CTP 负责快：剪掉背景和低判别 token。

DKT 负责准：让学生哈希码接近老师，保持检索排序。

DRG 负责细：遮住最显著区域，逼学生看更细的判别区域。
