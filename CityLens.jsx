import React, { useState, useEffect, useRef, useMemo } from 'react';
import { MapPin, TrendingUp, Users, Zap, Train, ShoppingBag, GraduationCap, Building2, ChevronRight, Sparkles, ArrowRight, Target, BarChart3, AlertCircle, Search, Check, ChevronDown, X } from 'lucide-react';

// ============================================================
// GRABMAPS API KEY
// ============================================================
const GRABMAPS_API_KEY = 'bm_1777010908_nsVMGFokDyyncnwaCGRv1rqKXTqyuxTR';

// GrabMaps style: fetched via Bearer auth per SKILL.md §2.8
// The correct pattern is: fetch style.json → parse JSON → pass object to MapLibre
const GRABMAPS_STYLE_URL = 'https://maps.grab.com/api/style.json';
const FALLBACK_STYLE = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';

export default function CityLens() {
  const [stage, setStage] = useState('input');
  const [businessType, setBusinessType] = useState(null);
  const [selectedPriorities, setSelectedPriorities] = useState([]);
  const [selectedZone, setSelectedZone] = useState(null);
  const [scanProgress, setScanProgress] = useState(0);
  const [revealedZones, setRevealedZones] = useState([]);

  const businessCategories = [
    { category: 'Food & Beverage', items: [
      { id: 'bubbletea', icon: '\u{1F9CB}', label: 'Bubble Tea' },
      { id: 'cafe', icon: '\u2615', label: 'Caf\u00e9 / Coffee' },
      { id: 'restaurant', icon: '\u{1F37D}\uFE0F', label: 'Restaurant' },
      { id: 'fastfood', icon: '\u{1F354}', label: 'Fast Food / QSR' },
      { id: 'bakery', icon: '\u{1F950}', label: 'Bakery' },
      { id: 'bar', icon: '\u{1F378}', label: 'Bar / Lounge' },
      { id: 'cloudkitchen', icon: '\u{1F3ED}', label: 'Cloud Kitchen' },
      { id: 'dessert', icon: '\u{1F370}', label: 'Dessert / Ice Cream' },
      { id: 'healthfood', icon: '\u{1F957}', label: 'Health Food / Juice Bar' },
    ]},
    { category: 'Retail & Shopping', items: [
      { id: 'fashion', icon: '\u{1F457}', label: 'Fashion / Apparel' },
      { id: 'convenience', icon: '\u{1F3EA}', label: 'Convenience Store' },
      { id: 'grocery', icon: '\u{1F6D2}', label: 'Grocery / Supermart' },
      { id: 'electronics', icon: '\u{1F4F1}', label: 'Electronics' },
      { id: 'pharmacy', icon: '\u{1F48A}', label: 'Pharmacy' },
      { id: 'petshop', icon: '\u{1F43E}', label: 'Pet Shop' },
      { id: 'florist', icon: '\u{1F490}', label: 'Florist' },
      { id: 'bookstore', icon: '\u{1F4DA}', label: 'Bookstore' },
    ]},
    { category: 'Services (B2C)', items: [
      { id: 'salon', icon: '\u{1F487}', label: 'Salon / Barbershop' },
      { id: 'spa', icon: '\u{1F9D6}', label: 'Spa / Wellness' },
      { id: 'gym', icon: '\u{1F3CB}\uFE0F', label: 'Gym / Fitness Studio' },
      { id: 'laundry', icon: '\u{1F454}', label: 'Laundry / Dry Clean' },
      { id: 'tuition', icon: '\u{1F4DD}', label: 'Tuition / Learning' },
      { id: 'clinic', icon: '\u{1F3E5}', label: 'Clinic / Dental' },
      { id: 'repair', icon: '\u{1F527}', label: 'Repair Services' },
      { id: 'photography', icon: '\u{1F4F7}', label: 'Photography Studio' },
    ]},
    { category: 'B2B / Professional', items: [
      { id: 'coworking', icon: '\u{1F3E2}', label: 'Co-working Space' },
      { id: 'logistics', icon: '\u{1F4E6}', label: 'Logistics Hub' },
      { id: 'printshop', icon: '\u{1F5A8}\uFE0F', label: 'Print / Design Shop' },
      { id: 'agency', icon: '\u{1F4BC}', label: 'Agency / Consultancy' },
      { id: 'warehouse', icon: '\u{1F3D7}\uFE0F', label: 'Dark Store / Warehouse' },
      { id: 'catering', icon: '\u{1F371}', label: 'Catering Service' },
    ]},
  ];

  const allBusinesses = businessCategories.flatMap(c => c.items);

  const priorities = [
    { id: 'traffic', label: 'High Foot Traffic', icon: Users, desc: 'Zones with heavy pedestrian flow' },
    { id: 'low-comp', label: 'Low Market Saturation', icon: Target, desc: 'Few competitors in the area' },
    { id: 'transit', label: 'Transit Accessibility', icon: Train, desc: 'Near MRT, bus interchanges' },
    { id: 'spend', label: 'High Spending Power', icon: TrendingUp, desc: 'Affluent customer demographics' },
    { id: 'grab-density', label: 'GrabFood Demand', icon: Zap, desc: 'High delivery order volume' },
    { id: 'anchor', label: 'Strong Anchors', icon: Building2, desc: 'Near malls, universities, hospitals' },
    { id: 'students', label: 'Student Population', icon: GraduationCap, desc: 'Near universities & schools' },
    { id: 'low-rent', label: 'Affordable Rent', icon: BarChart3, desc: 'Lower commercial lease rates' },
  ];

  const togglePriority = (id) => {
    setSelectedPriorities(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]);
  };

  const zones = [
    { id: 'orchard', name: 'Orchard', lng: 103.8321, lat: 1.3048, score: 91, color: '#00B14F', traffic: 95, competition: 72, transit: 98, spend: 88, anchors: [{ type: 'mall', name: 'ION Orchard', icon: ShoppingBag, distance: '120m' }, { type: 'mrt', name: 'Orchard MRT', icon: Train, distance: '80m' }, { type: 'mall', name: 'Takashimaya', icon: ShoppingBag, distance: '300m' }], insight: 'Premium foot traffic, but expect rent pressure. 14 bubble tea brands within 500m.', grabSignal: '+340% GrabFood orders vs city avg', demographics: 'Young professionals, tourists, students', conversionEst: '8.2%' },
    { id: 'paya-lebar', name: 'Paya Lebar', lng: 103.8927, lat: 1.3176, score: 84, color: '#00B14F', traffic: 82, competition: 45, transit: 92, spend: 71, anchors: [{ type: 'mall', name: 'PLQ Mall', icon: ShoppingBag, distance: '50m' }, { type: 'mrt', name: 'Paya Lebar MRT', icon: Train, distance: '40m' }, { type: 'office', name: 'PLQ Towers', icon: Building2, distance: '100m' }], insight: 'Underserved bubble tea market. Office crowd = consistent weekday demand.', grabSignal: '+210% GrabFood lunch orders', demographics: 'Office workers, young families', conversionEst: '11.4%' },
    { id: 'jurong', name: 'Jurong East', lng: 103.7436, lat: 1.3329, score: 78, color: '#FFB800', traffic: 76, competition: 58, transit: 95, spend: 65, anchors: [{ type: 'mall', name: 'JEM & Westgate', icon: ShoppingBag, distance: '60m' }, { type: 'mrt', name: 'Jurong East MRT', icon: Train, distance: '90m' }, { type: 'office', name: 'Big Box', icon: Building2, distance: '200m' }], insight: 'Family hub with weekend spikes. Lower rent than CBD.', grabSignal: '+180% GrabFood weekend', demographics: 'Families, students, commuters', conversionEst: '9.6%' },
    { id: 'novena', name: 'Novena', lng: 103.8438, lat: 1.3204, score: 73, color: '#FFB800', traffic: 71, competition: 38, transit: 88, spend: 79, anchors: [{ type: 'mall', name: 'Velocity@Novena', icon: ShoppingBag, distance: '100m' }, { type: 'mrt', name: 'Novena MRT', icon: Train, distance: '120m' }, { type: 'hospital', name: 'TTSH Hospital', icon: Building2, distance: '250m' }], insight: 'Healthcare workers = high disposable income. Limited competition.', grabSignal: '+150% GrabFood orders', demographics: 'Healthcare staff, nearby residents', conversionEst: '10.8%' },
    { id: 'tampines', name: 'Tampines', lng: 103.9568, lat: 1.3532, score: 68, color: '#FFB800', traffic: 88, competition: 81, transit: 90, spend: 58, anchors: [{ type: 'mall', name: 'Tampines Mall', icon: ShoppingBag, distance: '40m' }, { type: 'mrt', name: 'Tampines MRT', icon: Train, distance: '60m' }], insight: 'Saturated market. 22 bubble tea shops in 1km radius.', grabSignal: '+90% GrabFood orders', demographics: 'Heartland families', conversionEst: '6.1%' },
    { id: 'clementi', name: 'Clementi', lng: 103.7649, lat: 1.3151, score: 81, color: '#00B14F', traffic: 79, competition: 41, transit: 86, spend: 68, anchors: [{ type: 'uni', name: 'NUS', icon: GraduationCap, distance: '400m' }, { type: 'mall', name: 'Clementi Mall', icon: ShoppingBag, distance: '80m' }, { type: 'mrt', name: 'Clementi MRT', icon: Train, distance: '70m' }], insight: 'University crowd loves bubble tea. Low competition + high demand.', grabSignal: '+260% GrabFood evening', demographics: 'Students (40k+), young residents', conversionEst: '12.1%' },
    { id: 'bedok', name: 'Bedok', lng: 103.9303, lat: 1.3236, score: 54, color: '#FF6B6B', traffic: 62, competition: 88, transit: 75, spend: 52, anchors: [{ type: 'mall', name: 'Bedok Mall', icon: ShoppingBag, distance: '90m' }], insight: 'Highly saturated. Not recommended for new entry.', grabSignal: '+40% GrabFood orders', demographics: 'Heartland residents', conversionEst: '4.8%' },
  ];

  useEffect(() => {
    if (stage === 'scanning') {
      let p = 0;
      const interval = setInterval(() => {
        p += 2;
        setScanProgress(p);
        const n = Math.floor((p / 100) * zones.length);
        setRevealedZones(zones.slice(0, n).map(z => z.id));
        if (p >= 100) { clearInterval(interval); setTimeout(() => { setRevealedZones(zones.map(z => z.id)); setStage('map'); }, 400); }
      }, 40);
      return () => clearInterval(interval);
    }
  }, [stage]);

  const reset = () => { setStage('input'); setBusinessType(null); setSelectedPriorities([]); setSelectedZone(null); setScanProgress(0); setRevealedZones([]); };
  const startScan = () => { setStage('scanning'); setScanProgress(0); setRevealedZones([]); };
  const canScan = businessType && selectedPriorities.length > 0;

  return (
    <div className="min-h-screen bg-[#0A0E0C] text-white relative overflow-hidden" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif&family=JetBrains+Mono:wght@400;500;700&family=Inter:wght@300;400;500;600;700;800&display=swap');
        .serif { font-family: 'Instrument Serif', serif; }
        .mono { font-family: 'JetBrains Mono', monospace; }
        @keyframes pulse-ring { 0% { transform: scale(0.8); opacity: 0.8; } 100% { transform: scale(2.4); opacity: 0; } }
        @keyframes scan-line { 0% { transform: translateY(-100%); } 100% { transform: translateY(100vh); } }
        @keyframes fade-up { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes glow { 0%, 100% { box-shadow: 0 0 20px rgba(0,177,79,0.4); } 50% { box-shadow: 0 0 40px rgba(0,177,79,0.7); } }
        .grid-bg { background-image: linear-gradient(rgba(0,177,79,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(0,177,79,0.06) 1px, transparent 1px); background-size: 40px 40px; }
        .scan-line { animation: scan-line 1.6s linear infinite; }
        .zone-pulse { animation: pulse-ring 2s ease-out infinite; }
        .fade-up { animation: fade-up 0.5s ease-out forwards; }
        .glow-pulse { animation: glow 2s ease-in-out infinite; }
        .maplibregl-canvas { outline: none; }
        .maplibregl-ctrl-logo, .maplibregl-ctrl-attrib { display: none !important; }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(255,255,255,0.05); border-radius: 2px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0,177,79,0.3); border-radius: 2px; }
      `}</style>

      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 z-50 px-6 py-4 flex items-center justify-between border-b border-white/5 bg-black/40 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#00B14F] flex items-center justify-center"><MapPin size={16} className="text-black" strokeWidth={2.5} /></div>
          <div><div className="text-sm font-bold tracking-tight">CityLens</div><div className="text-[10px] text-white/40 mono uppercase tracking-wider">Powered by GrabMaps</div></div>
        </div>
        {stage !== 'input' && <button onClick={reset} className="text-xs text-white/60 hover:text-white mono uppercase tracking-wider">← New Search</button>}
      </div>

      {/* INPUT */}
      {stage === 'input' && (
        <div className="min-h-screen pt-24 pb-12 px-6 flex flex-col items-center justify-center grid-bg relative">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#00B14F] opacity-10 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500 opacity-5 rounded-full blur-3xl" />
          <div className="max-w-3xl w-full relative z-10">
            <div className="mb-10 text-center fade-up">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00B14F]/10 border border-[#00B14F]/30 mb-6">
                <Sparkles size={12} className="text-[#00B14F]" />
                <span className="text-[10px] mono uppercase tracking-widest text-[#00B14F]">For The Metropolitan Marketer</span>
              </div>
              <h1 className="serif text-5xl md:text-7xl leading-none mb-4">Find your<br /><span className="italic text-[#00B14F]">next move.</span></h1>
              <p className="text-white/50 text-lg max-w-xl mx-auto">Where should you open next? CityLens analyzes foot traffic, market saturation, and customer demographics — in 30 seconds.</p>
            </div>

            <div className="space-y-6 fade-up" style={{ animationDelay: '0.2s', opacity: 0 }}>
              {/* 01 Business type */}
              <div>
                <div className="flex items-center gap-2 mb-3"><span className="mono text-[10px] uppercase tracking-widest text-white/40">01</span><span className="text-sm text-white/80">What type of business?</span></div>
                <BusinessTypeDropdown categories={businessCategories} selected={businessType} onSelect={setBusinessType} allItems={allBusinesses} />
              </div>

              {/* 02 Priorities multi-select */}
              <div>
                <div className="flex items-center gap-2 mb-1"><span className="mono text-[10px] uppercase tracking-widest text-white/40">02</span><span className="text-sm text-white/80">What matters most?</span></div>
                <div className="text-[10px] text-white/30 mb-3">Select all that apply</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {priorities.map(p => {
                    const Icon = p.icon;
                    const sel = selectedPriorities.includes(p.id);
                    return (
                      <button key={p.id} onClick={() => togglePriority(p.id)} className={`p-3 rounded-xl border text-left transition-all flex items-start gap-3 ${sel ? 'bg-[#00B14F]/10 border-[#00B14F]/50' : 'border-white/10 hover:border-white/20 bg-white/5'}`}>
                        <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all ${sel ? 'bg-[#00B14F] border-[#00B14F]' : 'border-white/30'}`}>
                          {sel && <Check size={12} className="text-black" strokeWidth={3} />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2"><Icon size={14} className={sel ? 'text-[#00B14F]' : 'text-white/60'} /><span className={`text-xs font-medium ${sel ? 'text-[#00B14F]' : 'text-white'}`}>{p.label}</span></div>
                          <div className="text-[10px] text-white/40 mt-0.5">{p.desc}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
                {selectedPriorities.length > 0 && <div className="mt-2 text-[10px] text-white/40 mono">{selectedPriorities.length} factor{selectedPriorities.length !== 1 ? 's' : ''} selected</div>}
              </div>

              {/* 03 City */}
              <div>
                <div className="flex items-center gap-2 mb-3"><span className="mono text-[10px] uppercase tracking-widest text-white/40">03</span><span className="text-sm text-white/80">City</span></div>
                <div className="p-4 rounded-xl border border-white/10 bg-white/5 flex items-center gap-3">
                  <MapPin size={18} className="text-[#00B14F]" />
                  <div className="flex-1"><div className="text-sm">Singapore</div><div className="text-[10px] text-white/40 mono">SG · 5.4M population · GrabMaps coverage active</div></div>
                </div>
              </div>

              <button onClick={startScan} disabled={!canScan} className={`w-full py-4 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 ${canScan ? 'bg-[#00B14F] text-black hover:bg-[#00d65b] glow-pulse' : 'bg-white/5 text-white/30 cursor-not-allowed'}`}>
                {!businessType ? 'Select a business type' : selectedPriorities.length === 0 ? 'Select at least one priority' : 'Scan the city'} <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SCANNING */}
      {stage === 'scanning' && (
        <div className="min-h-screen pt-16 relative overflow-hidden">
          <div className="absolute inset-0 overflow-hidden pointer-events-none z-20"><div className="scan-line absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#00B14F] to-transparent" style={{ boxShadow: '0 0 30px #00B14F' }} /></div>
          <MapLibreMap zones={zones} revealedZones={revealedZones} scanning />
          <div className="absolute bottom-12 left-1/2 -translate-x-1/2 text-center w-full max-w-md px-6 z-30">
            <div className="bg-black/70 backdrop-blur-md rounded-xl p-4 border border-white/10">
              <div className="mono text-[10px] uppercase tracking-widest text-[#00B14F] mb-3">Analyzing GrabMaps data...</div>
              <div className="h-1 bg-white/10 rounded-full overflow-hidden mb-3"><div className="h-full bg-[#00B14F] transition-all" style={{ width: `${scanProgress}%` }} /></div>
              <div className="text-xs text-white/40 mono">
                {scanProgress < 25 && 'Scanning POI density across 28 districts'}
                {scanProgress >= 25 && scanProgress < 50 && 'Cross-referencing GrabFood order patterns'}
                {scanProgress >= 50 && scanProgress < 75 && 'Calculating market saturation indexes'}
                {scanProgress >= 75 && scanProgress < 90 && 'Evaluating hyperlocal anchor proximity'}
                {scanProgress >= 90 && 'Ranking opportunity zones by your priorities'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MAP */}
      {stage === 'map' && (
        <div className="min-h-screen pt-16 relative">
          <MapLibreMap zones={zones} revealedZones={zones.map(z => z.id)} onZoneClick={(z) => { setSelectedZone(z); setStage('detail'); }} />
          <div className="absolute top-24 left-6 z-30 max-w-xs fade-up">
            <div className="bg-black/60 backdrop-blur-md border border-white/10 rounded-xl p-4">
              <div className="mono text-[10px] uppercase tracking-widest text-white/40 mb-1">Results</div>
              <div className="serif text-2xl mb-2">7 zones analyzed</div>
              <div className="text-xs text-white/60 leading-relaxed">Tap any pulsing marker to see foot traffic, anchor density, and projected conversion rates.</div>
              {businessType && <div className="mt-2 flex items-center gap-1.5"><span className="text-lg">{allBusinesses.find(b => b.id === businessType)?.icon}</span><span className="text-xs text-[#00B14F] font-medium">{allBusinesses.find(b => b.id === businessType)?.label}</span></div>}
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
              <div className="flex items-center gap-2 mb-2"><Sparkles size={14} className="text-[#00B14F]" /><div className="mono text-[10px] uppercase tracking-widest text-[#00B14F]">Top Pick</div></div>
              <div className="serif text-xl mb-1">Orchard</div>
              <div className="text-xs text-white/60 mb-3">91/100 Opportunity Score</div>
              <button onClick={() => { setSelectedZone(zones[0]); setStage('detail'); }} className="text-xs text-[#00B14F] hover:underline flex items-center gap-1">View full report <ChevronRight size={12} /></button>
            </div>
          </div>
        </div>
      )}

      {/* DETAIL */}
      {stage === 'detail' && selectedZone && <DetailView zone={selectedZone} businessType={businessType} allBusinesses={allBusinesses} onBack={() => setStage('map')} />}
    </div>
  );
}

function BusinessTypeDropdown({ categories, selected, onSelect, allItems }) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef(null);
  const inputRef = useRef(null);
  const selectedItem = allItems.find(b => b.id === selected);

  useEffect(() => { const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setIsOpen(false); }; document.addEventListener('mousedown', h); return () => document.removeEventListener('mousedown', h); }, []);
  useEffect(() => { if (isOpen && inputRef.current) inputRef.current.focus(); }, [isOpen]);

  const filtered = useMemo(() => {
    if (!search.trim()) return categories;
    const t = search.toLowerCase();
    return categories.map(c => ({ ...c, items: c.items.filter(i => i.label.toLowerCase().includes(t) || c.category.toLowerCase().includes(t)) })).filter(c => c.items.length > 0);
  }, [search, categories]);

  return (
    <div ref={ref} className="relative">
      <button onClick={() => setIsOpen(!isOpen)} className={`w-full p-4 rounded-xl border text-left transition-all flex items-center gap-3 ${isOpen ? 'border-[#00B14F]/50 bg-[#00B14F]/5' : selected ? 'border-[#00B14F]/30 bg-[#00B14F]/5' : 'border-white/10 bg-white/5 hover:border-white/20'}`}>
        {selectedItem ? (<><span className="text-xl">{selectedItem.icon}</span><span className="text-sm font-medium flex-1">{selectedItem.label}</span><button onClick={(e) => { e.stopPropagation(); onSelect(null); setSearch(''); }} className="text-white/40 hover:text-white"><X size={14} /></button></>) : (<><Search size={16} className="text-white/40" /><span className="text-sm text-white/40 flex-1">Search or browse business types...</span><ChevronDown size={16} className={`text-white/40 transition-transform ${isOpen ? 'rotate-180' : ''}`} /></>)}
      </button>
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-[#141A16] border border-white/10 rounded-xl overflow-hidden z-50 shadow-2xl shadow-black/50">
          <div className="p-3 border-b border-white/10">
            <div className="flex items-center gap-2 bg-white/5 rounded-lg px-3 py-2">
              <Search size={14} className="text-white/40" />
              <input ref={inputRef} type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Type to search..." className="bg-transparent text-sm text-white outline-none flex-1 placeholder:text-white/30" />
              {search && <button onClick={() => setSearch('')} className="text-white/40 hover:text-white"><X size={12} /></button>}
            </div>
          </div>
          <div className="max-h-72 overflow-y-auto custom-scrollbar">
            {filtered.length === 0 && <div className="p-4 text-center text-xs text-white/40">No matching business types found</div>}
            {filtered.map(cat => (
              <div key={cat.category}>
                <div className="px-4 py-2 mono text-[10px] uppercase tracking-widest text-white/30 bg-white/5 sticky top-0">{cat.category}</div>
                {cat.items.map(item => (
                  <button key={item.id} onClick={() => { onSelect(item.id); setIsOpen(false); setSearch(''); }} className={`w-full px-4 py-2.5 flex items-center gap-3 text-left hover:bg-white/5 transition-colors ${selected === item.id ? 'bg-[#00B14F]/10' : ''}`}>
                    <span className="text-lg">{item.icon}</span>
                    <span className={`text-xs ${selected === item.id ? 'text-[#00B14F] font-medium' : 'text-white/80'}`}>{item.label}</span>
                    {selected === item.id && <Check size={12} className="text-[#00B14F] ml-auto" />}
                  </button>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function MapLibreMap({ zones, revealedZones, onZoneClick, scanning }) {
  const mapContainer = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const [mapLoaded, setMapLoaded] = useState(false);

  useEffect(() => {
    if (window.maplibregl) { initMap(); return; }
    const link = document.createElement('link'); link.rel = 'stylesheet'; link.href = 'https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.css'; document.head.appendChild(link);
    const script = document.createElement('script'); script.src = 'https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.js'; script.onload = () => initMap(); document.head.appendChild(script);
    return () => { if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; } };
  }, []);

  const initMap = async () => {
    if (!mapContainer.current || mapRef.current) return;

    // Per GrabMaps SKILL.md §2.8: fetch the style JSON with Bearer auth,
    // then pass the parsed JSON *object* to MapLibre as `style`.
    // This is the correct approach — passing a URL string does NOT work
    // because MapLibre cannot add Bearer headers to the initial style fetch.

    let styleObj = null;

    if (GRABMAPS_API_KEY) {
      try {
        const res = await fetch('https://maps.grab.com/api/style.json', {
          headers: { 'Authorization': 'Bearer ' + GRABMAPS_API_KEY },
        });
        if (res.ok) {
          styleObj = await res.json();
          console.log('GrabMaps style loaded successfully!');
        } else {
          console.warn('GrabMaps style.json returned', res.status, '— falling back to CARTO');
        }
      } catch (err) {
        console.warn('Failed to fetch GrabMaps style:', err.message);
      }
    }

    try {
      const opts = {
        container: mapContainer.current,
        style: styleObj || FALLBACK_STYLE,
        center: [103.8198, 1.3521],
        zoom: 11.5,
        pitch: 0,
        bearing: 0,
        attributionControl: false,
      };

      // If using GrabMaps tiles, add transformRequest so all subsequent
      // tile/sprite/glyph requests also include the Bearer token
      if (styleObj && GRABMAPS_API_KEY) {
        opts.transformRequest = (url) => {
          if (url && url.includes('maps.grab.com')) {
            return { url, headers: { 'Authorization': 'Bearer ' + GRABMAPS_API_KEY } };
          }
          return { url };
        };
      }

      const map = new window.maplibregl.Map(opts);
      map.on('load', () => {
        // Force resize to fill container properly
        setTimeout(() => { map.resize(); }, 100);
        setMapLoaded(true);
        map.addControl(new window.maplibregl.NavigationControl({ showCompass: false }), 'bottom-right');
      });
      // Backup: also try on 'idle' in case 'load' fires too early with async style
      map.on('idle', () => {
        if (!mapLoaded) {
          map.resize();
          setMapLoaded(true);
        }
      });
      map.on('error', (e) => {
        console.warn('Map error:', e);
      });
      mapRef.current = map;
    } catch (err) {
      console.error('Map init error:', err);
      try {
        const map = new window.maplibregl.Map({ container: mapContainer.current, style: FALLBACK_STYLE, center: [103.8198, 1.3521], zoom: 11.5, attributionControl: false });
        map.on('load', () => setMapLoaded(true)); mapRef.current = map;
      } catch (e) {}
    }
  };

  useEffect(() => {
    if (!mapLoaded || !mapRef.current || !window.maplibregl) return;
    
    // Small delay to ensure map is fully rendered after style load
    const timer = setTimeout(() => {
      markersRef.current.forEach(m => m.remove()); markersRef.current = [];
      zones.forEach((zone) => {
        if (!revealedZones.includes(zone.id)) return;
        const el = document.createElement('div'); 
        el.style.cssText = `position:relative;cursor:${onZoneClick ? 'pointer' : 'default'};z-index:10;`;
        
        const p1 = document.createElement('div'); 
        p1.style.cssText = `position:absolute;width:50px;height:50px;border-radius:50%;background:${zone.color};top:50%;left:50%;transform:translate(-50%,-50%);animation:pulse-ring 2s ease-out infinite;opacity:0.4;pointer-events:none;`;
        
        const p2 = document.createElement('div'); 
        p2.style.cssText = p1.style.cssText; 
        p2.style.animationDelay = '0.7s';
        
        const dot = document.createElement('div'); 
        dot.style.cssText = `position:relative;width:44px;height:44px;border-radius:50%;background:${zone.color};display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;color:#000;box-shadow:0 0 24px ${zone.color}80, 0 2px 8px rgba(0,0,0,0.5);z-index:2;transition:transform 0.2s;font-family:Inter,system-ui,sans-serif;border:2px solid rgba(0,0,0,0.2);`;
        dot.textContent = zone.score; 
        dot.onmouseenter = () => { dot.style.transform = 'scale(1.2)'; }; 
        dot.onmouseleave = () => { dot.style.transform = 'scale(1)'; };
        
        const label = document.createElement('div'); 
        label.style.cssText = `position:absolute;top:52px;left:50%;transform:translateX(-50%);white-space:nowrap;background:rgba(0,0,0,0.85);backdrop-filter:blur(4px);padding:3px 10px;border-radius:6px;font-size:11px;font-family:'JetBrains Mono',monospace;text-transform:uppercase;letter-spacing:0.05em;color:white;pointer-events:none;border:1px solid rgba(255,255,255,0.1);`;
        label.textContent = zone.name;
        
        el.appendChild(p1); el.appendChild(p2); el.appendChild(dot); el.appendChild(label);
        if (onZoneClick) el.addEventListener('click', () => onZoneClick(zone));
        
        const marker = new window.maplibregl.Marker({ element: el, anchor: 'center' })
          .setLngLat([zone.lng, zone.lat])
          .addTo(mapRef.current);
        markersRef.current.push(marker);
      });
    }, 200);
    
    return () => clearTimeout(timer);
  }, [revealedZones, mapLoaded]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100vh', minHeight: '100vh' }}>
      <div ref={mapContainer} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%', background: '#0A0E0C' }} />
      {!mapLoaded && <div className="absolute inset-0 flex items-center justify-center z-10"><div className="text-center"><div className="w-8 h-8 border-2 border-[#00B14F] border-t-transparent rounded-full animate-spin mx-auto mb-3" /><div className="text-xs text-white/40 mono">Loading map...</div></div></div>}
    </div>
  );
}

function DetailView({ zone, businessType, allBusinesses, onBack }) {
  const biz = allBusinesses.find(b => b.id === businessType);
  return (
    <div className="min-h-screen pt-24 pb-12 px-6 overflow-y-auto" style={{ background: '#0A0E0C' }}>
      <div className="max-w-5xl mx-auto fade-up">
        <button onClick={onBack} className="text-xs text-white/60 hover:text-white mono uppercase tracking-wider mb-6 flex items-center gap-1">← Back to map</button>
        <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
          <div>
            <div className="mono text-[10px] uppercase tracking-widest text-[#00B14F] mb-2">Zone Report · Singapore</div>
            <h1 className="serif text-5xl md:text-6xl mb-2">{zone.name}</h1>
            {biz && <div className="flex items-center gap-2 text-white/50 text-sm"><span className="text-lg">{biz.icon}</span> {biz.label} expansion analysis</div>}
          </div>
          <div className="text-right"><div className="mono text-[10px] uppercase tracking-widest text-white/40 mb-1">Opportunity Score</div><div className="serif text-6xl md:text-7xl leading-none" style={{ color: zone.color }}>{zone.score}</div><div className="text-xs text-white/40">out of 100</div></div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          <ScoreBar label="Foot Traffic" value={zone.traffic} />
          <ScoreBar label="Market Saturation" value={100 - zone.competition} subtext={`${zone.competition}% competition`} />
          <ScoreBar label="Transit Access" value={zone.transit} />
          <ScoreBar label="Spend Power" value={zone.spend} />
        </div>
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4"><Building2 size={16} className="text-[#00B14F]" /><div className="mono text-[10px] uppercase tracking-widest text-white/60">Hyperlocal Anchors</div></div>
            <div className="text-xs text-white/50 mb-4">Traffic-driving landmarks within walking distance</div>
            <div className="space-y-3">
              {zone.anchors.map((a, i) => { const Icon = a.icon; return (
                <div key={i} className="flex items-center gap-3 p-3 bg-black/30 rounded-lg">
                  <div className="w-9 h-9 rounded-lg bg-[#00B14F]/10 flex items-center justify-center"><Icon size={16} className="text-[#00B14F]" /></div>
                  <div className="flex-1"><div className="text-sm font-medium">{a.name}</div><div className="text-[10px] text-white/40 mono uppercase tracking-wider">{a.type} · {a.distance} away</div></div>
                </div>
              ); })}
            </div>
          </div>
          <div className="bg-gradient-to-br from-[#00B14F]/10 to-transparent border border-[#00B14F]/30 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4"><Zap size={16} className="text-[#00B14F]" /><div className="mono text-[10px] uppercase tracking-widest text-[#00B14F]">Grab Synergy</div></div>
            <div className="text-xs text-white/50 mb-4">Why this zone amplifies your Grab ecosystem play</div>
            <div className="space-y-3">
              <div className="p-3 bg-black/30 rounded-lg"><div className="text-2xl serif text-[#00B14F] mb-1">{zone.grabSignal}</div><div className="text-[10px] text-white/40 mono uppercase tracking-wider">vs. citywide average</div></div>
              <div className="text-xs text-white/70 leading-relaxed">Opening here means your <span className="text-[#00B14F] font-semibold">physical store doubles as a high-density GrabFood delivery node</span>. Single rent, two revenue streams.</div>
              <div className="flex gap-2 pt-2 flex-wrap"><Tag>GrabFood ready</Tag><Tag>GrabMart eligible</Tag></div>
            </div>
          </div>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-8">
          <div className="flex items-center gap-2 mb-4"><BarChart3 size={16} className="text-[#00B14F]" /><div className="mono text-[10px] uppercase tracking-widest text-white/60">Marketer Brief</div></div>
          <div className="grid md:grid-cols-3 gap-4">
            <Stat label="Est. Conversion Rate" value={zone.conversionEst} hint="Walk-by → purchase" />
            <Stat label="Market Saturation" value={`${zone.competition}%`} hint={zone.competition > 70 ? 'High — differentiation critical' : 'Moderate — entry viable'} />
            <Stat label="Customer Demographics" value={zone.demographics} small />
          </div>
          <div className="mt-5 pt-5 border-t border-white/10 text-sm text-white/70 leading-relaxed"><span className="text-[#00B14F] font-semibold">Strategic insight: </span>{zone.insight}</div>
        </div>
        <div className="flex gap-3 flex-wrap">
          <button className="flex-1 min-w-[200px] py-4 rounded-xl bg-[#00B14F] text-black font-semibold text-sm hover:bg-[#00d65b] transition-all flex items-center justify-center gap-2">Save to shortlist <ChevronRight size={16} /></button>
          <button className="flex-1 min-w-[200px] py-4 rounded-xl border border-white/20 text-white font-semibold text-sm hover:bg-white/5 transition-all">Export pitch deck</button>
        </div>
      </div>
    </div>
  );
}

function ScoreBar({ label, value, subtext }) {
  const color = value >= 75 ? '#00B14F' : value >= 50 ? '#FFB800' : '#FF6B6B';
  return (<div className="bg-white/5 border border-white/10 rounded-xl p-4"><div className="text-[10px] mono uppercase tracking-widest text-white/40 mb-2">{label}</div><div className="flex items-baseline gap-1 mb-2"><span className="serif text-3xl" style={{ color }}>{value}</span><span className="text-xs text-white/40">/100</span></div><div className="h-1 bg-white/10 rounded-full overflow-hidden"><div className="h-full rounded-full transition-all" style={{ width: `${value}%`, backgroundColor: color }} /></div>{subtext && <div className="text-[10px] text-white/40 mt-2">{subtext}</div>}</div>);
}
function Stat({ label, value, hint, small }) {
  return (<div><div className="text-[10px] mono uppercase tracking-widest text-white/40 mb-1">{label}</div><div className={`serif ${small ? 'text-lg' : 'text-3xl'} text-white mb-1`}>{value}</div><div className="text-[10px] text-white/50">{hint}</div></div>);
}
function Tag({ children }) {
  return (<span className="text-[10px] mono uppercase tracking-wider px-2 py-1 rounded-full bg-[#00B14F]/20 text-[#00B14F] border border-[#00B14F]/30">{children}</span>);
}
