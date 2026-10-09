---
slug: "anyloc-towards-universal-visual-place-recognition-1791510047892-h3hd36"
title: "AnyLoc: Towards Universal Visual Place Recognition"
subtitle: "AnyLoc：传统视觉位置识别（VPR）"
eyebrow: "Paper Note · 2024"
date: "2024"
year: "2024"
journal: "IEEE Robotics and Automation Letters"
authors: "Nikhil Keetha et al."
affiliation: "CMU, IIIT Hyderabad, MIT, University of Adelaide"
code: "https://anyloc.github.io/"
task: "VPR"
model: "AnyLoc"
readingStatus: "阅读笔记"
---

## 01 论文基础信息

- **论文标题：** AnyLoc: Towards Universal Visual Place Recognition
- **中文标题：** AnyLoc：传统视觉位置识别（VPR）
- **发表期刊：** IEEE Robotics and Automation Letters
- **发表年份 / 卷期：** 2024
- **作者：** Nikhil Keetha et al.
- **单位：** CMU, IIIT Hyderabad, MIT, University of Adelaide
- **开源代码：** https://anyloc.github.io/
- **核心任务：** VPR
- **模型名称：** AnyLoc

## 02 论文要解决的核心问题

传统视觉位置识别（VPR）方法过度依赖于特定环境训练，导致其在未见过的新环境中性能急剧下降，无法实现真正的“通用性”部署。
属于视觉位置识别，与图像检索相关但目标不同的任务。VPR 的目标是识别出当前图像对应的“地点”，而不仅仅是检索相似的图像

## 03 核心解决方案

一个“免训练”的通用框架：摒弃针对 VPR 任务的训练或微调，使用大规模预训练模型，结合无监督特征聚合构建一个通用的位置识别系统

## 04 训练 / 推理完整流程

1.特征提取：使用冻结的dinov2提取第31层的patch。论文通过分析发现，这个中间层的特征在VPR任务上表现最佳
2.特征聚合：将提取到的大量patch压缩成一个全局描述子。采用两种聚合方式，GeM 和 VLAD

## 05 核心创新点



## 06 实验效果



## 07 适用场景与扩展


