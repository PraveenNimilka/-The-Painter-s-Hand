import profiles from './profiles.json' with {type:'json'};
import corpus from '../../training/studio/corpus/manifest.json' with {type:'json'};
import {spec} from '../learning/policy.js';
import {rgb,value} from '../learning/plan.js';
import {blur,clamp} from '../vision/fields.js';
import {featurePriority} from '../vision/face.js';
export {profiles};

/** Artistic intent fields, separate from executable marks and material rendering. */
export function makeStudioPlan(input,analysis,options,w=80,h=96){
 const n=w*h,source=new Float32Array(n*3),mask=new Float32Array(n),priority=new Float32Array(n),edge=new Float32Array(n),angle=new Float32Array(n),coherence=new Float32Array(n),tone=new Float32Array(n);
 const profile=profiles.artists[options.artist],creativity=clamp((options.interpretation??80)/100),fidelity=clamp((options.fidelity??25)/100),strength=clamp((options.shading??80)/100),face=analysis.face;
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
  const i=y*w+x,sx=(x+.5)*input.w/w,sy=(y+.5)*input.h/h,j=clamp(Math.floor(sy),0,input.h-1)*input.w+clamp(Math.floor(sx),0,input.w-1);
  for(let c=0;c<3;c++)source[i*3+c]=input.rgba[j*4+c]/255;
  tone[i]=value(source.subarray(i*3,i*3+3));mask[i]=analysis.subject[j];edge[i]=clamp(analysis.fields.mag[j]*6);angle[i]=analysis.fields.angle[j];coherence[i]=analysis.fields.coherence[j];
  let focal=0;if(face){const b=face.box;focal=Math.exp(-(((sx-b.x-b.width*.5)/(b.width*.65))**2+((sy-b.y-b.height*.48)/(b.height*.7))**2)*1.8);}
  priority[i]=Math.max(focal,featurePriority(face,sx,sy));
 }
 return intentFields({w,h,source,mask,priority,edge,angle,coherence,tone,artist:options.artist,medium:options.medium},options,profile,creativity,fidelity,strength);
}

export function intentFields(env,options,profile=profiles.artists[env.artist],creativity=.8,fidelity=.25,strength=.8){
 const {w,h,source,mask,priority,edge,tone}=env,n=w*h,paper=spec.paper;
 const channels=[0,1,2].map(c=>Float32Array.from({length:n},(_,i)=>source[i*3+c])),soft=channels.map(c=>blur(c,w,h,1));
 const palette=(options.palette?.length===8?options.palette:spec.artists[env.artist].palette).map(rgb),empirical=corpus.descriptors[env.artist].palette.map(rgb),ground=rgb(profile.ground),shadow=rgb(profile.shadow),target=new Float32Array(n*3);
 const smoothTone=blur(tone,w,h,2),groupCount=profile.groups;
 for(let i=0;i<n;i++){
  const focal=priority[i],subject=mask[i],low=1-clamp(focal*1.6),softness=profile.softness*creativity*low;
  let colour=channels.map((c,k)=>c[i]*(1-softness)+soft[k][i]*softness),l=value(colour),grouped=Math.round(smoothTone[i]*groupCount)/groupCount;
  // Preserve observed focal geometry; simplify nonfocal values and colours.
  const groupedValue=l*(1-creativity*low*.65)+grouped*creativity*low*.65;
  let designed=clamp((groupedValue-.5)*(1+(profile.contrast-1)*creativity)+.5);
  if(env.artist==='rembrandt')designed=clamp(designed-creativity*.10*(1-focal)+creativity*.07*focal);
  let near=palette[0],best=Infinity;
  for(const p of palette){const d=colour.reduce((s,v,c)=>s+(v-p[c])**2,0)+Math.abs(value(p)-designed)*.8;if(d<best){best=d;near=p;}}
  // Train-work descriptors temper the authored palette, not historical pigment recipes.
  let empiricalNear=empirical.reduce((a,b)=>Math.abs(value(a)-designed)<Math.abs(value(b)-designed)?a:b);
  const substitution=creativity*(1-fidelity)*(.35+.25*low);
  colour=colour.map((v,c)=>v*(1-substitution)+(near[c]*.75+empiricalNear[c]*.25)*substitution);
  const delta=designed-value(colour);colour=colour.map(v=>clamp(v+delta));
  if(env.medium==='graphite')colour=paper.map((v,c)=>clamp(v-(1-designed)*[.78,.79,.80][c]));
  if(!options.background&&subject<.7){
   const fade=clamp(subject/.7),y=Math.floor(i/w)/h;
   const bg=options.backdrop==='paper'||env.medium==='graphite'?paper:ground.map((v,c)=>clamp(v*(.64+.20*y)+shadow[c]*.15));
   colour=colour.map((v,c)=>v*fade+bg[c]*(1-fade));
  }
  // Highest lights remain observed; no synthetic face lighting/anatomy is introduced.
  for(let c=0;c<3;c++)target[i*3+c]=paper[c]*(1-strength)+colour[c]*strength;
  edge[i]*=1-profile.edgeEconomy*creativity*(1-focal)*.75;
 }
 const under=new Float32Array(n*3),model=new Float32Array(n*3);
 const targetChannels=[0,1,2].map(c=>Float32Array.from({length:n},(_,i)=>target[i*3+c])),mass=targetChannels.map(c=>blur(c,w,h,2));
 for(let i=0;i<n;i++)for(let c=0;c<3;c++){
  under[i*3+c]=mass[c][i];model[i*3+c]=mass[c][i]*(1-priority[i]*.8)+target[i*3+c]*priority[i]*.8;
 }
 return {...env,target,under,model,paper,profile,intent:{version:profiles.version,creativity,fidelity,valueGroups:groupCount,description:profile.intent,stages:profile.stages,sourceTransform:'identity-preserving fit; no learned geometry warp',corpusStatistics:'train artworks only'}};
}

export const stageFor=phase=>phase<.16?0:phase<.43?1:phase<.78?2:3;
export const stageTarget=(env,stage)=>stage<2?env.under:stage===2?env.model:env.target;
