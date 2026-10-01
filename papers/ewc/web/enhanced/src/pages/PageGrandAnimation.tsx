import { useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import type { AnchorId, GrandAnimationStateId, RuntimeObjectId } from "../contracts/ids";
import { useReferenceApi } from "../shared/reference/ReferenceProvider";
import "../styles/page10.css";

type PhaseId = "task-a" | "consolidation" | "task-b" | "continual";
type SceneId = "overview" | "data" | "forward" | "probability" | "backward" | "update" | "compression" | "boundary" | "posterior" | "laplace" | "return" | "anchor" | "fisher" | "memory" | "task-b" | "objective" | "gradient" | "loop";
type MathId = "probability" | "posterior" | "laplace" | "fisher" | "objective" | "gradient";
type ReviewLink = { page: "page-03-bayes" | "page-04-laplace" | "page-05-fisher" | "page-06-ewc-objective" | "page-07-lifecycle"; anchor: AnchorId; label: string };
type AnimationState = {
  id: GrandAnimationStateId;
  title: string;
  short: string;
  phase: PhaseId;
  task: string;
  camera: string;
  annotation: string;
  why: string;
  scene: SceneId;
  focus: RuntimeObjectId[];
  math?: MathId;
  checkpoint?: boolean;
  review?: ReviewLink;
};

const STATES: AnimationState[] = [
  { id: "overview", title: "从一套模型开始", short: "全局视图", phase: "task-a", task: "TASK A → B → C", camera: "WORLD VIEW", annotation: "跟随同一个模型从 Task A 开始训练，观察旧任务信息怎样被保存，并在 Task B 中继续影响参数更新。", why: "先建立全局坐标：训练时间始终从左向右推进，旧任务状态留在下方的 Memory Rail。", scene: "overview", focus: [], checkpoint: true },
  { id: "task-a-data", title: "Task A 数据进入模型", short: "数据到达", phase: "task-a", task: "TASK A", camera: "RUNTIME VIEW", annotation: "Task A 的数据被分成 batch 与 sample，送入当前模型；此时模型仍使用同一组可训练参数 θ。", why: "输入样本进入网络，才开始一次普通的训练计算。", scene: "data", focus: ["task-a-data", "neural-network"], checkpoint: false },
  { id: "first-forward", title: "Forward 计算输出", short: "Forward", phase: "task-a", task: "TASK A", camera: "NETWORK FOCUS", annotation: "Forward 使用当前参数计算输出；参数参与计算，但此时还没有被更新。", why: "网络逐层把输入转换为 logits，层参数在这一步只参与运算。", scene: "forward", focus: ["neural-network", "model-logits"] },
  { id: "probability-loss", title: "概率连接到 Task Loss", short: "Probability / Loss", phase: "task-a", task: "TASK A", camera: "OUTPUT NODE FOCUS", annotation: "Softmax 把 logits 转成类别概率。正确类别的概率进入负对数损失，再汇总为 Task A 的 Loss。", why: "这一条概率链提供了后续反向传播所需的训练目标。", scene: "probability", focus: ["model-logits", "prediction-probabilities", "task-a-loss"], math: "probability", checkpoint: true },
  { id: "backward", title: "Backward 计算梯度", short: "Backward", phase: "task-a", task: "TASK A", camera: "RUNTIME VIEW", annotation: "梯度从 Loss 沿网络向回传播，并为每个有参数的层产生对应的参数梯度。", why: "Backward 计算每个参数应该怎样改变；它本身还不执行参数更新。", scene: "backward", focus: ["task-a-loss", "task-a-gradient", "neural-network"] },
  { id: "optimizer-update", title: "Optimizer 更新参数", short: "Update", phase: "task-a", task: "TASK A", camera: "PARAMETER FOCUS", annotation: "Backward 已得到梯度。真正让当前参数发生变化的是 optimizer.step()。", why: "梯度提供更新方向，Optimizer 根据它移动当前参数 θ。", scene: "update", focus: ["task-a-gradient", "optimizer", "current-parameters"] },
  { id: "task-a-compression", title: "重复训练直到 Task A 完成", short: "训练压缩", phase: "task-a", task: "TASK A", camera: "WORLD VIEW", annotation: "熟悉的 batch → loss → backward → update 循环被压缩展示，模型逐步到达 Task A 的训练结果 θ_A*。", why: "真实训练包含许多 iteration；整合动画只保留一次循环的结构，再压缩重复过程。", scene: "compression", focus: ["task-a-data", "task-a-loss", "optimizer", "current-parameters"] },
  { id: "task-a-boundary", title: "Task A 到达边界", short: "Task A Boundary", phase: "consolidation", task: "TASK A · BOUNDARY", camera: "RUNTIME VIEW", annotation: "Task A 已经训练完成。接下来不再降低 Task A Loss，而要记录后续训练可能破坏哪些参数状态。", why: "θ_A* 告诉我们 Task A 在哪里结束，却没有告诉我们附近哪些参数方向敏感。", scene: "boundary", focus: ["current-parameters", "task-a-data"], checkpoint: true, review: { page: "page-07-lifecycle", anchor: "task-boundary", label: "回顾 Page 7 · Task Boundary" } },
  { id: "posterior-view", title: "从参数点转向 Posterior", short: "Posterior", phase: "consolidation", task: "MATHEMATICAL VIEW", camera: "SEMANTIC ZOOM", annotation: "θ_A* 是一个参数点；Posterior 描述观察 Task A 数据之后，附近哪些参数状态仍然合理。", why: "完整 Posterior 仍然很复杂。这是解释模型状态的数学视图，不表示程序显式保存了完整分布。", scene: "posterior", focus: ["task-a-data", "current-parameters"], math: "posterior", checkpoint: true, review: { page: "page-03-bayes", anchor: "prior-likelihood-posterior", label: "回顾 Page 3 · Posterior" } },
  { id: "laplace-view", title: "在解附近做局部近似", short: "Laplace", phase: "consolidation", task: "MATHEMATICAL VIEW", camera: "SEMANTIC ZOOM · LOCAL", annotation: "Laplace Approximation 用 θ_A* 附近的局部 Gaussian 描述复杂 Posterior 的形状。", why: "局部近似把参数偏移与局部曲率联系起来；下一步需要可计算的敏感性近似。", scene: "laplace", focus: ["current-parameters", "task-a-anchor"], math: "laplace", checkpoint: true, review: { page: "page-04-laplace", anchor: "laplace-local-view", label: "回顾 Page 4 · Laplace" } },
  { id: "return-runtime", title: "回到真实 Runtime", short: "返回 Runtime", phase: "consolidation", task: "TASK A · CONSOLIDATION", camera: "RUNTIME VIEW", annotation: "Posterior 与 Gaussian 是解释层。现在回到实际执行：EWC 需要可计算、可保存的局部敏感性近似。", why: "Mathematical View 收起后，同一个模型和参数对象仍在原来的训练流程中。", scene: "return", focus: ["neural-network", "current-parameters", "task-a-data"], review: { page: "page-05-fisher", anchor: "fisher-estimation", label: "前往 Page 5 · Fisher" } },
  { id: "save-anchor", title: "保存固定 Anchor", short: "Save Anchor", phase: "consolidation", task: "TASK A · CONSOLIDATION", camera: "PARAMETER + MEMORY FOCUS", annotation: "Anchor 是 Task A 结束时参数的固定快照。后续 Current Parameters 会变化，快照保持不变。", why: "比较当前 θ 与固定的 θ_A*，才能表示后续学习偏离旧任务解的距离。", scene: "anchor", focus: ["current-parameters", "task-a-anchor", "persistent-memory"], review: { page: "page-07-lifecycle", anchor: "task-boundary", label: "回顾 Page 7 · 保存时点" } },
  { id: "fisher-estimation", title: "固定参数，估计 Fisher", short: "Fisher", phase: "consolidation", task: "TASK A · FISHER ESTIMATION", camera: "RUNTIME VIEW", annotation: "估计时参数保持固定，Backward 计算 log-likelihood 梯度并累积平方；optimizer.step() 不执行。", why: "Fisher 提供可计算的局部敏感性近似，并按参数位置与网络层对齐。", scene: "fisher", focus: ["task-a-data", "neural-network", "task-a-fisher", "persistent-memory"], math: "fisher", checkpoint: true, review: { page: "page-05-fisher", anchor: "fisher-estimation", label: "回顾 Page 5 · Fisher 估计" } },
  { id: "task-a-consolidated", title: "Task A 状态进入 Memory Rail", short: "Store S_A", phase: "consolidation", task: "PERSISTENT MEMORY", camera: "MEMORY FOCUS", annotation: "Task A 留下两类长期信息：结束时的参数位置 θ_A*，以及各参数附近的 Fisher 敏感性近似 F_A。", why: "它们组合成教学状态 S_A=(θ_A*,F_A)，供后续任务使用；原始 Task A 数据不需要进入 Task B 的 batch。", scene: "memory", focus: ["task-a-anchor", "task-a-fisher", "task-state-a", "persistent-memory"], checkpoint: true, review: { page: "page-07-lifecycle", anchor: "task-a-to-b-to-c", label: "回顾 Page 7 · A → B → C" } },
  { id: "task-b-arrives", title: "Task B 从旧参数继续", short: "Task B arrives", phase: "task-b", task: "TASK B", camera: "TRACK → TASK B", annotation: "Task B 使用新的数据 D_B，但同一个模型从 Task A 训练得到的参数状态继续学习。", why: "旧任务约束来自保存的 S_A；Task B 的 batch 仍只来自当前任务数据。", scene: "task-b", focus: ["task-b-data", "neural-network", "task-b-loss", "persistent-memory"] },
  { id: "ewc-objective", title: "组装 Task B 的 EWC 目标", short: "EWC Objective", phase: "task-b", task: "TASK B · EWC OBJECTIVE", camera: "RUNTIME + MEMORY FOCUS", annotation: "Task B Loss 与 Fisher 加权的旧任务参数约束合并。F_A,i 逐参数变化，λ 缩放整体约束。", why: "新任务目标来自 L_B；旧任务的 Anchor 与 Fisher 来自 Memory Rail 中的 S_A。", scene: "objective", focus: ["task-b-loss", "current-parameters", "task-a-anchor", "task-a-fisher", "ewc-penalty", "persistent-memory"], math: "objective", checkpoint: true, review: { page: "page-06-ewc-objective", anchor: "ewc-objective", label: "回顾 Page 6 · EWC Objective" } },
  { id: "combined-gradient", title: "两路梯度在 Junction 汇合", short: "Gradient Junction", phase: "task-b", task: "TASK B · OPTIMIZATION", camera: "GRADIENT JUNCTION FOCUS", annotation: "EWC 不冻结参数。Task B Gradient 与 EWC Gradient 汇合成 Total Gradient，再交给 Optimizer 更新当前 θ。", why: "EWC 改变 Optimizer 接收的 Total Gradient，而不是替换 Optimizer。", scene: "gradient", focus: ["task-b-gradient", "ewc-gradient", "total-gradient", "optimizer", "current-parameters"], math: "gradient", checkpoint: true, review: { page: "page-06-ewc-objective", anchor: "gradient-junction", label: "回顾 Page 6 · Gradient Junction" } },
  { id: "continual-loop", title: "保存 Task B，再进入 Task C", short: "Continual Loop", phase: "continual", task: "TASK B → C", camera: "WORLD VIEW", annotation: "Task B 完成后，保存 θ_B* 并估计 F_B，形成 S_B。Task C 到来时，旧任务状态继续为当前训练提供约束。", why: "Train → Consolidate → Store → Learn under old-task constraints → Repeat。", scene: "loop", focus: ["task-state-a", "persistent-memory", "current-parameters", "task-b-data"], checkpoint: true, review: { page: "page-07-lifecycle", anchor: "task-a-to-b-to-c", label: "回顾 Page 7 · 生命周期" } },
];

const PHASES: { id: PhaseId; title: string; sub: string; first: number; last: number }[] = [
  { id: "task-a", title: "TASK A", sub: "Training", first: 0, last: 6 },
  { id: "consolidation", title: "CONSOLIDATION", sub: "Boundary · Math · Memory", first: 7, last: 13 },
  { id: "task-b", title: "TASK B", sub: "With EWC", first: 14, last: 16 },
  { id: "continual", title: "CONTINUAL LOOP", sub: "Repeat", first: 17, last: 17 },
];

const OBJECT_INFO: Record<RuntimeObjectId, { title: string; badge: string; body: string; detail: string }> = {
  "task-a-data": { title: "Task A data · D_A", badge: "CURRENT DATA", body: "Task A 的样本和 batch 进入当前网络。", detail: "数据由输入 x 与目标 y 组成。Task A 结束前，数据仍用于任务训练，也在设计规定的 Fisher 估计路径中提供样本。" },
  "task-a-batch": { title: "Task A batch", badge: "BATCH", body: "一个 batch 含有多个训练样本。", detail: "Batch 用于一次前向、Loss 与梯度计算。图中只展示代表性样本，不代表固定 batch size。" },
  "neural-network": { title: "共享模型 · f_θ", badge: "RUNTIME OBJECT", body: "Task A 与后续任务继续使用同一个模型。", detail: "CNN-like 网络只是展示数据流、参数和梯度的教学载体。EWC 不依赖 CNN；参数按层分组呈现，数学粒度仍是逐参数。" },
  "model-logits": { title: "Logits · z", badge: "NETWORK OUTPUT", body: "最后一层输出的未归一化类别分数。", detail: "Softmax 把 logits 转换为类别概率 p_θ(y|x)。" },
  "prediction-probabilities": { title: "类别概率 · p_θ(y|x)", badge: "PROBABILITY", body: "模型对给定输入 x 的类别预测概率。", detail: "正确类别概率进入负对数似然，形成当前任务的训练 Loss。" },
  "task-a-loss": { title: "Task A Loss · L_A", badge: "TASK OBJECTIVE", body: "Task A 的数据与模型预测共同产生当前任务 Loss。", detail: "Loss 的梯度随后通过 Backward 传回模型参数。" },
  "task-a-gradient": { title: "Task A Gradient", badge: "BACKWARD SIGNAL", body: "Loss 对模型参数的导数。", detail: "梯度指示局部更新方向。参数更新要等 Optimizer 执行 step。" },
  optimizer: { title: "Optimizer", badge: "UPDATE RULE", body: "读取 Total Gradient 并更新当前参数。", detail: "普通训练时它使用 Task Loss Gradient；EWC 训练时接收 Task B 与 EWC 合并后的 Total Gradient。Fisher 估计期间 optimizer.step() 关闭。" },
  "current-parameters": { title: "当前参数 · θ", badge: "TRAINABLE STATE", body: "当前网络实际使用、并在训练中继续变化的参数。", detail: "Task A 结束时得到 θ_A*。进入 Task B 后，当前参数从这个位置继续优化；θ_A* 的固定快照留在 Memory Rail。" },
  "task-a-anchor": { title: "固定 Anchor · θ_A*", badge: "STORED SNAPSHOT", body: "Task A 完成时复制并保留的参数快照。", detail: "Anchor 后续保持固定。EWC 比较当前 θ 与 θ_A*，形成旧任务约束中的参数偏移。" },
  "task-a-fisher": { title: "Fisher · F_A", badge: "SENSITIVITY APPROXIMATION", body: "由固定参数下的 log-likelihood 梯度平方估计。", detail: "Fisher 与参数按位置对齐。它提供可计算的局部敏感性近似，不是精确参数重要性，也不等于精确 Posterior Hessian。" },
  "fisher-estimator": { title: "Fisher estimation", badge: "CONSOLIDATION PASS", body: "计算梯度并累积平方，但不更新参数。", detail: "Parameters FIXED · Gradient ENABLED · Optimizer OFF。此页面按设计显示估计流程，不把 Fisher pass 画成普通训练。" },
  "persistent-memory": { title: "Persistent Memory Rail", badge: "STORED TASK STATE", body: "旧任务的 Anchor 与 Fisher 跨越时间轴持续保留。", detail: "Task A 后保存 S_A=(θ_A*,F_A)。Task B 读取它构造约束；Task B 边界再加入 S_B。S_A 是教学状态表示。" },
  "task-state-a": { title: "Task A state · S_A", badge: "θ_A* + F_A", body: "由固定 Anchor 与 Fisher 组成的教学状态。", detail: "S_A=(θ_A*,F_A) 将 Task A 结束位置和参数局部敏感性近似带入后续任务。" },
  "task-b-data": { title: "Task B data · D_B", badge: "CURRENT DATA", body: "Task B 的新 batch 驱动当前任务 Loss。", detail: "Task B 不重新初始化模型，也不把 Task A 原始样本作为当前 batch；旧任务信息通过 Anchor 与 Fisher 进入约束。" },
  "task-b-loss": { title: "Task B Loss · L_B", badge: "NEW TASK OBJECTIVE", body: "由 Task B 数据与当前预测产生。", detail: "L_B 与旧任务 EWC penalty 相加，组成 L_total。" },
  "ewc-penalty": { title: "EWC penalty · Ω_A", badge: "OLD TASK CONSTRAINT", body: "对偏离 Task A Anchor 的变化施加 Fisher 加权代价。", detail: "逐参数项由 F_A,i(θ_i−θ_A,i*)² 构成，λ 缩放整体约束。它限制更新方向，不冻结参数。" },
  "task-b-gradient": { title: "Task B Gradient · g_B", badge: "NEW TASK SIGNAL", body: "Task B Loss 对当前参数产生的梯度。", detail: "它推动参数改善新任务目标。" },
  "ewc-gradient": { title: "EWC Gradient · g_EWC", badge: "RESTORING SIGNAL", body: "EWC penalty 对偏离旧任务 Anchor 的变化产生梯度。", detail: "其强度逐参数受 F_A,i 和全局 λ 调节，并与 g_B 汇合。" },
  "total-gradient": { title: "Total Gradient", badge: "JUNCTION OUTPUT", body: "Task B Gradient 与 EWC Gradient 的和。", detail: "Optimizer 根据 Total Gradient 更新当前参数 θ。EWC 改变其输入梯度，不替换优化器。" },
  "replay-buffer": { title: "Replay buffer", badge: "ATARI SYSTEM DETAIL", body: "Replay buffer 属于 Page 9 的 Atari 系统。", detail: "Page 10 只整合 EWC 的通用顺序训练机制，不展开 Atari 实验设置。" },
  "task-recognition": { title: "Task recognition", badge: "ATARI SYSTEM DETAIL", body: "任务识别属于 Page 9 的 Atari 系统。", detail: "Page 10 不重新展示 Atari 结果或系统扩展。" },
  "task-specific-modulation": { title: "Task-specific modulation", badge: "ATARI SYSTEM DETAIL", body: "任务专属参数机制属于 Page 9 的 Atari 系统。", detail: "Grand Animation 保持为一般的 EWC 生命周期整合，不混入实验机制。" },
};

const STATE_INDEX = new Map(STATES.map((state, index) => [state.id, index]));

function useFirstVisitHelp() {
  const [open, setOpen] = useState(() => {
    try { return typeof window !== "undefined" && window.localStorage.getItem("ewc-grand-animation-help-seen") !== "1"; }
    catch { return true; }
  });
  const close = () => {
    try { window.localStorage.setItem("ewc-grand-animation-help-seen", "1"); } catch { /* storage may be unavailable */ }
    setOpen(false);
  };
  return { open, close };
}

function FormulaToken({ objectId, children, onSelect }: { objectId: RuntimeObjectId; children: ReactNode; onSelect: (id: RuntimeObjectId) => void }) {
  return <button type="button" className="p10-formula-token" onClick={() => onSelect(objectId)}>{children}</button>;
}

function Formula({ kind, expanded, onSelect }: { kind: MathId; expanded: boolean; onSelect: (id: RuntimeObjectId) => void }) {
  const token = (id: RuntimeObjectId, label: ReactNode) => <FormulaToken key={`${id}-${String(label)}`} objectId={id} onSelect={onSelect}>{label}</FormulaToken>;
  if (kind === "probability") return <div className="p10-formula-line" aria-label="类别概率转化为任务损失">{token("prediction-probabilities", <>p<sub>θ</sub>(y | x)</>)} <span>→</span> {token("task-a-loss", expanded ? <>−log p<sub>θ</sub>(y | x) → L<sub>A</sub>(θ)</> : <>−log p<sub>θ</sub>(y | x)</>)}</div>;
  if (kind === "posterior") return <div className="p10-formula-line" aria-label="Task A Posterior"><span className="p10-formula-static">p(θ | D<sub>A</sub>)</span> <span>∝</span> {token("task-a-data", <>p(D<sub>A</sub> | θ)</>)} <span>·</span> <span className="p10-formula-static">p(θ)</span>{expanded && <span className="p10-formula-tail"> / p(D<sub>A</sub>)</span>}</div>;
  if (kind === "laplace") return <div className="p10-formula-line" aria-label="Laplace 局部 Gaussian 近似"><span className="p10-formula-static">p(θ | D<sub>A</sub>) ≈ 𝒩(</span>{token("current-parameters", <>θ<sub>A</sub>*</>)}<span className="p10-formula-static">, Σ<sub>A</sub>)</span>{expanded && <span className="p10-formula-tail"> · θ<sub>A</sub>* 周围的局部二次形状</span>}</div>;
  if (kind === "fisher") return <div className="p10-formula-line" aria-label="Fisher 对数似然梯度平方的样本均值">{token("task-a-fisher", <>F<sub>A,i</sub></>)} <span>≈</span> <span className="p10-formula-static">{expanded ? <>1/N Σ<sub>n</sub> ( ∂ log p<sub>θA*</sub>(y<sub>n</sub>|x<sub>n</sub>) / ∂θ<sub>i</sub> )<sup>2</sup></> : <>1/N Σ<sub>n</sub> g<sub>i,n</sub><sup>2</sup></>}</span></div>;
  if (kind === "objective") return <div className="p10-formula-line" aria-label="EWC total objective"><span className="p10-formula-static">L<sub>total</sub> =</span> {token("task-b-loss", <>L<sub>B</sub></>)} <span>+</span> {expanded ? <span className="p10-expanded-penalty">{token("ewc-penalty", "λ")}<span>/2 Σ<sub>i</sub></span> {token("task-a-fisher", <>F<sub>A,i</sub></>)} <span>(</span>{token("current-parameters", <>θ<sub>i</sub></>)}<span>−</span>{token("task-a-anchor", <>θ<sub>A,i</sub>*</>)}<span>)<sup>2</sup></span></span> : token("ewc-penalty", <>λ Ω<sub>A</sub></>)}</div>;
  return <div className="p10-formula-line" aria-label="EWC combined gradient">{token("total-gradient", <>∇L<sub>total</sub></>)} <span>=</span> {token("task-b-gradient", <>g<sub>B</sub></>)} <span>+</span> {token("ewc-gradient", expanded ? <>λ F<sub>A</sub> ⊙ (θ − θ<sub>A</sub>*)</> : <>g<sub>EWC</sub></>)}</div>;
}

function WorkbenchNode({ id, label, eyebrow, active, selected, onSelect, shape = "node" }: { id: RuntimeObjectId; label: ReactNode; eyebrow?: string; active: boolean; selected: boolean; onSelect: (id: RuntimeObjectId) => void; shape?: "node" | "data" | "parameter" }) {
  return <button type="button" className={`p10-node p10-node--${shape} ${active ? "is-active" : ""} ${selected ? "is-linked" : ""}`} onClick={() => onSelect(id)} aria-pressed={selected}>
    {eyebrow && <span className="p10-node__eyebrow">{eyebrow}</span>}<b>{label}</b><span className="p10-node__inspect">Inspect</span>
  </button>;
}

function LayerBlocks({ focus, selected, onSelect, includeFisher = false, includeAnchor = false }: { focus: RuntimeObjectId[]; selected?: RuntimeObjectId; onSelect: (id: RuntimeObjectId) => void; includeFisher?: boolean; includeAnchor?: boolean }) {
  const layers = [
    { layer: "Conv 1", id: "task-a-anchor" as const, param: "θ¹ · W¹", shape: "[64, 1, 3, 3]", fisher: "F¹" },
    { layer: "Conv 2", id: "task-a-anchor" as const, param: "θ² · W²", shape: "[64, 64, 3, 3]", fisher: "F²" },
    { layer: "FC", id: "task-a-anchor" as const, param: "θ³ · W³", shape: "[256, 3136]", fisher: "F³" },
    { layer: "Output", id: "task-a-anchor" as const, param: "θ⁴ · W⁴", shape: "[10, 256]", fisher: "F⁴" },
  ];
  return <div className="p10-layer-grid" aria-label="按网络层分组的代表性参数与 Fisher">
    {layers.map((layer, index) => <div className={`p10-layer-card ${focus.includes("current-parameters") ? "is-current" : ""}`} key={layer.layer}>
      <div className="p10-layer-card__heading"><span>{layer.layer}</span><small>θ<sup>{index + 1}</sup></small></div>
      <button type="button" className={`p10-parameter-cells ${selected === "current-parameters" ? "is-linked" : ""}`} onClick={() => onSelect("current-parameters")} aria-label={`${layer.param}，查看当前参数`}>
        <span>░</span><span>▒</span><span>▓</span><span>▒</span><span>░</span><span>▓</span><span>▒</span><span>░</span><span>▒</span><span>▓</span><span>░</span><span>▒</span>
      </button>
      <div className="p10-layer-card__shape">{layer.param} <span>{layer.shape}</span></div>
      {includeAnchor && <button type="button" className={`p10-layer-card__anchor ${selected === "task-a-anchor" ? "is-linked" : ""}`} onClick={() => onSelect("task-a-anchor")}>θ<sub>A</sub>* snapshot</button>}
      {includeFisher && <button type="button" className={`p10-layer-card__fisher ${selected === "task-a-fisher" ? "is-linked" : ""}`} onClick={() => onSelect("task-a-fisher")}><span>{layer.fisher}</span><small>aligned Fisher</small></button>}
    </div>)}
  </div>;
}

function RuntimeTrack({ state, selected, onSelect }: { state: AnimationState; selected?: RuntimeObjectId; onSelect: (id: RuntimeObjectId) => void }) {
  const taskIsB = state.phase === "task-b" || state.phase === "continual";
  const active = (id: RuntimeObjectId) => state.focus.includes(id);
  const nodes: { id: RuntimeObjectId; label: ReactNode; eyebrow: string; shape?: "node" | "data" | "parameter" }[] = [
    { id: taskIsB ? "task-b-data" : "task-a-data", label: <>D<sub>{taskIsB ? "B" : "A"}</sub> · Batch</>, eyebrow: "CURRENT TASK", shape: "data" },
    { id: "neural-network", label: <>Network f<sub>θ</sub></>, eyebrow: "SHARED MODEL" },
    { id: "model-logits", label: <>logits z</>, eyebrow: "OUTPUT" },
    { id: "prediction-probabilities", label: <>p<sub>θ</sub>(y | x)</>, eyebrow: "SOFTMAX" },
    { id: taskIsB ? "task-b-loss" : "task-a-loss", label: <>L<sub>{taskIsB ? "B" : "A"}</sub></>, eyebrow: "TASK LOSS" },
    { id: taskIsB ? "task-b-gradient" : "task-a-gradient", label: <>∇L<sub>{taskIsB ? "B" : "A"}</sub></>, eyebrow: "BACKWARD" },
    { id: "optimizer", label: "Optimizer", eyebrow: "UPDATE" },
    { id: "current-parameters", label: <>θ<sub>current</sub></>, eyebrow: "PARAMETERS", shape: "parameter" },
  ];
  return <div className={`p10-runtime-track ${state.scene === "backward" || state.scene === "gradient" ? "is-reverse" : ""}`} aria-label="同一套模型的运行时数据流">
    {nodes.map((node, index) => <div className="p10-runtime-track__step" key={`${node.id}-${index}`}>
      <WorkbenchNode {...node} active={active(node.id)} selected={selected === node.id} onSelect={onSelect} />
      {index < nodes.length - 1 && <span className={`p10-flow-arrow ${state.scene === "backward" || state.scene === "gradient" ? "is-reverse" : ""}`} aria-hidden="true">{state.scene === "backward" || state.scene === "gradient" ? "←" : "→"}</span>}
    </div>)}
    {state.scene === "fisher" && <div className="p10-fisher-pass"><b>FISHER ESTIMATION</b><span>Backward ✓</span><span>optimizer.step() OFF</span><span>θ FIXED</span></div>}
  </div>;
}

function GaussianSketch() {
  return <div className="p10-gaussian" role="img" aria-label="参数空间中的局部 Gaussian 等高线，中心是 θA 星号">
    <svg viewBox="0 0 320 170" aria-hidden="true"><ellipse cx="160" cy="86" rx="126" ry="61" /><ellipse cx="160" cy="86" rx="91" ry="43" /><ellipse cx="160" cy="86" rx="55" ry="25" /><path d="M160 13V151M25 86H295" /><circle cx="160" cy="86" r="5" /></svg>
    <span className="p10-gaussian__center">θ<sub>A</sub>*</span><span className="p10-gaussian__label">local region · Mathematical View</span>
  </div>;
}

function SceneVisual({ state, selected, onSelect }: { state: AnimationState; selected?: RuntimeObjectId; onSelect: (id: RuntimeObjectId) => void }) {
  const focus = state.focus;
  if (state.scene === "overview" || state.scene === "loop") return <div className={`p10-scene p10-scene--overview ${state.scene === "loop" ? "p10-scene--completed" : ""}`}>
    <div className="p10-world-ribbon"><span>{state.scene === "loop" ? "FULL WORLD VIEW · EWC LIFECYCLE COMPLETE" : "WORLD VIEW · TRAINING TIME MOVES LEFT → RIGHT"}</span><small>one shared model · persistent task memory</small></div>
    <div className="p10-task-world">
      <div className="p10-task-world__task is-task-a"><span>01</span><b>Task A</b><small>ordinary training</small><i>D<sub>A</sub> → θ<sub>A</sub>*</i></div>
      <div className="p10-task-world__boundary"><span>CONSOLIDATE A</span><b>Anchor + Fisher</b><i>S<sub>A</sub></i></div>
      <div className="p10-task-world__task is-task-b"><span>02</span><b>Task B</b><small>new loss + old constraint</small><i>L<sub>B</sub> + Ω<sub>A</sub></i></div>
      <div className="p10-task-world__boundary"><span>CONSOLIDATE B</span><b>Anchor + Fisher</b><i>S<sub>B</sub></i></div>
      <div className="p10-task-world__task is-task-c"><span>03</span><b>Task C</b><small>continual loop</small><i>L<sub>C</sub> + Ω<sub>A</sub> + Ω<sub>B</sub></i></div>
    </div>
    <div className="p10-memory-rail"><span className="p10-memory-rail__label">PERSISTENT MEMORY RAIL</span><button className="p10-memory-chip is-ready" onClick={() => onSelect("task-state-a")}>S<sub>A</sub> · θ<sub>A</sub>* + F<sub>A</sub></button>{state.scene === "loop" ? <button className="p10-memory-chip is-ready is-task-b" onClick={() => onSelect("persistent-memory")}>S<sub>B</sub> · θ<sub>B</sub>* + F<sub>B</sub></button> : <div className="p10-memory-chip is-pending">S<sub>B</sub> · after Task B</div>}</div>
    {state.scene === "loop" && <div className="p10-world-complete">Train <i>→</i> Consolidate <i>→</i> Store <i>→</i> Learn under old-task constraints <i>→</i> Repeat · Task C reads S<sub>A</sub> and S<sub>B</sub>.</div>}
  </div>;
  if (state.scene === "posterior" || state.scene === "laplace") return <div className={`p10-scene p10-scene--math ${state.scene === "posterior" ? "is-posterior" : "is-laplace"}`}>
    <div className="p10-math-view-banner"><b>MATHEMATICAL VIEW</b><span>解释当前训练状态 · 程序不会显式构造完整 Posterior</span></div>
    <div className="p10-semantic-transition"><div className="p10-point-object"><b>θ<sub>A</sub>*</b><small>one parameter point</small></div><span className="p10-semantic-arrow">→</span>{state.scene === "posterior" ? <div className="p10-posterior-cloud"><span>附近哪些参数状态仍合理？</span><b>Posterior</b><i>full local shape</i></div> : <><div className="p10-posterior-cloud is-quiet"><b>full Posterior</b></div><span className="p10-semantic-arrow">→</span><GaussianSketch /></>}</div>
    {state.scene === "laplace" && <div className="p10-math-legend"><span>中心 θ<sub>A</sub>*</span><span>宽度 Σ<sub>A</sub></span><span>局部精度 Σ<sub>A</sub><sup>−1</sup></span></div>}
  </div>;
  if (state.scene === "data") return <div className="p10-scene p10-scene--data">
    <div className="p10-sample-stack"><b>D<sub>A</sub></b><small>Task A Dataset</small><div className="p10-sample-pixels" aria-label="教学用样本像素示意"><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /></div><span>x<sub>n</sub>, y<sub>n</sub> → batch</span></div><span className="p10-large-arrow">→</span><WorkbenchNode id="neural-network" label={<>Network f<sub>θ</sub></>} eyebrow="SAME MODEL" active selected={selected === "neural-network"} onSelect={onSelect} /><div className="p10-sample-note"><b>Inspect the input</b><span>Dataset → Batch → Sample</span><button type="button" onClick={() => onSelect("task-a-batch")}>View a representative batch</button></div>
  </div>;
  if (state.scene === "forward" || state.scene === "backward" || state.scene === "update" || state.scene === "compression" || state.scene === "return") return <div className={`p10-scene p10-scene--training p10-scene--${state.scene}`}>
    <div className="p10-network-detail"><div className="p10-network-detail__heading"><b>TEACHING CNN-LIKE CLASSIFIER</b><span>illustrative carrier · EWC does not require a CNN</span></div><div className="p10-network-layers"><span>Input x</span><i>→</i><button onClick={() => onSelect("current-parameters")}>Conv 1<small>θ¹</small></button><i>→</i><span>ReLU</span><i>→</i><button onClick={() => onSelect("current-parameters")}>Conv 2<small>θ²</small></button><i>→</i><span>Pool · Flatten</span><i>→</i><button onClick={() => onSelect("current-parameters")}>FC<small>θ³</small></button><i>→</i><button onClick={() => onSelect("current-parameters")}>Output<small>θ⁴</small></button></div></div>
    <LayerBlocks focus={focus} selected={selected} onSelect={onSelect} />
    <div className="p10-training-status"><span>FORWARD <b>{state.scene === "forward" ? "COMPUTING" : "DONE"}</b></span><span>BACKWARD <b>{state.scene === "backward" ? "GRADIENT FLOWS ←" : state.scene === "update" ? "GRADIENT READY" : "—"}</b></span><span>OPTIMIZER <b>{state.scene === "update" ? "STEP() · UPDATE θ" : "WAITING"}</b></span><span>PARAMETERS <b>{state.scene === "update" ? "θ 0.412 → 0.420" : "SHAPE HELD FIXED"}</b></span>{state.scene === "update" && <small>Representative parameter · illustrative mechanism values</small>}</div>
    {state.scene === "compression" && <div className="p10-iteration-pulse"><b>batch 1 → update</b><span>·</span><b>batch 2 → update</b><span>·</span><b>batch 3 → update</b><span className="p10-pulse-dots">···</span><strong>θ<sup>(0)</sup> → θ<sub>A</sub>*</strong></div>}
  </div>;
  if (state.scene === "probability") return <div className="p10-scene p10-scene--probability"><div className="p10-probability-chain"><div className="p10-score-card"><span>LOGITS</span><b>z = [1.3, 0.4, −0.2]</b><small>un-normalized scores</small></div><span className="p10-large-arrow">→</span><div className="p10-softmax-card"><span>SOFTMAX</span><b>[0.61, 0.25, 0.14]</b><small>class probabilities</small></div><span className="p10-large-arrow">→</span><div className="p10-loss-card"><span>NEGATIVE LOG PROBABILITY</span><b>−log p<sub>θ</sub>(y|x)</b><small>correct label → L<sub>A</sub></small></div></div><div className="p10-probability-note"><b>Optional likelihood expansion</b><span>p(D<sub>A</sub>|θ) = ∏<sub>n</sub> p<sub>θ</sub>(y<sub>n</sub>|x<sub>n</sub>)</span><small>Each correct-label probability contributes to the batch loss.</small></div></div>;
  if (state.scene === "boundary") return <div className="p10-scene p10-scene--boundary"><div className="p10-boundary-stamp"><span>TASK A ENDED</span><b>θ = θ<sub>A</sub>*</b><small>optimizer stopped</small></div><div className="p10-boundary-question"><span className="p10-muted-answer">θ<sub>A</sub>* tells us <b>where Task A ended</b></span><div className="p10-question-divider" /><span>θ<sub>A</sub>* does not tell us <b>which nearby directions are sensitive</b></span></div><div className="p10-boundary-timeline"><span>Task A training</span><i /><b>CONSOLIDATION</b><i /><span>Task B</span></div></div>;
  if (state.scene === "anchor") return <div className="p10-scene p10-scene--anchor"><div className="p10-anchor-clone"><div><span>CURRENT θ</span><b>Trainable</b><small>continues changing</small></div><span className="p10-clone-branch">clone →</span><div className="p10-anchor-copy"><span>STORED θ<sub>A</sub>*</span><b>Fixed snapshot</b><small>remains unchanged</small></div></div><LayerBlocks focus={focus} selected={selected} onSelect={onSelect} includeAnchor /></div>;
  if (state.scene === "fisher") return <div className="p10-scene p10-scene--fisher"><div className="p10-fisher-flow"><div className="p10-fixed-sample"><span>Task A sample</span><b>(x<sub>n</sub>, y<sub>n</sub>)</b></div><span>→</span><div className="p10-fixed-sample"><span>log-likelihood</span><b>log p<sub>θA*</sub>(y|x)</b></div><span>→</span><div className="p10-fisher-square"><span>gradient</span><b>g<sub>i</sub> → g<sub>i</sub><sup>2</sup></b></div><span>→</span><div className="p10-fisher-accumulator"><span>ACCUMULATOR</span><b>Σ g<sub>i</sub><sup>2</sup> / N</b></div></div><LayerBlocks focus={focus} selected={selected} onSelect={onSelect} includeFisher /><div className="p10-fisher-accuracy"><b>PARAMETERS FIXED</b><span>·</span><b>GRADIENT ENABLED</b><span>·</span><b>optimizer.step() OFF</b></div></div>;
  if (state.scene === "memory") return <div className="p10-scene p10-scene--memory"><div className="p10-memory-explain"><span>Task A data leaves the active pipeline</span><b>θ<sub>A</sub>* + F<sub>A</sub> → S<sub>A</sub></b><small>Anchor position + parameter-wise local sensitivity</small></div><div className="p10-memory-rail p10-memory-rail--focused"><span className="p10-memory-rail__label">PERSISTENT TASK MEMORY</span><button className="p10-memory-chip is-ready" onClick={() => onSelect("task-state-a")}>S<sub>A</sub> <small>θ<sub>A</sub>* · F<sub>A</sub></small></button><button className="p10-memory-chip is-pending" onClick={() => onSelect("persistent-memory")}>S<sub>B</sub> <small>pending</small></button></div></div>;
  if (state.scene === "task-b") return <div className="p10-scene p10-scene--task-b"><div className="p10-task-b-path"><div className="p10-task-b-source"><span>TASK B DATA</span><b>D<sub>B</sub></b><small>new batch</small></div><span className="p10-large-arrow">→</span><div className="p10-task-b-model"><span>SAME MODEL</span><b>θ<sub>start,B</sub> = θ<sub>A</sub>*</b><small>continue, do not reinitialize</small></div><span className="p10-large-arrow">→</span><div className="p10-task-b-loss"><span>TASK B OBJECTIVE</span><b>L<sub>B</sub></b><small>new task data</small></div></div><div className="p10-memory-rail"><span className="p10-memory-rail__label">READ OLD STATE</span><button className="p10-memory-chip is-ready" onClick={() => onSelect("persistent-memory")}>S<sub>A</sub> → θ<sub>A</sub>* + F<sub>A</sub></button></div></div>;
  if (state.scene === "objective") return <div className="p10-scene p10-scene--objective"><div className="p10-objective-inputs"><button type="button" className="p10-objective-input is-new" onClick={() => onSelect("task-b-loss")}><span>NEW TASK</span><b>L<sub>B</sub></b><small>from D<sub>B</sub></small></button><span className="p10-objective-plus">+</span><button type="button" className="p10-objective-input is-old" onClick={() => onSelect("ewc-penalty")}><span>OLD TASK CONSTRAINT</span><b>λ Ω<sub>A</sub></b><small>from S<sub>A</sub>=(θ<sub>A</sub>*,F<sub>A</sub>)</small></button><span className="p10-objective-equals">=</span><div className="p10-objective-result">L<sub>total</sub></div></div><div className="p10-objective-mapping"><span><b>F<sub>A,i</sub></b> parameter-specific weight</span><span><b>λ</b> global constraint scale</span><span><b>θ<sub>A</sub>*</b> fixed stored anchor</span><span><b>θ</b> current trainable value</span></div><LayerBlocks focus={focus} selected={selected} onSelect={onSelect} includeFisher includeAnchor /></div>;
  if (state.scene === "gradient") return <div className="p10-scene p10-scene--gradient"><div className="p10-gradient-junction"><button type="button" className="p10-gradient-input is-task" onClick={() => onSelect("task-b-gradient")}><span>TASK B</span><b>g<sub>B</sub></b><small>−0.20</small></button><span className="p10-junction-branch">↘</span><div className="p10-junction-core">Σ</div><span className="p10-junction-branch">↗</span><button type="button" className="p10-gradient-input is-ewc" onClick={() => onSelect("ewc-gradient")}><span>EWC</span><b>g<sub>EWC</sub></b><small>+0.16</small></button><span className="p10-junction-arrow">→</span><button type="button" className="p10-gradient-total" onClick={() => onSelect("total-gradient")}><span>TOTAL GRADIENT</span><b>g<sub>total</sub></b><small>−0.04</small></button><span className="p10-junction-arrow">→</span><button type="button" className="p10-gradient-optimizer" onClick={() => onSelect("optimizer")}><span>optimizer.step()</span><b>θ updates</b></button></div><div className="p10-parameter-inspectors"><article><b>High-Fisher parameter · θ<sub>i</sub></b><dl><div><dt>Task-B gradient</dt><dd>−0.20</dd></div><div><dt>Anchor displacement</dt><dd>+0.10</dd></div><div><dt>F<sub>A,i</sub> · λ</dt><dd>8.0 · 0.2</dd></div><div><dt>EWC gradient</dt><dd>+0.16</dd></div><div><dt>Total gradient</dt><dd>−0.04</dd></div></dl></article><article><b>Low-Fisher parameter · θ<sub>j</sub></b><dl><div><dt>Task-B gradient</dt><dd>−0.20</dd></div><div><dt>EWC gradient</dt><dd>+0.01</dd></div><div><dt>Total gradient</dt><dd>−0.19</dd></div></dl></article></div><div className="p10-gradient-example"><small>Representative mechanism values only · not measured experiment results</small></div></div>;
  return <div className="p10-scene p10-scene--loop" />;
}

function FirstVisitOverlay({ onStart }: { onStart: () => void }) {
  const startRef = useRef<HTMLButtonElement>(null);
  useEffect(() => { startRef.current?.focus(); }, []);
  return <div className="p10-overlay" role="dialog" aria-modal="true" aria-labelledby="p10-help-title" onKeyDown={(event) => { if (event.key === "Tab") { event.preventDefault(); startRef.current?.focus(); } }}>
    <div className="p10-overlay-card p10-overlay-card--help"><span className="p10-overline">FIRST VISIT · GRAND ANIMATION</span><h2 id="p10-help-title">How to explore</h2><div className="p10-help-grid">
      <div><kbd>Next</kbd><span>跟随推荐学习顺序</span></div><div><kbd>Back</kbd><span>返回上一个关键状态</span></div><div><kbd>Inspect</kbd><span>点击参数、公式或计算节点查看细节</span></div><div><kbd>Mini-map</kbd><span>查看当前位于完整 EWC 生命周期的哪里</span></div>
    </div><p>公式和运行时对象可以相互定位；按 Esc 退出检查或数学视图。</p><button ref={startRef} type="button" className="p10-primary-button" onClick={onStart}>Start the walkthrough <span>→</span></button></div>
  </div>;
}

function FinalSummary({ onReplay, onExplore }: { onReplay: () => void; onExplore: () => void }) {
  const replayRef = useRef<HTMLButtonElement>(null);
  const exploreRef = useRef<HTMLButtonElement>(null);
  useEffect(() => { replayRef.current?.focus(); }, []);
  return <div className="p10-overlay p10-overlay--final" role="dialog" aria-modal="true" aria-labelledby="p10-final-title" onKeyDown={(event) => {
    if (event.key === "Tab" && event.shiftKey && document.activeElement === replayRef.current) { event.preventDefault(); exploreRef.current?.focus(); }
    else if (event.key === "Tab" && !event.shiftKey && document.activeElement === exploreRef.current) { event.preventDefault(); replayRef.current?.focus(); }
  }}>
    <div className="p10-final-card"><span className="p10-overline">FULL EWC EXECUTION · COMPLETE</span><h2 id="p10-final-title">旧任务约束，进入了同一个优化过程</h2>
      <div className="p10-final-loop" aria-label="EWC 生命周期闭环">Train <i>→</i> Consolidate <i>→</i> Store <i>→</i> Learn under old-task constraints <i>→</i> Repeat</div>
      <ol className="p10-takeaways"><li><b>01</b><span>EWC 不保存完整旧任务行为，而是保存旧任务结束时的参数位置与局部敏感性近似。</span></li><li><b>02</b><span>Fisher-weighted quadratic penalty 把这些旧任务信息重新加入后续任务的优化目标。</span></li><li><b>03</b><span>EWC 最终改变的不是 Optimizer 本身，而是 Optimizer 接收到的 Total Gradient。</span></li></ol>
      <div className="p10-final-actions"><button ref={replayRef} type="button" className="p10-primary-button" onClick={onReplay}>Replay Full Execution <span>↻</span></button><button ref={exploreRef} type="button" className="p10-secondary-button" onClick={onExplore}>Explore Timeline <span>→</span></button></div>
    </div>
  </div>;
}

export function PageGrandAnimation() {
  const api = useReferenceApi();
  const help = useFirstVisitHelp();
  const activeIndex = useMemo(() => api.activeAnimationStateId ? STATE_INDEX.get(api.activeAnimationStateId) ?? 0 : 0, [api.activeAnimationStateId]);
  const state = STATES[activeIndex];
  const [furthestIndex, setFurthestIndex] = useState(activeIndex);
  const [playing, setPlaying] = useState(false);
  const [replayMode, setReplayMode] = useState(false);
  const [expandedFormula, setExpandedFormula] = useState(false);
  const [activeObject, setActiveObject] = useState<RuntimeObjectId | undefined>(api.activeRuntimeObject);
  const [announcement, setAnnouncement] = useState("");
  const selectedInfo = activeObject ? OBJECT_INFO[activeObject] : undefined;
  const unlockedThrough = Math.max(furthestIndex, activeIndex);
  const pageIsFinal = state.id === "continual-loop";

  const goTo = (index: number, options: { replay?: boolean } = {}) => {
    const clampedIndex = Math.max(0, Math.min(STATES.length - 1, index));
    const next = STATES[clampedIndex];
    api.openReference({ animationStateId: next.id });
    api.setActiveRuntimeObject(undefined);
    setActiveObject(undefined);
    setFurthestIndex((furthest) => Math.max(furthest, clampedIndex));
    setExpandedFormula(false);
    setAnnouncement(`状态 ${clampedIndex + 1}：${next.title}`);
    if (!options.replay) { setPlaying(false); setReplayMode(false); }
  };

  const selectObject = (id: RuntimeObjectId) => {
    const next = activeObject === id ? undefined : id;
    api.setActiveRuntimeObject(next);
    setActiveObject(next);
  };

  const dismissInspector = () => { setActiveObject(undefined); api.setActiveRuntimeObject(undefined); };
  const startReplay = () => { setPlaying(true); setReplayMode(true); goTo(0, { replay: true }); };
  const exploreTimeline = () => { setPlaying(false); setReplayMode(false); dismissInspector(); goTo(0); };

  useEffect(() => { setActiveObject(api.activeRuntimeObject); }, [api.activeRuntimeObject]);
  useEffect(() => {
    if (!playing) return;
    const nextIndex = Math.min(activeIndex + 1, STATES.length - 1);
    const nextState = STATES[nextIndex];
    const timer = window.setTimeout(() => {
      api.openReference({ animationStateId: nextState.id });
      setFurthestIndex((furthest) => Math.max(furthest, nextIndex));
      setAnnouncement(`状态 ${nextIndex + 1}：${nextState.title}`);
      if (nextIndex === STATES.length - 1) { setPlaying(false); setReplayMode(false); }
      else if (!replayMode && nextState.checkpoint) setPlaying(false);
    }, replayMode ? 820 : 1450);
    return () => window.clearTimeout(timer);
  }, [playing, replayMode, activeIndex, api]);

  useEffect(() => {
    if (api.currentPage !== "page-10-grand-animation") return;
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (api.hubOpen) return;
      if (help.open || (pageIsFinal && !replayMode)) return;
      if (target?.closest("input, textarea, select, [contenteditable='true']")) return;
      if (event.key === "ArrowLeft") { event.preventDefault(); goTo(activeIndex - 1); }
      else if (event.key === "ArrowRight") { event.preventDefault(); goTo(activeIndex + 1); }
      else if (event.code === "Space" && !target?.closest("button, a")) { event.preventDefault(); setPlaying((value) => !value); }
      else if (event.key === "Escape") {
        if (activeObject) dismissInspector();
        else if (state.scene === "posterior" || state.scene === "laplace") goTo(10);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [api.currentPage, api.hubOpen, activeIndex, activeObject, state.scene, help.open, pageIsFinal, replayMode]);

  const setRuntimeObject = (id?: RuntimeObjectId) => { api.setActiveRuntimeObject(id); setActiveObject(id); };
  const activePhase = PHASES.find((phase) => phase.id === state.phase)!;

  return <article className="p10-page" id="grand-animation" aria-label="EWC Grand Animation">
    <header className="p10-header">
      <div className="p10-header__top"><button type="button" className="p10-back-page" onClick={() => api.navigatePage("page-09-atari")} aria-label="返回 Page 9">← <span>Page 9</span></button><span className="p10-header__label">EWC <i>/</i> FINAL INTEGRATION</span><span className="p10-header__spacer" /></div>
      <div className="p10-header__main"><h1>让 EWC 真正运行起来</h1><p>从 Task A 普通训练开始，跟随同一个模型经历 Consolidation、Fisher Estimation、Task B 的 EWC 约束训练，并继续进入后续任务。</p></div>
    </header>

    <section className="p10-recall" aria-label="已学知识回顾"><div className="p10-recall__chain"><span>Probability</span><i>→</i><span>Bayes</span><i>→</i><span>Laplace</span><i>→</i><span>Fisher</span><i>→</i><span>EWC Objective</span><i>→</i><span>Lifecycle</span></div><p>这一次，它们不再是独立章节，而是同一个训练过程中的不同阶段。</p></section>

    <nav className="p10-phase-bar" aria-label="EWC 生命周期阶段">
      <span className="p10-phase-bar__label">PHASE</span>{PHASES.map((phase, index) => <div className={`p10-phase ${phase.id === state.phase ? "is-active" : ""} ${unlockedThrough >= phase.first ? "is-unlocked" : ""}`} key={phase.id}>
        <button type="button" aria-current={phase.id === state.phase ? "step" : undefined} disabled={unlockedThrough < phase.first} onClick={() => goTo(phase.first)}><b>{phase.title}</b><small>{phase.sub}</small></button>{index < PHASES.length - 1 && <span className="p10-phase-arrow" aria-hidden="true">→</span>}
      </div>)}</nav>

    <section className="p10-execution" aria-labelledby="p10-current-title">
      <div className="p10-execution__heading"><div><span className="p10-overline">STATE {String(activeIndex + 1).padStart(2, "0")} / 18 <i>·</i> {activePhase.title}</span><h2 id="p10-current-title">{state.title}</h2></div><div className="p10-execution__context"><span>{state.task}</span><small>{state.camera}</small></div></div>
      <div className="p10-execution__annotation" aria-live="polite"><span className="p10-annotation-icon" aria-hidden="true">●</span><p>{state.annotation}<small>{state.why}</small></p>{state.review && <button type="button" className="p10-review-link" onClick={() => api.openReference({ pageId: state.review!.page, anchorId: state.review!.anchor })}>{state.review.label} ↗</button>}</div>

      <div className={`p10-camera p10-camera--${state.scene}`}>
        <div className="p10-camera__chrome"><span><i /> CAMERA · {state.camera}</span><span>{state.scene === "posterior" || state.scene === "laplace" ? "MATHEMATICAL VIEW" : "EWC RUNTIME"}</span></div>
        {state.math && <div className="p10-math-rail"><div className="p10-math-rail__head"><span>FORMULA <small>· LINKED TO RUNTIME OBJECTS</small></span><button type="button" aria-pressed={expandedFormula} onClick={() => setExpandedFormula((value) => !value)}>{expandedFormula ? "Compact" : "Expand"}</button></div><Formula kind={state.math} expanded={expandedFormula} onSelect={selectObject} /></div>}
        {state.scene !== "posterior" && state.scene !== "laplace" && state.scene !== "overview" && state.scene !== "loop" && <RuntimeTrack state={state} selected={activeObject} onSelect={selectObject} />}
        <SceneVisual key={state.id} state={state} selected={activeObject} onSelect={selectObject} />
        {selectedInfo && <aside className="p10-inspector" aria-live="polite" aria-label="对象检查器"><div className="p10-inspector__head"><span>{selectedInfo.badge}</span><button type="button" onClick={dismissInspector} aria-label="关闭对象检查器">×</button></div><h3>{selectedInfo.title}</h3><p>{selectedInfo.body}</p><p className="p10-inspector__detail">{selectedInfo.detail}</p></aside>}
        <div className="p10-camera__footer"><span>点击带有 Inspect 标记的运行时对象，或公式中的符号，查看它对应的执行状态。</span><button type="button" onClick={() => setRuntimeObject(state.focus[0])} disabled={!state.focus.length}>Inspect current focus ↗</button></div>
      </div>
    </section>

    <footer className="p10-controls" aria-label="Grand Animation 播放与导航控制">
      <div className="p10-controls__top"><div className="p10-breadcrumb"><span>EWC Runtime</span><i>/</i><span>{state.task}</span><i>/</i><b>{state.short}</b>{(state.scene === "posterior" || state.scene === "laplace") && <button type="button" onClick={() => goTo(10)}>Return to Runtime ↑</button>}</div><div className="p10-playback"><button type="button" className="p10-transport" onClick={() => goTo(activeIndex - 1)} disabled={activeIndex === 0} aria-label="Back">← <span>Back</span></button><button type="button" className="p10-play-button" onClick={() => { if (pageIsFinal && !playing) startReplay(); else setPlaying((value) => !value); }} aria-label={playing ? "Pause" : "Play"}>{playing ? "Ⅱ" : "▶"}<span>{playing ? "Pause" : "Play"}</span></button><button type="button" className="p10-transport p10-transport--next" onClick={() => goTo(activeIndex + 1)} disabled={pageIsFinal} aria-label="Next"><span>Next</span> →</button></div><div className="p10-state-count">{String(activeIndex + 1).padStart(2, "0")} <i>/</i> 18</div></div>
      <div className="p10-controls__maps"><div className="p10-step-map"><span>STEP</span><div role="group" aria-label="18 个 Grand Animation 状态">{STATES.map((item, index) => <button key={item.id} type="button" className={`${index === activeIndex ? "is-current" : ""} ${index <= unlockedThrough ? "is-unlocked" : ""} ${item.checkpoint ? "is-checkpoint" : ""}`} disabled={index > unlockedThrough} aria-label={`状态 ${index + 1}：${item.title}`} aria-current={index === activeIndex ? "step" : undefined} onClick={() => goTo(index)} />)}</div></div><div className="p10-minimap"><span>MINI-MAP</span><div>{PHASES.map((phase) => <button type="button" key={phase.id} disabled={unlockedThrough < phase.first} className={`${phase.id === state.phase ? "is-current" : ""} ${unlockedThrough >= phase.first ? "is-unlocked" : ""}`} onClick={() => goTo(phase.first)}><i aria-hidden="true" /><span>{phase.title}</span></button>)}</div></div></div>
      <span className="p10-sr-only" aria-live="polite">{announcement}</span>
    </footer>

    {help.open && <FirstVisitOverlay onStart={help.close} />}
    {pageIsFinal && !help.open && !playing && <FinalSummary onReplay={startReplay} onExplore={exploreTimeline} />}
  </article>;
}
