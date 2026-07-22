const fs=require('fs'),vm=require('vm'),assert=require('assert');
const bag={};const localStorage={getItem:k=>Object.prototype.hasOwnProperty.call(bag,k)?bag[k]:null,setItem:(k,v)=>bag[k]=String(v),removeItem:k=>delete bag[k]};
const ctx={console,localStorage,JSON,Date,Math};vm.createContext(ctx);vm.runInContext(fs.readFileSync(__dirname+'/js/storage.js','utf8')+';globalThis.store=PoolStore;',ctx);
const S=ctx.store;
S.update(s=>{s.analyses.unshift({id:'a1'});s.waterTopUps.unshift({id:'w1'});s.productHistory.unshift({id:'p1'});s.assistantHistory.unshift({id:'h1'});s.learning.observations.unshift({id:'o1'});s.predictions.items.unshift({id:'pr1'});});
const x=S.get();assert.equal(x.analyses.length,1);assert.equal(x.waterTopUps.length,1);assert.equal(x.productHistory.length,1);assert.equal(x.assistantHistory.length,1);assert.equal(x.learning.observations.length,1);assert.equal(x.predictions.items.length,1);
const exported=JSON.parse(S.export());assert.equal(exported.dataVersion,5);assert.equal(exported.appVersion,'5.0.0');
console.log('PoolCheck V5: persistência de arrays aprovada.');
