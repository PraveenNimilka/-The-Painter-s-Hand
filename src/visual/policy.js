// Weights are supplied by the host, avoiding a second 52MB copy in the worker bundle.
export const checkpoint={trained:false,layers:{},parameters:{inference:0},training:{}};
const models=new WeakMap();
function parameters(model){
 if(models.has(model))return models.get(model);
 const result={};for(const [key,tensor]of Object.entries(model.layers)){
  const bytes=Uint8Array.from(atob(tensor.f32),c=>c.charCodeAt(0));
  result[key]={shape:tensor.shape,data:new Float32Array(bytes.buffer)};
 }models.set(model,result);return result;
}
function dense(input,weight,bias,relu=true){
 const out=new Float32Array(weight.shape[0]),n=input.length;
 for(let o=0;o<out.length;o++){let v=bias.data[o],offset=o*n;for(let i=0;i<n;i++)v+=input[i]*weight.data[offset+i];out[o]=relu?Math.max(0,v):v;}return out;
}
function layer(input,p,name,relu=true){return dense(input,p[name+'.weight'],p[name+'.bias'],relu);}
function conv(input,shape,weight,bias){
 const [channels,h,w]=shape,outputs=weight.shape[0],oh=Math.ceil(h/2),ow=Math.ceil(w/2),out=new Float32Array(outputs*oh*ow);
 for(let o=0;o<outputs;o++)for(let y=0;y<oh;y++)for(let x=0;x<ow;x++){
  let v=bias.data[o];for(let c=0;c<channels;c++)for(let ky=0;ky<3;ky++)for(let kx=0;kx<3;kx++){
   const iy=y*2+ky-1,ix=x*2+kx-1;if(iy>=0&&iy<h&&ix>=0&&ix<w)v+=input[(c*h+iy)*w+ix]*weight.data[((o*channels+c)*3+ky)*3+kx];
  }out[(o*oh+y)*ow+x]=Math.max(0,v);
 }return {data:out,shape:[outputs,oh,ow]};
}
export function globalEncode(bytes,model=checkpoint){
 const p=parameters(model);let x=Float32Array.from(bytes,v=>v/255);for(let i=0;i<2;i++)x=layer(x,p,'global_layers.'+i);return x;
}
export function encode(bytes,global,previous=new Float32Array(256),model=checkpoint){
 const p=parameters(model),data=new Float32Array(9*1024);
 for(let i=0;i<1024;i++)for(let c=0;c<3;c++){const t=bytes[i*6+c]/255,v=bytes[i*6+3+c]/255;data[c*1024+i]=t;data[(c+3)*1024+i]=v;data[(c+6)*1024+i]=t-v;}
 let out={data,shape:[9,32,32]};for(let i=0;i<3;i++)out=conv(out.data,out.shape,p['convs.'+i+'.weight'],p['convs.'+i+'.bias']);
 let x=out.data;for(let i=0;i<3;i++)x=layer(x,p,'visual.'+i);
 const input=Float32Array.from([...x,...global]),wi={shape:p['memory.weight_ih'].shape,data:p['memory.weight_ih'].data},wh=p['memory.weight_hh'];
 const a=dense(input,wi,p['memory.bias_ih'],false),b=dense(previous,wh,p['memory.bias_hh'],false),memory=new Float32Array(256),sigmoid=v=>1/(1+Math.exp(-v));
 for(let i=0;i<256;i++){const reset=sigmoid(a[i]+b[i]),update=sigmoid(a[256+i]+b[256+i]),candidate=Math.tanh(a[512+i]+reset*b[512+i]);memory[i]=(1-update)*candidate+update*previous[i];}return memory;
}
export function workerScores(memory,global,context,actions,model=checkpoint){
 const p=parameters(model),prefix=Float32Array.from([...memory,...global,...context]),weight=p['worker.0.weight'],bias=p['worker.0.bias'],n=weight.shape[1],shared=new Float32Array(weight.shape[0]);
 for(let o=0;o<shared.length;o++){let v=bias.data[o];for(let i=0;i<prefix.length;i++)v+=prefix[i]*weight.data[o*n+i];shared[o]=v;}
 return actions.map(a=>{let x=new Float32Array(shared.length);for(let o=0;o<x.length;o++){let v=shared[o];for(let i=0;i<Math.min(a.length,n-prefix.length);i++)v+=a[i]*weight.data[o*n+prefix.length+i];x[o]=Math.max(0,v);}x=layer(x,p,'worker.1');return layer(x,p,'worker.2',false)[0];});
}
export function managerScores(global,contexts,model=checkpoint){const p=parameters(model);return contexts.map(c=>layer(layer(Float32Array.from([...global,...c]),p,'manager.0'),p,'manager.1',false)[0]);}
