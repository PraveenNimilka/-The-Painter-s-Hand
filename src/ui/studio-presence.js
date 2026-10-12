const landscapeURL=new URL('../assets/atelier/landscape.webp',import.meta.url).href;

// Decorative UI only: no canvas, drawing actions or painting settings are touched.
export function mountStudioPresence(root){
  if(!root||root.dataset.presenceMounted)return;
  root.dataset.presenceMounted='true';
  const scenery=root.querySelector('.studio-scenery');
  if(scenery)scenery.style.backgroundImage=`url("${landscapeURL}")`;
  const button=root.querySelector('#studio-motion'),reduced=matchMedia('(prefers-reduced-motion: reduce)');
  let paused=reduced.matches,visible=true;
  const update=()=>{
    root.dataset.atmosphere=paused||reduced.matches||!visible||document.hidden?'paused':'playing';
    if(button){button.textContent=paused?'Resume atmosphere':'Pause atmosphere';button.setAttribute('aria-pressed',String(paused));button.disabled=reduced.matches;}
  };
  button?.addEventListener('click',()=>{paused=!paused;update();});
  reduced.addEventListener('change',()=>{paused=reduced.matches;update();});
  document.addEventListener('visibilitychange',update);
  const prologue=root.querySelector('.studio-prologue');
  if(prologue)new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;update();},{threshold:.05}).observe(prologue);
  const status=root.querySelector('#busy');
  if(status)new MutationObserver(()=>{root.dataset.planning=String(!!window.atelier?.compiling);}).observe(status,{childList:true,characterData:true,subtree:true});
  update();
}
