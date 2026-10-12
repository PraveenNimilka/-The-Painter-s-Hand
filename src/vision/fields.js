export const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
export function at(a,w,h,x,y){return a[clamp(Math.round(y),0,h-1)*w+clamp(Math.round(x),0,w-1)];}
export function blur(a,w,h,r=1){
  const t=new Float32Array(a.length),out=new Float32Array(a.length);
  for(let y=0;y<h;y++){let sum=0;for(let k=-r;k<=r;k++)sum+=a[y*w+clamp(k,0,w-1)];for(let x=0;x<w;x++){t[y*w+x]=sum/(2*r+1);sum+=a[y*w+clamp(x+r+1,0,w-1)]-a[y*w+clamp(x-r,0,w-1)];}}
  for(let x=0;x<w;x++){let sum=0;for(let k=-r;k<=r;k++)sum+=t[clamp(k,0,h-1)*w+x];for(let y=0;y<h;y++){out[y*w+x]=sum/(2*r+1);sum+=t[clamp(y+r+1,0,h-1)*w+x]-t[clamp(y-r,0,h-1)*w+x];}}
  return out;
}
function gradients(a,w,h){let gx=new Float32Array(a.length),gy=new Float32Array(a.length),mag=new Float32Array(a.length);
 for(let y=1;y<h-1;y++)for(let x=1;x<w-1;x++){let i=y*w+x;gx[i]=(a[i-w+1]+2*a[i+1]+a[i+w+1]-a[i-w-1]-2*a[i-1]-a[i+w-1])/8;gy[i]=(a[i+w-1]+2*a[i+w]+a[i+w+1]-a[i-w-1]-2*a[i-w]-a[i-w+1])/8;mag[i]=Math.hypot(gx[i],gy[i]);}return {gx,gy,mag};
}
export function analyzeTone({rgba,w,h,fit}){
 const raw=new Float32Array(w*h);let hist=new Uint32Array(256),count=0;
 for(let i=0;i<raw.length;i++){raw[i]=(rgba[i*4]*.299+rgba[i*4+1]*.587+rgba[i*4+2]*.114)/255;const x=i%w,y=Math.floor(i/w);if(x>fit.x&&x<fit.x+fit.width&&y>fit.y&&y<fit.y+fit.height){hist[Math.round(raw[i]*255)]++;count++;}}
 const percentile=q=>{let n=0;for(let j=0;j<256;j++){n+=hist[j];if(n>=count*q)return j/255;}return 1;};
 const low=percentile(.025),high=percentile(.975),range=high-low;
 const tone=Float32Array.from(raw,v=>range>.07?clamp(.82*v+.18*clamp((v-low)/(range||1))):v);
 const fine=gradients(blur(tone,w,h,1),w,h),coarse=gradients(blur(tone,w,h,3),w,h);
 const xx=Float32Array.from(coarse.gx,v=>v*v), yy=Float32Array.from(coarse.gy,v=>v*v),xy=Float32Array.from(coarse.gx,(v,i)=>v*coarse.gy[i]);
 const a=blur(xx,w,h,6),b=blur(yy,w,h,6),c=blur(xy,w,h,6),angle=new Float32Array(w*h),coherence=new Float32Array(w*h);
 for(let i=0;i<angle.length;i++){angle[i]=.5*Math.atan2(2*c[i],a[i]-b[i])+Math.PI/2;coherence[i]=Math.hypot(a[i]-b[i],2*c[i])/(a[i]+b[i]+1e-8);}
 // Nonmaximum suppression at two scales followed by hysteresis: retain connected weak edges.
 const nms=new Float32Array(w*h);
 for(const g of [fine,coarse])for(let y=2;y<h-2;y++)for(let x=2;x<w-2;x++){let i=y*w+x,m=g.mag[i];if(m<.003)continue;const dx=g.gx[i]/m,dy=g.gy[i]/m;if(m>=at(g.mag,w,h,x+dx,y+dy)&&m>=at(g.mag,w,h,x-dx,y-dy))nms[i]=Math.max(nms[i],m);}
 const values=Array.from(nms).filter(v=>v>.004).sort((a,b)=>a-b),threshold=Math.max(.012,(values[Math.floor(values.length*.65)]||.04)*.62);
 const edges=new Uint8Array(w*h),queue=[];
 for(let i=0;i<nms.length;i++)if(nms[i]>threshold){edges[i]=1;queue.push(i);}
 for(let k=0;k<queue.length;k++){const i=queue[k],x=i%w,y=Math.floor(i/w);for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){let j=i+dy*w+dx;if(x+dx<1||x+dx>=w-1||y+dy<1||y+dy>=h-1||edges[j]||nms[j]<threshold*.36)continue;edges[j]=1;queue.push(j);}}
 return {raw,tone,angle,coherence,edges,mag:fine.mag,gx:fine.gx,gy:fine.gy,contrast:range,threshold};
}
