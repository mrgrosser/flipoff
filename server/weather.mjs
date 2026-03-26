function compactTemp(value) {
  const n = Number(value);
  return Number.isFinite(n) ? `${Math.round(n)}F` : '--';
}

function iconFor(condition = '') {
  const c = String(condition).toLowerCase();
  if (c.includes('thunder')) return '!';
  if (c.includes('snow') || c.includes('sleet') || c.includes('ice')) return '*';
  if (c.includes('rain') || c.includes('drizzle') || c.includes('shower')) return '=';
  if (c.includes('fog') || c.includes('mist') || c.includes('haze')) return '~';
  if (c.includes('clear') || c.includes('sun')) return 'O';
  if (c.includes('cloud') || c.includes('overcast') || c.includes('partly')) return '@';
  if (c.includes('wind')) return '-';
  return '#';
}

function conditionShort(condition = '') {
  const c = String(condition).toLowerCase();
  if (c.includes('thunder')) return 'STORM';
  if (c.includes('snow')) return 'SNOW';
  if (c.includes('rain') || c.includes('drizzle') || c.includes('shower')) return 'RAIN';
  if (c.includes('fog')) return 'FOG';
  if (c.includes('mist')) return 'MIST';
  if (c.includes('haze')) return 'HAZE';
  if (c.includes('clear') || c.includes('sun')) return 'SUNNY';
  if (c.includes('cloud') || c.includes('overcast') || c.includes('partly')) return 'CLOUDY';
  return 'WX';
}

export async function fetchWeatherBoard(city) {
  const url = `https://wttr.in/${encodeURIComponent(city)}?format=j1`;
  const response = await fetch(url, { headers: { 'User-Agent': 'flipoff/1.0' } });
  if (!response.ok) throw new Error(`Weather fetch failed: ${response.status}`);
  const data = await response.json();
  const current = data?.current_condition?.[0] || {};
  const today = data?.weather?.[0] || {};
  const condition = current?.weatherDesc?.[0]?.value || 'Unknown';
  const icon = iconFor(condition);
  return [
    '',
    `${icon} ${String(city).toUpperCase().slice(0, 18)}`,
    `${conditionShort(condition)} NOW ${compactTemp(current?.temp_F)}`,
    `HIGH ${compactTemp(today?.maxtempF)} LOW ${compactTemp(today?.mintempF)}`,
    ''
  ];
}
