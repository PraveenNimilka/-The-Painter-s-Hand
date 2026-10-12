import {execute} from '../studio/environment.js';

/** Local contribution to the refinement objective. Outside the affected patch
 * is unchanged, so comparing these contributions avoids rescanning the canvas.
 */
function contribution(env,canvas,x0,y0,x1,y1){
 const n=env.w*env.h;env.focalNorm??=env.priority.reduce((s,v)=>s+v*v,0);
 const luma=i=>.299*canvas[i*3]+.587*canvas[i*3+1]+.114*canvas[i*3+2],target=i=>.299*env.target[i*3]+.587*env.target[i*3+1]+.114*env.target[i*3+2];
 let pixel=0,focal=0,gx=0,gy=0,mass=0;
 for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++){
  const i=y*env.w+x;let square=0;for(let c=0;c<3;c++)square+=(canvas[i*3+c]-env.target[i*3+c])**2/3;
  pixel+=square*(1+env.priority[i]*2);focal+=square*env.priority[i]**2;
  if(x+1<x1){const j=i+1;gx+=((luma(j)-luma(i))-(target(j)-target(i)))**2*(1+4*env.priority[j]+env.edge[j]);}
  if(y+1<y1){const j=i+env.w;gy+=((luma(j)-luma(i))-(target(j)-target(i)))**2*(1+4*env.priority[j]+env.edge[j]);}
 }
 for(let y=y0;y<y1;y+=4)for(let x=x0;x<x1;x+=4){const a=[0,0,0],b=[0,0,0];let count=0;for(let yy=y;yy<Math.min(y+4,y1);yy++)for(let xx=x;xx<Math.min(x+4,x1);xx++){const i=yy*env.w+xx;for(let c=0;c<3;c++){a[c]+=canvas[i*3+c];b[c]+=env.target[i*3+c];}count++;}for(let c=0;c<3;c++)mass+=(a[c]/count-b[c]/count)**2*count/3;}
 return .35*pixel/n+.30*focal/Math.max(1e-6,env.focalNorm)+.25*(gx/(env.h*(env.w-1))+gy/(env.w*(env.h-1)))/2+.10*mass/n;
}
export function applyRefinedMark(env,state,action,phase){
 const r=Math.ceil(action.length+action.width+4),x0=Math.max(0,Math.floor((action.x-r)/4)*4),y0=Math.max(0,Math.floor((action.y-r)/4)*4),x1=Math.min(env.w,Math.ceil((action.x+r+1)/4)*4),y1=Math.min(env.h,Math.ceil((action.y+r+1)/4)*4);
 const saved=[],coverage=[];for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++){const i=y*env.w+x;for(let c=0;c<3;c++)saved.push(state.canvas[i*3+c]);coverage.push(state.coverage[i]);}
 const before=contribution(env,state.canvas,x0,y0,x1,y1);execute(env,state,action,phase);const after=contribution(env,state.canvas,x0,y0,x1,y1);
 if(after<=before+1e-10)return true;
 let k=0,j=0;for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++){const i=y*env.w+x;for(let c=0;c<3;c++)state.canvas[i*3+c]=saved[k++];state.coverage[i]=coverage[j++];}return false;
}
