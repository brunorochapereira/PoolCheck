const fs=require('fs'),vm=require('vm');
vm.runInThisContext(fs.readFileSync(__dirname+'/js/water.js','utf8'));
function assert(name,condition,value){if(!condition){console.error('FAIL',name,value);process.exitCode=1}else console.log('PASS',name,value??'')}
let r=PoolWater.calculate({centimetres:3,surfaceArea:24,poolVolume:36,reason:'evaporation',pool:{coverType:'bubble'},history:[]});
assert('3 cm over 24 m2 is 720 L',r.litres===720,r.litres);
assert('720 L in 36 m3 is 2 percent',r.percentage===2,r.percentage);
assert('2 percent is minor',r.level==='minor',r.level);
assert('No automatic dosing',r.instructions[0].includes('Não adicione cloro'),r.instructions[0]);
r=PoolWater.calculate({centimetres:8,surfaceArea:25,poolVolume:36,reason:'backwash',history:[]});
assert('5.56 percent is partial',r.level==='partial',r.percentage);
r=PoolWater.calculate({centimetres:20,surfaceArea:25,poolVolume:36,reason:'unknown',history:[]});
assert('13.89 percent is major',r.level==='major',r.percentage);
r=PoolWater.calculate({centimetres:3,surfaceArea:24,poolVolume:36,reason:'evaporation',latestAnalysis:{freeChlorine:0,ph:5,cya:0},history:[]});
assert('Unsafe last analysis creates warnings',r.warnings.length===2,r.warnings);
