import {checkpoint,rectangles,selectRegion} from './policy.js';
import {regionFeatures,areaView,resamplePigment,materialLayer,compositeLayer,contribution,neutralKits,affectedRectangle} from './environment.js';
import {makeStudioPlan,stageFor} from '../studio/plan.js';
import {observation} from '../studio/environment.js';
import {prepare,propose,samplingDistribution,controlAction,pathFor} from '../academy/environment.js';
import {choose,geometryFor} from '../academy/policy.js';
import {rng,pathLength} from '../strokes/geometry.js';
export function compileHierarchical(input,options,onBatch,analysis,model=checkpoint){
 if(!model.trained)throw new Error('Hierarchical training has not selected a trained policy.');
 const reconstruction=(options.task??'reconstruction')==='reconstruction',settings=reconstruction?{...options,interpretation:0,fidelity:100,shading:100}:options;
 const env=makeStudioPlan(input,analysis,settings,400,480);
 if(reconstruction&&options.medium==='colour')for(let i=0;i<env.target.length;i++)env.target[i]=options.background===false?env.target[i]:env.source[i];
 const state=observation(env),strokes=[],batch=[],cached=new Map(),random=rng(20261012),budget=options.budget??Math.round(1000+(options.detail??70)*64),optionCounts=Array(30).fill(0);let region=0,rejected=0,decisions=0;
 if(!reconstruction&&options.shading===0||analysis.fields.raw.every(v=>v>.985))return finish();
 for(let step=0;step<budget;step++){
  const phase=step/budget;if(step%model.option_steps===0){region=selectRegion(regionFeatures(env,state,phase),model);optionCounts[region]++;}
  const r=rectangles[region];let local=cached.get(region);
  if(!local){local={...env,w:80,h:96,profile:{...env.profile,colourKits:neutralKits},clearance:new Float32Array(80*96).fill(16),observationOffset:.5};for(const field of ['target','priority','edge','angle','coherence','mask'])local[field]=areaView(env[field],field==='target'?3:1,r);local.under=local.target;prepare(local,{...settings,interpretation:0,fidelity:100});cached.set(region,local);}
  const current={canvas:areaView(state.canvas,3,r),coverage:areaView(state.coverage,1,r)},dist=samplingDistribution(local,current,stageFor(phase));if(dist.total<1e-9){decisions++;rejected++;continue;}
  const candidates=propose(local,current,phase,random,dist,options.selectedTool??'auto'),selected=choose(candidates.features,env.artist,model.worker),a=controlAction(local,candidates.actions[selected],geometryFor(candidates.features[selected],env.artist,model.worker));
  const clearance=Math.min(a.x+.5,80-a.x-.5,a.y+.5,96-a.y-.5)*.8,extent=a.length*.55+a.width*a.pressure*.65,scale=Math.min(1,clearance/Math.max(.01,extent));a.width*=scale;a.length*=scale;resamplePigment(local,a);
  const layer=materialLayer(a,model.material_sampling),patch=affectedRectangle(r,layer);decisions++;if(!patch){rejected++;continue;}const before=contribution(env,state,patch),saved=new Float32Array(patch.w*patch.h*3),coverage=new Float32Array(patch.w*patch.h);for(let y=0;y<patch.h;y++){const i=(patch.y+y)*400+patch.x;saved.set(state.canvas.subarray(i*3,(i+patch.w)*3),y*patch.w*3);coverage.set(state.coverage.subarray(i,i+patch.w),y*patch.w);}
  compositeLayer(state,r,layer);
  if(contribution(env,state,patch)>before+1e-10){for(let y=0;y<patch.h;y++){const i=(patch.y+y)*400+patch.x;state.canvas.set(saved.subarray(y*patch.w*3,(y+1)*patch.w*3),i*3);state.coverage.set(coverage.subarray(y*patch.w,(y+1)*patch.w),i);}rejected++;continue;}
  const path=pathFor(local,a,stageFor(phase)),scaleX=r.w/400;path.p=path.p.map(([x,y])=>[r.x*2+x*scaleX,r.y*2+y*scaleX]);path.width*=scaleX;path.length=pathLength(path.p);path.kind='hierarchical '+(reconstruction?'reconstruction':'authored artist interpretation');
  // Even subpixel accepted marks remain executable paths and must be exported.
  if(path.length>0){strokes.push(path);batch.push(path);if(batch.length===128)onBatch(batch.splice(0));}
 }
 if(batch.length)onBatch(batch.splice(0));return finish();
 function finish(){return {strokes,face:analysis.face,options,stats:{strokeCount:strokes.length,distance:strokes.reduce((s,p)=>s+p.length,0),policy:{...model.training,format:model.format,source:'hierarchy',inference_parameters:12979},planningGrid:[400,480],studioActions:decisions,policyRejected:rejected,optionCounts,hierarchy:{optionSteps:model.option_steps,optionSchedule:model.option_schedule??null,materialSampling:model.material_sampling??'legacy-width-damping',regions:30,workingGrid:[80,96],task:reconstruction?'reconstruction':'authored artist interpretation',effectiveSettings:{interpretation:settings.interpretation,fidelity:settings.fidelity,shading:settings.shading}},materials:[...new Set(strokes.map(s=>s.material))],finishing:'Accepted learned worker marks; no procedural contour finishing'}};}
}
