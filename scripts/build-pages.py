#!/usr/bin/env python3
# Developer: Hamdy Abou El Anein | Contact: info@software-coders.ch
from pathlib import Path
import shutil
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'dist/cloudflare-pages'
if OUT.exists():shutil.rmtree(OUT)
OUT.mkdir(parents=True)
for name in ['index.html','404.html','chatbot.js','chatbot.css','qr.png','robots.txt','sitemap.xml','_headers','css','img','js','lib']:
 src=ROOT/name
 if src.is_dir():shutil.copytree(src,OUT/name,ignore=shutil.ignore_patterns('*.php','*.scss','*.log','.htaccess'))
 elif src.is_file():shutil.copy2(src,OUT/name)
files=[p for p in OUT.rglob('*') if p.is_file()]
assert len(files)<=20000 and all(p.stat().st_size<=25*1024*1024 for p in files)
print('Pages ready:',len(files),'public files')
