import {at,clamp} from '../vision/fields.js';
import {featurePriority,inFace} from '../vision/face.js';
/** Integrate an undirected structure-tensor field, aligning sign at every step. */
export function streamline(fields,subject,x,y,angleOffset,length,random,bend=.065){
 const {w,h,angle,coherence,tone}=fields,p=[[x,y]];let previous=null,initial=at(tone,w,h,x,y);
 for(let step=0;step<length;step++){
  let c=at(coherence,w,h,x,y),a=at(angle,w,h,x,y);
  if(c<.20)a=.55; a+=angleOffset;
  let dx=Math.cos(a),dy=Math.sin(a);if(previous&&dx*previous[0]+dy*previous[1]<0){dx=-dx;dy=-dy;}
  if(previous){const prev=Math.atan2(previous[1],previous[0]),next=Math.atan2(dy,dx);let delta=Math.atan2(Math.sin(next-prev),Math.cos(next-prev));const constrained=prev+clamp(delta,-bend,bend);dx=Math.cos(constrained);dy=Math.sin(constrained);}
  const nx=x+dx*1.25,ny=y+dy*1.25;
  if(nx<3||ny<3||nx>w-4||ny>h-4||at(subject,w,h,nx,ny)<.5||Math.abs(at(tone,w,h,nx,ny)-initial)>.12)break;
  const jx=nx+(random()-.5)*.06,jy=ny+(random()-.5)*.06;if(at(subject,w,h,jx,jy)<.5||Math.abs(at(tone,w,h,jx,jy)-initial)>.12)break;
  p.push([jx,jy]);x=nx;y=ny;previous=[dx,dy];
 }return p;
}
export function* shade(fields,subject,face,artist,options,random){
 const {w,h,tone,mag}=fields,spacing=artist.spacing/Math.sqrt(options.detail/70),strength=options.shading/100;
 if(strength===0)return;
 for(let layer=0;layer<artist.layers;layer++){
  const occupancy=new Uint8Array(w*h);
  for(let y=7;y<h-7;y+=spacing)for(let x=7;x<w-7;x+=spacing){const sx=x+(random()-.5)*spacing,sy=y+(random()-.5)*spacing,i=Math.round(sy)*w+Math.round(sx);
   if(subject[i]<.55||occupancy[i])continue;
   let darkness=1-tone[i],facial=inFace(face,sx,sy),priority=featurePriority(face,sx,sy);
   // Bright skin gets paper, never a blanket cross-hatch. Cross layers only enter shadows.
   const cutoff=layer===0?(facial?.15:.095):layer===1?.45:.69;
   if(darkness<cutoff||mag[i]>.13||priority>.62&&darkness<.48)continue;
   let d=clamp((darkness-cutoff)/(1-cutoff)),density=Math.pow(d,artist.curve)*strength;
   if(options.artist==='rembrandt'&&darkness<.37)density*=.22;
   if(random()>density*.94)continue;
   let length=artist.length*(.40+.60*d)*(facial?.60:1)*( .8+random()*.4);
   const p=streamline(fields,subject,sx,sy,artist.angles[layer],length,random,options.artist==='durer'?.015:.055);if(p.length<3)continue;
   for(let k=0;k<p.length;k+=2){const px=Math.round(p[k][0]),py=Math.round(p[k][1]);occupancy[py*w+px]=1;}
   yield {p,pass:2,width:artist.shadeWidth*(.65+.5*d)*(facial?.68:1),alpha:artist.shadeAlpha*(.4+.9*d)*strength*subject[i],kind:layer?'shadow hatch':'form',tooth:artist.tooth};
  }
 }
}
