import museMarkup from '../assets/atelier/muse.svg.template?raw';
import bodyURL from '../assets/atelier/muse-body-v3.webp?url';
import forearmURL from '../assets/atelier/muse-arm-cuff-v4.webp?url';
import '../assets/atelier/muse-animation.css';

const hero=document.querySelector('.hero');
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
let heroVisible=true;
const muse=document.querySelector('#hero-muse');
if(muse)muse.innerHTML=museMarkup.replaceAll('{{BODY_URL}}',bodyURL).replaceAll('{{FOREARM_URL}}',forearmURL);
function updateMotion(){
  if(!hero)return;
  const paused=reduced.matches||!heroVisible||document.hidden;
  hero.dataset.motion=paused?'paused':'playing';
}
document.addEventListener('visibilitychange',updateMotion);
reduced.addEventListener('change',updateMotion);
if(hero)new IntersectionObserver(([entry])=>{heroVisible=entry.isIntersecting;updateMotion();},{threshold:.05}).observe(hero);
updateMotion();

const dialog=document.querySelector('#painting-viewer');
let galleryTrigger=null;
for(const button of document.querySelectorAll('[data-painting]'))button.addEventListener('click',()=>{
  galleryTrigger=button;
  dialog.querySelector('img').src=button.dataset.full;
  dialog.querySelector('img').alt=button.querySelector('img')?.alt??button.dataset.painting;
  dialog.querySelector('h2').textContent=button.dataset.painting;
  dialog.querySelector('p').textContent=button.dataset.caption;
  dialog.showModal();dialog.querySelector('button').focus();
});
dialog?.querySelector('button').addEventListener('click',()=>dialog.close());
dialog?.addEventListener('click',event=>{if(event.target===dialog){const box=dialog.getBoundingClientRect();if(event.clientX<box.left||event.clientX>box.right||event.clientY<box.top||event.clientY>box.bottom)dialog.close();}});
dialog?.addEventListener('close',()=>galleryTrigger?.focus());

// Native scrolling remains in charge; depth is a small decorative response.
const gallery=document.querySelector('.gallery-track');
const works=[...document.querySelectorAll('.gallery-work')];
for(const button of document.querySelectorAll('[data-gallery-filter]'))button.addEventListener('click',()=>{
  for(const filter of document.querySelectorAll('[data-gallery-filter]'))filter.setAttribute('aria-pressed',String(filter===button));
  for(const work of works)work.hidden=button.dataset.galleryFilter!=='all'&&work.dataset.medium!==button.dataset.galleryFilter;
  const count=works.filter(work=>!work.hidden).length;
  document.querySelector('#gallery-count').textContent=`${count} ${count===1?'study':'studies'}`;
  gallery.scrollLeft=0;galleryDepth();
});
let scrollFrame=0;
function galleryDepth(){
  scrollFrame=0;if(!gallery||reduced.matches||innerWidth<=600)return;
  const rect=gallery.getBoundingClientRect(),p=Math.max(-1,Math.min(1,(rect.top+rect.height/2-innerHeight/2)/innerHeight));
  works.filter(work=>!work.hidden).forEach((work,i)=>{
    const column=i%3;
    work.style.transform=column===1?`translateZ(25px) translateY(${p*-12}px)`:`rotateY(${column===0?8:-8}deg) translateY(${24+p*14}px)`;
  });
}
addEventListener('scroll',()=>{if(!scrollFrame)scrollFrame=requestAnimationFrame(galleryDepth);},{passive:true});
addEventListener('resize',()=>{if(innerWidth<=600)gallery?.querySelectorAll('.gallery-work').forEach(work=>work.style.removeProperty('transform'));galleryDepth();});

// Only the self-contained file changes views in place. Hosted links are genuine
// documents; browser back, base paths and direct studio entry work normally.
let studioLoading=null;
async function showOfflineView(){
  if(!document.querySelector('#offline-studio'))return;
  if(location.hash&&!['#studio','#research','#landing','#paintings'].includes(location.hash))return;
  const route=location.hash==='#studio'?'studio':location.hash==='#research'?'research':'landing';
  for(const view of document.querySelectorAll('[data-offline-view]'))view.hidden=view.dataset.offlineView!==route;
  document.body.dataset.page=route;
  document.title=route==='studio'?'The Painter’s Hand | Painting Studio':route==='research'?'The Painter’s Hand | Research & Methods':'The Painter’s Hand | Photo to Painting & Pencil Drawing';
  if(route==='studio'){
    const status=document.querySelector('#studio-loading');status.hidden=false;
    try{studioLoading??=import('./app.js');(await studioLoading).mountStudio();status.hidden=true;}
    catch(error){studioLoading=null;status.textContent='The studio could not load. Please reopen the saved file. '+error.message;}
  }else window.atelier?.player.pause();
  if(route==='landing'&&location.hash==='#paintings')document.querySelector('#paintings').scrollIntoView();
  else scrollTo(0,0);
  updateMotion();
}
addEventListener('hashchange',showOfflineView);
showOfflineView();

for(const image of document.querySelectorAll('.gallery-button img'))image.addEventListener('error',()=>{
  const note=document.createElement('span');note.textContent='Painting unavailable — please reload.';image.replaceWith(note);
});
