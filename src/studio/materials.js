import {pathLength} from '../strokes/geometry.js';
/** Versioned executable material grammar. Canvas, SVG and observation share it. */
export function materialPrimitives(s){
 const result=[],base={p:s.p,reference:s.p,color:s.color,length:pathLength(s.p),offset:0},alpha=s.alpha*.92;
 const add=(ratio,opacity,shift=0,color=s.color)=>{
  const widths=s.pressure.map(v=>Math.max(.0001,s.width*v*ratio));
  const p=s.p.map((v,k)=>{const a=s.p[Math.max(0,k-1)],b=s.p[Math.min(s.p.length-1,k+1)],d=Math.hypot(b[0]-a[0],b[1]-a[1])||1;return [v[0]-(b[1]-a[1])/d*shift*s.width*s.pressure[k],v[1]+(b[0]-a[0])/d*shift*s.width*s.pressure[k]];});
  result.push({...base,p,color,width:s.width*ratio,widths,alpha:opacity});
 };
 if(['glaze','wash','sidelead'].includes(s.material)){add(1,alpha*.20);add(.76,alpha*.28);add(.48,alpha*.30);add(.22,alpha*.23);}
 else if(s.material==='drybrush')for(let strand=0;strand<5;strand++)add(.115,alpha*(.48+.08*Math.sin(strand*2.7)),(strand-2)*.19);
 else if(['chalk','graphite'].includes(s.material)){add(1,alpha*.5);for(let strand=0;strand<3;strand++)add(.18,alpha*.35,(strand-1)*.28);}
 else if(s.material==='metalpoint')add(.75,alpha*.52);
 else if(s.material==='reed'){add(1,alpha);add(.38,alpha*.20,.26);}
 else{add(1,alpha);if(s.material==='impasto')add(.20,alpha*.25,-.15,'#f2e3c4');}
 return result;
}

/** A continuous tapered ribbon, clipped in centreline distance for real playback. */
export function ribbonOutline(mark,distance=Infinity){
 if(distance<=0)return [];
 const p=[mark.p[0]],widths=[mark.widths[0]];let remaining=distance;
 for(let k=1;k<mark.p.length;k++){
  const a=mark.p[k-1],b=mark.p[k],reference=mark.reference??mark.p,len=Math.hypot(reference[k][0]-reference[k-1][0],reference[k][1]-reference[k-1][1]);
  if(remaining<len){const t=len?remaining/len:0;p.push([a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t]);widths.push(mark.widths[k-1]+(mark.widths[k]-mark.widths[k-1])*t);break;}
  p.push(b);widths.push(mark.widths[k]);remaining-=len;
 }
 if(p.length<2)return [];
 const left=[],right=[];
 for(let k=0;k<p.length;k++){const a=p[Math.max(0,k-1)],b=p[Math.min(p.length-1,k+1)],d=Math.hypot(b[0]-a[0],b[1]-a[1])||1,nx=-(b[1]-a[1])/d,ny=(b[0]-a[0])/d;left.push([p[k][0]+nx*widths[k]/2,p[k][1]+ny*widths[k]/2]);right.push([p[k][0]-nx*widths[k]/2,p[k][1]-ny*widths[k]/2]);}
 const cap=(k,a,b)=>{const theta=Math.atan2(b[1]-a[1],b[0]-a[0]),out=[];for(let j=1;j<6;j++){const angle=theta+Math.PI/2-j*Math.PI/6;out.push([p[k][0]+Math.cos(angle)*widths[k]/2,p[k][1]+Math.sin(angle)*widths[k]/2]);}return out;};
 return [...left,...cap(p.length-1,p[p.length-2],p.at(-1)),...right.reverse(),...cap(0,p[1],p[0])];
}
