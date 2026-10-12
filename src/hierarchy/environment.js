import {rectangles} from './policy.js';
import {actionGeometry} from '../studio/environment.js';
import {materialPrimitives} from '../studio/materials.js';
import {tools} from '../studio/tools.js';
import {clamp} from '../vision/fields.js';
export const neutralKits=[[4,6],[4,5,6],[6,7],[6,7,8]];
export function regionFeatures(env,state,phase){
 return rectangles.map(r=>{
  let sq=0,focal=0,norm=0,edge=0,priority=0,coherence=0,mask=0;const target=[0,0,0],canvas=[0,0,0],n=r.w*r.h;
  for(let y=r.y;y<r.y+r.h;y++)for(let x=r.x;x<r.x+r.w;x++){const i=y*400+x;let error=0;for(let c=0;c<3;c++){const t=env.target[i*3+c],v=state.canvas[i*3+c];target[c]+=t;canvas[c]+=v;error+=(t-v)**2/3;}sq+=error;focal+=error*env.priority[i]**2;norm+=env.priority[i]**2;edge+=env.edge[i];priority+=env.priority[i];coherence+=env.coherence[i];mask+=env.mask[i];}
  return [Math.sqrt(sq/n),Math.sqrt((focal/n)/Math.max(1e-6,norm/n)),edge/n,...target.map(v=>v/n),...canvas.map(v=>v/n),priority/n,coherence/n,mask/n,phase,(r.x+r.w*.5)/400,(r.y+r.h*.5)/480,r.w/400,+(env.medium==='colour'),...['leonardo','durer','rembrandt'].map(v=>+(v===env.artist))];
 });
}
export function areaView(src,channels,r){
 const out=new Float32Array(80*96*channels),sx=r.w/80,sy=r.h/96;
 for(let y=0;y<96;y++)for(let x=0;x<80;x++){const x0=Math.floor(x*sx),x1=Math.ceil((x+1)*sx),y0=Math.floor(y*sy),y1=Math.ceil((y+1)*sy),n=(x1-x0)*(y1-y0),i=(y*80+x)*channels;for(let yy=y0;yy<y1;yy++)for(let xx=x0;xx<x1;xx++){const j=((r.y+yy)*400+r.x+xx)*channels;for(let c=0;c<channels;c++)out[i+c]+=src[j+c]/n;}}
 return out;
}
export function resamplePigment(env,a){
 const radius=Math.floor(a.width*.45),mean=[0,0,0];for(const dy of [-1,0,1])for(const dx of [-1,0,1]){const i=(clamp(a.y+dy*radius,0,95)*80+clamp(a.x+dx*radius,0,79))*3;for(let c=0;c<3;c++)mean[c]+=env.target[i+c]/9;}
 a.color=mean;if(a.ti===2)a.color=mean.map((v,c)=>v*.6+[.53,.25,.16][c]*.4);if(a.ti===3||a.ti===12)a.color=mean.map((v,c)=>v*.7+[.17,.12,.08][c]*.3);if(a.ti===11)a.color=mean.map(v=>v*.7+.28*.3);if(a.ti===10)a.color=[...env.paper];else if(a.ti===9)a.color=mean.map((v,c)=>v*.35+env.paper[c]*.65);delete a.paletteMix;
 return a;
}
/** Premultiplied brush layer: never resize the existing persistent artwork. */
export function materialLayer(a,sampling='legacy-width-damping'){
 const {p,pressure}=actionGeometry(a),marks=materialPrimitives({p,pressure,width:a.width,alpha:a.alpha,color:a.color,material:tools[a.ti].material}),rgb=new Float32Array(80*96*3),alpha=new Float32Array(80*96);
 for(const m of marks){const maxWidth=Math.max(...m.widths),x0=Math.max(0,Math.floor(Math.min(...m.p.map(p=>p[0]))-maxWidth*.5-1)),x1=Math.min(79,Math.ceil(Math.max(...m.p.map(p=>p[0]))+maxWidth*.5+1)),y0=Math.max(0,Math.floor(Math.min(...m.p.map(p=>p[1]))-maxWidth*.5-1)),y1=Math.min(95,Math.ceil(Math.max(...m.p.map(p=>p[1]))+maxWidth*.5+1));const color=typeof m.color==='string'?[1,3,5].map(k=>parseInt(m.color.slice(k,k+2),16)/255):m.color;
  for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){let distance=Infinity,width=0;for(let k=1;k<m.p.length;k++){const s=m.p[k-1],e=m.p[k],dx=e[0]-s[0],dy=e[1]-s[1],t=clamp(((x+.5-s[0])*dx+(y+.5-s[1])*dy)/(dx*dx+dy*dy||1)),lw=m.widths[k-1]+(m.widths[k]-m.widths[k-1])*t,d=Math.hypot(x+.5-s[0]-t*dx,y+.5-s[1]-t*dy)-lw/2;if(d<distance){distance=d;width=lw;}}
   const opacity=clamp(.5-distance)*(sampling==='linear-coverage-v1'?1:Math.min(1,width))*m.alpha,i=y*80+x;if(!opacity)continue;for(let c=0;c<3;c++)rgb[i*3+c]=rgb[i*3+c]*(1-opacity)+color[c]*opacity;alpha[i]+=opacity*(1-alpha[i]);
  }
 }let x0=80,y0=96,x1=-1,y1=-1;for(let i=0;i<alpha.length;i++)if(alpha[i]>0){x0=Math.min(x0,i%80);x1=Math.max(x1,i%80);y0=Math.min(y0,Math.floor(i/80));y1=Math.max(y1,Math.floor(i/80));}return {rgb,alpha,bounds:x1<0?null:{x0,y0,x1,y1}};
}
function bilinear(src,channels,x,y,c){x=clamp(x,0,79);y=clamp(y,0,95);const x0=Math.floor(x),y0=Math.floor(y),x1=Math.min(79,x0+1),y1=Math.min(95,y0+1),dx=x-x0,dy=y-y0;return src[(y0*80+x0)*channels+c]*(1-dx)*(1-dy)+src[(y0*80+x1)*channels+c]*dx*(1-dy)+src[(y1*80+x0)*channels+c]*(1-dx)*dy+src[(y1*80+x1)*channels+c]*dx*dy;}
export function compositeLayer(state,r,layer){
 const patch=affectedRectangle(r,layer);if(!patch)return;
 for(let y=patch.y-r.y;y<patch.y-r.y+patch.h;y++)for(let x=patch.x-r.x;x<patch.x-r.x+patch.w;x++){const sx=(x+.5)*80/r.w-.5,sy=(y+.5)*96/r.h-.5,alpha=bilinear(layer.alpha,1,sx,sy,0);if(!alpha)continue;const i=(r.y+y)*400+r.x+x;for(let c=0;c<3;c++)state.canvas[i*3+c]=clamp(state.canvas[i*3+c]*(1-alpha)+bilinear(layer.rgb,3,sx,sy,c));state.coverage[i]+=alpha;}
}
export function affectedRectangle(r,layer){
 if(layer.bounds===null)return null;if(!layer.bounds)return r;const b=layer.bounds,x0=Math.max(0,Math.floor((b.x0-1)*r.w/80)),y0=Math.max(0,Math.floor((b.y0-1)*r.h/96)),x1=Math.min(r.w,Math.ceil((b.x1+2)*r.w/80)),y1=Math.min(r.h,Math.ceil((b.y1+2)*r.h/96));return {x:r.x+x0,y:r.y+y0,w:x1-x0,h:y1-y0};
}
export function contribution(env,state,r){
 let pixel=0,focal=0,gx=0,gy=0;const x0=Math.max(0,r.x-1),y0=Math.max(0,r.y-1),x1=Math.min(400,r.x+r.w+1),y1=Math.min(480,r.y+r.h+1),luma=(a,i)=>.299*a[i*3]+.587*a[i*3+1]+.114*a[i*3+2];
 env.focalNorm??=env.priority.reduce((sum,v)=>sum+v*v,0);
 for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++){const i=y*400+x;let error=0;for(let c=0;c<3;c++)error+=(state.canvas[i*3+c]-env.target[i*3+c])**2/3;pixel+=error;focal+=error*env.priority[i]**2;const l=luma(state.canvas,i),t=luma(env.target,i);if(x+1<x1)gx+=((l-luma(state.canvas,i+1))-(t-luma(env.target,i+1)))**2;if(y+1<y1)gy+=((l-luma(state.canvas,i+400))-(t-luma(env.target,i+400)))**2;}
 return .6*pixel/(400*480)+.3*focal/Math.max(1e-6,env.focalNorm)+.1*(gx/(480*399)+gy/(479*400))/2;
}
