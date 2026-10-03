import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { FeatureSpaceWorkbench } from "../components/FeatureSpaceWorkbench";
import { SampleToken } from "../components/SampleToken";
import { encode2D, sampleById } from "../data/icarl-runtime";
import { useReducedMotion } from "../shared/foundation/accessibility/useReducedMotion";

const flowStages = [
  { title: "输入图像", description: "样本 x 进入共享模型。沿着整条路径，样本身份保持不变。", tag: "原始样本" },
  { title: "特征提取器", description: "可训练参数 Θ 决定当前特征映射 φΘ。学习继续时，这部分参数会更新。", tag: "共享网络" },
  { title: "特征表示", description: "Feature Extractor 输出向量 z。它是模型内部表示，不是类别标签，也不是预测结果。", tag: "内部向量" },
  { title: "训练输出层", description: "每个已见类别都有自己的权重向量 wᵧ；同一个表示会送入每个类别节点。", tag: "逐类权重" },
  { title: "网络响应", description: "每个节点产生一个 sigmoid 响应 gᵧ(x)。这些输出用于学习表示，不是 iCaRL 的最终类别决定。", tag: "逐类响应" },
];

const projectionIds = ["x_7", "x_3", "x_2", "x_8"];

export function PageTwo() {
  const [modelOpen, setModelOpen] = useState(false);
  const [stage, setStage] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [featureState, setFeatureState] = useState<"before" | "after">("before");
  const [classBatchExpanded, setClassBatchExpanded] = useState(false);
  const reducedMotion = useReducedMotion();

  const points = useMemo(() => projectionIds.map((id) => {
    const sample = sampleById(id);
    return { id, classId: sample.classId, point: encode2D(sample, featureState) };
  }), [featureState]);
  const previousPoints = useMemo(() => featureState === "after" ? projectionIds.map((id) => {
    const sample = sampleById(id);
    return { id, classId: sample.classId, point: encode2D(sample, "before") };
  }) : [], [featureState]);
  const progressStyle = { "--p2-progress": `${(stage / (flowStages.length - 1)) * 100}%` } as CSSProperties;

  useEffect(() => {
    if (!isPlaying || reducedMotion) return;
    if (stage === flowStages.length - 1) {
      setIsPlaying(false);
      return;
    }
    const timer = window.setTimeout(() => setStage((value) => Math.min(flowStages.length - 1, value + 1)), 2100);
    return () => window.clearTimeout(timer);
  }, [isPlaying, reducedMotion, stage]);

  function selectStage(nextStage: number) {
    setIsPlaying(false);
    setStage(nextStage);
  }

  function togglePlayback() {
    if (reducedMotion) {
      setStage((value) => value >= flowStages.length - 1 ? 0 : value + 1);
      return;
    }
    if (isPlaying) {
      setIsPlaying(false);
      return;
    }
    if (stage === flowStages.length - 1) setStage(0);
    setIsPlaying(true);
  }

  function replayFlow() {
    setStage(0);
    if (reducedMotion) {
      setIsPlaying(false);
      return;
    }
    setIsPlaying(true);
  }

  return (
    <article className="tutorial-page p2-page" aria-labelledby="page-two-title">
      <div className="p1-kicker p2-kicker"><span>第 02 页</span><i /> 从图像到特征表示</div>
      <header className="page-heading p2-heading">
        <h1 id="page-two-title">打开模型：图片怎样变成可比较的特征表示</h1>
        <p>iCaRL 持续更新共享的 feature extractor。先看一张图像如何穿过模型，再区分内部表示、训练输出和最终分类。</p>
      </header>

      {!modelOpen ? (
        <section className="p2-blackbox panel" aria-label="模型概览">
          <div className="p2-blackbox__path">
            <div className="p2-blackbox__item p2-blackbox__image"><span className="p2-eyebrow">输入</span><SampleToken sample={sampleById("x_7")} role="raw" /><small>一张图像 · x</small></div>
            <span className="p2-blackbox__arrow" aria-hidden="true"><svg viewBox="0 0 58 20"><path d="M1 10h51m-8-7 8 7-8 7" /></svg></span>
            <div className="p2-blackbox__model"><span className="p2-eyebrow">共享学习器</span><strong>神经网络</strong><small>内部结构尚未展开</small></div>
            <span className="p2-blackbox__arrow" aria-hidden="true"><svg viewBox="0 0 58 20"><path d="M1 10h51m-8-7 8 7-8 7" /></svg></span>
            <div className="p2-blackbox__item p2-blackbox__outputs"><span className="p2-eyebrow">输出</span><strong>逐类网络响应</strong><small>每个已见类别各有一个输出</small></div>
          </div>
          <div className="p2-blackbox__action"><p>展开从原始图像到逐类响应的处理路径。</p><button type="button" className="p2-action" onClick={() => setModelOpen(true)}>打开模型 <span aria-hidden="true">↗</span></button></div>
        </section>
      ) : (
        <>
          <section className="p2-opened-model panel" aria-labelledby="p2-flow-title">
            <div className="p2-panel-heading">
              <div><span className="p2-eyebrow">共享模型 · 同一张图像经过五个阶段</span><h2 id="p2-flow-title">图像 x → 特征提取器 → 表示 z → 训练输出层 → 网络响应</h2></div>
              <button className="p2-quiet-action" type="button" onClick={() => { setIsPlaying(false); setModelOpen(false); }}>收起模型</button>
            </div>

            <div className="p2-playback">
              <div className="p2-playback__steps" role="group" aria-label="模型处理阶段">
                {flowStages.map((item, index) => <button key={item.title} type="button" className={`p2-step-chip ${stage === index ? "is-active" : ""} ${index < stage ? "is-complete" : ""}`} aria-pressed={stage === index} onClick={() => selectStage(index)}><span>{String(index + 1).padStart(2, "0")}</span>{item.title}</button>)}
              </div>
              <div className="p2-playback__controls">
                <button className="p2-quiet-action" type="button" onClick={() => selectStage(Math.max(0, stage - 1))} disabled={stage === 0}>← 上一步</button>
                <button className="p2-action p2-action--small" type="button" onClick={togglePlayback}>{reducedMotion ? "下一步 →" : isPlaying ? "暂停" : stage === flowStages.length - 1 ? "再次播放" : "播放完整路径"}</button>
                {!reducedMotion ? <button className="p2-quiet-action" type="button" onClick={replayFlow}>从头播放</button> : null}
                <button className="p2-quiet-action" type="button" onClick={() => selectStage(Math.min(flowStages.length - 1, stage + 1))} disabled={stage === flowStages.length - 1}>下一步 →</button>
              </div>
            </div>

            <div className="p2-progress" aria-hidden="true"><span style={progressStyle} /></div>

            <div className="p2-pipeline" aria-label="模型处理的五个阶段">
              {flowStages.map((item, index) => (
                <div className={`p2-node ${stage === index ? "is-active" : ""} ${index < stage ? "is-complete" : ""}`} key={item.title} aria-current={stage === index ? "step" : undefined}>
                  <div className="p2-node__top"><span>{String(index + 1).padStart(2, "0")}</span><small>{item.tag}</small></div>
                  <h3>{item.title}</h3>
                  {index === 0 ? <div className="p2-node__sample"><SampleToken sample={sampleById("x_7")} role="raw" /><span>同一张样本 x</span></div> : null}
                  {index === 1 ? <div className="p2-extractor-visual"><div className="p2-feature-blocks"><i /><i /><i /><i /></div><span>卷积与特征块</span><b>φ<sub>Θ</sub></b></div> : null}
                  {index === 2 ? <div className="p2-vector-visual"><div aria-hidden="true">{[26, 43, 32, 52, 36, 48].map((height, bar) => <i key={bar} style={{ height: `${height}px` }} />)}</div><strong>z = φ<sub>Θ</sub>(x)</strong><small>z ∈ R<sup>d</sup></small></div> : null}
                  {index === 3 ? <div className="p2-head-visual"><div><i>w<sub>1</sub></i><i>w<sub>2</sub></i><i>w<sub>3</sub></i><b>···</b><i>w<sub>t</sub></i></div><strong>每个已见类别<br />对应一个权重向量</strong></div> : null}
                  {index === 4 ? <div className="p2-output-visual"><div><span>g<sub>1</sub>(x)</span><i /><b>σ</b></div><div><span>g<sub>2</sub>(x)</span><i /><b>σ</b></div><div><span>g<sub>t</sub>(x)</span><i /><b>σ</b></div><small>逐类独立响应</small></div> : null}
                </div>
              ))}
              {flowStages.slice(0, -1).map((item, index) => <div className={`p2-pipeline-arrow ${index < stage ? "is-complete" : ""}`} aria-hidden="true" key={`${item.title}-to-next`}><svg viewBox="0 0 48 22"><path d="M2 11h39m-7-7 7 7-7 7" /></svg></div>)}
            </div>

            <div className="p2-stage-caption" aria-live="polite"><span className="p2-stage-caption__dot" /><div><b>{flowStages[stage].tag}</b><p>{flowStages[stage].description}</p></div><span className="p2-stage-caption__count">{stage + 1} / {flowStages.length}</span></div>
            <p className="p2-carrier-note"><strong>教学示意。</strong> 图中表达 iCaRL 所需的组件与数据流，不代表论文实验所用 ResNet 的精确拓扑。</p>
          </section>

          <section className="p2-representation-layout" aria-label="特征表示与特征空间">
            <section className="p2-feature-panel panel">
              <div className="p2-panel-heading"><div><span className="p2-eyebrow">同一批样本 · 两种模型状态</span><h2>更新 Θ 后，表示空间会改变</h2></div>
                <div className="p2-state-switch" role="group" aria-label="特征提取器状态">
                  <button type="button" aria-pressed={featureState === "before"} onClick={() => setFeatureState("before")}>更新前</button>
                  <button type="button" aria-pressed={featureState === "after"} onClick={() => setFeatureState("after")}>更新后</button>
                </div>
              </div>
              <FeatureSpaceWorkbench
                mode="projection"
                title="当前特征映射下的样本位置"
                description="二维教学投影：固定的合成坐标会随所选模型状态作确定性移动，并非论文测得的特征。"
                points={points}
                previousPoints={previousPoints}
              />
              <div className="p2-projection-note"><span className="p2-note-mark">i</span><p>实际 representation 通常位于高维 R<sup>d</sup>。这里用二维投影表达样本间的位置关系；同一编号样本在更新前后保持不变。</p></div>
            </section>

            <section className="p2-head-panel panel">
              <div className="p2-panel-heading"><div><span className="p2-eyebrow">逐类训练输出层</span><h2>一个表示，逐类产生训练输出</h2></div><button className="p2-quiet-action" type="button" aria-expanded={classBatchExpanded} onClick={() => setClassBatchExpanded((value) => !value)}>{classBatchExpanded ? "收起下一批" : "加入下一批"}</button></div>
              <div className="p2-head-equation"><span>z</span><i>→</i><span>w<sub>y</sub><sup>⊤</sup>z</span><i>→</i><span>sigmoid</span><i>→</i><strong>g<sub>y</sub>(x)</strong></div>
              <p className="p2-head-copy">对每个已见类别 y，训练输出层都有一个对应的权重向量 w<sub>y</sub> 与 sigmoid 响应。</p>
              <div className="p2-class-expansion" aria-live="polite">
                <div className="p2-class-expansion__label"><span>第 1 批</span><b>10 个输出节点</b></div>
                <div className="p2-output-nodes">{Array.from({ length: 10 }, (_, index) => <span key={index}>g<sub>{index + 1}</sub></span>)}</div>
                {classBatchExpanded ? <><div className="p2-class-expansion__label p2-class-expansion__label--new"><span>第 2 批 · 追加</span><b>同一输出层 · 新增 10 个节点</b></div><div className="p2-output-nodes p2-output-nodes--new">{Array.from({ length: 10 }, (_, index) => <span key={index}>g<sub>{index + 11}</sub></span>)}</div></> : <div className="p2-head-addition"><span>+</span><p>新类别会追加对应的权重；特征提取器仍是同一个共享组件。</p></div>}
              </div>
              <div className="p2-head-boundary"><strong>训练输出 ≠ 最终预测</strong><p>iCaRL 最终根据样本到 exemplar 类均值的距离进行分类，不取 sigmoid 输出中最大的类别。</p></div>
            </section>
          </section>

          <section className="p2-handoff"><span className="p2-eyebrow">接下来的问题</span><p>现在已经认识 z。保存下来的样本怎样代表各个类别，并支持最终预测？</p><span>继续了解类别表示机制 <b>→</b></span></section>
        </>
      )}
    </article>
  );
}
