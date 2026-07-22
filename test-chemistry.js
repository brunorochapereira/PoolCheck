const fs=require('fs'),vm=require('vm');vm.runInThisContext(fs.readFileSync(__dirname+'/js/chemistry.js','utf8'));
function assert(name,cond,val){if(!cond){console.error('FAIL',name,val);process.exitCode=1}else console.log('PASS',name,val??'')}
const p={phPlus:{enabled:true,quantity:10},phMinus:{enabled:true,quantity:10},alkalinityPlus:{enabled:true,quantity:10},fastChlorine:{enabled:true,quantity:10},liquidChlorine:{enabled:false,quantity:0},multitabs:{enabled:true,quantity:8},slowChlorine:{enabled:true,quantity:2}};
let r=PoolChemistry.analyse({ph:5,freeChlorine:0,alkalinity:100,waterTemp:26,totalChlorine:null,cya:null},{volume:36,highTempThreshold:28},p);
let ph=r.allIssues.find(x=>x.key==='ph-low');assert('pH 5 uses staged dose',ph.productAmount===0.72,ph.productAmount);assert('pH 5 requires retest',ph.staged===true);
r=PoolChemistry.analyse({ph:7.4,freeChlorine:1.5,alkalinity:60,waterTemp:25,totalChlorine:null,cya:null},{volume:36},p);
let alk=r.allIssues.find(x=>x.key==='alk-low');assert('TA +20 ppm dose',alk.productAmount===1.3,alk.productAmount);
r=PoolChemistry.analyse({ph:7.4,freeChlorine:0,alkalinity:100,waterTemp:25,totalChlorine:null,cya:null},{volume:36},p);
let cl=r.allIssues.find(x=>x.key==='chlorine-low');assert('Fast chlorine dose around 100 g',cl.productAmount===0.1,cl.productAmount);
r=PoolChemistry.analyse({ph:7.4,freeChlorine:0,alkalinity:100,waterTemp:25,totalChlorine:null,cya:null},{volume:36},{multitabs:{enabled:true,quantity:8},slowChlorine:{enabled:true,quantity:2}});
cl=r.allIssues.find(x=>x.key==='chlorine-low');assert('Slow chlorine no arbitrary tablet dose',cl.slowOnly===true,cl.instruction);
r=PoolChemistry.analyse({ph:7.0,freeChlorine:1.5,alkalinity:100,waterTemp:25,totalChlorine:null,cya:null},{volume:36},{phPlus:{enabled:true,quantity:0.1}});
const phLow=r.allIssues.find(x=>x.key==='ph-low');
assert('Insufficient pH+ stock blocks calculated step',phLow.blocked===true,phLow.instruction);
r=PoolChemistry.analyse({ph:7.4,freeChlorine:1.5,alkalinity:60,waterTemp:25,totalChlorine:null,cya:null},{volume:36},{alkalinityPlus:{enabled:true,quantity:0.2}});
const alkLow=r.allIssues.find(x=>x.key==='alk-low');
assert('Insufficient alkalinity stock blocks calculated step',alkLow.blocked===true,alkLow.instruction);
