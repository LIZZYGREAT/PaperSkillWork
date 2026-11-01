import { useId, useState } from 'react';
import SceneTransport,{useSceneTimeline} from './review/SceneTransport';
import {curve,windowAt} from './review/lifecycle-model';
import ModelPixel from './review/ModelPixel';
import {MODEL_CLASSES} from '../data/model-classes';
import {DER_PLUS_MEMORY} from './der-plus-example';
import type {Mode} from './training-model';
import './learning-scenes.css';
import './later-chapters.css';
const clips=[{id:'旧响应与真实标签的冲突',durationMs:4500,holdMs:1800},{id:'独立读取 Rᴅ 与 Rʏ',durationMs:5000,holdMs:1800},{id:'三种监督，仅更新一次',durationMs:6000,holdMs:2200}];
const old=DER_PLUS_MEMORY[0], a=[1,1,0];
export default function DERPlus(){
 const [mode,setMode]=useState<Mode>('DER++'),[overlap,setOverlap]=useState(true),[focus,setFocus]=useState('both');
 const timeline=useSceneTimeline(clips),{clipIndex:c,progress:p}=timeline.state,id=useId().replace(/:/g,'');
 const plus=mode==='DER++',ry=overlap?'xₑ':'x_f';
 const reveal=(i:number)=>c>i?1:c<i?0:windowAt(p,.08,.86),reading=reveal(1),joint=reveal(2),updated=c===2&&p>=.86;
 const rdAt=curve(reading,{x:284,y:189},{x:310,y:189},{x:300,y:432},{x:325,y:432});
 const ryAt=curve(reading,{x:284,y:overlap?189:367},{x:316,y:overlap?189:367},{x:310,y:484},{x:325,y:484});
 return <section className="der-redesign later-lesson dp2-lesson" data-scene="der-plus" data-clip={c} data-progress={p} data-status={timeline.state.status} data-mode={mode} data-rd="xₑ" data-ry={plus?ry:'none'} data-updates={updated?1:0} data-read-progress={reading} data-supervision-count={plus?3:2}>
 <header className="later-scene-heading"><div><h3>固定的旧目标，也可能固定了错误。</h3><p>独立错例 xₑ 的真实标签是 Claude，历史 z 却把 GPT 排第一。DER++ 额外保存并回放历史标签，让它提供另一种监督方向。</p></div><div className="scene-options" role="group" aria-label="选择训练方法">{(['DER','DER++'] as Mode[]).map(m=><button key={m} aria-pressed={mode===m} onClick={()=>{setMode(m);timeline.reset();}}>{m}</button>)}</div></header>
 <div className="dp2-observe scene-options" role="group" aria-label="观察同一响应上的监督倾向"><span>观察同一 a=(1,1,0)</span>{[['dark','旧响应匹配'],['label','标签监督'],['both','合并观察']].map(([key,label])=><button key={key} aria-pressed={focus===key} onClick={()=>setFocus(key)}>{label}</button>)}</div>
 <div className="dp2-stage"><svg viewBox="0 0 1120 640" className="teaching-canvas dp2-canvas" role="img" aria-label="独立错例的共享三类响应，旧响应与真实标签两种监督倾向，独立读池并汇合一次更新">
 <defs><marker id={id+'-a'} viewBox="0 0 8 8" markerWidth="6" markerHeight="6" refX="7" refY="4" orient="auto"><path d="M1 1L7 4L1 7" className="later-arrowhead"/></marker></defs>
 <g data-memory-record="xₑ"><rect x="24" y="54" width="260" height="242" rx="14" className="dp2-memory"/><text x="44" y="84" className="later-svg-title">旧记忆 M · 独立错例</text><ModelPixel model={0} x={44} y={103} size={48}/><text x="108" y="123" className="later-svg-title">xₑ · Claude</text><text x="44" y="181" className="dp2-formula">z = (0.5, 2, 0)</text><text x="44" y="210" className="later-svg-note">旧 z 最高：GPT</text><path d="M44 224H264" className="aug2-rule"/>{plus?<text x="44" y="258" className="dp2-truth">真实 y = Claude</text>:<text x="44" y="258" className="later-svg-note">DER 记录仅含 (x,z)</text>}</g>
 <text x="400" y="54" className="later-svg-title">同一个当前响应，两种监督倾向</text><circle cx="410" cy="79" r="4" className="dp2-current"/><text x="422" y="84" className="later-svg-note">当前 a</text><path d="M531 74L536 79L531 84L526 79Z" className="dp2-old"/><text x="547" y="84" className="later-svg-note">冻结 z</text><text x="1056" y="84" textAnchor="end" className="later-svg-note">箭头仅示意局部下降方向</text>
 {MODEL_CLASSES.map((name,k)=>{const y=126+k*61,x=560+a[k]*140,z=560+old.z[k]*140;return <g key={name}><text x="400" y={y+5} className="dp2-track-label">{name}</text><path d={'M550 '+y+'H930'} className="dp2-track"/><path d={'M'+z+' '+(y-8)+'L'+(z+6)+' '+y+'L'+z+' '+(y+8)+'L'+(z-6)+' '+y+'Z'} className={k===1?'dp2-old dp-z-wrong':'dp2-old'}/><circle cx={x} cy={y} r="6" className="dp2-current"/><text x="990" y={y+5} className="later-svg-note">a={a[k]} · z={old.z[k]}</text>{focus!=='label'&&k<2&&<path d={'M'+x+' '+(y-17)+'H'+(k===0?x-40:x+40)} className="dp2-dark-direction" markerEnd={'url(#'+id+'-a)'}/>} {focus!=='dark'&&<path d={'M'+x+' '+(y+18)+'H'+(x+(k===0?40:-28))} className="dp2-label-direction" markerEnd={'url(#'+id+'-a)'}/>}</g>})}
 <text x="400" y="303" className="later-svg-note">{focus==='dark'?'平方匹配：Claude 向 0.5，GPT 向 2 靠近。':focus==='label'?'标签 CE：提高 Claude 相对其他类别的概率。':'同一 xₑ 上，两种监督可能竞争；不预设更新后结果。'}</text>
 <g data-memory-record="x_f"><rect x="24" y="328" width="260" height="78" rx="12" className="dp2-alternative"/><ModelPixel model={1} x={40} y={346} size={40}/><text x="95" y="355" className="later-svg-title">x_f · GPT</text><text x="95" y="384" className="later-svg-note">另一条合成记忆</text></g>
 <path d="M24 348H22" className="aug2-rule"/>
 <g opacity={reading}><path d="M284 189H304V432H320" className="dp2-read-path"/><path d={'M284 '+(overlap?189:367)+'H311V484H320'} className="dp2-read-path"/>{reading>0&&reading<1&&<><circle cx={rdAt.x} cy={rdAt.y} r="5" className="dp2-old"/>{plus&&<circle cx={ryAt.x} cy={ryAt.y} r="5" className="dp2-current"/>}</>}<text x="330" y="384" className="later-svg-title">当前 x_t · 真实 y_t</text><text x="330" y="437" className="dp2-dark-text">Rᴅ · xₑ · 冻结 z</text>{plus&&<text x="330" y="489" className="dp2-truth">Rʏ · {ry} · y={overlap?'Claude':'GPT'}</text>}<path d="M553 380H603V425H624M553 432H624" className="later-connector" markerEnd={'url(#'+id+'-a)'}/>{plus&&<path d="M553 484H603V475H624" className="later-connector" markerEnd={'url(#'+id+'-a)'}/>}</g>
 <g className="dp-update-hub"><rect x="630" y="401" width="134" height="115" rx="18" className="dp2-model"/><text x="697" y="441" textAnchor="middle" className="later-svg-title">同一个模型</text><text x="697" y="483" textAnchor="middle" className="dp2-theta">{updated?'θ⁺':'θ'}</text></g>
 <g opacity={joint}><path d="M774 455H808" className="later-connector" markerEnd={'url(#'+id+'-a)'}/><text x="826" y="391" className="later-svg-title">全部使用更新前 θ</text><text x="826" y="429" className="later-svg-note">当前标签 CE · L_current</text><text x="826" y="466" className="dp2-dark-text">旧响应匹配 · α L_dark</text>{plus&&<text x="826" y="503" className="dp2-truth">历史标签 CE · β L_replay-CE</text>}<path d="M1058 520V546H697V523" className="dp2-update-path" markerEnd={'url(#'+id+'-a)'}/><g className="dp-updated-parameter"><text x="860" y="574" textAnchor="middle" className="later-svg-title">梯度合并 · 一次更新</text></g><text x="24" y="468" className="later-svg-note">原记录始终保留在 M</text><text x="24" y="497" className="later-svg-note">当前候选在更新后才选留</text><text x="24" y="605" className="dp2-total" data-total-formula>{plus?'L = L_current + α L_dark + β L_replay-CE':'L = L_current + α L_dark'}</text></g>
 </svg></div>
 {plus&&<div className="scene-options dp2-read-controls" role="group" aria-label="选择两次回放是否抽到同一条旧记忆"><span>独立抽样结果演示</span><button data-overlap-choice="same" aria-pressed={overlap} onClick={()=>{setOverlap(true);timeline.start(1);}}>恰好重合 · xₑ / xₑ</button><button data-overlap-choice="different" aria-pressed={!overlap} onClick={()=>{setOverlap(false);timeline.start(1);}}>抽到不同项 · xₑ / x_f</button></div>}
 <p className="later-event" aria-live="polite">{c===0?'基本 DER 的当前样本已经有标签 CE；这里缺少的是历史回放的额外真实标签监督。':c===1?(plus?'Rᴅ 与 Rʏ 两次独立抽样，均复制旧池记录，M 尚未写入。'+(!overlap?'现在来自不同输入，不能沿用上方同一 xₑ 的正面冲突解释。':'两次恰好抽到同一条 xₑ。'):'DER 只读取旧 logits；当前输入仍然有真实标签。'):'三种监督在同一个更新前 θ 上形成，合并后只更新一次。具体结果由梯度与权重共同决定，不保证立刻纠错。'}</p>
 <SceneTransport timeline={timeline} clips={clips} label="DER++ 两次读取与一次联合更新" showTiming={false} teachingProgress/>
 <p className="quiet-note">xₑ、x_f 是独立合成错例；与 D1 和下一章四轮数值实例无关。图中 a 固定，不模拟或承诺训练后的纠错输出。α、β 分别权衡两种历史监督。</p>
 </section>;
}
