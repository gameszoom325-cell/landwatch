/* LandWatch live public-data integration. Keeps cached values when a source is unavailable. */
(() => {
  'use strict';

  const CACHE_TTL = 15 * 60 * 1000;
  const cachePrefix = 'landwatch_live_';
  const state = { location: null, data: {}, loading: false };
  const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));

  function readCache(key) {
    try {
      const value = JSON.parse(localStorage.getItem(cachePrefix + key) || 'null');
      return value && value.data ? value : null;
    } catch (_) { return null; }
  }

  function writeCache(key, data) {
    try { localStorage.setItem(cachePrefix + key, JSON.stringify({ savedAt: Date.now(), data })); } catch (_) { /* storage may be disabled */ }
  }

  async function request(key, url, transform, options = {}) {
    const cached = readCache(key);
    if (cached && Date.now() - cached.savedAt < CACHE_TTL) return { data: cached.data, cached: false };
    try {
      const response = await fetch(url, { headers: { Accept: options.accept || 'application/json' } });
      if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
      const data = await transform(await response.json());
      writeCache(key, data);
      return { data, cached: false };
    } catch (error) {
      if (cached) return { data: cached.data, cached: true };
      console.warn(`LandWatch live data unavailable for ${key}`, error);
      return { data: null, cached: false };
    }
  }

  function conditionLabel(code) {
    const labels = { 0: 'Clear sky', 1: 'Mainly clear', 2: 'Partly cloudy', 3: 'Overcast', 45: 'Fog', 48: 'Depositing rime fog', 51: 'Light drizzle', 53: 'Drizzle', 55: 'Heavy drizzle', 61: 'Light rain', 63: 'Rain', 65: 'Heavy rain', 71: 'Light snow', 73: 'Snow', 75: 'Heavy snow', 80: 'Rain showers', 81: 'Rain showers', 82: 'Heavy rain showers', 95: 'Thunderstorm', 96: 'Thunderstorm with hail', 99: 'Thunderstorm with hail' };
    return labels[code] || 'Unknown';
  }

  function statusForAqi(aqi) {
    if (!Number.isFinite(aqi)) return 'Unavailable';
    return aqi <= 50 ? 'Good' : aqi <= 100 ? 'Moderate' : aqi <= 200 ? 'Poor' : 'Severe';
  }

  function htmlValue(value, suffix = '') {
    return value === null || value === undefined || value === '' ? 'Live data temporarily unavailable' : `${esc(value)}${suffix}`;
  }

  function ensurePanel() {
    if (document.getElementById('lw-live-intelligence')) return document.getElementById('lw-live-intelligence');
    const toolbar = document.querySelector('#smart-land-dashboard .smart-dashboard-toolbar');
    if (!toolbar) return null;
    const panel = document.createElement('div');
    panel.id = 'lw-live-intelligence';
    panel.className = 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-gutter-desktop';
    panel.innerHTML = `
      <article class="smart-stat-card bg-surface-container-lowest p-space-lg rounded-xl shadow-sm border border-surface-container" data-live-card="weather">
        <div class="flex items-center justify-between"><span class="text-label-sm text-on-surface-variant uppercase font-bold">Live Weather</span><span class="material-symbols-outlined text-primary">cloud</span></div>
        <strong class="font-headline-md text-headline-md text-primary" data-live="temperature">—</strong>
        <div class="text-body-sm text-on-surface-variant space-y-1"><div>Humidity: <b data-live="humidity">—</b> · Wind: <b data-live="wind">—</b></div><div>Rain probability: <b data-live="rain">—</b></div><div data-live="condition">Loading…</div></div>
        <small class="text-body-sm text-on-surface-variant" data-live="weather-updated">—</small>
      </article>
      <article class="smart-stat-card bg-surface-container-lowest p-space-lg rounded-xl shadow-sm border border-surface-container" data-live-card="air">
        <div class="flex items-center justify-between"><span class="text-label-sm text-on-surface-variant uppercase font-bold">Live Air Quality</span><span class="material-symbols-outlined text-primary">air</span></div>
        <strong class="font-headline-md text-headline-md text-primary"><span data-live="aqi">—</span> AQI</strong>
        <div class="text-body-sm text-on-surface-variant">PM2.5 <b data-live="pm25">—</b> · PM10 <b data-live="pm10">—</b></div>
        <div class="text-body-sm text-on-surface-variant">NO₂ <b data-live="no2">—</b> · SO₂ <b data-live="so2">—</b> · CO <b data-live="co">—</b></div>
        <small class="text-body-sm text-on-surface-variant" data-live="aqi-status">Loading…</small>
      </article>
      <article class="smart-stat-card bg-surface-container-lowest p-space-lg rounded-xl shadow-sm border border-surface-container" data-live-card="location">
        <div class="flex items-center justify-between"><span class="text-label-sm text-on-surface-variant uppercase font-bold">Live District Intelligence</span><span class="material-symbols-outlined text-primary">public</span></div>
        <strong class="font-headline-md text-headline-md text-primary" data-live="district">—</strong>
        <div class="text-body-sm text-on-surface-variant">State: <b data-live="state">—</b> · Elevation: <b data-live="elevation">—</b></div>
        <div class="text-body-sm text-on-surface-variant">Coordinates: <b data-live="coordinates">—</b></div>
        <div class="text-body-sm text-on-surface-variant">Flood/rainfall: <b data-live="flood">—</b></div>
        <div class="text-body-sm text-on-surface-variant">Earthquakes (100 km): <b data-live="earthquakes">—</b></div>
        <div class="text-body-sm text-on-surface-variant">Villages: <b data-live="villages">—</b> · Roads: <b data-live="roads">—</b></div>
        <div class="text-body-sm text-on-surface-variant">Population: <b data-live="population">Public dataset unavailable</b></div>
        <small class="text-body-sm text-on-surface-variant" data-live="location-updated">—</small>
      </article>
      <article class="smart-stat-card bg-surface-container-lowest p-space-lg rounded-xl shadow-sm border border-surface-container sm:col-span-2 lg:col-span-3" data-live-card="news">
        <div class="flex items-center justify-between"><span class="text-label-sm text-on-surface-variant uppercase font-bold">Land & Infrastructure News</span><span class="text-body-sm text-on-surface-variant" data-live="news-status">Loading…</span></div>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-space-sm mt-space-sm" data-live="news-list"></div>
      </article>`;
    toolbar.insertAdjacentElement('afterend', panel);
    return panel;
  }

  function setValue(name, value, suffix = '') {
    document.querySelectorAll(`[data-live="${name}"]`).forEach(node => { node.textContent = value === null || value === undefined || value === '' ? 'Live data temporarily unavailable' : `${value}${suffix}`; });
  }

  function setLoading(loading) {
    ensurePanel()?.querySelectorAll('[data-live-card]').forEach(card => card.classList.toggle('lw-live-loading', loading));
  }

  function updateCharts() {
    const weather = state.data.weather;
    const air = state.data.air;
    if (window.smartLandCharts?.length) {
      const usage = window.smartLandCharts.find(chart => chart.canvas?.id === 'landUsageChart');
      if (usage) { usage.data.datasets[0].data = state.data.landCover?.values || [null, null, null, null, null]; usage.update(); }
      const change = window.smartLandCharts.find(chart => chart.canvas?.id === 'environmentalChangeChart');
      if (change && weather?.daily) { change.data.labels = weather.daily.labels; change.data.datasets[0].data = weather.daily.rain; change.data.datasets[1].data = weather.daily.probability; change.update(); }
      const risk = window.smartLandCharts.find(chart => chart.canvas?.id === 'landRiskChart');
      if (risk) { risk.data.datasets[0].data = [air?.aqi ? Math.max(0, 100 - air.aqi) : null, state.data.flood?.risk === 'High' ? 1 : 0, state.data.earthquakes?.length || 0]; risk.update(); }
      const timeline = window.smartLandCharts.find(chart => chart.canvas?.id === 'landTimelineChart');
      if (timeline && !state.data.landCover) { timeline.data.datasets.forEach(dataset => { dataset.data = dataset.data.map(() => null); }); timeline.update(); }
    }
  }

  function render(data, cached) {
    ensurePanel();
    const updated = `Updated ${new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}${cached ? ' · cached' : ''}`;
    const weather = data.weather;
    setValue('temperature', weather?.temperature, ' °C');
    setValue('humidity', weather?.humidity, '%');
    setValue('wind', weather?.wind, ' km/h');
    setValue('rain', weather?.rainProbability, '%');
    setValue('condition', weather?.condition);
    setValue('weather-updated', weather ? updated : null);
    const air = data.air;
    setValue('aqi', air?.aqi);
    setValue('pm25', air?.pm25, ' µg/m³'); setValue('pm10', air?.pm10, ' µg/m³');
    setValue('no2', air?.no2, ' µg/m³'); setValue('so2', air?.so2, ' µg/m³'); setValue('co', air?.co, ' µg/m³');
    setValue('aqi-status', air ? `${air.status} · ${updated}` : null);
    setValue('district', data.location?.district); setValue('state', data.location?.state);
    setValue('elevation', data.location?.elevation, ' m'); setValue('coordinates', data.location?.lat != null && data.location?.lon != null ? `${Number(data.location.lat).toFixed(4)}, ${Number(data.location.lon).toFixed(4)}` : null);
    setValue('flood', data.flood ? `${data.flood.rainfall} mm · ${data.flood.risk} risk` : null); setValue('location-updated', data.location ? updated : null);
    setValue('earthquakes', data.earthquakes ? data.earthquakes.length : null);
    setValue('villages', data.context?.villages);
    setValue('roads', data.context?.roads);
    setValue('population', data.context?.population);
    const news = document.querySelector('[data-live="news-list"]');
    if (news) news.innerHTML = data.news?.length ? data.news.slice(0, 3).map(item => `<a class="p-2 border border-surface-container rounded-lg hover:border-primary" href="${esc(item.url)}" target="_blank" rel="noopener"><strong class="block text-body-sm text-primary">${esc(item.title)}</strong><small class="text-body-sm text-on-surface-variant">${esc(item.source)} · ${esc(item.time)}</small></a>`).join('') : '<span class="text-body-sm text-on-surface-variant">Live data temporarily unavailable</span>';
    setValue('news-status', data.news ? `${data.news.length} public results` : null);
    if (window.landWatchState) {
      window.landWatchState.liveData = data;
      window.landWatchState.liveRecord = {
        rainfall: data.flood?.rainfall,
        flood_risk: data.flood?.risk,
        aqi: data.air?.aqi,
        population: data.context?.population,
        road_connectivity: data.context?.roads,
        weather_temperature: data.weather?.temperature
      };
    }
    updateCharts();
  }

  async function loadForProfile(profile) {
    if (!profile?.coords || state.loading) return;
    state.loading = true; state.location = profile; ensurePanel(); setLoading(true);
    const [lat, lon] = profile.coords;
    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code&hourly=precipitation_probability,rain&daily=precipitation_sum,precipitation_probability_max&forecast_days=7&timezone=auto`;
    const airUrl = `https://api.openaq.org/v3/locations?coordinates=${lat},${lon}&radius=25000&limit=1`;
    const fallbackAirUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=pm10,pm2_5,nitrogen_dioxide,sulphur_dioxide,carbon_monoxide,european_aqi&timezone=auto`;
    const quakeUrl = `https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&latitude=${lat}&longitude=${lon}&maxradiuskm=100&orderby=time&limit=20`;
    const geoUrl = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}&zoom=10&addressdetails=1`;
    const newsUrl = `https://api.gdeltproject.org/api/v2/doc/doc?query=%28land%20acquisition%20OR%20infrastructure%29%20${encodeURIComponent(profile.state)}&mode=artlist&maxrecords=10&format=json&sort=datedesc`;
    const contextUrl = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(`[out:json][timeout:20];(node(around:25000,${lat},${lon})[place=village];way(around:25000,${lat},${lon})[highway];);out tags;`)}`;
    const [weather, air, quakes, geo, news, context] = await Promise.all([
      request(`weather_${lat}_${lon}`, weatherUrl, json => ({ temperature: json.current?.temperature_2m, humidity: json.current?.relative_humidity_2m, wind: json.current?.wind_speed_10m, condition: conditionLabel(json.current?.weather_code), rainProbability: json.hourly?.precipitation_probability?.[0], daily: { labels: (json.daily?.time || []).slice(0, 7), rain: json.daily?.precipitation_sum || [], probability: json.daily?.precipitation_probability_max || [] } })),
      request(`air_${lat}_${lon}`, airUrl, json => {
        const sensors = json.results?.[0]?.sensors || [];
        const read = name => sensors.find(sensor => sensor.parameter?.name === name)?.latest?.value ?? null;
        const pm25 = read('pm25'), aqi = Number.isFinite(Number(pm25)) ? Math.round(Number(pm25) * 2) : null;
        return { aqi, pm25, pm10: read('pm10'), no2: read('no2'), so2: read('so2'), co: read('co'), status: statusForAqi(aqi), source: 'OpenAQ' };
      }),
      request(`quakes_${lat}_${lon}`, quakeUrl, json => (json.features || []).map(item => ({ magnitude: item.properties?.mag, time: item.properties?.time, distance: Math.round(item.geometry?.coordinates?.[2] || 0), title: item.properties?.place }))),
      request(`geo_${lat}_${lon}`, geoUrl, json => ({ district: json.address?.county || json.address?.state_district || profile.district, state: json.address?.state || profile.state, lat, lon })),
      request(`news_${profile.state}`, newsUrl, json => (json.articles || []).map(item => ({ title: item.title, url: item.url, source: item.domain, time: item.seendate ? new Date(item.seendate).toLocaleString('en-IN') : 'Recent' }))),
      request(`context_${lat}_${lon}`, contextUrl, json => {
        const elements = json.elements || [];
        return {
          villages: elements.filter(item => item.tags?.place === 'village').length,
          roads: elements.filter(item => item.tags?.highway).length,
          population: null
        };
      }, { accept: 'text/plain' })
    ]);
    let airResult = air;
    if (!airResult.data) {
      airResult = await request(`air_fallback_${lat}_${lon}`, fallbackAirUrl, json => ({ aqi: json.current?.european_aqi, pm25: json.current?.pm2_5, pm10: json.current?.pm10, no2: json.current?.nitrogen_dioxide, so2: json.current?.sulphur_dioxide, co: json.current?.carbon_monoxide, status: statusForAqi(json.current?.european_aqi), source: 'Open-Meteo fallback' }));
    }
    const elevation = await request(`elevation_${lat}_${lon}`, `https://api.open-meteo.com/v1/elevation?latitude=${lat}&longitude=${lon}`, json => json.elevation?.[0]);
    const flood = await request(`flood_${lat}_${lon}`, weatherUrl, json => {
      const rainfall = Number(json.daily?.precipitation_sum?.[0]);
      return { rainfall: Number.isFinite(rainfall) ? rainfall.toFixed(1) : null, risk: rainfall > 100 ? 'High' : rainfall > 40 ? 'Moderate' : rainfall >= 0 ? 'Low' : null };
    });
    state.data = { weather: weather.data, air: airResult.data, earthquakes: quakes.data, news: news.data, context: context.data, location: { district: profile.district, state: profile.state, lat, lon, ...(geo.data || {}), elevation: elevation.data }, flood: flood.data };
    render(state.data, [weather, airResult, quakes, geo, news, context, elevation, flood].some(item => item.cached));
    state.loading = false; setLoading(false);
    window.dispatchEvent(new CustomEvent('landwatch:live-data', { detail: state.data }));
    window.landWatchSelectLocation?.(profile.name, null, { silent: true });
  }

  function bind() {
    ensurePanel();
    window.addEventListener('landwatch:location-changed', event => loadForProfile(event.detail));
    const initial = window.landWatchState?.selectedProfile;
    if (initial) loadForProfile(initial);
  }

  window.landWatchLiveData = { refresh: () => loadForProfile(state.location || window.landWatchState?.selectedProfile), getState: () => state };
  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', bind, { once: true }) : bind();
  window.setInterval(() => window.landWatchLiveData.refresh(), CACHE_TTL);
})();
