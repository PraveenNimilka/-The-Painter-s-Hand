import {tools} from '../studio/tools.js';
import {stageFor} from '../studio/plan.js';
import {clamp} from '../vision/fields.js';
import {value} from '../learning/plan.js';
import {actionGeometry,pathFor,drawingClearance} from '../studio/environment.js';
import {paletteFor,paletteBlend} from './pigments.js';
export const featureNames=['residual','gain','value','variation','edge','coherence','focal','progress','width','length','opacity','pigment_distance','subject','colour','x','y','canvas_value','pressure','alignment','curve',...['leonardo','durer','rembrandt'],...tools.map(t=>t.id),...['ground','masses','modelling','accents'],...['target','canvas','under'].flatMap(v=>['r','g','b'].map(c=>v+'_'+c)),...Array.from({length:9},(_,i)=>'patch_'+i),'coverage','freedom','fidelity','global_residual','global_value','global_edge'];
export const artists=['leonardo','durer','rembrandt'];
export function prepare(env,options){env.freedom=(options.interpretation??80)/100;env.fidelity=(options.fidelity??25)/100;env.pigments=paletteFor(env.artist,options.palette);return env;}
const at=(a,env,x,y,c)=>a[(Math.max(0,Math.min(env.h-1,y))*env.w+Math.max(0,Math.min(env.w-1,x)))*3+c];
export function featuresFor(env,state,a,phase){
 const i=a.y*env.w+a.x,n=env.w*env.h,target=Array.from(env.target.subarray(i*3,i*3+3)),current=Array.from(state.canvas.subarray(i*3,i*3+3)),under=Array.from(env.under.subarray(i*3,i*3+3)),radius=Math.max(0,Math.floor(a.width*.45)),patch=[],mean=[0,0,0];
 for(const dy of [-1,0,1])for(const dx of [-1,0,1]){const rgb=[0,1,2].map(c=>at(env.target,env,a.x+dx*radius,a.y+dy*radius,c));patch.push(value(rgb));for(let c=0;c<3;c++)mean[c]+=rgb[c]/9;}
 a.color=mean;if(env.medium==='colour'){const blend=paletteBlend(mean,env.pigments??paletteFor(env.artist),env.freedom*(1-env.fidelity)*.25);a.color=blend.color;a.paletteMix=blend.mix;}
 if(a.ti===2){a.color=a.color.map((v,c)=>v*.6+[.53,.25,.16][c]*.4);if(a.paletteMix)a.paletteMix.toolTint={rgb:[.53,.25,.16],amount:.4};}
 if(a.ti===3||a.ti===12){a.color=a.color.map((v,c)=>v*.7+[.17,.12,.08][c]*.3);if(a.paletteMix)a.paletteMix.toolTint={rgb:[.17,.12,.08],amount:.3};}
 if(a.ti===11){a.color=a.color.map(v=>v*.7+.28*.3);if(a.paletteMix)a.paletteMix.toolTint={rgb:[.28,.28,.28],amount:.3};}
 if(a.ti===10){a.color=[...env.paper];delete a.paletteMix;}else if(a.ti===9){a.color=mean.map((v,c)=>v*.35+env.paper[c]*.65);delete a.paletteMix;}
 const old=target.reduce((s,v,c)=>s+(v-current[c])**2,0)/3,effective=a.alpha*.6,after=target.reduce((s,v,c)=>s+(v-current[c]*(1-effective)-a.color[c]*effective)**2,0)/3;
 let globalResidual=0,globalValue=0,globalEdge=0;
 // Global context is refreshed once per step and shared by all proposals.
 if(!state.context){for(let j=0;j<n;j++){for(let c=0;c<3;c++)globalResidual+=(env.target[j*3+c]-state.canvas[j*3+c])**2/(n*3);globalValue+=value(state.canvas.subarray(j*3,j*3+3))/n;globalEdge+=env.edge[j]/n;}state.context=[Math.sqrt(globalResidual),globalValue,globalEdge];}
 const average=patch.reduce((s,v)=>s+v,0)/9,variation=Math.sqrt(patch.reduce((s,v)=>s+(v-average)**2,0)/9),stage=stageFor(phase);
 return [Math.sqrt(old),(old-after)*4,value(target),variation,env.edge[i],env.coherence[i],env.priority[i],phase,a.width/(env.w/40*6),a.length/(env.w/40*8),a.alpha,Math.sqrt(a.color.reduce((s,v,c)=>s+(v-target[c])**2,0)/3),env.mask[i],+(env.medium==='colour'),a.x/env.w,a.y/env.h,value(current),a.pressure,Math.cos(a.theta-env.angle[i]),a.curve,...artists.map(v=>+(v===env.artist)),...tools.map((_,j)=>+(j===a.ti)),...[0,1,2,3].map(j=>+(j===stage)),...target,...current,...under,...patch,Math.min(1,state.coverage[i]/4),env.freedom,env.fidelity,...state.context];
}
export function propose(env,state,phase,random,dist,chosenTool='auto',count=16){
 const stage=stageFor(phase),unit=env.w/40,kits=env.medium==='colour'?env.profile.colourKits:[ [1,0],[1,0],[0,1],[0,9,10] ];
 let allowed=chosenTool==='auto'?kits[stage]:tools.map((t,i)=>t.id===chosenTool&&t.media.includes(env.medium)?i:-1).filter(i=>i>=0);
 if(!allowed.length)throw new Error('Tool is not available for this medium.');
 const actions=[],features=[];state.context=null;
 for(let c=0;c<count;c++){
  let lo=0,hi=dist.cumulative.length-1,t=random()*dist.total;while(lo<hi){const mid=(lo+hi)>>1;if(dist.cumulative[mid]<t)lo=mid+1;else hi=mid;}
  const i=lo,ti=allowed[Math.floor(random()*allowed.length)],tool=tools[ti],size=(2.6*(1-phase)**3+.12)*unit*(.8+random()*.4)*(1-env.priority[i]*.55),a={x:i%env.w,y:Math.floor(i/env.w),ti,width:tool.width*size,length:tool.length*size*(env.medium==='graphite'?1.65:1),alpha:clamp(tool.alpha*(.8+random()*.3),.08,.9),pressure:.65+random()*.4,theta:env.angle[i]+random()*.4-.2,curve:random()*.24-.12};
  if(env.medium==='graphite'&&env.artist==='durer'&&c%3===0&&value(env.target.subarray(i*3,i*3+3))<.45)a.theta+=1.05;
  // Reduce graphite breadth at observed edges; reserve bright paper.
  if(env.medium==='graphite'){a.width*=env.edge[i]>.35?.5:1;a.length=Math.min(a.length,unit*7);const extent=a.length*.55+a.width*a.pressure*.65,scale=Math.min(1,Math.min(drawingClearance(env)[i],unit*8)*.8/Math.max(.01,extent));a.width*=scale;a.length*=scale;}
  features.push(featuresFor(env,state,a,phase));actions.push(a);
 }return {actions,features};
}
export {actionGeometry,pathFor};
export function controlAction(env,action,raw){const a={...action},z=raw.map(Math.tanh);a.width*=Math.exp(z[0]*.35);a.length*=Math.exp(z[1]*.35);a.theta+=z[2]*.22;a.curve+=z[3]*.10;a.alpha=clamp(a.alpha*Math.exp(z[4]*.20),.08,.9);a.pressure=clamp(a.pressure+z[5]*.16,.4,1.25);if(env.medium==='graphite'){const limit=Math.min(drawingClearance(env)[a.y*env.w+a.x],env.w/40*8)*.8,extent=a.length*.55+a.width*a.pressure*.65,scale=Math.min(1,limit/Math.max(.01,extent));a.width*=scale;a.length*=scale;}return a;}
export function samplingDistribution(env,state,stage){const n=env.w*env.h,cumulative=new Float64Array(n);let total=0;for(let i=0;i<n;i++){let error=0;for(let c=0;c<3;c++)error+=(env.target[i*3+c]-state.canvas[i*3+c])**2/3;total+=(env.medium==='colour'||env.mask[i]>.35)?(error+.00015)*(1+env.priority[i]*(stage===3?4:1)):0;cumulative[i]=total;}return {cumulative,total};}
