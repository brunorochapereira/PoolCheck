const PoolWater=(()=>{
 const THRESHOLDS={minorPercent:3,majorPercent:10};
 const REASONS={
  evaporation:'Evaporação',
  backwash:'Backwash ou aspiração para esgoto',
  use:'Utilização e salpicos',
  leak:'Possível fuga',
  unknown:'Não sei'
 };
 const number=value=>Number.isFinite(Number(value))?Number(value):0;
 const round=value=>value>=100?Math.round(value/10)*10:Math.round(value);
 const fmt=value=>Number(value).toLocaleString('pt-PT',{maximumFractionDigits:1});

 function calculate(input={}){
  const centimetres=number(input.centimetres);
  const surfaceArea=number(input.surfaceArea);
  const poolVolume=number(input.poolVolume);
  if(centimetres<=0)throw new Error('Indique quantos centímetros de água adicionou.');
  if(surfaceArea<=0)throw new Error('Indique a área da superfície da piscina.');
  if(poolVolume<=0)throw new Error('O volume da piscina não está configurado.');

  const litresExact=surfaceArea*centimetres*10;
  const litres=round(litresExact);
  const percentage=(litresExact/(poolVolume*1000))*100;
  const reason=input.reason&&REASONS[input.reason]?input.reason:'unknown';
  const latest=input.latestAnalysis||null;
  const history=Array.isArray(input.history)?input.history:[];
  const recentCutoff=Date.now()-(7*86400000);
  const recent=history.filter(item=>new Date(item.date).getTime()>=recentCutoff);
  const recentPercent=recent.reduce((sum,item)=>sum+number(item.percentage),0)+percentage;

  let level='minor',priority=1,title='Reposição pequena';
  let measurement='Meça o cloro livre e o pH depois de a água estar bem misturada.';
  if(percentage>=THRESHOLDS.majorPercent){
   level='major';priority=3;title='Renovação parcial significativa';
   measurement='Faça uma análise completa de cloro livre, pH, alcalinidade e, quando aplicável, estabilizador e dureza cálcica.';
  }else if(percentage>=THRESHOLDS.minorPercent){
   level='partial';priority=2;title='Reposição relevante';
   measurement='Faça uma análise completa antes de corrigir qualquer parâmetro.';
  }

  const instructions=[
   'Não adicione cloro, pH+ ou pH- automaticamente apenas por ter reposto água.',
   'Mantenha a circulação ligada até a água nova estar bem misturada com a água da piscina.',
   measurement
  ];

  let causeMessage='A origem da perda de água não foi identificada. Registe novamente se o nível voltar a descer.';
  if(reason==='evaporation'){
   causeMessage='A evaporação reduz o nível, mas não remove os sais e minerais dissolvidos. A reposição não deve gerar uma dose química automática.';
   if(input.pool?.coverType==='bubble')causeMessage+=' Utilize a manta de bolhas quando a piscina não estiver em uso para reduzir a evaporação e a perda de temperatura.';
  }else if(reason==='backwash'){
   causeMessage='Saiu água já tratada e entrou água nova, pelo que pode existir alguma diluição dos parâmetros.';
  }else if(reason==='use'){
   causeMessage='Os salpicos e a utilização substituem uma pequena parte da água tratada por água nova, podendo diluir ligeiramente os parâmetros.';
  }else if(reason==='leak'){
   causeMessage='A reposição foi associada a uma possível fuga. Acompanhe o nível nas próximas 24 horas e registe uma nova descida antes de concluir que existe uma fuga.';
  }

  const warnings=[];
  if(latest){
   const cya=Number.isFinite(Number(latest.cya))?Number(latest.cya):null;
   const minChlorine=cya!==null&&cya>0?2:1;
   if(Number(latest.freeChlorine)<minChlorine)warnings.push(`O último cloro livre registado foi ${fmt(latest.freeChlorine)} ppm. A reposição de água não corrige a desinfeção. Faça uma nova medição e não utilize a piscina enquanto o valor estiver abaixo do mínimo.`);
   if(Number(latest.ph)<7||Number(latest.ph)>7.8)warnings.push(`O último pH registado foi ${fmt(latest.ph)}. Confirme o pH depois da circulação antes de adicionar qualquer corretor.`);
  }
  if(recent.length>=2||recentPercent>=5)warnings.push(`Foram registadas várias reposições nos últimos 7 dias, totalizando aproximadamente ${fmt(recentPercent)}% do volume. Acompanhe o nível e verifique se a perda se repete.`);

  return{
   centimetres,surfaceArea,poolVolume,litres,litresExact,
   percentage:Number(percentage.toFixed(2)),reason,reasonLabel:REASONS[reason],
   level,priority,title,measurement,causeMessage,instructions,warnings,
   requiresAnalysis:true,createdAt:new Date().toISOString()
  };
 }

 function formatSummary(result){
  return `${fmt(result.litres)} L, aproximadamente ${fmt(result.percentage)}% do volume da piscina.`;
 }

 return{calculate,formatSummary,thresholds:THRESHOLDS,reasons:REASONS};
})();
