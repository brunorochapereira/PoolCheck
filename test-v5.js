const fs=require('fs'),vm=require('vm'),assert=require('assert');
function load(path,name){const ctx={console,Date,Math,JSON,crypto:{randomUUID:()=>String(Date.now())}};vm.createContext(ctx);vm.runInContext(fs.readFileSync(path,'utf8')+`;globalThis.__x=${name};`,ctx);return ctx.__x;}
const C=load(__dirname+'/js/chemistry.js','PoolChemistry');
const products={phPlus:{enabled:true,quantity:10},phMinus:{enabled:true,quantity:10},alkalinityPlus:{enabled:true,quantity:10},fastChlorine:{enabled:true,quantity:10}};
const pool={volume:36,highTempThreshold:28};
assert.equal(C.ENGINE_VERSION,'5.0.0');
let r=C.analyse({ph:8.2,freeChlorine:2,alkalinity:60,cya:30,totalChlorine:null,hardness:null,waterTemp:25},pool,products,{});
assert.equal(r.allIssues.find(x=>x.key==='ph-high').blocked,true,'pH alto deve bloquear com alcalinidade baixa');
r=C.analyse({ph:7.4,freeChlorine:2,alkalinity:100,cya:200,totalChlorine:null,hardness:null,waterTemp:25},pool,products,{});
assert.ok(r.allIssues.some(x=>x.key==='cya-critical'&&x.blocked&&x.noSwim));
r=C.analyse({ph:7.4,freeChlorine:1,alkalinity:100,cya:500,totalChlorine:null,hardness:null,waterTemp:25},pool,products,{});
assert.equal(r.label,'Leitura inválida');
r=C.analyse({ph:7.4,freeChlorine:1,alkalinity:100,cya:30,totalChlorine:.5,hardness:null,waterTemp:25},pool,products,{});
assert.equal(r.label,'Leitura inválida');
const d0=C._test.phDose(36,7.0,7.2,true,140,false),d1=C._test.phDose(36,7.0,7.2,true,140,true);
assert.equal(d0.bufferFactor,1);assert.equal(d1.bufferFactor,1.2);
console.log('PoolCheck V5: testes críticos aprovados.');
