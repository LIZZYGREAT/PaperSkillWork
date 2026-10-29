import ModelPixel, {type ModelClass} from "./review/ModelPixel";
import {mix,windowAt} from "./review/lifecycle-model";
import {MODEL_CLASSES} from "../data/model-classes";
import type {Vec} from "./training-model";
export const fmt=(v:number,n=3)=>(Math.abs(v)<1e-10?0:v).toFixed(n);
export const vectorText=(v:Vec,n=3)=>"("+v.map(x=>fmt(x,n)).join(", ")+")";
export function SampleGlyph({x,y,size=64,model=0,id,view=0}:{x:number;y:number;size?:number;model?:ModelClass;id:string;view?:number}){
return <g transform={`translate(${x} ${y})`} data-sample={id}><rect width={size} height={size} rx="10" className="tg-sample"/><g transform={`translate(${size/2} ${size/2}) rotate(${view*12}) scale(${1+Math.abs(view)*.08}) translate(${-size/2} ${-size/2})`}><ModelPixel model={model} x={size*.2} y={size*.2} size={size*.6}/></g></g>;
}
export function NetworkGlyph({x,y,version,forward=0,backward=0}:{x:number;y:number;version:string;forward?:number;backward?:number}){
const left=[82,158],right=[60,120,180],reverse=backward>0&&backward<1,t=reverse?backward:forward;
return <g transform={`translate(${x} ${y})`} data-network data-version={version}>
<rect width="226" height="244" rx="17" className={`tg-network ${reverse?"is-updating":""}`}/><text x="17" y="28" className="tg-title">当前网络</text><text x="209" y="28" textAnchor="end" className="tg-theta">{version}</text><path d="M17 42H209" className="tg-rule"/>
{left.flatMap((a,i)=>right.map((b,j)=><g key={i+"-"+j}><path d={`M52 ${a+30}L173 ${b+30}`} className="tg-edge"/>{t>0&&t<1&&<circle cx={mix(52,173,reverse?1-t:t)} cy={mix(a+30,b+30,reverse?1-t:t)} r="3" className={reverse?"tg-gradient-dot":"tg-forward-dot"}/>}</g>))}
{left.map((v,i)=><circle key={i} cx="52" cy={v+30} r="7" className="tg-node"/>)}{right.map((v,i)=><circle key={i} cx="173" cy={v+30} r="7" className="tg-node"/>)}<text x="52" y="232" textAnchor="middle" className="tg-small">二维输入</text><text x="173" y="232" textAnchor="middle" className="tg-small">三类分数</text></g>;
}
export function ScoreGlyph({x,y,values,label,reveal=1,frozen=false,note}:{x:number;y:number;values:Vec;label:string;reveal?:number;frozen?:boolean;note?:string}){
return <g transform={`translate(${x} ${y})`} data-score={label}><text x="0" y="-12" className="tg-title">{label}</text>{values.map((v,k)=><g key={k} opacity={windowAt(reveal,k*.15,k*.15+.5)}><rect x={k*99} width="91" height="72" rx="9" className={`tg-score tg-tone-${k}`}/><text x={k*99+10} y="22" className="tg-small">{MODEL_CLASSES[k]}</text><text x={k*99+45} y="52" textAnchor="middle" className="tg-number">{fmt(v)}</text></g>)}<text x="0" y="93" className="tg-small">{note??(frozen?"□ 固定历史值，不随 θ 更新":"● 本次前向结果，与当前 θ 同源")}</text></g>;
}
export function MotionPath({d,progress,kind="data"}:{d:string;progress:number;kind?:string}){return <path d={d} className={`tg-path tg-path-${kind}`} pathLength="1" strokeDasharray="1" strokeDashoffset={1-progress} opacity={progress>0?1:0}/>;}
