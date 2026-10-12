import {analyzeTone,clamp} from '../vision/fields.js';
import {findFace,featurePriority,inFace} from '../vision/face.js';
import {isolateSubject} from '../vision/subject.js';
import {ARTISTS} from './artists.js';
import {rng,makeStroke} from './geometry.js';
import {chainContours} from './contours.js';
import {shade} from './shading.js';
import {analyzeColour,sampleColour,artistColour} from '../vision/colour.js';
import {paintForms,tonalMasses,PAINT} from './painting.js';
import {compileLearned} from '../learning/painter.js';
import {compileStudio} from '../studio/painter.js';
import {compileAcademy} from '../academy/painter.js';
import detailCheckpoint from '../academy/detail-checkpoint.json' with {type:'json'};
import {compileHierarchical} from '../hierarchy/painter.js';
import {recommendedEngine} from '../academy/recommendation.js';
export function analyze(input,options={}){
 const fields={w:input.w,h:input.h,...analyzeTone(input)},face=findFace(input,fields.tone,options.detected,options.focus),subject=isolateSubject(input,face,options.background);
 return {fields,face,subject};
}
export function compileStrokes(input,options={},onBatch=()=>{},analysis=null){
 options={artist:'leonardo',medium:'graphite',fidelity:65,detail:70,shading:70,background:['academy','academy-detail','hierarchy','recommended'].includes(options.engine),...options};
 if(options.engine==='recommended')options={...options,requestedEngine:'recommended',engine:recommendedEngine(options.artist,options.medium)};
 const artist=ARTISTS[options.artist];if(!artist)throw new Error('Unknown artist');
 if(!['graphite','colour'].includes(options.medium))throw new Error('Unknown medium');
 const measured=analysis||analyze(input,options);
 if(options.engine==='hierarchy')return compileHierarchical(input,options,onBatch,measured);
 if(options.engine==='academy-detail')return compileAcademy(input,options,onBatch,measured,detailCheckpoint);
 if(options.engine==='academy')return compileAcademy(input,options,onBatch,measured);
 if(['studio','studio-previous','studio-extended'].includes(options.engine))return compileStudio(input,options,onBatch,measured);
 if(options.engine==='learned')return compileLearned(input,options,onBatch,measured);
 const {fields,face,subject}=measured,colour=analyzeColour(input,subject),random=rng(),strokes=[],batch=[];
 const add=mark=>{const stroke=makeStroke(mark.p,{color:artist.color,...mark},random);if(!stroke)return;strokes.push(stroke);batch.push(stroke);if(batch.length>=128)flush();};
 const flush=()=>{if(batch.length)onBatch(batch.splice(0));};
 const contours=chainContours(fields,subject,face,options.detail/70);
 const construction=()=>{if(options.artist!=='leonardo')return;for(const c of contours.filter(c=>c.p.length>18).slice(0,70))add({p:c.p.filter((_,i)=>i%3===0),pass:0,width:.6,alpha:.08,kind:'observed construction',tooth:.1});flush();};
 const contourPass=()=>{for(const c of contours){
  // Low-value changes describe planes, not anatomical outlines. Give strong
  // observed eyes/lips and silhouette edges more weight than skin texture.
  const mid=c.p[Math.floor(c.p.length/2)],facial=inFace(face,...mid),weak=c.strength<(facial?.075:.055)&&c.priority<(facial?.52:.38);
  if(weak&&c.p.length<9)continue;
  const colourMode=options.medium==='colour',rgb=colourMode?sampleColour(colour,...c.p[Math.floor(c.p.length/2)]):null;
  add({p:c.p,pass:1,width:artist.contourWidth*(.7+Math.min(.7,c.strength*4)),alpha:clamp(artist.contourAlpha*(.4+c.strength*4+c.priority*.28),.12,.92)*(weak?.35:1)*(colourMode?PAINT[options.artist].edge:1),color:colourMode?artistColour(rgb,options.artist,options.fidelity/100):artist.color,material:colourMode?'paint':'graphite',tool:colourMode?'brush':'pencil',kind:'contour',tooth:artist.tooth*.5,priority:c.priority});}flush();};
 const tonalPass=()=>{for(const mark of tonalMasses(fields,colour,subject,face,artist,options,random))add(mark);for(const mark of shade(fields,subject,face,artist,options,random))add(mark);flush();};
 if(options.medium==='colour'){
  for(const mark of paintForms(fields,colour,subject,face,options,random))add(mark);
  contourPass();flush();
  return finish();
 }
 construction();if(options.artist==='rembrandt'){tonalPass();contourPass();}else{tonalPass();contourPass();}
 // Dark, source-backed focal accents (not invented anatomical lines).
 for(const c of contours)if(c.priority>.40&&c.strength>.045){const dark=c.p.filter(([x,y])=>fields.tone[Math.round(y)*fields.w+Math.round(x)]<.40);if(dark.length>2){let run=[];for(const p of c.p){if(fields.tone[Math.round(p[1])*fields.w+Math.round(p[0])]<.40){run.push(p);}else{if(run.length>2)add({p:run,pass:3,width:artist.contourWidth*.85,alpha:.45,kind:'focal accent',tooth:.05,priority:c.priority});run=[];}}if(run.length>2)add({p:run,pass:3,width:artist.contourWidth*.85,alpha:.45,kind:'focal accent',tooth:.05,priority:c.priority});}}
 // Sparse short graphite accents on observed dark focal pixels anchor pupils and creases.
 for(let y=5;y<fields.h-5;y+=1.5)for(let x=5;x<fields.w-5;x+=1.5){const i=Math.round(y)*fields.w+Math.round(x);if(subject[i]>.5&&fields.tone[i]<.26&&featurePriority(face,x,y)>.45){const a=fields.angle[i],len=1.2+random()*1.8;add({p:[[x,y],[x+Math.cos(a)*len,y+Math.sin(a)*len]],pass:3,width:.8,alpha:.65,kind:'dark focal graphite',tooth:.1,priority:1});}}
 flush();return finish();
 function finish(){return {strokes,face,stats:{strokeCount:strokes.length,distance:strokes.reduce((a,s)=>a+s.length,0),contrast:fields.contrast,subjectCoverage:subject.reduce((a,v)=>a+v,0)/subject.length,contours:contours.length,materials:[...new Set(strokes.map(s=>s.material))]},options};}
}
