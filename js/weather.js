const PoolWeather=(()=>{
 const DAY=86400000;
 const codeText=code=>({0:'céu limpo',1:'maioritariamente limpo',2:'parcialmente nublado',3:'nublado',45:'nevoeiro',48:'nevoeiro',51:'chuvisco',53:'chuvisco',55:'chuvisco forte',61:'chuva',63:'chuva moderada',65:'chuva forte',80:'aguaceiros',81:'aguaceiros',82:'aguaceiros fortes',95:'trovoada'}[code]||'tempo variável');
 function stale(weather){return !weather.updatedAt||Date.now()-new Date(weather.updatedAt).getTime()>DAY}
 function analyse(daily,pool){
  if(!daily?.time?.length)return null;
  const days=daily.time.map((date,i)=>({date,max:Number(daily.temperature_2m_max[i]),min:Number(daily.temperature_2m_min[i]),rain:Number(daily.precipitation_sum[i]||0),rainChance:Number(daily.precipitation_probability_max[i]||0),wind:Number(daily.wind_gusts_10m_max[i]||0),uv:Number(daily.uv_index_max[i]||0),code:daily.weather_code[i]}));
  const upcoming=days.slice(1,5); const actions=[]; let level=0; let title='Sem impacto relevante';
  const hottest=Math.max(...upcoming.map(d=>d.max)); const rain=Math.max(...upcoming.map(d=>d.rain)); const rainChance=Math.max(...upcoming.map(d=>d.rainChance)); const wind=Math.max(...upcoming.map(d=>d.wind)); const uv=Math.max(...upcoming.map(d=>d.uv));
  if(hottest>=Math.max(30,Number(pool.highTempThreshold||28))||uv>=8){level=Math.max(level,2);title='Calor e sol intenso previstos';actions.push({title:'Aumentar a filtração',reason:'Acrescente cerca de 2 horas nos dias mais quentes.'},{title:'Verificar o cloro',reason:'Faça uma análise após o período de maior sol ou utilização.'})}
  if(rain>=15||rainChance>=75){level=Math.max(level,rain>=30?3:2);title=rain>=30?'Chuva forte prevista':'Chuva com impacto possível';actions.push({title:'Analisar após a chuva',reason:'A chuva pode diluir o tratamento e alterar o pH.'});if(rain>=30)actions.push({title:'Verificar o nível da água',reason:'Confirme se é necessário baixar o nível antes ou depois da precipitação.'})}
  if(wind>=45){level=Math.max(level,2);title='Vento forte previsto';actions.push({title:'Limpar skimmer e pré-filtro',reason:'O vento pode levar folhas e resíduos para o circuito.'})}
  const unique=actions.filter((x,i,a)=>a.findIndex(y=>y.title===x.title)===i).slice(0,3);
  if(!unique.length)return {level:0,title,message:'Não se prevê impacto meteorológico relevante nos próximos dias.',actions:[],days};
  const affected=upcoming.filter(d=>d.max>=30||d.rain>=15||d.rainChance>=75||d.wind>=45).map(d=>new Date(d.date+'T12:00:00').toLocaleDateString('pt-PT',{weekday:'long'}));
  return {level,title,message:`Condições relevantes previstas para ${affected.slice(0,2).join(' e ')||'os próximos dias'}. O PoolCheck ajustou as recomendações.`,actions:unique,days};
 }
 async function fetchForecast(latitude,longitude,pool){
  const fields='temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,wind_gusts_10m_max,uv_index_max,weather_code';
  const url=`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m&daily=${fields}&forecast_days=7&timezone=auto`;
  const response=await fetch(url);if(!response.ok)throw new Error('weather');const data=await response.json();
  return {latitude,longitude,temperature:data.current?.temperature_2m??null,timezone:data.timezone,updatedAt:new Date().toISOString(),daily:data.daily,impact:analyse(data.daily,pool)};
 }
 return{stale,analyse,fetchForecast,codeText};
})();