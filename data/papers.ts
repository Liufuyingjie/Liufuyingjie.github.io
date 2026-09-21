export type Paper = {
  slug: string;
  title: string;
  subtitle: string;
  eyebrow: string;
  date: string;
  readingStatus: string;
  meta: Array<{ label: string; value: string }>;
  sections: Array<{
    number: string;
    title: string;
    content: string[];
  }>;
};

export const papers: Paper[] = [
  {
    slug: "eet",
    title: "Rethinking Vision Transformer for Large-Scale Fine-Grained Image Retrieval",
    subtitle: "重新思考视觉 Transformer 用于大规模细粒度图像检索",
    eyebrow: "Paper Note · 01",
    date: "2026",
    readingStatus: "Reading note",
    meta: [
      {
        label: "发表期刊",
        value: "IEEE Transactions on Multimedia (TMM)",
      },
      {
        label: "发表年份 / 卷期",
        value: "2026 · Vol. 28",
      },
      {
        label: "作者",
        value: "Xin Jiang, Hao Tang, Yonghua Pan, Zechao Li（通讯作者）",
      },
      {
        label: "单位",
        value: "南京理工大学、香港理工大学、广西科学院",
      },
      {
        label: "开源代码",
        value: "github.com/WhiteJiang/EET",
      },
      {
        label: "核心任务",
        value: "大规模细粒度图像检索 + 深度哈希 + ViT 高效化",
      },
      {
        label: "模型名称",
        value: "EET（Efficient and Effective ViT）",
      },
    ],
    sections: [
      {
        number: "02",
        title: "论文要解决的核心问题",
        content: [
          "在这里记录作者真正试图解决的研究问题。重点回答：现有方法为什么不够、瓶颈在哪里，以及这个问题为什么会影响大规模细粒度图像检索。",
          "建议阅读时把“现象—原因—后果”写清楚，而不是只复述摘要。",
        ],
      },
      {
        number: "03",
        title: "核心解决方案",
        content: [
          "在这里按照模块拆解 EET：输入是什么、特征如何提取、哪些模块负责效率、哪些模块负责效果，以及最终如何得到用于检索的表示。",
          "这一节是整篇笔记的核心，可以把论文 Figure 1 / Framework 用自己的语言重新讲一遍。",
        ],
      },
      {
        number: "04",
        title: "训练 / 推理完整流程",
        content: [
          "训练阶段：从输入图像开始，依次说明 backbone、特征处理、损失函数、优化目标和参数更新。",
          "推理阶段：说明数据库图像和查询图像分别如何编码，以及最终如何计算检索相似度并返回结果。",
        ],
      },
      {
        number: "05",
        title: "核心创新点",
        content: [
          "这里不要简单写“提出了一个新模块”，而是说明模块相对于已有方法改变了什么，以及为什么这个改变能够解决前面定义的痛点。",
          "建议控制在 3–5 条，每条都对应论文里的具体设计。",
        ],
      },
      {
        number: "06",
        title: "实验效果",
        content: [
          "记录数据集、评价指标、主要对比方法，以及作者报告的性能变化。",
          "重点记录：提升相对于什么 baseline、在哪些数据集上提升、效率指标是否同时改善，以及消融实验是否支持作者的设计。",
        ],
      },
      {
        number: "07",
        title: "适用场景与扩展",
        content: [
          "记录这套方法适合解决什么类型的检索问题，以及它依赖哪些前提。",
          "最后写自己的理解：哪些模块具有可迁移性、哪些设计只适用于当前任务，以及阅读后留下的疑问。",
        ],
      },
    ],
  },
];

export function getPaper(slug: string) {
  return papers.find((paper) => paper.slug === slug);
}
