import type { ReactNode } from "react";
import type { ReferenceEntry } from "../shared/core/reference/types";

function ReferenceDetail({
  explanation,
  steps,
  note,
}: {
  explanation: string;
  steps?: readonly { title: string; text: string }[];
  note?: string;
}) {
  return <section className="reference-explanation">
    <p>{explanation}</p>
    {steps && <ol>{steps.map((step) => <li key={step.title}><strong>{step.title}</strong><span>{step.text}</span></li>)}</ol>}
    {note && <p className="reference-example"><strong>读这页时：</strong>{note}</p>}
  </section>;
}

function SourceLink({ href, children }: { href: string; children: ReactNode }) {
  return <a href={href} target="_blank" rel="noreferrer">{children}</a>;
}

const L2P = "https://arxiv.org/abs/2112.08654";
const VIT = "https://arxiv.org/abs/2010.11929";

export const references: ReferenceEntry[] = [
  {
    id: "continual-learning", page: "P1", name: "持续学习", english: "Continual learning",
    definition: "模型按时间顺序接收新任务或不断变化的数据，同时尽量保留从先前数据中学到的能力。",
    role: "P1 先建立这个冲突：模型要适应后来数据，也要继续识别更早学过的类别。",
    confusion: "它描述的是一类学习场景，不特指某一种算法，也不保证旧任务表现一定不下降。",
    detail: <ReferenceDetail
      explanation="普通监督学习常把数据视为一次准备好的训练集；持续学习关注数据分批到达之后，模型如何继续更新。新数据可能带来新类别，也可能让输入外观或分布发生变化。"
      steps={[
        { title: "数据依次到来", text: "模型先接触当前阶段可见的样本，随后切换到新的数据或任务。" },
        { title: "共享状态继续变化", text: "后续更新会改变模型的参数与内部表示，先前学到的判断也可能受影响。" },
        { title: "检查旧能力", text: "除了新数据上的效果，还要观察模型在较早数据或类别上的表现是否保留。" },
      ]}
      note="任务之间是否有清楚边界、测试时能否拿到任务 ID，是不同的协议条件，不能由‘持续学习’四个字直接推断。"
    />,
    related: ["class-incremental", "catastrophic-forgetting", "rehearsal-buffer"],
    source: <>L2P §1、§3.1（PDF pp. 1、3）。<SourceLink href={L2P}>查看论文摘要与原文</SourceLink></>,
  },
  {
    id: "class-incremental", page: "P1", name: "类别增量", english: "Class-incremental learning",
    definition: "训练阶段陆续引入新类别；测试时，模型需要在迄今学过的全部类别中为输入作出一次统一判断。",
    role: "鱼类、鸟类先学，猫、狗后来加入；测试只给图像，四类一起竞争。",
    confusion: "类别增量测试时通常不给任务 ID；这不表示训练过程中也一定没有任务边界。",
    detail: <ReferenceDetail
      explanation="类别集合会随着阶段扩展。模型完成若干阶段后，要使用共同的预测空间比较旧类和新类，而不是先由任务编号挑出一小组类别再分类。"
      steps={[
        { title: "阶段 1", text: "先学一部分类别，例如示例中的鸟和鱼。" },
        { title: "阶段 2", text: "训练数据加入猫和狗，已学类别集合随之扩大。" },
        { title: "测试", text: "输入没有任务提示，分类器须在鸟、鱼、猫、狗等全部已见类别间选择。" },
      ]}
      note="L2P 论文在类别增量设置中明确采用‘测试时任务身份未知’的条件；任务顺序仍可由训练协议给出。"
    />,
    related: ["task-id", "task-boundary", "domain-incremental", "task-agnostic"],
    source: <>L2P §3.1（PDF p. 3）、§5.1（PDF p. 6）。<SourceLink href={L2P}>查看论文摘要与原文</SourceLink></>,
  },
  {
    id: "task-id", page: "P1", name: "任务 ID", english: "Task identity",
    definition: "标识一个样本或测试输入属于哪项任务的标签；模型若能取得它，就可以据此选择对应的任务分支或类别范围。",
    role: "P1 用‘只收到图像’的路由图说明，类别增量测试不会提供这个提示。",
    confusion: "任务 ID 与任务边界不同：前者是身份标签，后者是数据流中任务切换的位置。",
    detail: <ReferenceDetail
      explanation="‘知道现在属于哪项任务’可以在训练或推断的不同时间点发生。论文会分别说明测试有没有任务 ID、数据流有没有显式边界；两者不能合并成一个开关。"
      steps={[
        { title: "有 ID", text: "输入附带任务身份，方法可能据此选择该任务的分类头、参数或类别子集。" },
        { title: "无 ID", text: "输入只包含观察到的内容，系统要自己完成必要的判断或检索。" },
      ]}
      note="P1 的类别增量示例强调‘测试无任务 ID’；它不自动推导出‘训练流无边界’。"
    />,
    related: ["task-boundary", "class-incremental", "task-agnostic"],
    source: <>L2P §3.1（PDF p. 3）对类别增量、任务增量与 task-agnostic 设定的区分。<SourceLink href={L2P}>查看论文摘要与原文</SourceLink></>,
  },
  {
    id: "task-boundary", page: "P1", name: "任务边界", english: "Task boundary",
    definition: "数据流中标记一项任务结束、另一项开始的切换点；边界可能清楚可见，也可能没有明确提示。",
    role: "P1 对照‘逐任务训练’与没有明显分段的 task-agnostic 数据流。",
    confusion: "有任务边界不代表测试时有任务 ID；没有任务 ID 也不等于数据流没有边界。",
    detail: <ReferenceDetail
      explanation="任务边界描述的是数据到达过程。边界清楚时，训练系统可能知道何时切换阶段；边界不清楚时，系统要直接面对连续变化的数据。"
      steps={[
        { title: "训练分段已知", text: "样本仍可按阶段到达，学习器也可以获知阶段交接。" },
        { title: "测试身份未知", text: "单张测试图仍可能不附带任务 ID；这是另一项评估条件。" },
      ]}
      note="L2P 的 task-agnostic 实验去掉显式任务边界；类别增量协议则主要强调测试时不知道任务身份。"
    />,
    related: ["task-id", "task-agnostic", "class-incremental"],
    source: <>L2P §3.1（PDF p. 3）、Appendix C（PDF p. 12）。<SourceLink href={L2P}>查看论文摘要与原文</SourceLink></>,
  },
  {
    id: "domain-incremental", page: "P1", name: "域增量", english: "Domain-incremental learning",
    definition: "类别标签集合保持不变，输入外观或数据分布随时间改变；模型需在变化的域上继续识别相同标签。",
    role: "用来对照类别增量：前者改变输入域，后者逐步扩大需要区分的类别集合。",
    confusion: "域增量不是‘新增一批类别’；它改变的重点是输入分布，而非标签集合。",
    detail: <ReferenceDetail
      explanation="‘域’可以理解为图像采集或呈现数据的条件。类别仍相同，但照明、背景、设备、风格等条件变化时，模型收到的像素分布会变。"
      steps={[
        { title: "标签不变", text: "预测目标仍是原来的类别集合。" },
        { title: "输入变化", text: "图像的来源或统计特征改变，旧有特征与新图像之间可能出现偏差。" },
      ]}
      note="L2P 使用 CORe50 评估域增量；P1 只借它说明协议差异，不展开该数据集。"
    />,
    related: ["class-incremental", "task-agnostic", "continual-learning"],
    source: <>L2P §3.1、§5.2（PDF pp. 3、6）。<SourceLink href={L2P}>查看论文摘要与原文</SourceLink></>,
  },
  {
    id: "task-agnostic", page: "P1", name: "Task-agnostic 持续学习", english: "Task-agnostic continual learning",
    definition: "数据流没有清楚的任务切换标记；模型在连续变化的输入中学习，不能依靠任务边界安排更新。",
    role: "它与类别增量测试无任务 ID 是两种不同条件，P1 在这里点明区别。",
    confusion: "无任务边界描述训练数据流；无任务 ID 描述某次输入缺少身份信息。",
    detail: <ReferenceDetail
      explanation="这里的 agnostic 指学习过程不接收显式任务切换信号。连续的数据分布可以逐渐漂移，系统需要在流上持续处理，而不是等待任务结束后再统一更新。"
      steps={[
        { title: "数据连续变化", text: "样本到达过程中，数据分布逐步改变。" },
        { title: "没有边界事件", text: "训练过程没有明确的任务编号或交接点作为提示。" },
      ]}
      note="L2P 的 task-agnostic CIFAR-100 协议通过高斯调度构造平滑数据变化，论文将该基准称为合成设置；这不是所有真实数据流的代表。"
    />,
    related: ["task-boundary", "task-id", "class-incremental", "domain-incremental"],
    source: <>L2P §3.1、Appendix C（PDF pp. 3、12）。<SourceLink href={L2P}>查看论文摘要与原文</SourceLink></>,
  },
  {
    id: "catastrophic-forgetting", page: "P1", name: "灾难性遗忘", english: "Catastrophic forgetting",
    definition: "模型继续学习新数据后，在先前任务或类别上的预测能力明显下降；新旧能力之间的干扰是持续学习要处理的问题。",
    role: "鱼骨图把共享参数更新、特征变化和旧图预测受扰串成一条因果路径。",
    confusion: "单次预测变化能说明可能受扰，不足以独自证明整体性能下降；整体结论要看旧任务评测。",
    detail: <ReferenceDetail
      explanation="神经网络通常由许多任务共享一组参数。后续训练为了改善当前目标而调整这些参数，可能连带改变旧类别曾依赖的特征与决策边界。"
      steps={[
        { title: "旧数据建立判断", text: "当前参数编码了已学类别所需的特征与分类规则。" },
        { title: "新数据驱动更新", text: "优化器沿新的训练目标改变共享权重。" },
        { title: "旧任务再评测", text: "若旧任务表现下降，就观察到遗忘；下降程度需通过成组评测量化。" },
      ]}
      note="P1 的鸟类预测对比是解释机制的合成示例，不等同于论文的整体遗忘指标。"
    />,
    related: ["continual-learning", "pretrained-backbone", "frozen-parameters", "rehearsal-buffer"],
    source: <>L2P §1、§3.1、§5.1（PDF pp. 1、3、6）。<SourceLink href={L2P}>查看论文摘要与原文</SourceLink></>,
  },
  {
    id: "pretrained-backbone", page: "P1", name: "预训练主干", english: "Pretrained backbone",
    definition: "先在较大或不同的数据集上学过视觉表示的特征网络，之后作为下游任务的基础模型继续使用。",
    role: "P1 提出保留 ViT 主干；P2 随后拆解它把图像变成特征序列的方式。",
    confusion: "预训练主干是模型的一部分；分类器是把特征映射到当前类别标签的输出层。",
    detail: <ReferenceDetail
      explanation="预训练阶段先让网络从大量图像中形成可复用的参数与特征。下游任务可以固定全部或部分主干，再训练适配模块或输出头。‘主干’通常指抽取表示的主体网络，不含任务最终读出层。"
      steps={[
        { title: "预训练", text: "利用源数据学习一般性的图像表示。" },
        { title: "迁移使用", text: "把已有权重带到新数据或新类别上，作为下游模型的表示基础。" },
        { title: "适配策略", text: "可以更新主干，也可以冻结它并只学习少量附加参数；具体做法由方法决定。" },
      ]}
      note="L2P 的方案冻结预训练 ViT 的输入嵌入与特征提取器，学习 Prompt、Key 和最终分类器参数。"
    />,
    related: ["frozen-parameters", "vit", "catastrophic-forgetting"],
    source: <>L2P §3.2、§4（PDF pp. 4–5）；典型视觉 Transformer 见 <SourceLink href={VIT}>ViT 原论文</SourceLink>。</>,
  },
  {
    id: "frozen-parameters", page: "P1", name: "冻结参数", english: "Frozen parameters",
    definition: "训练时把一组模型权重固定下来，不对它们执行优化器更新；这些权重仍参与每一次前向计算。",
    role: "L2P 固定预训练主干，让学到的输入 Prompt 仍可改变网络接收到的内容。",
    confusion: "冻结权重不等于网络输出恒定；只要输入序列变化，注意力和激活值就可以变化。",
    detail: <ReferenceDetail
      explanation="模型参数是长期保存的可学习权重；激活值是某次输入通过网络时临时算出的结果。冻结只阻止前一类状态被训练更新，并不会跳过网络计算。"
      steps={[
        { title: "参数不写回", text: "反向传播或优化器更新不会改变被冻结模块的权重。" },
        { title: "仍执行前向", text: "当前输入照常经过嵌入层、Attention 与后续模块。" },
        { title: "结果随输入变化", text: "不同图像或 Token 序列可以在同一固定权重下产生不同的中间表示与预测。" },
      ]}
      note="P3 的额外 Token 对照固定投影权重，只改变序列输入，正是为了把‘权重固定’与‘输出固定’区分开。"
    />,
    related: ["pretrained-backbone", "forward-pass", "catastrophic-forgetting"],
    source: <>L2P §3.2、Algorithm 1（PDF pp. 4、13）。<SourceLink href={L2P}>查看论文摘要与原文</SourceLink></>,
  },
  {
    id: "rehearsal-buffer", page: "P1", name: "回放缓冲区", english: "Rehearsal / replay buffer",
    definition: "从早期数据中保留少量代表性样本，在学习新数据时再次取出，与当前样本一起训练。",
    role: "P1 说明基础 L2P 不依赖旧图像回放，因此无需把全部旧训练图像留存。",
    confusion: "缓冲区回放会保存样本；冻结预训练权重或保存 Prompt 参数，都不属于样本回放。",
    detail: <ReferenceDetail
      explanation="回放方法用有限存储代表过去经验。新阶段训练时，把缓存的旧样本重新送入模型，直接提醒模型保留先前类别的判断。缓冲区容量与样本选择策略会影响方法的存储成本和表现。"
      steps={[
        { title: "挑选并存储", text: "从先前任务保留一小批图像或样本摘要。" },
        { title: "新旧混合训练", text: "后续更新时再次使用缓存内容，让当前目标同时看到过去与现在。" },
      ]}
      note="论文区分不带回放缓冲区的 L2P 与使用缓冲区的 L2P-R。这里的‘无需保存旧样本’指基础 L2P 方法，不代表训练不需要当前阶段数据。"
    />,
    related: ["continual-learning", "catastrophic-forgetting"],
    source: <>L2P §1、§5.1（PDF pp. 1、6）。<SourceLink href={L2P}>查看论文摘要与原文</SourceLink></>,
  },
];
