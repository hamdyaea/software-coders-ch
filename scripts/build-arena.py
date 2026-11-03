#!/usr/bin/env python3
# Developer: Hamdy Abou El Anein | Contact: info@software-coders.ch
# SPDX-License-Identifier: GPL-3.0-only
"""Rebuild the browser-only Alpine laboratory from checksum-locked inputs.
No guest binary is executed on the host. Run as an ordinary user on Linux.
"""
import base64,hashlib,json,os,shutil,subprocess,tarfile,urllib.request
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
WORK=ROOT/'dist/arena-build'
OUT=ROOT/'arena/runtime'
def fetch(url,digest,algorithm='sha256',encoded=False):
 target=WORK/(hashlib.sha256(url.encode()).hexdigest()[:16]+'.download')
 if not target.exists():
  with urllib.request.urlopen(url,timeout=120) as r:target.write_bytes(r.read())
 raw=hashlib.new(algorithm,target.read_bytes()).digest()
 actual=base64.b64encode(raw).decode() if encoded else raw.hex()
 if actual!=digest:raise ValueError('Checksum mismatch: '+url)
 return target
def main():
 if os.geteuid()==0:raise SystemExit('Build as an ordinary user, never root.')
 WORK.mkdir(parents=True,exist_ok=True);OUT.mkdir(parents=True,exist_ok=True)
 lock=json.loads((ROOT/'arena/inputs.lock.json').read_text())
 root=WORK/'root'
 if root.exists():shutil.rmtree(root)
 root.mkdir()
 src=fetch(lock['rootfs']['url'],lock['rootfs']['sha256'])
 subprocess.run(['bsdtar','-xpf',str(src),'-C',str(root),'--no-same-owner'],check=True)
 extra=fetch(lock['extras']['url'],lock['extras']['sha256'])
 shutil.copyfile(extra,root/'tmp/arena-extras.apk')
 subprocess.run(['bwrap','--unshare-user','--unshare-pid','--unshare-ipc','--unshare-uts','--uid','0','--gid','0','--bind',str(root),'/','--proc','/proc','--dev','/dev','--die-with-parent','/sbin/apk','--repositories-file','/dev/null','add','--no-network','--no-cache','/tmp/arena-extras.apk'],check=True)
 (root/'tmp/arena-extras.apk').unlink()
 # Only this freshly extracted, disposable root receives the pedagogical overlay.
 for name in ['init','mission','verifier','atelier-web','aide']:
  dest=root/('init' if name=='init' else 'usr/local/bin/'+name)
  dest.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(ROOT/'arena/guest'/name,dest);dest.chmod(0o755)
 (root/'etc/hostname').write_text('sc-lab\n')
 with (OUT/'initrd.bin').open('wb') as stream:
  subprocess.run(['bash','--noprofile','--norc','-o','pipefail','-c','find . -print0 | LC_ALL=C sort -z | cpio --null -o --format=newc --owner=0:0 2>/dev/null | gzip -n -9'],cwd=root,stdout=stream,check=True)
 for name,item in lock['binary'].items():shutil.copyfile(fetch(item['url'],item['sha256']),OUT/name)
 for package,item in lock['npm'].items():
  archive=fetch(item['url'],item['sha512'],'sha512',True)
  with tarfile.open(archive) as t:
   for source,dest in item['files'].items():
    data=t.extractfile('package/'+source).read()
    target=ROOT/'arena'/dest;target.parent.mkdir(parents=True,exist_ok=True);target.write_bytes(data)
 # Exact inventory of Alpine packages retained for source/licence traceability.
 packages=[]
 for block in (root/'lib/apk/db/installed').read_text().split('\n\n'):
  values=dict(l.split(':',1) for l in block.splitlines() if ':' in l)
  if 'P' in values:packages.append({k:values.get(k) for k in ['P','V','L','o']})
 (ROOT/'arena/packages.json').write_text(json.dumps(packages,indent=2)+'\n')
 manifest={'schema':1,'alpine':'3.22.7','memory_mib':128,'network_relay':False,'persistence':False,'files':{}}
 for name in ['initrd.bin','vmlinuz.bin','v86.wasm','seabios.bin','vgabios.bin','libv86.js']:
  p=OUT/name
  if p.stat().st_size>16*1024*1024:raise ValueError('Asset exceeds 16 MiB: '+name)
  manifest['files'][name]={'url':'runtime/'+name,'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()}
 (ROOT/'arena/manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
 print('Alpine Arena ready:',sum(i['bytes'] for i in manifest['files'].values()),'runtime bytes')
if __name__=='__main__':main()
