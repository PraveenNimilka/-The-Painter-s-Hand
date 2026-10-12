import {featurePriority} from '../vision/face.js';
import {sampleColour,artistColour} from '../vision/colour.js';
import {pathLength,rng} from '../strokes/geometry.js';
import {selectFormMarks} from './finishing.js';

/** Source-backed small marks bridge detail below the neural observation grid.
 * This is authored finishing; it neither invents anatomy nor embeds a bitmap.
 */
export function detailAccents(input,analysis,colour,options,limit){
 const {fields,subject,face}=analysis,{w,h,raw,mag,angle}=fields;
 function* marks(){
  for(let y=3;y<h-3;y+=1.5)for(let x=3;x<w-3;x+=1.5){
   const ix=Math.round(x),iy=Math.round(y),i=iy*w+ix,priority=featurePriority(face,x,y);
   if(subject[i]<.35||priority<.28)continue;
   const tone=raw[i],contrast=Math.max(Math.abs(tone-raw[i-1]),Math.abs(tone-raw[i+1]),Math.abs(tone-raw[i-w]),Math.abs(tone-raw[i+w]));
   if(contrast<.025&&mag[i]<.025||tone>.72)continue;
   const theta=angle[i],length=1.1+Math.min(1.6,contrast*8),dx=Math.cos(theta)*length,dy=Math.sin(theta)*length;
   const p=[[x-dx*.5,y-dy*.5],[x,y],[x+dx*.5,y+dy*.5]];
   yield {p,priority,width:options.medium==='graphite'?.58:.72,
    alpha:Math.min(.65,.12+(1-tone)*.48)*(.55+.45*priority),tone,
    color:options.medium==='graphite'?'#302e2b':artistColour(sampleColour(colour,x,y),options.artist,Math.min(1,(options.fidelity??25)/100+priority*.55))};
  }
 }
 return selectFormMarks(marks(),fields,face,limit,rng(613381)).map(mark=>{
  const p=mark.p.map(([x,y])=>[x*2,y*2]);return {...mark,p,pressure:[.35,.85,.35],width:mark.width*2,length:pathLength(p),pass:3,kind:'source-backed focal detail',grammar:'studio-materials-v2',material:options.medium==='graphite'?'graphite':'paint',tool:options.medium==='graphite'?'pencil':'brush',toolId:options.medium==='graphite'?'hard-pencil':'filbert',tooth:0,grain:0};
 });
}
