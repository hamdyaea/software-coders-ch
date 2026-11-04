#!/usr/bin/env python3
# Developer: Hamdy Abou El Anein | Contact: info@software-coders.ch
from pathlib import Path
import shutil,hashlib,re
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'dist/cloudflare-pages'
if OUT.exists():shutil.rmtree(OUT)
OUT.mkdir(parents=True)
for name in ['index.html','404.html','chatbot.js','chatbot.css','qr.png','robots.txt','sitemap.xml','_headers','css','img','js','lib','arena','formations','hamdy-abou-el-anein']:
 src=ROOT/name
 if src.is_dir():shutil.copytree(src,OUT/name,ignore=shutil.ignore_patterns('*.php','*.scss','*.log','.htaccess','guest','inputs.lock.json'))
 elif src.is_file():shutil.copy2(src,OUT/name)
# Version interface assets by content; binary URLs are always revalidated.
for page_name,assets in [('index.html',['css/site.css','js/site.js']),('arena/index.html',['arena.css','arena.js'])]+[(str(p.relative_to(OUT)),['../../css/site.css','../../js/site.js']) for p in sorted((OUT/'formations').glob('*/index.html'))]+[('hamdy-abou-el-anein/index.html',['../css/site.css','../js/site.js'])]:
 page=OUT/page_name;text=page.read_text()
 for asset in assets:
  target=page.parent/asset
  token=hashlib.sha256(target.read_bytes()).hexdigest()[:12]
  text=re.sub(re.escape(asset)+r'(?:\?v=[a-f0-9]+)?',asset+'?v='+token,text)
 page.write_text(text)
files=[p for p in OUT.rglob('*') if p.is_file()]
assert len(files)<=20000 and all(p.stat().st_size<=25*1024*1024 for p in files)
print('Pages ready:',len(files),'public files')
