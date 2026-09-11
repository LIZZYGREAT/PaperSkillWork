import type { TutorialData } from '../types';

export const tutorial: TutorialData = {
  "meta": {
    "titleEn": "PhyAgentOS: A Self-Evolving Operating System for Embodied Agents with Decoupled Cognitive Planning and Physical Execution",
    "titleZh": "PhyAgentOS：面向具身智能体的认知规划与物理执行解耦的自演化操作系统",
    "venue": "arXiv:2607.16636v1 · 2026",
    "authors": "Yang Liu · Weixing Chen · Xinshuai Song · Tao Pu · Siwen Mo · Yongjie Bai · Zihao Chen · Qianran Sun · Liruo Zhong · Ying Shen · Liang Lin",
    "affiliation": "X-Era Lab · HCP Lab, Sun Yat-sen University · Peng Cheng Laboratory",
    "domain": "具身智能 / Agent 运行时 / 语义验证 / 安全",
    "coreProblem": "VLA、世界模型和 Agent 系统可以分别规划、预测或控制，却缺少共享状态、语义验收、持久经验和跨 embodiment 的监督执行层。",
    "coreInsight": "PhyAgentOS 用状态即文件的协议边界和以会话为单位的运行时，把规划、受控执行、证据验证、记忆、评测与安全闭成可审计循环。",
    "keywords": [
      "State-as-a-File",
      "SessionVerifier",
      "自演化",
      "纵深安全"
    ]
  },
  "hero": {
    "oldMethod": {
      "desc": "传统堆叠常把执行返回码当成任务完成，失败原因和经验也难以跨会话保留。",
      "componentId": "hero-compare"
    },
    "newMethod": {
      "desc": "PhyAgentOS 用会话、文件协议、验证器、记忆、基准测试和纵深安全把一次执行闭成可审计循环。",
      "componentId": "hero-compare"
    }
  },
  "chapters": [
    {
      "kind": "chapter",
      "id": "chap-1",
      "title": "动作结束，不等于任务完成",
      "badge": "inf",
      "badgeLabel": "基础",
      "bridge": "本章先处理最容易被忽略的断裂：控制器说‘完成’，目标却可能没有实现。下一问是，系统如何用证据判断真正的结果？",
      "analogy": {
        "title": "走到了，真的到达了吗？",
        "text": "脚步停下，只能说明动作结束。还要核对终点是否满足地图上的目标。",
        "componentId": "hike-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "1.1",
          "title": "先看返回码，再看目标证据",
          "desc": "拖动执行信号并核对目标，观察一个高返回码如何仍可能对应错误终点。",
          "componentId": "phy-module"
        }
      ],
      "insight": "要把动作是否结束与目标是否实现分开，系统需要一个读取证据并给出语义判定的层。",
      "formula": {
        "lead": "把刚才的核对写成一个抽象判断函数：它读取目标、两端状态、轨迹和历史。",
        "unicode": "V(G, E₀, Eₜ, τ, H) → {success, failure, replan}",
        "symbols": [
          {
            "sym": "V",
            "desc": "验证器判断函数。"
          },
          {
            "sym": "G",
            "desc": "任务目标与接受标准。"
          },
          {
            "sym": "E₀ / Eₜ",
            "desc": "初始与终止环境状态。"
          },
          {
            "sym": "τ",
            "desc": "执行轨迹。"
          },
          {
            "sym": "H",
            "desc": "相关历史上下文。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "先区分两件事",
          "desc": "执行结束不是任务完成。"
        },
        {
          "icon": "🧾",
          "title": "证据必须入场",
          "desc": "初始状态、终止状态和轨迹共同支撑判断。"
        },
        {
          "icon": "✅",
          "title": "三种判定",
          "desc": "结果可以是成功、失败或需要重规划。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-2",
      "title": "让不同层看到同一份状态",
      "badge": "inf",
      "badgeLabel": "基础",
      "bridge": "上一章要求验证器读取证据；本章追问：认知层和运行层如何在不共享私有代码的情况下看到可比较的状态？",
      "analogy": {
        "title": "先把地图摊开",
        "text": "认知层和运行层不必共享私有对象，但必须能读到同一组任务相关状态。",
        "componentId": "hike-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "2.1",
          "title": "点击协议视图，拼出共享状态",
          "desc": "选择一份协议文档，看它为共享认知状态贡献了哪一类字段。",
          "componentId": "phy-module"
        }
      ],
      "formula": {
        "lead": "本章不引入新数学式；关键是接口语义和状态字段的分工。",
        "unicode": "no new formula; explain the five protocol views and their scope",
        "symbols": [
          {
            "sym": "SESSIONS.md",
            "desc": "任务、依赖、生命周期、接受标准和结果。"
          },
          {
            "sym": "ENVIRONMENT.md",
            "desc": "任务相关的实体、关系和环境状态。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🗺️",
          "title": "一份状态，多种视图",
          "desc": "目标、能力、环境和经验可被共同读取。"
        },
        {
          "icon": "🔎",
          "title": "保留任务相关信息",
          "desc": "协议不是原始传感器流。"
        },
        {
          "icon": "🧩",
          "title": "弱耦合",
          "desc": "共享的是契约和证据，不是对方的内部代码。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-3",
      "title": "文件边界把闭环留下来",
      "badge": "inf",
      "badgeLabel": "基础",
      "bridge": "有了共享状态，还需要一个不会被单次动作覆盖的生命周期。本章用 session 解释为什么调度、证据和写回要绑定在一起。",
      "analogy": {
        "title": "沿着脚印回看",
        "text": "记录不是把控制器变慢，而是让一次会话的意图、执行和结果可以回放与审计。",
        "componentId": "hike-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "3.1",
          "title": "一次会话如何留下可审计轨迹",
          "desc": "逐步查看目标写入、会话认领、受控执行、证据写回和语义判定。",
          "componentId": "phy-module"
        }
      ],
      "formula": {
        "lead": "连续策略的动作来自策略接口，而不是 Agent 直接碰硬件。",
        "unicode": "Aₜ = Policy(I, Oₜ, Sₜ, Hₜ)",
        "symbols": [
          {
            "sym": "Aₜ",
            "desc": "动作或动作块。"
          },
          {
            "sym": "I",
            "desc": "自然语言指令。"
          },
          {
            "sym": "Oₜ / Sₜ / Hₜ",
            "desc": "当前观测、状态与历史。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🧭",
          "title": "会话是单位",
          "desc": "调度、证据和写回共享生命周期。"
        },
        {
          "icon": "📓",
          "title": "边界可回看",
          "desc": "文件记录让跨层状态可检查。"
        },
        {
          "icon": "⏱️",
          "title": "实时仍在本地",
          "desc": "文件协议不取代低层观测-动作环。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-4",
      "title": "执行之前先检查能不能执行",
      "badge": "both",
      "badgeLabel": "理解+训练",
      "bridge": "如果一个技能需要 RGB，而目标只提供文本，系统不应等到执行中才发现。下一步是把兼容性和安全边界前置。",
      "analogy": {
        "title": "先系紧这一根带子",
        "text": "预检先问：这套技能、观测、动作和目标端是否真的匹配？不匹配就不进入执行。",
        "componentId": "hike-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "4.1",
          "title": "选择一条有效的执行契约",
          "desc": "切换连续策略/Agent 工具与目标观测，观察 AdapterPlan 是否成立。",
          "componentId": "phy-module"
        },
        {
          "kind": "module",
          "id": "4.2",
          "title": "动作通过安全边界了吗？",
          "desc": "移动动作点接近工作空间边界，区分格式转换与 SafetyGuard 放行。",
          "componentId": "phy-module"
        }
      ],
      "insight": "预检把结构性错误挡在目标端之前，动作桥接再负责明确的表示转换。",
      "formula": {
        "lead": "运行时把模型或 Agent 的输出统一成目标端可接收的动作形式。",
        "unicode": "Tₜ = Agent(I, Oₜ, Sₜ, Hₜ)",
        "symbols": [
          {
            "sym": "Tₜ",
            "desc": "TargetSessionHandle 暴露的受控工具输出。"
          },
          {
            "sym": "I / Oₜ / Sₜ / Hₜ",
            "desc": "指令、观测、状态与历史。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🧪",
          "title": "预检先行",
          "desc": "无效组合在 target access 前被拒绝。"
        },
        {
          "icon": "🛠️",
          "title": "桥接不等于放行",
          "desc": "格式转换和安全判定是两件事。"
        },
        {
          "icon": "🧱",
          "title": "边界要可见",
          "desc": "夹紧或拦截都要写入证据。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-5",
      "title": "终点要由证据确认",
      "badge": "both",
      "badgeLabel": "理解+训练",
      "bridge": "状态边界让证据可读，但还没有回答‘什么算完成’。现在把同一条轨迹交给返回码和语义验证器分别判断。",
      "analogy": {
        "title": "把终点对回地图",
        "text": "同一段脚步记录，返回码只能说明停下；初始状态、终止状态和轨迹一起才能说明是否完成。",
        "componentId": "hike-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "5.1",
          "title": "同一条轨迹，两个判定",
          "desc": "启动同步比较，再切换成功、失败或重规划证据情境。",
          "componentId": "phy-module"
        }
      ],
      "insight": "SessionVerifier 不负责产生动作，而负责把证据包与接受标准对齐，输出 success、failure 或 replan。",
      "formula": {
        "lead": "验证器的输入不是一个 return code，而是一个证据包。",
        "unicode": "V(G, E₀, Eₜ, τ, H) → {success, failure, replan}",
        "symbols": [
          {
            "sym": "success",
            "desc": "证据满足接受标准。"
          },
          {
            "sym": "failure",
            "desc": "目标未达成，证据保留用于诊断。"
          },
          {
            "sym": "replan",
            "desc": "保留原尝试并创建更新条件的 child session。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🔬",
          "title": "看变化",
          "desc": "初始状态让目标变化可被判断。"
        },
        {
          "icon": "🧾",
          "title": "证据成包",
          "desc": "图像、状态快照、轨迹和事件共同进入判定。"
        },
        {
          "icon": "🔁",
          "title": "重规划不抹除",
          "desc": "child session 继承关系，原尝试保持不可变。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-6",
      "title": "同一边界支持两种执行流",
      "badge": "inf",
      "badgeLabel": "基础",
      "bridge": "验证语义已经统一，但生成动作的决策点可以不同。本章区分连续策略流和 Agent 工具流，同时看它们如何在边界处汇合。",
      "analogy": {
        "title": "选一块路牌",
        "text": "连续策略让模型产出动作块；工具流让 Agent 在线选择工具。两者都不能绕过运行时的权限和证据边界。",
        "componentId": "hike-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "6.1",
          "title": "选择策略流还是工具流",
          "desc": "切换两种 SkillRuntime，观察决策点不同但 Watchdog、Target 和 Verifier 仍保持共享。",
          "componentId": "phy-module"
        }
      ],
      "formula": {
        "lead": "工具流把 Agent 的决定也放进受控 handle。",
        "unicode": "Tₜ = Agent(I, Oₜ, Sₜ, Hₜ)",
        "symbols": [
          {
            "sym": "Tₜ",
            "desc": "受控 TargetSessionHandle 的工具输出。"
          },
          {
            "sym": "Aₜ",
            "desc": "PolicySkillRuntime 的动作或动作块。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🔀",
          "title": "决策点不同",
          "desc": "policy flow 与 tool flow 的循环位置不同。"
        },
        {
          "icon": "🛡️",
          "title": "边界相同",
          "desc": "session、supervision、target、evidence 仍共享。"
        },
        {
          "icon": "🎛️",
          "title": "不等于开放权限",
          "desc": "工具必须由清单过滤。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-7",
      "title": "只有验证过的修复才算经验",
      "badge": "trn",
      "badgeLabel": "训练细节",
      "bridge": "一次成功重试还不能证明系统学会了。要让下一次会话受益，修复必须经过同一套判定并带着适用条件进入记忆。",
      "analogy": {
        "title": "把一次踩坑写下来",
        "text": "提出一个修复只是猜测。重新执行并得到验证后，才值得成为下一次路线选择的经验。",
        "componentId": "hike-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "7.1",
          "title": "六步闭环：从失败到可复用知识",
          "desc": "逐步查看 Execute 到 Consolidate，观察未验证的诊断为何不能直接写入记忆。",
          "componentId": "phy-module"
        }
      ],
      "formula": {
        "lead": "本章不引入新公式；六步顺序本身是因果约束。",
        "unicode": "Execute → Verify → Diagnose → Revise → Re-verify → Consolidate",
        "symbols": [
          {
            "sym": "KNOWLEDGE.md",
            "desc": "已验证的成功模式与适用条件。"
          },
          {
            "sym": "LESSONS.md",
            "desc": "带失败证据、原因和后续验证状态的纠正记录。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🧠",
          "title": "三层记忆",
          "desc": "episodic 保留单次会话，semantic 聚合模式，methodological 记录可迁移程序。"
        },
        {
          "icon": "🧪",
          "title": "验证再固化",
          "desc": "correction hypothesis 不能直接成为事实。"
        },
        {
          "icon": "🌐",
          "title": "迁移有条件",
          "desc": "provenance、target 和适用范围必须匹配。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-8",
      "title": "架构把职责放在正确边界",
      "badge": "trn",
      "badgeLabel": "训练细节",
      "bridge": "前面看到的是机制，现在线索集中到结构：谁规划、谁监督、谁执行、谁验证？点击组件，沿着一条真实职责链走一遍。",
      "analogy": {
        "title": "把背带拉到合适的位置",
        "text": "系统不是把所有职责塞进一个模型，而是让每个边界承担一类可检查的责任。",
        "componentId": "hike-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "8.1",
          "title": "点击组件，追踪一条可审计路径",
          "desc": "点击架构组件，观察 active path、输出形式和责任边界同步变化。",
          "componentId": "phy-module"
        }
      ],
      "formula": {
        "lead": "组件图的关键不是节点数量，而是每个节点的责任边界。",
        "unicode": "Aₜ = Policy(I, Oₜ, Sₜ, Hₜ)； V(G, E₀, Eₜ, τ, H) → {success, failure, replan}",
        "symbols": [
          {
            "sym": "Agent / Runtime",
            "desc": "认知层决定做什么，运行层决定如何受控执行。"
          },
          {
            "sym": "Protocol",
            "desc": "显式记录跨层状态、交接和证据。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🧱",
          "title": "职责分层",
          "desc": "Agent、Runtime、Target 和 Verifier 不互相冒充。"
        },
        {
          "icon": "🔗",
          "title": "边界显式",
          "desc": "protocol 记录交接和证据。"
        },
        {
          "icon": "🧭",
          "title": "路径可追踪",
          "desc": "点击任一组件都能看到它影响的责任链。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-9",
      "title": "逐步加回物理与安全约束",
      "badge": "trn",
      "badgeLabel": "训练细节",
      "bridge": "系统在游戏里验证认知，在模拟里加入动力学，再到真实硬件面对噪声与风险。本章同时看验证梯度和五层安全边界。",
      "analogy": {
        "title": "先试这一处脚下",
        "text": "从游戏到模拟再到真实机器人，逐层加入动力学、延迟、噪声和硬件约束，同时保留认知层。",
        "componentId": "hike-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "9.1",
          "title": "选择验证层级",
          "desc": "切换游戏、模拟和真实机器人，观察被隔离或加入的物理因素。",
          "componentId": "phy-module"
        },
        {
          "kind": "module",
          "id": "9.2",
          "title": "五层安全边界",
          "desc": "把动作点推向危险区域，观察预检、桥接、SafetyGuard、心跳和目标端的职责。",
          "componentId": "phy-module"
        }
      ],
      "formula": {
        "lead": "本章不引入新公式；安全约束关注的是允许区域和故障归因。",
        "unicode": "no new formula; explain the five defense layers and tier conditions",
        "symbols": [
          {
            "sym": "SafetyGuard",
            "desc": "在动作传给目标端前检查数据、维度、范围、频率和急停状态。"
          },
          {
            "sym": "target-local",
            "desc": "最靠近执行器的本地限制，保留最终安全权威。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🪜",
          "title": "逐层验证",
          "desc": "物理复杂度是分阶段加回的。"
        },
        {
          "icon": "🛡️",
          "title": "纵深防御",
          "desc": "五层安全机制各有职责。"
        },
        {
          "icon": "⚠️",
          "title": "不能外推",
          "desc": "游戏层结果不能直接替代真实机器人安全证据。"
        }
      ]
    },
    {
      "kind": "chapter",
      "id": "chap-10",
      "title": "结果提升，但边界仍在",
      "badge": "both",
      "badgeLabel": "理解+训练",
      "bridge": "最后把绿色结果放回它们各自的协议、数据集和指标里。可恢复失败能带来提升，但困难任务、物理覆盖和长期记忆仍留下边界。",
      "analogy": {
        "title": "到达终点，也要查记录",
        "text": "最后的绿色不是‘所有任务都解决’，而是每个协议下都能看见证据、提升和剩余难点。",
        "componentId": "hike-analogy"
      },
      "modules": [
        {
          "kind": "module",
          "id": "10.1",
          "title": "按协议比较首试与验证后结果",
          "desc": "选择一个数据集并启动比较；数值只在同一协议内对齐，随后阅读对应限制。",
          "componentId": "phy-module"
        }
      ],
      "formula": {
        "lead": "本章不把不同 benchmark 的数值拼成一个总分；指标方向和协议比数字大小更重要。",
        "unicode": "no new formula; keep each benchmark protocol and unit attached to its values",
        "symbols": [
          {
            "sym": "First",
            "desc": "首试或冻结配置下的结果。"
          },
          {
            "sym": "Final",
            "desc": "验证器触发恢复后的结果。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "📈",
          "title": "恢复有效但有条件",
          "desc": "增益随基线和失败类型变化。"
        },
        {
          "icon": "🧱",
          "title": "难点未消失",
          "desc": "高难度、黑暗、长程和真实覆盖仍是限制。"
        },
        {
          "icon": "🧭",
          "title": "正确读表",
          "desc": "First/Final、数据集、单位和 higher-is-better 必须一起看。"
        }
      ]
    }
  ]
};
