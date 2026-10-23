import type { ReactNode } from "react";
import type { DiagramNodeSpec, DiagramSpec } from "../../foundation/layout/DiagramFlow";
import type { StepNavItem } from "../../compositions/step-nav";

/**
 * Paper-specific teaching figures for the live demo.
 *
 * These specs are scene data, not Kit API: a new paper writes its own figures with
 * the same Foundation primitives (`DiagramFlow`, `StepNav`). Nothing below is a
 * reusable composition, and none of the notation has been checked against the paper
 * PDF — see `docs/reusable-kit.md` before quoting any of it in a tutorial.
 */

/** Inline symbol: italic variables and real subscript markup. */
function Sym({ children }: { children: ReactNode }) {
  return <span className="rk-math">{children}</span>;
}

/** Display formula: MathML, laid out by the browser's math engine. */
function Eq({ label, display = "block", children }: { label: string; display?: "block" | "inline"; children: ReactNode }) {
  return <span className={display === "inline" ? "rk-mathml rk-mathml--inline" : "rk-mathml"}>
    <math display={display} aria-label={label}>{children}</math>
  </span>;
}

const Lold = <Eq display="inline" label="L old"><msub><mi>L</mi><mtext>old</mtext></msub></Eq>;
const Lnew = <Eq display="inline" label="L new"><msub><mi>L</mi><mtext>new</mtext></msub></Eq>;
const xT = <Sym><var>x</var><sub>t</sub></Sym>;
const yT = <Sym><var>y</var><sub>t</sub></Sym>;
const oldHat = <Sym><var>ŷ</var><sub>old</sub></Sym>;
const newHat = <Sym><var>ŷ</var><sub>new</sub></Sym>;
const tOld = <Sym><var>T</var><sub>old</sub></Sym>;
const thetaS = <Eq display="inline" label="theta sub s"><msub><mi>θ</mi><mtext>s</mtext></msub></Eq>;

function node(spec: DiagramNodeSpec): DiagramNodeSpec {
  return spec;
}

/* -------------------------------------------------------------------------- */
/* LwF · one causal graph for the whole mechanism                             */
/* -------------------------------------------------------------------------- */

export const lwfGraph: DiagramSpec = {
  columns: 5,
  zones: [
    { id: "input", label: "输入", from: 1, span: 1 },
    { id: "paths", label: "两条路径", from: 2, span: 1 },
    { id: "outputs", label: "输出与标签", from: 3, span: 1 },
    { id: "compare", label: "比较", from: 4, span: 1 },
    { id: "update", label: "更新", from: 5, span: 1 },
  ],
  nodes: [
    node({ id: "x", column: 1, row: 1, rowSpan: 2, order: 1, role: "input", inputLabel: "xₜ", badge: "INPUT", title: <>当前输入 {xT}</>, meta: "同一批样本送入两条路径" }),
    node({ id: "teacher", column: 2, row: 1, order: 2, role: "frozen", inputLabel: "Teacher 旧模型", badge: "FROZEN", title: "Teacher（旧模型副本）", meta: "本任务内参数不再变化，不接收梯度" }),
    node({ id: "target", column: 3, row: 1, order: 3, role: "target", inputLabel: "旧响应目标", badge: "TARGET", title: <>旧响应目标 {tOld}</>, meta: "student 需要保留的输出" }),
    node({ id: "backbone", column: 2, row: 2, rowSpan: 2, order: 4, role: "trainable", inputLabel: "Student 共享骨干", badge: "TRAINABLE", title: <>Student 共享骨干 <Sym><var>h</var><sub>t</sub></Sym></>, meta: <>属于 {thetaS}；同时服务两个输出头</> }),
    node({ id: "oldOut", column: 3, row: 2, order: 5, role: "trainable", inputLabel: "旧类输出", badge: "PREDICTION", title: <>旧类输出 {oldHat}</>, meta: "与 teacher 目标比较" }),
    node({ id: "newOut", column: 3, row: 3, order: 6, role: "trainable", inputLabel: "新类输出", badge: "PREDICTION", title: <>新类输出 {newHat}</>, meta: "与当前标签比较" }),
    node({ id: "label", column: 3, row: 4, order: 7, role: "label", inputLabel: "当前标签", badge: "LABEL", title: <>当前任务标签 {yT}</>, meta: "只监督新类输出" }),
    node({ id: "lOld", column: 4, row: 1, rowSpan: 2, order: 8, role: "objective", inputLabel: "旧响应损失", badge: "OBJECTIVE", title: <span className="rk-diagram__symbol">{Lold}</span>, meta: "保留旧响应：teacher 目标与旧类输出在这里比较" }),
    node({ id: "lNew", column: 4, row: 4, order: 9, role: "objective", inputLabel: "新任务损失", badge: "OBJECTIVE", title: <span className="rk-diagram__symbol">{Lnew}</span>, meta: "学习当前任务：当前标签与新类输出在这里比较" }),
    node({ id: "update", column: 5, row: 2, rowSpan: 2, order: 10, role: "update", badge: "UPDATE TARGET", title: <>更新 Student 参数 {thetaS}</>, meta: "梯度只写入 student；teacher 保持冻结" }),
  ],
  edges: [
    { id: "x-teacher", from: "x", to: "teacher" },
    { id: "x-backbone", from: "x", to: "backbone", mode: "smooth" },
    { id: "teacher-target", from: "teacher", to: "target" },
    { id: "backbone-oldout", from: "backbone", to: "oldOut", mode: "smooth" },
    { id: "backbone-newout", from: "backbone", to: "newOut", mode: "smooth" },
    { id: "target-lold", from: "target", to: "lOld" },
    { id: "oldout-lold", from: "oldOut", to: "lOld" },
    { id: "newout-lnew", from: "newOut", to: "lNew" },
    { id: "label-lnew", from: "label", to: "lNew" },
    { id: "lold-update", from: "lOld", to: "update", mode: "smooth" },
    { id: "lnew-update", from: "lNew", to: "update", mode: "smooth" },
  ],
  legend: [
    { id: "flow", text: "实线：前向计算", swatch: "solid" },
    { id: "frozen", text: "斜纹 + 虚线框：本任务冻结", swatch: "frozen" },
    { id: "trainable", text: "左侧色条：可训练 / 预测输出", swatch: "trainable" },
    { id: "update", text: "深色节点：参数更新落点", swatch: "update" },
  ],
  note: "只画计算关系：teacher 在本任务内不更新，student 更新完成后才在任务边界成为下一个 teacher。",
};

export type LwfGraphStep = { id: string; title: string; note: string; nodes: string[]; edges: string[] };

export const lwfGraphSteps: LwfGraphStep[] = [
  {
    id: "arrive",
    title: "同一个输入，两条路径同时开始",
    note: "先看冲突：新任务的样本与标签已经到达，而旧模型的响应仍然要被保留。",
    nodes: ["x", "label"],
    edges: ["x-teacher", "x-backbone"],
  },
  {
    id: "teacher",
    title: "Teacher 提供目标，但它不学习",
    note: "teacher 是旧模型的冻结副本：它读同一个输入，产出旧响应目标，本任务内不接收任何梯度。",
    nodes: ["x", "teacher", "target"],
    edges: ["x-teacher", "teacher-target"],
  },
  {
    id: "forward",
    title: "Student 从共享骨干分出两个输出头",
    note: "同一个输入、同一个骨干，旧类输出用于保留行为，新类输出用于学习当前任务。",
    nodes: ["x", "backbone", "oldOut", "newOut", "target"],
    edges: ["x-backbone", "backbone-oldout", "backbone-newout", "teacher-target"],
  },
  {
    id: "loss",
    title: "两次比较各有自己的对象",
    note: "旧类：teacher 目标与 student 旧类输出比较得到 L_old；新类：当前标签与 student 新类输出比较得到 L_new。",
    nodes: ["target", "oldOut", "lOld", "newOut", "label", "lNew"],
    edges: ["target-lold", "oldout-lold", "newout-lnew", "label-lnew"],
  },
  {
    id: "update",
    title: "两条梯度汇入同一个更新对象",
    note: "更新只落在 student 参数上；teacher 仍然冻结，任务结束后 student 才成为下一个 teacher。",
    nodes: ["lOld", "lNew", "update", "backbone"],
    edges: ["lold-update", "lnew-update"],
  },
];

export const lwfNavItems: StepNavItem[] = [
  { id: "arrive", label: "新任务到来", hint: "冲突" },
  { id: "teacher", label: "冻结 teacher", hint: "目标" },
  { id: "forward", label: "同一输入的两路输出", hint: "预测" },
  { id: "loss", label: "形成两个损失", hint: "比较" },
  { id: "update", label: "更新 student", hint: "梯度" },
];

/* -------------------------------------------------------------------------- */
/* LwF · objective composition: two chains, one merge, one update object      */
/* -------------------------------------------------------------------------- */

export const lwfObjectiveGraph: DiagramSpec = {
  columns: 4,
  template: "0.95fr 1.35fr 1.85fr 0.95fr",
  zones: [
    { id: "operands", label: "输入与预测", from: 1, span: 1 },
    { id: "losses", label: "两个目标", from: 2, span: 1 },
    { id: "merge", label: "合成与更新", from: 3, span: 2 },
  ],
  nodes: [
    node({ id: "tOld", column: 1, row: 1, order: 1, role: "target", inputLabel: "T_old", badge: "TARGET", title: <>旧响应目标 {tOld}</>, meta: "teacher 输出" }),
    node({ id: "oOld", column: 1, row: 2, order: 2, role: "trainable", inputLabel: "ŷ_old", badge: "PREDICTION", title: <>旧类输出 {oldHat}</>, meta: "student 输出" }),
    node({ id: "yNew", column: 1, row: 4, order: 3, role: "label", inputLabel: "yₜ", badge: "LABEL", title: <>当前标签 {yT}</>, meta: "真实类别" }),
    node({ id: "oNew", column: 1, row: 5, order: 4, role: "trainable", inputLabel: "ŷ_new", badge: "PREDICTION", title: <>新类输出 {newHat}</>, meta: "student 输出" }),
    node({
      id: "lOld",
      column: 2,
      row: 1,
      rowSpan: 2,
      order: 5,
      role: "objective",
      inputLabel: "L_old",
      badge: "OBJECTIVE · OLD",
      title: <Eq label="L old equals minus the sum from i equals 1 to n of t sub i times log of y-hat sub i">
        <mrow>
          <msub><mi>L</mi><mtext>old</mtext></msub>
          <mo>=</mo>
          <mo>−</mo>
          <munderover><mo>∑</mo><mrow><mi>i</mi><mo>=</mo><mn>1</mn></mrow><mi>n</mi></munderover>
          <msub><mi>t</mi><mi>i</mi></msub>
          <mi>log</mi>
          <msub><mi>ŷ</mi><mi>i</mi></msub>
        </mrow>
      </Eq>,
      meta: "旧类上的响应损失",
    }),
    node({
      id: "lNew",
      column: 2,
      row: 4,
      rowSpan: 2,
      order: 6,
      role: "objective",
      inputLabel: "L_new",
      badge: "OBJECTIVE · NEW",
      title: <Eq label="L new equals minus the sum from i equals 1 to m of t sub i times log of y-hat sub i">
        <mrow>
          <msub><mi>L</mi><mtext>new</mtext></msub>
          <mo>=</mo>
          <mo>−</mo>
          <munderover><mo>∑</mo><mrow><mi>i</mi><mo>=</mo><mn>1</mn></mrow><mi>m</mi></munderover>
          <msub><mi>t</mi><mi>i</mi></msub>
          <mi>log</mi>
          <msub><mi>ŷ</mi><mi>i</mi></msub>
        </mrow>
      </Eq>,
      meta: "新类上的分类损失",
    }),
    node({
      id: "merge",
      column: 3,
      row: 3,
      order: 7,
      role: "objective",
      inputLabel: "合并后的梯度",
      badge: "COMBINED GRADIENT",
      title: <Eq label="the partial derivative of L with respect to theta equals the partial derivative with respect to theta of lambda L old plus one minus lambda L new">
        <mrow>
          <mfrac><mrow><mo>∂</mo><mi>L</mi></mrow><mrow><mo>∂</mo><mi>θ</mi></mrow></mfrac>
          <mo>=</mo>
          <mfrac><mrow><mo>∂</mo></mrow><mrow><mo>∂</mo><mi>θ</mi></mrow></mfrac>
          <mrow>
            <mo>[</mo>
            <mi>λ</mi>
            <msub><mi>L</mi><mtext>old</mtext></msub>
            <mo>+</mo>
            <mo>(</mo>
            <mn>1</mn>
            <mo>−</mo>
            <mi>λ</mi>
            <mo>)</mo>
            <msub><mi>L</mi><mtext>new</mtext></msub>
            <mo>]</mo>
          </mrow>
        </mrow>
      </Eq>,
      meta: "λ 的取值按论文原式；此处只固定结构，不固定数值",
    }),
    node({ id: "params", column: 4, row: 3, order: 8, role: "update", badge: "UPDATE TARGET", title: <>Student 参数 {thetaS}</>, meta: "梯度落点；teacher 不在此更新" }),
  ],
  edges: [
    { id: "target-lold", from: "tOld", to: "lOld" },
    { id: "oldout-lold", from: "oOld", to: "lOld" },
    { id: "label-lnew", from: "yNew", to: "lNew" },
    { id: "newout-lnew", from: "oNew", to: "lNew" },
    { id: "lold-merge", from: "lOld", to: "merge", mode: "smooth" },
    { id: "lnew-merge", from: "lNew", to: "merge", mode: "smooth" },
    { id: "merge-params", from: "merge", to: "params" },
  ],
  legend: [
    { id: "compare", text: "实线：比较与求导", swatch: "solid" },
    { id: "update", text: "深色节点：参数更新落点", swatch: "update" },
  ],
  note: "两个损失各自完成比较后才汇合；teacher 只提供目标，不参与参数更新。",
};

/* -------------------------------------------------------------------------- */
/* EWC · same primitives, a different semantic chain                          */
/* -------------------------------------------------------------------------- */

export const ewcTaskAGraph: DiagramSpec = {
  columns: 3,
  zones: [
    { id: "data", label: "Data", from: 1, span: 1 },
    { id: "params", label: "Trainable state", from: 2, span: 1 },
    { id: "output", label: "Reference produced", from: 3, span: 1 },
  ],
  nodes: [
    node({ id: "taskA", column: 1, row: 1, order: 1, role: "input", inputLabel: "Task A data", badge: "INPUT", title: "Task A data and objective", meta: "this is the only task that exists now" }),
    node({ id: "theta", column: 2, row: 1, order: 2, role: "trainable", inputLabel: "parameters θ", badge: "TRAINABLE", title: <>Trainable parameters <Eq display="inline" label="theta"><mi>θ</mi></Eq></>, meta: "updated while task A is learned" }),
    node({ id: "star", column: 3, row: 1, order: 3, role: "target", inputLabel: "θ*", badge: "PRODUCED AT STAGE END", title: <>Stage output <Eq display="inline" label="theta star"><msup><mi>θ</mi><mo>*</mo></msup></Eq></>, meta: "numeric reference only; importance is not estimated yet" }),
  ],
  edges: [
    { id: "a-theta", from: "taskA", to: "theta" },
    { id: "theta-star", from: "theta", to: "star" },
  ],
  legend: [
    { id: "flow", text: "Solid: update and production direction", swatch: "solid" },
    { id: "trainable", text: "Left bar: trainable parameters", swatch: "trainable" },
  ],
  note: "θ* is only a parameter reference. Fisher importance F and the EWC penalty do not exist at this stage.",
};

/* -------------------------------------------------------------------------- */
/* Component Lab sample: the same StepNav with deliberately long labels        */
/* -------------------------------------------------------------------------- */

export const labNavItems: StepNavItem[] = [
  { id: "frame", label: "Frame the question in one sentence", hint: "开场" },
  { id: "objects", label: "列出模型、输入与更新对象", hint: "对象" },
  { id: "evidence", label: "Bind every claim to a source locator and a page", hint: "证据" },
  { id: "boundary", label: "State where the mechanism stops applying", hint: "边界" },
];
