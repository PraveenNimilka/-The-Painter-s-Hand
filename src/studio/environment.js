import {tools} from './tools.js';
import {profiles,stageFor,stageTarget} from './plan.js';
import {materialPrimitives} from './materials.js';
import {value} from '../learning/plan.js';
import {clamp} from '../vision/fields.js';
import {pathLength} from '../strokes/geometry.js';
export const featureNames=profiles.features;
const pixel=(a,i)=>[a[i*3],a[i*3+1],a[i*3+2]];
export function observation(env){const canvas=new Float32Array(env.w*env.h*3),coverage=new Float32Array(env.w*env.h);for(let i=0;i<canvas.length;i++)canvas[i]=env.paper[i%3];return {canvas,coverage};}

export function samplingDistribution(env,state,stage){
 const target=stageTarget(env,stage),cumulative=new Float64Array(env.w*env.h);let total=0;
 for(let i=0;i<cumulative.length;i++){
  const eligible=env.medium==='colour'||env.mask[i]>.35,err=target.subarray(i*3,i*3+3).reduce((s,v,c)=>s+(v-state.canvas[i*3+c])**2,0)/3;
  const focal=stage===3?1+env.priority[i]*4:1+env.priority[i];
  const activity=stage===3?.18+env.priority[i]+env.edge[i]*.6:1;
  total+=eligible?(err+.00015)*focal*activity:0;cumulative[i]=total;
 }return {cumulative,total};
}
function sample(dist,r){let a=0,b=dist.cumulative.length-1,t=r()*dist.total;while(a<b){const m=(a+b)>>1;if(dist.cumulative[m]<t)a=m+1;else b=m;}return a;}

/** Conservative distance to paper prevents broad drawing marks crossing the silhouette. */
export function drawingClearance(env){
 if(env.clearance)return env.clearance;
 const d=Float32Array.from(env.mask,(v,i)=>v>.35?Math.min(i%env.w+1,env.w-i%env.w,Math.floor(i/env.w)+1,env.h-Math.floor(i/env.w)):0);
 for(let y=0;y<env.h;y++)for(let x=0;x<env.w;x++){const i=y*env.w+x;if(x)d[i]=Math.min(d[i],d[i-1]+1);if(y)d[i]=Math.min(d[i],d[i-env.w]+1);if(x&&y)d[i]=Math.min(d[i],d[i-env.w-1]+1);if(x+1<env.w&&y)d[i]=Math.min(d[i],d[i-env.w+1]+1);}
 for(let y=env.h-1;y>=0;y--)for(let x=env.w-1;x>=0;x--){const i=y*env.w+x;if(x+1<env.w)d[i]=Math.min(d[i],d[i+1]+1);if(y+1<env.h)d[i]=Math.min(d[i],d[i+env.w]+1);if(x&&y+1<env.h)d[i]=Math.min(d[i],d[i+env.w-1]+1);if(x+1<env.w&&y+1<env.h)d[i]=Math.min(d[i],d[i+env.w+1]+1);}
 return env.clearance=d;
}

export function featuresFor(env,state,a,phase){
 const stage=stageFor(phase),target=stageTarget(env,stage),i=a.y*env.w+a.x,centre=pixel(target,i),current=pixel(state.canvas,i),radius=Math.max(0,Math.floor(a.width*.45)),mean=[0,0,0],square=[0,0,0];let n=0,coarse=[0,0,0];
 for(let y=Math.max(0,a.y-radius);y<=Math.min(env.h-1,a.y+radius);y++)for(let x=Math.max(0,a.x-radius);x<=Math.min(env.w-1,a.x+radius);x++){
  const j=y*env.w+x;for(let c=0;c<3;c++){const v=target[j*3+c];mean[c]+=v;square[c]+=v*v;}n++;
 }for(let c=0;c<3;c++)mean[c]/=n;
 a.color=mean.map((v,c)=>clamp(v+(a.jitter?.[c]??0)));
 if(a.ti===2)a.color=a.color.map((v,c)=>v*.6+[.53,.25,.16][c]*.4);
 if(a.ti===3||a.ti===12)a.color=a.color.map((v,c)=>v*.7+[.17,.12,.08][c]*.3);
 if(a.ti===9)a.color=a.color.map((v,c)=>v*.35+env.paper[c]*.65);
 if(a.ti===10)a.color=[...env.paper];
 if(a.ti===11)a.color=a.color.map(v=>v*.7+.28*.3);
 let neighbours=0;for(let y=Math.max(0,a.y-1);y<=Math.min(env.h-1,a.y+1);y++)for(let x=Math.max(0,a.x-1);x<=Math.min(env.w-1,a.x+1);x++){for(let c=0;c<3;c++)coarse[c]+=state.canvas[(y*env.w+x)*3+c];neighbours++;}
 coarse=coarse.map(v=>v/neighbours);
 const old=centre.reduce((s,v,c)=>s+(v-current[c])**2,0)/3,material=tools[a.ti].material,effective=['glaze','wash','sidelead'].includes(material)?a.alpha*.6:['drybrush','chalk','graphite','metalpoint'].includes(material)?a.alpha*.4:a.alpha;
 const after=centre.reduce((s,v,c)=>s+(v-current[c]*(1-effective)-a.color[c]*effective)**2,0)/3;
 const variation=square.reduce((s,v,c)=>s+Math.sqrt(Math.max(0,v/n-mean[c]**2)),0)/3,l=value(centre),scale=env.w/40;
 return [Math.sqrt(old),(old-after)*4,l,variation,env.edge[i],env.coherence[i],env.priority[i],phase,a.width/(6*scale),a.length/(8*scale),a.alpha,Math.sqrt(a.color.reduce((s,v,c)=>s+(v-centre[c])**2,0)/3),env.mask[i],+(env.medium==='colour'),+(env.artist==='leonardo'),+(env.artist==='durer'),+(env.artist==='rembrandt'),a.x/env.w,a.y/env.h,value(current),a.pressure,env.profile.affinity[a.ti],Math.cos(a.theta-env.angle[i]),...tools.map((_,j)=>+(j===a.ti)),...[0,1,2,3].map(j=>+(j===stage)),Math.sqrt(coarse.reduce((s,v,c)=>s+(v-env.under[i*3+c])**2,0)/3),value(pixel(env.under,i)),env.edge[i]*(.2+.8*env.priority[i]),env.priority[i]*a.width/(6*scale),+(l<.4),+(l>.72),Math.min(1,state.coverage[i]/4),Math.min(2,a.length/Math.max(.1,a.width))/2];
}

export function propose(env,state,phase,random,dist,chosenTool='auto',count=16){
 const stage=stageFor(phase),kit=env.medium==='colour'?env.profile.colourKits:env.profile.drawingKits;
 const allowed=chosenTool==='auto'?kit[stage]:tools.map((t,i)=>t.id===chosenTool&&t.media.includes(env.medium)?i:-1).filter(i=>i>=0);
 if(!allowed.length)throw new Error('Choose a tool available for this medium.');
 const actions=[],features=[],unit=env.w/40;
 for(let c=0;c<count;c++){
  const i=sample(dist,random),ti=allowed[Math.floor(random()*allowed.length)],tool=tools[ti],progressScale=(2.4*(1-phase)**2+.28)*unit,
   focal=env.priority[i],size=progressScale*(.8+random()*.4)*(1-focal*(stage>1?.45:.10));
  const a={x:i%env.w,y:Math.floor(i/env.w),ti,width:tool.width*size,length:tool.length*size,alpha:clamp(tool.alpha*(.7+random()*.35),.08,.9),pressure:.65+random()*.45,theta:env.angle[i]+random()*.6-.3,curve:random()*.34-.17,jitter:[random()*.014-.007,random()*.014-.007,random()*.014-.007]};
  // Cross-hatching is confined to dark form; graphite is an adaptation, not engraving.
  if(env.artist==='durer'&&env.medium==='graphite'&&value(pixel(env.target,i))<.45&&c%3===0)a.theta+=1.05;
  if(env.medium==='graphite'){const limit=drawingClearance(env)[i]*.8,extent=a.length*.55+a.width*a.pressure*.65,scale=Math.min(1,limit/Math.max(.01,extent));a.width*=scale;a.length*=scale;}
  features.push(featuresFor(env,state,a,phase));actions.push(a);
 }return {actions,features};
}

export function actionGeometry(a,scale=1){
 const co=Math.cos(a.theta),si=Math.sin(a.theta),p=[],pressure=[];
 for(let k=0;k<=8;k++){
  const t=k/8,along=(t-.5)*a.length,bend=2*a.curve*a.length*t*(1-t);
  p.push([(a.x+co*along-si*bend)*scale,(a.y+si*along+co*bend)*scale]);
  pressure.push(a.pressure*(.45+.55*Math.sin(Math.PI*(.06+.88*t))));
 }return {p,pressure};
}
function patchLoss(env,canvas,target,x0,y0,x1,y1){
 let pixelLoss=0,structure=0,mass=0;
 for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++){
  const i=y*env.w+x,weight=1+env.priority[i]*2,l=value(pixel(canvas,i)),t=value(pixel(target,i));
  for(let c=0;c<3;c++)pixelLoss+=(canvas[i*3+c]-target[i*3+c])**2*weight/3;
  for(const j of [x+1<x1?i+1:-1,y+1<y1?i+env.w:-1])if(j>=0)structure+=((l-value(pixel(canvas,j)))-(t-value(pixel(target,j))))**2*(.4+env.edge[i]+env.priority[i]);
 }
 for(let y=y0;y<y1;y+=4)for(let x=x0;x<x1;x+=4){const a=[0,0,0],b=[0,0,0];let n=0;for(let yy=y;yy<Math.min(y+4,y1);yy++)for(let xx=x;xx<Math.min(x+4,x1);xx++){const i=yy*env.w+xx;for(let c=0;c<3;c++){a[c]+=canvas[i*3+c];b[c]+=target[i*3+c];}n++;}for(let c=0;c<3;c++)mass+=(a[c]/n-b[c]/n)**2*n/3;}
 return (.65*pixelLoss+.20*structure+.15*mass)/(env.w*env.h);
}
export function loss(env,canvas){return patchLoss(env,canvas,env.target,0,0,env.w,env.h);}

/** Observation uses the same polyline, taper, layer bands and bristles as vector output. */
export function execute(env,state,a,phase){
 const geometry=actionGeometry(a),stroke={...geometry,width:a.width,alpha:a.alpha,color:a.color,material:tools[a.ti].material},marks=materialPrimitives(stroke),r=Math.ceil(a.length+a.width+4),
  x0=Math.max(0,Math.floor((a.x-r)/4)*4),y0=Math.max(0,Math.floor((a.y-r)/4)*4),x1=Math.min(env.w,Math.ceil((a.x+r+1)/4)*4),y1=Math.min(env.h,Math.ceil((a.y+r+1)/4)*4),target=stageTarget(env,stageFor(phase));
 const before=patchLoss(env,state.canvas,target,x0,y0,x1,y1);
 for(const m of marks){const maxWidth=Math.max(...m.widths),bx0=Math.max(0,Math.floor(Math.min(...m.p.map(p=>p[0]))-maxWidth*.5-1)),bx1=Math.min(env.w-1,Math.ceil(Math.max(...m.p.map(p=>p[0]))+maxWidth*.5+1)),by0=Math.max(0,Math.floor(Math.min(...m.p.map(p=>p[1]))-maxWidth*.5-1)),by1=Math.min(env.h-1,Math.ceil(Math.max(...m.p.map(p=>p[1]))+maxWidth*.5+1));
  const color=typeof m.color==='string'?[1,3,5].map(k=>parseInt(m.color.slice(k,k+2),16)/255):m.color;
  for(let y=by0;y<=by1;y++)for(let x=bx0;x<=bx1;x++){
   const px=x+(env.observationOffset??0),py=y+(env.observationOffset??0);
   let distance=Infinity,localWidth=0;for(let k=1;k<m.p.length;k++){const start=m.p[k-1],end=m.p[k],dx=end[0]-start[0],dy=end[1]-start[1],d2=dx*dx+dy*dy||1,t=clamp(((px-start[0])*dx+(py-start[1])*dy)/d2),width=m.widths[k-1]+(m.widths[k]-m.widths[k-1])*t,d=Math.hypot(px-start[0]-t*dx,py-start[1]-t*dy)-width/2;if(d<distance){distance=d;localWidth=width;}}
   const opacity=clamp(.5-distance)*Math.min(1,localWidth)*m.alpha;
   if(opacity===0)continue;const i=y*env.w+x;for(let c=0;c<3;c++)state.canvas[i*3+c]=state.canvas[i*3+c]*(1-opacity)+color[c]*opacity;state.coverage[i]+=opacity;
  }
 }
 const gain=before-patchLoss(env,state.canvas,target,x0,y0,x1,y1),affinity=env.profile.affinity[a.ti];
 return gain*(.8+.2*affinity)-profiles.loss.mark_cost*(1+a.width/(env.w/40)*.12);
}
export function pathFor(env,a,stage){const scale=800/env.w,geometry=actionGeometry(a,scale);geometry.p=geometry.p.map(([x,y])=>[clamp(x,0,800),clamp(y,0,960)]);return {...geometry,width:a.width*scale,alpha:a.alpha,color:'#'+a.color.map(v=>Math.round(clamp(v)*255).toString(16).padStart(2,'0')).join(''),pass:stage,material:tools[a.ti].material,tool:tools[a.ti].tool,toolId:tools[a.ti].id,kind:'studio '+env.profile.stages[stage],grammar:'studio-materials-v2',tooth:0,grain:0,priority:env.priority[a.y*env.w+a.x],length:pathLength(geometry.p)};}
