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
const TRANSFORMER = "https://arxiv.org/abs/1706.03762";

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
  {
    id: "vit", page: "P2", name: "视觉 Transformer", english: "Vision Transformer · ViT",
    definition: "把图像切成一组 Patch，并像处理序列一样交给 Transformer 编码的视觉模型。",
    role: "L2P 使用预训练 ViT 作视觉主干；P2 沿它的输入嵌入、Encoder 与分类读出展开。",
    confusion: "ViT 是通用架构背景，L2P 的方法贡献是后续加入的 Prompt Pool 与检索机制。",
    detail: <ReferenceDetail
      explanation="传统卷积网络沿局部网格反复提取特征；ViT 则把图像分块，每块转成向量 Token，再用 Transformer 在序列位置间交换信息。每个位置经过编码后仍保留原有序列索引。"
      steps={[
        { title: "切分图像", text: "将二维像素网格划为固定大小的图像块。" },
        { title: "形成向量序列", text: "每个图像块映射到同一宽度的特征向量，并加入位置信息。" },
        { title: "上下文编码", text: "多层 Transformer 让不同图像区域交换信息，再读取用于分类的表示。" },
      ]}
      note="L2P 复用预训练 ViT 的图像嵌入与 Transformer 主干；本页展示的是它的架构前置知识。"
    />,
    related: ["pretrained-backbone", "image-patch", "token-sequence", "encoder-block", "vit-b16"],
    source: <>L2P §3.2、§5.2（PDF pp. 4、7）；架构细节见 <SourceLink href={VIT}>ViT 原论文</SourceLink>。</>,
  },
  {
    id: "embedding-layer", page: "P2", name: "输入嵌入", english: "Input embedding · fₑ",
    definition: "把原始图像像素转换为 Transformer 能处理的向量序列，包含图像块映射与位置信息组装。",
    role: "图中的 fₑ 是 ViT 的入口；它先把像素变成模型宽度的 Token。",
    confusion: "输入嵌入只负责构造初始序列；跨位置的上下文交互发生在后续 Encoder 中。",
    detail: <ReferenceDetail
      explanation="输入嵌入不是一个必须独立成层的单一矩阵名。在 ViT 中，它通常统称图像块投影、[CLS] Token 与位置向量等步骤，输出尺寸为‘序列长度 × 特征宽度’。"
      steps={[
        { title: "接收像素", text: "输入为带有空间与颜色通道的图像数组。" },
        { title: "映射各块", text: "同一组投影权重把每个 Patch 转成向量。" },
        { title: "组装位置", text: "加入 [CLS] 与位置向量，得到 Encoder 的整条输入序列。" },
      ]}
      note="L2P 将输入嵌入记作 fₑ，并与后续的 Transformer 特征提取器 fᵣ 一起保持冻结。"
    />,
    related: ["image-patch", "linear-projection", "patch-token", "position-embedding", "cls-token", "frozen-parameters"],
    source: <>L2P §3.2（PDF p. 4）；ViT 输入序列构造见 <SourceLink href={VIT}>ViT 原论文 §3.1</SourceLink>。</>,
  },
  {
    id: "image-patch", page: "P2", name: "图像块（Patch）", english: "Image patch",
    definition: "把图像网格切分后得到的局部矩形区域；ViT 对每块分别映射成序列中的一个视觉 Token。",
    role: "P2 的可选网格块对应一段固定像素范围，可沿它追踪到输出向量。",
    confusion: "Patch 是图像区域；Patch Token 是这个区域经过投影后的向量表示。",
    detail: <ReferenceDetail
      explanation="图像通常有高、宽、颜色三个维度。切块时按固定网格划分空间范围，不改变块内的像素数值；之后再为每个小块单独做向量映射。"
      steps={[
        { title: "确定网格", text: "224×224 图像按 16×16 像素分块，每条边可分成 14 块。" },
        { title: "编号位置", text: "二维网格按固定顺序展成 196 个 Patch 位置。" },
      ]}
      note="切块本身不会产生语义特征；图像块要经过嵌入投影才成为模型宽度的 Token。"
    />,
    related: ["flattening", "linear-projection", "patch-token", "vit-b16"],
    source: <>ViT 原论文 §3.1（<SourceLink href={VIT}>论文原文</SourceLink>）；L2P 的输入尺寸见 §5.2（PDF p. 7）。</>,
  },
  {
    id: "flattening", page: "P2", name: "展平", english: "Flattening",
    definition: "按预定顺序把 Patch 中的行、列和颜色通道排成一维向量；这一步重排数据，不负责学习特征。",
    role: "图中的 16×16×3 像素值被排成长度 768 的输入，再交给投影矩阵。",
    confusion: "展平不等于压缩或语义编码；特征坐标是在后面的线性投影中学习出来的。",
    detail: <ReferenceDetail
      explanation="例如一个 16×16 的 RGB 图像块含有 16×16×3 个标量。规定好遍历顺序后，将这些值串起来，就能用普通矩阵乘法统一处理。遍历约定要在整个模型中保持一致。"
      steps={[
        { title: "保持数值", text: "展平前后的像素值相同。" },
        { title: "改变形状", text: "从二维空间布局与通道轴转成一个一维列表。" },
        { title: "交给学习层", text: "投影权重再把该列表变成模型内部的特征表示。" },
      ]}
      note="P2 的 PatchMotion 可暂停查看同一块的读取顺序；只有投影步骤改变特征坐标。"
    />,
    related: ["image-patch", "linear-projection", "patch-token"],
    source: <>ViT 原论文 §3.1（<SourceLink href={VIT}>论文原文</SourceLink>）。</>,
  },
  {
    id: "linear-projection", page: "P2", name: "线性投影", english: "Linear projection",
    definition: "用一组训练得到的矩阵权重和偏置，将 Patch 像素向量映射到模型使用的特征维度。",
    role: "ViT 对各 Patch 使用共享映射，使每个图像块进入相同宽度的特征空间。",
    confusion: "它会混合并重表达输入数值；输出不再是原始像素列表，也不等同于附加位置信息。",
    detail: <ReferenceDetail
      explanation="把展平后的像素向量 x 乘以权重矩阵 W，再加偏置 b，得到 z=xW+b。权重通过训练学习哪些像素组合适合作为特征。每个 Patch 复用相同的 W 与 b，因而可在不同空间位置比较这些表示。"
      steps={[
        { title: "输入", text: "一维 Patch 像素向量，典型示例长度为 768。" },
        { title: "共享映射", text: "所有 Patch 通过同一个线性层，不为每个位置单独配一套权重。" },
        { title: "输出", text: "得到模型宽度 D 的 Patch Token；位置向量随后按序列位置加入。" },
      ]}
      note="图中的矩阵和向量格是形状示意，显示的数字不代表论文训练出的真实权重。"
    />,
    related: ["flattening", "patch-token", "position-embedding", "embedding-layer"],
    source: <>ViT 原论文 §3.1（<SourceLink href={VIT}>论文原文</SourceLink>）；本页矩阵演示为教学图。</>,
  },
  {
    id: "patch-token", page: "P2", name: "Patch Token", english: "Patch embedding / visual token",
    definition: "由一个 Patch 的像素向量投影得到的特征向量；它以一个序列位置代表对应的图像区域。",
    role: "P2 追踪 Patch A 时，格状向量从像素值变成这枚 Token 的特征坐标。",
    confusion: "视觉 Token 是向量单位，不是自然语言里的单词；它也不保留原始二维像素排列。",
    detail: <ReferenceDetail
      explanation="每块图像经过共享投影后变成 D 维向量。向量所在的序列位置仍与原图块位置相对应，之后再加入对应的位置向量，交给 Transformer 编码。"
      steps={[
        { title: "图像区域", text: "输入中一块固定范围的 RGB 像素。" },
        { title: "内容表示", text: "线性投影把像素值变成 D 个学习特征。" },
        { title: "序列成员", text: "该向量作为一个 Token，和其他 Patch Token 一起输入 Encoder。" },
      ]}
      note="Token 在这里表示序列的一项，不要求它对应词语、离散 ID 或单个像素。"
    />,
    related: ["image-patch", "linear-projection", "token-sequence", "position-embedding"],
    source: <>ViT 原论文 §3.1（<SourceLink href={VIT}>论文原文</SourceLink>）。</>,
  },
  {
    id: "token-sequence", page: "P2", name: "Token 序列", english: "Token sequence",
    definition: "按固定位置顺序排列的一组向量；Transformer 将整组位置作为输入，在各层中更新它们的表示。",
    role: "P2 逐个位置保留 Patch 身份；P3 将说明一个位置怎样读取其余位置。",
    confusion: "Token 序列不是词语串；图像 Token 表示图像块或额外的聚合位置。",
    detail: <ReferenceDetail
      explanation="把每个向量视作序列中的一个位置，整个输入可写成长度 N、宽度 D 的矩阵。层间传递时位置索引不变，向量内容会随注意力和前馈变换更新。"
      steps={[
        { title: "长度 N", text: "表示当前共有多少个 Token 位置。" },
        { title: "宽度 D", text: "表示每个 Token 用多少个特征坐标记录内容。" },
        { title: "整组传递", text: "每个 Encoder Block 接收完整矩阵并输出相同长度、相同宽度的新矩阵。" },
      ]}
      note="P2 使用 N=197、D=768 的 ViT-B/16 示例配置；换模型或 Patch 设置，形状也会改变。"
    />,
    related: ["patch-token", "position-embedding", "cls-token", "token-shape", "encoder-block"],
    source: <>ViT 原论文 §3.1（<SourceLink href={VIT}>论文原文</SourceLink>）。</>,
  },
  {
    id: "position-embedding", page: "P2", name: "位置向量", english: "Positional embedding",
    definition: "按序列位置分配的向量，与 Token 内容相加，使模型能区分图像块在原图中的位置。",
    role: "它把 Patch A 的行列位置带入输入序列，之后由 Encoder 联合内容处理。",
    confusion: "位置向量不是 Patch 像素，也不是注意力权重；它在输入端提供位置线索。",
    detail: <ReferenceDetail
      explanation="如果只把图像块表示按序列顺序送入一个不含位置机制的网络，网络本身不会自然知道每个向量来自图像的哪一格。ViT 为每个序列槽位准备一个可学习的位置向量，并与对应内容表示逐元素相加。"
      steps={[
        { title: "第 0 位", text: "通常对应额外的 [CLS] Token。" },
        { title: "第 1–196 位", text: "依照 Patch 的固定扫描顺序，对应各图像块。" },
        { title: "相加", text: "每个内容向量与自己位置的向量相加，结果形成 Encoder 输入。" },
      ]}
      note="所用位置编码的形状和插值方式取决于具体 ViT 配置；P2 只解释本例的序列位置向量。"
    />,
    related: ["token-sequence", "cls-token", "embedding-layer"],
    source: <>ViT 原论文 §3.1（<SourceLink href={VIT}>论文原文</SourceLink>）。</>,
  },
  {
    id: "cls-token", page: "P2", name: "[CLS] Token", english: "Class token",
    definition: "在 Patch 序列前添加的一个可学习向量；经过 Encoder 后，常用其末层表示作为整幅图像的读出特征。",
    role: "ViT-B/16 输入含 196 个图像块位置和 1 个 [CLS] 位置。",
    confusion: "它不是从某个图像块裁出来的；L2P 还会将无 Prompt 的 [class] 特征用于 Key 检索。",
    detail: <ReferenceDetail
      explanation="[CLS] 占据序列中的一个专用位置，不对应任何局部 Patch。自注意力让该位置逐层读取图像区域的信息，最终形成可供分类使用的汇总表示。"
      steps={[
        { title: "加入序列前端", text: "把一个可学习向量放在所有 Patch Token 之前。" },
        { title: "参与同一计算", text: "它与图像 Token 一起经过各层注意力与前馈变换。" },
        { title: "读出整图", text: "标准 ViT 分类常将它的末层向量送入分类头。" },
      ]}
      note="L2P 用 [class] 输出作检索 Query；完整 L2P 分类路径会在 P6 另读 Prompt 位置的输出，不能把两条用途混为一谈。"
    />,
    related: ["token-sequence", "position-embedding", "classification-head"],
    source: <>ViT 原论文 §3.1（<SourceLink href={VIT}>论文原文</SourceLink>）；L2P 的默认 Query 定义见 §4.2（PDF p. 5）。</>,
  },
  {
    id: "vit-b16", page: "P2", name: "ViT-B/16 配置", english: "Vision Transformer · Base / 16",
    definition: "ViT 的 Base 规模变体，Patch 边长为 16 像素；在 224×224 输入例子中形成 196 个 Patch Token。",
    role: "这是 P2 用来计算 197 个位置与 768 维宽度的典型结构配置。",
    confusion: "这些尺寸属于所选骨干配置，不是所有 ViT 的固定常数，也不是 L2P 的新算法部件。",
    detail: <ReferenceDetail
      explanation="“B”表示 Base 规模，“16”表示每个 Patch 的边长为 16 像素。224 除以 16，每边得到 14 格；二维网格共 14×14=196 块。再加上一个 [CLS] 位置，序列长度成为 197。"
      steps={[
        { title: "图像输入", text: "224×224 像素。" },
        { title: "Patch 网格", text: "14×14 个 16×16 图像块，共 196 块。" },
        { title: "整图位置", text: "额外添加一个 [CLS]，总序列长度为 197。" },
        { title: "特征宽度", text: "该 Base 配置的每个 Token 使用 768 个特征坐标。" },
      ]}
      note="L2P 论文使用预训练 ViT-B/16 并将输入缩放到 224×224；该架构数值说明的是所用模型，不是 L2P 独有设计。"
    />,
    related: ["vit", "token-shape", "image-patch", "cls-token"],
    source: <>L2P §5.2（PDF p. 7）；具体结构见 <SourceLink href={VIT}>ViT 原论文与模型配置</SourceLink>。</>,
  },
  {
    id: "token-shape", page: "P2", name: "序列形状 197 × 768", english: "Sequence length × hidden width",
    definition: "矩阵的第一维是 Token 位置数，第二维是每个位置的特征宽度；本例分别为 197 与 768。",
    role: "帮助读取 P2 的 Xₑ∈ℝ^(197×768)：整条图像表示是一组向量，而非单个 768 维向量。",
    confusion: "197 表示有多少个位置，768 表示每个位置有多少个特征坐标；两者不是同一种计数。",
    detail: <ReferenceDetail
      explanation="序列张量可以想成 197 行、768 列：每一行是一枚 Token 的表示，每一列是某个特征坐标。Patch Token 与 [CLS] Token 都占一行。"
      steps={[
        { title: "197 行", text: "196 个 Patch 位置，加上 1 个 [CLS] 位置。" },
        { title: "768 列", text: "每个 Token 的嵌入宽度，即 hidden size。" },
        { title: "进入 Encoder", text: "各 Block 保持该序列长度和宽度，同时更新向量内容。" },
      ]}
      note="仅适用于当前 ViT-B/16 示例；改变图像分辨率、Patch 尺寸或骨干宽度都会改变形状。"
    />,
    related: ["vit-b16", "token-sequence", "encoder-block"],
    source: <>L2P §5.2（PDF p. 7）；ViT 架构维度见 <SourceLink href={VIT}>原论文的模型配置</SourceLink>。</>,
  },
  {
    id: "encoder-block", page: "P2", name: "Transformer Encoder / Block", english: "Transformer encoder block",
    definition: "由自注意力与前馈网络等子层组成的重复计算单元；整条 Token 序列会依次通过多个 Block。",
    role: "P2 追踪表示怎样逐层更新，P3 再打开其中一个 Block 查看具体运算。",
    confusion: "Encoder 是多层 Block 的堆叠；单个 Block 只是其中一层，不等同于完整 ViT。",
    detail: <ReferenceDetail
      explanation="一层通常先计算自注意力，让每个位置读取其他位置，再用逐位置的前馈网络加工特征。层与层之间按顺序串接；ViT-B/16 的典型配置使用 12 个 Encoder Block。"
      steps={[
        { title: "输入整条序列", text: "N 个位置、D 维向量作为一个整体进入 Block。" },
        { title: "注意力交换信息", text: "序列中不同位置的内容影响各自新的表示。" },
        { title: "前馈网络继续变换", text: "每个位置再独立加工特征，结果交给下一层。" },
      ]}
      note="Block 的标准部件是架构背景；L2P 的贡献不在于重新提出 Transformer Encoder。"
    />,
    related: ["vit", "token-sequence", "classification-head", "layer-normalization", "self-attention", "ffn"],
    source: <>ViT 原论文 §3.1（<SourceLink href={VIT}>论文原文</SourceLink>）；Transformer 基础结构见 <SourceLink href={TRANSFORMER}>Attention Is All You Need</SourceLink>。</>,
  },
  {
    id: "classification-head", page: "P2", name: "分类头", english: "Classification head",
    definition: "接收模型读出的图像特征，并将其映射成各候选类别分数的输出层。",
    role: "标准 ViT 通常把末层 [CLS] 特征交给分类头；L2P 后续改用 Prompt 位置的汇聚特征。",
    confusion: "分类头负责把特征变成类别分数；它不负责生成图像 Token，也不等于 Encoder。",
    detail: <ReferenceDetail
      explanation="分类头是任务相关的最后映射。若标签有 C 类，它会为读入的特征计算 C 个 Logit，再由预测规则选出类别。不同方法可以选择不同的特征进入同一类读出层。"
      steps={[
        { title: "特征输入", text: "标准 ViT 示例使用最后一层的 [CLS] 表示。" },
        { title: "类别映射", text: "输出层为每个类别生成一个分数。" },
        { title: "读取预测", text: "从候选类别分数中选出模型认为最匹配的一类。" },
      ]}
      note="P2 展示普通 ViT 的基础读出；L2P 的 Prompt 条件分类路径会在 P6 按论文实际公式展开。"
    />,
    related: ["cls-token", "encoder-block", "vit"],
    source: <>ViT 原论文 §3.1（<SourceLink href={VIT}>论文原文</SourceLink>）；L2P 分类表示见 §4.2（PDF p. 5）。</>,
  },
];
