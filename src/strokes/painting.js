import {at,clamp} from '../vision/fields.js';
import {sampleColour,artistColour} from '../vision/colour.js';
import {featurePriority,inFace} from '../vision/face.js';
import {streamline} from './shading.js';
export const PAINT={
 leonardo:{material:'glaze',foundationWidth:4.8,spacing:2.6,width:11,alpha:.48,layers:3,length:5,edge:.18,label:'Sfumato · translucent colour · softened edges'},
 durer:{material:'wash',foundationWidth:3.8,spacing:2.7,width:10,alpha:.59,layers:2,length:5,edge:.35,label:'Watercolour · fine brush · bodycolour lights'},
 rembrandt:{material:'paint',foundationWidth:5.4,spacing:3.1,width:13,alpha:.65,layers:2,length:7,edge:.24,label:'Grouped shadows · warm lights · textured paint'}
};
export function* paintForms(fields,colour,subject,face,options,random){
 const {w,h,tone}=fields,style=PAINT[options.artist],strength=options.shading/100;
 if(!strength)return;
 for(let layer=0;layer<style.layers;layer++){
 const spacing=(layer===0?1.35:style.spacing)/Math.sqrt(options.detail/70);
 for(let y=4+layer*.8;y<h-4;y+=spacing)for(let x=4+layer*.7;x<w-4;x+=spacing){
  const sx=x+(random()-.5)*spacing*.65,sy=y+(random()-.5)*spacing*.65,i=Math.round(sy)*w+Math.round(sx);
  if(subject[i]<.55||tone[i]>.965)continue;
  const rgb=sampleColour(colour,sx,sy),priority=featurePriority(face,sx,sy);
  const radius=at(colour.clearance,w,h,sx,sy),width=Math.min(style.width,Math.max(1.1,radius*2.5));
  const length=Math.min(style.length*(inFace(face,sx,sy)?.7:1),Math.max(1,radius));
  let p=streamline(fields,subject,sx,sy,layer%2?.32:0,length,random,.08);
  // A short fine-brush deposit covers small observed planes where a longer
  // streamline cannot proceed. It is still an independently replayable path.
  if(layer===0&&p.length<2){const a=fields.angle[i],dx=Math.cos(a)*.6,dy=Math.sin(a)*.6;p=[[sx-dx*.5,sy-dy*.5],[sx+dx*.5,sy+dy*.5]];}
  // Keep colour groups separate as well as tones (e.g. blue and red of equal value).
  const stop=p.findIndex((q,k)=>k>0&&sampleColour(colour,...q).reduce((s,v,c)=>s+(v-rgb[c])**2,0)>=.024);if(stop>0)p=p.slice(0,stop);
  if(p.length<2)continue;
  const minRadius=Math.min(...p.map(q=>at(colour.clearance,w,h,...q)));
  yield {p,pass:layer===0?0:2,width:layer===0?Math.max(style.foundationWidth,Math.min(width,Math.max(1.1,minRadius*2.5))):Math.min(width,Math.max(1.1,minRadius*2.5)),alpha:layer===0?.88*(.6+.4*strength):style.alpha*strength,color:artistColour(rgb,options.artist,options.fidelity/100),material:style.material,tool:'brush',kind:layer?'colour modelling':'colour foundation',tooth:layer===0?.04:.08,priority};
 }
 }
 // Fine texture follows observed local form, restricted to meaningful details.
 const step=2.5/Math.sqrt(options.detail/70);
 for(let y=5;y<h-5;y+=step)for(let x=5;x<w-5;x+=step){const i=Math.round(y)*w+Math.round(x),priority=featurePriority(face,x,y);
  if(subject[i]<.6||tone[i]>.94||fields.mag[i]<.025&&priority<.4)continue;
  const rgb=sampleColour(colour,x,y),highlight=tone[i]>.68&&fields.mag[i]>.04;
  const p=streamline(fields,subject,x,y,0,priority>.4?2:4,random,.05);if(p.length<2)continue;
  yield {p,pass:3,width:highlight&&options.artist==='rembrandt'?2.3:options.artist==='durer'?.85:1.3,alpha:(highlight?.45:.40)*strength,color:artistColour(rgb,options.artist,options.fidelity/100),material:highlight&&options.artist==='rembrandt'?'impasto':options.artist==='durer'?'drybrush':'paint',tool:'brush',kind:highlight?'observed bodycolour light':'fine brush detail',tooth:.16,priority};
 }
}
/** Side-of-lead tonal masses restore cheek/nose/neck values without a lattice.
 * These are broad pencil strokes, separate from the fine hatch strategy. */
export function* tonalMasses(fields,colour,subject,face,artist,options,random){
 if(!options.shading)return;const spacing=2.5/Math.sqrt(options.detail/70),strength=options.shading/100;
 const faceWeight=(x,y)=>{if(!face)return 0;const b=face.box,r=Math.hypot((x-b.x-b.width*.5)/(b.width*.56),(y-b.y-b.height*.5)/(b.height*.68)),t=clamp((1.6-r)/.95);return t*t*(3-2*t);};
 for(let gy=5;gy<fields.h-5;gy+=spacing)for(let gx=5;gx<fields.w-5;gx+=spacing){const x=gx+(random()-.5)*spacing,y=gy+(random()-.5)*spacing;let i=Math.round(y)*fields.w+Math.round(x),dark=1-fields.tone[i];
  if(subject[i]<.6||dark<.13||fields.mag[i]>.10)continue;
  const radius=at(colour.clearance,fields.w,fields.h,x,y),p=streamline(fields,subject,x,y,0,Math.min(4,Math.max(1,radius)),random);if(p.length<2)continue;
  yield {p,pass:2,width:Math.min(options.artist==='durer'?5:12,Math.max(1,radius*2)),alpha:clamp(dark**1.1*(options.artist==='durer'?.18:.28)*strength)*(1-faceWeight(x,y)*.75),color:artist.color,material:'sidelead',tool:'pencil',kind:'tonal mass',tooth:.18,priority:featurePriority(face,x,y)};
 }
 // Facial planes use finer source-value deposits. Large random masses obscure
 // small eye/cheek transitions, even when the overall tone looks convincing.
 if(face){const spacing=1.35/Math.sqrt(options.detail/70),b=face.box;
  for(let gy=Math.max(4,b.y-b.height*.65);gy<Math.min(fields.h-4,b.y+b.height*1.65);gy+=spacing)for(let gx=Math.max(4,b.x-b.width*.5);gx<Math.min(fields.w-4,b.x+b.width*1.5);gx+=spacing){
   const x=gx+(random()-.5)*spacing*.4,y=gy+(random()-.5)*spacing*.4,i=Math.round(y)*fields.w+Math.round(x),dark=1-fields.tone[i];
   const weight=faceWeight(x,y);if(subject[i]<.6||dark<.08||weight<.015)continue;
   const a=fields.angle[i],dx=Math.cos(a)*.6,dy=Math.sin(a)*.6;
   yield {p:[[x-dx/2,y-dy/2],[x+dx/2,y+dy/2]],pass:2,width:3.8,alpha:clamp(dark/.68)*strength*.55*weight,color:artist.color,material:'graphite',tool:'pencil',kind:'facial tone foundation',tooth:.06,priority:featurePriority(face,x,y)};
  }
 }
}
