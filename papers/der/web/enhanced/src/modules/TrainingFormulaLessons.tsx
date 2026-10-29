import { Equation } from "./MathNotation";
import { Algebra, FormulaSpot, LessonReading, NextCue, ReadingUnit } from "./FormulaLessons";

function CombinedLoss({plus=false,workbench=false}:{plus?:boolean;workbench?:boolean}){
 return <Equation label={plus?"DER++ 总损失等于当前分类，加 α 历史匹配，加 β 历史标签分类":"DER 总损失等于当前分类加 α 历史匹配"}>
 {workbench?<mi>L</mi>:<msub><mi>L</mi><mtext>{plus?"DER++":"DER"}</mtext></msub>}<mo>=</mo><msub><mi>L</mi><mtext>current</mtext></msub><mo>+</mo><mi>α</mi><msub><mi>L</mi><mtext>dark</mtext></msub>{plus&&<><mo>+</mo><mi>β</mi><msub><mi>L</mi><mtext>replay-CE</mtext></msub></>}
 </Equation>;
}
export function TrainingFormulaLesson(){
 return <ReadingUnit id="der-step-math">
  <FormulaSpot formula={<CombinedLoss/>} variables={<>Lcurrent 是当前带标签样本的分类损失，Ldark 是旧样本当前 logits 与冻结 z 的平方匹配；α≥0 权衡历史约束。以下写单样本形式，批量训练对对应样本取平均或期望。</>}/>
  <LessonReading id="der-step-math" title="两条监督怎样合成一次参数更新？">
  <div className="lesson-columns"><div><span className="lesson-step">01 / 当前标签告诉网络什么</span><Algebra>{"Lcurrent = −ln qᵧ,  q = softmax(b)"}</Algebra><Algebra>{"∂Lcurrent/∂bₖ = qₖ − 𝟙[k=y]"}</Algebra><p>b 是当前样本的 logits，y 是真实类别。负对数在 qᵧ 小时惩罚大；沿负梯度提高真实类别分数，同时也会影响其他类别，不能说 CE 只给一个类别梯度。</p></div><div><span className="lesson-step">02 / 历史响应约束什么</span><Algebra>{"Ldark = Σₖ(aₖ−zₖ)²"}</Algebra><Algebra>{"∂Ldark/∂aₖ = 2(aₖ−zₖ)"}</Algebra><p>a 来自旧图本次视图的重新前向，z 是记录中不变的常数。这项恢复整组旧分数，α 只调强度，不把旧判断变成真实标签。<a href="#logit-matching">回看平方匹配与梯度 ↑</a></p></div></div>
  <div className="lesson-derivation"><span className="lesson-step">03 / 共同的参数</span><Algebra>{"g = ∇θLcurrent + α∇θLdark"}</Algebra><Algebra>{"θ⁺ = θ − ηg"}</Algebra><p>两项都在同一个更新前 θ 上计算。先相加梯度，再以学习率 η 做一次更新；若先用一项更新，再在新参数上算另一项，就改变了本页所展示的算法顺序。没有旧记忆时，历史项及其梯度为零。</p><p>α 是软权重，无法保证每次旧损失下降或旧行为完全不变：当前与历史梯度可能冲突。当前候选 z 也来自更新前输出，θ⁺ 不会倒过来改写它；训练结束才执行 Reservoir。方法依据 Eq. (5)、Algorithm 1，链式求导为教学展开。</p></div>
  </LessonReading>
  <NextCue>接着看动画：先读旧记忆、做两条前向，再合并梯度更新一次，最后选留候选。</NextCue>
 </ReadingUnit>;
}
export function AugmentationFormulaLesson(){
 return <ReadingUnit id="augmentation-math">
  <FormulaSpot formula={<Equation label="增强视图的当前输出与冻结历史目标的平方距离"><msub><mi>L</mi><mtext>dark</mtext></msub><mo>(</mo><mi>A</mi><mo>)</mo><mo>=</mo><msup><mrow><mo>‖</mo><msub><mi>h</mi><mi>θ</mi></msub><mo>(</mo><mi>A</mi><mo>(</mo><mi>x</mi><mo>)</mo><mo>)</mo><mo>−</mo><mi>z</mi><mo>‖</mo></mrow><mn>2</mn></msup></Equation>} variables={<>x 是记忆里的原图；A 是这次抽到的合理增强；θ 为当前参数。z 来自保存时视图 A₀(x) 的更新前输出，未来使用 A₁(x) 时仍固定不变。</>}/>
  <LessonReading id="augmentation-math" title="同一个冻结目标，怎样约束多个视图？">
  <div className="lesson-columns"><div><span className="lesson-step">01 / 对增强取期望</span><Algebra>{"a(A) = hθ(A(x)),  μ = E_A[a(A)]"}</Algebra><p>固定当前 θ 与历史 z，只有增强 A 在变化。每次训练抽到一个视图，得到一个平方匹配值；多次抽样优化的是增强分布下的平均目标，而不是每次刷新 z。</p><p>合理增强应保持类别语义，例如适当裁剪与翻转；任意破坏语义的变换不受这个解释保护。原图、保存时视图、回放时视图要分清。</p></div><div><span className="lesson-step">02 / 展开偏差与分散</span><Algebra>{"a−z = (a−μ) + (μ−z)"}</Algebra><Algebra>{"E_A[a−μ] = 0"}</Algebra><p>将上式平方并取期望，交叉项 2E_A[a−μ]·(μ−z) 为零，所以可以分成“平均输出距历史目标”和“视图输出围绕均值的分散”。</p></div></div>
  <div className="lesson-derivation"><Algebra>{"E_A‖a−z‖² = ‖μ−z‖² + E_A‖a−μ‖²"}</Algebra><p>第一项推动平均响应接近历史 z，第二项推动不同增强的响应彼此接近。这就是这里说的“隐式一致性”：一个原有平方匹配目标包含这两种倾向，<strong>没有额外新增两个训练损失</strong>。</p><p>对每个抽到的视图，输出梯度仍为 2(a−z)，再穿过当前网络。均值—方差恒等式是教程辅助解释 I03；不能据此保证所有增强输出完全相同。方法出处：§4.1、Algorithms 1–2。</p></div>
  </LessonReading>
  <NextCue>接着看动画：保存原图，冻结保存时响应，再让另一个视图匹配同一个 z。</NextCue>
 </ReadingUnit>;
}
export function PlusFormulaLesson({plus}:{plus:boolean}){
 return <ReadingUnit id="der-plus-math">
  <FormulaSpot formula={<CombinedLoss plus={plus}/>} variables={<>α 调历史 logits 匹配强度；β 调历史标签分类强度。DER++ 记录 (x,z,y)，分别抽 Rd 计算输出匹配、抽 Ry 计算标签 CE；DER 记录 (x,z)，没有历史标签项。</>}/>
  <LessonReading id="der-plus-math" title="历史行为与历史标签，为什么需要两种监督？">
  <div className="lesson-columns"><div><span className="lesson-step">01 / 对齐各自目标</span><Algebra>{"Ldark = ‖hθ(A_d(x_d))−z_d‖²"}</Algebra><Algebra>{"Lreplay-CE = −ln softmax(b)ᵧᵣ"}</Algebra><p>b=hθ(Aᵧ(xᵣ)) 是标签回放的新 logits。第一项说“接近过去的整组响应”，第二项说“提高真实类别的概率”。两次从旧 M 分别采样，批次可以重合，也可以不同；不应把分别采样误解成强制不相交。</p></div><div><span className="lesson-step">02 / 看梯度的职责</span><Algebra>{"∇a Ldark = 2(a−z)"}</Algebra><Algebra>{"∇b Lreplay-CE = softmax(b)−eᵧᵣ"}</Algebra><p>eᵧᵣ 是真实类别的 one-hot 向量。若 a=z，匹配梯度已经为零，即使旧预测错了。真实标签仍可给出非零纠偏梯度；当输出离开错误旧 z 时，匹配项又可能将它往回拉。</p></div></div>
  <div className="lesson-derivation"><Algebra>{plus?"g = gcurrent + α gdark + β greplay-CE":"g = gcurrent + α gdark"}</Algebra><Algebra>{"θ⁺ = θ − ηg"}</Algebra><p>所有支路都对同一更新前 θ 求梯度，相加后更新一次。β 不是替换 α，也不是在 DER 更新完以后再独立训练一次。空池时两种历史监督都不存在。</p><p>历史标签提供纠偏依据，却不能保证一步改对或 DER++ 在每种设置都更好；权重、样本与当前训练目标共同决定结果。方法依据 Eq. (6)、Algorithm 2；后面错误 z 为合成反例。</p></div>
  </LessonReading>
  <NextCue>接着看动画：旧响应可能出错；比较 DER 与 DER++ 的历史监督来源和联合更新。</NextCue>
 </ReadingUnit>;
}
export function WorkbenchFormulaLesson({plus}:{plus:boolean}){
 return <ReadingUnit id="workbench-math">
  <FormulaSpot formula={<CombinedLoss plus={plus} workbench/>} variables={<>本工作台使用 h_W(u)=Wu 的 2→3 线性教学模型。W 是当前权重矩阵；η=0.1，α=0.5，DER++ 时 β=0.5。每轮继承上一轮的 W、记忆 M 与已处理数 N。</>}/>
  <LessonReading id="workbench-math" title="把已学公式串成可复算的四轮执行">
  <div className="lesson-columns"><div><span className="lesson-step">01 / 输出梯度变成矩阵梯度</span><Algebra>{"a = Wv,   ∂L/∂Wₖⱼ = (∂L/∂aₖ)vⱼ"}</Algebra><Algebra>{"g = gcurrent + α gdark"}</Algebra>{plus&&<Algebra>{"+ β greplay-CE"}</Algebra>}<Algebra>{"W⁺ = W − ηg"}</Algebra><p>v 是当前支路自己的二维增强视图。每项输出梯度乘它的输入，再把各矩阵梯度相加。点击后面的“可复算状态”可查看每轮的输入、进入 W、联合梯度和更新后 W；数值由同一个训练模型计算。</p></div><div><span className="lesson-step">02 / 训练与保存有先后</span><Algebra>{"z_new ← W v_current  （更新前复制）"}</Algebra><p>先读旧 M；用进入本轮的 W 计算所有损失与候选 z；更新为 W⁺；最后用 Reservoir 决定候选是否写入 M。z 不用 W⁺ 重算。未留下的样本仍已参与当前训练。</p><span className="lesson-step">03 / 预测只读最终网络</span><Algebra>{"ŷ = argmaxₖ (W_final u_query)ₖ"}</Algebra><p>普通查询不取回放、不求训练梯度、不更新 W、M 或 N。这里没有测试任务 ID；不要把训练中的记忆读取带进预测入口。</p></div></div>
  <p className="lesson-note">这是 Algorithms 1–3 的教学执行整理；线性模型、输入和抽签结果用于复算，不是论文 CNN 实验。详细数学可回看 <a href="#U2-probability">KL</a>、<a href="#logit-matching">Logit Matching</a> 及前面的单步联合更新。</p>
  </LessonReading>
  <NextCue>接着进入四轮动画：逐轮核对参数、冻结目标、入池结果，最后只读预测。</NextCue>
 </ReadingUnit>;
}
