import {blur,clamp} from './fields.js';
/** No model, weights or network requests are bundled. Browser FaceDetector is optional. */
export async function detectLocalFace(photo,fit){
 if(typeof globalThis.FaceDetector!=='function')return null;
 try{const faces=await new FaceDetector({fastMode:false,maxDetectedFaces:1}).detect(photo);if(!faces.length)return null;
 const f=faces[0],b=f.boundingBox;return {box:{x:fit.x+b.x*fit.scale,y:fit.y+b.y*fit.scale,width:b.width*fit.scale,height:b.height*fit.scale},source:'browser FaceDetector',confidence:.9,landmarks:(f.landmarks||[]).map(l=>({type:l.type,points:l.locations.map(p=>[fit.x+p.x*fit.scale,fit.y+p.y*fit.scale])}))};}catch{return null;}
}
function skin(r,g,b){const cb=128-.168736*r-.331264*g+.5*b,cr=128+.5*r-.418688*g-.081312*b;return cr>134&&cr<179&&cb>75&&cb<133&&r>65&&r>g*1.05&&r>b*1.15&&r-g>15&&r/g<2.8;}
export function findFace({rgba,w,h,fit},tone,detected=null,focus=null){
 let face=detected;
 if(focus){face={box:{x:focus.x*w,y:focus.y*h,width:focus.width*w,height:focus.height*h},source:'user face region',confidence:1};}
 if(!face){let mask=new Uint8Array(w*h),seen=new Uint8Array(w*h),best=null;
  for(let y=Math.ceil(fit.y);y<Math.min(h*.76,fit.y+fit.height);y++)for(let x=Math.ceil(fit.x);x<fit.x+fit.width;x++){let i=y*w+x;mask[i]=skin(rgba[i*4],rgba[i*4+1],rgba[i*4+2])?1:0;}
  const density=blur(Float32Array.from(mask),w,h,3);for(let i=0;i<mask.length;i++)mask[i]=density[i]>.66?1:0;
  for(let i=0;i<mask.length;i++){if(!mask[i]||seen[i])continue;let q=[i],minX=w,maxX=0,minY=h,maxY=0;seen[i]=1;
   for(let k=0;k<q.length;k++){let j=q[k],x=j%w,y=Math.floor(j/w);minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y);for(const n of [j-1,j+1,j-w,j+w])if(n>=0&&n<mask.length&&Math.abs(n%w-x)<=1&&mask[n]&&!seen[n]){seen[n]=1;q.push(n);}}
   let bw=maxX-minX+1,bh=maxY-minY+1,score=q.length*(1-Math.abs((minX+maxX)/2-w/2)/w);
   const rows=new Uint32Array(h);for(const j of q)rows[Math.floor(j/w)]++;let peak=0;for(let y=minY;y<=Math.min(maxY,minY+bw);y++)peak=Math.max(peak,rows[y]);
   for(let y=Math.floor(minY+bw*.78);y<maxY-4;y++){const n=(rows[y]+rows[y+1]+rows[y+2]+rows[y+3]+rows[y+4])/5;if(n<peak*.61){bh=y-minY+1;break;}}
   if(q.length>w*h*.006&&bw>25&&bh>35&&bw/bh>.35&&bw/bh<1.7&&(!best||score>best.score))best={score,x:minX,y:minY,width:bw,height:Math.min(bh,bw*1.45)};
  }
  if(best)face={box:{x:best.x,y:best.y,width:best.width,height:best.height},source:'procedural skin/feature estimate',confidence:.48};
 }
 if(!face)return null;
 const b=face.box;
 // Refine candidate feature locations against the actual local photograph. These points
 // prioritize observed edges; they never synthesize a generic eye/nose/mouth outline.
 const feature=(name,u,v,rw,rh)=>{let cx=b.x+b.width*u,cy=b.y+b.height*v;let sx=0,sy=0,sum=0;
  for(let y=Math.floor(cy-b.height*rh);y<=cy+b.height*rh;y++)for(let x=Math.floor(cx-b.width*rw);x<=cx+b.width*rw;x++){if(x<1||x>=w-1||y<1||y>=h-1)continue;let d=1-tone[y*w+x],prior=Math.exp(-(((x-cx)/(b.width*rw))**2+((y-cy)/(b.height*rh))**2)*1.5),weight=d*d*prior;sx+=x*weight;sy+=y*weight;sum+=weight;}
  return {name,x:sum?sx/sum:cx,y:sum?sy/sum:cy,rx:b.width*rw,ry:b.height*rh,estimated:true};};
 const landmarks=[feature('left eye',.27,.30,.15,.08),feature('right eye',.73,.30,.15,.08),feature('nose',.5,.56,.13,.14),feature('mouth',.5,.75,.23,.08)];
 for(const l of face.landmarks||[]){const type=l.type==='eye'?'eye':l.type==='mouth'?'mouth':l.type==='nose'?'nose':null;if(!type)continue;for(const p of l.points){let target=landmarks.filter(a=>a.name.includes(type)).sort((a,b)=>Math.hypot(a.x-p[0],a.y-p[1])-Math.hypot(b.x-p[0],b.y-p[1]))[0];if(target){target.x=clamp(p[0],0,w-1);target.y=clamp(p[1],0,h-1);target.estimated=false;}}}
 return {...face,landmarks};
}
export function featurePriority(face,x,y){if(!face)return 0;let priority=0;for(const p of face.landmarks){let d=((x-p.x)/p.rx)**2+((y-p.y)/p.ry)**2;priority=Math.max(priority,Math.exp(-d*1.6));}return priority;}
export function inFace(face,x,y){if(!face)return false;const b=face.box;return ((x-(b.x+b.width*.5))/(b.width*.56))**2+((y-(b.y+b.height*.5))/(b.height*.58))**2<1;}
