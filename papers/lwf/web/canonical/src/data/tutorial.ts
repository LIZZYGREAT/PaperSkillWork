import type { TutorialData } from '../types';

export const tutorial: TutorialData = {
  "meta": {
    "titleEn": "Learning without Forgetting",
    "titleZh": "不遗忘学习",
    "venue": "ECCV 2016 · arXiv:1606.09282v3",
    "authors": "Zhizhong Li · Derek Hoiem",
    "affiliation": "论文首页未列机构",
    "domain": "视觉分类与持续任务学习",
    "coreProblem": "无法访问旧任务训练数据时，怎样给已有卷积网络添加新预测能力并限制旧能力退化？",
    "coreInsight": "用旧模型在新任务输入上的旧任务响应作软约束，同时用新标签学习新任务。",
    "keywords": [
      "持续学习",
      "知识蒸馏",
      "卷积神经网络"
    ]
  },
  "hero": {
    "oldMethod": {
      "desc": "直接微调会更新共享层，旧任务表现存在退化风险。",
      "componentId": "lwf-hero"
    },
    "newMethod": {
      "desc": "LwF 在同一新输入上匹配旧响应，并学习新任务标签。",
      "componentId": "lwf-hero"
    }
  },
  "chapters": [
    {
      "kind": "chapter",
      "id": "chap-1",
      "title": "旧能力为何会退化？",
      "badge": "inf",
      "badgeLabel": "问题建模",
      "bridge": "先把视线放在一个已经会做旧任务的 CNN 上。新任务训练数据到来，但旧任务的训练数据已经不可用。",
      "analogy": {
        "title": "新词条与旧批注",
        "text": "校订员需要增加新词义，同时面对无法再翻看的旧例句册。",
        "componentId": "dictionary-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "1.1",
          "title": "直接微调与 LwF",
          "desc": "从同一旧模型出发，对照“适配新任务”和“保持旧任务”两条路径。条形仅为教学示意，不是论文结果。",
          "componentId": "problem-compare"
        }
      ],
      "insight": "新任务要改变共享表示，旧任务又依赖已有表示；要缓和冲突，需要给更新过程一个旧任务参照。",
      "takeaways": [
        {
          "icon": "⚠️",
          "title": "共享参数会变",
          "desc": "新任务训练可以改变多个旧任务共用的参数。"
        },
        {
          "icon": "🧩",
          "title": "目标并不相同",
          "desc": "学会新任务不代表保住旧任务。"
        },
        {
          "icon": "🗂️",
          "title": "旧样本不可用",
          "desc": "论文要在缺少旧任务训练数据时继续扩展能力。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-2",
      "title": "常见路线各自放弃什么？",
      "badge": "inf",
      "badgeLabel": "方法比较",
      "bridge": "遗忘风险已出现，接下来比较几种直接路线。每种方法都在适配能力、旧数据需求和旧任务稳定性之间取舍。",
      "analogy": {
        "title": "选择校订方式",
        "text": "有的办法保留旧版不动，有的重写共享释义，也有办法同时查阅新旧资料。",
        "componentId": "dictionary-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "2.1",
          "title": "切换训练路线",
          "desc": "选择特征提取、直接微调、联合训练或 LwF，观察哪些数据进入网络、共享层如何变化。",
          "componentId": "method-map"
        }
      ],
      "takeaways": [
        {
          "icon": "🧊",
          "title": "特征提取更稳",
          "desc": "冻结共享表示能保留旧特征，但限制新任务适配。"
        },
        {
          "icon": "🛠️",
          "title": "微调更灵活",
          "desc": "更新共享层更易适配，也有旧任务退化风险。"
        },
        {
          "icon": "🔒",
          "title": "联合训练需旧数据",
          "desc": "它会同时使用新旧任务样本，不符合本文核心场景。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-3",
      "title": "旧模型能留下什么？",
      "badge": "inf",
      "badgeLabel": "训练信号",
      "bridge": "既然旧样本缺席，旧模型仍可以对眼前的新样本作出判断。关键是辨清这一判断如何成为训练信号。",
      "analogy": {
        "title": "在新例句旁留旧批注",
        "text": "旧版词典不用拿出旧例句册；它仍能对当前这句话给出旧词义倾向。",
        "componentId": "dictionary-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "3.1",
          "title": "选择监督信号",
          "desc": "切换不可用的旧样本、旧模型在新输入上的响应与新任务标签；观察每种信号走向哪个输出。",
          "componentId": "signal-source"
        }
      ],
      "insight": "LwF 用新任务输入生成旧任务的软响应；它没有把旧任务样本藏进记忆库。",
      "formula": {
        "lead": "旧目标来自旧模型在新输入上的预测。",
        "unicode": "Y_o = f_old(X_n)",
        "symbols": [
          {
            "sym": "X_n",
            "desc": "新任务输入图像。"
          },
          {
            "sym": "Y_o",
            "desc": "旧模型对这些新图像产生的旧任务响应。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "📥",
          "title": "输入仍是新的",
          "desc": "旧模型处理的是当前可用的新任务图像。"
        },
        {
          "icon": "🎓",
          "title": "教师是旧模型",
          "desc": "它给出旧任务概率响应，而非新标签。"
        },
        {
          "icon": "🚫",
          "title": "不是样本回放",
          "desc": "旧任务原始图像及标签没有在此重新训练。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-4",
      "title": "一次新任务如何接入？",
      "badge": "trn",
      "badgeLabel": "训练过程",
      "bridge": "有了旧响应作为参照，还要把新输出接入网络。训练过程分成新头热身与全模型联合更新两段。",
      "analogy": {
        "title": "先试写，再统一校订",
        "text": "先让新词条能独立工作，再把共享释义和旧词条一起校订。",
        "componentId": "dictionary-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "4.1",
          "title": "逐步走完训练",
          "desc": "逐步查看响应记录、新头初始化、冻结旧参数的 warm-up 与联合优化；训练路径随阶段高亮。",
          "componentId": "training-steps"
        }
      ],
      "formula": {
        "lead": "先训练新头，之后优化共享层和全部任务头。",
        "unicode": "warm-up: θ_n → joint-optimize: θ_s, θ_o, θ_n",
        "symbols": [
          {
            "sym": "θ_s",
            "desc": "不同任务共用的 CNN 参数。"
          },
          {
            "sym": "θ_o",
            "desc": "已有旧任务头参数。"
          },
          {
            "sym": "θ_n",
            "desc": "新增任务头参数。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "➕",
          "title": "扩展输出头",
          "desc": "新类别对应新增的任务专属参数。"
        },
        {
          "icon": "⏸️",
          "title": "先冻结共享层",
          "desc": "warm-up 阶段只训练新头。"
        },
        {
          "icon": "🔄",
          "title": "再联合更新",
          "desc": "之后共享参数与旧、新任务头一起优化。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-5",
      "title": "温度如何保留软信息？",
      "badge": "trn",
      "badgeLabel": "蒸馏目标",
      "bridge": "旧模型给出的不只是最高概率类别。类别间较小的概率也能表达相对关系，温度会改变这种软目标的平滑程度。",
      "analogy": {
        "title": "保留词义的细微倾向",
        "text": "批注不只圈出一个答案，也留下其他词义与它相近到什么程度。",
        "componentId": "dictionary-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "5.1",
          "title": "调节蒸馏温度",
          "desc": "拖动温度滑杆，观察固定教学 logits 的概率分布如何变平滑；数值是教学示例，论文使用 T=2。",
          "componentId": "temperature-lab"
        }
      ],
      "formula": {
        "lead": "对概率按 1/T 次幂重标定并归一化。",
        "unicode": "p_T(i) = p(i)^(1/T) / Σ_j p(j)^(1/T)",
        "symbols": [
          {
            "sym": "p(i)",
            "desc": "旧模型对第 i 类给出的概率。"
          },
          {
            "sym": "T",
            "desc": "温度；论文实验取 T=2。"
          },
          {
            "sym": "p_T(i)",
            "desc": "温度变换后用于蒸馏的类别概率。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🌡️",
          "title": "温度改变分布",
          "desc": "T 大于 1 时较小概率的相对影响提高。"
        },
        {
          "icon": "🧠",
          "title": "软目标更细",
          "desc": "旧模型为多个类别保留了概率关系。"
        },
        {
          "icon": "🧪",
          "title": "论文设置为 2",
          "desc": "示例曲线不代表论文预测或实验结果。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-6",
      "title": "三项损失如何协作？",
      "badge": "trn",
      "badgeLabel": "联合目标",
      "bridge": "旧响应与新标签提供不同监督，普通权重衰减另作正则。总目标把三者放在同一次参数更新中。",
      "analogy": {
        "title": "把几种校对意见合起来",
        "text": "旧批注、新词条标签与常规校正规则共同影响这次修订。",
        "componentId": "dictionary-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "6.1",
          "title": "点选损失项",
          "desc": "选择旧响应蒸馏、新任务标签或 weight decay，查看对应输入与更新路径。",
          "componentId": "loss-lab"
        }
      ],
      "formula": {
        "lead": "LwF 同时最小化旧响应损失、新任务损失与正则项。",
        "unicode": "L_total = λ_o L_old + L_new + R",
        "symbols": [
          {
            "sym": "L_old",
            "desc": "当前旧任务响应与旧模型软目标之间的交叉熵。"
          },
          {
            "sym": "L_new",
            "desc": "新任务输出与真实标签之间的交叉熵。"
          },
          {
            "sym": "R",
            "desc": "普通 weight decay；实验中为 0.0005。"
          },
          {
            "sym": "λ_o",
            "desc": "调节旧任务响应损失权重。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "新标签教新任务",
          "desc": "交叉熵让新增输出符合新任务真实标签。"
        },
        {
          "icon": "🧭",
          "title": "旧响应提供参照",
          "desc": "蒸馏损失约束同一输入上的旧任务行为。"
        },
        {
          "icon": "🪶",
          "title": "R 是普通正则",
          "desc": "不要把 weight decay 误认为参数蒸馏或 EWC。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-7",
      "title": "旧任务权重怎样平衡？",
      "badge": "trn",
      "badgeLabel": "稳定性权衡",
      "bridge": "总目标中 λ_o 控制旧响应项的相对权重。它调整优化偏好，但不是旧任务准确率的保证开关。",
      "analogy": {
        "title": "调节旧批注的分量",
        "text": "校订时可以更重视旧批注，也可以更多倾向新词条的标注。",
        "componentId": "dictionary-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "7.1",
          "title": "移动 λ_o 滑杆",
          "desc": "调整旧响应损失的系数；画面只显示相对损失权重，不生成准确率曲线。",
          "componentId": "lambda-lab"
        }
      ],
      "takeaways": [
        {
          "icon": "⚖️",
          "title": "权重影响目标",
          "desc": "更大的 λ_o 提高旧响应损失的相对比重。"
        },
        {
          "icon": "1️⃣",
          "title": "多数实验取 1",
          "desc": "这是论文中常用的设置，不是通用最优值。"
        },
        {
          "icon": "🧯",
          "title": "不保证零遗忘",
          "desc": "权重无法让不具代表性的输入变成旧样本。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-8",
      "title": "共享层和任务头如何安排？",
      "badge": "trn",
      "badgeLabel": "结构与消融",
      "bridge": "训练目标讲清后，回到网络本身。LwF 既共享卷积主体，也为不同任务保留专属输出参数。",
      "analogy": {
        "title": "共享释义与任务索引",
        "text": "一本词典可共用底层释义，也可为新任务添加单独的分类索引。",
        "componentId": "dictionary-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "8.1",
          "title": "点选网络组件",
          "desc": "选择共享层、旧任务头或新任务头，观察当前参数的任务路径和更新阶段。",
          "componentId": "architecture-map"
        },
        {
          "kind": "module",
          "id": "8.2",
          "title": "切换结构消融",
          "desc": "探索输出层、更多 task-specific 层、网络扩展和低学习率方案；值来自 Table 2(a) 的 ImageNet→CUB。",
          "componentId": "design-ablation"
        }
      ],
      "formula": {
        "lead": "任务头根据共享表示产生各自任务输出。",
        "unicode": "x → f_θs(x) → {f_θo, f_θn}",
        "symbols": [
          {
            "sym": "f_θs",
            "desc": "共用的特征提取主体。"
          },
          {
            "sym": "f_θo",
            "desc": "已有旧任务输出头。"
          },
          {
            "sym": "f_θn",
            "desc": "新增任务输出头。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🧱",
          "title": "共享表示",
          "desc": "θ_s 供多个任务共同使用。"
        },
        {
          "icon": "🧩",
          "title": "任务专属头",
          "desc": "θ_o 与 θ_n 分别处理旧、新任务输出。"
        },
        {
          "icon": "📊",
          "title": "扩展不必然更好",
          "desc": "Table 2 的备选结构没有呈现一致优势。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-9",
      "title": "新输入代表旧任务吗？",
      "badge": "both",
      "badgeLabel": "适用边界",
      "bridge": "旧软目标只在眼前的新任务输入上生成。输入分布差异会影响这些响应是否能代表旧任务。",
      "analogy": {
        "title": "例句越陌生，旧批注越难参考",
        "text": "如果新例句远离旧词库语境，旧版词典的批注就不一定能保护旧语境中的能力。",
        "componentId": "dictionary-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "9.1",
          "title": "移动示意输入",
          "desc": "拖动输入点或用按钮调整它与旧域的定性关系；坐标不是论文定义的相似度量表。",
          "componentId": "domain-drag"
        }
      ],
      "insight": "LwF 限制新输入上的旧输出变化，无法仅凭这些样本保证整个旧分布不变。",
      "takeaways": [
        {
          "icon": "🧭",
          "title": "输入代表性重要",
          "desc": "新样本与旧任务越不相干，软目标越难覆盖旧域。"
        },
        {
          "icon": "🔁",
          "title": "顺序学习仍会漂移",
          "desc": "多任务阶段中，作者会重新计算其他旧任务的响应。"
        },
        {
          "icon": "🧱",
          "title": "缓解不等于消除",
          "desc": "LwF 不能保证完全不忘旧任务。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-10",
      "title": "实验结果支持到哪里？",
      "badge": "both",
      "badgeLabel": "实验与结论",
      "bridge": "最后用任务、指标和划分都明确的一组结果检验判断。读数支持局部比较，不是跨论文的通用排名。",
      "analogy": {
        "title": "逐项核对修订结果",
        "text": "校订完成后，将旧批注与新增词条分别复核，再看不同办法留下的取舍。",
        "componentId": "dictionary-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "10.1",
          "title": "启动 ImageNet→CUB 对照",
          "desc": "开始后逐步显示 Table 1(a) 的 AlexNet accuracy；后三种基线绝对值由论文报告的相对差值换算。",
          "componentId": "result-race"
        }
      ],
      "insight": "在这组 ImageNet→CUB 结果中，LwF 比 fine-tuning 保留更多旧任务准确率且新任务分数略高；限制和协议必须同时读。",
      "takeaways": [
        {
          "icon": "📈",
          "title": "旧任务保持较好",
          "desc": "该任务对中，LwF 高于直接微调的 ImageNet accuracy。"
        },
        {
          "icon": "🐦",
          "title": "新任务也有权衡",
          "desc": "LwF 高于该表 fine-tuning 的 CUB accuracy，但低于 feature extraction 的旧任务值。"
        },
        {
          "icon": "🔍",
          "title": "证据边界清楚",
          "desc": "结果绑定 AlexNet、指定 split、accuracy 与表格协议。"
        }
      ]
    }
  ],
  "bilibili": [
    {
      "bvid": "BV1Na41167aq",
      "title": "CVPR2021 PLOP: Learning without Forgetting for Continual Semantic Segmentation",
      "reason": "作为后续阅读，了解 LwF 思路在持续语义分割中的相关工作；这不是对 2016 年原论文的讲解。"
    }
  ]
};
