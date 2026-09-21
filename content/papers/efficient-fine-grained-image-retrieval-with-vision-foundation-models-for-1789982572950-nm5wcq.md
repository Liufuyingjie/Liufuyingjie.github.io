---
slug: "efficient-fine-grained-image-retrieval-with-vision-foundation-models-for-1789982572950-nm5wcq"
title: "Efficient Fine-grained Image Retrieval with Vision Foundation Models for  Industrial Objects"
subtitle: "基于视觉基础模型的工业物体高效细粒度图像检索"
eyebrow: "Paper Note · 2026"
date: "2026"
year: "2026"
journal: "CVPR"
authors: "Yushi Liu, Christian Graf, Markus Spies, Margret Keuper"
affiliation: "University of Mannheim and Max Planck Institute for Informatics and Saarland Informatics Campus"
code: "https:// github.com/imyliu1717/industrial_spare_ part_dataset"
task: "图像检索，细致度图像检索，dinov3"
model: "DINOv3[CLS+P] + SigLIP2 + WP"
readingStatus: "阅读笔记"
---

## 01 论文基础信息

- **论文标题：** Efficient Fine-grained Image Retrieval with Vision Foundation Models for  Industrial Objects
- **中文标题：** 基于视觉基础模型的工业物体高效细粒度图像检索
- **发表期刊：** CVPR
- **发表年份 / 卷期：** 2026
- **作者：** Yushi Liu, Christian Graf, Markus Spies, Margret Keuper
- **单位：** University of Mannheim and Max Planck Institute for Informatics and Saarland Informatics Campus
- **开源代码：** https:// github.com/imyliu1717/industrial_spare_ part_dataset
- **核心任务：** 图像检索，细致度图像检索，dinov3
- **模型名称：** DINOv3[CLS+P] + SigLIP2 + WP

## 02 论文要解决的核心问题

#### 在工业备件这种细粒度实例检索任务中，视觉基础模型的全局特征和局部 patch 特征分别有多大价值？
#### 如何用轻量适配方式，把冻结的基础模型高效地用于工业检索？

#### 其中论文希望解决三个问题：
- 构建一个大规模、多视角、多背景的工业备件实例级检索基准；
- 系统比较三种视觉基础模型——DINOv2、DINOv3、SigLIP2——在工业细粒度检索中的表现；
- 分析 Vision Transformer 中 CLS token 和 patch token 的作用，并研究不同池化策略对检索性能的影响。

## 03 核心解决方案

- 1）构建一个大规模工业备件细粒度实例检索基准，包含多背景、多视角、手机与机器两种采集条件，并提供独立训练/验证/测试划分；
- 2）冻结 DINOv2、DINOv3、SigLIP2 等视觉基础模型，只利用其输出的 CLS 全局 token 与 patch 局部 token，不微调编码器；
- 3）设计轻量适配模块，用一个可训练线性池化层给每个 patch token 打分并经 softmax 得到权重，做加权平均池化以抑制背景、突出物体区域，再将加权 patch 表示与 CLS token 拼接；
- 4）通过线性投影头融合并映射到任务特定的 2048 维嵌入空间，用余弦相似度衡量图像对相似性，并引入可训练 logistic 函数校准相似度、输出“是否同一对象”的概率；
- 5）以图像对二分类交叉熵损失训练整个轻量适配模块，冻结基础编码器，从而在高效、低训练成本下提升工业细粒度检索性能，并系统分析 CLS 与 patch token、不同池化策略及跨域泛化表现。

## 04 训练 / 推理完整流程

#### 训练阶段：
- 构造正负图像对；
- 冻结 DINOv3 编码器，提取每张图的 CLS 和 patch tokens；
- 线性池化层给 patch 打分，softmax 归一化，加权平均得到 T_p；
- 拼接 CLS 和 T_p ，经线性投影头得到最终嵌入；
- 两个嵌入算余弦相似度；
- 经可训练 logistic 函数得到匹配分数；（logistic函数的作用是把余弦相似度校准成概率值，用于最终判断）
- 二分类交叉熵损失，反向传播只更新线性池化层和投影头以及logistic的参数。这个时候如果样本对是负相关的，理想情况下余弦相似度会比较低，经过logistic函数计算出来的值表示同一对象概率低，经过反向传播让正样本对相似度高，负样本对相似度更低
- 训练时是二分类任务
#### 推理/检索阶段：
gallery 图像过冻结编码器 + 训练好的适配模块，特征入库；
query 图像过同样流程；
query 与 gallery 算余弦相似度，经 logistic 归一化；
排序，取 top-K；
计算 Recall@k、MRR@k。

## 05 核心创新点

- 系统比较三种视觉基础模型在工业检索中的表现
- 深入分析 CLS token 与 patch token 的作用
- 提出轻量适配框架，冻结基础编码器
- 将加权平均池化用于 patch 聚合，并融合 CLS 与 patch 表示
- 揭示 patch 加权的跨域泛化局限
#### 论文的核心创新不在于提出全新的网络结构，而在于构建新基准、系统分析视觉基础模型的 CLS/patch 表示、提出轻量适配框架，并验证加权 patch 聚合在工业细粒度检索中的价值与跨域局限。

## 06 实验效果

1. 图像识别结果
主要结论：
预训练 CLS 全局特征已经很强，准确率普遍超过 90%；
简单平均池化 patch token 会严重掉点，说明背景噪声影响大；
加权平均池化显著改善 patch 表示，例如 DINOv2 patch 从 72.77% 提升到 96.54%，DINOv3 patch 从 62.33% 提升到 97.37%；
线性适配后，SigLIP2 全局特征最高，达到 97.72%；
DINOv3 线性适配 CLS 达到 97.59%，略低于 SigLIP2，但强于 DINOv2；
多模型组合没有带来显著增益；
图像识别任务整体准确率普遍超过 96%，作者认为该任务区分度不够强。

2. 图像检索结果
冻结基础模型 + 轻量适配是有效的；
加权 patch 池化在手机图库的视角/背景变化下有明显增益；
跨域机器图像中，patch 加权容易过拟合，CLS 更鲁棒；
多模型组合（DINOv3 + SigLIP2）能进一步提升性能；
SigLIP2 在跨域场景中比 DINOv3 更稳健。

## 07 适用场景与扩展

- 该论文可作为入门第一篇，研究DINOv3模型的特征性能，探究不同feature在冻结dinov3下的性能。作为baseline实验
