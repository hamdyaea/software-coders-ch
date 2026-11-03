// Developer: Hamdy Abou El Anein
// Contact: info@software-coders.ch
// SPDX-License-Identifier: GPL-3.0-only
'use strict';
const menuButton=document.querySelector('.menu-toggle');
const menu=document.querySelector('#navigation');
if(menuButton&&menu){
 const close=()=>{menu.classList.remove('open');menuButton.setAttribute('aria-expanded','false');};
 menuButton.addEventListener('click',()=>{const expanded=menu.classList.toggle('open');menuButton.setAttribute('aria-expanded',String(expanded));});
 menu.querySelectorAll('a').forEach(a=>a.addEventListener('click',close));
 document.addEventListener('keydown',e=>{if(e.key==='Escape'){close();menuButton.focus();}});
}
document.querySelectorAll('[data-topic]').forEach(link=>link.addEventListener('click',()=>{
 const subject=document.querySelector('#subject');const msg=document.querySelector('#message');
 if(subject){const topic=link.dataset.topic;const options=[...subject.options];const option=options.find(o=>o.value===topic);subject.value=option?topic:'Autre demande';}
 if(msg&&!msg.value.trim())msg.placeholder='Je souhaite en savoir plus sur : '+link.dataset.topic+'. Mon niveau actuel est…';
}));
const year=document.querySelector('#year');if(year)year.textContent=new Date().getFullYear();
