import {blur,clamp} from './fields.js';
/** Border-connected color removal plus a face-guided portrait envelope. Procedural,
 * deliberately conservative: users can include the background or correct the face ROI. */
export function isolateSubject({rgba,w,h,fit},face,includeBackground=false){
 const mask=new Float32Array(w*h);const left=Math.ceil(fit.x),right=Math.floor(fit.x+fit.width)-1,top=Math.ceil(fit.y),bottom=Math.floor(fit.y+fit.height)-1;
 if(includeBackground){for(let y=top;y<=bottom;y++)for(let x=left;x<=right;x++)mask[y*w+x]=1;return mask;}
 const seen=new Uint8Array(w*h),queue=[];
 const colorDistance=(i,j)=>Math.hypot(rgba[i*4]-rgba[j*4],rgba[i*4+1]-rgba[j*4+1],rgba[i*4+2]-rgba[j*4+2])/442;
 const seeds=[];for(let t=0;t<12;t++){let x=Math.round(left+(right-left)*t/11);seeds.push(top*w+x,bottom*w+x);let y=Math.round(top+(bottom-top)*t/11);seeds.push(y*w+left,y*w+right);}
 const borderLimit=face?face.box.y+face.box.height*.7:top+(bottom-top)*.6;
 const palette=seeds.filter(i=>Math.floor(i/w)<borderLimit);
 for(const i of seeds){if(Math.floor(i/w)>=borderLimit)continue;seen[i]=1;queue.push(i);}
 for(let k=0;k<queue.length;k++){let i=queue[k],x=i%w;for(const j of [i-1,i+1,i-w,i+w]){let nx=j%w,ny=Math.floor(j/w);if(nx<left||nx>right||ny<top||ny>bottom||Math.abs(nx-x)>1||seen[j])continue;
   if(face){const b=face.box;if(((nx-b.x-b.width/2)/(b.width*.55))**2+((ny-b.y-b.height*.5)/(b.height*.62))**2<1)continue;}
   if(colorDistance(i,j)<.12&&palette.some(p=>colorDistance(p,j)<.17)){seen[j]=1;queue.push(j);}
 }}
 for(let y=top;y<=bottom;y++)for(let x=left;x<=right;x++){let i=y*w+x,v=seen[i]?0:1;
  if(face){let b=face.box,cx=b.x+b.width*.5,cy=b.y+b.height*.12;
   const head=((x-cx)/(b.width*.68))**2+((y-cy)/(b.height*1.05))**2;
   const bodyHalf=b.width*(.50+Math.max(0,y-(b.y+b.height*.95))/b.height*.8);
   const body=y>b.y+b.height*.82?clamp((bodyHalf-Math.abs(x-cx))/12):0;
   v=Math.max(v,head<1?1:body);v*=Math.max(clamp((1.17-head)*5),body);
  }mask[i]=v;
 }
 return blur(mask,w,h,2);
}
