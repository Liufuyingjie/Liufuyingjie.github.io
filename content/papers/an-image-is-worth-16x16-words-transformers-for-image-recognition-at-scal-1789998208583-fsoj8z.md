---
slug: "an-image-is-worth-16x16-words-transformers-for-image-recognition-at-scal-1789998208583-fsoj8z"
title: "An Image Is Worth 16x16 Words: Transformers for Image Recognition at Scale》（ViT）"
subtitle: "一张图等于16x16个词：大规模图像识别的Transformer"
eyebrow: "Paper Note · 2020"
date: "2020"
year: "2020"
journal: ""
authors: ""
affiliation: ""
code: ""
task: "图像检索，Transformer"
model: "Vision Transformer (ViT）"
readingStatus: "阅读笔记"
---

## 01 论文基础信息

- **论文标题：** An Image Is Worth 16x16 Words: Transformers for Image Recognition at Scale》（ViT）
- **中文标题：** 一张图等于16x16个词：大规模图像识别的Transformer
- **发表年份 / 卷期：** 2020
- **核心任务：** 图像检索，Transformer
- **模型名称：** Vision Transformer (ViT）

## 02 论文要解决的核心问题

CNN天生具有归纳偏置，如平移等变性和局部性，这使得它们在处理图像时非常高效。而Transformer架构缺乏这些先验知识，理论上需要从零开始学习图像的空间结构。
因此，核心问题是：一个“纯净”的Transformer能否在图像任务中战胜拥有强大先验知识的CNN？如果能够，其关键条件是什么？

## 03 核心解决方案

ViT的核心思想是将图像转换为Transformer能够处理的“序列”。

## 04 训练 / 推理完整流程

1、图像分块（Patchify）：
将一张输入图像（如 224×224 像素）分割成一个个固定大小的、互不重叠的图像块（Patches）。论文中常见的块大小有 16×16 或 32×32。

线性投影（Linear Projection）：
将每个展平后的图像块向量，通过一个可训练的线性层（全连接层）映射到一个固定维度 D 的空间，得到块嵌入（Patch Embeddings）。这个操作类似于NLP中的词嵌入（Word Embedding）。

添加位置编码（Position Embedding）：
由于Transformer本身是置换不变的，即不关心输入序列的顺序，所以需要加入位置信息。ViT使用了标准的可学习1D位置编码，将其添加到每个块嵌入上，以保留图像块在原始图像中的空间位置。

分类令牌（Class Token）：
模仿BERT模型，ViT在输入序列的最前面添加了一个特殊的可学习嵌入向量，称为 [class] token。这个令牌在Transformer编码器的最深层对应的输出状态，被用作整个图像的最终表示，并送入一个分类头（MLP）进行类别预测。这种做法替代了CNN中常用的全局平均池化。

Transformer编码器（Transformer Encoder）：
将上述带有位置编码的序列（包含 [class] token 和所有图像块嵌入）输入到一个标准的Transformer编码器中。该编码器由多个相同的层堆叠而成，每层包含多头自注意力（Multi-head Self-Attention, MSA） 和MLP前馈网络，并在每个模块前使用层归一化（Layer Norm），每个模块后使用残差连接（Residual Connection）。

## 05 核心创新点

对CNN架构的依赖是没有必要的。一个纯Transformer架构（ViT），当在足够大的数据集上进行预训练时，能够在图像分类任务上达到最先进的水平，同时拥有更高的计算效率。这一工作开创性地将NLP领域的成功范式成功迁移到了视觉领域。

## 06 实验效果

实验结果表明，ViT的性能与其预训练的数据集规模呈现强相关。
在小数据集（如ImageNet）上：ViT的表现逊于同规模的ResNet。这证实了Transformer缺乏归纳偏置，在数据不足时难以有效学习。
在中等数据集（如ImageNet-21k）上：ViT的表现与ResNet相当。
在超大数据集（如JFT-300M）上：ViT的表现显著超越了最先进的ResNet（BiT）。大规模训练战胜了归纳偏置。

最高精度：最大的模型ViT-H/14在ImageNet上达到了88.55% 的Top-1准确率，在ImageNet-ReaL上达到了90.72%，在VTAB（19个任务的多样性基准）上达到了77.63%。
计算效率：达到相同性能，ViT所需的预训练计算资源（TPUv3-core-days）比BiT CNN少2-4倍。这表明ViT在扩展性上具有巨大优势。

## 07 适用场景与扩展

计算资源成本高；
