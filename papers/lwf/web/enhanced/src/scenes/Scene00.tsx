import React from 'react';
import { useReferenceHub } from '../components/ReferencePrimitives';
import { AlexNetArchitecture } from '../components/AlexNetArchitecture';
import { MathFormula } from '../components/MathFormula';
import { InlineNotation } from '../components/InlineNotation';

export function Scene00({ onNext }: { onNext: () => void }) {
  const { openHub } = useReferenceHub();

  return (
    <div className="v2-scene-content v2-scene-00">
      <section className="v2-intro-premise" aria-labelledby="intro-premise-title">
        <div className="v2-intro-label"><span>00</span><span>论文背景 · GENERAL BACKGROUND</span></div>
        <h2 id="intro-premise-title">加入新任务时，怎样尽量不忘记已经学过的内容？</h2>
        <p>
          LwF 讨论的是一个持续学习场景：模型已经学会旧任务，之后还要学习新任务；但新阶段只有新任务的图像和标签，旧任务训练数据不再可用。已训练的旧模型仍然可以运行。
        </p>
        <div className="v2-intro-setting" aria-label="任务到来时的数据条件">
          <div><span>保留下来的模型</span><code>旧模型 f_old</code><strong>可运行</strong></div>
          <div><span>旧任务训练数据</span><code><InlineNotation text="X_o · Y_o^GT" /></code><strong>不可用</strong></div>
          <div><span>当前新任务数据</span><code><InlineNotation text="X_n · Y_n" /></code><strong>可用于训练</strong></div>
        </div>
      </section>

      <section className="v2-intro-tension" aria-labelledby="intro-tension-title">
        <div className="v2-section-title-row">
          <div><p className="v2-eyebrow">THE PROBLEM SETTING</p><h2 id="intro-tension-title">直接学习新任务，会遇到三种取舍</h2></div>
          <button type="button" className="v2-intro-evidence" onClick={() => openHub({ evidenceId: 'C01' })}>查看问题设定 C01 ↗</button>
        </div>
        <div className="v2-intro-route-grid">
          <article><span>01</span><h3>只训练新任务</h3><p>微调可适应新数据；如果共享表示随新任务改变，旧任务输出可能退化。</p></article>
          <article><span>02</span><h3>冻结已有表示</h3><p>特征提取能避免更新共享表示，但也限制它适应新任务的空间。</p></article>
          <article><span>03</span><h3>新旧数据一起训练</h3><p>联合训练可以同时使用两边监督；在本文设定里，旧任务训练数据不可用。</p></article>
        </div>
      </section>

      <section className="v2-intro-method" aria-labelledby="intro-method-title">
        <div className="v2-section-title-row">
          <div><p className="v2-eyebrow">WHAT THE PAPER DOES</p><h2 id="intro-method-title">让旧模型在新图像上提供旧任务响应</h2></div>
          <button type="button" className="v2-intro-evidence" onClick={() => openHub({ evidenceId: 'C02' })}>查看论文依据 C02 ↗</button>
        </div>
        <div className="v2-intro-flow" aria-label="LwF 的基本训练思路">
          <div><span>旧模型</span><strong>f_old</strong><small>保持可运行</small></div>
          <i aria-hidden="true">+</i>
          <div><span>新任务图像</span><strong>X_n</strong><small>当前训练输入</small></div>
          <i aria-hidden="true">→</i>
          <div className="is-response"><span>旧任务响应</span><strong><MathFormula id="inline:teacher_response" compact /></strong><small>不是旧图像或旧真值</small></div>
          <i aria-hidden="true">→</i>
          <div className="is-student"><span>扩展后的 Student</span><strong><MathFormula id="inline:loss_pair" compact /></strong><small>保留旧响应，同时学习新标签</small></div>
        </div>
        <p className="v2-intro-method-note">
          旧模型对当前新图像给出的软响应，作为旧任务输出的学习目标；新任务标签则监督新增任务输出。这样训练不需要把旧任务图像重新送入训练。
        </p>
      </section>

      <AlexNetArchitecture />

      <section className="v2-intro-goal" aria-label="论文目的与边界">
        <div><span className="v2-source-badge is-paper">论文目的</span><p>在没有旧任务训练数据的条件下学习新任务，同时尽量保留旧任务能力。</p></div>
        <div><span className="v2-source-badge is-background">理解边界</span><p>旧响应是在新任务图像上匹配的；这并不保证模型在所有旧任务输入上都不退化。</p></div>
      </section>

      <footer className="v2-intro-footer">
        <span>背景与方法事实可在 Reference Hub 查看：C01 描述任务设定，C02 描述旧响应路径。</span>
        <button type="button" className="v2-primary-action" onClick={onNext}>进入 01 · 问题空间 →</button>
      </footer>
    </div>
  );
}
