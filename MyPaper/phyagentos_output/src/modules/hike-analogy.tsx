import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

export const COLORS={bg:'#f5f8f0',light:'#b8c9a7',dark:'#76906a',route:'#92400e',blue:'#27446e',green:'#228d5c',red:'#c43f52',orange:'#f07e47',purple:'#7c3aed',ink:'#21324a',muted:'#68778f',border:'#d7deea'};

export function clearTrailScene(ctx:CanvasRenderingContext2D,w:number,h:number){ctx.fillStyle=COLORS.bg;ctx.fillRect(0,0,w,h);ctx.fillStyle=COLORS.light;ctx.beginPath();ctx.moveTo(0,h*.74);ctx.quadraticCurveTo(w*.25,h*.6,w*.5,h*.73);ctx.quadraticCurveTo(w*.78,h*.84,w,h*.66);ctx.lineTo(w,h);ctx.lineTo(0,h);ctx.fill();}

// 与 drawTrail 完全一致的两段二次贝塞尔路径（P0→C→P1, P1→C→P2）。
const trailSegs=(w:number,h:number)=>[
  [[30,h*.72],[w*.34,h*.58],[w*.68,h*.69]],
  [[w*.68,h*.69],[w*.82,h*.74],[w-34,h*.36]],
] as const;

export function drawTrail(ctx:CanvasRenderingContext2D,w:number,h:number,color=COLORS.route,broken=false){const segs=trailSegs(w,h);ctx.lineCap='round';ctx.lineWidth=16;ctx.strokeStyle='#dce7d5';ctx.beginPath();ctx.moveTo(segs[0][0][0],segs[0][0][1]);for(const s of segs){ctx.quadraticCurveTo(s[1][0],s[1][1],s[2][0],s[2][1]);}ctx.stroke();ctx.lineWidth=4;ctx.strokeStyle=color;if(broken)ctx.setLineDash([8,8]);ctx.beginPath();ctx.moveTo(segs[0][0][0],segs[0][0][1]);for(const s of segs){ctx.quadraticCurveTo(s[1][0],s[1][1],s[2][0],s[2][1]);}ctx.stroke();ctx.setLineDash([]);}

// 弧长查找表：Canvas 版 getPointAtLength（学 main 的 AnalogyScene，
// 用弧长参数化让人物匀速走在曲线上，脚底精确贴住路径）。
export interface TrailLUT{xs:number[];ys:number[];cum:number[];total:number;end:{x:number;y:number};}
export function trailLUT(w:number,h:number,perSeg=140):TrailLUT{
  const segs=trailSegs(w,h);
  const xs:number[]=[];const ys:number[]=[];const cum:number[]=[0];
  let px=0,py=0;
  for(let si=0;si<segs.length;si++){
    const s=segs[si];
    const chord=Math.hypot(s[2][0]-s[0][0],s[2][1]-s[0][1]);
    const n=Math.max(8,Math.round(perSeg*(chord/(w+h)*3+0.5)));
    for(let i=si===0?1:2;i<=n;i++){
      const t=i/n,u=1-t;
      const x=u*u*s[0][0]+2*t*u*s[1][0]+t*t*s[2][0];
      const y=u*u*s[0][1]+2*t*u*s[1][1]+t*t*s[2][1];
      xs.push(x);ys.push(y);
      cum.push(cum[cum.length-1]+Math.hypot(x-px,y-py));
      px=x;py=y;
    }
  }
  return{xs,ys,cum,total:cum[cum.length-1],end:{x:xs[xs.length-1],y:ys[ys.length-1]}};
}
export function trailPointAt(frac:number,lut:TrailLUT):{x:number;y:number}{
  const d=Math.max(0,Math.min(1,frac))*lut.total;
  let i=1;while(i<lut.cum.length-1&&lut.cum[i]<d)i++;
  const c0=lut.cum[i-1],c1=lut.cum[i],t=c1>c0?(d-c0)/(c1-c0):0;
  return{x:lut.xs[i-1]+(lut.xs[i]-lut.xs[i-1])*t,y:lut.ys[i-1]+(lut.ys[i]-lut.ys[i-1])*t};
}

// 人物 glyph 以脚底为原点（y=0），双脚落在调用给的 (x,y) 上——
// 传入曲线点即可让底部紧贴曲线上面。dir=-1 水平翻转（向左走）。
export function drawHiker(ctx:CanvasRenderingContext2D,x:number,y:number,color=COLORS.blue,scale=1,dir=1){
  ctx.save();ctx.translate(x,y);if(dir<0)ctx.scale(-1,1);
  ctx.lineCap='round';
  ctx.fillStyle=color;ctx.beginPath();ctx.arc(0,-33*scale,7*scale,0,Math.PI*2);ctx.fill();
  ctx.lineWidth=3;ctx.strokeStyle=color;
  ctx.beginPath();
  ctx.moveTo(0,-26*scale);ctx.lineTo(-5*scale,-8*scale);ctx.lineTo(-12*scale,0);
  ctx.moveTo(0,-26*scale);ctx.lineTo(8*scale,-9*scale);ctx.lineTo(14*scale,0);
  ctx.stroke();
  ctx.fillStyle=COLORS.orange;ctx.fillRect(6*scale,-27*scale,10*scale,13*scale);
  ctx.restore();
}

export function drawMarker(ctx:CanvasRenderingContext2D,x:number,y:number,color=COLORS.green){ctx.strokeStyle=COLORS.route;ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x,y-34);ctx.stroke();ctx.fillStyle=color;ctx.beginPath();ctx.moveTo(x,y-34);ctx.lineTo(x+28,y-27);ctx.lineTo(x,y-20);ctx.closePath();ctx.fill();}

export function drawNotebook(ctx:CanvasRenderingContext2D,x:number,y:number,w=110,h=70,accent=COLORS.blue){ctx.fillStyle='#fff';ctx.strokeStyle=COLORS.border;ctx.lineWidth=2;ctx.fillRect(x,y,w,h);ctx.strokeRect(x,y,w,h);ctx.strokeStyle=accent;ctx.lineWidth=3;const lines=h>=60?3:h>=40?2:1;for(let i=0;i<lines;i++){const ly=y+Math.max(10,h*0.3)+i*Math.max(12,(h-24)/(lines));if(ly>y+h-8)break;ctx.beginPath();ctx.moveTo(x+12,ly);ctx.lineTo(x+w-12,ly);ctx.stroke();}}

export function drawMap(ctx:CanvasRenderingContext2D,x:number,y:number,w=130,h=76,accent=COLORS.blue){ctx.fillStyle='#fff';ctx.strokeStyle=COLORS.border;ctx.lineWidth=2;ctx.fillRect(x,y,w,h);ctx.strokeRect(x,y,w,h);ctx.strokeStyle=accent;ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(x+12,y+h-14);ctx.quadraticCurveTo(x+w*.35,y+12,x+w-16,y+20);ctx.stroke();ctx.fillStyle=COLORS.green;ctx.beginPath();ctx.arc(x+w-24,y+20,5,0,Math.PI*2);ctx.fill();}

export function drawTechnicalInset(ctx:CanvasRenderingContext2D,x:number,y:number,w:number,h:number,title:string,value:number,color=COLORS.blue){ctx.fillStyle='#fff';ctx.strokeStyle=COLORS.border;ctx.lineWidth=2;ctx.fillRect(x,y,w,h);ctx.strokeRect(x,y,w,h);ctx.fillStyle=COLORS.ink;ctx.font='16px Segoe UI,sans-serif';ctx.fillText(title,x+14,y+24);ctx.fillStyle=color;ctx.fillRect(x+16,y+h-28,(w-32)*Math.max(0,Math.min(1,value)),10);ctx.fillStyle=COLORS.ink;ctx.font='22px Segoe UI,sans-serif';ctx.fillText(value.toFixed(2),x+w-62,y+h-35);}

// 场景编排（560×140）：
//   路径终点 (526,50) 插旗；人物最远走到 frac .90，与旗杆保持间距。
//   顶部安全带 y≤40（人物头顶最高到 y≈44）放地图（chap-2）。
//   曲线下方草地带 y≥106（该区间曲线 y≥92）放记录本（chap-7/8/10）。
//   —— 所有部件互不重叠，人物始终独占路径带。
const W=560,H=140,WALK_MIN=.05,WALK_MAX=.9;
export const HikeAnalogy:React.FC<WidgetProps>=({chapterId})=>{const ref=useRef<HTMLCanvasElement>(null);useEffect(()=>{const c=ref.current;if(!c)return;const ctx=setupCanvas(c,W,H);const lut=trailLUT(W,H);let raf:number|null=null;let alive=true;const reduced=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;const start=performance.now();const tick=(now:number)=>{const t=reduced?.55:((now-start)%3000)/3000;clearTrailScene(ctx,W,H);drawTrail(ctx,W,H,chapterId==='chap-1'?COLORS.red:COLORS.route,chapterId==='chap-1');if(chapterId==='chap-2')drawMap(ctx,40,6,100,34);if(chapterId==='chap-7')drawNotebook(ctx,58,106,120,28,COLORS.orange);if(chapterId==='chap-8')drawNotebook(ctx,58,106,120,28,COLORS.purple);if(chapterId==='chap-10')drawNotebook(ctx,58,106,120,28,COLORS.green);const leftward=chapterId==='chap-3';const frac=leftward?WALK_MAX-(WALK_MAX-WALK_MIN)*t:WALK_MIN+(WALK_MAX-WALK_MIN)*t;const p=trailPointAt(frac,lut);drawHiker(ctx,p.x,p.y,chapterId==='chap-1'?COLORS.red:COLORS.blue,1.1,leftward?-1:1);drawMarker(ctx,lut.end.x,lut.end.y,chapterId==='chap-1'?COLORS.red:COLORS.green);if(!c.classList.contains('is-ready'))c.classList.add('is-ready');if(alive)raf=requestAnimationFrame(tick);};const stop=()=>{alive=false;if(raf){cancelAnimationFrame(raf);raf=null;}};const startLoop=()=>{alive=true;if(!raf)raf=requestAnimationFrame(tick);};const disconnect=observeCanvas(c,startLoop,stop);startLoop();return()=>{stop();disconnect();};},[chapterId]);return <canvas ref={ref} width={W} height={H} aria-label='徒步动作示意'/>;};
export default HikeAnalogy;
