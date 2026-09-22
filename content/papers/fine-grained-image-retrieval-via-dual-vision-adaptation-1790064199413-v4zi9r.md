---
slug: "fine-grained-image-retrieval-via-dual-vision-adaptation-1790064199413-v4zi9r"
title: "Fine-grained Image Retrieval via Dual-Vision Adaptation"
subtitle: "基于双视觉自适应的细粒度图像检索"
eyebrow: "Paper Note · 2025"
date: "2025"
year: "2025"
journal: "AAAI2026"
authors: "Xin Jiang, Meiqi Cao, Hao Tang, Fei Shen, Zechao Li"
affiliation: "南京理工大学"
code: ""
task: "细致度图像检索"
model: "DVA双视觉适应"
readingStatus: "阅读笔记"
---

## 01 论文基础信息

- **论文标题：** Fine-grained Image Retrieval via Dual-Vision Adaptation
- **中文标题：** 基于双视觉自适应的细粒度图像检索
- **发表期刊：** AAAI2026
- **发表年份 / 卷期：** 2025
- **作者：** Xin Jiang, Meiqi Cao, Hao Tang, Fei Shen, Zechao Li
- **单位：** 南京理工大学
- **核心任务：** 细致度图像检索
- **模型名称：** DVA双视觉适应

## 02 论文要解决的核心问题

不破坏大规模预训练知识的前提下，让冻结的预训练视觉模型具备细粒度判别能力，并兼顾检索效率与性能

## 03 核心解决方案

论文提出DVA，包含三个核心模块：
OPA：对象感知适应。通过修改输入样本来帮助预训练模型关注关键对象和判别区域
ICA：上下文适应。保持ViT中原attention projector冻结，只对生成Q和K的attention projector在旁边加入轻量瓶颈模块ICA
DPT：判别感知迁移。DPT通过知识蒸馏，把OPA中的判别知识迁移到图像编码器中

## 04 训练 / 推理完整流程

训练阶段：
对每张训练图像，经过开放词汇检测器GroundingDINO做处理，得到前景物体检测框。得到判别图像和背景图像；
冻结ViT-B-16，微调attention projector，在其旁边加ICA模块，得到判别图像嵌入、原始图像嵌入和背景图像嵌入；
这里用对比学习里面的类别代理方式，给每个类别单独设置一个可学习的向量，叫代理向量。同类样本，特征向这个类别的代理向量靠近。
判别图嵌入、原始图嵌入、背景图嵌入分别被拉近到所属的代理向量中

## 05 核心创新点



## 06 实验效果

CUB-200-2011：200 类鸟类；

Stanford Cars：196 类汽车；

Stanford Dogs：120 类犬。

## 07 适用场景与扩展


