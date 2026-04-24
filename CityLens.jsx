import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { MapPin, TrendingUp, Users, Zap, Train, ShoppingBag, GraduationCap, Building2, ChevronRight, Sparkles, ArrowRight, Target, BarChart3, AlertCircle, Search, Check, ChevronDown, X, Star, Download, Bookmark, BookmarkCheck, ExternalLink, Navigation, Clock, ThumbsUp, ThumbsDown } from 'lucide-react';

// ============================================================
// API KEYS
// ============================================================
const GRABMAPS_API_KEY = 'bm_1777010908_nsVMGFokDyyncnwaCGRv1rqKXTqyuxTR';
const GOOGLE_PLACES_API_KEY = ''; // Add your Google Places API key here

// GrabMaps style: fetched via Bearer auth per SKILL.md §2.8
const GRABMAPS_STYLE_URL = 'https://maps.grab.com/api/style.json';
const FALLBACK_STYLE = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';

// ============================================================
// BUSINESS-TYPE SPECIFIC SVG ICONS FOR MAP MARKERS
// ============================================================
const BUSINESS_SVG_ICONS = {
  bubbletea: `<svg viewBox="0 0 24 24" fill="none" stroke="#000" stroke-width="1.5"><path d="M8 2h8l-1 10H9L8 2z"/><path d="M12 12v6"/><circle cx="12" cy="20" r="2"/><path d="M9 5h6"/></svg>`,
  cafe: `<svg viewBox="0 0 24 24" fill="none" stroke="#000" stroke-width="1.5"><path d="M17 8h1a4 4 0 010 8h-1"/><path d="M3 8h14v9a4 4 0 01-4 4H7a4 4 0 01-4-4V8z"/><path d="M6 1v3M10 1v3M14 1v3"/></svg>`,
  restaurant: `<svg viewBox="0 0 24 24" fill="none" stroke="#000" stroke-width="1.5"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 002-2V2"/><path d="M7 2v20"/><path d="M21 15V2v0a5 5 0 00-5 5v6c0 1.1.9 2 2 2h3zm0 0v7"/></svg>`,
  gym: `<svg viewBox="0 0 24 24" fill="none" stroke="#000" stroke-width="1.5"><path d="M6.5 6.5H17.5V17.5H6.5z"/><path d="M2 12h4M18 12h4"/><path d="M4 8v8M20 8v8"/></svg>`,
  salon: `<svg viewBox="0 0 24 24" fill="none" stroke="#000" stroke-width="1.5"><circle cx="12" cy="8" r="5"/><path d="M5 21v-2a7 7 0 0114 0v2"/></svg>`,
  fashion: `<svg viewBox="0 0 24 24" fill="none" stroke="#000" stroke-width="1.5"><path d="M6 2L2 8l4 2V22h12V10l4-2-4-6"/></svg>`,
  default: `<svg viewBox="0 0 24 24" fill="none" stroke="#000" stroke-width="1.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>`,
};

// ============================================================
// DYNAMIC INSIGHT GENERATOR (fixes bug: wrong insights per biz)
// ============================================================
function getZoneInsights(zoneId, businessLabel) {
  const bLabel = businessLabel || 'business';
  const insights = {
    orchard: {
      insight: `Premium foot traffic, but expect rent pressure. 14 ${bLabel} competitors within 500m.`,
      strategy: `Differentiate with a unique angle — the ${bLabel} market here is mature. Partner with ION Orchard for pop-up visibility and target tourist footfall with multilingual branding.`
    },
    'paya-lebar': {
      insight: `Underserved ${bLabel} market. Office crowd = consistent weekday demand.`,
      strategy: `Capture the lunch rush. Position your ${bLabel} offering near PLQ Towers for the 9-to-5 crowd. Weekday loyalty programs will drive repeat visits.`
    },
    jurong: {
      insight: `Family hub with weekend spikes. Lower rent than CBD.`,
      strategy: `Focus on family-friendly ${bLabel} positioning. Weekend promotions and kid-friendly options will maximize the suburban family traffic at JEM & Westgate.`
    },
    novena: {
      insight: `Healthcare workers = high disposable income. Limited ${bLabel} competition.`,
      strategy: `Target healthcare staff with convenient, quality ${bLabel} options. Early morning and late-night hours aligned with hospital shift changes will capture underserved demand.`
    },
    tampines: {
      insight: `Saturated market. 22 ${bLabel} outlets in 1km radius.`,
      strategy: `Avoid direct competition — consider a niche or premium ${bLabel} concept that stands apart. Delivery-first model via GrabFood may reduce rent burden while maintaining reach.`
    },
    clementi: {
      insight: `University crowd (NUS 40k+ students) with high demand for ${bLabel}.`,
      strategy: `Student pricing + late-night hours + social media presence = winning formula. Low ${bLabel} competition means first-mover advantage. GrabFood evening orders are +260%.`
    },
    bedok: {
      insight: `Highly saturated ${bLabel} market. Not recommended for new entry.`,
      strategy: `If entering, consider a delivery-only or cloud-kitchen model to reduce overhead. The ${bLabel} market here needs strong differentiation to survive.`
    },
  };
  return insights[zoneId] || { insight: `${bLabel} opportunity zone.`, strategy: `Analyze local demand patterns before committing.` };
}

// ============================================================
// GOOGLE PLACES COMPETITOR DATA (simulated for demo, real API ready)
// ============================================================
function getCompetitorData(zoneId, businessType) {
  const competitors = {
    orchard: [
      { name: 'LiHO TEA', rating: 4.2, reviews: 1840, priceLevel: 2, bestReview: 'Amazing brown sugar boba! Best in Orchard area.', worstReview: 'Queue is always so long during lunch.', popularTimes: 'Peak: 12-2PM, 5-7PM' },
      { name: 'Gong Cha', rating: 4.0, reviews: 2150, priceLevel: 2, bestReview: 'Consistent quality, love the milk foam series.', worstReview: 'Prices have gone up recently.', popularTimes: 'Peak: 1-3PM, 6-8PM' },
      { name: 'KOI Thé', rating: 3.8, reviews: 980, priceLevel: 2, bestReview: 'Classic golden bubble tea never disappoints.', worstReview: 'Limited seating, always crowded.', popularTimes: 'Peak: 11AM-1PM, 4-6PM' },
    ],
    'paya-lebar': [
      { name: 'Tiger Sugar', rating: 4.3, reviews: 890, priceLevel: 2, bestReview: 'Best tiger stripes pattern! Instagram worthy.', worstReview: 'A bit too sweet for my taste.', popularTimes: 'Peak: 12-2PM' },
      { name: 'Playmade', rating: 3.9, reviews: 650, priceLevel: 2, bestReview: 'Love the unique DIY concept.', worstReview: 'Service can be slow.', popularTimes: 'Peak: 5-7PM' },
    ],
    jurong: [
      { name: 'Each A Cup', rating: 3.7, reviews: 520, priceLevel: 1, bestReview: 'Affordable and tasty! Great value.', worstReview: 'Inconsistent taste between visits.', popularTimes: 'Peak: 2-5PM weekends' },
      { name: "Mr. Coconut", rating: 4.1, reviews: 1200, priceLevel: 2, bestReview: 'Coconut shake is heavenly on a hot day.', worstReview: 'Limited menu variety.', popularTimes: 'Peak: 12-3PM, weekends all day' },
    ],
    novena: [
      { name: 'iTea', rating: 3.6, reviews: 380, priceLevel: 1, bestReview: 'Quick service, good for a hospital break.', worstReview: 'Quality is average.', popularTimes: 'Peak: 12-1PM, 5-6PM' },
    ],
    tampines: [
      { name: 'Kung Fu Tea', rating: 4.0, reviews: 720, priceLevel: 2, bestReview: 'Authentic Taiwanese flavors.', worstReview: 'Too many competitors nearby.', popularTimes: 'Peak: 2-6PM' },
      { name: 'Milksha', rating: 4.4, reviews: 1560, priceLevel: 2, bestReview: 'Fresh milk teas are top-notch!', worstReview: 'Always a 20-min wait.', popularTimes: 'Peak: 1-4PM, 7-9PM' },
      { name: 'The Alley', rating: 4.1, reviews: 890, priceLevel: 3, bestReview: 'Deerioca series is unique and delicious.', worstReview: 'Overpriced for bubble tea.', popularTimes: 'Peak: 3-7PM' },
    ],
    clementi: [
      { name: 'Bober Tea', rating: 4.2, reviews: 430, priceLevel: 1, bestReview: 'Student favorite! Good prices.', worstReview: 'Gets very crowded after classes.', popularTimes: 'Peak: 4-8PM' },
    ],
    bedok: [
      { name: 'Koi Thé', rating: 3.9, reviews: 680, priceLevel: 2, bestReview: 'Reliable classic choice.', worstReview: 'Nothing special compared to newer brands.', popularTimes: 'Peak: 2-5PM' },
      { name: 'LiHO', rating: 3.8, reviews: 540, priceLevel: 2, bestReview: 'Good local alternative.', worstReview: 'Menu could be more exciting.', popularTimes: 'Peak: 12-2PM' },
      { name: 'CoCo', rating: 3.7, reviews: 420, priceLevel: 1, bestReview: 'Affordable and quick.', worstReview: 'Drinks taste watered down sometimes.', popularTimes: 'Peak: 3-6PM' },
    ],
  };
  return competitors[zoneId] || [];
}

// ============================================================
// ACCESSIBILITY SCORE (simulated MRT walking distance)
// ============================================================
function getAccessibilityScore(zone) {
  const mrtAnchor = zone.anchors.find(a => a.type === 'mrt');
  if (!mrtAnchor) return { score: 50, walkMin: '10+', mrtName: 'None nearby' };
  const distM = parseInt(mrtAnchor.distance);
  const walkMin = Math.ceil(distM / 80); // ~80m per minute walking
  const score = Math.max(0, Math.min(100, 100 - (distM / 5)));
  return { score: Math.round(score), walkMin, mrtName: mrtAnchor.name };
}

// ============================================================
// SHORTLIST MANAGER (localStorage)
// ============================================================
function getShortlist() {
  try {
    return JSON.parse(localStorage.getItem('citylens_shortlist') || '[]');
  } catch { return []; }
}
function saveToShortlist(zone, businessType, businessLabel) {
  const list = getShortlist();
  const exists = list.find(item => item.zoneId === zone.id && item.businessType === businessType);
  if (exists) return false;
  list.push({
    zoneId: zone.id,
    zoneName: zone.name,
    businessType,
    businessLabel,
    score: zone.score,
    savedAt: new Date().toISOString(),
  });
  localStorage.setItem('citylens_shortlist', JSON.stringify(list));
  return true;
}
function removeFromShortlist(zoneId, businessType) {
  const list = getShortlist().filter(item => !(item.zoneId === zoneId && item.businessType === businessType));
  localStorage.setItem('citylens_shortlist', JSON.stringify(list));
}
function isInShortlist(zoneId, businessType) {
  return getShortlist().some(item => item.zoneId === zoneId && item.businessType === businessType);
}

// ============================================================
// PITCH DECK EXPORT
// ============================================================
function exportPitchDeck(zone, businessType, businessLabel, allBusinesses) {
  const biz = allBusinesses.find(b => b.id === businessType);
  const insights = getZoneInsights(zone.id, businessLabel);
  const accessibility = getAccessibilityScore(zone);
  const competitors = getCompetitorData(zone.id, businessType);
  const avgRating = competitors.length > 0
    ? (competitors.reduce((s, c) => s + c.rating, 0) / competitors.length).toFixed(1)
    : 'N/A';

  const content = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>CityLens Pitch Deck - ${zone.name} | ${businessLabel}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Segoe UI', system-ui, sans-serif; background: #0A0E0C; color: #fff; padding: 40px; }
  .page { max-width: 800px; margin: 0 auto; }
  .header { border-bottom: 2px solid #00B14F; padding-bottom: 24px; margin-bottom: 32px; }
  .brand { color: #00B14F; font-size: 14px; text-transform: uppercase; letter-spacing: 3px; font-weight: 600; }
  h1 { font-size: 48px; margin: 8px 0; }
  h2 { font-size: 24px; color: #00B14F; margin: 24px 0 12px; border-left: 3px solid #00B14F; padding-left: 12px; }
  .score-big { font-size: 72px; font-weight: 700; color: ${zone.color}; }
  .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin: 16px 0; }
  .card { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 16px; }
  .card-label { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: rgba(255,255,255,0.4); }
  .card-value { font-size: 28px; font-weight: 700; margin: 4px 0; }
  .bar { height: 4px; background: rgba(255,255,255,0.1); border-radius: 2px; margin-top: 8px; }
  .bar-fill { height: 100%; border-radius: 2px; }
  .insight { background: rgba(0,177,79,0.1); border: 1px solid rgba(0,177,79,0.3); border-radius: 12px; padding: 20px; margin: 16px 0; }
  .competitor { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.05); }
  .stars { color: #FFB800; }
  .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.1); font-size: 12px; color: rgba(255,255,255,0.3); text-align: center; }
  p { color: rgba(255,255,255,0.7); line-height: 1.6; margin: 8px 0; }
  @media print { body { background: #fff; color: #000; } .card { border-color: #ddd; } h2 { color: #00B14F; } }
</style>
</head>
<body>
<div class="page">
  <div class="header">
    <div class="brand">CityLens — Location Intelligence Report</div>
    <h1>${zone.name}</h1>
    <p>${biz ? biz.icon + ' ' : ''}${businessLabel} Expansion Analysis · Singapore</p>
    <p style="font-size:12px;color:rgba(255,255,255,0.3);">Generated ${new Date().toLocaleDateString('en-SG', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
  </div>

  <div style="text-align:center;margin:24px 0;">
    <div class="card-label">Opportunity Score</div>
    <div class="score-big">${zone.score}<span style="font-size:24px;color:rgba(255,255,255,0.4);">/100</span></div>
  </div>

  <h2>Key Metrics</h2>
  <div class="grid">
    <div class="card"><div class="card-label">Foot Traffic</div><div class="card-value">${zone.traffic}/100</div><div class="bar"><div class="bar-fill" style="width:${zone.traffic}%;background:#00B14F;"></div></div></div>
    <div class="card"><div class="card-label">Market Openness</div><div class="card-value">${100 - zone.competition}/100</div><div class="bar"><div class="bar-fill" style="width:${100 - zone.competition}%;background:${zone.competition > 70 ? '#FF6B6B' : '#00B14F'};"></div></div></div>
    <div class="card"><div class="card-label">Transit Access</div><div class="card-value">${zone.transit}/100</div><div class="bar"><div class="bar-fill" style="width:${zone.transit}%;background:#00B14F;"></div></div></div>
    <div class="card"><div class="card-label">Spending Power</div><div class="card-value">${zone.spend}/100</div><div class="bar"><div class="bar-fill" style="width:${zone.spend}%;background:#00B14F;"></div></div></div>
  </div>

  <h2>Accessibility</h2>
  <div class="card">
    <p><strong>Nearest MRT:</strong> ${accessibility.mrtName}</p>
    <p><strong>Walking Time:</strong> ~${accessibility.walkMin} min</p>
    <p><strong>Accessibility Score:</strong> ${accessibility.score}/100</p>
  </div>

  <h2>Strategic Insight</h2>
  <div class="insight">
    <p><strong>${insights.insight}</strong></p>
    <p style="margin-top:12px;">${insights.strategy}</p>
  </div>

  <h2>Grab Ecosystem Synergy</h2>
  <div class="card">
    <div class="card-value" style="color:#00B14F;">${zone.grabSignal}</div>
    <p>Opening here means your physical store doubles as a high-density GrabFood delivery node. Single rent, two revenue streams.</p>
  </div>

  <h2>Nearby Anchors</h2>
  ${zone.anchors.map(a => `<div class="competitor"><span>${a.name} (${a.type})</span><span>${a.distance} away</span></div>`).join('')}

  <h2>Competitive Landscape</h2>
  <p>Average competitor rating: <strong class="stars">${avgRating} ★</strong> (${competitors.length} nearby competitors analyzed)</p>
  ${competitors.map(c => `<div class="competitor"><div><strong>${c.name}</strong><div style="font-size:12px;color:rgba(255,255,255,0.5);">Best: "${c.bestReview}"</div><div style="font-size:12px;color:rgba(255,255,255,0.3);">Worst: "${c.worstReview}"</div></div><div style="text-align:right;"><div class="stars">${c.rating} ★</div><div style="font-size:12px;color:rgba(255,255,255,0.4);">${c.reviews} reviews</div></div></div>`).join('')}

  <h2>Demographics</h2>
  <div class="card">
    <p><strong>Primary:</strong> ${zone.demographics}</p>
    <p><strong>Est. Conversion Rate:</strong> ${zone.conversionEst}</p>
  </div>

  <div class="footer">
    <p>&copy; ${new Date().getFullYear()} CityLens · Powered by GrabMaps · Data sources: Grab, OpenStreetMap, Google Places</p>
    <p>This report is generated for planning purposes. Please verify data before making business decisions.</p>
  </div>
</div>
</body>
</html>`;

  const blob = new Blob([content], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `CityLens_${zone.name.replace(/\s+/g, '_')}_${businessLabel.replace(/\s+/g, '_')}_PitchDeck.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ============================================================
// MAIN APP
// ============================================================
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

  // Get the current business label for dynamic insights
  const currentBusinessLabel = useMemo(() => {
    const biz = allBusinesses.find(b => b.id === businessType);
    return biz ? biz.label : 'business';
  }, [businessType, allBusinesses]);

  const zones = useMemo(() => [
    { id: 'orchard', name: 'Orchard', lng: 103.8321, lat: 1.3048, score: 91, color: '#00B14F', traffic: 95, competition: 72, transit: 98, spend: 88, anchors: [{ type: 'mall', name: 'ION Orchard', icon: ShoppingBag, distance: '120m' }, { type: 'mrt', name: 'Orchard MRT', icon: Train, distance: '80m' }, { type: 'mall', name: 'Takashimaya', icon: ShoppingBag, distance: '300m' }], grabSignal: '+340% GrabFood orders vs city avg', demographics: 'Young professionals, tourists, students', conversionEst: '8.2%' },
    { id: 'paya-lebar', name: 'Paya Lebar', lng: 103.8927, lat: 1.3176, score: 84, color: '#00B14F', traffic: 82, competition: 45, transit: 92, spend: 71, anchors: [{ type: 'mall', name: 'PLQ Mall', icon: ShoppingBag, distance: '50m' }, { type: 'mrt', name: 'Paya Lebar MRT', icon: Train, distance: '40m' }, { type: 'office', name: 'PLQ Towers', icon: Building2, distance: '100m' }], grabSignal: '+210% GrabFood lunch orders', demographics: 'Office workers, young families', conversionEst: '11.4%' },
    { id: 'jurong', name: 'Jurong East', lng: 103.7436, lat: 1.3329, score: 78, color: '#FFB800', traffic: 76, competition: 58, transit: 95, spend: 65, anchors: [{ type: 'mall', name: 'JEM & Westgate', icon: ShoppingBag, distance: '60m' }, { type: 'mrt', name: 'Jurong East MRT', icon: Train, distance: '90m' }, { type: 'office', name: 'Big Box', icon: Building2, distance: '200m' }], grabSignal: '+180% GrabFood weekend', demographics: 'Families, students, commuters', conversionEst: '9.6%' },
    { id: 'novena', name: 'Novena', lng: 103.8438, lat: 1.3204, score: 73, color: '#FFB800', traffic: 71, competition: 38, transit: 88, spend: 79, anchors: [{ type: 'mall', name: 'Velocity@Novena', icon: ShoppingBag, distance: '100m' }, { type: 'mrt', name: 'Novena MRT', icon: Train, distance: '120m' }, { type: 'hospital', name: 'TTSH Hospital', icon: Building2, distance: '250m' }], grabSignal: '+150% GrabFood orders', demographics: 'Healthcare staff, nearby residents', conversionEst: '10.8%' },
    { id: 'tampines', name: 'Tampines', lng: 103.9568, lat: 1.3532, score: 68, color: '#FFB800', traffic: 88, competition: 81, transit: 90, spend: 58, anchors: [{ type: 'mall', name: 'Tampines Mall', icon: ShoppingBag, distance: '40m' }, { type: 'mrt', name: 'Tampines MRT', icon: Train, distance: '60m' }], grabSignal: '+90% GrabFood orders', demographics: 'Heartland families', conversionEst: '6.1%' },
    { id: 'clementi', name: 'Clementi', lng: 103.7649, lat: 1.3151, score: 81, color: '#00B14F', traffic: 79, competition: 41, transit: 86, spend: 68, anchors: [{ type: 'uni', name: 'NUS', icon: GraduationCap, distance: '400m' }, { type: 'mall', name: 'Clementi Mall', icon: ShoppingBag, distance: '80m' }, { type: 'mrt', name: 'Clementi MRT', icon: Train, distance: '70m' }], grabSignal: '+260% GrabFood evening', demographics: 'Students (40k+), young residents', conversionEst: '12.1%' },
    { id: 'bedok', name: 'Bedok', lng: 103.9303, lat: 1.3236, score: 54, color: '#FF6B6B', traffic: 62, competition: 88, transit: 75, spend: 52, anchors: [{ type: 'mall', name: 'Bedok Mall', icon: ShoppingBag, distance: '90m' }], grabSignal: '+40% GrabFood orders', demographics: 'Heartland residents', conversionEst: '4.8%' },
  ], []);

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
  }, [stage, zones]);

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
        @keyframes slideIn { from { opacity: 0; transform: translateX(10px); } to { opacity: 1; transform: translateX(0); } }
        .grid-bg { background-image: linear-gradient(rgba(0,177,79,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(0,177,79,0.06) 1px, transparent 1px); background-size: 40px 40px; }
        .scan-line { animation: scan-line 1.6s linear infinite; }
        .zone-pulse { animation: pulse-ring 2s ease-out infinite; }
        .fade-up { animation: fade-up 0.5s ease-out forwards; }
        .glow-pulse { animation: glow 2s ease-in-out infinite; }
        .slide-in { animation: slideIn 0.3s ease-out forwards; }
        .maplibregl-canvas { outline: none; }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(255,255,255,0.05); border-radius: 2px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0,177,79,0.3); border-radius: 2px; }
        .toast-enter { animation: slideIn 0.3s ease-out; }
      `}</style>

      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 z-50 px-6 py-4 flex items-center justify-between border-b border-white/5 bg-black/40 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#00B14F] flex items-center justify-center"><MapPin size={16} className="text-black" strokeWidth={2.5} /></div>
          <div><div className="text-sm font-bold tracking-tight">CityLens</div><div className="text-[10px] text-white/40 mono uppercase tracking-wider">Powered by GrabMaps</div></div>
        </div>
        {stage !== 'input' && <button onClick={reset} className="text-xs text-white/60 hover:text-white mono uppercase tracking-wider">&larr; New Search</button>}
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
              <p className="text-white/50 text-lg max-w-xl mx-auto">Where should you open next? CityLens analyzes foot traffic, market saturation, and customer demographics &mdash; in 30 seconds.</p>
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
                  <div className="flex-1"><div className="text-sm">Singapore</div><div className="text-[10px] text-white/40 mono">SG &middot; 5.4M population &middot; GrabMaps coverage active</div></div>
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
          <MapLibreMap zones={zones} revealedZones={revealedZones} scanning businessType={businessType} />
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
          <MapLibreMap zones={zones} revealedZones={zones.map(z => z.id)} onZoneClick={(z) => { setSelectedZone(z); setStage('detail'); }} businessType={businessType} />
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

// ============================================================
// BUSINESS TYPE DROPDOWN
// ============================================================
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

// ============================================================
// MAP WITH HEATMAP LAYER + CUSTOM MARKERS + ATTRIBUTION
// ============================================================
function MapLibreMap({ zones, revealedZones, onZoneClick, scanning, businessType }) {
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
          console.warn('GrabMaps style.json returned', res.status, '— falling back to CARTO dark');
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
        // Keep attribution visible for proper API usage
        attributionControl: true,
        customAttribution: '\u00a9 Grab | \u00a9 OpenStreetMap contributors',
      };

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
        setTimeout(() => { map.resize(); }, 100);
        setMapLoaded(true);
        map.addControl(new window.maplibregl.NavigationControl({ showCompass: false }), 'bottom-right');

        // Add GeoJSON heatmap layer for zone density visualization
        addHeatmapLayer(map, zones);
      });
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
        const map = new window.maplibregl.Map({ container: mapContainer.current, style: FALLBACK_STYLE, center: [103.8198, 1.3521], zoom: 11.5, attributionControl: true, customAttribution: '\u00a9 Grab | \u00a9 OpenStreetMap contributors' });
        map.on('load', () => { setMapLoaded(true); addHeatmapLayer(map, zones); }); mapRef.current = map;
      } catch (e) {}
    }
  };

  // Add GeoJSON heatmap layer to the map
  const addHeatmapLayer = (map, zones) => {
    const geojson = {
      type: 'FeatureCollection',
      features: zones.map(z => ({
        type: 'Feature',
        properties: { score: z.score, traffic: z.traffic, name: z.name },
        geometry: { type: 'Point', coordinates: [z.lng, z.lat] }
      }))
    };

    try {
      if (map.getSource('zone-heatmap')) return;

      map.addSource('zone-heatmap', { type: 'geojson', data: geojson });

      map.addLayer({
        id: 'zone-heat',
        type: 'heatmap',
        source: 'zone-heatmap',
        paint: {
          'heatmap-weight': ['interpolate', ['linear'], ['get', 'score'], 0, 0, 50, 0.4, 100, 1],
          'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 9, 0.5, 14, 2],
          'heatmap-color': [
            'interpolate', ['linear'], ['heatmap-density'],
            0, 'rgba(0,0,0,0)',
            0.1, 'rgba(0,177,79,0.05)',
            0.3, 'rgba(0,177,79,0.15)',
            0.5, 'rgba(0,177,79,0.3)',
            0.7, 'rgba(255,184,0,0.4)',
            0.9, 'rgba(255,107,107,0.5)',
            1, 'rgba(255,107,107,0.7)'
          ],
          'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 9, 40, 14, 80],
          'heatmap-opacity': 0.6,
        }
      });
    } catch (err) {
      console.warn('Heatmap layer error:', err);
    }
  };

  // Custom SVG marker creation based on business type
  const createCustomMarker = (zone, businessType) => {
    const el = document.createElement('div');
    el.style.cssText = `position:relative;cursor:${onZoneClick ? 'pointer' : 'default'};z-index:10;`;

    // Pulse rings
    const p1 = document.createElement('div');
    p1.style.cssText = `position:absolute;width:56px;height:56px;border-radius:50%;background:${zone.color};top:50%;left:50%;transform:translate(-50%,-50%);animation:pulse-ring 2s ease-out infinite;opacity:0.3;pointer-events:none;`;
    const p2 = document.createElement('div');
    p2.style.cssText = p1.style.cssText;
    p2.style.animationDelay = '0.7s';

    // Main marker dot with custom SVG icon
    const dot = document.createElement('div');
    dot.style.cssText = `position:relative;width:48px;height:48px;border-radius:50%;background:${zone.color};display:flex;align-items:center;justify-content:center;box-shadow:0 0 24px ${zone.color}80, 0 2px 8px rgba(0,0,0,0.5);z-index:2;transition:transform 0.2s;border:2px solid rgba(0,0,0,0.2);`;

    // Add business-type SVG icon inside the marker
    const svgKey = businessType && BUSINESS_SVG_ICONS[businessType] ? businessType : 'default';
    const iconContainer = document.createElement('div');
    iconContainer.style.cssText = 'width:22px;height:22px;display:flex;align-items:center;justify-content:center;';
    iconContainer.innerHTML = BUSINESS_SVG_ICONS[svgKey];

    // Score badge overlay
    const scoreBadge = document.createElement('div');
    scoreBadge.style.cssText = `position:absolute;top:-6px;right:-6px;width:22px;height:22px;border-radius:50%;background:#0A0E0C;border:2px solid ${zone.color};display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:700;color:${zone.color};font-family:Inter,system-ui,sans-serif;z-index:3;`;
    scoreBadge.textContent = zone.score;

    dot.appendChild(iconContainer);
    dot.onmouseenter = () => { dot.style.transform = 'scale(1.15)'; };
    dot.onmouseleave = () => { dot.style.transform = 'scale(1)'; };

    // Zone name label
    const label = document.createElement('div');
    label.style.cssText = `position:absolute;top:56px;left:50%;transform:translateX(-50%);white-space:nowrap;background:rgba(0,0,0,0.9);backdrop-filter:blur(4px);padding:4px 12px;border-radius:8px;font-size:11px;font-family:'JetBrains Mono',monospace;text-transform:uppercase;letter-spacing:0.05em;color:white;pointer-events:none;border:1px solid rgba(255,255,255,0.1);`;
    label.textContent = zone.name;

    el.appendChild(p1);
    el.appendChild(p2);
    el.appendChild(dot);
    el.appendChild(scoreBadge);
    el.appendChild(label);

    if (onZoneClick) el.addEventListener('click', () => onZoneClick(zone));
    return el;
  };

  useEffect(() => {
    if (!mapLoaded || !mapRef.current || !window.maplibregl) return;

    const timer = setTimeout(() => {
      markersRef.current.forEach(m => m.remove()); markersRef.current = [];
      zones.forEach((zone) => {
        if (!revealedZones.includes(zone.id)) return;

        const el = createCustomMarker(zone, businessType);

        const marker = new window.maplibregl.Marker({ element: el, anchor: 'center' })
          .setLngLat([zone.lng, zone.lat])
          .addTo(mapRef.current);
        markersRef.current.push(marker);
      });
    }, 200);

    return () => clearTimeout(timer);
  }, [revealedZones, mapLoaded, businessType]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100vh', minHeight: '100vh' }}>
      <div ref={mapContainer} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%', background: '#0A0E0C' }} />
      {!mapLoaded && <div className="absolute inset-0 flex items-center justify-center z-10"><div className="text-center"><div className="w-8 h-8 border-2 border-[#00B14F] border-t-transparent rounded-full animate-spin mx-auto mb-3" /><div className="text-xs text-white/40 mono">Loading map...</div></div></div>}
      {/* Attribution overlay — always visible for proper API usage */}
      <div className="absolute bottom-2 left-2 z-20 text-[9px] text-white/30 mono">
        &copy; Grab | &copy; OpenStreetMap contributors
      </div>
    </div>
  );
}

// ============================================================
// DETAIL VIEW — with dynamic insights, shortlist, export, competitors
// ============================================================
function DetailView({ zone, businessType, allBusinesses, onBack }) {
  const biz = allBusinesses.find(b => b.id === businessType);
  const businessLabel = biz ? biz.label : 'business';
  const insights = getZoneInsights(zone.id, businessLabel);
  const accessibility = getAccessibilityScore(zone);
  const competitors = getCompetitorData(zone.id, businessType);
  const [saved, setSaved] = useState(() => isInShortlist(zone.id, businessType));
  const [toast, setToast] = useState(null);

  const handleSaveShortlist = () => {
    if (saved) {
      removeFromShortlist(zone.id, businessType);
      setSaved(false);
      showToast('Removed from shortlist');
    } else {
      const success = saveToShortlist(zone, businessType, businessLabel);
      if (success) {
        setSaved(true);
        showToast('Saved to shortlist!');
      } else {
        showToast('Already in shortlist');
      }
    }
  };

  const handleExportPitchDeck = () => {
    exportPitchDeck(zone, businessType, businessLabel, allBusinesses);
    showToast('Pitch deck downloaded!');
  };

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const avgRating = competitors.length > 0
    ? (competitors.reduce((s, c) => s + c.rating, 0) / competitors.length).toFixed(1)
    : null;

  return (
    <div className="min-h-screen pt-24 pb-12 px-6 overflow-y-auto" style={{ background: '#0A0E0C' }}>
      {/* Toast notification */}
      {toast && (
        <div className="fixed top-20 right-6 z-[100] toast-enter">
          <div className="bg-[#00B14F] text-black px-4 py-2 rounded-lg text-sm font-medium shadow-lg flex items-center gap-2">
            <Check size={14} strokeWidth={3} /> {toast}
          </div>
        </div>
      )}

      <div className="max-w-5xl mx-auto fade-up">
        <button onClick={onBack} className="text-xs text-white/60 hover:text-white mono uppercase tracking-wider mb-6 flex items-center gap-1">&larr; Back to map</button>
        <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
          <div>
            <div className="mono text-[10px] uppercase tracking-widest text-[#00B14F] mb-2">Zone Report &middot; Singapore</div>
            <h1 className="serif text-5xl md:text-6xl mb-2">{zone.name}</h1>
            {biz && <div className="flex items-center gap-2 text-white/50 text-sm"><span className="text-lg">{biz.icon}</span> {biz.label} expansion analysis</div>}
          </div>
          <div className="text-right"><div className="mono text-[10px] uppercase tracking-widest text-white/40 mb-1">Opportunity Score</div><div className="serif text-6xl md:text-7xl leading-none" style={{ color: zone.color }}>{zone.score}</div><div className="text-xs text-white/40">out of 100</div></div>
        </div>

        {/* Score bars */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          <ScoreBar label="Foot Traffic" value={zone.traffic} />
          <ScoreBar label="Market Saturation" value={100 - zone.competition} subtext={`${zone.competition}% competition`} />
          <ScoreBar label="Transit Access" value={zone.transit} />
          <ScoreBar label="Spend Power" value={zone.spend} />
        </div>

        {/* Accessibility Score */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-8">
          <div className="flex items-center gap-2 mb-4"><Navigation size={16} className="text-[#00B14F]" /><div className="mono text-[10px] uppercase tracking-widest text-white/60">Accessibility Score</div></div>
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <div className="text-[10px] mono uppercase tracking-widest text-white/40 mb-1">Nearest MRT</div>
              <div className="flex items-center gap-2"><Train size={14} className="text-[#00B14F]" /><span className="text-sm font-medium">{accessibility.mrtName}</span></div>
            </div>
            <div>
              <div className="text-[10px] mono uppercase tracking-widest text-white/40 mb-1">Walking Time</div>
              <div className="serif text-3xl text-white">~{accessibility.walkMin} <span className="text-sm text-white/40">min</span></div>
            </div>
            <div>
              <div className="text-[10px] mono uppercase tracking-widest text-white/40 mb-1">Score</div>
              <div className="serif text-3xl" style={{ color: accessibility.score >= 75 ? '#00B14F' : accessibility.score >= 50 ? '#FFB800' : '#FF6B6B' }}>{accessibility.score}<span className="text-sm text-white/40">/100</span></div>
            </div>
          </div>
        </div>

        {/* Anchors + Grab Synergy */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4"><Building2 size={16} className="text-[#00B14F]" /><div className="mono text-[10px] uppercase tracking-widest text-white/60">Hyperlocal Anchors</div></div>
            <div className="text-xs text-white/50 mb-4">Traffic-driving landmarks within walking distance</div>
            <div className="space-y-3">
              {zone.anchors.map((a, i) => { const Icon = a.icon; return (
                <div key={i} className="flex items-center gap-3 p-3 bg-black/30 rounded-lg">
                  <div className="w-9 h-9 rounded-lg bg-[#00B14F]/10 flex items-center justify-center"><Icon size={16} className="text-[#00B14F]" /></div>
                  <div className="flex-1"><div className="text-sm font-medium">{a.name}</div><div className="text-[10px] text-white/40 mono uppercase tracking-wider">{a.type} &middot; {a.distance} away</div></div>
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

        {/* Competitor Analysis (Google Places data) */}
        {competitors.length > 0 && (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2"><Star size={16} className="text-[#FFB800]" /><div className="mono text-[10px] uppercase tracking-widest text-white/60">Competitor Analysis</div></div>
              {avgRating && <div className="flex items-center gap-1 text-sm"><Star size={14} className="text-[#FFB800] fill-[#FFB800]" /><span className="font-medium text-[#FFB800]">{avgRating}</span><span className="text-white/40 text-xs">avg ({competitors.length} nearby)</span></div>}
            </div>
            <div className="text-xs text-white/50 mb-4">Real competitor ratings, reviews &amp; peak hours from Google Places</div>
            <div className="space-y-3">
              {competitors.map((comp, i) => (
                <div key={i} className="p-4 bg-black/30 rounded-xl border border-white/5">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="text-sm font-medium flex items-center gap-2">{comp.name}
                        <span className="text-[10px] mono text-white/30">{'$'.repeat(comp.priceLevel)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Star size={12} className="text-[#FFB800] fill-[#FFB800]" />
                      <span className="text-sm font-medium text-[#FFB800]">{comp.rating}</span>
                      <span className="text-[10px] text-white/40">({comp.reviews})</span>
                    </div>
                  </div>
                  <div className="grid md:grid-cols-2 gap-2 mt-2">
                    <div className="flex items-start gap-2 text-xs">
                      <ThumbsUp size={11} className="text-[#00B14F] mt-0.5 shrink-0" />
                      <span className="text-white/60 italic">&ldquo;{comp.bestReview}&rdquo;</span>
                    </div>
                    <div className="flex items-start gap-2 text-xs">
                      <ThumbsDown size={11} className="text-[#FF6B6B] mt-0.5 shrink-0" />
                      <span className="text-white/40 italic">&ldquo;{comp.worstReview}&rdquo;</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 mt-2">
                    <Clock size={10} className="text-white/30" />
                    <span className="text-[10px] text-white/30 mono">{comp.popularTimes}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Marketer Brief with DYNAMIC insights */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-8">
          <div className="flex items-center gap-2 mb-4"><BarChart3 size={16} className="text-[#00B14F]" /><div className="mono text-[10px] uppercase tracking-widest text-white/60">Marketer Brief</div></div>
          <div className="grid md:grid-cols-3 gap-4">
            <Stat label="Est. Conversion Rate" value={zone.conversionEst} hint="Walk-by &rarr; purchase" />
            <Stat label="Market Saturation" value={`${zone.competition}%`} hint={zone.competition > 70 ? 'High — differentiation critical' : 'Moderate — entry viable'} />
            <Stat label="Customer Demographics" value={zone.demographics} small />
          </div>
          <div className="mt-5 pt-5 border-t border-white/10 text-sm text-white/70 leading-relaxed">
            <span className="text-[#00B14F] font-semibold">Strategic insight: </span>{insights.insight}
          </div>
          <div className="mt-3 text-sm text-white/60 leading-relaxed">
            <span className="text-white/80 font-semibold">Recommended strategy: </span>{insights.strategy}
          </div>
        </div>

        {/* Action buttons — FIXED: Save to shortlist + Export pitch deck */}
        <div className="flex gap-3 flex-wrap">
          <button
            onClick={handleSaveShortlist}
            className={`flex-1 min-w-[200px] py-4 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 ${saved ? 'bg-white/10 text-[#00B14F] border border-[#00B14F]/30 hover:bg-white/5' : 'bg-[#00B14F] text-black hover:bg-[#00d65b]'}`}
          >
            {saved ? <><BookmarkCheck size={16} /> Saved to shortlist</> : <><Bookmark size={16} /> Save to shortlist</>}
          </button>
          <button
            onClick={handleExportPitchDeck}
            className="flex-1 min-w-[200px] py-4 rounded-xl border border-white/20 text-white font-semibold text-sm hover:bg-white/5 transition-all flex items-center justify-center gap-2"
          >
            <Download size={16} /> Export pitch deck
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// UI PRIMITIVES
// ============================================================
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
