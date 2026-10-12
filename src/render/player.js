import {paintStroke,pointAt,drawPencil} from './pencil.js';
export class StrokePlayer{
 // The committed surface is read back for exports. CPU backing avoids a large
 // deferred GPU command queue stalling PNG readback after dense colour paths.
 constructor(canvas,live,pointer,onUpdate=()=>{}){this.ctx=canvas.getContext('2d',{willReadFrequently:true});this.live=live.getContext('2d');this.pointer=pointer.getContext('2d');this.onUpdate=onUpdate;this.strokes=[];this.cursor=0;this.distance=0;this.running=false;this.compiling=false;this.speed=3;this.last=0;this.raf=0;this.generation=0;this.frames=[];this.tick=this.tick.bind(this);}
 reset(){this.generation++;this.pause();this.strokes=[];this.cursor=0;this.distance=0;this.frames=[];this.ctx.clearRect(0,0,this.ctx.canvas.width,this.ctx.canvas.height);this.preview();this.notify();}
 append(batch){this.strokes.push(...batch);this.notify();}
 resize(width=800,height=960){this.pause();for(const ctx of [this.ctx,this.live,this.pointer]){ctx.canvas.width=width;ctx.canvas.height=height;}this.reset();}
 notify(){this.onUpdate(this);}
 preview(){this.live.clearRect(0,0,this.live.canvas.width,this.live.canvas.height);const s=this.strokes[this.cursor];if(s&&this.distance>0)paintStroke(this.live,s,this.distance);drawPencil(this.pointer,s&&this.distance>0?pointAt(s.p,this.distance):null,s);}
 pause(){this.running=false;cancelAnimationFrame(this.raf);this.raf=0;this.last=0;this.notify();}
 play(){if(!this.strokes.length)return;this.running=true;this.last=0;if(!this.raf)this.raf=requestAnimationFrame(this.tick);this.notify();}
 tick(time){this.raf=0;if(!this.running)return;const dt=this.last?Math.min(50,time-this.last):16;if(this.last)this.frames.push(time-this.last);this.last=time;let budget=dt*this.speed*3200/1000,work=performance.now();
  while(budget>0&&this.cursor<this.strokes.length){let s=this.strokes[this.cursor],remaining=s.length-this.distance;if(remaining>budget){this.distance+=budget;budget=0;}else{paintStroke(this.ctx,s);budget-=remaining;this.distance=0;this.cursor++;}if(performance.now()-work>9)break;}
  this.preview();this.notify();if(this.cursor===this.strokes.length&&!this.compiling){this.running=false;this.last=0;drawPencil(this.pointer,null);this.notify();}else this.raf=requestAnimationFrame(this.tick);
 }
 async seek(position){const token=++this.generation;this.pause();position=Math.max(0,Math.min(this.strokes.length,position));let target=Math.floor(position),fraction=position-target;
  if(target<this.cursor){this.ctx.clearRect(0,0,this.ctx.canvas.width,this.ctx.canvas.height);this.cursor=0;}this.distance=0;
  let start=performance.now();while(this.cursor<target){if(token!==this.generation)return;paintStroke(this.ctx,this.strokes[this.cursor++]);if(performance.now()-start>10){this.notify();await new Promise(r=>requestAnimationFrame(r));start=performance.now();}}
  this.distance=(this.strokes[this.cursor]?.length||0)*fraction;this.preview();this.notify();
 }
 get progress(){return this.strokes.length?(this.cursor+(this.strokes[this.cursor]?this.distance/this.strokes[this.cursor].length:0))/this.strokes.length:0;}
}
