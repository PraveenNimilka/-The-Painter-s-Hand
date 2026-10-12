export function outputSize(width,height,longEdge=960){
 if(!(width>0&&height>0))throw new Error('Invalid source dimensions');
 const scale=Math.min(3840,Math.max(256,longEdge))/Math.max(width,height);
 return {width:Math.max(1,Math.round(width*scale)),height:Math.max(1,Math.round(height*scale))};
}
export function highResolutionInput(photo,longEdge=960){
 const {width:w,height:h}=outputSize(photo.naturalWidth||photo.width,photo.naturalHeight||photo.height,longEdge),canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;
 const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.fillStyle='#ffffff';ctx.fillRect(0,0,w,h);ctx.drawImage(photo,0,0,w,h);
 return {w,h,rgba:ctx.getImageData(0,0,w,h).data,sourceWidth:photo.naturalWidth||photo.width,sourceHeight:photo.naturalHeight||photo.height,detailSupported:Math.max(photo.naturalWidth||photo.width,photo.naturalHeight||photo.height)>=longEdge};
}
export function canvasSurface(w,h){const c=typeof OffscreenCanvas!=='undefined'?new OffscreenCanvas(w,h):document.createElement('canvas');c.width=w;c.height=h;return c;}
