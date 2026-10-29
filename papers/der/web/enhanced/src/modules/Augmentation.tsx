import { AugmentationFormulaLesson } from "./TrainingFormulaLessons";
import SceneTransport,{useSceneTimeline} from "./review/SceneTransport";
import {windowAt,mix} from "./review/lifecycle-model";
import {SampleGlyph,ScoreGlyph,fmt,vectorText} from "./LearningGlyphs";
import {runTraining,forward,viewOf} from "./training-model";
import "./learning-scenes.css";
const clips=[{id:"原图与保存时视图",durationMs:4500,holdMs:1500},{id:"生成并冻结 z",durationMs:4500,holdMs:1800},{id:"未来回放另一视图",durationMs:5000,holdMs:1800},{id:"多个视图，共用一个目标",durationMs:5500,holdMs:2200}];
const steps=runTraining("DER"),record=steps[0].candidate,W=steps[1].before.W;
export default function Augmentation(){
const timeline=useSceneTimeline(clips),{clipIndex:c,progress:p}=timeline.state,done=(i:number)=>c>i?1:c<i?0:windowAt(p,.08,.85),s=mix(-1,1,done(3)),a=forward(W,viewOf(record.u,s)),loss=a.reduce((sum,v,k)=>sum+(v-record.z[k])**2,0);
const notes=["保存原图 x；首次训练用 A₀(x) 进入更新前网络。原图与临时训练视图分开保有身份。","把 A₀(x) 的更新前输出复制为 z。写入的是 (原图 x,z)，没有用增强图覆盖原图，也没有保存旧网络。","未来取同一原图，重新生成 A₁(x)。当前网络产生新 a，历史 z 仍是原来的数值。","改变回放视图时，a 与匹配损失实时变化，z 保持固定。鼓励多个视图接近同一目标，也鼓励它们彼此接近；没有新增 DER 损失。"];
return <section className="teaching-scene" data-scene="augmentation" data-clip={c} data-progress={p} data-status={timeline.state.status} data-target={record.z.join(",")} data-view={s} data-loss={loss}>
<header><div><p className="eyebrow">AUGMENTATION / 恢复真实视图</p><h3>再看同一张图，可以是另一个视图。</h3><p>前面隔离问题时暂把视图固定。实际图像训练使用希望保持类别语义的合理裁剪、翻转等变换；不是任意变换都合理。记忆保留原图，匹配目标保留过去。</p></div></header>
<AugmentationFormulaLesson/>
<SceneTransport timeline={timeline} clips={clips} label="增强与一致性" showTiming={false}/>
<div className="teaching-stage"><svg viewBox="0 0 1120 435" role="img" className="teaching-canvas" aria-label="同一原图的保存视图与回放视图匹配同一冻结目标">
<text x="65" y="42" className="tg-title">记忆中的原图 x₁</text><SampleGlyph x={87} y={132} size={112} model={0} id="x₁ original"/><text x="65" y="280" className="tg-small">原图不被增强结果覆盖</text><path d="M199 188H270V100H310M270 188V309H310M386 100H500M386 309H500" className="tg-path"/>
<g opacity={done(0)}><SampleGlyph x={310} y={63} size={76} model={0} id="A0 x1" view={done(0)}/><text x="309" y="166" className="tg-small">保存时 A₀(x)</text><ScoreGlyph x={500} y={63} label="更新前 θ₀ 的输出" values={record.z} reveal={done(1)}/></g>
<g opacity={done(1)}><rect x="865" y="140" width="205" height="159" rx="13" className="tg-frozen"/><text x="882" y="172" className="tg-title">同一个冻结 z</text>{record.z.map((v,k)=><text key={k} x="889" y={204+k*29} className="tg-number">□ {fmt(v)}</text>)}</g>
<g opacity={done(2)}><SampleGlyph x={310} y={271} size={76} model={0} id="A1 x1" view={s}/><text x="309" y="373" className="tg-small">回放时 A₁(x)</text><ScoreGlyph x={500} y={271} label="当前 θ₁ 的新输出 a" values={a} reveal={done(2)}/><path d="M796 308H838V253H865" className="tg-path-target tg-path"/><text x="501" y="403" className="tg-small">与同一 z 平方匹配：{fmt(loss,5)}</text></g><path d="M796 99H838V181H865" className="tg-path" opacity={done(1)}/>
</svg></div><div className="scene-explanation" aria-live="polite"><strong>{clips[c].id}</strong><p>{notes[c]}</p></div>
<p className="quiet-note">数值与 W5 小模型同源：u={vectorText(record.u,1)}，Aₛ(u)=(u₁+0.1s,u₂)。像素旋转只示意视图身份，数值按二维微小位移计算，不声称计算真实裁剪特征。出处：§4.1、Algorithms 1–2，C14/M06。</p></section>;
}
