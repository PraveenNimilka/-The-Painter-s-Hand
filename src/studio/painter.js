import {makeStudioPlan,stageFor} from './plan.js';
import {observation,samplingDistribution,propose,execute,pathFor,loss} from './environment.js';
import {choose,checkpointForStudio,deployment} from './policy.js';
import {rng} from '../strokes/geometry.js';
export function compileStudio(input,options,onBatch,analysis,weights){
 const checkpoint=checkpointForStudio(options.engine,options.artist,options.medium);weights??=checkpoint.weights;
 if(!checkpoint.trained)throw new Error('The studio policy has not been trained.');
 const source=checkpoint.training.base_training_episodes?'extended':'previous';
 const policy={format:checkpoint.format,grammar:checkpoint.grammar,...checkpoint.training,source,checkpoint_sha256:source==='extended'?deployment.extended_checkpoint_sha256:deployment.previous_checkpoint_sha256};
 if(options.shading===0||analysis.fields.raw.every(v=>v>.985))return {strokes:[],face:analysis.face,stats:{strokeCount:0,distance:0,materials:[],studioActions:0,policy},options};
 const env=makeStudioPlan(input,analysis,options),state=observation(env),random=rng(733187),budget=options.budget??Math.round(1000+options.detail*64),strokes=[],batch=[],toolCounts={},stageCounts=[0,0,0,0];let reward=0,dist;
 for(let step=0;step<budget;step++){
  const phase=step/budget,stage=stageFor(phase);
  // Same per-action residual refresh schedule as training, with normalized geometry.
  dist=samplingDistribution(env,state,stage);if(dist.total<1e-9)break;
  const candidates=propose(env,state,phase,random,dist,options.selectedTool??'auto'),a=candidates.actions[choose(candidates.features,env.artist,weights,checkpoint)];
  reward+=execute(env,state,a,phase);const path=pathFor(env,a,stage);if(path.length<.25)continue;
  strokes.push(path);batch.push(path);stageCounts[stage]++;toolCounts[path.toolId]=(toolCounts[path.toolId]||0)+1;
  if(batch.length>=128)onBatch(batch.splice(0));
 }if(batch.length)onBatch(batch.splice(0));
 return {strokes,face:analysis.face,options,stats:{strokeCount:strokes.length,distance:strokes.reduce((s,p)=>s+p.length,0),materials:[...new Set(strokes.map(p=>p.material))],studioActions:strokes.length,toolCounts,stageCounts,policy,intent:env.intent,planningGrid:[env.w,env.h],surrogateReward:reward,surrogateLoss:loss(env,state.canvas)}};
}
