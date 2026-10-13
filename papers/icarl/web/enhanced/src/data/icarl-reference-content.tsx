import type { ReferenceItem, TermDefinition } from "../shared/core/reference/types";
import type { ReactNode } from "react";

export const ICARL_TERMS: Record<string, TermDefinition> = {
  "class-incremental-learning": {
    id: "class-incremental-learning", label: "Class-Incremental Learning", fullName: "Class-Incremental Learning",
    definition: "类别按批次逐步加入；每个阶段都要在迄今见过的全部类别中直接预测。",
    paperRole: "本文的任务设定，类别批次到达时学习器继续更新。", confusion: "它不是每个阶段只在当前批次内部分类。", sourceKind: "论文设定",
  },
  "catastrophic-forgetting": {
    id: "catastrophic-forgetting", label: "灾难性遗忘", definition: "学习新类别后，模型对先前类别的识别能力可能明显下降。",
    paperRole: "解释为什么只用新类数据更新并不足以满足持续识别要求。", sourceKind: "论文背景",
  },
  representation: {
    id: "representation", label: "特征表示", definition: "由共享特征映射 φΘ(x) 产生、供后续节点或分类规则使用的向量。",
    paperRole: "iCaRL 在学习新类别时持续更新共享表示。", confusion: "表示向量不是类别标签，也不是最终预测。", sourceKind: "论文方法",
  },
  "feature-extractor": {
    id: "feature-extractor", label: "特征提取器", definition: "把输入图像映射为特征表示的共享网络部分。",
    paperRole: "其参数 Θ 随增量训练更新，并用于编码新图像与保留的 exemplars。", sourceKind: "论文方法",
  },
  prototype: {
    id: "prototype", label: "类别原型", definition: "当前表示空间中由某类样本特征均值构成并归一化的类别代表向量。",
    paperRole: "iCaRL 从保留 exemplars 重算原型用于最终分类。", confusion: "prototype 不是经梯度单独训练的 head 权重。", sourceKind: "论文方法",
  },
  "nearest-mean-of-exemplars": {
    id: "nearest-mean-of-exemplars", label: "最近 exemplar 均值分类", fullName: "Nearest-Mean-of-Exemplars (NME)",
    definition: "将查询特征与各类别 exemplar 均值比较，选择距离最近的类别。",
    paperRole: "这是 iCaRL 的最终分类规则；训练 head 主要提供表示学习信号。", sourceKind: "论文方法",
  },
  exemplar: {
    id: "exemplar", label: "exemplar", definition: "从某类训练图像中选出并长期保留的真实样本。",
    paperRole: "受限记忆用于旧类回放，也用于近似重建类别均值。", confusion: "exemplar 是原始样本，不是其特征向量。", sourceKind: "论文方法",
  },
  "memory-budget": {
    id: "memory-budget", label: "记忆预算 K", definition: "exemplar memory 可保留的图像总数上限。",
    paperRole: "类别数 t 增加时，每类配额按 m = floor(K/t) 缩小。", confusion: "K 限制 exemplar 图像数，不包括随类别增加的输出权重。", sourceKind: "论文方法",
  },
  herding: {
    id: "herding", label: "Herding", definition: "迭代选择样本，使已选前缀均值尽量接近完整类别的归一化均值目标。",
    paperRole: "首次构造某类 exemplar 列表时形成有序选择结果。", confusion: "后续配额缩小时保留列表前缀，不会重用不可访问的完整旧类数据重跑选择。", sourceKind: "论文方法",
  },
  "prefix-mean": {
    id: "prefix-mean", label: "prefix 均值", definition: "按顺序选出的前 k 个 exemplar 特征的均值。",
    paperRole: "Herding 在每一步比较加入候选后的 prefix 均值与完整类目标。", sourceKind: "论文方法",
  },
  "response-snapshot-q": {
    id: "response-snapshot-q", label: "响应快照 Q", definition: "参数更新前，当前网络对训练集 D 中每个样本在旧类别输出节点上的响应。",
    paperRole: "Q 为旧节点提供本轮蒸馏目标，训练结束后可释放。", confusion: "Q 是本轮临时目标，不是持久保存的第二套旧网络。", sourceKind: "论文方法",
    formula: <span>q<sub>ij</sub> = g<sub>j</sub>(x<sub>i</sub>; Θ<sub>before</sub>)</span>,
  },
  distillation: {
    id: "distillation", label: "蒸馏", definition: "用更新前旧类别节点的响应约束更新后的网络，帮助保留旧类输出行为。",
    paperRole: "旧节点在 D 上拟合快照 Q；新节点则拟合类别指示标签。", sourceKind: "论文方法",
  },
  "soft-target": {
    id: "soft-target", label: "soft target", definition: "由更新前模型响应提供的连续目标值。",
    paperRole: "iCaRL 将其用于旧输出节点；各 sigmoid 节点彼此独立，目标不要求加总为 1。", confusion: "它不是多类 softmax 概率分布。", sourceKind: "论文方法",
    formula: <span>r<sub>ij</sub> = q<sub>ij</sub>　（旧节点）</span>,
  },
  "hard-target": {
    id: "hard-target", label: "hard target", fullName: "Class-Indicator Target",
    definition: "由样本真实类别构造的 0/1 指示目标。",
    paperRole: "仅用于本轮新增类别对应的输出节点；匹配类别为 1，其它新类节点为 0。", confusion: "旧类别节点使用 Q 的软响应，不用真实旧标签替换 Q。", sourceKind: "论文方法",
    formula: <span>r<sub>ij</sub> = 𝟙[y<sub>i</sub> = c<sub>j</sub>]　（新节点）</span>,
  },
  "binary-cross-entropy": {
    id: "binary-cross-entropy", label: "二元交叉熵", fullName: "Binary Cross-Entropy (BCE)",
    definition: "对单个 sigmoid 输出及其目标计算的二元分类损失。",
    paperRole: "旧节点使用 Q 的 soft target，新节点使用 hard label；六个独立节点分别计算，再共同形成样本损失。", sourceKind: "论文方法",
    formula: <span>ℓ<sub>BCE</sub>(r,g) = −[r log g + (1−r) log(1−g)]</span>,
  },
  ncm: {
    id: "ncm", label: "NCM", fullName: "Nearest Class Mean",
    definition: "按各类别的均值向量做最近均值分类。",
    paperRole: "论文实验以访问全部历史数据的 NCM 作为均值近似诊断参照；它不受 iCaRL 相同的记忆预算约束。", sourceKind: "论文实验参照",
  },
  "average-incremental-accuracy": {
    id: "average-incremental-accuracy", label: "平均增量准确率", fullName: "Average Incremental Accuracy",
    definition: "对增量过程各评估阶段的多类准确率进行汇总的指标。",
    paperRole: "Figure 2 按截至该阶段已学习的类别数展示结果。", confusion: "不同基准使用的评估协议与指标需分别读取，不能把所有结果当作同一协议。", sourceKind: "论文指标",
  },
};

type HubTermCopy = { title: string; summary: string; role?: string; confusion?: string; extra?: ReactNode; tags: string[] };
const HUB_TERM_COPY: Record<string, HubTermCopy> = {
  "class-incremental-learning": { title: "Class-Incremental Learning", summary: "Classes arrive in batches; after each stage, the model predicts among all classes seen so far.", role: "Defines the task setting studied by iCaRL.", confusion: "The model is not told which class batch a test sample came from.", tags: ["class incremental", "task setting"] },
  "catastrophic-forgetting": { title: "Catastrophic Forgetting", summary: "Learning new classes can substantially reduce performance on previously learned classes.", role: "Motivates retaining old-class recognition during incremental updates.", tags: ["forgetting", "continual learning"] },
  representation: { title: "Feature Representation", summary: "A vector produced by the shared feature mapping φΘ(x) and used by later output nodes or the classifier.", role: "iCaRL continues to update the shared representation as new classes arrive.", confusion: "A feature representation is neither a class label nor the final prediction.", tags: ["features", "representation learning"] },
  "feature-extractor": { title: "Feature Extractor", summary: "The shared network component that maps an input image to a feature representation.", role: "Its parameters Θ are updated during incremental training and encode new images and retained exemplars.", tags: ["shared network", "mapping"] },
  prototype: { title: "Class Prototype", summary: "A normalized mean vector of a class's sample features in the current representation space.", role: "iCaRL recomputes prototypes from retained exemplars for final classification.", confusion: "A prototype is not a classifier weight trained independently by gradient descent.", tags: ["class mean", "classifier"] },
  "nearest-mean-of-exemplars": { title: "Nearest-Mean-of-Exemplars (NME)", summary: "Classify a query by comparing its feature with each class's exemplar mean and choosing the nearest one.", role: "This is iCaRL's final classification rule; the training head mainly supplies a representation-learning signal.", tags: ["nearest mean", "prediction"] },
  exemplar: { title: "Exemplar", summary: "A real training image selected and retained as a representative sample of its class.", role: "The bounded memory supports old-class replay and approximates class means.", confusion: "An exemplar is an input image, not its feature vector.", tags: ["memory", "retained sample"] },
  "memory-budget": { title: "Memory Budget K", summary: "The upper bound on the total number of images retained in exemplar memory.", role: "As t classes have been seen, the per-class quota is reduced to m = floor(K/t).", confusion: "K bounds retained exemplar images; it does not include output weights that grow with class count.", tags: ["quota", "bounded memory"] },
  herding: { title: "Herding", summary: "An iterative selection rule that keeps each selected-prefix mean close to the normalized mean of the full class.", role: "Builds an ordered exemplar list when a class first arrives.", confusion: "When the quota later shrinks, the list is truncated; unavailable full historical data is not used to rerun selection.", tags: ["sample selection", "ordered memory"] },
  "prefix-mean": { title: "Prefix Mean", summary: "The mean feature vector of the first k exemplars in the selected order.", role: "At each Herding step, candidate additions are compared by how closely the new prefix mean matches the full-class target.", tags: ["Herding", "mean"] },
  "response-snapshot-q": { title: "Response Snapshot Q", summary: "参数更新前，三旧类节点对 D 中每张图的 sigmoid 响应；每行按样本身份保存。", role: "Q 是本轮临时蒸馏目标，训练后可释放。", confusion: "Q 不是持久保存的第二个旧网络。", extra: <div className="icarl-reference-formula" role="math" aria-label="q i j equals old model output g j of x i at parameters before update">q<sub>ij</sub> = g<sub>j</sub>(x<sub>i</sub>; Θ<sub>before</sub>)</div>, tags: ["old responses", "training target"] },
  distillation: { title: "Knowledge Distillation", summary: "用更新前旧类输出约束当前模型，使旧节点尽量延续此前的响应。", role: "D 中的旧、新样本都保留对应 Q 行；Q 为旧节点提供 soft target，新节点读取类别标签。", extra: <p className="icarl-reference-callout">教师响应只复制到旧节点目标；教师模型本身不会取代当前待更新的 Student。</p>, tags: ["old classes", "training"] },
  "soft-target": { title: "Soft Target", summary: "旧模型在更新前给出的连续 sigmoid 响应，是旧输出节点的目标值。", role: "从同一张输入图的 Q 行取对应旧节点列 qᵢⱼ。", confusion: "旧节点之间不做 softmax 归一化，三个值不需要加总为 1。", extra: <div className="icarl-reference-formula" role="math" aria-label="the old node target r i j equals q i j">r<sub>ij</sub> = q<sub>ij</sub>　（旧节点）</div>, tags: ["response", "sigmoid"] },
  "hard-target": { title: "Hard Target", summary: "从样本真实类别构造的新类输出节点 0/1 标签。", role: "对 D/E/F 节点分别判断标签是否相等；命中的节点为 1，其余新节点为 0。", confusion: "节点是否属于旧类决定读取 Q 还是 label，与当前输入图片是旧 exemplar 还是新图无关。", extra: <div className="icarl-reference-formula" role="math" aria-label="the new node target r i j is the indicator that y i equals class c j">r<sub>ij</sub> = 𝟙[y<sub>i</sub> = c<sub>j</sub>]　（新节点）</div>, tags: ["class label", "training target"] },
  "binary-cross-entropy": { title: "Binary Cross-Entropy (BCE)", summary: "对单个独立 sigmoid 输出 g 与目标 r 计算的损失。", role: "旧节点的 r 来自 Q；新节点的 r 来自类别标签。每个节点先算一项 BCE，再在样本内相加。", extra: <>
    <div className="icarl-reference-formula" role="math" aria-label="BCE loss formula">ℓ<sub>BCE</sub>(r,g) = −[r log g + (1−r) log(1−g)]</div>
    <p><b>变量</b> · r ∈ [0,1] 是目标；g = σ(a) ∈ (0,1) 是该输出节点的 sigmoid 响应；a 是 logit。</p>
    <div className="icarl-reference-formula" role="math" aria-label="the local derivative equals g minus r">∂ℓ / ∂a = g − r</div>
    <p><b>目标来源</b> · 旧节点：r=q<sub>ij</sub>，取同一样本的冻结 Q 行；新节点：r=𝟙[y<sub>i</sub>=c<sub>j</sub>]，取真实标签。来源由输出节点的新旧身份决定。</p>
    <p><b>多节点</b> · 每个节点使用独立 sigmoid，不在六类间做 softmax；单样本损失为 ℓ<sub>i</sub>=∑<sub>j=1</sub><sup>t</sup>ℓ<sub>BCE</sub>(r<sub>ij</sub>,g<sub>ij</sub>)。旧节点项和新增节点项共同参与优化。</p>
  </>, tags: ["loss", "sigmoid", "targets"] },
  ncm: { title: "Nearest Class Mean (NCM)", summary: "Classify by selecting the nearest class-mean vector.", role: "The paper uses an all-data NCM reference to diagnose mean approximation; it is not subject to iCaRL's same bounded memory budget.", tags: ["diagnostic reference", "all-data mean"] },
  "average-incremental-accuracy": { title: "Average Incremental Accuracy", summary: "A summary measure of multiclass accuracy across incremental evaluation stages.", role: "Figure 2 plots results by the number of classes seen at each stage.", confusion: "Read each benchmark's protocol and metric separately; results do not all share one evaluation protocol.", tags: ["metric", "Figure 2"] },
};

function TermReferenceContent({ copy }: { copy: HubTermCopy }) {
  return <div>{copy.role ? <p><strong>Role in this paper:</strong> {copy.role}</p> : null}{copy.confusion ? <p><strong>Easy to confuse with:</strong> {copy.confusion}</p> : null}{copy.extra ? <div className="icarl-reference-extra">{copy.extra}</div> : null}</div>;
}

const termReferences: ReferenceItem[] = Object.values(ICARL_TERMS).map((term) => {
  const copy = HUB_TERM_COPY[term.id];
  return {
    id: term.id,
    title: copy.title,
    kind: "term",
    summary: copy.summary,
    content: <TermReferenceContent copy={copy} />,
    tags: copy.tags,
  };
});

const sourceReferences: ReferenceItem[] = [
  {
    id: "icarl-paper", title: "iCaRL: Incremental Classifier and Representation Learning", kind: "evidence",
    summary: "The paper underlying this tutorial, including its method, experimental protocols, ablations, and limitations.",
    content: <p><a href="http://arxiv.org/abs/1611.07725" target="_blank" rel="noreferrer">Open the paper on arXiv</a></p>, tags: ["primary paper", "arXiv"],
  },
  {
    id: "cifar-100-dataset", title: "CIFAR-100 dataset", kind: "dataset",
    summary: "Official dataset description: 100 classes, fine and coarse labels, and its relationship to CIFAR-10.",
    content: <p><a href="https://www.cs.toronto.edu/~kriz/cifar.html" target="_blank" rel="noreferrer">CIFAR-10 and CIFAR-100 datasets · University of Toronto</a></p>, tags: ["dataset background", "official source"],
  },
  {
    id: "ilsvrc-2012-dataset", title: "ImageNet ILSVRC 2012", kind: "dataset",
    summary: "Official challenge description of its image-classification task and 1,000 object categories.",
    content: <p><a href="https://www.image-net.org/challenges/LSVRC/2012/" target="_blank" rel="noreferrer">ILSVRC 2012 · ImageNet</a></p>, tags: ["dataset background", "official source"],
  },
];

export const ICARL_REFERENCE_ITEMS: ReferenceItem[] = [...termReferences, ...sourceReferences];

export type ReferenceOpenEvent = CustomEvent<{ termId: string }>;
export function requestReferenceOpen(termId: string) {
  window.dispatchEvent(new CustomEvent("icarl:open-reference", { detail: { termId } }));
}
