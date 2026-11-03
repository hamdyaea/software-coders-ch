// Developer: Hamdy Abou El Anein | Contact: info@software-coders.ch
// SPDX-License-Identifier: GPL-3.0-only
import fs from 'node:fs';
const {V86}=await import(process.env.ARENA_V86_MODULE||'v86');
const dir=new URL('../arena/runtime',import.meta.url).pathname;
let serial='',stage=0;
const started=Date.now();
const vm=new V86({wasm_path:dir+'/v86.wasm',bios:{url:dir+'/seabios.bin'},vga_bios:{url:dir+'/vgabios.bin'},bzimage:{url:dir+'/vmlinuz.bin'},initrd:{url:dir+'/initrd.bin'},cmdline:'rdinit=/init console=ttyS0,115200 loglevel=0 random.trust_cpu=on pci=conf1 tsc=reliable',memory_size:128*1024*1024,vga_memory_size:2*1024*1024,acpi:false,autostart:true,disable_speaker:true,disable_keyboard:true});
const deadline=setTimeout(()=>done(false,'Timed out: '+serial.slice(-5000)),150000);
function done(ok,message){clearTimeout(deadline);fs.writeFileSync(new URL('../dist/arena-boot-test.log',import.meta.url),serial);console.log(message,Date.now()-started);vm.destroy();process.exit(ok?0:1);}
vm.add_listener('serial0-output-byte',b=>{serial+=String.fromCharCode(b);});
const wait=async(test)=>{const start=Date.now();while(!test()){if(Date.now()-start>20000)throw Error('Command timed out: '+serial.slice(-2000));await new Promise(r=>setTimeout(r,100));}};
async function command(text,expected){serial='';vm.serial0_send(text+'\n');await wait(()=>serial.includes(expected));console.log('PASS',expected);}
(async()=>{
 await wait(()=>serial.includes('root@sc-lab:'));
 console.log('BOOT',Date.now()-started);
 await command('verifier','SC_RESULT:1:FAIL');
 await command('chmod 600 /srv/app/secret.env; verifier','SC_RESULT:1:PASS');
 await command('mission 2; verifier','SC_RESULT:2:FAIL');
 await command("sed -i 's@/srv/www/introuvable@/srv/www/site@' /etc/atelier/web.conf; atelier-web start; sleep 1; verifier",'SC_RESULT:2:PASS');
 await command('mission 3; verifier','SC_RESULT:3:FAIL');
 await command("grep ERROR /var/log/atelier/app.log | sed 's/.*request=\\([^ ]*\\).*/\\1/' > /root/reponse.txt; verifier",'SC_RESULT:3:PASS');
 await command('mission 4; verifier','SC_RESULT:4:FAIL');
 await command('rm /var/cache/atelier/archive.tmp; verifier','SC_RESULT:4:PASS');
 await command("printf '%s\\n' \"$(cat /etc/alpine-release)\"; uname -s",'Linux');
 done(true,'ALL FOUR REAL LINUX INCIDENTS PASSED (negative and positive)');
})().catch(e=>done(false,e.stack));
