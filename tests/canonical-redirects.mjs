import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const source = await readFile(new URL('../_worker.js', import.meta.url), 'utf8');
const {default:worker} = await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
let calls=0;
const env={ASSETS:{fetch:async()=>{calls++; return new Response('asset',{headers:{'X-Test':'preserved'}});}}};
for (const [input,expected] of [
 ['http://www.software-coders.ch/','https://software-coders.ch/'],
 ['https://www.software-coders.ch/index.html','https://software-coders.ch/'],
 ['https://software-coders.ch:8443/index.html','https://software-coders.ch/'],
 ['https://software-coders.ch:8443/formations/python/?ref=test%20x','https://software-coders.ch/formations/python/?ref=test%20x'],
 ['https://www.software-coders.ch/formations/python/index.html?x=1','https://software-coders.ch/formations/python/?x=1'],
 ['https://software-coders.ch/index.html','https://software-coders.ch/']
]) {const r=await worker.fetch(new Request(input),env);assert.equal(r.status,301);assert.equal(r.headers.get('Location'),expected);}
assert.equal(calls,0);
for(const url of ['https://software-coders.ch/','https://software-coders.ch/formations/python/','https://software-coders-ch.pages.dev/index.html']) {
 const r=await worker.fetch(new Request(url),env);assert.equal(r.status,200);assert.equal(r.headers.get('X-Test'),'preserved');
}
assert.equal(calls,3);
console.log('Canonical redirect tests passed: hosts, ports, paths, queries, no loops, asset passthrough.');
