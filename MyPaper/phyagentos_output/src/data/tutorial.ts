import type { TutorialData } from '../types';

export const tutorial: TutorialData = {
  meta: {
    titleEn: 'PhyAgentOS: A Self-Evolving Operating System for Embodied Agents with Decoupled Cognitive Planning and Physical Execution',
    titleZh: 'PhyAgentOS：面向具身智能体的认知规划与物理执行解耦的自演化操作系统',
    venue: 'arXiv:2607.16636v1 · 2026-07-18',
    authors: 'Yang Liu · Weixing Chen · Xinshuai Song · Tao Pu · Siwen Mo · Yongjie Bai · Zihao Chen · Qianran Sun · Liruo Zhong · Ying Shen · Liang Lin',
    affiliation: 'X-Era Lab · HCP Lab, Sun Yat-sen University · Peng Cheng Laboratory',
    domain: '具身智能 · Agent 运行时 · 语义验证 · 自演化 · 纵深安全',
    coreProblem: 'VLA、世界模型与 Agent 系统可以分别规划、预测或控制，却没有共享状态、语义验收、持久经验和跨 embodiment 的监督执行层——执行终止常被当成任务完成。',
    coreInsight: 'PhyAgentOS 把认知-物理边界物化为文件协议，把会话（而非单条动作）作为调度、预检、监督、取证与验收的最小单位，用证据驱动的 SessionVerifier 区分「动作结束」与「任务完成」。',
    keywords: ['State-as-a-File', 'Session-Centered Runtime', 'SessionVerifier', 'Epistemic Memory', '纵深安全'],
    links: [
      { label: '项目主页', url: 'https://phy-agent-os.net' },
      { label: 'GitHub', url: 'https://github.com/PhyAgentOS/PhyAgentOS' },
      { label: 'arXiv', url: 'https://arxiv.org/abs/2607.16636' },
    ],
  },
  hero: {
    oldMethod: {
      desc: '直接把三种范式堆在一起：每一层都报告"成功"，却没有一层核对物理结果是否实现。',
      points: ['返回码被当成任务完成，形成系统性自我欺骗', '失败原因与经验随会话结束被丢弃', '规划与执行耦合在同一边界内，难以归因', '安全依赖孤立的急停，而不是分层架构'],
    },
    newMethod: {
      desc: 'PhyAgentOS 在三个范式之下加一层操作系统：会话、文件协议、验证器、记忆与安全把一次执行闭成可审计循环。',
      points: ['会话是调度、预检与验收的最小单位', 'State-as-a-File 让跨层状态可读、可审计、可回放', 'SessionVerifier 用证据包给出 success / failure / replan', '验证过的经验沉淀为知识，无需重训模型', '预检、桥接、SafetyGuard、心跳、目标端约束五层纵深防御'],
    },
  },
  chapters: [
    {
      kind: 'chapter',
      id: 'chap-1',
      title: '动作结束，不等于任务完成',
      badge: 'inf',
      badgeLabel: '问题',
      bridge: '本章先处理最容易被忽略的断裂：控制器说「完成」，目标却可能没有实现。下一问是，系统如何用证据判断真正的结果？',
      analogy: {
        title: '走到了，真的到达了吗？',
        text: '脚步停下，只能说明<b>动作结束</b>；只有核对终点是否满足地图上的目标，才能说明<b>任务完成</b>。',
        componentId: 'hike-analogy',
      },
      prose: [
        {
          heading: '每一层都说成功，杯子却不在手里',
          body: '论文开篇的场景：机器人被指示去拿一个杯子，夹爪却在空中闭合。VLA 控制器记录「轨迹在容差内完成」，世界模型确认预测与观测一致，Agent 规划器报告所有工具调用无错误——每一层都给出了成功信号，任务却失败了。这不是偶然的边角案例，而是当前具身 AI 的结构性缺陷：从自然语言指令到电机命令的管线是<b>单向的</b>，没有任何一层负责核对「预期的结果是否真的发生了」。',
        },
        {
          heading: '三种范式各管一段，验证无人认领',
          body: 'VLA 模型把感知直接映射为动作，泛化能力强却缺少结果诊断；世界模型能预测环境动力学，却与任务语言弱耦合；Agent 系统擅长分解任务与调用工具，但规划与执行常在同一边界内。三者组合时，「验证物理结果」这个职责仍然无人认领。论文把由此产生的错误称为<b>系统性的自我欺骗</b>：执行轨迹正常终止，环境状态却偏离目标。',
        },
        {
          heading: '把两件事分开',
          body: '要修复这个断裂，第一步是把「动作是否结束」与「目标是否实现」拆开：前者由控制器返回码回答，后者需要一个读取证据、给出语义判定的层。这就是 PhyAgentOS 整个架构的起点。',
        },
      ],
      modules: [
        {
          kind: 'module',
          id: '1.1',
          title: '先看返回码，再看目标证据',
          desc: '拖动执行进度，观察返回码何时变绿；再点击「核对目标证据」，看同一个终点在语义判定下是另一种颜色。',
          componentId: 'return-code-lab',
        },
      ],
      insight: '执行终止回答的是「指令是否被执行」，语义验收回答的才是「世界是否变成了想要的样子」。',
      formula: {
        lead: '论文把这个语义判定抽象成一个判断函数：它读取目标、两端状态、轨迹和历史，而不是只读返回码。',
        unicode: 'V(G, S₀, S_T, τ, H) → {success, failure, replan}',
        symbols: [
          { sym: 'V', desc: 'SessionVerifier 的判断函数，可以由确定性谓词、任务评估器或多模态模型组合实现。' },
          { sym: 'G', desc: '任务目标与接受标准（acceptance criteria），写在会话契约里。' },
          { sym: 'S₀', desc: '初始环境状态——成功往往指「变化」，没有起点就无法判断变化。' },
          { sym: 'S_T', desc: '终止环境状态。' },
          { sym: 'τ', desc: '执行轨迹（动作-观测历史）。' },
          { sym: 'H', desc: '相关历史上下文（跨会话经验）。' },
        ],
      },
      takeaways: [
        { icon: '🎯', title: '先区分两件事', desc: '执行结束 ≠ 任务完成，返回码不是目标证据。' },
        { icon: '🧾', title: '证据必须入场', desc: '初始状态、终止状态和轨迹共同支撑语义判定。' },
        { icon: '✅', title: '三种判定', desc: '结果可以是 success、failure 或需要 replan。' },
      ],
    },
    {
      kind: 'chapter',
      id: 'chap-2',
      title: '让不同层看到同一份状态',
      badge: 'inf',
      badgeLabel: '协议',
      bridge: '上一章要求验证器能读到证据；本章追问：认知层和运行层如何在不共享私有代码的情况下，看到可比较的状态？',
      analogy: {
        title: '先把地图摊开',
        text: '认知层和运行层不必共享私有对象，但必须能读到<b>同一组任务相关状态</b>——协议文件就是那张摊开的地图。',
        componentId: 'hike-analogy',
      },
      prose: [
        {
          heading: '把边界当成文件系统',
          body: 'PhyAgentOS 的关键设计选择：把认知-物理边界当成<b>文件系统</b>，而不是函数调用接口。所有跨进程数据——目标、技能、会话、观测、教训、知识——都物化为带内嵌 YAML 的人读 Markdown 文档。Agent 与 Runtime 是独立进程，不互相 import 对方的实现；它们共享的只有这些契约文件。审计与回放因此是架构自带的性质，而不是后加的日志功能。',
        },
        {
          heading: '五份主协议，各管一列状态',
          body: '<code>SESSIONS.md</code> 是事务中心：任务目标、所选 SkillRuntime 与目标端、前置条件、接受标准、生命周期状态和执行结果。<code>SKILLRUNTIME.md</code> 声明执行方法需要什么观测、产出什么动作形式；<code>TARGETS.md</code> 声明目标端的能力、观测模态与约束；<code>ENVIRONMENT.md</code> 保存结构化的环境快照（实体、关系、任务相关状态变化）；<code>LESSONS.md</code> 记录失败原因、纠正动作与 critic 反馈。另有 <code>KNOWLEDGE.md</code> 存放已验证的成功模式，sensors / perception / runtime_contract / safety 等 YAML 把部署参数与语义状态分开。',
        },
        {
          heading: '统一认知状态空间',
          body: '这些视图合起来构成论文所说的<b>统一认知状态空间</b>：任务意图、运行时能力、环境状态、执行状态与历史经验对齐到同一参照系。协议保持刻意的选择性——只保留任务相关状态与证据指针，高频率的感知与控制留在本地，不把延迟敏感的环节搬进协议层。',
        },
      ],
      modules: [
        {
          kind: 'module',
          id: '2.1',
          title: '点击协议文件，拼出共享状态',
          desc: '左侧选择一份协议文档，右侧显示它为共享认知状态贡献了哪一类字段，以及它对应的记忆层次。',
          componentId: 'protocol-views',
        },
      ],
      takeaways: [
        { icon: '🗺️', title: '一份状态，多种视图', desc: '意图、能力、环境与经验可被两层共同读取。' },
        { icon: '🔎', title: '保留任务相关信息', desc: '协议是结构化投影，不是原始传感器流。' },
        { icon: '🧩', title: '弱耦合', desc: '共享的是契约和证据，不是对方的内部代码。' },
      ],
    },
    {
      kind: 'chapter',
      id: 'chap-3',
      title: '会话是执行的最小单位',
      badge: 'inf',
      badgeLabel: '运行时',
      bridge: '有了共享状态，还需要一个不会被单次动作覆盖的生命周期。本章解释为什么调度、监督、取证和写回都绑定在「会话」上。',
      analogy: {
        title: '沿着脚印回看',
        text: '记录不会拖慢脚步，却让一次会话的<b>意图、执行和结果</b>可以被回放与审计——脚印就是协议文件里的追加记录。',
        componentId: 'hike-analogy',
      },
      prose: [
        {
          heading: '为什么不是「动作」，而是「会话」',
          body: '物理任务随时间展开，只校验孤立命令无法保证安全。PhyAgentOS 把<b>会话（session）</b>作为调度、兼容性预检、受控执行、证据收集与验收的最小单位：一个有界的生命周期，让心跳、取消、重试、取证和结果写回能被一致地施加。Agent 产出的也不是硬件命令，而是一份结构化会话契约——目标、运行时、目标端、前置条件、执行限制与接受标准。',
        },
        {
          heading: 'WatchdogSupervisor：监督而非控制',
          body: 'WatchdogSupervisor 是唯一的监督入口：从 <code>SESSIONS.md</code> 认领 pending 会话、验证运行时契约、创建 SessionRunner、监控策略服务与目标端的<b>心跳</b>、传播超时或取消信号，并把终止结果写回协议边界。它刻意不做观测-动作循环——调度与故障遏制留在薄监督层，执行策略由此独立演化。',
        },
        {
          heading: '显式的状态机',
          body: '会话有一个可检查的状态机：pending → claimed → running → finalizing → awaiting_verification → verifying → terminal。每一步都是协议文件里的状态转移，而不是散落在进程内存里的隐式状态——失败归因和事后审计因此有据可查。',
        },
      ],
      modules: [
        {
          kind: 'module',
          id: '3.1',
          title: '一次会话如何走完生命周期',
          desc: '单步推进状态机，观察每个阶段谁在负责、协议文件里写下了什么。',
          componentId: 'session-lifecycle',
        },
      ],
      formula: {
        lead: '把会话的状态机写成一串转移——每一步都是可审计的状态，而不是内存里的隐式变量。',
        unicode: 'pending → claimed → running → finalizing → verifying → terminal',
        symbols: [
          { sym: 'pending', desc: 'Agent 已编译会话并写入 SESSIONS.md，等待认领。' },
          { sym: 'claimed', desc: 'WatchdogSupervisor 原子认领，并开始兼容性预检。' },
          { sym: 'running', desc: 'SessionRunner 通过受控接口执行，心跳持续上报。' },
          { sym: 'finalizing', desc: '到达终止条件，证据包被收集并写回。' },
          { sym: 'verifying', desc: 'SessionVerifier 正在依据契约评估证据。' },
          { sym: 'terminal', desc: 'succeeded / failed / replanned，判定已追加进 attempts 记录。' },
        ],
      },
      takeaways: [
        { icon: '🧭', title: '会话是单位', desc: '调度、预检、证据和写回共享同一个生命周期。' },
        { icon: '📓', title: '边界可回看', desc: '文件协议让跨层状态可检查、可版本化、可回放。' },
        { icon: '⏱️', title: '实时仍在本地', desc: '文件协议不取代低层观测-动作环，只记录交接与证据。' },
      ],
    },
    {
      kind: 'chapter',
      id: 'chap-4',
      title: '执行之前先检查能不能执行',
      badge: 'both',
      badgeLabel: '预检+安全',
      bridge: '如果一个技能需要 RGB，而目标只提供文本，系统不应等到执行中才发现。本章把兼容性与安全边界前置到执行之前。',
      analogy: {
        title: '先系紧这一根带子',
        text: '预检先问：这套技能、观测、动作和目标端<b>真的匹配吗</b>？不匹配就不出发——出发前整理背包，比半路折返便宜得多。',
        componentId: 'hike-analogy',
      },
      prose: [
        {
          heading: '兼容性预检：在触碰目标端之前拒绝',
          body: 'WatchdogSupervisor 在会话到达目标端之前执行兼容性预检：核对所需观测模态、动作表示、策略端点、目标能力、时序约束与安全配置。结果物化为 <b>AdapterPlan</b>——所需的 PolicyAdapter、TargetAdapter 与 ActionBridge 链——以及一个枚举本次会话允许操作的 <b>TargetToolManifest</b>。无法产出有效计划的会话，在获得目标端访问权之前就被拒绝。',
        },
        {
          heading: '桥接不等于放行',
          body: 'ActionBridge 做确定性的表示转换：坐标转换、单位归一、关节重排、维度投影、夹爪重映射、动作块重采样。有界转换可以把数值投影进合法范围，但<b>畸形、欠指定或不连续危险的命令会被拒绝，而不是被静默修复</b>。每条桥都在预检时被选中并通过类型检查，完整的动作转换路径在执行前就可检查。',
        },
        {
          heading: '为什么值得提前',
          body: '现实中的失败常常是「技能需要 RGB、目标只有文本」这类结构性错配。等到执行中才发现，代价是一整次物理尝试和潜在的安全风险；预检把它提前到零成本的时刻，并让「被拒绝」本身也成为一条可审计的记录。',
        },
      ],
      modules: [
        {
          kind: 'module',
          id: '4.1',
          title: '组合一条有效的执行契约',
          desc: '分别选择执行流与目标端，观察 AdapterPlan 何时成立、何时在触碰目标端之前被拒绝。',
          componentId: 'preflight-lab',
        },
        {
          kind: 'module',
          id: '4.2',
          title: '动作通过安全边界了吗？',
          desc: '把动作点推向工作空间边界，区分 ActionBridge 的「格式转换」与 SafetyGuard 的「放行判定」。',
          componentId: 'safety-boundary',
        },
      ],
      insight: '预检把结构性错误挡在目标端之前；桥接负责明确的表示转换；SafetyGuard 负责判定转换后的命令是否可发——三者是三件事。',
      takeaways: [
        { icon: '🧪', title: '预检先行', desc: '无效组合在获得目标端访问权之前就被拒绝。' },
        { icon: '🛠️', title: '桥接 ≠ 放行', desc: '格式转换与安全判定是两个独立的环节。' },
        { icon: '🧱', title: '边界要可见', desc: '夹紧或拦截都写入证据，附结构化违规码。' },
      ],
    },
    {
      kind: 'chapter',
      id: 'chap-5',
      title: '终点要由证据确认',
      badge: 'both',
      badgeLabel: '语义验收',
      bridge: '状态边界让证据可读，但还没有回答「什么算完成」。本章把同一条轨迹交给返回码和 SessionVerifier 分别判断。',
      analogy: {
        title: '把终点对回地图',
        text: '同一段脚步记录：返回码只能说明「停下了」；把<b>起点、终点和路径</b>一起对回地图，才能说明「到达了计划的地方」。',
        componentId: 'hike-analogy',
      },
      prose: [
        {
          heading: '证据包，而不是返回码',
          body: 'SessionRunner 到达终止条件后，SessionVerifier 依据会话契约评估一个<b>证据包</b>：会话保留的初始与终止观测、原始任务定义、对应的 ENVIRONMENT.md 快照、动作-观测历史，以及接受标准所需的目标端事件或指标。判定函数不必是单一模型——确定性谓词、任务评估器、多模态模型或工具辅助复核可以组合在同一接口之后；不变的是证据模式和 verdict 的含义。',
        },
        {
          heading: '初始状态为什么关键',
          body: '成功往往指「变化」而不是绝对条件：只有对比 S₀ 与 S_T，才能判断物体被移动、容器被打开、危险被避开。只看终止图像无法建立这些事实——这也解释了为什么「看着像到了」不等于「任务完成」。',
        },
        {
          heading: '三种判定，三种转移',
          body: '<b>success</b>：证据满足接受标准，会话转为 succeeded。<b>failure</b>：目标未达成，转为 failed，证据保留用于诊断与教训提取。<b>replan</b>：当前证据支持「带新条件继续」——原尝试保持<b>不可变</b>，系统编译一个更新了前置条件、目标状态或策略的 child session。重规划是新的可审计决策，而不是改写历史；首次失败与重试成功都会被保留，连同父子会话的因果关系。',
        },
      ],
      modules: [
        {
          kind: 'module',
          id: '5.1',
          title: '同一条轨迹，两个判定',
          desc: '启动同步判定，再切换成功、失败或重规划三种证据情境，观察返回码与语义判定如何分道扬镳。',
          componentId: 'verdict-compare',
        },
      ],
      insight: 'SessionVerifier 不负责产生动作，它把证据包与接受标准对齐，输出 success、failure 或 replan——每次判定都追加进 attempts 记录，自动验收与人工复核共享同一接口。',
      formula: {
        lead: '验证器的输入不是一个 return code，而是一个证据包；三种输出各自触发不同的状态转移。',
        unicode: 'V(G, S₀, S_T, τ, H) → {success, failure, replan}',
        symbols: [
          { sym: 'success', desc: '证据满足接受标准，会话转为 succeeded。' },
          { sym: 'failure', desc: '目标未达成，转为 failed；证据保留，用于诊断和教训提取。' },
          { sym: 'replan', desc: '保留原尝试并编译更新条件的 child session，原会话保持不可变。' },
        ],
      },
      takeaways: [
        { icon: '🔬', title: '看变化', desc: '初始状态让「目标是否被改变」变得可判断。' },
        { icon: '🧾', title: '证据成包', desc: '图像、状态快照、轨迹和事件一起进入判定。' },
        { icon: '🔁', title: '重规划不抹除', desc: 'child session 继承因果，原尝试保持不可变。' },
      ],
    },
    {
      kind: 'chapter',
      id: 'chap-6',
      title: '同一边界支持两种执行流',
      badge: 'inf',
      badgeLabel: '执行流',
      bridge: '验证语义已经统一，但生成动作的决策点可以不同。本章区分连续策略流与 Agent 工具流，看它们如何在边界处汇合。',
      analogy: {
        title: '选一块路牌',
        text: '连续策略像按既定步频走路，Agent 工具流像边走边查路牌——无论哪一种，都<b>不能绕过</b>运行时的权限和证据边界。',
        componentId: 'hike-analogy',
      },
      prose: [
        {
          heading: '策略流：循环在运行层',
          body: 'PolicySkillRuntime 服务连续控制策略（如 VLA）：运行层反复「获取观测 → 归一化为模型输入 → 推理 → 映射回标准动作 → 执行动作或动作块」，Agent 编译完会话后退出低层循环。论文记作 Aₜ = Policy(I, Oₜ, Sₜ, Hₜ)。PolicyAdapter 负责模型特有的输入输出转换，Action Runtime 调和「模型时间」与「目标时间」——动作块缓冲、控制频率、截断、打断与重规划边界。',
        },
        {
          heading: '工具流：决策点在 Agent',
          body: 'BuiltinSkillRuntime 没有独立策略服务器：Agent 在线地「观察 → 决策 → 通过受控的 TargetSessionHandle 调用工具 → 再观察」，记作 Tₜ = Agent(I, Oₜ, Sₜ, Hₜ)。直接参与不等于 unrestricted 访问：TargetToolManifest 先被会话的工具策略过滤，observe / reset / invoke_tool / step / query_state 之外的实现细节和危险操作默认不可用。',
        },
        {
          heading: '在同一个边界汇合',
          body: '两条流都从会话创建、由 WatchdogSupervisor 监督、面向声明的目标端执行、以结构化证据包结束。这个汇合点至关重要：语义验证、基准评测、失败诊断与长期学习因此<b>不依赖</b>底层行为来自策略模型还是 Agent 的工具序列。',
        },
      ],
      modules: [
        {
          kind: 'module',
          id: '6.1',
          title: '切换策略流与工具流',
          desc: '在两种 SkillRuntime 之间切换，观察决策循环的位置变化，以及保持不变的会话、监督与证据边界。',
          componentId: 'dual-flow',
        },
      ],
      formula: {
        lead: '论文给两条流各写了一个公式——差异只在「谁在循环里做决策」，输入输出语义完全一致。',
        unicode: 'Aₜ = Policy(I, Oₜ, Sₜ, Hₜ)　·　Tₜ = Agent(I, Oₜ, Sₜ, Hₜ)',
        symbols: [
          { sym: 'Aₜ', desc: 'PolicySkillRuntime 产出的动作或动作块。' },
          { sym: 'Tₜ', desc: 'TargetSessionHandle 暴露的受控工具调用输出。' },
          { sym: 'I', desc: '自然语言指令。' },
          { sym: 'Oₜ / Sₜ / Hₜ', desc: '当前观测、状态与历史上下文。' },
        ],
      },
      takeaways: [
        { icon: '🔀', title: '决策点不同', desc: '策略流的循环在运行层，工具流的决策点在 Agent。' },
        { icon: '🛡️', title: '边界相同', desc: '会话、监督、目标端与证据接口完全共享。' },
        { icon: '🎛️', title: '参与 ≠ 授权', desc: '工具必须经 TargetToolManifest 过滤后才会暴露。' },
      ],
    },
    {
      kind: 'chapter',
      id: 'chap-7',
      title: '只有验证过的修复才算经验',
      badge: 'trn',
      badgeLabel: '自演化',
      bridge: '一次成功的重试还不能证明系统学会了。要让下一次会话受益，修复必须经过同一套判定，并带着适用条件进入记忆。',
      analogy: {
        title: '把一次踩坑写下来',
        text: '提出一个修复只是<b>猜测</b>；重新走一遍并确认有效之后，它才配成为下一次路线选择的经验。',
        componentId: 'hike-analogy',
      },
      prose: [
        {
          heading: '六步闭环的顺序约束',
          body: 'PhyAgentOS 的自演化不是「在线乱改模型」，而是系统级过程：已验证的执行结果改变未来会话可用的上下文、策略选择与能力。闭环有六步：<b>Execute → Verify → Diagnose → Revise → Re-verify → Consolidate</b>。只有走完再验证，知识才被允许写入持久记忆——这个顺序防止了最常见的失败模式：把一个未经检验的修复假设，当成事实记进了笔记本。',
        },
        {
          heading: '三层记忆抽象',
          body: '<b>episodic</b> 层保留单次会话：任务、轨迹、证据、判定与父子关系，支持回放与取证。<b>semantic</b> 层把重复片段聚合为任务/环境级知识：稳定的对象关系、复发的失败模式、策略何时更优。<b>methodological</b> 层捕捉跨多样化初始状态仍然有效的程序，可晋升为在 SKILLRUNTIME.md 注册的可复用技能——未来规划检索的是「已验证的方法」，而不是从零合成。',
        },
        {
          heading: '成功与教训分开存放',
          body: '<code>KNOWLEDGE.md</code> 存放带适用条件、provenance 和观测性能的已验证成功模式；<code>LESSONS.md</code> 存放失败记录：失败目标、相关证据、诊断原因、尝试的纠正，以及该纠正是否被后续判定验证。检索时带着 provenance 与适用范围：在一个 embodiment 上学到的教训，不会在前提不匹配时迁移到新目标——符号性知识（如任务顺序）可以广泛迁移，接触密集的操作策略可能只属于特定的夹爪几何与控制频率。',
        },
      ],
      modules: [
        {
          kind: 'module',
          id: '7.1',
          title: '六步闭环：从失败到可复用知识',
          desc: '逐步推进闭环，观察未验证的诊断为什么会在 Consolidate 之前被拦下。',
          componentId: 'evolve-loop',
        },
      ],
      formula: {
        lead: '六步顺序本身就是因果约束——每一步的输入都是上一步的输出。',
        unicode: 'Execute → Verify → Diagnose → Revise → Re-verify → Consolidate',
        symbols: [
          { sym: 'Execute', desc: '会话经标准运行时路径执行，产出轨迹与终止证据。' },
          { sym: 'Verify', desc: 'SessionVerifier 给出语义判定。' },
          { sym: 'Diagnose', desc: '结合契约、环境转移、运行时事件与既有教训定位候选原因。' },
          { sym: 'Revise', desc: '恢复策略修改子目标、运行时、目标配置或动作方法，编译为新会话。' },
          { sym: 'Re-verify', desc: '修订后的策略在相同的验收语义下重新执行。' },
          { sym: 'Consolidate', desc: '只有验证后的结果才写入 KNOWLEDGE.md / LESSONS.md。' },
        ],
      },
      takeaways: [
        { icon: '🧠', title: '三层记忆', desc: 'episodic 保留会话，semantic 聚合模式，methodological 沉淀方法。' },
        { icon: '🧪', title: '验证再固化', desc: '修复假设不能直接成为事实，必须通过再验证。' },
        { icon: '🌐', title: '迁移有条件', desc: 'provenance、目标端和适用范围必须匹配才允许迁移。' },
      ],
    },
    {
      kind: 'chapter',
      id: 'chap-8',
      title: '架构把职责放在正确边界',
      badge: 'trn',
      badgeLabel: '架构',
      bridge: '前面看到的是机制，现在收拢到一张图：谁规划、谁监督、谁执行、谁验证？点击组件，沿一条真实职责链走一遍。',
      analogy: {
        title: '把背带拉到合适的位置',
        text: '好的背包不把重量都压在一个肩膀上——系统也不把所有职责塞进一个模型，而是让<b>每个边界</b>承担一类可检查的责任。',
        componentId: 'hike-analogy',
      },
      prose: [
        {
          heading: '两个平面，一条边界',
          body: 'Agent 平面决定<b>做什么</b>：Goal Planner 把请求解释为任务目标并锁定必须保持不变的约束；Goal Graph / Session Compiler 把目标分解为依赖感知的子任务并编译成会话；SkillRuntime-Target Selector 依据能力、观测模态、动作语义与目标约束选择执行方法与目标。Runtime 平面决定<b>怎么做</b>：WatchdogSupervisor 监督，SessionRunner 拥有具体交互的生命周期，SkillRuntime 供给执行逻辑，Target 暴露受控接口。',
        },
        {
          heading: '协议边界是唯一的通道',
          body: '协议层不是又一个执行引擎，也不编码目标特定的控制逻辑。它只记录：请求了什么、选了哪种能力与目标、当前观测到什么、从结果学到了什么。两个平面由此保持松耦合——任何一侧都可以在不 import 对方实现的情况下独立演化。',
        },
        {
          heading: '职责不互相冒充',
          body: 'Agent 不发原始硬件命令；WatchdogSupervisor 监督而不控制；SafetyGuard 与目标端保留最终权威；SessionVerifier 不产生动作，只产出 verdict。职责边界清晰，失败才能被归因到策略、适配器、执行或验证——而不是消失在一个黑盒里。',
        },
      ],
      modules: [
        {
          kind: 'module',
          id: '8.1',
          title: '点击组件，追踪一条可审计路径',
          desc: '点击架构中的任一组件，观察它的职责、输入输出与所在的平面；高亮路径显示它参与的那条链。',
          componentId: 'arch-map',
        },
      ],
      takeaways: [
        { icon: '🧱', title: '职责分层', desc: 'Agent、Runtime、Target 和 Verifier 各司其职，不互相冒充。' },
        { icon: '🔗', title: '边界显式', desc: '协议记录交接与证据，两个平面松耦合。' },
        { icon: '🧭', title: '路径可追踪', desc: '任一组件都能回答：它影响哪条责任链。' },
      ],
    },
    {
      kind: 'chapter',
      id: 'chap-9',
      title: '逐步加回物理与安全约束',
      badge: 'trn',
      badgeLabel: '验证+安全',
      bridge: '系统在游戏里验证认知，在模拟里加入动力学，再到真实硬件面对噪声与风险。本章同时看验证梯度与五层安全边界。',
      analogy: {
        title: '先试这一处脚下',
        text: '从游戏到模拟再到真实机器人，<b>逐层</b>加回动力学、延迟、噪声和硬件约束——认知层保持不变。',
        componentId: 'hike-analogy',
      },
      prose: [
        {
          heading: '渐进验证：先隔离，再逐层加回',
          body: '游戏环境剥离物理噪声，把记忆、规划与自演化作为受控变量来研究：Minecraft 考验稀疏反馈下的目标追求，Stardew Valley 考验多资源调度，Don’t Starve 考验不可逆死亡下的风险规划。模拟层加入刚体动力学、碰撞检测与可配置延迟；真实机器人再加入硬件噪声、传感器不确定性与安全关键约束。<b>认知层在三层之间保持不变</b>——任何性能下降都可以归因到具体层，而不是架构崩塌。',
        },
        {
          heading: '纵深防御的五层',
          body: '兼容性预检挡住结构非法的组合；ActionBridge 约束抽象动作如何被翻译；<b>SafetyGuard</b> 决定翻译后的命令是否可发——数据类型与维度、NaN 与无穷值、关节与工作空间限位、速度与加速度、命令时长、动作频率、急停状态；心跳监测处理进程失联与网络分区，超时触发受控终止而不是带着过期状态继续执行；目标端本地约束（限位、碰撞检测、扭矩与急停）是最内层、始终生效的最终权威。',
        },
        {
          heading: '安全事件也是证据',
          body: '每一次安全干预都以结构化违规码写入会话证据，让 SessionVerifier 能区分「不安全地追求目标」与「保安全的终止」，也能在诊断时区分安全干预、策略错误与通信故障。安全约束本身对自演化不可变——<b>安全定义了系统可以探索、恢复和改进的容许区域</b>。',
        },
      ],
      modules: [
        {
          kind: 'module',
          id: '9.1',
          title: '选择验证层级',
          desc: '切换游戏、模拟与真实机器人三层，观察每一层隔离了什么、又加回了什么物理因素。',
          componentId: 'tier-ladder',
        },
        {
          kind: 'module',
          id: '9.2',
          title: '一次危险动作会停在哪一层？',
          desc: '选择一类故障，观察它在五层防御中被哪一层拦下——以及为什么越内层的权威越不可替代。',
          componentId: 'five-layers',
        },
      ],
      takeaways: [
        { icon: '🪜', title: '逐层验证', desc: '物理复杂度分阶段加回，认知层保持不变。' },
        { icon: '🛡️', title: '纵深防御', desc: '预检、桥接、SafetyGuard、心跳、目标端各管一类失败。' },
        { icon: '⚠️', title: '不能外推', desc: '游戏层的结果不能替代真实机器人的安全证据。' },
      ],
    },
    {
      kind: 'chapter',
      id: 'chap-10',
      title: '结果提升，但边界仍在',
      badge: 'both',
      badgeLabel: '实验',
      bridge: '最后把结果放回它们各自的协议、数据集和指标里。可恢复失败确实带来提升，但困难任务、物理覆盖和长期记忆仍留下边界。',
      analogy: {
        title: '到达终点，也要查记录',
        text: '终点的绿色不是「所有任务都解决」，而是每个协议下都能看见<b>证据、提升和剩余难点</b>。',
        componentId: 'hike-analogy',
      },
      prose: [
        {
          heading: '评测即编排：同一 条执行路径',
          body: 'Benchmarking 在 PhyAgentOS 里不是包在策略外面的脚本，而是运行时的一种编排模式：Availability Gate 先验证目标端与策略运行时可用，Session Compiler 把任务与初始状态展开为可复现的会话集，再由与部署完全相同的 Watchdog → Runner → SkillRuntime 路径执行并验收。报告的差异因此可以归因于声明的实验变量，而不是评测装置的分歧。模拟层采用双协议：<b>First</b> 测策略首试，<b>Final</b> 测验证器在失败后触发受控恢复的结果——不改权重、不重置环境、不改成功标准。',
        },
        {
          heading: '数字与它们的协议',
          body: '游戏层：Optimus-67 上 RedStone 30% 超过所有已报告基线，Diamond 19% 高于最强基线的 15%；StarDojo Lite-100 总体 22.0% 对 SPIKE 的 18.0%，其中 Crafting 50.0% 对最强基线的 23.8%；DST-Dojo 生存天数从 1.02 翻倍到 2.10，Day 3 存活率 0% → 30%。模拟层：LIBERO 四个后端全部提升（+0.4 ~ +1.3 pt）；CALVIN ABC→D 五步全链完成率 π0 +6.7 pt、π0.5 +4.1 pt；RoboCasa365 总体 +7.2 ~ +9.2 pt。真实机器人覆盖 19 种以上 embodiment，安全验证聚焦预检拒绝率、SafetyGuard 拦截有效性与急停延迟。',
        },
        {
          heading: '诚实的边界',
          body: 'Optimus-67 的 Armor 组只有 15%，终局装备生产仍是前沿；StarDojo 的 hard 任务为 0.0%，DST 里黑暗仍是主要死因——恢复机制有效，但困难任务没有被消灭。系统层面：文件协议目前基于轮询，延迟与轮询间隔成正比；记忆没有压缩上限，检索依赖启发式；真机评测偏重安全验证而非大规模完成率统计。这些边界在论文里被明确写出，而不是被藏起来。',
        },
      ],
      modules: [
        {
          kind: 'module',
          id: '10.1',
          title: '按协议比较 First 与 Final',
          desc: '选择一个基准并展开对比；数值只在同一协议内对齐，注意每个基准的单位与指标方向。',
          componentId: 'benchmark-lab',
        },
      ],
      takeaways: [
        { icon: '📈', title: '恢复有效但有条件', desc: '增益随基线强弱与失败类型变化。' },
        { icon: '🧱', title: '难点未消失', desc: '高难度、黑暗、长程与真实覆盖仍是限制。' },
        { icon: '🧭', title: '正确读表', desc: 'First / Final、数据集、单位与指标方向必须一起看。' },
      ],
    },
  ],
};
