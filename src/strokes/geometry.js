export function rng(seed=423873){return ()=>{seed^=seed<<13;seed^=seed>>>17;seed^=seed<<5;return (seed>>>0)/4294967296;};}
export function pathLength(p){let length=0;for(let i=1;i<p.length;i++)length+=Math.hypot(p[i][0]-p[i-1][0],p[i][1]-p[i-1][1]);return length;}
export function smooth(p,amount=.16){return p.map((q,i)=>i===0||i===p.length-1?q:[q[0]*(1-amount)+(p[i-1][0]+p[i+1][0])*amount/2,q[1]*(1-amount)+(p[i-1][1]+p[i+1][1])*amount/2]);}
export function makeStroke(points,{pass=2,width=.8,alpha=.25,color='#4c4945',kind='form',tooth=.1,priority=0,material='graphite',tool='pencil'},random){
 const p=points.map(q=>[q[0]*2,q[1]*2]),length=pathLength(p);if(p.length<2||length<1.1)return null;
 const pressure=p.map((_,i)=>{const t=i/(p.length-1);return kind.endsWith('foundation')?.82+random()*.16:Math.max(.18,Math.sin(Math.PI*(.1+.8*t))*(.87+random()*.22));});
 return {p,pass,width,alpha,color,kind,tooth,priority,material,tool,length,pressure,grain:random()};
}
