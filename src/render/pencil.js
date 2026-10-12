import {pathLength} from '../strokes/geometry.js';
import {materialPrimitives,ribbonOutline} from '../studio/materials.js';
import {visualPrimitives} from '../visual/materials.js';
export const PAPER='#f5f1e8';
const hash=(seed,i)=>{const v=Math.sin(seed*719+i*73.91)*43758.5453;return v-Math.floor(v);};
/** Deterministic graphite primitives shared by Canvas and SVG; pressure and paper
 * tooth are path attributes, not a bitmap overlay. */
export function primitives(s){
 if(s.grammar==='visual-materials-v1')return visualPrimitives(s);
 if(s.grammar==='studio-materials-v2')return materialPrimitives(s);
 const marks=[];let offset=0;for(let i=0;i<s.p.length-1;i+=3){let end=Math.min(i+3,s.p.length-1),p=s.p.slice(i,end+1),pressure=s.pressure.slice(i,end+1).reduce((a,b)=>a+b,0)/(end-i+1),grain=hash(s.grain,i),length=pathLength(p),base={p,color:s.color,length,offset};
  const width=s.width*pressure,alpha=s.alpha*(1-s.tooth*grain);
  if(['glaze','wash','sidelead'].includes(s.material)){
   // Nested vector marks approximate a soft deposit without raster blur. All
   // share distance offsets so partial playback advances every layer together.
   marks.push({...base,width,alpha:alpha*.42},{...base,width:width*.68,alpha:alpha*.48},{...base,width:width*.38,alpha:alpha*.35});
  }else if(s.material==='drybrush'){
   for(let strand=0;strand<3;strand++){const shift=(strand-1)*width*.28;const q=p.map((v,k)=>{const a=p[Math.max(0,k-1)],b=p[Math.min(p.length-1,k+1)],d=Math.hypot(b[0]-a[0],b[1]-a[1])||1;return [v[0]-(b[1]-a[1])/d*shift,v[1]+(b[0]-a[0])/d*shift];});marks.push({...base,p:q,width:width*.23,alpha:alpha*(.60+.25*hash(s.grain,i+strand))});}
  }else {marks.push({...base,width,alpha});if(s.material==='impasto')marks.push({...base,width:width*.25,alpha:alpha*.32,color:'#f2e3c4'});}
  offset+=length;
 }return marks;
}
export function pointAt(p,distance){if(!p.length)return [0,0];for(let i=1;i<p.length;i++){let a=p[i-1],b=p[i],len=Math.hypot(b[0]-a[0],b[1]-a[1]);if(distance<=len){let t=len?distance/len:0;return [a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t];}distance-=len;}return p[p.length-1];}
function clipped(p,distance){const out=[p[0]];for(let i=1;i<p.length;i++){let len=Math.hypot(p[i][0]-p[i-1][0],p[i][1]-p[i-1][1]);if(distance<len){out.push(pointAt([p[i-1],p[i]],distance));break;}out.push(p[i]);distance-=len;}return out;}
export function paintStroke(ctx,s,distance=Infinity){
 for(const mark of primitives(s)){const remaining=distance-mark.offset;if(remaining<=0)continue;let p=remaining<mark.length?clipped(mark.p,remaining):mark.p;
  if(mark.widths){const outline=ribbonOutline(mark,remaining);if(outline.length<3)continue;ctx.fillStyle=mark.color;ctx.globalAlpha=mark.alpha;ctx.beginPath();ctx.moveTo(...outline[0]);for(let k=1;k<outline.length;k++)ctx.lineTo(...outline[k]);ctx.closePath();ctx.fill();continue;}
  ctx.strokeStyle=mark.color;ctx.lineWidth=mark.width;ctx.globalAlpha=mark.alpha;ctx.lineJoin='round';ctx.lineCap='round';ctx.beginPath();ctx.moveTo(...p[0]);for(let j=1;j<p.length;j++)ctx.lineTo(...p[j]);ctx.stroke();
 }ctx.globalAlpha=1;
}
export function drawPencil(ctx,point,stroke){ctx.clearRect(0,0,ctx.canvas.width,ctx.canvas.height);if(!point)return;let tangent=0,best=Infinity;if(stroke?.p)for(let i=1;i<stroke.p.length;i++){const a=stroke.p[i-1],b=stroke.p[i],dx=b[0]-a[0],dy=b[1]-a[1],d2=dx*dx+dy*dy||1,t=Math.max(0,Math.min(1,((point[0]-a[0])*dx+(point[1]-a[1])*dy)/d2)),d=(point[0]-a[0]-t*dx)**2+(point[1]-a[1]-t*dy)**2;if(d<best){best=d;tangent=Math.atan2(dy,dx);}}ctx.save();ctx.translate(...point);ctx.rotate(-.65+Math.sin(tangent)*.16);
 if(stroke?.material==='chalk'){ctx.fillStyle=stroke.color;ctx.beginPath();ctx.moveTo(-5,-58);ctx.lineTo(5,-58);ctx.lineTo(4,-7);ctx.lineTo(0,0);ctx.lineTo(-4,-7);ctx.closePath();ctx.fill();ctx.fillStyle='rgba(255,255,255,.22)';ctx.fillRect(-4,-56,2,45);ctx.restore();return;}
 if(stroke?.tool==='knife'){ctx.fillStyle='#6b4834';ctx.fillRect(-4,-94,8,53);ctx.fillStyle='#bdbbb3';ctx.beginPath();ctx.moveTo(-3,-41);ctx.lineTo(10,-23);ctx.lineTo(0,0);ctx.lineTo(-8,-22);ctx.closePath();ctx.fill();ctx.restore();return;}
 if(stroke?.tool==='eraser'){ctx.fillStyle='#b6b0a5';ctx.beginPath();ctx.roundRect(-8,-24,16,24,6);ctx.fill();ctx.restore();return;}
 if(stroke?.tool==='pen'){ctx.fillStyle='#67472e';ctx.fillRect(-3,-90,6,72);ctx.fillStyle='#b7a58a';ctx.beginPath();ctx.moveTo(-3,-18);ctx.lineTo(3,-18);ctx.lineTo(0,0);ctx.closePath();ctx.fill();ctx.restore();return;}
 if(stroke?.tool==='brush'){ctx.fillStyle='#65503c';ctx.fillRect(-3,-108,6,73);ctx.fillStyle='#b5b0a5';ctx.fillRect(-4,-35,8,16);ctx.fillStyle=stroke.color;ctx.beginPath();ctx.moveTo(-4,-19);ctx.quadraticCurveTo(-4,-7,0,0);ctx.quadraticCurveTo(4,-7,4,-19);ctx.closePath();ctx.fill();ctx.restore();return;}
 ctx.fillStyle='#bda07e';ctx.strokeStyle='#776246';ctx.lineWidth=1;ctx.fillRect(-4,-102,8,82);ctx.strokeRect(-4,-102,8,82);
 ctx.fillStyle='#d8bea0';ctx.beginPath();ctx.moveTo(-4,-20);ctx.lineTo(4,-20);ctx.lineTo(0,0);ctx.closePath();ctx.fill();ctx.fillStyle='#333330';ctx.beginPath();ctx.moveTo(-1,-6);ctx.lineTo(1,-6);ctx.lineTo(0,0);ctx.fill();ctx.fillStyle='#504339';ctx.fillRect(-4,-112,8,10);ctx.restore();
}
