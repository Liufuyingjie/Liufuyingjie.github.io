---
slug: "an-image-is-worth-16x16-words-transformers-for-image-recognition-at-scal-1789998208583-fsoj8z"
title: "An Image Is Worth 16x16 Words: Transformers for Image Recognition at Scale（ViT）"
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

- **论文标题：** An Image Is Worth 16x16 Words: Transformers for Image Recognition at Scale（ViT）
- **中文标题：** 一张图等于16x16个词：大规模图像识别的Transformer
- **发表年份 / 卷期：** 2020
- **核心任务：** 图像检索，Transformer
- **模型名称：** Vision Transformer (ViT）

## 02 论文要解决的核心问题

CNN天生具有归纳偏置，如平移等变性和局部性，这使得它们在处理图像时非常高效。而Transformer架构缺乏这些先验知识，理论上需要从零开始学习图像的空间结构。
一个“纯净”的Transformer能否在图像任务中战胜拥有强大先验知识的CNN？

## 03 核心解决方案

将图像转换为Transformer能够处理的“序列”

## 04 训练 / 推理完整流程

#### 输入：原始图片，举例 224×224×3（RGB 三通道）

1. **切 patch**
把整张图切成不重叠的小方块，经典 ViT 用 patch 大小 16×16。
224 ÷16 =14，所以横向 14 块、纵向 14 块，一共 14×14=196 个 patch。
每个 patch：16×16×3，展平成一维向量，长度 = 16×16×3=768。
👉 得到：**196 个 patch token**，每个 token 是 768 维向量。
2. **加上可学习的位置编码**
图片是二维的，Transformer 本身不知道位置。给每个 patch token 加上一个 768 维的位置向量，告诉网络这个 patch 在图里的坐标。
3. **拼接 CLS token（关键一步）**
额外造一个**单独、可学习的 768 维向量，就是 CLS token**，放在序列最前面。
现在 token 序列变成：`[CLS(768), patch1(768), patch2(768), …, patch196(768)]`
总长度：197 个 token，每个 768 维。

> 这一整串，就是**送入 Transformer Block 的输入**。

#### 进入 Transformer Block（ViT 由很多个相同 Block 堆叠而成，比如 12 层）

一个 Block 内部顺序：
`多头自注意力(MHA) → 残差相加 → LayerNorm → FFN前馈网络 → 残差相加`

##### ① 多头自注意力（MHA，就是刚才讲的 head）

输入：197 个 token，每个 768 维

1. 全部 token 一起乘线性层，得到 Q、K、V，每个 token 各一套 768 维的 Q/K/V
2. **切分多头**：假设 8 个 head，把 768 维平均切 8 份，每份 96 维
   - head0：拿所有 token 的 Q0,K0,V0（96 维）单独算注意力
   - head1：拿 Q1,K1,V1（另一组 96 维）单独算注意力
   - … 一直到 head7
   ✅ 每个 head 独立看这 197 个 token 之间的相互关系，互不干扰
3. 每个 head 输出一组 197 个、96 维的 token 序列
4. 把 8 个 head 同位置的 token 拼接：96×8=768 维，变回原来维度
输出：**197 个 768 维 token**，序列长度不变，还是`[CLS, patch1…patch196]`

> 重点：CLS token 和所有 patch token 一起参与注意力计算！
> CLS 会和 196 个 patch 互相做注意力，吸收整张图片所有 patch 的信息。

##### ② 残差连接 + LayerNorm

把多头注意力输出，加上**最开始进入这个 block 的原始输入**（残差），再做归一化。

### ③ FFN（前馈网络）

每个 token 单独过两层 MLP，每个 token 独立计算，token 之间不再交互。
FFN 结束后，再做一次残差相加。

✅ 这就是**1 个 Transformer Block**。
ViT 会堆叠很多个 Block（ViT-B 是 12 层），**上一个 Block 输出的 197 个 token，直接作为下一个 Block 的输入**。
每一层，CLS 都会不断和 patch 交换信息，不断学习全局图像特征。

---

#### 全部 Transformer 层跑完之后（最后一层输出）

依然是 197 个 token：`[CLS_out, patch1_out, patch2_out,...,patch196_out]`

- 分类任务：**只拿第一个 CLS_out 这个 768 维向量**，送入最后的分类头，预测图片类别。CLS 已经融合了整张图信息。
- 图像检索（DINOv3）：两种选择
  1. 直接拿 CLS 向量，作为整图全局描述子（你现在 baseline 用的）
  2. 舍弃 CLS，把后面 196 个 patch token 做均值池化，得到全局向量，细粒度检索有时效果更好

输入图像 X
  ↓
切 patch，比如 224×224 切成 16×16，得到 196 个 patch
  ↓
线性投影，每个 patch 变成一个 token 向量
  ↓
加上 class token 和位置编码
  ↓
进入 L 层 Transformer
  ↓
每层做 MHSA + MLP
  ↓
输出最后一层的 class token 和 patch tokens
  ↓
检索任务

## 05 核心创新点

将 NLP 领域的成功范式成功迁移到了视觉领域

## 06 实验效果

实验结果表明，ViT的性能与其预训练的数据集规模呈现强相关。
在小数据集（如ImageNet）上：ViT的表现逊于同规模的ResNet。这证实了Transformer缺乏归纳偏置，在数据不足时难以有效学习。
在中等数据集（如ImageNet-21k）上：ViT的表现与ResNet相当。
在超大数据集（如JFT-300M）上：ViT的表现显著超越了最先进的ResNet（BiT）。大规模训练战胜了归纳偏置。

最高精度：最大的模型ViT-H/14在ImageNet上达到了88.55% 的Top-1准确率，在ImageNet-ReaL上达到了90.72%，在VTAB（19个任务的多样性基准）上达到了77.63%。
计算效率：达到相同性能，ViT所需的预训练计算资源（TPUv3-core-days）比BiT CNN少2-4倍。这表明ViT在扩展性上具有巨大优势。

## 07 适用场景与扩展

计算资源成本高；
Transformer时间复杂度为O（n2）；
