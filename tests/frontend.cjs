const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {launch}=require('./browser-launch.cjs');

async function checkStudioAtmosphere(page){
 await page.waitForFunction(()=>document.querySelector('[data-studio]').dataset.presenceMounted==='true');
 assert(await page.locator('.studio-scenery').evaluate(el=>getComputedStyle(el).backgroundImage!=='none'),'The studio has its decorative scenery');
 await page.evaluate(()=>window.scrollTo(0,0));await page.waitForFunction(()=>document.querySelector('[data-studio]').dataset.atmosphere==='playing');
 await page.locator('#studio-motion').focus();await page.keyboard.press('Enter');
 assert.equal(await page.locator('[data-studio]').getAttribute('data-atmosphere'),'paused');assert.equal(await page.locator('#studio-motion').getAttribute('aria-pressed'),'true');
 assert.equal(await page.locator('.studio-scenery').evaluate(el=>getComputedStyle(el).animationPlayState),'paused');
 await page.keyboard.press('Enter');assert.equal(await page.locator('[data-studio]').getAttribute('data-atmosphere'),'playing');
 await page.locator('footer').scrollIntoViewIfNeeded();await page.waitForFunction(()=>document.querySelector('[data-studio]').dataset.atmosphere==='paused');
 await page.evaluate(()=>window.scrollTo(0,0));await page.waitForFunction(()=>document.querySelector('[data-studio]').dataset.atmosphere==='playing');
 const essentialContrast=await page.evaluate(()=>{const luminance=color=>{const channels=color.match(/[\d.]+/g).slice(0,3).map(Number).map(value=>{value/=255;return value<=.04045?value/12.92:((value+.055)/1.055)**2.4;});return channels[0]*.2126+channels[1]*.7152+channels[2]*.0722;};return ['#drop strong','label[for="interpretation"]'].map(selector=>{const element=document.querySelector(selector);let background=element;while(getComputedStyle(background).backgroundColor==='rgba(0, 0, 0, 0)')background=background.parentElement;const text=luminance(getComputedStyle(element).color),surface=luminance(getComputedStyle(background).backgroundColor);return {selector,ratio:(Math.max(text,surface)+.05)/(Math.min(text,surface)+.05)};});});
 assert(essentialContrast.every(sample=>sample.ratio>=4.5),'Essential controls on parchment retain readable text contrast: '+JSON.stringify(essentialContrast));
}

// Frontend contracts: actual compiled production assets, not a concept screenshot.
(async()=>{
 const server=process.env.FRONTEND_URL?null:await require('./server.cjs').startServer(path.join(__dirname,'../dist'));
 const base=process.env.FRONTEND_URL??server.base;
 const output=process.env.FRONTEND_RESULTS??path.join(__dirname,'results/frontend');fs.mkdirSync(output,{recursive:true});
 const browser=await launch(),errors=[],failures=[];
 const page=await browser.newPage({viewport:{width:1440,height:1000}});
 page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)failures.push({url:r.url(),status:r.status()});});
 const scriptResponses=[];page.on('response',r=>{if(new URL(r.url()).pathname.endsWith('.js'))scriptResponses.push(r);});
 try{
  await page.goto(base+'/index.html',{waitUntil:'networkidle'});
  assert.equal((await page.locator('h1').innerText()).replace(/\s+/g,' ').trim(),"The Painter’s Hand");
  assert.equal(await page.evaluate(()=>typeof window.atelier),'undefined','Painting models must initialize only on entering the studio');
  const scriptBytes=(await Promise.all(scriptResponses.map(async r=>(await r.body()).length))).reduce((a,b)=>a+b,0);
  assert(scriptBytes<2_000_000,'Landing must not fetch the 52MB neural-policy bundle');
  const performanceSample=await page.evaluate(()=>{const navigation=performance.getEntriesByType('navigation')[0];return {environment:'Local Chrome, unthrottled fresh browser context; one sample, no Lighthouse score',domContentLoadedMs:navigation.domContentLoadedEventEnd,loadMs:navigation.loadEventEnd,firstContentfulPaintMs:performance.getEntriesByType('paint').find(entry=>entry.name==='first-contentful-paint')?.startTime??null,initialResourceTransferBytes:performance.getEntriesByType('resource').reduce((sum,entry)=>sum+entry.transferSize,0),initialResourceCount:performance.getEntriesByType('resource').length};});
  assert.equal(await page.locator('.gallery-button').count(),6);
  for(const [filter,count] of [['colour',5],['graphite',1],['all',6]]){await page.locator('[data-gallery-filter="'+filter+'"]').click();assert.equal(await page.locator('.gallery-button:visible').count(),count);assert.equal(await page.locator('[data-gallery-filter="'+filter+'"]').getAttribute('aria-pressed'),'true');}
  await page.evaluate(()=>window.scrollTo(0,0));await page.waitForFunction(()=>document.querySelector('.hero').dataset.motion==='playing');
  await page.locator('#hero-muse svg').waitFor();
  assert.equal(await page.locator('.hero').getAttribute('data-motion'),'playing');
  assert.equal(await page.locator('#motion-toggle').count(),0,'Landing artwork plays automatically without a motion control');
  // Freeze the real CSS animation at both the rest and halfway positions.
  const motionPositions=[];
  for(const [name,time] of [['rest',0],['maximum',1820]]){
   await page.evaluate(time=>{for(const animation of document.querySelector('.muse-arm').getAnimations()){animation.pause();animation.currentTime=time;}},time);
   motionPositions.push(await page.evaluate(()=>({arm:getComputedStyle(document.querySelector('.muse-arm')).transform,body:getComputedStyle(document.querySelector('.muse-body')).transform})));
   await page.screenshot({path:path.join(output,'hero-'+name+'.png')});
  }
  assert.notEqual(motionPositions[0].arm,motionPositions[1].arm,'The painting forearm must visibly articulate');assert.equal(motionPositions[0].body,motionPositions[1].body,'The original body placement remains stationary');
  await page.evaluate(()=>{for(const animation of document.querySelector('.muse-arm').getAnimations())animation.play();});
  assert.equal(await page.locator('.hero').getAttribute('data-motion'),'playing');
  await page.locator('footer').scrollIntoViewIfNeeded();
  await page.waitForFunction(()=>document.querySelector('.hero').dataset.motion==='paused');
  const first=page.locator('.gallery-button').first();await first.focus();await page.keyboard.press('Enter');
  await page.waitForFunction(()=>document.querySelector('#painting-viewer').open);
  await page.locator('#painting-viewer img').evaluate(image=>image.decode());
  assert((await page.locator('#painting-viewer h2').innerText()).length>0);
  await page.keyboard.press('Escape');await page.waitForFunction(()=>!document.querySelector('#painting-viewer').open);
  assert(await first.evaluate(el=>el===document.activeElement),'Gallery Escape restores focus to its trigger');
  for(const image of await page.locator('.gallery-button img').all()){await image.scrollIntoViewIfNeeded();await image.evaluate(el=>el.decode());assert(await image.evaluate(el=>el.naturalWidth>0));}
  for(const trigger of await page.locator('.gallery-button').all()){await trigger.click();await page.waitForFunction(()=>document.querySelector('#painting-viewer').open);await page.locator('#painting-viewer img').evaluate(image=>image.decode());assert(await page.locator('#painting-viewer img').evaluate(image=>image.naturalWidth>=400));await page.keyboard.press('Escape');assert(await trigger.evaluate(el=>el===document.activeElement));}
  await page.evaluate(()=>window.scrollTo(0,0));await page.waitForFunction(()=>document.querySelector('.hero').dataset.motion==='playing');
  await page.screenshot({path:path.join(output,'after-desktop.png'),fullPage:true});
  await page.locator('.exhibition').screenshot({path:path.join(output,'gallery-desktop.png')});
  const headings=await page.locator('h2').allTextContents();assert(headings.some(text=>text.includes('Room for')));assert(headings.some(text=>text.includes('learned hand')));
  assert(await page.locator('footer').innerText().then(text=>text.includes('Praveen Nimilka')));
  await page.getByRole('link',{name:'Enter the atelier',exact:true}).first().click();
  await page.waitForFunction(()=>window.atelier);assert(new URL(page.url()).pathname.endsWith('/studio.html'));
  assert.equal(await page.locator('#engine').inputValue(),'recommended');assert(await page.locator('#background').isChecked());
  await checkStudioAtmosphere(page);
  assert(await page.locator('#paper').isVisible());await page.screenshot({path:path.join(output,'after-studio-desktop.png'),fullPage:true});
  const mobile=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});mobile.on('pageerror',e=>errors.push(e.message));
  for(const [name,file] of [['landing','index.html'],['studio','studio.html'],['research','research.html']]){
   await mobile.goto(base+'/'+file,{waitUntil:'networkidle'});
   if(name==='studio'){await mobile.waitForFunction(()=>window.atelier);await checkStudioAtmosphere(mobile);}
   if(name==='landing'){assert(await mobile.evaluate(()=>{const art=document.querySelector('.hero-muse').getBoundingClientRect(),copy=document.querySelector('.hero-copy').getBoundingClientRect(),title=document.querySelector('.hero-heading').getBoundingClientRect();return title.bottom<=art.top+1&&art.bottom<=copy.top+1;}),'Mobile title, original centered character and actions occupy separate rows');for(const image of await mobile.locator('.gallery-button img').all()){await image.scrollIntoViewIfNeeded();await image.evaluate(el=>el.decode());}await mobile.locator('.gallery-track').evaluate(el=>el.scrollLeft=0);await mobile.locator('.exhibition').screenshot({path:path.join(output,'gallery-mobile.png')});}
   await mobile.evaluate(()=>window.scrollTo(0,0));
   assert(await mobile.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth),name+' must not overflow the mobile viewport');
   await mobile.screenshot({path:path.join(output,'after-'+(name==='landing'?'mobile':name+'-mobile')+'.png'),fullPage:true});
  }
  const reduced=await browser.newPage({viewport:{width:390,height:844},reducedMotion:'reduce'});await reduced.goto(base+'/index.html',{waitUntil:'networkidle'});
  assert.equal(await reduced.locator('.hero').getAttribute('data-motion'),'paused','Reduced-motion preference starts with the hand still');await reduced.close();
  const reducedStudio=await browser.newPage({viewport:{width:390,height:844},reducedMotion:'reduce'});await reducedStudio.goto(base+'/studio.html',{waitUntil:'networkidle'});await reducedStudio.waitForFunction(()=>window.atelier);assert.equal(await reducedStudio.locator('[data-studio]').getAttribute('data-atmosphere'),'paused');assert(await reducedStudio.locator('#studio-motion').isDisabled());assert.equal(await reducedStudio.locator('.studio-scenery').evaluate(el=>getComputedStyle(el).animationName),'none');await reducedStudio.screenshot({path:path.join(output,'studio-reduced-motion.png')});await reducedStudio.close();
  const additionalViewports=[];
  for(const [width,height] of [[320,740],[768,1024]]){const narrow=await browser.newPage({viewport:{width,height}});await narrow.goto(base+'/index.html',{waitUntil:'networkidle'});assert(await narrow.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Landing fits width '+width);assert(await narrow.getByRole('link',{name:'Enter the atelier',exact:true}).first().isVisible());await narrow.screenshot({path:path.join(output,'landing-'+width+'.png')});additionalViewports.push({width,height,overflow:false});await narrow.close();}
  const missing=await browser.newPage();const missingErrors=[];missing.on('pageerror',error=>missingErrors.push(error.message));await missing.route('**/portrait-blue*.webp',route=>route.abort());await missing.goto(base+'/index.html');const missingTrigger=missing.locator('.gallery-button').nth(1);await missingTrigger.scrollIntoViewIfNeeded();await missing.getByText('Painting unavailable — please reload.',{exact:true}).waitFor();await missingTrigger.click();await missing.waitForFunction(()=>document.querySelector('#painting-viewer').open);await missing.locator('#painting-viewer img').evaluate(el=>el.decode());assert.deepEqual(missingErrors,[],'A missing thumbnail must retain a working full-image viewer');await missing.close();
  assert.deepEqual(errors,[]);assert.deepEqual(failures,[]);
  const report={scope:(process.env.FRONTEND_URL?'Configured frontend URL inspection':'Production dist build inspection')+'; desktop1440x1000, mobile390x844 Chrome/touch emulation, not physical phones',landingScriptBytes:scriptBytes,performanceSample,motionPositions,additionalViewports,checks:['Deferred studio/model loading','Live HTML headline','Six real exports decoded with six full-image viewers','Colour/pencil gallery filters','Native gallery dialog keyboard close and focus restoration','Animation pause/resume and offscreen suspension','Real CSS hand rest/maximum screenshots with stationary body','Reduced motion','Working landing-to-studio CTA','Recommended/background defaults','Studio scenery with keyboard atmosphere pause/resume and offscreen suspension','Studio reduced-motion disables decorative animation','Desktop/mobile/research routes without overflow','320px mobile and768px tablet compositions','Missing-thumbnail recovery retains full-image viewer','Creator footer'],errors,failures};
  fs.writeFileSync(path.join(output,'frontend.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
 }finally{await browser.close();server?.close();}
})().catch(e=>{console.error(e);process.exit(1)});
