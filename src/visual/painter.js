import {CanvasEnvironment} from './environment.js';
import {checkpoint,globalEncode,encode,workerScores,managerScores} from './policy.js';
export function observation(env,r,size=32){
 const surface=env.crop;surface.width=size;surface.height=size;
 const ctx=surface.getContext('2d',{willReadFrequently:true});ctx.drawImage(env.targetCanvas,r.x,r.y,r.w,r.h,0,0,size,size);const target=ctx.getImageData(0,0,size,size).data;
 ctx.drawImage(env.art,r.x,r.y,r.w,r.h,0,0,size,size);const current=ctx.getImageData(0,0,size,size).data,out=new Uint8Array(size*size*6);
 for(let i=0;i<size*size;i++)for(let c=0;c<3;c++){out[i*6+c]=target[i*4+c];out[i*6+3+c]=current[i*4+c];}return out;
}
export async function compileVisual(source,options={},onBatch=()=>{},model=checkpoint,hooks={}){
 options={...options,progressRule:options.progressRule??'attempts'};
 const method=options.method??'visual',learned=method==='visual';if(learned&&!model.trained&&!hooks.allowUntrained)throw Error('The visual policy has no selected trained checkpoint.');
 const env=new CanvasEnvironment(source,options),budget=options.budget??Math.round(1000+(options.detail??70)*64),batch=[],counts={attempts:0,rejected:0,regionDecisions:0,candidateTrials:0,acceptedMarks:0},regionLog=[];
 let region,context,global,memory=new Float32Array(256);const start=performance.now();
 // Comparisons match accepted marks; all rejection/optimizer trials are also counted.
 const maxAttempts=options.maxAttempts??budget*4;
 const blank=source.rgba.every((v,i)=>i%4===3||v>251);
 while(!blank&&options.shading!==0&&env.strokes.length<budget&&counts.attempts<maxAttempts){
  if(hooks.cancelled?.())throw Error('Painting cancelled');const phase=Math.min(1,(options.progressRule==='attempts'?counts.attempts:env.strokes.length)/budget);let newOption=false;
  if(counts.attempts%8===0||!region){
   newOption=true;
   const eligible=env.regions(phase).map(r=>({r,...env.regionSummary(r,phase)})).sort((a,b)=>b.score-a.score).slice(0,12);
   if(!eligible.length||eligible[0].score<1e-8)break;
   let selected=0;
   if(learned){global=globalEncode(observation(env,{x:0,y:0,w:env.w,h:env.h},8),model);const scores=managerScores(global,eligible.map(q=>q.context),model);selected=scores.indexOf(Math.max(...scores));}
   const choice=eligible[selected];region=choice.r;context=choice.context;env.visits.set(choice.key,(env.visits.get(choice.key)??0)+1);counts.regionDecisions++;regionLog.push({region,phase,score:choice.score});
   if(learned)memory=encode(observation(env,region),global,memory,model);
  }
  const proposals=env.proposals(region,phase),records=[];let chosen,trial;
  if(learned){
   const scores=workerScores(memory,global,context,proposals.map(a=>env.actionFeatures(a,region)),model);const order=scores.map((score,i)=>({score,i})).sort((a,b)=>b.score-a.score);
   // Optional explicit lookahead is separately attributed, never called a learned gain.
   const lookahead=options.lookahead??1;
   for(const q of order.slice(0,lookahead)){const candidate=proposals[q.i],t=env.trial(candidate);counts.candidateTrials++;if(!trial||t.gain>trial.gain){chosen=candidate;trial=t;}}
  }else{
   for(const a of proposals){const t=env.trial(a);counts.candidateTrials++;records.push({action:env.actionFeatures(a,region),gain:t.gain});if(!trial||t.gain>trial.gain){chosen=a;trial=t;}}
   if(method==='optimize'&&chosen)for(const ratio of [.65,1.4]){const a={...chosen,width:chosen.width*ratio},t=env.trial(a);counts.candidateTrials++;if(t.gain>trial.gain){chosen=a;trial=t;}}
  }
  counts.attempts++;if(hooks.onDecision)await hooks.onDecision({region,context,records,gain:trial?.gain??0,phase,newOption,...(hooks.captureObservations&&newOption?{localObservation:observation(env,region),globalObservation:observation(env,{x:0,y:0,w:env.w,h:env.h},8)}:{})});
  if(!trial||trial.gain<=1e-10){counts.rejected++;if(options.optionRule!=='fixed8')region=null;}else{env.commit(chosen);batch.push(chosen);counts.acceptedMarks++;}
  if(batch.length>=32)onBatch(batch.splice(0));
  if(counts.attempts%8===0)await new Promise(resolve=>setTimeout(resolve,0));
 }
 if(batch.length)onBatch(batch.splice(0));
 return {strokes:env.strokes,face:null,options,stats:{strokeCount:env.strokes.length,distance:env.strokes.reduce((sum,a)=>sum+a.length,0),canvas:{width:source.w,height:source.h},sourceResolution:{width:source.sourceWidth??source.w,height:source.sourceHeight??source.h,detailSupported:source.detailSupported??true},policy:learned?{...model.training,source:'visual',inference_parameters:model.parameters.inference}:null,method,...counts,regionLog,metrics:env.metrics(),compileMs:performance.now()-start,materials:[...new Set(env.strokes.map(s=>s.material))],studioActions:counts.attempts,finishing:'Recorded native-coordinate material actions; authored artist plan; optional lookahead reported separately'}};
}
