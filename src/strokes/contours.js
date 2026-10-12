import {featurePriority,inFace} from '../vision/face.js';
import {smooth} from './geometry.js';
export function chainContours(fields,subject,face,detail){
 const {w,h,edges,mag}=fields,seen=new Uint8Array(w*h),seeds=[];
 for(let i=0;i<edges.length;i++)if(edges[i]&&subject[i]>.32)seeds.push(i);
 seeds.sort((a,b)=>(mag[b]+featurePriority(face,b%w,Math.floor(b/w))*.2)-(mag[a]+featurePriority(face,a%w,Math.floor(a/w))*.2));
 const result=[];
 function trace(start){let path=[],i=start,prev=null;
  for(let step=0;step<220;step++){let x=i%w,y=Math.floor(i/w);path.push([x,y]);seen[i]=1;let best=-1,score=-Infinity;
   for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){if(!dx&&!dy)continue;let nx=x+dx,ny=y+dy,j=ny*w+nx;if(nx<2||nx>=w-2||ny<2||ny>=h-2||!edges[j]||seen[j]||subject[j]<.3)continue;
    const direction=prev?(dx*prev[0]+dy*prev[1])/Math.hypot(dx,dy):0,k=direction*.035+mag[j];if(k>score){best=j;score=k;}}
   if(best<0)break;prev=[best%w-x,Math.floor(best/w)-y];i=best;
  }return path;
 }
 for(const i of seeds){if(seen[i])continue;let forward=trace(i);seen[i]=0;let backward=trace(i);let p=backward.reverse().slice(0,-1).concat(forward);if(p.length<3)continue;
  let strength=0,priority=0;for(const [x,y] of p){strength+=mag[y*w+x];priority=Math.max(priority,featurePriority(face,x,y));}strength/=p.length;
  const mid=p[Math.floor(p.length/2)];if(inFace(face,...mid)&&priority<.20&&strength<.035)continue;
  if(strength<.013&&priority<.25&&p.length<8/detail)continue;
  // Decimate only flat runs; keep bends and every facial point.
  const reduced=p.filter((q,k)=>k===0||k===p.length-1||priority>.25||k%2===0);
  result.push({p:smooth(reduced,priority>.3?.08:.20),strength,priority});
 }
 return result.sort((a,b)=>b.priority-a.priority||b.strength-a.strength);
}
