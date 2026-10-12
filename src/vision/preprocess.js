/** Fit once. Every analysis field and exported coordinate shares this transform. */
export function fitImage(photo,w=400,h=480){
  const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;
  const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.fillStyle='#ffffff';ctx.fillRect(0,0,w,h);
  const scale=Math.min((w-32)/photo.width,(h-32)/photo.height);
  const fit={x:(w-photo.width*scale)/2,y:(h-photo.height*scale)/2,width:photo.width*scale,height:photo.height*scale,scale};
  ctx.drawImage(photo,fit.x,fit.y,fit.width,fit.height);
  return {w,h,fit,rgba:ctx.getImageData(0,0,w,h).data,canvas};
}
