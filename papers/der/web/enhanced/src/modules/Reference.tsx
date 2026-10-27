import { createContext, useContext, useEffect, useId, useRef, useState } from "react";
import type { ReactNode } from "react";
import { formatValue, HISTORY_Z, logitComparison, LOGIT_CASES, probabilityComparison, PROBABILITY_CASES, REFERENCE_P } from "./math-model";

const terms = {
  kl: { name: "KL 散度", english: "Kullback–Leibler divergence", short: "本节比较固定旧概率 p 与当前概率 q 的有向差异；它不是分类准确率。" },
  softmax: { name: "softmax", english: "Softmax", short: "把整组 logits 转成正概率，所有类别概率之和为 1；共同增加同一个分数不会改变结果。" },
  ce: { name: "交叉熵", english: "Cross entropy", short: "分类时用 −log qᵧ 提高真实类别的概率；软标签形式则按整组参考概率 p 加权。" },
  logits: { name: "logits", english: "Pre-softmax class scores", short: "网络在 softmax 之前的类别分数；可正可负，不要求加起来等于 1。" },
  p: { name: "旧概率 p", english: "Fixed reference distribution", short: "旧行为的固定参考分布。本例始终为 (0.8, 0.2)，切换当前预测不会改动它。" },
  q: { name: "当前概率 q", english: "Current prediction distribution", short: "由当前网络输出得到的概率分布；本节只切换 q 来观察相对固定 p 的变化。" },
  z: { name: "历史 logits z", english: "Frozen historical logits", short: "某步参数更新前产生并复制下来的输出数值；后续训练不刷新这个目标。" },
  a: { name: "当前 logits a", english: "Current logits", short: "当前网络对同一原始输入或其对应训练视图的输出 a=hθ(x)，是要被优化的对象。" },
  squared: { name: "平方距离", english: "Squared Euclidean distance", short: "对相同类别的分数相减、平方，再求和；不是对历史标签再做一次交叉熵。" },
} as const;
export type TermId = keyof typeof terms;
const ReferenceContext = createContext<(term: TermId) => void>(() => {});

export function Term({ id, children }: { id: TermId; children?: ReactNode }) {
  const open = useContext(ReferenceContext);
  const [shown, setShown] = useState(false);
  const tooltip = useId();
  return <span className="term-wrap"><button type="button" className="term" onMouseEnter={() => setShown(true)} onMouseLeave={() => setShown(false)} onFocus={() => setShown(true)} onBlur={() => setShown(false)} onKeyDown={(event) => { if (event.key === "Escape") setShown(false); }} onClick={() => { setShown(false); open(id); }} aria-describedby={shown ? tooltip : undefined}>{children ?? terms[id].name}</button>{shown && <span role="tooltip" id={tooltip} className="term-tip">{terms[id].short}<small>点击查看推导与出处</small></span>}</span>;
}

export function ReferenceButton({ term = "kl", children = "推导与出处" }: { term?: TermId; children?: ReactNode }) {
  const open = useContext(ReferenceContext);
  return <button type="button" className="text-button" onClick={() => open(term)}>{children}<span aria-hidden="true"> ↗</span></button>;
}

function DeepReading({ term }: { term: TermId }) {
  if (term === "kl" || term === "p" || term === "q" || term === "ce") return <>
    <h3>完整数值，可以在这里复核</h3><p>下面沿用主线的两类合成概率。计算用自然对数，显示保留六位小数；负的单项保留符号。</p>
    <div className="reference-table"><table><thead><tr><th>当前 q</th><th>猫的单项</th><th>狗的单项</th><th>KL 总和</th></tr></thead><tbody>{PROBABILITY_CASES.map((item) => { const result = probabilityComparison(REFERENCE_P, item.values); return <tr key={item.id}><th>{item.label}</th><td>{formatValue(result.terms[0], 6)}</td><td>{formatValue(result.terms[1], 6)}</td><td>{formatValue(result.kl, 6)}</td></tr>; })}</tbody></table></div>
    <h3>为什么整体非负，单项却可以为负？</h3><p>当某类 qₖ 大于 pₖ 时，该类 log(pₖ/qₖ) 为负。对完整归一化分布，用 −log u ≥ 1−u 可得 D(p∥q) ≥ Σₖ(pₖ−qₖ)=0；不能对单个类别套用整体结论。</p>
    <h3>梯度怎样回到网络？</h3><p>若 q=softmax(a)，展开 log qₖ=aₖ−log Σⱼexp(aⱼ)，固定 p 并对当前 a 求导，得到 ∂D/∂aₖ=qₖ−pₖ。它还要通过链式法则传到 θ；不是直接对每个参数减去 q−p。</p>
    <h3>方向与边界</h3><p>一般 D(p∥q)≠D(q∥p)。本例 p、q 都严格为正；有零概率时还需处理支持集和极限，不能直接照搬对数代入。</p>
  </>;
  return <>
    <h3>逐维计算与输出梯度</h3><div className="reference-table"><table><thead><tr><th>当前 a</th><th>a−z</th><th>平方和</th><th>概率 KL</th></tr></thead><tbody>{LOGIT_CASES.map((item) => { const result = logitComparison(HISTORY_Z, item.values); return <tr key={item.id}><th>{item.values.join(", ")}</th><td>{result.differences.join(", ")}</td><td>{result.squaredDistance}</td><td>{formatValue(result.probabilityKL, 6)}</td></tr>; })}</tbody></table></div>
    <p>对当前输出 a，平方距离的梯度为 2(a−z)。历史 z 是常量，梯度经过当前网络回到 θ，不会回传到已经不保存的旧网络。</p>
    <h3>KL 与平方距离的局部联系</h3><p>写 a=z+δ、p=softmax(z)。在 δ 足够小时，KL 的二阶近似为 ½δᵀ[diag(p)−ppᵀ]δ。平方距离是 δᵀIδ；权重不同，共同平移方向也不同，不能称两者全局严格等价。</p>
    <h3>生成、冻结与写入</h3><p>Algorithm 1–2 先从已有记忆采样、增强并前向，在参数更新前生成当前 logits；更新后才调用 reservoir 写入原图与此前数值。冻结目标不等于永久保存某个旧教师。</p>
  </>;
}

export function ReferenceProvider({ children }: { children: ReactNode }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [active, setActive] = useState<TermId>("kl");
  const opener = useRef<HTMLElement | null>(null);
  useEffect(() => { const element = dialog.current; if (!element) return; const restore = () => opener.current?.focus(); element.addEventListener("close", restore); return () => element.removeEventListener("close", restore); }, []);
  const open = (id: TermId) => { opener.current = document.activeElement as HTMLElement | null; setActive(id); if (!dialog.current?.open) dialog.current?.showModal(); };
  return <ReferenceContext.Provider value={open}>{children}<dialog ref={dialog} className="reference-dialog" aria-labelledby="reference-title" onClick={(event) => { if (event.target === event.currentTarget) dialog.current?.close(); }}><div className="reference-shell"><header><div><p className="eyebrow">按需阅读 · REFERENCE</p><h2 id="reference-title">推导与出处</h2></div><button type="button" className="close-button" aria-label="关闭参考资料" onClick={() => dialog.current?.close()}>关闭 <span aria-hidden="true">×</span></button></header><nav aria-label="参考术语">{(Object.keys(terms) as TermId[]).map((id) => <button type="button" key={id} aria-pressed={active === id} onClick={() => setActive(id)}>{terms[id].name}</button>)}</nav><article key={active}><p className="reference-english">{terms[active].english}</p><h3>{terms[active].name}</h3><p>{terms[active].short}</p><DeepReading term={active} /><section className="source-note"><h3>原文与教学边界</h3><p>论文 §3，第 3 页 Eq. (2)–(5) 说明从概率蒸馏到 logits 匹配的动机；第 4 页 Algorithm 1–2 给出更新与写入顺序。公式短推演和本页数值是数学背景与合成教学例，不是论文实验结果。</p><a href="https://arxiv.org/abs/2004.07211v2" target="_blank" rel="noreferrer">Buzzega 等，NeurIPS 2020 · arXiv v2 ↗</a></section></article></div></dialog></ReferenceContext.Provider>;
}
