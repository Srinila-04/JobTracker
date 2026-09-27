import { useMemo, useState } from 'react';
import { Activity, ChevronDown } from 'lucide-react';

export default function ApplicationTrend({ applications }) {
  const [timeRange, setTimeRange] = useState('7');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [hoveredPoint, setHoveredPoint] = useState(null); 

  const trendData = useMemo(() => {
    const daysCount = parseInt(timeRange);
    const days = [];
    
    for (let i = daysCount - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);
      
      const label = daysCount === 7 
        ? d.toLocaleDateString('en-US', { weekday: 'short' }) 
        : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        
      days.push({ date: d, label: label, count: 0 });
    }

    if (applications) {
      applications.forEach(app => {
        const appDate = new Date(app.applied_at);
        appDate.setHours(0, 0, 0, 0);
        
        const dayMatch = days.find(d => d.date.getTime() === appDate.getTime());
        if (dayMatch) dayMatch.count++;
      });
    }

    return days;
  }, [applications, timeRange]);

  const maxCount = Math.max(...trendData.map(d => d.count), 5); 
  const totalRecent = trendData.reduce((sum, d) => sum + d.count, 0);

  // SVG Configuration
  const padding = { top: 60, right: 30, bottom: 40, left: 50 };
  const width = 1000;
  const height = 400;
  const graphWidth = width - padding.left - padding.right;
  const graphHeight = height - padding.top - padding.bottom;

  // Calculates both SVG coordinates and Percentage coordinates for flawless mobile scaling
  const points = trendData.map((day, index) => {
    const x = padding.left + (index / (trendData.length - 1 || 1)) * graphWidth;
    const y = padding.top + graphHeight - ((day.count / maxCount) * graphHeight);
    const xPct = (x / width) * 100;
    const yPct = (y / height) * 100;
    return { x, y, xPct, yPct, day };
  });

  const createSmoothPath = (pts) => {
    if (pts.length === 0) return '';
    if (pts.length === 1) return `M ${pts[0].x},${pts[0].y}`;
    
    let d = `M ${pts[0].x},${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = i === 0 ? pts[0] : pts[i - 1];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = i + 2 < pts.length ? pts[i + 2] : p2;

      const tension = 0.25;
      const cp1x = p1.x + (p2.x - p0.x) * tension;
      const cp1y = p1.y + (p2.y - p0.y) * tension;
      const cp2x = p2.x - (p3.x - p1.x) * tension;
      const cp2y = p2.y - (p3.y - p1.y) * tension;

      d += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`;
    }
    return d;
  };

  const pathD = createSmoothPath(points);

  const halfPoint = Math.floor(trendData.length / 2);
  const firstHalf = trendData.slice(0, halfPoint).reduce((sum, d) => sum + d.count, 0);
  const secondHalf = trendData.slice(halfPoint).reduce((sum, d) => sum + d.count, 0);
  
  let percentageStr = "0%";
  if (firstHalf === 0 && secondHalf > 0) percentageStr = "+100%";
  else if (firstHalf > 0) {
    const diff = ((secondHalf - firstHalf) / firstHalf) * 100;
    percentageStr = diff > 0 ? `+${Math.round(diff)}%` : `${Math.round(diff)}%`;
  }

  return (
    <div className="w-full p-4 sm:p-10 mb-8 transition-all duration-300 shadow-2xl bg-[#0b1121] border border-slate-800 rounded-3xl">
      
      {/* Header & Custom Dropdown */}
      <div className="flex flex-col items-start justify-between mb-8 sm:flex-row sm:items-center gap-4">
        <h2 className="flex items-center gap-2 text-2xl font-black text-white tracking-tight">
          <Activity className="text-orange-400" />
          Growth Trend
        </h2>

        <div className="relative w-full sm:w-auto z-50">
          <button 
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center justify-between w-full sm:w-48 px-5 py-2.5 font-bold text-white transition-all border outline-none cursor-pointer bg-slate-800/80 border-slate-700 rounded-xl hover:border-orange-500 shadow-sm"
          >
            <span className="truncate pr-4">{timeRange === '7' ? 'Last 7 Days' : 'Last 30 Days'}</span>
            <ChevronDown className={`text-slate-400 transition-transform duration-300 shrink-0 ${isDropdownOpen ? 'rotate-180' : ''}`} size={18} />
          </button>

          {isDropdownOpen && <div className="fixed inset-0 z-30" onClick={() => setIsDropdownOpen(false)}></div>}

          {isDropdownOpen && (
            <div className="absolute right-0 z-50 w-full sm:w-48 mt-2 overflow-hidden border shadow-2xl bg-[#0b1121] border-slate-700 rounded-xl animate-fade-in-up">
              <div onClick={() => { setTimeRange('7'); setIsDropdownOpen(false); }} className={`px-4 py-3 cursor-pointer transition-colors text-sm hover:bg-slate-800 ${timeRange === '7' ? 'bg-orange-500/10 text-orange-400 font-bold border-l-4 border-orange-500' : 'text-slate-300 border-l-4 border-transparent'}`}>Last 7 Days</div>
              <div onClick={() => { setTimeRange('30'); setIsDropdownOpen(false); }} className={`px-4 py-3 cursor-pointer transition-colors text-sm hover:bg-slate-800 ${timeRange === '30' ? 'bg-orange-500/10 text-orange-400 font-bold border-l-4 border-orange-500' : 'text-slate-300 border-l-4 border-transparent'}`}>Last 30 Days</div>
            </div>
          )}
        </div>
      </div>

      {/* GRAPH AREA - Fully Responsive */}
      <div 
        className="relative w-full h-[280px] sm:h-[400px] rounded-2xl bg-[#0b1121] select-none"
        onMouseLeave={() => setHoveredPoint(null)} 
      >
        
        {/* The Centered Floating Badge */}
        <div className="absolute top-[15%] sm:top-[20%] left-1/2 transform -translate-x-1/2 z-10 opacity-0 pointer-events-none" style={{animation: 'fadeInObj 1s forwards 0.5s'}}>
          <div className="animate-float-slow">
            <div className="relative bg-[#f8fafc] px-4 py-3 sm:px-6 sm:py-4 rounded-2xl shadow-[0_15px_35px_rgba(249,115,22,0.15)] border border-slate-200 text-center">
              <p className="text-[10px] sm:text-xs font-bold text-black mt-0.5 uppercase tracking-wide">Application Growth</p>
            </div>
          </div>
        </div>

        {/* 1. RESPONSIVE HTML OVERLAYS (Labels, Tooltips, Dots) */}
        
        {/* Y-Axis Labels */}
        {[0, 0.5, 1].map((ratio, i) => {
          const yPct = ((padding.top + graphHeight - (ratio * graphHeight)) / height) * 100;
          const value = Math.round(maxCount * ratio);
          return (
            <div key={`y-${i}`} className="absolute text-slate-500 font-semibold text-xs sm:text-sm -translate-y-1/2" style={{ top: `${yPct}%`, left: '0px' }}>
              {value}
            </div>
          );
        })}

        {/* X-Axis Labels */}
        {points.map((p, i) => {
          const showLabel = timeRange === '7' || i % Math.ceil(points.length / 5) === 0 || i === points.length - 1;
          return showLabel && (
            <div key={`x-${i}`} className={`absolute text-[10px] sm:text-sm -translate-x-1/2 ${i === points.length - 1 ? 'text-orange-400 font-bold' : 'text-slate-500 font-medium'}`} style={{ left: `${p.xPct}%`, bottom: '0px' }}>
              {p.day.label}
            </div>
          );
        })}

        {/* The End Glowing Dot */}
        {points.length > 0 && (() => {
          const lastPoint = points[points.length - 1];
          return (
            <div className="absolute flex items-center justify-center transform -translate-x-1/2 -translate-y-1/2 animate-fade-in-dot z-10 pointer-events-none" style={{ left: `${lastPoint.xPct}%`, top: `${lastPoint.yPct}%`, animationDelay: '1.2s' }}>
              <div className="absolute w-8 h-8 sm:w-12 sm:h-12 rounded-full bg-orange-400/20 blur-sm"></div>
              <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-orange-500 border-2 border-white shadow-[0_0_15px_rgba(249,115,22,1)]"></div>
            </div>
          );
        })()}

        {/* INVISIBLE HOVER ZONES */}
        {points.map((p, index) => (
          <div 
            key={`hitbox-${index}`}
            className="absolute top-0 h-full w-[10%] -translate-x-1/2 z-30 cursor-crosshair"
            style={{ left: `${p.xPct}%` }}
            onMouseEnter={() => setHoveredPoint(p)}
            onClick={() => setHoveredPoint(p)} 
          ></div>
        ))}

        {/* DYNAMIC HOVER TOOLTIP & CROSSHAIR */}
        {hoveredPoint && (
          <>
            <div className="absolute z-20 w-[1px] bg-gradient-to-b from-orange-500/50 to-transparent pointer-events-none transform -translate-x-1/2" style={{ left: `${hoveredPoint.xPct}%`, top: `${hoveredPoint.yPct}%`, height: `${100 - hoveredPoint.yPct}%` }}></div>
            <div className="absolute z-30 w-3 h-3 sm:w-4 sm:h-4 bg-orange-400 rounded-full border-2 border-[#0b1121] shadow-[0_0_15px_rgba(249,115,22,1)] pointer-events-none transform -translate-x-1/2 -translate-y-1/2" style={{ left: `${hoveredPoint.xPct}%`, top: `${hoveredPoint.yPct}%` }}></div>
            <div className="absolute z-40 transform -translate-x-1/2 -translate-y-[130%] pointer-events-none" style={{ left: `${hoveredPoint.xPct}%`, top: `${hoveredPoint.yPct}%` }}>
              <div className="bg-slate-800/95 backdrop-blur-md text-white px-3 py-2 sm:px-4 sm:py-3 rounded-2xl shadow-2xl border border-slate-700 whitespace-nowrap">
                <p className="text-xl sm:text-2xl font-black leading-none">{hoveredPoint.day.count} <span className="text-xs sm:text-sm font-semibold text-slate-400">Apps</span></p>
                <p className="text-[10px] sm:text-xs font-bold text-orange-400 mt-1">{hoveredPoint.day.label}</p>
              </div>
              <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-slate-800/95 absolute left-1/2 -translate-x-1/2"></div>
            </div>
          </>
        )}

        {/* 2. THE SVG GRAPH (Stretches perfectly without distorting HTML overlays) */}
        <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" className="absolute inset-0 w-full h-full pointer-events-none">
          <defs>
            <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#f97316" stopOpacity="0.05" />
              <stop offset="60%" stopColor="#f97316" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#fdba74" stopOpacity="1" />
            </linearGradient>
          </defs>

          {/* Vertical Grid Lines */}
          {points.map((p, i) => {
            const showLabel = timeRange === '7' || i % Math.ceil(points.length / 5) === 0 || i === points.length - 1;
            return showLabel && (
              <line key={`grid-${i}`} x1={p.x} y1={padding.top} x2={p.x} y2={padding.top + graphHeight} stroke="#1e293b" strokeWidth="1" vectorEffect="non-scaling-stroke" />
            );
          })}

          {/* The Curved Animated Line */}
          <path d={pathD} fill="none" stroke="url(#lineGrad)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" className="animate-draw-line" />
        </svg>

      </div>
      
      {/* Required CSS */}
      <style>{`
        @keyframes drawLine { from { stroke-dashoffset: 3000; } to { stroke-dashoffset: 0; } }
        .animate-draw-line { stroke-dasharray: 3000; stroke-dashoffset: 3000; animation: drawLine 2.5s cubic-bezier(0.2, 0.8, 0.2, 1) forwards; }
        @keyframes fadeInObj { to { opacity: 1; } }
        @keyframes fadeInDot { from { opacity: 0; transform: scale(0) translate(-50%, -50%); } to { opacity: 1; transform: scale(1) translate(-50%, -50%); } }
        .animate-fade-in-dot { opacity: 0; transform-origin: center; animation: fadeInDot 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
        @keyframes floatSlow { 0% { transform: translateY(0px); } 50% { transform: translateY(-8px); } 100% { transform: translateY(0px); } }
        .animate-float-slow { animation: floatSlow 5s ease-in-out infinite; }
      `}</style>
    </div>
  );
}