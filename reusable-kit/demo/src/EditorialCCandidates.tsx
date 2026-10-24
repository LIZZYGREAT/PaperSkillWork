import "./editorial-c-candidates.css";

export type EditorialCVariant = "baseline" | "c1" | "c2";

const comparisons = [
  { id: "old", output: "旧类输出", target: "teacher 的旧响应目标", purpose: "保留旧响应" },
  { id: "new", output: "新类输出", target: "当前任务的真实标签", purpose: "学习新任务" },
] as const;

const thetaStudent = <span className="rk-math"><var>θ</var><sub>s</sub></span>;

function Loss({ kind }: { kind: "old" | "new" }) {
  return <span className="ed-c-loss rk-math" data-loss-result={kind}><var>L</var><sub>{kind}</sub></span>;
}

function Objective() {
  return <math display="block" data-equation="objective" aria-label="联合目标 J 等于 lambda o 乘 L old 加 L new 加 R">
    <mi>J</mi><mo>=</mo>
    <mrow data-loss-term="old"><msub><mi>λ</mi><mi>o</mi></msub><msub><mi>L</mi><mtext>old</mtext></msub></mrow>
    <mo>+</mo><msub data-loss-term="new"><mi>L</mi><mtext>new</mtext></msub><mo>+</mo><mi>R</mi>
  </math>;
}

function ParameterUpdate() {
  return <math display="block" data-equation="parameter-update" aria-label="对联合目标 J 求导后，只更新 student 参数：theta s 赋值为 theta s 减 eta 乘 J 关于 theta s 的梯度">
    <msub><mi>θ</mi><mi>s</mi></msub><mo>←</mo><msub><mi>θ</mi><mi>s</mi></msub><mo>−</mo><mi>η</mi>
    <msub><mo>∇</mo><msub><mi>θ</mi><mi>s</mi></msub></msub><mi>J</mi>
  </math>;
}

function ParameterDefinition() {
  return <p className="ed-c-parameter-note" data-parameter-definition>本图用 {thetaStudent} 统称 student 的可训练参数：共享表示、旧任务头与新任务头。</p>;
}

function MechanismNote() {
  return <figcaption className="ed-c-mechanism-note">
    <p><strong>机制示意 · LwF 联合优化阶段</strong>　<var>L</var><sub>old</sub> 使用温度变换并重新归一化的分布；<var>λ</var><sub>o</sub> 为旧损失权重，<var>R</var> 为权重衰减项。此前 warm-up 只训练新任务参数。</p>
    <p>本图的 {thetaStudent} 是 student 全部可训练参数的阅读简写，区别于原文仅表示共享参数的同名记号。更新式是梯度下降教学示意，<var>η</var> 为步长，不限定论文的优化器细节。此图不是论文原图或实验结果。</p>
  </figcaption>;
}

function PreviewLinks({ variant }: { variant: "c1" | "c2" }) {
  return <nav className="ed-c-preview-links" aria-label="C 构图预览">
    <span>设计评审</span>
    <a href="?demo=editorial#ed-c">Baseline</a>
    <a href="?demo=editorial&c=c1#ed-c" aria-current={variant === "c1" ? "page" : undefined}>C1 · 编辑式汇合</a>
    <a href="?demo=editorial&c=c2#ed-c" aria-current={variant === "c2" ? "page" : undefined}>C2 · Student 场景</a>
  </nav>;
}

function EditorialC1() {
  return <section id="ed-c" className="ed-study__section ed-c-candidate ed-c-candidate--c1" data-c-variant="c1" aria-labelledby="ed-c-title">
    <PreviewLinks variant="c1" />
    <header className="ed-c-intro">
      <p className="ed-c-kicker">C1 / EDITORIAL CONVERGENCE <span>LwF · 联合优化</span></p>
      <h2 id="ed-c-title">两路比较，<br /><em>落在同一个 student。</em></h2>
      <p>固定的 teacher 留下旧响应目标。面对当前任务输入 <var>x</var>，student 既要保留旧响应，也要学会新标签。</p>
    </header>
    <figure className="ed-c1-composition" aria-label="编辑式汇合：固定参照与 student 的两路学习关系">
      <div className="ed-c1-columns">
        <aside className="ed-c1-reference" data-role="teacher" aria-label="固定 teacher">
          <p className="ed-c-role-index">固定参照 / 不接收梯度</p>
          <h3>teacher</h3>
          <p>在同一个当前输入 <var>x</var> 上，提供<strong>旧类响应目标</strong>。</p>
          <p className="ed-c-small">这些响应可以预先记录，无需每批重新运行旧模型。</p>
          <p className="ed-c1-reference-foot">供 student 的旧路比较使用</p>
        </aside>
        <div className="ed-c1-student" data-role="student" aria-label="可训练 student">
          <header><p className="ed-c-role-index">可训练 / 两路输出</p><h3>student</h3><ParameterDefinition /></header>
          <div className="ed-c1-comparisons" aria-label="student 的两个比较结果">
            {comparisons.map(item => <div className="ed-c1-comparison" key={item.id} data-comparison={item.id}>
              <div><h4>{item.output}</h4><p>与{item.target}比较</p></div>
              <div className="ed-c1-result"><Loss kind={item.id} /><span>{item.purpose}</span></div>
            </div>)}
          </div>
          <div className="ed-c1-objective" data-stage="objective">
            <p className="ed-c-small">两次比较，在 student 侧汇成一个目标</p>
            <Objective />
          </div>
          <div className="ed-c1-update" data-stage="update" data-update-target="student">
            <p><strong>对 J 求导，再更新这一个 student</strong></p>
            <ParameterUpdate />
          </div>
        </div>
      </div>
      <MechanismNote />
    </figure>
    <p className="ed-c-proposition">两种学习要求，<strong>由同一个 student 承担。</strong></p>
  </section>;
}

function EditorialC2() {
  return <section id="ed-c" className="ed-study__section ed-c-candidate ed-c-candidate--c2" data-c-variant="c2" aria-labelledby="ed-c-title">
    <PreviewLinks variant="c2" />
    <header className="ed-c-intro">
      <p className="ed-c-kicker">C2 / STUDENT-CENTERED SYSTEM <span>LwF · 联合优化</span></p>
      <h2 id="ed-c-title">同一个 student，<br /><em>怎样接住两种学习信号？</em></h2>
      <p>把输出、比较和优化放回同一个计算场景。参照从外部进入，联合目标的梯度回到 student。</p>
    </header>
    <figure className="ed-c2-system" aria-label="以 student 为中心的联合优化场景">
      <div className="ed-c2-sources" aria-label="student 外部的两个比较目标来源">
        <aside data-role="teacher" className="ed-c2-teacher" aria-label="固定 teacher">
          <p className="ed-c-role-index">固定参照 / 不接收梯度</p>
          <h3>teacher <span>旧类响应目标</span></h3>
          <p>读取同一个当前输入 <var>x</var>；响应可以预先记录，无需每批重跑旧模型。</p>
        </aside>
        <aside className="ed-c2-labels" data-role="current-labels" aria-label="来自当前任务数据的真实标签">
          <p className="ed-c-role-index">外部监督 / 来自当前任务数据</p>
          <h3>真实标签 <span className="rk-math"><var>y</var></span></h3>
          <p>新任务的比较目标，由训练数据提供。</p>
        </aside>
      </div>
      <div className="ed-c2-student" data-role="student" aria-label="可训练 student">
        <header className="ed-c2-subject"><div><p className="ed-c-role-index">当前输入 <var>x</var> 进入这里</p><h3>student</h3></div><p className="ed-c2-update-label">唯一被更新的对象</p></header>
        <ParameterDefinition />
        <div className="ed-c2-computation">
          <div className="ed-c2-shared" data-part="shared-representation"><span className="ed-c-role-index">一份共享表示</span><strong>同一个 <var>x</var><br />送往两路输出</strong><p>共享表示参与两路计算</p></div>
          <ol className="ed-c2-comparisons" aria-label="student 输出与外部目标的比较">
            {comparisons.map(item => <li key={item.id} data-comparison={item.id}>
              <div className="ed-c2-output"><h4>{item.output}</h4><p>与{item.target}比较</p></div>
              <div className="ed-c2-result"><span className="ed-c-small">比较结果</span><Loss kind={item.id} /></div>
            </li>)}
          </ol>
        </div>
        <div className="ed-c2-learning">
          <div className="ed-c2-objective" data-stage="objective"><p className="ed-c-role-index">01 / 两项损失先组成联合目标</p><Objective /><p className="ed-c-small">保留旧响应 + 学习新任务 + 权重衰减</p></div>
          <div className="ed-c2-return" data-stage="update" data-update-target="student"><p className="ed-c-role-index">02 / 对 J 求导，更新 student 参数</p><ParameterUpdate /><p className="ed-c-small">更新回到本场景的共享表示与旧、新任务头</p></div>
        </div>
      </div>
      <MechanismNote />
    </figure>
    <p className="ed-c-proposition">两路比较形成目标，<strong>一次更新回到 student。</strong></p>
  </section>;
}

export function EditorialCCandidates({ variant }: { variant: Exclude<EditorialCVariant, "baseline"> }) {
  return variant === "c1" ? <EditorialC1 /> : <EditorialC2 />;
}
