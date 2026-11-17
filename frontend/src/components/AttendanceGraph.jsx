import { useState, useEffect } from 'react';

export default function AttendanceGraph({ attendanceData, calYear, calMonth, isDarkMode, attendanceRate }) {
  const [animateGraph, setAnimateGraph] = useState(false);
  const [hoveredNode, setHoveredNode] = useState(null);

  // Trigger smooth line drawing animation when month or data changes
  useEffect(() => {
    setAnimateGraph(false);
    const timer = setTimeout(() => setAnimateGraph(true), 50);
    return () => clearTimeout(timer);
  }, [calMonth, calYear, attendanceData]);

  // Calculate actual days in the currently viewed month (handles leap years perfectly)
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();

  const getDailyTrend = () => {
    const data = [];
    let cumulativeP = 0;
    let cumulativeT = 0;
    let lastPct = 0;

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const status = attendanceData[dateStr] || 'none';
      
      if (status === 'present') { cumulativeP++; cumulativeT++; }
      else if (status === 'absent') { cumulativeT++; }
      
      const pct = cumulativeT > 0 ? Math.round((cumulativeP / cumulativeT) * 100) : lastPct;
      lastPct = pct;
      
      data.push({ label: String(day), status, pct });
    }

    // Normalize to exactly 31 items. This guarantees the SVG 'd' paths always have the exact same 
    // number of anchors so they morph flawlessly between months of different lengths.
    const normalizedData = [];
    for (let i = 0; i < 31; i++) {
      if (i < data.length) {
        normalizedData.push(data[i]);
      } else {
        normalizedData.push({ ...data[data.length - 1], isHidden: true }); 
      }
    }
    
    return normalizedData;
  };

  const trendData = getDailyTrend();
  
  // SVG Chart Setup (Adjusted padding for larger fonts)
  const svgWidth = 800; 
  const svgHeight = 180; 
  const paddingX = 45; // Increased for larger Y-axis labels
  const paddingY = 45; // Increased to give tooltips more breathing room
  const chartW = svgWidth - paddingX * 2;
  const chartH = svgHeight - paddingY - 30; 
  
  const pointCoords = trendData.map((d, i) => {
    // DYNAMIC SPREAD: We stack any padded (hidden) points exactly on the last valid day's X coordinate.
    // This perfectly spaces out the visible points based on the true month length (28, 29, 30, or 31).
    const effectiveIndex = Math.min(i, daysInMonth - 1);
    const x = paddingX + (effectiveIndex * (chartW / (daysInMonth - 1)));
    const y = paddingY + chartH - (d.pct / 100 * chartH);
    return { x, y, ...d };
  });
  
  const pathString = pointCoords.map((pt, i) => `${i === 0 ? 'M' : 'L'} ${pt.x} ${pt.y}`).join(' ');
  const areaString = `${pathString} L ${svgWidth - paddingX} ${svgHeight - 30} L ${paddingX} ${svgHeight - 30} Z`;

  return (
    <div className={`mt-auto pt-6 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
      
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-orange-500" fill="currentColor" viewBox="0 0 24 24">
            <path d="M4 18v-4h4v4H4zm6 0v-8h4v8h-4zm6 0V6h4v12h-4z"/>
          </svg>
          <h4 className={`text-sm font-bold uppercase tracking-wider ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>Daily Trend</h4>
        </div>
        
        <div className={`flex items-center gap-2 px-3 py-1 rounded-full shadow-inner ${isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-gray-100 border border-gray-200'}`}>
          <span className={`text-[10px] font-bold uppercase tracking-wider ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Overall</span>
          <span className={`text-xs font-extrabold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{attendanceRate}%</span>
        </div>
      </div>

      <div className="w-full overflow-hidden rounded-lg">
        <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-auto">
          <defs>
            <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f97316" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#f97316" stopOpacity="0" />
            </linearGradient>
          </defs>
          
          {/* Grid lines */}
          {[0, 25, 50, 75, 100].map(line => {
            const yPos = paddingY + chartH - (line/100 * chartH);
            return <line key={line} x1={paddingX} y1={yPos} x2={svgWidth - paddingX} y2={yPos} stroke={isDarkMode ? "#334155" : "#e2e8f0"} strokeWidth="0.5" />;
          })}

          {/* Y Axis Labels (Bigger Font) */}
          {[0, 50, 100].map(line => (
            <text key={line} x={paddingX - 12} y={paddingY + chartH - (line/100 * chartH) + 4} fill={isDarkMode ? "#64748b" : "#94a3b8"} fontSize="12" textAnchor="end" className="select-none font-medium">
              {line}%
            </text>
          ))}
          
          {/* SMOOTH MORPHING */}
          {pointCoords.length > 0 && (
            <>
              <path 
                d={areaString} 
                fill="url(#chartGradient)" 
                style={{
                  opacity: animateGraph ? 1 : 0,
                  transition: 'd 0.5s cubic-bezier(0.4, 0, 0.2, 1), opacity 1s ease'
                }}
              />
              <path 
                d={pathString} 
                fill="none" 
                stroke="#f97316" 
                strokeWidth="2" 
                strokeDasharray={3000}
                strokeDashoffset={animateGraph ? 0 : 3000}
                style={{ 
                  transition: 'd 0.5s cubic-bezier(0.4, 0, 0.2, 1), stroke-dashoffset 1.5s cubic-bezier(0.4, 0, 0.2, 1)' 
                }}
              />
            </>
          )}
          
          {/* Data Points */}
          {pointCoords.map((pt, i) => {
            if (pt.isHidden) return null; // Skips rendering UI elements for the invisible padded dates
            
            const isPresent = pt.status === 'present';
            const isAbsent = pt.status === 'absent';
            const isUnmarked = pt.status === 'none';
            
            const fillColor = isPresent ? '#10b981' : isAbsent ? '#ef4444' : (isDarkMode ? '#334155' : '#cbd5e1');
            const strokeColor = isPresent ? '#047857' : isAbsent ? '#b91c1c' : 'transparent';
            const radius = isUnmarked ? "3" : (hoveredNode === i ? "7" : "5");

            return (
              <g 
                key={i}
                style={{
                  opacity: animateGraph ? 1 : 0,
                  transition: 'opacity 0.4s ease-out',
                  transitionDelay: `${0.1 + (i * 0.02)}s` 
                }}
              >
                {/* Day Label on X Axis (Bigger Font) */}
                <text x={pt.x} y={svgHeight - 10} fill={isDarkMode ? "#94a3b8" : "#64748b"} fontSize="12" textAnchor="middle" fontWeight="bold" className="select-none" style={{ transition: 'all 0.5s ease' }}>
                  {pt.label}
                </text>

                {/* Visible Node Circle */}
                <circle 
                  cx={pt.x} cy={pt.y} 
                  r={radius} 
                  fill={fillColor} 
                  stroke={strokeColor} 
                  strokeWidth="2" 
                  style={{ transition: 'cx 0.5s cubic-bezier(0.4, 0, 0.2, 1), cy 0.5s cubic-bezier(0.4, 0, 0.2, 1), r 0.3s ease', pointerEvents: 'none' }} 
                />

                {/* Hover Tooltip Group (Bigger Text & Box) */}
                <g style={{ 
                  transform: `translate(${pt.x}px, ${pt.y - 24}px)`, 
                  transition: 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.2s ease-out',
                  opacity: hoveredNode === i ? 1 : 0,
                  pointerEvents: 'none'
                }}>
                  <rect x="-28" y="-16" width="56" height="20" rx="4" fill={isDarkMode ? "#334155" : "#475569"} className="drop-shadow-sm" />
                  <text x="0" y="-2" fill="#ffffff" fontSize="11" fontWeight="bold" textAnchor="middle">
                    {pt.pct}%
                  </text>
                </g>

                {/* Invisible Hit Area */}
                <circle 
                  cx={pt.x} cy={pt.y} 
                  r="16" 
                  fill="transparent"
                  className="cursor-crosshair"
                  onMouseEnter={() => setHoveredNode(i)}
                  onMouseLeave={() => setHoveredNode(null)}
                  style={{ transition: 'cx 0.5s cubic-bezier(0.4, 0, 0.2, 1), cy 0.5s cubic-bezier(0.4, 0, 0.2, 1)' }}
                />
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}