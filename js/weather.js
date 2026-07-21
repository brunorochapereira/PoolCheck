const WeatherService = (() => {
  async function fetchForecast(lat, lon) {
    const params = new URLSearchParams({
      latitude: lat, longitude: lon,
      daily: "temperature_2m_max,temperature_2m_min,precipitation_sum,uv_index_max",
      timezone: "auto", forecast_days: "7"
    });
    const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`);
    if (!res.ok) throw new Error("Não foi possível obter a previsão.");
    return await res.json();
  }
  return { fetchForecast };
})();