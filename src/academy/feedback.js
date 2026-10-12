import {paintStroke,PAPER} from '../render/pencil.js';

/** Current-art feedback, never a finished picture used for playback.
 * Finishing marks that damage focal values/edges are rolled back and omitted
 * from the exported instruction sequence. Nonfocal interpretation stays free.
 */
export function focalFeedback(env,strokes){
 if(typeof OffscreenCanvas==='undefined')return null;
 const canvas=new OffscreenCanvas(env.w,env.h),ctx=canvas.getContext('2d',{willReadFrequently:true}),scale=env.w/800;
 ctx.fillStyle=PAPER;ctx.fillRect(0,0,env.w,env.h);ctx.scale(scale,scale);
 for(const stroke of strokes)paintStroke(ctx,stroke);
 let rejected=0,accepted=0;
 function error(data,x0,y0,width,height){
  let pixel=0,gradient=0,n=0,pairs=0;
  const luma=(j,target=false)=>target ? .299*env.target[j*3]+.587*env.target[j*3+1]+.114*env.target[j*3+2]:(.299*data[(Math.floor(j/env.w)-y0)*width*4+(j%env.w-x0)*4]+.587*data[(Math.floor(j/env.w)-y0)*width*4+(j%env.w-x0)*4+1]+.114*data[(Math.floor(j/env.w)-y0)*width*4+(j%env.w-x0)*4+2])/255;
  for(let y=0;y<height;y++)for(let x=0;x<width;x++){
   const i=(y+y0)*env.w+x+x0,j=(y*width+x)*4;if(env.priority[i]<=.5)continue;
   for(let c=0;c<3;c++)pixel+=(data[j+c]/255-env.target[i*3+c])**2;n++;
   for(const k of [x+1<width?i+1:-1,y+1<height?i+env.w:-1])if(k>=0&&env.priority[k]>.5){gradient+=((luma(i)-luma(k))-(luma(i,true)-luma(k,true)))**2;pairs++;}
  }
  return {pixel,gradient,n,pairs};
 }
 return {
  accept(stroke){
   const margin=stroke.width*1.5*scale+2,x0=Math.max(0,Math.floor(Math.min(...stroke.p.map(p=>p[0]))*scale-margin)),y0=Math.max(0,Math.floor(Math.min(...stroke.p.map(p=>p[1]))*scale-margin)),x1=Math.min(env.w,Math.ceil(Math.max(...stroke.p.map(p=>p[0]))*scale+margin)),y1=Math.min(env.h,Math.ceil(Math.max(...stroke.p.map(p=>p[1]))*scale+margin));
   const w=x1-x0,h=y1-y0;if(w<=0||h<=0)return false;
   const before=ctx.getImageData(x0,y0,w,h),a=error(before.data,x0,y0,w,h);paintStroke(ctx,stroke);
   if(a.n){const b=error(ctx.getImageData(x0,y0,w,h).data,x0,y0,w,h);if(b.pixel>a.pixel+1e-8||b.gradient>a.gradient+1e-8){ctx.putImageData(before,x0,y0);rejected++;return false;}}
   accepted++;return true;
  },
  stats:()=>({accepted,rejected,grid:[env.w,env.h],method:'Actual Canvas focal RGB and luminance-gradient safeguards; authored finishing, not learned identity'})
 };
}
