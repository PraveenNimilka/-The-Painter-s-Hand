import {makeStudioPlan,stageFor} from '../studio/plan.js';
import {observation,execute,loss} from '../studio/environment.js';
import {prepare,propose,pathFor,samplingDistribution,controlAction} from './environment.js';
import {checkpoint,choose,geometryFor} from './policy.js';
import {rng,pathLength} from '../strokes/geometry.js';
import {chainContours} from '../strokes/contours.js';
import {shade} from '../strokes/shading.js';
import {ARTISTS} from '../strokes/artists.js';
import {sampleColour,analyzeColour,artistColour} from '../vision/colour.js';
import {selectFormMarks} from './finishing.js';
import {detailAccents} from './detail.js';
import {focalFeedback} from './feedback.js';
import {applyRefinedMark} from './quality.js';
export function compileAcademy(input,options,onBatch,analysis,model=checkpoint){
 if(!model.trained)throw new Error('Academy training has not completed. Select a preserved Studio model.');
 const refined=model.training.refinement?.startsWith('focal-detail-v')??false;
 const strokes=[],batch=[],counts={},budget=options.budget??Math.round(1000+(options.detail??70)*64),automatic=(options.selectedTool??'auto')==='auto',reserve=automatic?Math.floor(budget*(options.medium==='graphite'?.25:.10)):0;let decisions=0,policyRejected=0,feedback=null;
 const add=p=>{if(p.length<.4||strokes.length>=budget||feedback&&!feedback.accept(p))return;strokes.push(p);batch.push(p);counts[p.toolId]=(counts[p.toolId]??0)+1;if(batch.length>=128)onBatch(batch.splice(0));};
 if(options.shading===0||analysis.fields.raw.every(v=>v>.985))return finish();
 const env=prepare(makeStudioPlan(input,analysis,options),options),state=observation(env),random=rng(613379),policyBudget=budget-reserve;
 env.observationOffset=model.training.observation_pixel_offset??0;
 for(let step=0;step<policyBudget;step++){
  const phase=step/policyBudget,stage=stageFor(phase),dist=samplingDistribution(env,state,stage);if(dist.total<1e-9)break;
  const candidates=propose(env,state,phase,random,dist,options.selectedTool??'auto'),selected=choose(candidates.features,env.artist,model),a=controlAction(env,candidates.actions[selected],geometryFor(candidates.features[selected],env.artist,model));
  const safeguard=automatic&&model.training.refinement==='focal-detail-v2';
  if(safeguard&&!applyRefinedMark(env,state,a,phase)){policyRejected++;decisions++;continue;}
  if(!safeguard)execute(env,state,a,phase);add({...pathFor(env,a,stage),...(a.paletteMix?{paletteMix:a.paletteMix}:{})});decisions++;
 }
 // Observed continuous lines supply geometry that a low-resolution neural policy
 // cannot resolve. This is an explicit procedural finishing pass, not learned anatomy.
 if(automatic){
  if(refined)feedback=focalFeedback(makeStudioPlan(input,analysis,options,160,192),strokes);
  const colour=analyzeColour(input,analysis.subject),contours=chainContours(analysis.fields,analysis.subject,analysis.face,(options.detail??70)/70),artist=ARTISTS[options.artist];
  const finishLimit=model.training.refinement==='focal-detail-v2'?Math.min(budget,strokes.length+reserve):budget;
  const accentReserve=refined?Math.floor(reserve*.25):0,contourReserve=Math.floor(reserve*.35);
  if(options.medium==='graphite'){
   const finishRandom=rng(613380),formMarks=selectFormMarks(shade(analysis.fields,analysis.subject,analysis.face,{...artist,shadeAlpha:artist.shadeAlpha*(refined?.45:.65)},{...options,detail:Math.max(1,Math.min(100,options.detail??70))},finishRandom),analysis.fields,analysis.face,Math.max(0,finishLimit-contourReserve-accentReserve-strokes.length),finishRandom);
   for(const mark of formMarks){
    if(strokes.length>=finishLimit-contourReserve-accentReserve)break;const p=mark.p.map(([x,y])=>[x*2,y*2]);add({p,pressure:p.map((_,j)=>.3+.7*Math.sin(Math.PI*(.08+.84*j/(p.length-1)))),width:mark.width*1.3,alpha:mark.alpha,color:'#4c4945',pass:3,kind:'academy form-following pencil',material:'graphite',tool:'pencil',toolId:'hard-pencil',grammar:'studio-materials-v2',length:pathLength(p),tooth:0,grain:0,priority:mark.priority??0});
   }
  }
  for(const c of contours){
   if(strokes.length>=finishLimit-accentReserve)break;
   if(c.strength<.035&&(c.priority<.35||options.medium==='colour'))continue;
   if(options.medium==='colour'&&c.priority<.32)continue;
   const p=c.p.map(([x,y])=>[x*2,y*2]),rgb=sampleColour(colour,...c.p[Math.floor(c.p.length/2)]),color=options.medium==='graphite'?'#484642':artistColour(rgb,options.artist,(options.fidelity??25)/100);
   add({p,pressure:p.map((_,j)=>.25+.65*Math.sin(Math.PI*(.08+.84*j/(p.length-1)))),width:options.medium==='graphite'?artist.contourWidth*.85:1.1,alpha:options.medium==='graphite'?Math.min(.58,.14+c.strength*2):.24,pass:3,kind:'academy observed focal contour',material:options.medium==='graphite'?'graphite':'paint',tool:options.medium==='graphite'?'pencil':'brush',toolId:options.medium==='graphite'?'hard-pencil':'filbert',color,grammar:'studio-materials-v2',tooth:0,grain:0,priority:c.priority,length:pathLength(p)});
  }
  if(refined)for(const mark of detailAccents(input,analysis,colour,options,finishLimit-strokes.length))add(mark);
 }
 if(batch.length)onBatch(batch.splice(0));return finish(env,state);
 function finish(env,state){return {strokes,face:analysis.face,options,stats:{strokeCount:strokes.length,distance:strokes.reduce((s,p)=>s+p.length,0),toolCounts:counts,studioActions:decisions,policyRejected,materials:[...new Set(strokes.map(p=>p.material))],policy:{...model.training,format:model.format,source:'academy'},intent:env?.intent,planningGrid:env?[env.w,env.h]:null,surrogateLoss:env?loss(env,state.canvas):null,focalFeedback:feedback?.stats()??null,finishing:refined?'Procedural observed details with rendered focal safeguards (when OffscreenCanvas is available)':'Procedural observed contours and form-following pencil strokes'}};}
}
