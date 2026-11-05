import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {JSDOM} from 'jsdom';
const source=readFileSync(new URL('../public/dashboard.html',import.meta.url),'utf8');
const code=source.slice(source.indexOf('function viewsControl()'),source.indexOf('// End viewsControl'));
function setup(){
 const dom=new JSDOM('<body></body>',{runScripts:'outside-only'}),w=dom.window,calls=[];
 w.ME={stats:{views:93}};w.refresh=()=>{};
 w.api=async(path,method,body)=>{calls.push({path,method,body});return {views:body.target,stats:{views:body.target}}};
 w.h=(tag,attrs={},...children)=>{const el=w.document.createElement(tag);for(const [k,v]of Object.entries(attrs)){if(k==='text')el.textContent=v;else if(k==='html')el.innerHTML=v;else if(k.startsWith('on'))el[k]=v;else if(k==='disabled'||k==='hidden')el[k]=v;else el.setAttribute(k,v);}for(const c of children.flat(Infinity))if(c!=null)el.append(c);return el;};
 w.eval(code+';document.body.append(viewsControl());');
 return {dom,w,calls,input:w.document.querySelector('input'),button:w.document.querySelector('.vm-submit')};
}
const tick=()=>new Promise(r=>setImmediate(r));
test('edición precisa, revisión previa y guardados consecutivos usan el valor actualizado',async()=>{
 const {dom,w,calls,input,button}=setup();
 assert.equal(button.disabled,true);
 input.value='100';input.dispatchEvent(new w.Event('input'));
 assert.equal(w.document.querySelector('.vm-result strong').textContent,'193');
 button.click();assert.equal(calls.length,0);assert.equal(w.document.querySelector('.vm-review').hidden,false);
 button.click();await tick();assert.equal(calls[0].body.expected,93);assert.equal(calls[0].body.target,193);assert.equal(button.disabled,true);
 input.value='25';input.dispatchEvent(new w.Event('input'));button.click();button.click();await tick();
 assert.equal(calls[1].body.expected,193);assert.equal(calls[1].body.target,218);dom.window.close();
});
test('modo total conserva la intención; valida límites y permite cancelar sin guardar',()=>{
 const {dom,w,calls,input,button}=setup();input.value='500';input.dispatchEvent(new w.Event('input'));
 w.document.querySelector('[data-mode=total]').click();assert.equal(input.value,'593');
 for(const value of ['92','93','-1','1.5','10000001','abc','']){input.value=value;input.dispatchEvent(new w.Event('input'));assert.equal(button.disabled,true,value);}
 input.value='1000';input.dispatchEvent(new w.Event('input'));button.click();
 w.document.querySelector('.vm-actions .btn-ghost').click();assert.equal(input.value,'');assert.equal(w.document.querySelector('.vm-review').hidden,true);assert.equal(calls.length,0);dom.window.close();
});
test('fallo de guardado mantiene el ajuste y permite revisar de nuevo',async()=>{
 const {dom,w,input,button}=setup();w.api=async()=>{throw Error('El contador cambió')};input.value='100';input.dispatchEvent(new w.Event('input'));button.click();button.click();await tick();assert.equal(input.value,'100');assert.equal(input.disabled,false);assert.equal(button.textContent,'Revisar ajuste');assert.equal(w.document.querySelector('.vm-error').textContent,'El contador cambió');dom.window.close();
});
