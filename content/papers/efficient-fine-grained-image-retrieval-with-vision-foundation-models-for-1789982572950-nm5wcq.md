---
slug: "efficient-fine-grained-image-retrieval-with-vision-foundation-models-for-1789982572950-nm5wcq"
title: "Efficient Fine-grained Image Retrieval with Vision Foundation Models for  Industrial Objects"
subtitle: "使用工业对象视觉基础模型进行高效细粒度图像检索"
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
- **中文标题：** 使用工业对象视觉基础模型进行高效细粒度图像检索
- **发表期刊：** CVPR
- **发表年份 / 卷期：** 2026
- **作者：** Yushi Liu, Christian Graf, Markus Spies, Margret Keuper
- **单位：** University of Mannheim and Max Planck Institute for Informatics and Saarland Informatics Campus
- **开源代码：** https:// github.com/imyliu1717/industrial_spare_ part_dataset
- **核心任务：** 图像检索，细致度图像检索，dinov3
- **模型名称：** DINOv3[CLS+P] + SigLIP2 + WP

## 02 论文要解决的核心问题

### 在工业备件这种细粒度实例检索任务中，视觉基础模型的全局特征和局部 patch 特征分别有多大价值？
### 如何用轻量适配方式，把冻结的基础模型高效地用于工业检索？

### 其中论文希望解决三个问题：
- 构建一个大规模、多视角、多背景的工业备件实例级检索基准；
- 系统比较三种视觉基础模型——DINOv2、DINOv3、SigLIP2——在工业细粒度检索中的表现；
- 分析 Vision Transformer 中 CLS token 和 patch token 的作用，并研究不同池化策略对检索性能的影响。

## 03 核心解决方案

### 冻结视觉基础模型作为编码器，输出 CLS 和 patch。只训练线性池化层和线性投影头；
### 论文采用加权平均池化WP，用一个共享线性层给每个patch打分，再通过softmax归一化得到每个patch的权重，最后加权求和，这种注意力式加权可以使模型更加关注相关其余，抑制噪声背景，并且不需要分割预处理。最后将CLS和加权patch拼接，最终嵌入维度为2048；

## 04 训练 / 推理完整流程

### 训练阶段：
构造正负图像对；
冻结 DINOv3 编码器，提取每张图的 CLS 和 patch tokens；
线性池化层给 patch 打分，softmax 归一化，加权平均得到 T_p；
拼接 CLS 和 T_p ，经线性投影头得到最终嵌入；
两个嵌入算余弦相似度；
经可训练 logistic 函数得到匹配分数；
二分类交叉熵损失，只更新线性池化层和投影头。

### 推理/检索阶段：
gallery 图像过冻结编码器 + 训练好的适配模块，特征入库；
query 图像过同样流程；
query 与 gallery 算余弦相似度，经 logistic 归一化；
排序，取 top-K；
计算 Recall@k、MRR@k。

## 05 核心创新点



## 06 实验效果

方法	                               图像识别准确率
预训练 DINOv2 [CLS]	91.33%
预训练 DINOv3 [CLS]	94.67%
预训练 SigLIP2 [CLS]	94.26%
预训练 DINOv2 [P] + AP	72.77%
预训练 DINOv3 [P] + AP	62.33%
预训练 DINOv2 [CLS+P] + AP	89.36%
预训练 DINOv3 [CLS+P] + AP	93.63%
线性适配 SigLIP2 [CLS]	97.72 ± 0.29%
线性适配 DINOv2 [CLS]	96.66 ± 0.37%
线性适配 DINOv3 [CLS]	97.59 ± 0.31%
线性适配 DINOv2 [P] + WP	96.54 ± 0.97%
线性适配 DINOv3 [P] + WP	97.37 ± 0.40%
线性适配 DINOv2 [CLS+P] + WP	96.93 ± 0.73%
线性适配 DINOv3 [CLS+P] + WP	97.33 ± 0.61%
DINOv3 [CLS] + SigLIP2	97.39 ± 0.66%
DINOv3 [P] + SigLIP2 + WP	97.45 ± 0.61%
DINOv3 [CLS+P] + SigLIP2 + WP	97.56 ± 0.61%

## 07 适用场景与扩展


