import { LESSON_DURATIONS } from './lesson-motion';
import { useId, useState } from 'react';
import SceneTransport, { useSceneTimeline } from './review/SceneTransport';
import { windowAt, mix } from './review/lifecycle-model';
import { PelicanIllustration, type ImageView } from './PelicanIllustration';
import { SavedTargetFormula, ReplayTargetFormula, ParameterSymbol, MathSub } from './LessonNotation';
import { LessonCue } from './LessonGuidance';
import { ReferenceButton } from './Reference';
import './learning-scenes.css';
import './later-chapters.css';
export const AUGMENTATION_CLIPS = [
 {id:'从原图取得保存视图',durationMs:LESSON_DURATIONS.augmentation[0],holdMs:400},
 {id:'保存时复制并冻结 z',durationMs:LESSON_DURATIONS.augmentation[1],holdMs:400},
 {id:'未来重新裁剪或翻转',durationMs:LESSON_DURATIONS.augmentation[2],holdMs:500},
 {id:'多个视图，同一个历史目标',durationMs:LESSON_DURATIONS.augmentation[3],holdMs:500},
];
export default function Augmentation(){
 const timeline=useSceneTimeline(AUGMENTATION_CLIPS), [view,setView]=useState<'center'|'flip'>('center');
 const {clipIndex:c,progress:p}=timeline.state, id=useId().replace(/:/g,'');
 const done=(i:number)=>c>i?1:c<i?0:windowAt(p,.08,.85);
 const imageView:ImageView=c<2?'saved':view;
 const amount=done(c<2?0:2), freeze=done(1), constrain=done(3);
 const crop=imageView==='saved'?{x:9/1.08,y:5/1.08,w:320/1.08,h:190/1.08}:{x:40/1.34,y:21/1.34,w:320/1.34,h:190/1.34};
 const notes=['原图一直保留。窗口框出同源区域，再放大到右侧训练视图；内容确实改变，样本身份没有改变。','保存时，用当时的更新前模型计算 A₀(x)，复制输出为固定 z；以后参数变化不会重算它。','未来从同一原图生成新的 A₁(x)。裁剪放大或水平镜像发生在图像内部，文字和边框保持正向。','不同视图的响应与同一个 z 匹配：既约束平均响应偏离，也抑制视图间波动。点的运动仅示意约束方向。'];
 return <section className="der-redesign later-lesson aug2-lesson" data-scene="augmentation" data-clip={c} data-progress={p} data-status={timeline.state.status} data-target="fixed-symbolic-z" data-view={view}>
 <header className="later-scene-heading"><div><h3>图像在变，原图身份与历史目标不变。</h3><p>合理的数据增强保留类别语义，却改变送入模型的视图。先看裁剪和翻转真正发生，再连接保存与回放两个时刻。</p></div></header>
 <div className="aug-view-controls scene-options" role="group" aria-label="选择未来回放时的图像视图"><span>未来训练视图</span><button aria-pressed={view==='center'} onClick={()=>{setView('center');timeline.playFrom(2);}}>中心裁剪</button><button aria-pressed={view==='flip'} onClick={()=>{setView('flip');timeline.playFrom(2);}}>水平翻转</button><button onClick={()=>timeline.playFrom(0)}>重播保存视图</button><small>播放观察变换 · 固定目标 z</small></div>
 <LessonCue steps={['取保存视图','冻结目标','重新增强','共同约束']} active={c} title={['看裁剪窗口与右侧放大图','看保存时输出复制为固定 z','看右侧图像实际变换','看不同响应朝同一目标靠近'][c]} detail={notes[c]}/><div className="aug2-stage"><svg viewBox="0 0 1120 600" className="teaching-canvas aug-canvas" role="img" aria-label="同一幅鹈鹕原图的真实裁剪与翻转，保存时冻结输出，未来不同视图共同匹配固定历史目标">
 <defs><marker id={id+'-a'} viewBox="0 0 8 8" markerWidth="6" markerHeight="6" refX="7" refY="4" orient="auto"><path d="M1 1L7 4L1 7" className="later-arrowhead"/></marker></defs>
 <text x="28" y="46" className="later-svg-title">示意原图 · x</text><text x="1040" y="46" textAnchor="end" className="later-svg-title">{c<2?'保存时视图 A₀(x)':view==='center'?'未来视图 A₁(x) · 中心裁剪':'未来视图 A₁(x) · 水平翻转'}</text>
 <PelicanIllustration view="original" label="始终保留的鹈鹕原图" x={28} y={68} width={440} height={261.25} className="aug2-original"/>
 {imageView!=='flip'&&<rect x={28+crop.x*1.375*amount} y={68+crop.y*1.375*amount} width={mix(440,crop.w*1.375,amount)} height={mix(261.25,crop.h*1.375,amount)} rx="3" className="aug2-crop" data-crop-window/>}
 <path d="M490 198H557" className="later-connector" markerEnd={'url(#'+id+'-a)'}/><text x="524" y="178" textAnchor="middle" className="later-svg-note">取视图</text>
 <PelicanIllustration view={imageView} amount={amount} label="实际变换后的同一只鹈鹕" x={580} y={68} width={440} height={261.25} className="aug2-transformed"/>
 <text x="28" y="360" className="later-svg-note">保存的是原图；增强视图不会覆盖它。</text><text x="580" y="360" className="later-svg-note">{imageView==='flip'?'图像左右镜像；鹈鹕、自行车的相对朝向改变。':'框内内容被放大到同样大小的训练窗口。'}</text>
 <path d="M28 389H1092" className="aug2-rule"/>
 <text x="28" y="424" className="later-svg-title">保存时 · <ParameterSymbol index="old"/></text><text x="28" y="457" className="aug2-formula lesson-math"><SavedTargetFormula/></text><text x="28" y="501" className="later-svg-note">输出复制后冻结；随后不再随参数求值。</text>
 <g opacity={freeze}><rect x="438" y="412" width="100" height="66" rx="10" className="ds2-candidate"/><text x="488" y="452" textAnchor="middle" className="aug2-z">固定 z</text></g>
 <text x="580" y="424" className="later-svg-title">回放时 · 当前 θ</text><text x="580" y="457" className="aug2-formula lesson-math"><ReplayTargetFormula/></text><text x="580" y="501" className="later-svg-note">每个新视图都与保留的同一份 z 比较。</text>
 <g className="aug2-response-space" opacity={done(2)}><path d="M690 565H1065M705 577V508" className="aug2-rule"/><circle cx="971" cy="540" r="7" className="aug2-target"/><text x="987" y="545" className="later-svg-note">z 固定</text>{[{x:745,y:520},{x:820,y:551},{x:875,y:516}].map((a,i)=><g key={i}><path d={'M'+a.x+' '+a.y+'L971 540'} className="aug2-tendency"/><circle cx={mix(a.x,971,constrain*.55)} cy={mix(a.y,540,constrain*.55)} r="5" className="aug2-response"/><text x={mix(a.x,971,constrain*.55)-8} y={mix(a.y,540,constrain*.55)-13} className="aug2-response-label lesson-math">a<MathSub>{i+1}</MathSub></text></g>)}</g>
 <text x="28" y="540" className="later-svg-title">隐式一致性</text><text x="28" y="569" className="later-svg-note">共同目标约束多种视图；并未额外添加视图之间的损失。</text>
 </svg></div>
 <SceneTransport timeline={timeline} clips={AUGMENTATION_CLIPS} label="增强与一致性" showTiming={false} teachingProgress/>
 <div className="later-reading-pair"><div><h4>平均响应与视图波动，都受约束。</h4><p>固定 z 时，期望平方误差可以拆成“平均响应到 z 的偏离”与“各视图围绕平均值的波动”。这解释了一种隐式一致性倾向，并不保证所有视图输出完全相同。</p><ReferenceButton term="augmentation">展开均值—方差解释</ReferenceButton></div><div><h4>稳定的历史目标，也可能是错的。</h4><p>合理变换需要保留类别语义，任意裁剪并不一定合理。即便多种视图都稳定匹配 z，z 也可能记录了一次错误判断。下一幕让历史真实标签提供独立监督。</p></div></div>
 <p className="quiet-note">鹈鹕是自绘图像增强示例；本幕不从其像素计算三类 logits、损失或梯度。下方点的运动是方向示意，不是真实训练轨迹。</p>
 </section>;
}
