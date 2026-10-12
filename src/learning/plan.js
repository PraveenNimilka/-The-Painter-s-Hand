import {spec} from './policy.js';
import {clamp} from '../vision/fields.js';
import {featurePriority} from '../vision/face.js';
export const rgb=hex=>[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)/255);
export const value=colour=>colour[0]*.299+colour[1]*.587+colour[2]*.114;
/** Coarse colour/value fields guide actions. No finished material image is made. */
export function makePlan(input,analysis,options,w=120,h=144){
 const {fields,subject,face}=analysis,n=w*h,target=new Float32Array(n*3),mask=new Float32Array(n),edge=new Float32Array(n),angle=new Float32Array(n),priority=new Float32Array(n),coherence=new Float32Array(n);
 const artist=spec.artists[options.artist],custom=options.palette?.filter(v=>/^#[0-9a-f]{6}$/i.test(v)),palette=(custom?.length?custom:artist.palette).map(rgb),bg=rgb(artist.background),interpretation=(options.interpretation??75)/100,sourceMix=clamp(options.fidelity/100),paper=spec.paper;
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
  const i=y*w+x,sx=(x+.5)*input.w/w,sy=(y+.5)*input.h/h,ix=Math.min(input.w-1,Math.round(sx)),iy=Math.min(input.h-1,Math.round(sy)),j=iy*input.w+ix;
  let sum=[0,0,0],count=0;const radius=fields.mag[j]>.025?0:options.artist==='durer'?1:2;
  for(let dy=-radius;dy<=radius;dy++)for(let dx=-radius;dx<=radius;dx++){const k=clamp(iy+dy,0,input.h-1)*input.w+clamp(ix+dx,0,input.w-1);for(let c=0;c<3;c++)sum[c]+=input.rgba[k*4+c]/255;count++;}
  const source=sum.map(v=>v/count);mask[i]=subject[j];edge[i]=clamp(fields.mag[j]*5);angle[i]=fields.angle[j];coherence[i]=fields.coherence[j];
  let faceWeight=0;if(face){const b=face.box;faceWeight=Math.exp(-(((sx-b.x-b.width*.5)/(b.width*.55))**2+((sy-b.y-b.height*.5)/(b.height*.65))**2)*1.4);}
  priority[i]=Math.max(faceWeight,featurePriority(face,sx,sy));
  let out;
  if(options.medium==='graphite'){
   const l=fields.tone[j],dark=Math.pow(1-l,options.artist==='rembrandt'?.85:1.05)*(options.shading/100);
   out=paper.map((v,c)=>clamp(v-dark*[.72,.74,.75][c]));if(mask[i]<.45&&!options.background)out=paper;
  }else{
   const l=value(source);let nearest=palette[0],distance=Infinity;
   for(const colour of palette){const d=source.reduce((s,v,c)=>s+(v-colour[c])**2*[.55,.85,.35][c],0)+(l-value(colour))**2*.6;if(d<distance){distance=d;nearest=colour;}}
   const mix=interpretation*(1-sourceMix)*.9;
   out=source.map((v,c)=>v*(1-mix)+nearest[c]*mix);
   // Modest planned value grouping and lateral portrait lighting; no inferred 3D.
   if(faceWeight>.05){const b=face.box,left=clamp((sx-b.x)/b.width),relight=(.5-left)*interpretation*faceWeight*(options.artist==='rembrandt'?.13:.045);out=out.map((v,c)=>clamp(v+relight*[1,.88,.64][c]));}
   if(!options.background&&mask[i]<.65){const studio=options.backdrop!=='paper',fade=clamp(mask[i]/.65);const ground=studio?bg.map(v=>clamp(v*(.83+.22*y/h))):paper;out=out.map((v,c)=>v*fade+ground[c]*(1-fade));}
   const shade=options.shading/100;out=out.map((v,c)=>paper[c]*(1-shade)+v*shade);
  }
  for(let c=0;c<3;c++)target[i*3+c]=clamp(out[c]);
 }
 return {w,h,target,mask,edge,angle,priority,coherence,artist:options.artist,medium:options.medium};
}
