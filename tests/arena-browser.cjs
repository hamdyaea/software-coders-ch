// Developer: Hamdy Abou El Anein | Contact: info@software-coders.ch
// SPDX-License-Identifier: GPL-3.0-only
const {chromium}=require(process.env.ARENA_PLAYWRIGHT||'playwright');
const fs=require('fs'),path=require('path');
const base=process.env.ARENA_URL||'http://127.0.0.1:34409/';
const out=path.resolve(__dirname,'../dist/arena-qa');fs.mkdirSync(out,{recursive:true});
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.ARENA_BROWSER||'/usr/bin/chromium',headless:true,args:['--disable-dev-shm-usage']});
 const page=await browser.newPage({viewport:{width:1440,height:1100}});const errors=[],requests=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>requests.push(r.url()));
 await page.goto(base,{waitUntil:'networkidle'});
 const arena=page.frames().find(f=>new URL(f.url()).pathname==='/arena/');
 if(!arena)throw Error('Missing lab');
 await arena.waitForSelector('#start');
 if(requests.some(u=>/initrd|vmlinuz|v86.wasm/.test(u)))throw Error('Unexpected automatic runtime download');
 await page.screenshot({path:path.join(out,'home-desktop.png'),fullPage:true});
 await page.locator('#launch-arena').click();
 await arena.waitForFunction(()=>['running','error'].includes(document.body.dataset.state),{},{timeout:160000});
 console.log('STATE',await arena.locator('body').getAttribute('data-state'),await arena.locator('#status').innerText());
 if(await arena.locator('body').getAttribute('data-state')!=='running')throw Error(await arena.locator('#status').innerText());
 await arena.waitForTimeout(500);
 if((await arena.locator('.xterm-rows').innerText()).includes('stty cols'))throw Error('Boot injected stty into the prompt');
 await arena.locator('.xterm-helper-textarea').focus();
 await page.keyboard.type('uname -s',{delay:45});await page.keyboard.press('Enter');
 await arena.waitForTimeout(500);
 await arena.locator('#validate').click();
 await arena.waitForFunction(()=>document.getElementById('status').textContent.startsWith('Pas encore'),{},{timeout:10000});
 await arena.locator('.xterm-helper-textarea').focus();await page.keyboard.type('chmod 600 /srv/app/secret.env',{delay:30});await page.keyboard.press('Enter');
 await arena.waitForTimeout(300);await arena.locator('#validate').click();
 await arena.waitForFunction(()=>document.getElementById('score').textContent==='1 / 4',{},{timeout:10000});
 console.log('BROWSER KEYBOARD + FAILED AND SUCCESSFUL VALIDATION PASS');
 // Hints, solutions and viewport changes must preserve jobs and unfinished input.
 await arena.locator('.xterm-helper-textarea').focus();
 await page.keyboard.type('sleep 3; echo RESIZE_JOB_DONE');await page.keyboard.press('Enter');
 await arena.locator('#hint summary').click();await arena.locator('#solution summary').click();
 await page.setViewportSize({width:1280,height:1000});
 await arena.waitForFunction(()=>document.querySelector('.xterm-rows').innerText.split('\n').some(l=>l.trim()==='RESIZE_JOB_DONE'),{},{timeout:10000});
 await arena.locator('.xterm-helper-textarea').focus();await page.keyboard.type('echo INPUT_');
 await arena.locator('#hint summary').click();await arena.locator('#solution summary').click();
 await page.setViewportSize({width:1440,height:1100});
 await arena.locator('.xterm-helper-textarea').focus();await page.keyboard.type('PRESERVED');await page.keyboard.press('Enter');
 await arena.waitForFunction(()=>document.querySelector('.xterm-rows').innerText.split('\n').some(l=>l.trim()==='INPUT_PRESERVED'),{},{timeout:10000});
 console.log('RESIZE PRESERVES FOREGROUND JOB AND PARTIAL COMMAND PASS');

 await page.screenshot({path:path.join(out,'lab-running.png'),fullPage:true});
 await arena.locator('[data-mission="3"]').click();await arena.waitForTimeout(300);
 await arena.locator('.xterm-helper-textarea').focus();await page.keyboard.type('echo SC-5042 > /root/reponse.txt',{delay:25});await page.keyboard.press('Enter');
 await arena.waitForTimeout(300);await arena.locator('#validate').click();
 await arena.waitForFunction(()=>document.getElementById('score').textContent==='2 / 4',{},{timeout:10000});
 await arena.locator('#hint summary').click();await arena.locator('#solution summary').click();
 await page.screenshot({path:path.join(out,'lab-hints.png'),fullPage:true});
 // Complete the remaining exercises through the actual browser terminal.
 for(const [mission,command,score] of [
  [2,"sed -i 's@/srv/www/introuvable@/srv/www/site@' /etc/atelier/web.conf; atelier-web start",3],
  [4,"rm /var/cache/atelier/archive.tmp",4]
 ]){
  await arena.locator('[data-mission="'+mission+'"]').click();await arena.waitForTimeout(500);
  await arena.locator('#validate').click();
  await arena.waitForFunction(()=>document.getElementById('status').textContent.startsWith('Pas encore'),{},{timeout:10000});
  await arena.locator('.xterm-helper-textarea').focus();await page.keyboard.type(command,{delay:15});await page.keyboard.press('Enter');
  await arena.waitForTimeout(500);await arena.locator('#validate').click();
  await arena.waitForFunction(score=>document.getElementById('score').textContent===score+' / 4',score,{timeout:10000});
 }
 console.log('ALL FOUR BROWSER REPAIRS PASS');
 await arena.locator('#restart').click();
 await arena.waitForFunction(()=>document.body.dataset.state==='running',{},{timeout:160000});
 await arena.waitForTimeout(1000);
 if(await arena.locator('#score').innerText()!=='0 / 4')throw Error('Restart kept score');
 await arena.locator('#validate').click();
 try { await arena.waitForFunction(()=>document.getElementById('status').textContent.startsWith('Pas encore'),{},{timeout:10000}); } catch(error) { console.log('RESTART DIAGNOSTIC',await arena.locator('#status').innerText(),await arena.locator('.xterm-rows').innerText());throw error; }
 await arena.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});document.dispatchEvent(new Event('visibilitychange'));});
 await arena.waitForFunction(()=>document.body.dataset.state==='paused');
 await arena.waitForTimeout(200);
 await arena.evaluate(()=>{delete document.hidden;document.dispatchEvent(new Event('visibilitychange'));});
 await arena.waitForFunction(()=>document.body.dataset.state==='running');
 await arena.locator('#stop').click();
 await arena.waitForFunction(()=>document.body.dataset.state==='idle');
 console.log('CLEAN RESTART, AUTOMATIC PAUSE/RESUME, STOP PASS');
 for(const width of [390,768,1280]){
  await page.setViewportSize({width,height:1000});await page.waitForTimeout(400);
  const sizes=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,client:document.documentElement.clientWidth}));
  const inner=await arena.evaluate(()=>({scroll:document.documentElement.scrollWidth,client:document.documentElement.clientWidth}));
  if(sizes.scroll>sizes.client||inner.scroll>inner.client)throw Error('Horizontal overflow '+width+' '+JSON.stringify({sizes,inner}));
  const frameHeight=await page.locator('#arena-frame').evaluate(e=>e.clientHeight);const contentHeight=await arena.locator('.arena-shell').evaluate(e=>e.getBoundingClientRect().height);
  if(frameHeight<contentHeight-2)throw Error('Clipped iframe '+width);
  if(width===390)await page.screenshot({path:path.join(out,'home-mobile.png'),fullPage:true});
 }
 if(errors.length)throw Error(errors.join('; '));
 fs.writeFileSync(path.join(out,'result.json'),JSON.stringify({result:'PASS',url:base,realLinuxBoot:true,realBrowserKeyboard:true,negativeAndPositiveValidation:true,missionSwitch:true,hints:true,stop:true,allFourIncidents:true,restartClean:true,pauseResume:true,mobileNoOverflow:true,errors},null,2));
 console.log('PASS',base);await browser.close();
})().catch(e=>{console.error(e);process.exit(1);});
