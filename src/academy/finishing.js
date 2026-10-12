import {featurePriority} from '../vision/face.js';
/** Bounded weighted reservoir avoids truncating a scan at the top of the image. */
export function selectFormMarks(iterator,fields,face,limit,random){
 const heap=[];let order=0;
 const swap=(a,b)=>{const t=heap[a];heap[a]=heap[b];heap[b]=t;};
 const up=i=>{while(i){const p=(i-1)>>1;if(heap[p].score<=heap[i].score)break;swap(i,p);i=p;}};
 const down=()=>{let i=0;for(;;){const l=i*2+1,r=l+1;if(l>=heap.length)break;const j=r<heap.length&&heap[r].score<heap[l].score?r:l;if(heap[i].score<=heap[j].score)break;swap(i,j);i=j;}};
 for(const mark of iterator){const [x,y]=mark.p[Math.floor(mark.p.length/2)],j=Math.max(0,Math.min(fields.w*fields.h-1,Math.round(y)*fields.w+Math.round(x))),priority=featurePriority(face,x,y),weight=(.2+1-fields.tone[j])*(1+priority*5),entry={mark:{...mark,priority},order:order++,score:Math.log(Math.max(1e-12,random()))/weight};if(limit<=0)continue;if(heap.length<limit){heap.push(entry);up(heap.length-1);}else if(entry.score>heap[0].score){heap[0]=entry;down();}}
 return heap.sort((a,b)=>a.order-b.order).map(e=>e.mark);
}
