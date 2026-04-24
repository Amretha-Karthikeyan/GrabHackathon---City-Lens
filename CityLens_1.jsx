import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MapPin, TrendingUp, Users, Zap, Train, ShoppingBag, GraduationCap, Building2, ChevronRight, Sparkles, ArrowRight, Target, BarChart3, AlertCircle } from 'lucide-react';

// ============================================================
// 🔑 PASTE YOUR GRABMAPS API KEY BELOW (between the quotes)
// ============================================================
const GRABMAPS_API_KEY = 'bm_1777010908_nsVMGFokDyyncnwaCGRv1rqKXTqyuxTR';
// ============================================================

// GrabMaps style URL — uses your API key for auth
// Based on hackathon slide 8: the grab-maps library reference
const GRABMAPS_STYLE_URL = GRABMAPS_API_KEY
  ? `https://maps.grab.com/api/style.json`
  : null;

// Fallback to a free dark-themed map if no API key provided
const FALLBACK_STYLE = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';

export default function CityLens() {
  const [stage, setStage] = useState('input');
  const [businessType, setBusinessType] = useState(null);
  const [priority, setPriority] = useState(null);
  const [selectedZone, setSelectedZone] = useState(null);
  const [scanProgress, setScanProgress] = useState(0);
  const [revealedZones, setRevealedZones] = useState([]);

  const businesses = [
    { id: 'bubbletea', icon: '🧋', label: 'Bubble Tea' },
    { id: 'fnb', icon: '🍜', label: 'F&B / Cafe' },
    { id: 'retail', icon: '🛍️', label: 'Retail' },
    { id: 'services', icon: '💼', label: 'Services' },
  ];

  const priorities = [
    { id: 'traffic', label: 'High Foot Traffic', icon: Users },
    { id: 'low-comp', label: 'Low Saturation', icon: Target },
    { id: 'transit', label: 'Transit Access', icon: Train },
    { id: 'spend', label: 'Affluent Demo', icon: TrendingUp },
  ];

  // Real Singapore coordinates for each zone
  const zones = [
    {
      id: 'orchard', name: 'Orchard', lng: 103.8321, lat: 1.3048, score: 91, color: '#00B14F',
      traffic: 95, competition: 72, transit: 98, spend: 88,
      anchors: [
        { type: 'mall', name: 'ION Orchard', icon: ShoppingBag, distance: '120m' },
        { type: 'mrt', name: 'Orchard MRT', icon: Train, distance: '80m' },
        { type: 'mall', name: 'Takashimaya', icon: ShoppingBag, distance: '300m' },
      ],
      insight: 'Premium foot traffic, but expect rent pressure. 14 bubble tea brands within 500m.',
      grabSignal: '+340% GrabFood orders vs city avg',
      demographics: 'Young professionals, tourists, students',
      conversionEst: '8.2%',
    },
    {
      id: 'paya-lebar', name: 'Paya Lebar', lng: 103.8927, lat: 1.3176, score: 84, color: '#00B14F',
      traffic: 82, competition: 45, transit: 92, spend: 71,
      anchors: [
        { type: 'mall', name: 'PLQ Mall', icon: ShoppingBag, distance: '50m' },
        { type: 'mrt', name: 'Paya Lebar MRT', icon: Train, distance: '40m' },
        { type: 'office', name: 'PLQ Towers', icon: Building2, distance: '100m' },
      ],
      insight: 'Underserved bubble tea market. Office crowd = consistent weekday demand.',
      grabSignal: '+210% GrabFood lunch orders',
      demographics: 'Office workers, young families',
      conversionEst: '11.4%',
    },
    {
      id: 'jurong', name: 'Jurong East', lng: 103.7436, lat: 1.3329, score: 78, color: '#FFB800',
      traffic: 76, competition: 58, transit: 95, spend: 65,
      anchors: [
        { type: 'mall', name: 'JEM & Westgate', icon: ShoppingBag, distance: '60m' },
        { type: 'mrt', name: 'Jurong East MRT', icon: Train, distance: '90m' },
        { type: 'office', name: 'Big Box', icon: Building2, distance: '200m' },
      ],
      insight: 'Family hub with weekend spikes. Lower rent than CBD.',
      grabSignal: '+180% GrabFood weekend',
      demographics: 'Families, students, commuters',
      conversionEst: '9.6%',
    },
    {
      id: 'novena', name: 'Novena', lng: 103.8438, lat: 1.3204, score: 73, color: '#FFB800',
      traffic: 71, competition: 38, transit: 88, spend: 79,
      anchors: [
        { type: 'mall', name: 'Velocity@Novena', icon: ShoppingBag, distance: '100m' },
        { type: 'mrt', name: 'Novena MRT', icon: Train, distance: '120m' },
        { type: 'hospital', name: 'TTSH Hospital', icon: Building2, distance: '250m' },
      ],
      insight: 'Healthcare workers = high disposable income. Limited competition.',
      grabSignal: '+150% GrabFood orders',
      demographics: 'Healthcare staff, nearby residents',
      conversionEst: '10.8%',
    },
    {
      id: 'tampines', name: 'Tampines', lng: 103.9568, lat: 1.3532, score: 68, color: '#FFB800',
      traffic: 88, competition: 81, transit: 90, spend: 58,
      anchors: [
        { type: 'mall', name: 'Tampines Mall', icon: ShoppingBag, distance: '40m' },
        { type: 'mrt', name: 'Tampines MRT', icon: Train, distance: '60m' },
      ],
      insight: 'Saturated market. 22 bubble tea shops in 1km radius.',
      grabSignal: '+90% GrabFood orders',
      demographics: 'Heartland families',
      conversionEst: '6.1%',
    },
    {
      id: 'clementi', name: 'Clementi', lng: 103.7649, lat: 1.3151, score: 81, color: '#00B14F',
      traffic: 79, competition: 41, transit: 86, spend: 68,
      anchors: [
        { type: 'uni', name: 'NUS', icon: GraduationCap, distance: '400m' },
        { type: 'mall', name: 'Clementi Mall', icon: ShoppingBag, distance: '80m' },
        { type: 'mrt', name: 'Clementi MRT', icon: Train, distance: '70m' },
      ],
      insight: 'University crowd loves bubble tea. Low competition + high demand.',
      grabSignal: '+260% GrabFood evening',
      demographics: 'Students (40k+), young residents',
      conversionEst: '12.1%',
    },
    {
      id: 'bedok', name: 'Bedok', lng: 103.9303, lat: 1.3236, score: 54, color: '#FF6B6B',
      traffic: 62, competition: 88, transit: 75, spend: 52,
      anchors: [
        { type: 'mall', name: 'Bedok Mall', icon: ShoppingBag, distance: '90m' },
      ],
      insight: 'Highly saturated. Not recommended for new entry.',
      grabSignal: '+40% GrabFood orders',
      demographics: 'Heartland residents',
      conversionEst: '4.8%',
    },
  ];

  // Animated scan
  useEffect(() => {
    if (stage === 'scanning') {
      let p = 0;
      const interval = setInterval(() => {
        p += 2;
        setScanProgress(p);
        const zonesToReveal = Math.floor((p / 100) * zones.length);
        setRevealedZones(zones.slice(0, zonesToReveal).map(z => z.id));
        if (p >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setRevealedZones(zones.map(z => z.id));
            setStage('map');
          }, 400);
        }
      }, 40);
      return () => clearInterval(interval);
    }
  }, [stage]);

  const reset = () => {
    setStage('input');
    setBusinessType(null);
    setPriority(null);
    setSelectedZone(null);
    setScanProgress(0);
    setRevealedZones([]);
  };

  const startScan = () => {
    setStage('scanning');
    setScanProgress(0);
    setRevealedZones([]);
  };

  return (
    <div className="min-h-screen bg-[#0A0E0C] text-white relative overflow-hidden" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif&family=JetBrains+Mono:wght@400;500;700&family=Inter:wght@300;400;500;600;700;800&display=swap');
        .serif { font-family: 'Instrument Serif', serif; }
        .mono { font-family: 'JetBrains Mono', monospace; }
        @keyframes pulse-ring {
          0% { transform: scale(0.8); opacity: 0.8; }
          100% { transform: scale(2.4); opacity: 0; }
        }
        @keyframes scan-line {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100vh); }
        }
        @keyframes zone-reveal {
          0% { transform: scale(0) translate(-50%,-50%); opacity: 0; }
          60% { transform: scale(1.3) translate(-50%,-50%); opacity: 1; }
          100% { transform: scale(1) translate(-50%,-50%); opacity: 1; }
        }
        @keyframes fade-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes glow {
          0%, 100% { box-shadow: 0 0 20px rgba(0,177,79,0.4); }
          50% { box-shadow: 0 0 40px rgba(0,177,79,0.7); }
        }
        .grid-bg {
          background-image:
            linear-gradient(rgba(0,177,79,0.06) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,177,79,0.06) 1px, transparent 1px);
          background-size: 40px 40px;
        }
        .scan-line { animation: scan-line 1.6s linear infinite; }
        .zone-pulse { animation: pulse-ring 2s ease-out infinite; }
        .zone-enter { animation: zone-reveal 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; transform-origin: top left; }
        .fade-up { animation: fade-up 0.5s ease-out forwards; }
        .glow-pulse { animation: glow 2s ease-in-out infinite; }
        .maplibregl-canvas { outline: none; }
        .maplibregl-ctrl-logo, .maplibregl-ctrl-attrib { display: none !important; }
      `}</style>

      {/* Top brand bar */}
      <div className="absolute top-0 left-0 right-0 z-50 px-6 py-4 flex items-center justify-between border-b border-white/5 bg-black/40 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#00B14F] flex items-center justify-center">
            <MapPin size={16} className="text-black" strokeWidth={2.5} />
          </div>
          <div>
            <div className="text-sm font-bold tracking-tight">CityLens</div>
            <div className="text-[10px] text-white/40 mono uppercase tracking-wider">Powered by GrabMaps</div>
          </div>
        </div>
        {stage !== 'input' && (
          <button onClick={reset} className="text-xs text-white/60 hover:text-white mono uppercase tracking-wider">
            ← New Search
          </button>
        )}
      </div>

      {/* API Key Warning */}
      {!GRABMAPS_API_KEY && stage === 'input' && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-50 bg-yellow-900/80 border border-yellow-600/50 rounded-lg px-4 py-2 flex items-center gap-2 text-xs max-w-md">
          <AlertCircle size={14} className="text-yellow-400 shrink-0" />
          <span className="text-yellow-200">No API key set — using fallback map. Add your key in <span className="mono">CityLens.jsx</span> line 10.</span>
        </div>
      )}

      {/* INPUT STAGE */}
      {stage === 'input' && (
        <div className="min-h-screen pt-24 pb-12 px-6 flex flex-col items-center justify-center grid-bg relative">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#00B14F] opacity-10 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500 opacity-5 rounded-full blur-3xl" />

          <div className="max-w-3xl w-full relative z-10">
            <div className="mb-12 text-center fade-up">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00B14F]/10 border border-[#00B14F]/30 mb-6">
                <Sparkles size={12} className="text-[#00B14F]" />
                <span className="text-[10px] mono uppercase tracking-widest text-[#00B14F]">For The Metropolitan Marketer</span>
              </div>
              <h1 className="serif text-6xl md:text-7xl leading-none mb-4">
                Find your<br />
                <span className="italic text-[#00B14F]">next move.</span>
              </h1>
              <p className="text-white/50 text-lg max-w-xl mx-auto">
                Where should you open next? CityLens analyzes foot traffic, market saturation, and customer demographics — in 30 seconds.
              </p>
            </div>

            <div className="space-y-8 fade-up" style={{ animationDelay: '0.2s', opacity: 0 }}>
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="mono text-[10px] uppercase tracking-widest text-white/40">01</span>
                  <span className="text-sm text-white/80">Business type</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {businesses.map(b => (
                    <button key={b.id} onClick={() => setBusinessType(b.id)}
                      className={`p-4 rounded-xl border text-left transition-all ${
                        businessType === b.id ? 'bg-[#00B14F] border-[#00B14F] text-black' : 'border-white/10 hover:border-white/30 bg-white/5'
                      }`}>
                      <div className="text-2xl mb-1">{b.icon}</div>
                      <div className="text-xs font-medium">{b.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="mono text-[10px] uppercase tracking-widest text-white/40">02</span>
                  <span className="text-sm text-white/80">What matters most?</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {priorities.map(p => {
                    const Icon = p.icon;
                    return (
                      <button key={p.id} onClick={() => setPriority(p.id)}
                        className={`p-4 rounded-xl border text-left transition-all ${
                          priority === p.id ? 'bg-[#00B14F] border-[#00B14F] text-black' : 'border-white/10 hover:border-white/30 bg-white/5'
                        }`}>
                        <Icon size={18} className="mb-2" />
                        <div className="text-xs font-medium">{p.label}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="mono text-[10px] uppercase tracking-widest text-white/40">03</span>
                  <span className="text-sm text-white/80">City</span>
                </div>
                <div className="p-4 rounded-xl border border-white/10 bg-white/5 flex items-center gap-3">
                  <MapPin size={18} className="text-[#00B14F]" />
                  <div className="flex-1">
                    <div className="text-sm">Singapore</div>
                    <div className="text-[10px] text-white/40 mono">SG · 5.4M population · GrabMaps coverage active</div>
                  </div>
                </div>
              </div>

              <button onClick={startScan} disabled={!businessType || !priority}
                className={`w-full py-4 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
                  businessType && priority ? 'bg-[#00B14F] text-black hover:bg-[#00d65b] glow-pulse' : 'bg-white/5 text-white/30 cursor-not-allowed'
                }`}>
                Scan the city <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SCANNING STAGE */}
      {stage === 'scanning' && (
        <div className="min-h-screen pt-16 relative overflow-hidden">
          <div className="absolute inset-0 overflow-hidden pointer-events-none z-20">
            <div className="scan-line absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#00B14F] to-transparent" style={{ boxShadow: '0 0 30px #00B14F' }} />
          </div>
          <MapLibreMap zones={zones} revealedZones={revealedZones} scanning apiKey={GRABMAPS_API_KEY} />
          <div className="absolute bottom-12 left-1/2 -translate-x-1/2 text-center w-full max-w-md px-6 z-30">
            <div className="bg-black/70 backdrop-blur-md rounded-xl p-4 border border-white/10">
              <div className="mono text-[10px] uppercase tracking-widest text-[#00B14F] mb-3">
                Analyzing GrabMaps data...
              </div>
              <div className="h-1 bg-white/10 rounded-full overflow-hidden mb-3">
                <div className="h-full bg-[#00B14F] transition-all" style={{ width: `${scanProgress}%` }} />
              </div>
              <div className="text-xs text-white/40 mono">
                {scanProgress < 30 && 'Scanning POI density across 28 districts'}
                {scanProgress >= 30 && scanProgress < 60 && 'Cross-referencing GrabFood order patterns'}
                {scanProgress >= 60 && scanProgress < 90 && 'Calculating market saturation indexes'}
                {scanProgress >= 90 && 'Ranking opportunity zones'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MAP STAGE */}
      {stage === 'map' && (
        <div className="min-h-screen pt-16 relative">
          <MapLibreMap
            zones={zones}
            revealedZones={zones.map(z => z.id)}
            onZoneClick={(z) => { setSelectedZone(z); setStage('detail'); }}
            apiKey={GRABMAPS_API_KEY}
          />

          <div className="absolute top-24 left-6 z-30 max-w-xs fade-up">
            <div className="bg-black/60 backdrop-blur-md border border-white/10 rounded-xl p-4">
              <div className="mono text-[10px] uppercase tracking-widest text-white/40 mb-1">Results</div>
              <div className="serif text-2xl mb-2">7 zones analyzed</div>
              <div className="text-xs text-white/60 leading-relaxed">
                Tap any pulsing marker to see foot traffic, anchor density, and projected conversion rates.
              </div>
            </div>
          </div>

          <div className="absolute bottom-6 left-6 z-30 fade-up" style={{ animationDelay: '0.2s' }}>
            <div className="bg-black/60 backdrop-blur-md border border-white/10 rounded-xl p-3">
              <div className="mono text-[10px] uppercase tracking-widest text-white/40 mb-2">Opportunity Index</div>
              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-[#00B14F]" />High</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-[#FFB800]" />Medium</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-[#FF6B6B]" />Saturated</span>
              </div>
            </div>
          </div>

          <div className="absolute top-24 right-6 z-30 fade-up" style={{ animationDelay: '0.3s' }}>
            <div className="bg-black/60 backdrop-blur-md border border-white/10 rounded-xl p-4 max-w-xs">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles size={14} className="text-[#00B14F]" />
                <div className="mono text-[10px] uppercase tracking-widest text-[#00B14F]">Top Pick</div>
              </div>
              <div className="serif text-xl mb-1">Orchard</div>
              <div className="text-xs text-white/60 mb-3">91/100 Opportunity Score</div>
              <button onClick={() => { setSelectedZone(zones[0]); setStage('detail'); }} className="text-xs text-[#00B14F] hover:underline flex items-center gap-1">
                View full report <ChevronRight size={12} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DETAIL STAGE */}
      {stage === 'detail' && selectedZone && (
        <DetailView zone={selectedZone} businessType={businessType} onBack={() => setStage('map')} />
      )}
    </div>
  );
}

// ============================================================
// 🗺️ MAPLIBRE MAP COMPONENT — renders a real interactive map
// ============================================================
function MapLibreMap({ zones, revealedZones, onZoneClick, scanning, apiKey }) {
  const mapContainer = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState(null);

  // Load MapLibre GL JS dynamically
  useEffect(() => {
    if (window.maplibregl) {
      initMap();
      return;
    }

    // Load CSS
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.css';
    document.head.appendChild(link);

    // Load JS
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.js';
    script.onload = () => initMap();
    script.onerror = () => setMapError('Failed to load MapLibre');
    document.head.appendChild(script);

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  const initMap = () => {
    if (!mapContainer.current || mapRef.current) return;

    try {
      // Determine style URL
      let styleUrl = FALLBACK_STYLE;

      if (apiKey) {
        // GrabMaps uses MapLibre with their own style endpoint
        // The API key is passed as a query param or Bearer token
        // Try the direct style URL with API key as query param
        styleUrl = `https://maps.grab.com/api/style.json?api_key=${apiKey}`;
      }

      const map = new window.maplibregl.Map({
        container: mapContainer.current,
        style: styleUrl,
        center: [103.8198, 1.3521], // Singapore center
        zoom: 11.5,
        pitch: 0,
        bearing: 0,
        attributionControl: false,
      });

      // If GrabMaps style fails, fall back to CARTO dark
      map.on('error', (e) => {
        console.warn('Map style error, falling back:', e);
        if (!mapLoaded) {
          map.setStyle(FALLBACK_STYLE);
        }
      });

      // If using GrabMaps with Bearer auth (from slide 8)
      if (apiKey) {
        map.on('styleimagemissing', () => {});
        // Add request transformer for Bearer token auth
        const originalFetch = window.fetch;
        window.fetch = function(url, options = {}) {
          if (typeof url === 'string' && url.includes('maps.grab.com')) {
            options.headers = {
              ...options.headers,
              'Authorization': `Bearer ${apiKey}`,
            };
          }
          return originalFetch.call(this, url, options);
        };
      }

      map.on('load', () => {
        setMapLoaded(true);

        // Add navigation controls
        map.addControl(new window.maplibregl.NavigationControl({ showCompass: false }), 'bottom-right');
      });

      mapRef.current = map;
    } catch (err) {
      console.error('Map init error:', err);
      setMapError(err.message);
    }
  };

  // Add/update markers when zones are revealed
  useEffect(() => {
    if (!mapRef.current || !window.maplibregl) return;

    // Clear old markers
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    zones.forEach((zone, i) => {
      if (!revealedZones.includes(zone.id)) return;

      // Create custom marker element
      const el = document.createElement('div');
      el.style.cssText = `
        position: relative;
        cursor: ${onZoneClick ? 'pointer' : 'default'};
      `;

      // Pulse ring
      const pulse1 = document.createElement('div');
      pulse1.style.cssText = `
        position: absolute;
        width: 50px; height: 50px;
        border-radius: 50%;
        background: ${zone.color};
        top: 50%; left: 50%;
        transform: translate(-50%, -50%);
        animation: pulse-ring 2s ease-out infinite;
        opacity: 0.4;
      `;

      const pulse2 = document.createElement('div');
      pulse2.style.cssText = pulse1.style.cssText;
      pulse2.style.animationDelay = '0.7s';

      // Main dot
      const dot = document.createElement('div');
      dot.style.cssText = `
        position: relative;
        width: 40px; height: 40px;
        border-radius: 50%;
        background: ${zone.color};
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
        font-weight: 700;
        color: #000;
        box-shadow: 0 0 20px ${zone.color}80;
        z-index: 2;
        transition: transform 0.2s;
      `;
      dot.textContent = zone.score;
      dot.onmouseenter = () => { dot.style.transform = 'scale(1.2)'; };
      dot.onmouseleave = () => { dot.style.transform = 'scale(1)'; };

      // Label
      const label = document.createElement('div');
      label.style.cssText = `
        position: absolute;
        top: 48px; left: 50%;
        transform: translateX(-50%);
        white-space: nowrap;
        background: rgba(0,0,0,0.8);
        backdrop-filter: blur(4px);
        padding: 2px 8px;
        border-radius: 4px;
        font-size: 10px;
        font-family: 'JetBrains Mono', monospace;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: white;
      `;
      label.textContent = zone.name;

      el.appendChild(pulse1);
      el.appendChild(pulse2);
      el.appendChild(dot);
      el.appendChild(label);

      if (onZoneClick) {
        el.addEventListener('click', () => onZoneClick(zone));
      }

      const marker = new window.maplibregl.Marker({ element: el, anchor: 'center' })
        .setLngLat([zone.lng, zone.lat])
        .addTo(mapRef.current);

      markersRef.current.push(marker);
    });
  }, [revealedZones, mapLoaded]);

  return (
    <div className="relative w-full h-screen">
      <div ref={mapContainer} className="absolute inset-0" style={{ background: '#0A0E0C' }} />
      {mapError && (
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <div className="bg-red-900/50 border border-red-600/50 rounded-lg px-4 py-3 text-xs text-red-200 max-w-sm text-center">
            <AlertCircle size={16} className="mx-auto mb-2" />
            Map failed to load: {mapError}<br />
            <span className="text-red-400">Using fallback map style.</span>
          </div>
        </div>
      )}
      {!mapLoaded && !mapError && (
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-[#00B14F] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <div className="text-xs text-white/40 mono">Loading GrabMaps...</div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// 📊 DETAIL VIEW — Zone report page
// ============================================================
function DetailView({ zone, businessType, onBack }) {
  return (
    <div className="min-h-screen pt-24 pb-12 px-6 grid-bg overflow-y-auto" style={{ background: '#0A0E0C' }}>
      <div className="max-w-5xl mx-auto fade-up">
        <button onClick={onBack} className="text-xs text-white/60 hover:text-white mono uppercase tracking-wider mb-6 flex items-center gap-1">
          ← Back to map
        </button>

        {/* Header */}
        <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
          <div>
            <div className="mono text-[10px] uppercase tracking-widest text-[#00B14F] mb-2">Zone Report · Singapore</div>
            <h1 className="serif text-5xl md:text-6xl mb-2">{zone.name}</h1>
            <div className="text-white/50 text-sm">For {businessType === 'bubbletea' ? 'bubble tea expansion' : businessType === 'fnb' ? 'F&B / cafe expansion' : 'your business'}</div>
          </div>
          <div className="text-right">
            <div className="mono text-[10px] uppercase tracking-widest text-white/40 mb-1">Opportunity Score</div>
            <div className="serif text-6xl md:text-7xl leading-none" style={{ color: zone.color }}>{zone.score}</div>
            <div className="text-xs text-white/40">out of 100</div>
          </div>
        </div>

        {/* Score breakdown */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          <ScoreBar label="Foot Traffic" value={zone.traffic} />
          <ScoreBar label="Market Saturation" value={100 - zone.competition} subtext={`${zone.competition}% competition`} />
          <ScoreBar label="Transit Access" value={zone.transit} />
          <ScoreBar label="Spend Power" value={zone.spend} />
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Hyperlocal Anchors */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Building2 size={16} className="text-[#00B14F]" />
              <div className="mono text-[10px] uppercase tracking-widest text-white/60">Hyperlocal Anchors</div>
            </div>
            <div className="text-xs text-white/50 mb-4">Traffic-driving landmarks within walking distance</div>
            <div className="space-y-3">
              {zone.anchors.map((anchor, i) => {
                const Icon = anchor.icon;
                return (
                  <div key={i} className="flex items-center gap-3 p-3 bg-black/30 rounded-lg">
                    <div className="w-9 h-9 rounded-lg bg-[#00B14F]/10 flex items-center justify-center">
                      <Icon size={16} className="text-[#00B14F]" />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium">{anchor.name}</div>
                      <div className="text-[10px] text-white/40 mono uppercase tracking-wider">{anchor.type} · {anchor.distance} away</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Grab Synergy */}
          <div className="bg-gradient-to-br from-[#00B14F]/10 to-transparent border border-[#00B14F]/30 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Zap size={16} className="text-[#00B14F]" />
              <div className="mono text-[10px] uppercase tracking-widest text-[#00B14F]">Grab Synergy</div>
            </div>
            <div className="text-xs text-white/50 mb-4">Why this zone amplifies your Grab ecosystem play</div>
            <div className="space-y-3">
              <div className="p-3 bg-black/30 rounded-lg">
                <div className="text-2xl serif text-[#00B14F] mb-1">{zone.grabSignal}</div>
                <div className="text-[10px] text-white/40 mono uppercase tracking-wider">vs. citywide average</div>
              </div>
              <div className="text-xs text-white/70 leading-relaxed">
                Opening here means your <span className="text-[#00B14F] font-semibold">physical store doubles as a high-density GrabFood delivery node</span>. Single rent, two revenue streams.
              </div>
              <div className="flex gap-2 pt-2 flex-wrap">
                <Tag>GrabFood ready</Tag>
                <Tag>GrabMart eligible</Tag>
              </div>
            </div>
          </div>
        </div>

        {/* Marketer Brief */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-8">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 size={16} className="text-[#00B14F]" />
            <div className="mono text-[10px] uppercase tracking-widest text-white/60">Marketer Brief</div>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            <Stat label="Est. Conversion Rate" value={zone.conversionEst} hint="Walk-by → purchase" />
            <Stat label="Market Saturation" value={`${zone.competition}%`} hint={zone.competition > 70 ? 'High — differentiation critical' : 'Moderate — entry viable'} />
            <Stat label="Customer Demographics" value={zone.demographics} small />
          </div>
          <div className="mt-5 pt-5 border-t border-white/10 text-sm text-white/70 leading-relaxed">
            <span className="text-[#00B14F] font-semibold">Strategic insight: </span>
            {zone.insight}
          </div>
        </div>

        {/* CTA */}
        <div className="flex gap-3 flex-wrap">
          <button className="flex-1 min-w-[200px] py-4 rounded-xl bg-[#00B14F] text-black font-semibold text-sm hover:bg-[#00d65b] transition-all flex items-center justify-center gap-2">
            Save to shortlist <ChevronRight size={16} />
          </button>
          <button className="flex-1 min-w-[200px] py-4 rounded-xl border border-white/20 text-white font-semibold text-sm hover:bg-white/5 transition-all">
            Export pitch deck
          </button>
        </div>
      </div>
    </div>
  );
}

function ScoreBar({ label, value, subtext }) {
  const color = value >= 75 ? '#00B14F' : value >= 50 ? '#FFB800' : '#FF6B6B';
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-4">
      <div className="text-[10px] mono uppercase tracking-widest text-white/40 mb-2">{label}</div>
      <div className="flex items-baseline gap-1 mb-2">
        <span className="serif text-3xl" style={{ color }}>{value}</span>
        <span className="text-xs text-white/40">/100</span>
      </div>
      <div className="h-1 bg-white/10 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${value}%`, backgroundColor: color }} />
      </div>
      {subtext && <div className="text-[10px] text-white/40 mt-2">{subtext}</div>}
    </div>
  );
}

function Stat({ label, value, hint, small }) {
  return (
    <div>
      <div className="text-[10px] mono uppercase tracking-widest text-white/40 mb-1">{label}</div>
      <div className={`serif ${small ? 'text-lg' : 'text-3xl'} text-white mb-1`}>{value}</div>
      <div className="text-[10px] text-white/50">{hint}</div>
    </div>
  );
}

function Tag({ children }) {
  return (
    <span className="text-[10px] mono uppercase tracking-wider px-2 py-1 rounded-full bg-[#00B14F]/20 text-[#00B14F] border border-[#00B14F]/30">
      {children}
    </span>
  );
}
