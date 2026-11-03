// Developer: Hamdy Abou El Anein | Contact: info@software-coders.ch
// SPDX-License-Identifier: GPL-3.0-only
'use strict';
(() => {
 const $=id=>document.getElementById(id);
 const descriptions=[
  ['Secret trop exposé','Le fichier /srv/app/secret.env est lisible par tout le monde. Limitez sa lecture et son écriture à root, sans modifier son contenu.','Observez les droits avec ls -l. chmod permet de modifier les permissions. 6 = lecture + écriture ; 0 = aucun droit.','Le mode 600 accorde la lecture et l’écriture au propriétaire uniquement.','ls -l /srv/app/secret.env\nchmod 600 /srv/app/secret.env\nverifier'],
  ['Le site ne répond plus','Le serveur pédagogique atelier-web refuse de démarrer. Corrigez DOCUMENT_ROOT dans /etc/atelier/web.conf, puis lancez le service sur le port 8080. Le site se trouve dans /srv/www/site.','Lisez la configuration avec cat. Vérifiez que le répertoire existe. Vous pouvez éditer le fichier avec vi ou sed.','Le chemin du site est incorrect. Après correction, démarrez le vrai serveur HTTP BusyBox et testez-le en local.','cat /etc/atelier/web.conf\nsed -i \'s@/srv/www/introuvable@/srv/www/site@\' /etc/atelier/web.conf\natelier-web start\nwget -qO- http://127.0.0.1:8080/\nverifier'],
  ['La trace dans les logs','Trouvez la requête qui a déclenché une erreur dans /var/log/atelier/app.log. Écrivez uniquement son identifiant (SC-xxxx) dans /root/reponse.txt.','grep filtre les lignes contenant un mot. Le symbole > redirige la sortie d’une commande dans un fichier.','La ligne ERROR contient request=SC-5042. Le fichier de réponse doit contenir cet identifiant uniquement.','grep ERROR /var/log/atelier/app.log\necho SC-5042 > /root/reponse.txt\nverifier'],
  ['Un volume saturé','Le volume /var/cache/atelier est presque plein. Libérez au moins 512 Kio, en conservant le contenu de conserver.conf.','df -h affiche l’occupation des volumes. du -h aide à trouver le fichier qui prend de la place.','L’archive temporaire remplit un véritable petit volume tmpfs. Supprimez-la et conservez la configuration.','df -h /var/cache/atelier\ndu -h /var/cache/atelier\nrm /var/cache/atelier/archive.tmp\nverifier']
 ];
 let vm=null,terminal=null,fit=null,state='idle',active=1,solved=new Set(),line='',buffer='',flush=null,controller=null,epoch=0,deadline=null,scriptPromise=null;
 let validating=false;
 const stateNames={idle:'Prêt à démarrer',loading:'Téléchargement',booting:'Démarrage Linux',running:'Session active',paused:'Session en pause',error:'À réessayer'};
 function setState(value,message){
  state=value;document.body.dataset.state=value;$('state-label').textContent=stateNames[value];if(message)$('status').textContent=message;
  const usable=value==='running';
  $('validate').disabled=!usable||validating;
  $('restart').disabled=!['running','paused','error'].includes(value);
  $('stop').disabled=['idle','error'].includes(value);
  $('start').disabled=['loading','booting'].includes(value);
  document.querySelectorAll('.mission').forEach(b=>b.disabled=['loading','booting','paused'].includes(value));
  notifyHeight();
 }
 function notifyHeight(){if(window.parent!==window)window.parent.postMessage({type:'sc-arena-height',height:Math.ceil(document.querySelector('.arena-shell').getBoundingClientRect().height)+2},location.origin);}
 function select(number,send=false){
  active=number;
  const [title,description,hint,explanation,solution]=descriptions[number-1];
  $('mission-title').textContent=title;$('mission-description').textContent=description;$('hint-text').textContent=hint;$('solution-text').textContent=explanation;$('solution-command').textContent=solution;
  $('hint').open=false;$('solution').open=false;
  document.querySelectorAll('.mission').forEach(b=>{const selected=Number(b.dataset.mission)===number;b.classList.toggle('active',selected);b.setAttribute('aria-pressed',String(selected));});
  validating=false;$('validate').disabled=state!=='running';
  if(send&&state==='running'){vm.serial0_send('\x03mission '+number+'\n');terminal.focus();$('status').textContent='Incident '+number+' initialisé. Explorez, corrigez, puis vérifiez votre solution.';}
  notifyHeight();
 }
 function resetScore(){solved.clear();$('score').textContent='0 / 4';document.querySelectorAll('.mission').forEach(b=>b.classList.remove('done'));}
 function ensureTerminal(){
  if(terminal)return;
  terminal=new Terminal({cursorBlink:true,fontFamily:'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',fontSize:13,lineHeight:1.35,scrollback:1800,convertEol:false,allowProposedApi:false,theme:{background:'#080f1a',foreground:'#cfdfec',cursor:'#78e8bd',selectionBackground:'#2b6455',green:'#78e8bd',brightGreen:'#a4f5d7'}});
  fit=new FitAddon.FitAddon();terminal.loadAddon(fit);terminal.open($('terminal'));fit.fit();
  terminal.onData(data=>{if(vm&&state==='running')vm.serial0_send(data);});
  terminal.onResize(({cols,rows})=>{if(vm&&state==='running')vm.serial0_send('\x03stty cols '+cols+' rows '+rows+'\n');});
  new ResizeObserver(()=>{if(terminal)fit.fit();}).observe($('terminal'));
 }
 function processLine(text){
  const clean=text.replace(/\r/g,'');
  if(clean==='SC_LAB_READY'){
   clearTimeout(deadline);setState('running','Alpine est prêt. Commencez par ls -l /srv/app/secret.env.');
   // The readiness marker precedes the shell; let it attach to the serial TTY.
   const instance=vm,generation=epoch;
   setTimeout(()=>{if(instance===vm&&generation===epoch&&state==='running'){vm.serial0_send('stty cols '+terminal.cols+' rows '+terminal.rows+'\n');if(active!==1)vm.serial0_send('mission '+active+'\n');terminal.focus();}},250);
  }
  const mission=clean.match(/^SC_MISSION:([1-4])$/);
  if(mission&&state==='running'&&Number(mission[1])!==active)select(Number(mission[1]),false);
  const result=clean.match(/^SC_RESULT:([1-4]):(PASS|FAIL)$/);
  if(result){
   validating=false;$('validate').disabled=state!=='running';
   const n=Number(result[1]);
   if(result[2]==='PASS'){
    solved.add(n);$('score').textContent=solved.size+' / 4';document.querySelector('[data-mission="'+n+'"]').classList.add('done');
    $('status').textContent=solved.size===4?'4 / 4 — Tous les incidents sont résolus. Bravo ! Poursuivez avec une formation personnalisée.':'Incident '+n+' résolu. Bien joué ! Choisissez le prochain défi.';
   }else $('status').textContent='Pas encore résolu. Relisez l’objectif ou ouvrez un indice, puis réessayez.';
  }
 }
 function output(byte){
  const char=String.fromCharCode(byte);buffer+=char;
  if(!flush)flush=setTimeout(()=>{flush=null;terminal?.write(buffer);buffer='';},16);
  if(char==='\n'){processLine(line);line='';}else line=(line+char).slice(-2000);
 }
 async function download(item,done){
  const response=await fetch(item.url,{signal:controller.signal,cache:'no-cache'});if(!response.ok)throw Error('Fichier indisponible : '+item.url);
  const reader=response.body.getReader(),chunks=[];let count=0;
  while(true){const {value,done:finished}=await reader.read();if(finished)break;chunks.push(value);count+=value.length;done(value.length);if(count>item.bytes)throw Error('Taille du fichier incorrecte.');}
  if(count!==item.bytes)throw Error('Téléchargement incomplet.');
  const bytes=new Uint8Array(count);let offset=0;chunks.forEach(c=>{bytes.set(c,offset);offset+=c.length;});
  const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),b=>b.toString(16).padStart(2,'0')).join('');
  if(hash!==item.sha256)throw Error('Contrôle d’intégrité refusé.');
  return bytes.buffer;
 }
 function loadEmulator(item){
  if(window.V86)return Promise.resolve();
  if(scriptPromise)return scriptPromise;
  scriptPromise=new Promise((resolve,reject)=>{
   const script=document.createElement('script');script.src=item.url;
   script.integrity='sha256-'+btoa(String.fromCharCode(...item.sha256.match(/../g).map(v=>parseInt(v,16))));script.crossOrigin='anonymous';
   script.onload=()=>resolve();script.onerror=()=>{script.remove();scriptPromise=null;reject(Error('Impossible de charger le moteur Linux.'));};document.head.append(script);
  });return scriptPromise;
 }
 async function start(){
  if(['loading','booting','running','paused'].includes(state))return;
  const generation=++epoch;controller=new AbortController();resetScore();line='';buffer='';validating=false;
  try{
   ensureTerminal();terminal.reset();$('welcome').hidden=true;$('progress').hidden=false;$('progress').value=0;
   setState('loading','Téléchargement d’Alpine Linux… Les fichiers sont vérifiés avant le démarrage.');
   if(!crypto.subtle||!window.WebAssembly)throw Error('Un navigateur récent et HTTPS sont nécessaires.');
   const response=await fetch('manifest.json',{signal:controller.signal,cache:'no-store'});if(!response.ok)throw Error('Manifeste indisponible.');
   const manifest=await response.json(),files=manifest.files,required=['v86.wasm','seabios.bin','vgabios.bin','vmlinuz.bin','initrd.bin'];
   if(manifest.schema!==1||manifest.memory_mib!==128||required.some(n=>!files[n]||!/^[a-f0-9]{64}$/.test(files[n].sha256)||files[n].bytes>16*1024*1024))throw Error('Manifeste invalide.');
   let bytes=0;const total=required.reduce((s,n)=>s+files[n].bytes,0);
   await loadEmulator(files['libv86.js']);if(generation!==epoch)return;
   const data=Object.fromEntries(await Promise.all(required.map(async n=>[n,await download(files[n],delta=>{bytes+=delta;$('progress').value=Math.round(bytes/total*100);$('status').textContent='Téléchargement vérifié : '+(bytes/1048576).toFixed(1)+' / '+(total/1048576).toFixed(1)+' Mo';})])));
   if(generation!==epoch)return;
   $('progress').hidden=true;setState('booting','Démarrage du noyau Linux… Patientez, le terminal va apparaître.');
   vm=new V86({wasm_fn:async imports=>(await WebAssembly.instantiate(data['v86.wasm'],imports)).instance.exports,bios:{buffer:data['seabios.bin']},vga_bios:{buffer:data['vgabios.bin']},bzimage:{buffer:data['vmlinuz.bin']},initrd:{buffer:data['initrd.bin']},cmdline:'rdinit=/init console=ttyS0,115200 loglevel=0 random.trust_cpu=on pci=conf1 tsc=reliable',memory_size:128*1024*1024,vga_memory_size:2*1024*1024,acpi:false,autostart:false,disable_speaker:true,disable_keyboard:true});
   const instance=vm;instance.arenaReady=false;
   instance.add_listener('emulator-ready',()=>{
    instance.arenaReady=true;
    if(instance!==vm){instance.destroy().catch(()=>{});return;}
    instance.run().catch(error=>{if(instance===vm)fail(error.message);});
   });
   vm.add_listener('serial0-output-byte',output);
   deadline=setTimeout(()=>{if(generation===epoch)fail('Démarrage trop long. Recommencez ou essayez un ordinateur plus rapide.');},150000);
  }catch(error){if(generation===epoch&&error.name!=='AbortError')fail(error.message);}
 }
 function teardown(){++epoch;controller?.abort();controller=null;clearTimeout(deadline);clearTimeout(flush);flush=null;buffer='';line='';validating=false;if(vm){const old=vm;vm=null;if(old.arenaReady)old.destroy().catch(()=>{});}}
 function fail(message){teardown();$('progress').hidden=true;$('welcome').hidden=false;$('start').textContent='Réessayer le démarrage';setState('error',message); }
 function stop(){teardown();terminal?.reset();resetScore();$('progress').hidden=true;$('welcome').hidden=false;$('start').textContent='Démarrer le laboratoire ↗';setState('idle','Session arrêtée. Le prochain démarrage créera un système neuf.');}
 $('start').addEventListener('click',start);
 $('stop').addEventListener('click',stop);
 $('restart').addEventListener('click',()=>{stop();start();});
 $('validate').addEventListener('click',()=>{if(state==='running'){validating=true;$('validate').disabled=true;$('status').textContent='Vérification dans votre système Linux…';vm.serial0_send('\x03verifier\n');terminal.focus();}});
 document.querySelectorAll('.mission').forEach(b=>b.addEventListener('click',()=>select(Number(b.dataset.mission),true)));
 $('fullscreen').addEventListener('click',async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.querySelector('.arena-shell').requestFullscreen();}catch{$('status').textContent='Le plein écran est indisponible dans ce navigateur.';}});
 document.addEventListener('visibilitychange',()=>{if(!vm)return;if(document.hidden&&state==='running'){vm.stop();setState('paused','Session en pause pendant votre absence.');}else if(!document.hidden&&state==='paused'){vm.run();setState('running','Session reprise. Vos fichiers sont conservés jusqu’au redémarrage.');}});
 window.addEventListener('message',event=>{if(event.origin===location.origin&&event.source===window.parent&&event.data?.type==='sc-arena-start')start();});
 window.addEventListener('pagehide',teardown);
 new ResizeObserver(notifyHeight).observe(document.querySelector('.arena-shell'));
 select(1);notifyHeight();
})();
