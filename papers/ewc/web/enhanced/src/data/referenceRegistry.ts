import type { ReferenceRegistry } from "../shared/reference/types";

/** EWC 统一知识来源：summary/role 用于速览，details 用于 Hub。 */
export const referenceRegistry: ReferenceRegistry = {
  continual_learning: {
    "id": "continual_learning",
    "kind": "term",
    "title": "持续学习 · Continual learning",
    "summary": "任务数据按顺序到来，模型用同一组参数继续学习，并尽量保留旧任务能力。",
    "role": "新任务持续修改共享参数，可能破坏旧任务预测；需要同时考虑适应与保持。",
    "sourceCategory": "GENERAL_BACKGROUND",
    "sourceRefs": [
      "B06",
      "C10"
    ],
    "relatedIds": [
      "catastrophic_forgetting",
      "parameter_interference"
    ],
    "relatedPages": [
      {
        "pageId": "page-01-problem",
        "anchorId": "problem-context"
      }
    ],
    "details": [
      {
        "label": "Task-IL · 任务增量",
        "text": "测试时提供任务 ID；模型只需在该任务的类别中作答。"
      },
      {
        "label": "Domain-IL · 领域增量",
        "text": "类别集合不变，输入分布随任务改变；测试时不提供任务 ID。"
      },
      {
        "label": "Class-IL · 类别增量",
        "text": "新任务引入新类别；测试时不提供任务 ID，要在全部已见类别中判断。"
      },
      {
        "label": "本页例子 · Permuted MNIST · Domain-IL",
        "text": "同一组数字图像在各任务中使用不同固定像素排列，标签仍为 0–9，分类输出共用；按这三类设置看，它属于 Domain-IL。"
      }
    ],
    "keywords": [
      "continual learning",
      "lifelong learning",
      "持续学习",
      "Task-IL",
      "Domain-IL",
      "Class-IL"
    ]
  },
  catastrophic_forgetting: {
    "id": "catastrophic_forgetting",
    "kind": "term",
    "title": "灾难性遗忘 · Catastrophic Forgetting",
    "summary": "继续训练新任务时，模型参数可能改变，导致旧任务上的表现明显下降。",
    "role": "当新任务更新了旧任务也依赖的共享参数，旧任务能力就可能丢失。",
    "confusion": "它描述的是连续学习的一种失效现象，不是一种参数更新规则。",
    "sourceCategory": "PAPER_FACT",
    "sourceRefs": [
      "C01"
    ],
    "relatedIds": [
      "parameter_interference",
      "ewc"
    ],
    "relatedPages": [
      {
        "pageId": "page-01-problem",
        "anchorId": "parameter-conflict"
      }
    ],
    "keywords": [
      "forgetting",
      "遗忘",
      "旧任务性能",
      "shared parameters"
    ]
  },
  parameter_interference: {
    "id": "parameter_interference",
    "kind": "term",
    "title": "共享参数干扰 · Shared-parameter interference",
    "summary": "Task A 和 Task B 会共同依赖同一组网络参数。",
    "role": "Task B 的更新因此可能改变 Task A 所需的参数状态，这是连续训练导致遗忘的机制线索。",
    "confusion": "本页的性能变化是机制示意，不是论文报告的准确率数据。",
    "sourceCategory": "PAPER_FACT",
    "sourceRefs": [
      "C01",
      "C02"
    ],
    "relatedIds": [
      "catastrophic_forgetting",
      "ewc"
    ],
    "relatedPages": [
      {
        "pageId": "page-01-problem",
        "anchorId": "parameter-conflict"
      }
    ],
    "keywords": [
      "shared weights",
      "参数冲突",
      "parameter update"
    ]
  },
  ewc: {
    "id": "ewc",
    "kind": "term",
    "title": "弹性权重固结（EWC）",
    "fullName": "Elastic Weight Consolidation",
    "summary": "EWC 按旧任务参数的重要性，对偏离旧解的幅度施加不同强度的二次惩罚。",
    "role": "约束旧任务依赖的参数位置，同时允许模型继续学习新任务。",
    "confusion": "EWC 不会冻结所有参数；重要参数仍可变化，只是变化代价更高。",
    "sourceCategory": "PAPER_FACT",
    "sourceRefs": [
      "C02",
      "C06"
    ],
    "relatedIds": [
      "theta_a_star",
      "fisher_a",
      "ewc_objective"
    ],
    "relatedPages": [
      {
        "pageId": "page-06-ewc-objective",
        "anchorId": "ewc-objective"
      }
    ],
    "keywords": [
      "EWC",
      "parameter consolidation",
      "regularization"
    ]
  },
  normal_training: {
    "id": "normal_training",
    "kind": "method",
    "title": "普通训练 · Normal training",
    "summary": "针对当前任务的 Loss 计算梯度，并由 optimizer.step() 更新参数。",
    "role": "Page 5 用它和 Fisher Estimation 对照：普通训练会移动 θ；估计 Fisher 时参数固定。",
    "sourceCategory": "IMPLEMENTATION_MAPPING",
    "sourceRefs": [
      "M03"
    ],
    "relatedIds": [
      "optimizer_step",
      "fisher_estimation",
      "task_b_loss"
    ],
    "relatedPages": [
      {
        "pageId": "page-05-fisher",
        "anchorId": "training-vs-estimation"
      }
    ],
    "keywords": [
      "ordinary training",
      "normal training",
      "普通训练",
      "optimizer update"
    ],
    "confusion": "Backward 计算梯度；只有执行 optimizer.step() 才会更新参数。"
  },
  fisher_information: {
    "id": "fisher_information",
    "kind": "term",
    "title": "Fisher Information · Fisher 信息",
    "summary": "完整 Fisher 矩阵的一般形式是 score gradient 的外积期望；EWC 使用其对角近似来表示参数级局部敏感性。",
    "role": "在 EWC 中，对角 Fisher 近似 Task A 解附近的局部精度，用来区分参数约束的相对强弱。",
    "confusion": "Page 5 / 10 的 observed-label empirical-Fisher 逐样本梯度平方是教学背景示例；2017 年论文没有规定这一通用估计配方。对角 Fisher 也不是完整 Hessian 的精确值。",
    "sourceCategory": "PAPER_FACT",
    "sourceRefs": [
      "C04",
      "C05",
      "C11"
    ],
    "relatedIds": [
      "fisher_a",
      "fisher_a_i",
      "laplace_approximation",
      "ewc_penalty"
    ],
    "relatedPages": [
      {
        "pageId": "page-04-laplace",
        "anchorId": "fisher-handoff"
      },
      {
        "pageId": "page-05-fisher",
        "anchorId": "fisher-role"
      },
      {
        "pageId": "page-06-ewc-objective",
        "anchorId": "penalty-components"
      }
    ],
    "keywords": [
      "F_A",
      "local sensitivity",
      "precision",
      "局部敏感性",
      "参数重要性"
    ],
    "details": [
      {
        "label": "一般定义",
        "text": "F(θ)=Eₓ,y∼pθ[ggᵀ]，g=∇θ log pθ(y|x)。模型分布下的 score 外积期望非负；小幅位移的预测 KL 变化近似为 ½ΔθᵀFΔθ。",
        "sourceRefs": [
          "B05"
        ]
      },
      {
        "label": "EWC 的近似",
        "text": "完整矩阵需 P² 项；对角化只保存 P 个逐坐标项，同时忽略耦合。论文以对角 Fisher 近似局部精度，不能把它和有限数据的后验 Hessian 精确等同。",
        "sourceRefs": [
          "C04",
          "C05",
          "C11"
        ]
      },
      {
        "label": "经验估计边界",
        "text": "P5 使用观测标签逐样本 score² 平均作教学估计。标签来自数据而非模型分布，因此一般不同于期望 Fisher；2017 论文没有规定这一逐样本配方。",
        "sourceRefs": [
          "B02",
          "B03"
        ]
      }
    ]
  },
  laplace_approximation: {
    "id": "laplace_approximation",
    "kind": "term",
    "title": "Laplace 局部近似 · Laplace approximation",
    "summary": "在 Task A 学到的参数位置附近，用 Gaussian 近似复杂的参数 Posterior。",
    "role": "它把局部曲率与 Gaussian 的宽窄联系起来，为后续理解 EWC 的参数约束作准备。",
    "confusion": "局部 Hessian 是解释近似的数学视图；论文使用对角 Fisher 作为精度近似，并非精确的完整 Hessian。",
    "sourceCategory": "PAPER_FACT",
    "sourceRefs": [
      "C04",
      "C05"
    ],
    "relatedIds": [
      "fisher_information",
      "fisher_a",
      "local_precision",
      "theta_a_star"
    ],
    "relatedPages": [
      {
        "pageId": "page-04-laplace",
        "anchorId": "laplace-local-view"
      }
    ],
    "keywords": [
      "local Gaussian",
      "posterior approximation",
      "Laplace"
    ]
  },
  local_precision: {
    "id": "local_precision",
    "kind": "term",
    "title": "局部精度 · Local Precision",
    "summary": "描述局部 Gaussian 沿不同参数方向收缩得有多紧。",
    "role": "在近似的数学视图中，精度越高的方向越窄，同等距离的参数移动对应更大的局部变化。",
    "confusion": "论文用对角 Fisher 近似局部精度；不能据此说它等于完整 Hessian。",
    "sourceCategory": "PAPER_FACT",
    "sourceRefs": [
      "C04",
      "C05"
    ],
    "relatedIds": [
      "laplace_approximation",
      "fisher_information",
      "fisher_a"
    ],
    "relatedPages": [
      {
        "pageId": "page-04-laplace",
        "anchorId": "narrow-wide-directions"
      },
      {
        "pageId": "page-05-fisher",
        "anchorId": "fisher-role"
      }
    ],
    "keywords": [
      "local precision",
      "Gaussian width",
      "局部精度",
      "曲率"
    ],
    "details": [
      {
        "label": "曲率到宽度",
        "text": "正定局部精度 H 是 Gaussian 协方差的逆；同等位移 Δθ 的负对数密度增加为 ½ΔθᵀHΔθ。更大精度意味着该方向更窄。",
        "sourceRefs": [
          "C04"
        ]
      }
    ]
  },
  fisher_estimation: {
    "id": "fisher_estimation",
    "kind": "phase",
    "title": "Fisher 估计流程",
    "summary": "Task A 训练结束后，在固定的 θ_A* 附近计算所选敏感性估计。",
    "role": "本教程的流程开启梯度计算、关闭 optimizer.step()，因此不会更新模型参数。",
    "confusion": "固定参数与具体经验 Fisher 配方属于教程实现映射；论文没有规定这里展示的逐样本经验 Fisher 算法。",
    "sourceCategory": "IMPLEMENTATION_MAPPING",
    "sourceRefs": [
      "M03"
    ],
    "relatedIds": [
      "theta_a_star",
      "fisher_a",
      "empirical_fisher_estimator_background"
    ],
    "relatedPages": [
      {
        "pageId": "page-05-fisher",
        "anchorId": "fisher-estimation"
      },
      {
        "pageId": "page-05-fisher",
        "anchorId": "training-vs-estimation"
      }
    ],
    "keywords": [
      "consolidation",
      "no optimizer update",
      "不更新参数"
    ]
  },
  empirical_fisher_estimator_background: {
    "id": "empirical_fisher_estimator_background",
    "kind": "advanced",
    "title": "观测标签 Empirical Fisher · 教学背景",
    "summary": "对每个观测标签样本计算 log probability 的 score gradient，外积后按样本求和或平均。",
    "role": "本页取对角项，即逐参数梯度平方，再跨 Task A 样本平均，演示估计值如何进入 Fisher accumulator。",
    "confusion": "这不是 2017 年 EWC 论文规定的 Fisher 估计配方，也不同于对模型预测分布取期望的 Fisher。",
    "sourceCategory": "GENERAL_BACKGROUND",
    "sourceRefs": [
      "B02",
      "B03"
    ],
    "relatedIds": [
      "fisher_estimation",
      "fisher_information"
    ],
    "relatedPages": [
      {
        "pageId": "page-05-fisher",
        "anchorId": "square-and-aggregate"
      }
    ],
    "boundary": "所选教学估计示例，不声称 Kirkpatrick 等人采用了这套通用配方。",
    "keywords": [
      "empirical Fisher",
      "observed label",
      "gradient square",
      "background"
    ]
  },
  theta_a_star: {
    "id": "theta_a_star",
    "kind": "symbol",
    "title": "Task A 参数锚点 · θ_A*",
    "summary": "Task A 普通训练结束时学到的参数位置。",
    "role": "Laplace 近似以它为局部中心；后续 Fisher 与 EWC 使用这个旧任务参考位置。",
    "confusion": "θ_A* 是固定的旧参数快照，不会跟着当前参数 θ 一起变化。",
    "sourceCategory": "PAPER_FACT",
    "sourceRefs": [
      "C04",
      "C06"
    ],
    "symbol": "θ_A*",
    "createdWhen": "After normal training on Task A.",
    "usedWhen": "During Fisher estimation and Task-B EWC updates.",
    "runtimeObject": "task-a-anchor",
    "trainable": "No; this saved reference stays fixed.",
    "relatedIds": [
      "fisher_a",
      "ewc_objective"
    ],
    "relatedPages": [
      {
        "pageId": "page-04-laplace",
        "anchorId": "posterior-global-to-local"
      },
      {
        "pageId": "page-05-fisher",
        "anchorId": "fisher-estimation"
      },
      {
        "pageId": "page-06-ewc-objective",
        "anchorId": "penalty-components"
      }
    ],
    "keywords": [
      "anchor",
      "theta A star",
      "旧任务位置",
      "saved parameters"
    ]
  },
  fisher_a: {
    "id": "fisher_a",
    "kind": "symbol",
    "title": "Task A 对角 Fisher · F_A",
    "summary": "与 Task A 已学参数位置对应的 Fisher 局部敏感性近似。",
    "role": "它逐参数提供相对敏感程度，供 Task B 的 EWC 约束使用。",
    "confusion": "本页逐样本观测标签梯度平方的估计流程是教学背景示例；论文没有规定这一具体配方。",
    "sourceCategory": "PAPER_FACT",
    "sourceRefs": [
      "C04",
      "C05"
    ],
    "symbol": "F_A",
    "createdWhen": "At the Task-A boundary, after its solution is reached.",
    "usedWhen": "As a weight in the Task-B EWC penalty.",
    "runtimeObject": "task-a-fisher",
    "typicalShape": "Aligned with parameter blocks; mathematically parameter-wise.",
    "relatedIds": [
      "fisher_information",
      "theta_a_star",
      "ewc_objective"
    ],
    "relatedPages": [
      {
        "pageId": "page-05-fisher",
        "anchorId": "fisher-role"
      },
      {
        "pageId": "page-06-ewc-objective",
        "anchorId": "penalty-components"
      }
    ],
    "keywords": [
      "Fisher",
      "F_A",
      "Task A importance"
    ]
  },
  fisher_a_i: {
    "id": "fisher_a_i",
    "kind": "symbol",
    "title": "单参数 Fisher 权重 · F_A,i",
    "summary": "Task A 局部敏感性近似中，与参数 θ_i 对应的对角值。",
    "role": "它为 Task B 中同一参数的偏移设置相对约束强度。",
    "confusion": "图中的 Layer 只是分组显示；每个参数仍有自己的 Fisher 值。",
    "sourceCategory": "PAPER_FACT",
    "sourceRefs": [
      "C04",
      "C06"
    ],
    "symbol": "F_{A,i}",
    "runtimeObject": "task-a-fisher",
    "relatedIds": [
      "fisher_a",
      "lambda_ewc",
      "ewc_penalty"
    ],
    "relatedPages": [
      {
        "pageId": "page-06-ewc-objective",
        "anchorId": "penalty-components"
      }
    ],
    "keywords": [
      "F_i",
      "diagonal Fisher",
      "parameter-wise"
    ]
  },
  lambda_ewc: {
    "id": "lambda_ewc",
    "kind": "symbol",
    "title": "EWC 整体强度 · λ",
    "summary": "λ 调整 EWC 旧任务约束在整体目标中的强弱。",
    "role": "F_A,i 区分参数之间的相对约束强弱；λ 同时缩放整条 EWC 约束。",
    "confusion": "λ 是全局系数，F_A,i 是逐参数的 Fisher 权重，两者作用不同。",
    "sourceCategory": "PAPER_FACT",
    "sourceRefs": [
      "C06"
    ],
    "symbol": "λ",
    "runtimeObject": "ewc-penalty",
    "relatedIds": [
      "fisher_a_i",
      "ewc_objective"
    ],
    "relatedPages": [
      {
        "pageId": "page-06-ewc-objective",
        "anchorId": "ewc-objective"
      }
    ],
    "keywords": [
      "lambda",
      "global scale",
      "整体强度"
    ]
  },
  ewc_objective: {
    "id": "ewc_objective",
    "kind": "formula",
    "title": "Task B 的 EWC 目标",
    "summary": "Equation (3) 把当前任务 Loss 与旧任务的 Fisher 加权二次惩罚相加。",
    "role": "Task B 的梯度与 EWC 惩罚梯度共同进入优化器。",
    "confusion": "惩罚提高远离 θ_A* 的代价，不会冻结参数；页面上的梯度是对公式求导得到的实现对应。",
    "sourceCategory": "PAPER_FACT",
    "sourceRefs": [
      "C06"
    ],
    "expression": "L_B(θ) + (λ/2) Σ_i F_{A,i}(θ_i − θ_{A,i}*)²",
    "variables": [
      "task_b_loss",
      "lambda_ewc",
      "fisher_a_i",
      "theta",
      "theta_a_star"
    ],
    "derivationFrom": [
      "sequential_bayes",
      "laplace_approximation"
    ],
    "runtimeMapping": [
      "task-b-loss",
      "ewc-penalty",
      "total-gradient"
    ],
    "usedIn": [
      "page-06-ewc-objective"
    ],
    "relatedIds": [
      "ewc_penalty",
      "ewc_gradient",
      "total_gradient"
    ],
    "relatedPages": [
      {
        "pageId": "page-06-ewc-objective",
        "anchorId": "ewc-objective"
      }
    ],
    "keywords": [
      "Equation 3",
      "EWC loss",
      "penalty",
      "目标函数"
    ],
    "boundary": "对角 Fisher 是局部精度近似；参数仍可更新。"
  },
  task_b_loss: {
    "id": "task_b_loss",
    "kind": "symbol",
    "title": "Task B 新任务 Loss · L_B(θ)",
    "summary": "模型当前参数对新任务数据 D_B 的普通训练损失。",
    "role": "它提供 EWC 目标中的新任务学习信号，并产生 Task-B gradient。",
    "sourceCategory": "PAPER_FACT",
    "sourceRefs": [
      "C06"
    ],
    "symbol": "L_B(θ)",
    "runtimeObject": "task-b-loss",
    "trainable": "The parameters it depends on are updated during Task-B training.",
    "relatedIds": [
      "ewc_objective",
      "task_b_gradient"
    ],
    "relatedPages": [
      {
        "pageId": "page-06-ewc-objective",
        "anchorId": "ewc-objective"
      }
    ],
    "keywords": [
      "new task loss",
      "Task B",
      "L_B"
    ]
  },
  ewc_penalty: {
    "id": "ewc_penalty",
    "kind": "formula",
    "title": "旧任务二次约束 · EWC Penalty",
    "summary": "以 θ_A* 为中心，对参数偏移平方，并按 F_A,i 逐参数加权。",
    "role": "高 Fisher 参数偏离旧锚点时会产生更高代价；λ 再调整整体约束强度。",
    "sourceCategory": "PAPER_FACT",
    "sourceRefs": [
      "C06"
    ],
    "expression": "(λ/2) Σ_i F_{A,i}(θ_i − θ_{A,i}*)²",
    "variables": [
      "lambda_ewc",
      "fisher_a_i",
      "theta",
      "theta_a_star"
    ],
    "runtimeMapping": [
      "ewc-penalty"
    ],
    "usedIn": [
      "page-06-ewc-objective"
    ],
    "relatedIds": [
      "fisher_a_i",
      "theta_a_star",
      "lambda_ewc"
    ],
    "relatedPages": [
      {
        "pageId": "page-06-ewc-objective",
        "anchorId": "penalty-components"
      }
    ],
    "boundary": "提高偏移代价，更新量不会因此被直接设为零。",
    "confusion": "它改变参数偏移的代价，不会把参数更新量设为零。"
  },
  likelihood: {
    "id": "likelihood",
    "kind": "term",
    "title": "Likelihood · 似然",
    "fullName": "Likelihood / 似然",
    "summary": "固定已观察的输入与真实标签，改变 θ；各真实标签条件概率的乘积评价这组参数对同一数据的解释力。",
    "role": "本页把输入 xₙ 作为已给定条件，将每个真实标签概率 pθ(yₙ | xₙ) 相乘，得到条件似然。",
    "confusion": "Likelihood 是 θ 的函数，未在参数空间归一化，不能把它当成 p(θ | D)。",
    "sourceCategory": "GENERAL_BACKGROUND",
    "relatedIds": [
      "p_D_given_theta",
      "p_theta_y_given_x"
    ],
    "relatedPages": [
      {
        "pageId": "page-02-probability",
        "anchorId": "likelihood-comparison"
      },
      {
        "pageId": "page-03-bayes",
        "anchorId": "prior-likelihood-posterior"
      }
    ],
    "keywords": [
      "likelihood",
      "似然",
      "probability",
      "概率",
      "假阳性",
      "base rate"
    ],
    "details": [
      {
        "label": "从 P2 计算",
        "text": "D={(xₙ,yₙ)}；已知输入作为条件。条件独立假设下 p(D | θ)=∏ₙ pθ(yₙ | xₙ)。每项取自该样本 Softmax 中的真实标签位置；取负对数得到 NLL。",
        "sourceRefs": [
          "B01",
          "C12"
        ]
      },
      {
        "label": "为什么用于比较参数",
        "text": "对同一份 D，给真实标签更高概率的 θ 通常取得更高乘积、更低 NLL；P3 复用这些分数，与 Prior 相乘并归一化。"
      }
    ]
  },
  p_D_given_theta: {
    "id": "p_D_given_theta",
    "kind": "symbol",
    "title": "数据的 Likelihood · Dataset likelihood",
    "summary": "把已观察输入 xₙ 作为条件，在样本条件独立假设下相乘各真实标签的预测概率。",
    "role": "固定已观察的 (xₙ,yₙ)，切换 θ；乘积越大，这组参数给观测标签的条件似然越高。",
    "sourceCategory": "GENERAL_BACKGROUND",
    "sourceRefs": ["B01", "C12"],
    "symbol": "p(D | θ)",
    "relatedIds": [
      "likelihood",
      "p_theta_y_given_x"
    ],
    "relatedPages": [
      {
        "pageId": "page-02-probability",
        "anchorId": "likelihood-origin"
      },
      {
        "pageId": "page-03-bayes",
        "anchorId": "prior-likelihood-posterior"
      },
      {
        "pageId": "page-06-ewc-objective",
        "anchorId": "ewc-objective"
      }
    ],
    "keywords": [
      "p(D|θ)",
      "dataset likelihood",
      "数据似然"
    ],
    "confusion": "这里组合的是 pθ(yₙ | xₙ)，不建模输入 xₙ 的生成概率；作为 θ 的函数时也不是归一化的参数概率分布。"
  },
  prior: {
    "id": "prior",
    "kind": "term",
    "title": "参数先验 · Prior",
    "summary": "数据到来前，对不同参数配置合理性的概率描述。",
    "role": "它与数据 Likelihood 一起，构成看完数据后的 Posterior。",
    "confusion": "Prior 不是网络 Forward 自动得到的输出，而是 Bayesian 模型中的先验选择。",
    "sourceCategory": "PAPER_FACT",
    "sourceRefs": [
      "C13"
    ],
    "relatedIds": [
      "p_theta",
      "likelihood",
      "posterior",
      "sequential_bayes"
    ],
    "relatedPages": [
      {
        "pageId": "page-03-bayes",
        "anchorId": "prior-likelihood-posterior"
      }
    ],
    "keywords": [
      "prior",
      "parameter prior",
      "先验",
      "参数分布"
    ],
    "details": [
      {
        "label": "建模约束",
        "text": "Prior 在使用当前数据之前指定，必须非负且归一化。零 Prior 的区域不会被本次 Bayes 更新恢复。它表达已有知识与假设，不是 Forward 的输出。",
        "sourceRefs": [
          "C13"
        ]
      },
      {
        "label": "Gaussian Prior 与 L2",
        "text": "零均值各向同性 Gaussian 的负对数产生 L2 惩罚。这是背景例子，论文没有指定一般先验必须采用此形式。",
        "sourceRefs": [
          "B04"
        ]
      }
    ]
  },
  posterior: {
    "id": "posterior",
    "kind": "term",
    "title": "后验 · Posterior",
    "summary": "Bayes 用 Likelihood × Prior 重新加权参数配置，再除以 Evidence；数据解释力高的区域在相同 Prior 下得到更高相对支持。",
    "role": "Task A 的 Posterior 将旧任务信息带入 Task B 的顺序更新。",
    "confusion": "Posterior 表示对参数配置的分布，不是神经网络的一次前向输出。",
    "sourceCategory": "PAPER_FACT",
    "sourceRefs": [
      "C03",
      "C13"
    ],
    "relatedIds": [
      "prior",
      "likelihood",
      "p_theta_given_D",
      "task_a_posterior",
      "task_b_posterior"
    ],
    "relatedPages": [
      {
        "pageId": "page-03-bayes",
        "anchorId": "prior-likelihood-posterior"
      },
      {
        "pageId": "page-03-bayes",
        "anchorId": "sequential-update"
      }
    ],
    "keywords": [
      "posterior",
      "后验",
      "parameter belief",
      "参数分布"
    ],
    "details": [
      {
        "label": "运算机制",
        "text": "p(θ | D)=p(D | θ)p(θ)/p(D)。两配置的后验比=Likelihood 比×Prior 比；Evidence 消去，因而不改变相对排序。",
        "sourceRefs": [
          "C13"
        ]
      },
      {
        "label": "位置与形状",
        "text": "MAP 给出中心位置。Φ=−log Posterior 的局部曲率决定同等偏移的密度下降：p(θ)/p(θ*)≈exp(−½ΔθᵀHΔθ)。大曲率方向更窄、移动代价更高。",
        "sourceRefs": [
          "C04"
        ]
      },
      {
        "label": "教学例子",
        "text": "½(8Δθ₁²+0.5Δθ₂²)：两坐标分别偏移 0.5，密度因子约为 0.368 与 0.939。数值非论文实测。"
      }
    ]
  },
  sequential_bayes: {
    "id": "sequential_bayes",
    "kind": "formula",
    "title": "顺序 Bayes 更新 · Sequential Bayesian update",
    "summary": "把 Task A 的参数 Posterior 与 Task B 的数据 Likelihood 结合。",
    "role": "Page 6 从这个关系出发，将 Task-B Likelihood 转为 Loss，并把旧 Posterior 的局部近似转为惩罚项。",
    "sourceCategory": "PAPER_FACT",
    "sourceRefs": [
      "C03",
      "C13"
    ],
    "expression": "p(θ | D_A, D_B) ∝ p(D_B | θ) p(θ | D_A)",
    "variables": [
      "task_a_posterior",
      "task_b_posterior",
      "task_a_data",
      "task_b_data",
      "theta"
    ],
    "derivationFrom": [
      "prior",
      "posterior",
      "likelihood"
    ],
    "usedIn": [
      "page-03-bayes",
      "page-06-ewc-objective"
    ],
    "relatedIds": [
      "task_a_posterior",
      "task_b_posterior",
      "task_a_data",
      "task_b_data"
    ],
    "relatedPages": [
      {
        "pageId": "page-03-bayes",
        "anchorId": "sequential-update"
      },
      {
        "pageId": "page-06-ewc-objective",
        "anchorId": "ewc-objective"
      }
    ],
    "keywords": [
      "sequential Bayesian update",
      "Bayes Rule",
      "顺序更新",
      "task posterior"
    ]
  },
  p_theta: {
    "id": "p_theta",
    "kind": "symbol",
    "title": "参数先验 · p(θ)",
    "summary": "数据到来前，对不同参数配置合理性的概率描述。",
    "role": "它与数据 Likelihood 一起，构成看完数据后的 Posterior。",
    "confusion": "Prior 不是网络 Forward 自动得到的输出，而是 Bayesian 模型中的先验选择。",
    "sourceCategory": "PAPER_FACT",
    "sourceRefs": [
      "C13"
    ],
    "symbol": "p(θ)",
    "relatedIds": [
      "prior",
      "p_D_given_theta",
      "p_theta_given_D"
    ],
    "relatedPages": [
      {
        "pageId": "page-03-bayes",
        "anchorId": "prior-likelihood-posterior"
      }
    ],
    "keywords": [
      "p(theta)",
      "parameter prior",
      "参数先验"
    ],
    "details": [
      {
        "label": "建模约束",
        "text": "Prior 在使用当前数据之前指定，必须非负且归一化。零 Prior 的区域不会被本次 Bayes 更新恢复。它表达已有知识与假设，不是 Forward 的输出。",
        "sourceRefs": [
          "C13"
        ]
      },
      {
        "label": "Gaussian Prior 与 L2",
        "text": "零均值各向同性 Gaussian 的负对数产生 L2 惩罚。这是背景例子，论文没有指定一般先验必须采用此形式。",
        "sourceRefs": [
          "B04"
        ]
      }
    ]
  },
  p_theta_given_D: {
    "id": "p_theta_given_D",
    "kind": "symbol",
    "title": "参数后验 · p(θ | D)",
    "summary": "Bayes 用 Likelihood × Prior 重新加权参数配置，再除以 Evidence；数据解释力高的区域在相同 Prior 下得到更高相对支持。",
    "role": "Task A 的 Posterior 将旧任务信息带入 Task B 的顺序更新。",
    "confusion": "Posterior 表示对参数配置的分布，不是神经网络的一次前向输出。",
    "sourceCategory": "PAPER_FACT",
    "sourceRefs": [
      "C13"
    ],
    "symbol": "p(θ | D)",
    "relatedIds": [
      "posterior",
      "p_theta",
      "p_D_given_theta"
    ],
    "relatedPages": [
      {
        "pageId": "page-03-bayes",
        "anchorId": "prior-likelihood-posterior"
      }
    ],
    "keywords": [
      "p(theta|D)",
      "parameter posterior",
      "参数后验"
    ],
    "details": [
      {
        "label": "运算机制",
        "text": "p(θ | D)=p(D | θ)p(θ)/p(D)。两配置的后验比=Likelihood 比×Prior 比；Evidence 消去，因而不改变相对排序。",
        "sourceRefs": [
          "C13"
        ]
      },
      {
        "label": "位置与形状",
        "text": "MAP 给出中心位置。Φ=−log Posterior 的局部曲率决定同等偏移的密度下降：p(θ)/p(θ*)≈exp(−½ΔθᵀHΔθ)。大曲率方向更窄、移动代价更高。",
        "sourceRefs": [
          "C04"
        ]
      },
      {
        "label": "教学例子",
        "text": "½(8Δθ₁²+0.5Δθ₂²)：两坐标分别偏移 0.5，密度因子约为 0.368 与 0.939。数值非论文实测。"
      }
    ]
  },
  task_a_posterior: {
    "id": "task_a_posterior",
    "kind": "symbol",
    "title": "Task A 参数后验 · p(θ | D_A)",
    "summary": "观察 Task A 数据后，对参数配置形成的 Posterior。",
    "role": "顺序 Bayes 更新会把它带入 Task B；本页再从完整 Posterior 聚焦到 θ_A* 附近做局部近似。",
    "confusion": "这是推导中的分布对象，不表示程序必须保存完整的高维分布。",
    "sourceCategory": "PAPER_FACT",
    "sourceRefs": [
      "C03",
      "C13"
    ],
    "symbol": "p(θ | D_A)",
    "relatedIds": [
      "sequential_bayes",
      "task_b_posterior",
      "theta_a_star",
      "laplace_approximation"
    ],
    "relatedPages": [
      {
        "pageId": "page-03-bayes",
        "anchorId": "sequential-update"
      },
      {
        "pageId": "page-04-laplace",
        "anchorId": "posterior-global-to-local"
      },
      {
        "pageId": "page-06-ewc-objective",
        "anchorId": "ewc-objective"
      }
    ],
    "keywords": [
      "Task A posterior",
      "p(theta|D_A)",
      "旧任务后验"
    ],
    "details": [
      {
        "label": "运算机制",
        "text": "p(θ | D)=p(D | θ)p(θ)/p(D)。两配置的后验比=Likelihood 比×Prior 比；Evidence 消去，因而不改变相对排序。",
        "sourceRefs": [
          "C13"
        ]
      },
      {
        "label": "位置与形状",
        "text": "MAP 给出中心位置。Φ=−log Posterior 的局部曲率决定同等偏移的密度下降：p(θ)/p(θ*)≈exp(−½ΔθᵀHΔθ)。大曲率方向更窄、移动代价更高。",
        "sourceRefs": [
          "C04"
        ]
      },
      {
        "label": "教学例子",
        "text": "½(8Δθ₁²+0.5Δθ₂²)：两坐标分别偏移 0.5，密度因子约为 0.368 与 0.939。数值非论文实测。"
      }
    ]
  },
  task_b_posterior: {
    "id": "task_b_posterior",
    "kind": "symbol",
    "title": "Task B 后验 · p(θ | D_A, D_B)",
    "summary": "把 Task A 的 Posterior 与 Task B 的数据 Likelihood 结合后得到的参数分布。",
    "role": "它是顺序 Bayes 关系的左侧结果；本页从右侧两部分继续构造可优化的 EWC Loss。",
    "sourceCategory": "PAPER_FACT",
    "sourceRefs": [
      "C03"
    ],
    "symbol": "p(θ | D_A, D_B)",
    "relatedIds": [
      "sequential_bayes",
      "task_a_posterior"
    ],
    "relatedPages": [
      {
        "pageId": "page-03-bayes",
        "anchorId": "sequential-update"
      },
      {
        "pageId": "page-06-ewc-objective",
        "anchorId": "ewc-objective"
      }
    ],
    "keywords": [
      "Task B posterior",
      "p(theta|D_A,D_B)",
      "顺序 Bayes"
    ]
  },
  optimizer_step: {
    "id": "optimizer_step",
    "kind": "method",
    "title": "优化器更新 · Optimizer update",
    "summary": "使用反向计算得到的梯度，更新当前模型参数。",
    "role": "Page 5 估计 Fisher 时关闭这一步；Page 6 Task B 训练时，它接收总梯度并更新 θ。",
    "confusion": "反向计算得到梯度；optimizer.step() 才真正更新参数。EWC 不会替代优化器。",
    "sourceCategory": "IMPLEMENTATION_MAPPING",
    "sourceRefs": [
      "M03"
    ],
    "relatedIds": [
      "fisher_estimation",
      "total_gradient"
    ],
    "relatedPages": [
      {
        "pageId": "page-05-fisher",
        "anchorId": "training-vs-estimation"
      },
      {
        "pageId": "page-06-ewc-objective",
        "anchorId": "gradient-junction"
      }
    ],
    "keywords": [
      "optimizer.step",
      "backward",
      "update",
      "不更新参数"
    ]
  },
  p_theta_y_given_x: {
    "id": "p_theta_y_given_x",
    "kind": "symbol",
    "title": "网络预测概率 · Network prediction probability",
    "summary": "给定输入 x 和当前参数 θ，网络输出各标签的预测概率。",
    "role": "它把网络前向计算连接到数据似然与训练损失。",
    "sourceCategory": "GENERAL_BACKGROUND",
    "sourceRefs": [
      "B01"
    ],
    "symbol": "p_θ(y | x)",
    "runtimeObject": "prediction-probabilities",
    "usedWhen": "Before taking the log-probability gradient in the selected estimator walkthrough.",
    "relatedIds": [
      "neural_network",
      "empirical_fisher_estimator_background"
    ],
    "relatedPages": [
      {
        "pageId": "page-02-probability",
        "anchorId": "forward-probability"
      },
      {
        "pageId": "page-05-fisher",
        "anchorId": "score-gradient"
      }
    ],
    "keywords": [
      "probability",
      "forward pass",
      "prediction",
      "预测概率"
    ]
  },
  theta: {
    "id": "theta",
    "kind": "symbol",
    "title": "当前模型参数 · θ",
    "summary": "Task B 训练过程中继续更新的同一组模型参数。",
    "role": "EWC 比较当前 θ 与固定的 Task-A 快照 θ_A*，惩罚的是高敏感坐标上的偏移。",
    "sourceCategory": "PAPER_FACT",
    "sourceRefs": [
      "C01",
      "C06"
    ],
    "symbol": "θ",
    "runtimeObject": "current-parameters",
    "relatedIds": [
      "theta_a_star",
      "ewc_objective"
    ],
    "relatedPages": [
      {
        "pageId": "page-06-ewc-objective",
        "anchorId": "penalty-components"
      }
    ],
    "keywords": [
      "parameters",
      "weights",
      "模型参数"
    ],
    "confusion": "当前 θ 是可训练参数；θ_A* 是保存下来的旧任务锚点，二者不会一起移动。"
  },
  task_b_gradient: {
    "id": "task_b_gradient",
    "kind": "symbol",
    "title": "Task B 梯度 · g_B",
    "summary": "由当前任务 Loss 对模型参数求导得到。",
    "role": "它提供学习新任务的更新信号，并与 EWC gradient 相加后送入优化器。",
    "sourceCategory": "IMPLEMENTATION_MAPPING",
    "sourceRefs": [
      "M02"
    ],
    "symbol": "g_B",
    "runtimeObject": "task-b-gradient",
    "relatedIds": [
      "task_b_loss",
      "total_gradient"
    ],
    "relatedPages": [
      {
        "pageId": "page-06-ewc-objective",
        "anchorId": "gradient-junction"
      }
    ],
    "keywords": [
      "new task gradient",
      "g_B"
    ]
  },
  ewc_gradient: {
    "id": "ewc_gradient",
    "kind": "symbol",
    "title": "EWC 约束梯度 · g_EWC",
    "summary": "由 Fisher 加权二次惩罚对参数求导得到。",
    "role": "它与 Task-B gradient 相加；优化器按总梯度执行更新。",
    "sourceCategory": "IMPLEMENTATION_MAPPING",
    "sourceRefs": [
      "M02"
    ],
    "symbol": "g_EWC",
    "runtimeObject": "ewc-gradient",
    "confusion": "偏移为正时该梯度向外；Gradient Descent 减去它，更新便指向 Anchor。此导数不是原文另列的公式。",
    "relatedIds": [
      "ewc_penalty",
      "fisher_a_i",
      "theta_a_star",
      "total_gradient"
    ],
    "relatedPages": [
      {
        "pageId": "page-06-ewc-objective",
        "anchorId": "gradient-junction"
      }
    ],
    "keywords": [
      "restoring gradient",
      "constraint gradient",
      "g_EWC"
    ]
  },
  total_gradient: {
    "id": "total_gradient",
    "kind": "symbol",
    "title": "合并后的总梯度 · g_total",
    "summary": "g_B 与 g_EWC 两路信号相加后的结果。",
    "role": "optimizer.step() 使用总梯度更新当前参数 θ。",
    "sourceCategory": "IMPLEMENTATION_MAPPING",
    "sourceRefs": [
      "M02"
    ],
    "symbol": "g_total",
    "runtimeObject": "total-gradient",
    "confusion": "EWC 加入训练目标与梯度计算，不会取代原有优化器。",
    "relatedIds": [
      "task_b_gradient",
      "ewc_gradient",
      "optimizer_step"
    ],
    "relatedPages": [
      {
        "pageId": "page-06-ewc-objective",
        "anchorId": "gradient-junction"
      }
    ],
    "keywords": [
      "total gradient",
      "combined gradient",
      "optimizer input"
    ]
  },
  task_boundary: {
    "id": "task_boundary",
    "kind": "term",
    "title": "任务边界 · Task Boundary",
    "summary": "当前任务结束、下一任务开始的时间点。",
    "role": "先固定当前解，再趁当前任务数据仍可用时估计 Fisher；完成后新任务继续训练同一个模型。",
    "sourceCategory": "IMPLEMENTATION_MAPPING",
    "sourceRefs": [
      "M01",
      "C09"
    ],
    "relatedIds": [
      "consolidation",
      "theta_a_star",
      "fisher_a"
    ],
    "relatedPages": [
      {
        "pageId": "page-07-lifecycle",
        "anchorId": "task-boundary"
      }
    ],
    "keywords": [
      "task boundary",
      "任务边界",
      "task switch",
      "consolidation"
    ],
    "confusion": "边界本身不会由原始 EWC 自动发现；Atari 实验使用了额外的 task-recognition 机制。"
  },
  consolidation: {
    "id": "consolidation",
    "kind": "phase",
    "title": "任务固结 · Consolidation",
    "summary": "任务结束后建立可供后续训练读取的旧任务状态。",
    "role": "固定当前参数并估计 Fisher；这一阶段会计算梯度，但不会执行 optimizer.step()。",
    "sourceCategory": "IMPLEMENTATION_MAPPING",
    "sourceRefs": [
      "M01",
      "C09"
    ],
    "relatedIds": [
      "task_boundary",
      "theta_a_star",
      "fisher_a"
    ],
    "relatedPages": [
      {
        "pageId": "page-07-lifecycle",
        "anchorId": "task-boundary"
      }
    ],
    "keywords": [
      "consolidation",
      "任务固结",
      "Fisher estimation"
    ],
    "confusion": "Fisher estimation 本身不更新模型参数。"
  },
  permuted_mnist: {
    "id": "permuted_mnist",
    "kind": "dataset",
    "title": "置换 MNIST · Permuted MNIST",
    "summary": "每个任务给所有输入图像使用同一个固定随机像素排列。",
    "role": "保持数字分类目标，改变任务之间的输入映射，便于观察顺序学习时旧任务表现如何变化。",
    "sourceCategory": "PAPER_FACT",
    "sourceRefs": [
      "C10",
      "R01"
    ],
    "details": [
      {
        "label": "任务间与任务内",
        "text": "每任务选择一个固定随机像素置换，训练与测试样本使用相同映射。标签仍为 0–9，输出空间共用；可逆置换保留信息，但改变输入位置与分类规律的对应。",
        "sourceRefs": [
          "C10"
        ]
      },
      {
        "label": "指标与对照",
        "text": "Figure 2A 看三个任务的测试 Accuracy；2B 看已训练任务的平均正确率。Uniform L2 与 SGD 的结论限于原文网络、置换与训练配置。",
        "sourceRefs": [
          "R01"
        ]
      }
    ],
    "relatedPages": [
      {
        "pageId": "page-08-mnist",
        "anchorId": "permuted-mnist-task"
      }
    ],
    "keywords": [
      "MNIST",
      "permuted MNIST",
      "像素置换",
      "固定排列",
      "handwritten digits"
    ],
    "confusion": "Task k 的排列对该任务内所有图像相同；不会对每张图重新洗牌。"
  },
  atari: {
    "id": "atari",
    "kind": "environment",
    "title": "Atari 连续强化学习实验",
    "summary": "Agent 通过与多个 Atari 游戏交互，依次学习不同任务。",
    "role": "完整系统的绝对成绩与保留其他 Atari 机制的 EWC / no-penalty 对照，分别说明系统表现和 EWC 在该设置下的贡献。",
    "sourceCategory": "PAPER_FACT",
    "sourceRefs": [
      "C08",
      "C09",
      "R03",
      "R05"
    ],
    "details": [
      {
        "label": "系统组件",
        "text": "DQN-like 网络、per-task Replay、Task Recognition、task-specific gains / biases 与 EWC 共同构成完整系统。",
        "sourceRefs": [
          "C08"
        ]
      },
      {
        "label": "游戏序列",
        "text": "从 19 款游戏中抽取 10 款反复顺序训练。Figure 3B 的绝对成绩属于完整系统；保留其他机制比较有无 EWC penalty，支持其在本设置下对保持的贡献。",
        "sourceRefs": [
          "R03"
        ]
      },
      {
        "label": "EWC 时机与 Fisher",
        "text": "每游戏至少 20 million frames 后才启用保护。切换时从 Replay 抽取 100 mini-batches 重估 Fisher，并乘 400（PDF pp. 5、12，§2.2、Table 2）。",
        "sourceRefs": [
          "C09"
        ]
      },
      {
        "label": "网络配置",
        "text": "84×84 输入，最近四帧构成 state；各游戏共用完整 18 动作集合与网络结构（PDF pp. 10–11，Appendix §4.2）。",
        "sourceRefs": [
          "C08"
        ]
      },
      {
        "label": "结果边界",
        "text": "human-normalized score 是相对随机与人类基准的游戏得分归一化，非 Accuracy。该 agent 未达到十个独立 DQN 的分数；附录 Figure 4 给逐游戏曲线。",
        "sourceRefs": [
          "R05",
          "R06"
        ]
      }
    ],
    "relatedIds": [
      "replay",
      "task_recognition",
      "task_specific_modulation",
      "fisher_perturbation"
    ],
    "relatedPages": [
      {
        "pageId": "page-09-atari",
        "anchorId": "system-responsibilities"
      }
    ],
    "keywords": [
      "Atari",
      "reinforcement learning",
      "continual RL",
      "DQN"
    ],
    "confusion": "绝对多游戏分数属于包含 Replay、Task Recognition 与 task-specific gains / biases 的完整系统；该结果不能推广到所有 continual RL，也没有达到每个游戏各用一个 DQN 的表现。"
  },
  replay: {
    "id": "replay",
    "kind": "method",
    "title": "经验回放 · Replay",
    "summary": "把环境交互产生的 transition 存入 Replay buffer，再用于强化学习更新。",
    "role": "Atari 系统按任务使用 replay buffers。Replay 支持任务内部训练；EWC 负责边界之间的参数约束。",
    "sourceCategory": "PAPER_FACT",
    "sourceRefs": [
      "C08"
    ],
    "relatedIds": [
      "atari",
      "ewc"
    ],
    "relatedPages": [
      {
        "pageId": "page-09-atari",
        "anchorId": "replay-timescale"
      }
    ],
    "keywords": [
      "Replay",
      "experience replay",
      "Replay buffer",
      "经验回放"
    ],
    "confusion": "Replay 与 EWC 的作用不同；论文 Atari 实验保留了 Replay。"
  },
  task_recognition: {
    "id": "task_recognition",
    "kind": "method",
    "title": "任务识别 · Task Recognition",
    "summary": "Atari 系统另设模块判断当前处于哪个游戏任务。",
    "role": "任务上下文由系统中的其他组件提供，EWC 使用任务切换信息建立参数约束。",
    "sourceCategory": "PAPER_FACT",
    "sourceRefs": [
      "C08"
    ],
    "relatedIds": [
      "atari",
      "task_specific_modulation",
      "task_boundary"
    ],
    "relatedPages": [
      {
        "pageId": "page-09-atari",
        "anchorId": "system-responsibilities"
      }
    ],
    "keywords": [
      "task recognition",
      "game context",
      "task identity",
      "任务识别"
    ],
    "confusion": "Task Recognition 不属于 EWC penalty，也不能把它的作用归到 EWC 名下。"
  },
  task_specific_modulation: {
    "id": "task_specific_modulation",
    "kind": "method",
    "title": "任务专属调制 · Gains / Biases",
    "summary": "Atari 系统为不同游戏使用额外的 task-specific gains 与 biases。",
    "role": "这是完整 Atari 系统中的另一项机制；它与 EWC 参数约束承担不同职责。",
    "sourceCategory": "PAPER_FACT",
    "sourceRefs": [
      "C08"
    ],
    "relatedIds": [
      "atari",
      "task_recognition",
      "ewc"
    ],
    "relatedPages": [
      {
        "pageId": "page-09-atari",
        "anchorId": "system-responsibilities"
      }
    ],
    "keywords": [
      "task-specific modulation",
      "gains",
      "biases",
      "任务专属调制"
    ],
    "confusion": "Atari 表现不能被概括为 EWC 单独作用的结果。"
  },
  fisher_perturbation: {
    "id": "fisher_perturbation",
    "kind": "evidence",
    "title": "Fisher 参数扰动诊断",
    "summary": "在 Breakout 网络上施加不同参数噪声，观察游戏分数怎样变化。",
    "role": "Inverse-Fisher 扰动比 uniform 扰动更稳健；nullspace 条件的影响仍与 inverse-Fisher 条件相近。",
    "sourceCategory": "PAPER_RESULT",
    "sourceRefs": [
      "R04",
      "A01"
    ],
    "claim": "Inverse-Fisher 扰动比 uniform 更稳健，但 nullspace 扰动仍改变表现。",
    "experiment": "单游戏 Breakout DQN，十个完整 episode，每时间步重新采样扰动。",
    "observedEvidence": [
      "Inverse-Fisher 条件更稳健。",
      "Nullspace 条件影响接近 inverse-Fisher，并非没有影响。"
    ],
    "interpretation": "作者认为方法过于自信地判定某些参数不重要，从而低估参数不确定性。",
    "boundary": "诊断只测试一个训练后的 Breakout agent，不证明所有环境中的扰动方法排名。",
    "sourceLocator": "PDF p. 6, Figure 3C and adjacent Section 2.2 text",
    "relatedIds": [
      "fisher_information",
      "diagonal_fisher_limit",
      "atari"
    ],
    "relatedPages": [
      {
        "pageId": "page-09-atari",
        "anchorId": "atari-evidence-limits"
      }
    ],
    "keywords": [
      "parameter perturbation",
      "Fisher nullspace",
      "Breakout",
      "参数扰动"
    ],
    "confusion": "这是单游戏参数扰动实验，不是 EWC 跨游戏主性能曲线。"
  },
  extended_bayes_laplace_notation: {
    "id": "extended_bayes_laplace_notation",
    "kind": "advanced",
    "title": "Bayes → Laplace → EWC · 公式衔接",
    "summary": "Sequential Bayes 的乘积取负对数后变为新任务 Loss 加旧 Posterior 的负对数；局部二次型和对角 Fisher 近似得到 EWC。",
    "role": "区分完整后验、局部 Gaussian 与实践中的对角精度近似。",
    "sourceCategory": "PAPER_FACT",
    "sourceRefs": [
      "C03",
      "C04",
      "C05",
      "C13"
    ],
    "confusion": "旧解附近的近似不代表完整后验；对角 Fisher 忽略参数耦合。",
    "details": [
      {
        "label": "Sequential Bayes",
        "text": "给定 θ 后任务数据条件独立：p(θ | D_A,D_B) ∝ p(D_B | θ)p(θ | D_A)。",
        "sourceRefs": [
          "C03",
          "C13"
        ]
      },
      {
        "label": "Laplace",
        "text": "局部 MAP 驻点处一阶项消失，Φ≈C+½ΔθᵀH_AΔθ；正定或适当正则化后可转为 Gaussian。",
        "sourceRefs": [
          "C04"
        ]
      },
      {
        "label": "EWC",
        "text": "用 diag(F_A) 近似精度，去掉 θ 无关常数，并加入实践权衡 λ，得到 L_B+(λ/2)ΣᵢF_A,i(θᵢ−θ_A,i*)²。",
        "sourceRefs": [
          "C05",
          "C06"
        ]
      }
    ],
    "boundary": "教程没有计算或保存精确完整 Hessian / Posterior。",
    "relatedIds": [
      "sequential_bayes",
      "task_a_posterior",
      "laplace_approximation",
      "fisher_information",
      "ewc_objective"
    ],
    "relatedPages": [
      {
        "pageId": "page-03-bayes",
        "anchorId": "sequential-update"
      },
      {
        "pageId": "page-04-laplace",
        "anchorId": "laplace-local-view"
      },
      {
        "pageId": "page-06-ewc-objective",
        "anchorId": "ewc-objective"
      }
    ],
    "keywords": [
      "Bayes",
      "Laplace",
      "Hessian",
      "diagonal Fisher",
      "EWC notation",
      "进阶公式",
      "局部高斯"
    ]
  },
  task_state_mapping: {
    id: "task_state_mapping", kind: "implementation", title: "Grand Animation state and ID map",
    summary: "Page 10 uses stable page, anchor, animation-state, and runtime-object IDs to connect the replay controls with the workbench and related lessons.",
    role: "Explains how the tutorial's 18-state replay and selectable workbench objects are mapped in this implementation.",
    sourceCategory: "IMPLEMENTATION_MAPPING", sourceRefs: ["M01", "M03", "T02"],
    confusion: "These IDs and the saved-object rail are tutorial implementation mappings; the EWC paper does not prescribe this software schema or checkpoint format.",
    details: [
      { label: "Page and anchor IDs", text: "The integration lives on page-10-grand-animation and is grouped under the grand-animation and full-execution-replay anchors." },
      { label: "18 animation-state IDs", text: "overview → task-a-data → first-forward → probability-loss → backward → optimizer-update → task-a-compression → task-a-boundary → posterior-view → laplace-view → return-runtime → save-anchor → fisher-estimation → task-a-consolidated → task-b-arrives → ewc-objective → combined-gradient → continual-loop." },
      { label: "Runtime-object IDs", text: "Selectable IDs connect Task A/B data, batches, the shared network, logits, probabilities, losses, gradients, optimizer, current parameters, saved Task-A anchor and Fisher, separate Task-A and Task-B states, persistent memory, replay, task recognition, and task-specific modulation to their visible workbench objects." },
      { label: "Teaching boundary", text: "The replay integrates previously taught probability, parameter anchoring, Fisher weighting, and task switching. It does not add a new paper claim or specify a universal runtime architecture." },
    ],
    relatedIds: ["grand_animation", "ewc", "task_boundary", "fisher_information", "ewc_objective"],
    relatedPages: [{ pageId: "page-10-grand-animation", anchorId: "grand-animation" }, { pageId: "page-10-grand-animation", anchorId: "full-execution-replay" }],
    relatedAnimationStates: [
      "overview", "task-a-data", "first-forward", "probability-loss", "backward", "optimizer-update",
      "task-a-compression", "task-a-boundary", "posterior-view", "laplace-view", "return-runtime", "save-anchor",
      "fisher-estimation", "task-a-consolidated", "task-b-arrives", "ewc-objective", "combined-gradient", "continual-loop",
    ],
    keywords: ["Page 10", "Grand Animation", "runtime IDs", "state machine", "实现映射", "状态映射"],
  },
  diagonal_fisher_limit: {
    "id": "diagonal_fisher_limit",
    "kind": "advanced",
    "title": "对角 Fisher 的局限 · Diagonal Fisher",
    "summary": "对角近似忽略参数间的耦合，加上局部不确定性的点估计，可能误判一些方向为不重要。",
    "role": "解释低 Fisher 或 nullspace 方向为何仍可能影响性能。",
    "sourceCategory": "LIMITATION",
    "sourceRefs": [
      "C11",
      "R04",
      "A01"
    ],
    "confusion": "低估计值并不保证对应移动安全；Nullspace 扰动结果不能只归因为忽略耦合。",
    "boundary": "作者将 factorized Gaussian 与方差点估计列为显著弱点，未给出精确完整协方差。",
    "relatedIds": [
      "fisher_information",
      "fisher_perturbation"
    ],
    "relatedPages": [
      {
        "pageId": "page-05-fisher",
        "anchorId": "fisher-role"
      },
      {
        "pageId": "page-09-atari",
        "anchorId": "atari-evidence-limits"
      }
    ],
    "keywords": [
      "diagonal Fisher",
      "off-diagonal",
      "parameter coupling",
      "uncertainty approximation"
    ],
    "details": [
      {
        "label": "作者解释",
        "text": "Breakout nullspace 扰动仍影响性能，作者认为方法对某些参数不重要的判断过于自信，低估了参数不确定性；并非确定证明某一个误差来源。",
        "sourceRefs": [
          "R04",
          "A01",
          "C11"
        ]
      }
    ]
  },
  neural_network: {
    "id": "neural_network",
    "kind": "term",
    "title": "神经网络 · Neural Network",
    "summary": "给定输入 x，用当前权重与偏置 θ 逐层计算 logits；Softmax 再把分类分数变为标签概率。",
    "role": "P2 用这一计算输出取得真实标签概率，连接到 Likelihood 与 NLL。",
    "sourceCategory": "GENERAL_BACKGROUND",
    "sourceRefs": [
      "B01"
    ],
    "relatedPages": [
      {
        "pageId": "page-02-probability",
        "anchorId": "forward-probability"
      }
    ]
  },
};
