import {spec,checkpointFor,selectAction} from './policy.js';
import {makePlan,value} from './plan.js';
import {rng,pathLength} from '../strokes/geometry.js';
import {hex} from '../vision/colour.js';
import {clamp} from '../vision/fields.js';
const pixel=(array,i)=>[array[i*3],array[i*3+1],array[i*3+2]];
export function candidateFeatures(env,canvas,a,phase){
 const i=a.y*env.w+a.x,center=pixel(env.target,i),current=pixel(canvas,i),radius=Math.max(env.observationVersion===1?1:0,Math.floor(a.width*.6));let mean=[0,0,0],square=[0,0,0],n=0;
 for(let y=Math.max(0,a.y-radius);y<Math.min(env.h,a.y+radius+1);y++)for(let x=Math.max(0,a.x-radius);x<Math.min(env.w,a.x+radius+1);x++){const q=pixel(env.target,y*env.w+x);for(let c=0;c<3;c++){mean[c]+=q[c];square[c]+=q[c]*q[c];}n++;}
 mean=mean.map(v=>v/n);let colour=mean;const ti=a.ti;
 if(ti===2)colour=colour.map((v,c)=>v*.30+[.53,.25,.16][c]*.70);
 if(ti===3)colour=colour.map((v,c)=>v*.55+[.17,.12,.08][c]*.45);
 if(ti===9)colour=colour.map((v,c)=>v*.25+spec.paper[c]*.75);
 if(ti===10)colour=[...spec.paper];
 a.color=colour.map((v,c)=>clamp(v+(a.jitter?.[c]||0)));
 const old=center.reduce((s,v,c)=>s+(v-current[c])**2,0)/3,material=spec.tools[ti].material,effective=['glaze','wash','sidelead','drybrush'].includes(material)?a.alpha*.55:a.alpha;
 const after=center.reduce((s,v,c)=>s+(v-(current[c]*(1-effective)+a.color[c]*effective))**2,0)/3;
 const variation=square.reduce((s,v,c)=>s+Math.sqrt(Math.max(0,v/n-mean[c]**2)),0)/3;
 return [Math.sqrt(old),(old-after)*4,value(center),variation,env.edge[i],env.coherence?.[i]??.8,env.priority[i],phase,a.width/6,a.length/6,a.alpha,Math.sqrt(a.color.reduce((s,v,c)=>s+(v-center[c])**2,0)/3),env.mask[i],Number(env.medium==='colour'),Number(env.artist==='leonardo'),Number(env.artist==='durer'),Number(env.artist==='rembrandt'),a.x/env.w,a.y/env.h,value(current),a.pressure,spec.artists[env.artist].affinity[ti],Math.cos(a.theta-env.angle[i]),...spec.tools.map((_,j)=>Number(j===ti))];
}
function distribution(env,canvas){const cumulative=new Float64Array(env.w*env.h);let total=0;for(let i=0;i<cumulative.length;i++){const target=pixel(env.target,i),eligible=env.medium==='colour'?value(target)<.97:env.mask[i]>.4;const error=target.reduce((s,v,c)=>s+(v-canvas[i*3+c])**2,0)/3;total+=eligible?(error*(1+env.priority[i]*2)+.0002):0;cumulative[i]=total;}return {cumulative,total};}
function sample(dist,random){let low=0,high=dist.cumulative.length-1,target=random()*dist.total;while(low<high){const mid=(low+high)>>1;if(dist.cumulative[mid]<target)low=mid+1;else high=mid;}return low;}
export function proposeActions(env,canvas,phase,random,dist,chosenTool='auto',count=16){
 const allowed=chosenTool==='auto'?spec.kits[env.artist][env.medium]:spec.tools.map((tool,i)=>({tool,i})).filter(({tool})=>tool.id===chosenTool).map(v=>v.i);
 if(!allowed.length)throw new Error('Tool is unavailable');
 const actions=[],features=[];
 for(let c=0;c<count;c++){const i=sample(dist,random),y=Math.floor(i/env.w),x=i%env.w,ti=allowed[Math.floor(random()*allowed.length)],tool=spec.tools[ti],scale=(2.2*(1-phase)**2+.22)*(.7+random()*.6);
  const a={x,y,ti,width:tool.width*scale,length:tool.length*scale,pressure:.68+random()*.44,alpha:clamp(tool.alpha*(.75+random()*.4),.1,.98),theta:env.angle[i]+random()*.9-.45,curve:random()*.6-.3,jitter:[random()*.03-.015,random()*.03-.015,random()*.03-.015]};
  features.push(candidateFeatures(env,canvas,a,phase));actions.push(a);
 }return {actions,features};
}
/** Low-resolution action simulator for the policy's current-canvas observation. */
export function executeAction(env,canvas,a){
 const {w,h}=env,co=Math.cos(a.theta),si=Math.sin(a.theta),radius=Math.ceil(a.length*.6+a.width+2),width=a.width*a.pressure,alpha=a.alpha,material=spec.tools[a.ti].material;
 let marks=material==='glaze'||material==='wash'||material==='sidelead'?[[width,alpha*.42,a.color,0],[width*.68,alpha*.48,a.color,0],[width*.38,alpha*.35,a.color,0]]:material==='drybrush'?[-1,0,1].map(k=>[width*.23,alpha*.72,a.color,k*width*.28]):material==='impasto'?[[width,alpha,a.color,0],[width*.25,alpha*.32,[242/255,227/255,196/255],0]]:[[width,alpha,a.color,0]];
 let gain=0;
 for(let y=Math.max(0,a.y-radius);y<Math.min(h,a.y+radius+1);y++)for(let x=Math.max(0,a.x-radius);x<Math.min(w,a.x+radius+1);x++){
  const i=y*w+x,along=(x-a.x)*co+(y-a.y)*si,across=-(x-a.x)*si+(y-a.y)*co,bend=a.curve*a.length*(1-clamp(along/(a.length/2+.001),-1,1)**2),old=pixel(canvas,i);
  for(const [mw,ma,color,shift]of marks){const distance=Math.hypot(Math.max(Math.abs(along)-a.length/2,0),across-bend-shift);let coverage=clamp(mw/2+.5-distance);if(env.medium==='graphite')coverage*=env.mask[i];const opacity=coverage*ma;for(let c=0;c<3;c++)canvas[i*3+c]=canvas[i*3+c]*(1-opacity)+color[c]*opacity;}
  for(let c=0;c<3;c++)gain+=((old[c]-env.target[i*3+c])**2-(canvas[i*3+c]-env.target[i*3+c])**2)*(1+env.priority[i]*2);
 }return gain/(w*h)*(.6+.4*spec.artists[env.artist].affinity[a.ti])-.000003*(a.width*.12+1);
}
export function actionStroke(env,a,step,budget,random){
 const scale=800/env.w,co=Math.cos(a.theta),si=Math.sin(a.theta),start=[a.x-co*a.length/2,a.y-si*a.length/2],end=[a.x+co*a.length/2,a.y+si*a.length/2],control=[a.x-si*2*a.curve*a.length,a.y+co*2*a.curve*a.length],p=[];
 for(let k=0;k<=6;k++){const t=k/6;p.push([clamp(((1-t)**2*start[0]+2*(1-t)*t*control[0]+t*t*end[0])*scale,0,800),clamp(((1-t)**2*start[1]+2*(1-t)*t*control[1]+t*t*end[1])*scale,0,960)]);}
 const tool=spec.tools[a.ti],phase=step/budget;return {p,pressure:p.map(()=>a.pressure),width:a.width*scale,alpha:a.alpha,color:hex(a.color),material:tool.material,tool:tool.tool,toolId:tool.id,kind:'learned '+tool.id,pass:phase<.25?0:phase<.7?2:3,tooth:0,grain:random(),priority:env.priority[a.y*env.w+a.x],length:pathLength(p)};
}
export function compileLearned(input,options,onBatch,analysis,weights){
 const checkpoint=checkpointFor(options.finish);weights??=checkpoint.weights;
 const policy={format:checkpoint.format,...checkpoint.training,observation_version:checkpoint.observation_version};
 if(!checkpoint.trained)throw new Error('The learned checkpoint is unavailable');
 const blank=analysis.fields.raw.every(v=>v>.985);if(blank||options.shading===0)return {strokes:[],face:analysis.face,stats:{strokeCount:0,distance:0,materials:[],learnedActions:0,policy},options};
 const env=makePlan(input,analysis,options),canvas=new Float32Array(env.target.length);env.observationVersion=checkpoint.observation_version;for(let i=0;i<canvas.length;i++)canvas[i]=spec.paper[i%3];
 const random=rng(423873),budget=options.budget??Math.round(1800+options.detail*96),strokes=[],batch=[],toolCounts={};let dist=distribution(env,canvas),reward=0;
 for(let step=0;step<budget;step++){
  if(step%8===0)dist=distribution(env,canvas);if(dist.total<1e-8)break;
  const {actions,features}=proposeActions(env,canvas,step/budget,random,dist,options.selectedTool??'auto');const decision=selectAction(features,weights),a=actions[decision.index];reward+=executeAction(env,canvas,a);
  const stroke=actionStroke(env,a,step,budget,random);if(stroke.length<1)continue;strokes.push(stroke);batch.push(stroke);toolCounts[stroke.toolId]=(toolCounts[stroke.toolId]||0)+1;if(batch.length>=128)onBatch(batch.splice(0));
 }if(batch.length)onBatch(batch.splice(0));
 return {strokes,face:analysis.face,stats:{strokeCount:strokes.length,distance:strokes.reduce((s,a)=>s+a.length,0),materials:[...new Set(strokes.map(s=>s.material))],learnedActions:strokes.length,toolCounts,policy,planningGrid:[env.w,env.h],surrogateReward:reward},options};
}
