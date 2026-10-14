import { useCallback, useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';

const API_URL = 'https://api.data.gov.sg/v1/environment/pm25';
const IOS_PROFILE_DOWNLOAD_URL = 'https://ios-install-api.benson.in.net/install?id=conf_1791970671898';
const PULL_TO_REFRESH_DISTANCE = 64;
const REGION_NAMES = ['north', 'south', 'east', 'west', 'central'];
const REGION_LABELS = { north: 'North', south: 'South', east: 'East', west: 'West', central: 'Central' };
const GEOJSON = {
  type: 'FeatureCollection',
  features: [
    { type: 'Feature', properties: { name: 'north', center: [103.80, 1.43] }, geometry: { type: 'Polygon', coordinates: [[[103.70, 1.44], [103.75, 1.46], [103.79, 1.47], [103.82, 1.47], [103.86, 1.44], [103.88, 1.42], [103.85, 1.38], [103.76, 1.38], [103.70, 1.44]]] } },
    { type: 'Feature', properties: { name: 'east', center: [103.95, 1.36] }, geometry: { type: 'Polygon', coordinates: [[[103.88, 1.42], [103.92, 1.41], [103.95, 1.39], [104.00, 1.40], [104.04, 1.36], [104.01, 1.31], [103.93, 1.30], [103.90, 1.30], [103.89, 1.32], [103.85, 1.38], [103.88, 1.42]]] } },
    { type: 'Feature', properties: { name: 'central', center: [103.82, 1.35] }, geometry: { type: 'Polygon', coordinates: [[[103.76, 1.38], [103.85, 1.38], [103.89, 1.32], [103.84, 1.30], [103.80, 1.31], [103.76, 1.32], [103.76, 1.38]]] } },
    { type: 'Feature', properties: { name: 'south', center: [103.82, 1.28] }, geometry: { type: 'Polygon', coordinates: [[[103.74, 1.28], [103.78, 1.26], [103.82, 1.24], [103.86, 1.27], [103.88, 1.29], [103.89, 1.32], [103.84, 1.30], [103.80, 1.31], [103.76, 1.32], [103.74, 1.28]]] } },
    { type: 'Feature', properties: { name: 'west', center: [103.68, 1.34] }, geometry: { type: 'Polygon', coordinates: [[[103.70, 1.44], [103.76, 1.38], [103.76, 1.32], [103.74, 1.28], [103.71, 1.29], [103.68, 1.25], [103.64, 1.26], [103.61, 1.28], [103.60, 1.34], [103.63, 1.38], [103.67, 1.41], [103.70, 1.44]]] } },
  ],
};

function getAirQualityTheme(value) {
  if (!Number.isFinite(value)) return { label: 'Loading...', themeId: null, chip: 'bg-white/10 border-white/15 text-white/70', dot: 'bg-white/50', color: '#cbd5e1' };
  if (value <= 55) return { label: 'Normal', themeId: 'normal', chip: 'bg-emerald-500/15 border-emerald-300/20 text-emerald-100', dot: 'bg-emerald-300', color: '#34d399' };
  if (value <= 150) return { label: 'Elevated', themeId: 'elevated', chip: 'bg-yellow-400/15 border-yellow-200/20 text-yellow-300', dot: 'bg-yellow-400', color: '#facc15' };
  if (value <= 250) return { label: 'High', themeId: 'high', chip: 'bg-rose-300/15 border-rose-200/20 text-rose-200', dot: 'bg-rose-400', color: '#fb7185' };
  return { label: 'Very High', themeId: 'veryhigh', chip: 'bg-violet-400/15 border-violet-200/20 text-violet-200', dot: 'bg-violet-400', color: '#c084fc' };
}

function formatTime(isoString) {
  if (!isoString) return '--:--';
  const date = new Date(isoString);
  return new Intl.DateTimeFormat('en-SG', { timeZone: 'Asia/Singapore', hour: 'numeric', minute: '2-digit', hour12: true }).format(date);
}

function RefreshIcon() {
  return <svg id="refresh-icon" className="w-5 h-5 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>;
}

function InstallIcon() {
  return <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M12 3v12m0 0 4-4m-4 4-4-4M5 17v3h14v-3" /></svg>;
}

function App() {
  const mapContainer = useRef(null);
  const mapApi = useRef(null);
  const pullStart = useRef(null);
  const pullDistanceRef = useRef(0);
  const [readings, setReadings] = useState(null);
  const [timestamp, setTimestamp] = useState(null);
  const [activeRegion, setActiveRegion] = useState('national');
  const [worstRegion, setWorstRegion] = useState('central');
  const [loading, setLoading] = useState(true);
  const [offline, setOffline] = useState(false);
  const [installPrompt, setInstallPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(() => window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true);
  const [showInstallHelp, setShowInstallHelp] = useState(false);
  const [installStatus, setInstallStatus] = useState('idle');
  const [pullDistance, setPullDistance] = useState(0);
  const [pullRefreshing, setPullRefreshing] = useState(false);

  useEffect(() => {
    const standalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
    setIsInstalled(standalone);
    const isIOS = /iPhone|iPad|iPod/i.test(window.navigator.userAgent)
      || (window.navigator.platform === 'MacIntel' && window.navigator.maxTouchPoints > 1);
    document.documentElement.dataset.iosStandalone = String(isIOS && standalone);

    const captureInstallPrompt = (event) => {
      event.preventDefault();
      setInstallPrompt(event);
    };
    const markInstalled = () => {
      setIsInstalled(true);
      setInstallPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', captureInstallPrompt);
    window.addEventListener('appinstalled', markInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', captureInstallPrompt);
      window.removeEventListener('appinstalled', markInstalled);
    };
  }, []);

  const installApp = async () => {
    const isIOS = /iPhone|iPad|iPod/i.test(window.navigator.userAgent)
      || (window.navigator.platform === 'MacIntel' && window.navigator.maxTouchPoints > 1);
    if (isIOS) {
      setInstallStatus('downloading');
      setShowInstallHelp(true);
      try {
        const response = await fetch(IOS_PROFILE_DOWNLOAD_URL);
        if (!response.ok) throw new Error(`Profile download failed: ${response.status}`);
        const profile = await response.blob();
        const downloadUrl = URL.createObjectURL(profile);
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = 'SG-Air.mobileconfig';
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.setTimeout(() => URL.revokeObjectURL(downloadUrl), 60_000);
        setInstallStatus('downloaded');
      } catch (error) {
        console.error('Profile download error:', error);
        setInstallStatus('error');
      }
      return;
    }
    if (!installPrompt) {
      setShowInstallHelp(true);
      return;
    }
    await installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') setIsInstalled(true);
    setInstallPrompt(null);
  };

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(API_URL, { cache: 'no-store' });
      if (!response.ok) throw new Error(`Request failed: ${response.status}`);
      const payload = await response.json();
      const latest = payload.items?.[0];
      const values = latest?.readings?.pm25_one_hourly;
      if (!values) throw new Error('PM2.5 data is unavailable');
      const next = Object.fromEntries(REGION_NAMES.map((region) => [region, Number(values[region])]));
      const valid = REGION_NAMES.map((region) => next[region]).filter(Number.isFinite);
      next.national = Number.isFinite(Number(values.national))
        ? Number(values.national)
        : valid.length ? Math.round(valid.reduce((sum, value) => sum + value, 0) / valid.length) : null;
      setReadings(next);
      setTimestamp(latest.update_timestamp || latest.timestamp || new Date().toISOString());
      setWorstRegion(REGION_NAMES.reduce((max, region) => next[region] > next[max] ? region : max, 'central'));
      setOffline(false);
    } catch (error) {
      console.error('Fetch error:', error);
      setOffline(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    const interval = window.setInterval(refresh, 900000);
    return () => window.clearInterval(interval);
  }, [refresh]);

  useEffect(() => {
    if (!loading) setPullRefreshing(false);
  }, [loading]);

  useEffect(() => {
    const onTouchStart = (event) => {
      if (loading || event.touches.length !== 1 || window.scrollY > 0) {
        pullStart.current = null;
        return;
      }
      pullStart.current = {
        x: event.touches[0].clientX,
        y: event.touches[0].clientY,
      };
    };

    const onTouchMove = (event) => {
      if (!pullStart.current || event.touches.length !== 1) return;
      const deltaX = event.touches[0].clientX - pullStart.current.x;
      const deltaY = event.touches[0].clientY - pullStart.current.y;
      if (Math.abs(deltaX) > Math.abs(deltaY) || window.scrollY > 0) {
        pullStart.current = null;
        return;
      }
      if (deltaY > 0) {
        if (event.cancelable) event.preventDefault();
        const distance = Math.min(deltaY * 0.8, 96);
        pullDistanceRef.current = distance;
        setPullDistance(distance);
      }
    };

    const finishPull = () => {
      const shouldRefresh = pullDistanceRef.current >= PULL_TO_REFRESH_DISTANCE && !loading;
      pullStart.current = null;
      pullDistanceRef.current = 0;
      setPullDistance(0);
      if (shouldRefresh) {
        setPullRefreshing(true);
        refresh();
      }
    };

    const cancelPull = () => {
      pullStart.current = null;
      pullDistanceRef.current = 0;
      setPullDistance(0);
    };

    document.addEventListener('touchstart', onTouchStart, { passive: true });
    document.addEventListener('touchmove', onTouchMove, { passive: false });
    document.addEventListener('touchend', finishPull, { passive: true });
    document.addEventListener('touchcancel', cancelPull, { passive: true });
    return () => {
      document.removeEventListener('touchstart', onTouchStart);
      document.removeEventListener('touchmove', onTouchMove);
      document.removeEventListener('touchend', finishPull);
      document.removeEventListener('touchcancel', cancelPull);
    };
  }, [loading, refresh]);

  useEffect(() => {
    const container = mapContainer.current;
    if (!container) return undefined;
    const drawMap = () => {
      const width = container.clientWidth;
      const height = container.clientHeight;
      const svg = d3.select(container);
      const projection = d3.geoMercator().center([103.82, 1.355]).scale(width * 112).translate([width / 2, height / 2 - 2]);
      const path = d3.geoPath().projection(projection);
      svg.attr('width', width).attr('height', height);
      svg.selectAll('.region-path').data(GEOJSON.features, (d) => d.properties.name).join('path')
        .attr('class', 'region-path map-pulse').attr('id', (d) => `map-${d.properties.name}`).attr('d', path);
      if (svg.select('#status-marker').empty()) {
        const markerGroup = svg.append('g').attr('class', 'floating-marker').attr('id', 'status-marker').attr('transform', `translate(${width / 2}, ${height / 2})`);
        markerGroup.append('circle').attr('class', 'marker-outer').attr('r', 18).attr('fill', 'rgba(22,163,74,.08)').attr('stroke', 'rgba(22,163,74,.55)').attr('stroke-width', 1.5);
        markerGroup.append('circle').attr('class', 'marker-inner').attr('r', 6).attr('fill', '#16a34a');
      }
      mapApi.current = { projection, svg };
    };
    drawMap();
    const observer = new ResizeObserver(drawMap);
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  const nationalValue = readings?.national;
  const activeValue = activeRegion === 'national' ? nationalValue : readings?.[activeRegion];
  const activeTheme = getAirQualityTheme(activeValue);
  const pullOffset = pullRefreshing ? 48 : pullDistance;
  useEffect(() => {
    document.documentElement.dataset.airTheme = activeTheme.themeId || 'high';
    const pageColor = getComputedStyle(document.documentElement).getPropertyValue('--page-background').trim();
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', pageColor);
  }, [activeTheme.themeId]);

  useEffect(() => {
    const map = mapApi.current;
    if (!map || !readings) return;
    REGION_NAMES.forEach((region) => {
      const theme = getAirQualityTheme(readings[region]);
      map.svg.select(`#map-${region}`).transition().duration(1000)
        .style('fill', theme.color)
        .style('fill-opacity', 0.32)
        .style('stroke', theme.color);
    });
    const markerRegion = activeRegion === 'national' ? worstRegion : activeRegion;
    const feature = GEOJSON.features.find((item) => item.properties.name === markerRegion);
    const [x, y] = map.projection(feature.properties.center);
    const markerColor = getAirQualityTheme(readings[markerRegion]).color;
    map.svg.select('#status-marker').transition().duration(1000).attr('transform', `translate(${x}, ${y})`);
    map.svg.select('.marker-inner').transition().duration(800).attr('fill', markerColor);
    map.svg.select('.marker-outer').transition().duration(800).attr('stroke', markerColor).attr('fill', markerColor).attr('fill-opacity', 0.12);
  }, [readings, activeRegion, worstRegion]);

  return <div className="min-h-screen relative flex flex-col items-center">
    {(pullDistance > 0 || pullRefreshing) && <div
      className={`pull-refresh-indicator glass-panel ${pullRefreshing ? 'is-refreshing' : ''}`}
      style={{ transform: `translate(-50%, calc(-100% + ${pullRefreshing ? PULL_TO_REFRESH_DISTANCE : pullDistance}px))` }}
      role="status"
      aria-live="polite"
    >
      <span className={pullRefreshing ? 'spin-slow' : ''}><RefreshIcon /></span>
      <span>{pullRefreshing ? 'Refreshing…' : pullDistance >= PULL_TO_REFRESH_DISTANCE ? 'Release to refresh' : 'Pull to refresh'}</span>
    </div>}
    <div className="app-content w-full max-w-md min-h-screen flex flex-col relative px-6 py-8">
      <header className="topbar flex items-center justify-between mb-5 w-full z-10 gap-2">
        <div className="topbar-brand min-w-0 flex items-center gap-3"><img src="/icons/air-logo.svg" alt="SG AIR" className="h-10 w-10 rounded-lg bg-white" /><div><h1 className="text-2xl font-bold tracking-wider opacity-90">SG AIR</h1><p className="brand-caption text-[9px] font-light tracking-[0.12em] opacity-60 uppercase mt-1 whitespace-nowrap">Real-time PM 2.5</p></div></div>
        <button onClick={refresh} aria-label="Refresh air quality" className="justify-self-end w-10 h-10 rounded-full glass-panel flex items-center justify-center hover:bg-white/15 transition-all active:scale-95">
          <span className={loading ? 'spin-slow' : ''}><RefreshIcon /></span>
        </button>
      </header>

      <main className="flex-1 flex flex-col items-center justify-start mt-0 z-10 w-full">
        <div className="hero-composition">
          <button onClick={() => setActiveRegion('national')} title="Click to reset to National Avg" className="hero-metric relative w-72 h-72 rounded-full flex items-center justify-center ring-glow border glass-panel cursor-pointer group transition-all text-white">
            <span className="hero-metric-content flex flex-col items-center justify-center z-10 rounded-full p-4">
              <span className="text-sm font-light tracking-widest opacity-70 mb-1 uppercase">{activeRegion === 'national' ? 'National Avg' : `${REGION_LABELS[activeRegion]} Region`}</span>
              <span className="flex items-start"><span className={`text-6xl font-bold tracking-tighter glow-text transition-all duration-300 ${loading ? 'opacity-20' : 'opacity-100'}`}>{Number.isFinite(activeValue) ? Math.round(activeValue) : '--'}</span><span className="text-base font-medium opacity-60 mt-2 ml-1">µg</span></span>
              <span className={`mt-3 px-4 py-1.5 rounded-full border text-xs font-semibold tracking-wide transition-all duration-300 ${activeTheme.chip}`}>{offline ? 'Offline' : loading ? readings ? 'Syncing...' : 'Loading...' : activeTheme.label}</span>
            </span>
          </button>
          <svg id="map-container" ref={mapContainer} role="img" aria-label="新加坡五个区域的 PM2.5 地图" />
        </div>

        <div className="w-full">
          <div className="regional-heading flex items-center justify-between gap-2 mb-4">
            <h2 className="text-sm font-light tracking-widest opacity-60 uppercase pl-1">Regional Breakdown</h2>
            <div className="regional-update glass-panel px-2 py-1 rounded-full border border-white/10 whitespace-nowrap">
              <p className="text-[9px] font-medium tracking-wide opacity-70 uppercase flex items-center"><span className={`w-1.5 h-1.5 rounded-full ${activeTheme.dot} mr-1.5 pulse-fast`} />Updated: {formatTime(timestamp)}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 w-full">
            {['north', 'south', 'east', 'west'].map((region) => <RegionCard key={region} region={region} value={readings?.[region]} loading={loading} selected={activeRegion === region} onSelect={setActiveRegion} />)}
            <RegionCard region="central" value={readings?.central} loading={loading} selected={activeRegion === 'central'} onSelect={setActiveRegion} wide />
          </div>
        </div>
        <div className="mt-8 mb-4 text-center w-full">
          {!isInstalled && <button onClick={installApp} className="glass-panel inline-flex items-center justify-center gap-2 rounded-full border border-white/15 px-4 py-2.5 text-xs font-medium tracking-wider text-white/85 transition-colors hover:bg-white/15 mb-5"><InstallIcon />Install SG Air</button>}
          <div className="opacity-40 text-[10px] tracking-widest uppercase font-light">Data provided by Data.gov.sg</div>
        </div>
      </main>
      {showInstallHelp && <InstallHelpDialog status={installStatus} onClose={() => setShowInstallHelp(false)} />}
    </div>
  </div>;
}

function InstallHelpDialog({ status, onClose }) {
  const userAgent = window.navigator.userAgent;
  const isIOS = /iPhone|iPad|iPod/i.test(userAgent) || (window.navigator.platform === 'MacIntel' && window.navigator.maxTouchPoints > 1);
  const instructions = isIOS
    ? status === 'downloading'
      ? 'Downloading the SG Air installation profile. Keep this page open for a moment.'
      : status === 'error'
        ? 'The profile could not be downloaded. Check your internet connection and try again.'
        : 'The profile has been downloaded. Open Settings, tap Profile Downloaded, then tap Install and follow the on-screen steps.'
    : /Android/i.test(userAgent)
      ? 'Open your browser menu and choose “Install app” or “Add to Home screen”.'
      : 'Open your browser menu and choose “Install SG Air” or “Install page as app”.';

  return <div className="install-dialog-backdrop fixed inset-0 z-50 flex items-center justify-center p-6" onClick={onClose}>
    <section className="glass-panel w-full max-w-sm rounded-3xl border border-white/15 p-6 text-white" role="dialog" aria-modal="true" aria-labelledby="install-help-title" onClick={(event) => event.stopPropagation()}>
      <h2 id="install-help-title" className="text-lg font-semibold tracking-wide">{isIOS ? 'Finish installing SG Air' : 'Install SG Air'}</h2>
      <p className="mt-3 text-sm leading-relaxed text-white/70">{instructions}</p>
      <button onClick={onClose} className="mt-5 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm text-white hover:bg-white/15">Got it</button>
    </section>
  </div>;
}

function RegionCard({ region, value, loading, selected, onSelect, wide = false }) {
  const theme = getAirQualityTheme(value);
  return <button onClick={() => onSelect(region)} className={`${wide ? 'col-span-2 flex items-center justify-between mt-1' : 'flex flex-col justify-between'} region-card glass-panel rounded-2xl p-4 relative group hover:bg-white/15 transition-colors cursor-pointer ring-1 ${selected ? 'selected ring-white/30' : 'ring-transparent'} text-left text-white`}>
    {wide ? <><span className="flex flex-col z-10"><span className="text-xs font-medium tracking-wider text-white/60 uppercase mb-1">Central</span><span className={`text-[10px] font-bold px-2 py-1 rounded-md border w-max mt-1 ${theme.chip}`}>{Number.isFinite(value) ? theme.label : '--'}</span></span><span className={`text-4xl font-bold region-val z-10 pr-2 transition-opacity ${loading ? 'opacity-20' : 'opacity-100'}`}>{Number.isFinite(value) ? Math.round(value) : '--'}</span></> : <><span className="text-xs font-medium tracking-wider text-white/60 uppercase z-10 mb-3">{REGION_LABELS[region]}</span><span className="flex items-end justify-between z-10"><span className={`text-3xl font-bold region-val transition-opacity ${loading ? 'opacity-20' : 'opacity-100'}`}>{Number.isFinite(value) ? Math.round(value) : '--'}</span><span className={`text-[10px] font-bold px-2 py-1 rounded-md border ${theme.chip}`}>{Number.isFinite(value) ? theme.label : '--'}</span></span></>}
  </button>;
}

export default App;
