export const LineChart = ({ data, height = 200 }) => {
  const w = 500, h = height;
  const pad = { t: 20, r: 20, b: 40, l: 60 };
  const cw = w - pad.l - pad.r, ch = h - pad.t - pad.b;
  const maxVal = Math.max(...data.map(d => Math.max(d.revenue, d.expenses)));
  const x = i => pad.l + (i / (data.length - 1)) * cw;
  const y = v => pad.t + ch - (v / maxVal) * ch;
  const revPath = data.map((d, i) => `${i === 0 ? "M" : "L"}${x(i)},${y(d.revenue)}`).join(" ");
  const expPath = data.map((d, i) => `${i === 0 ? "M" : "L"}${x(i)},${y(d.expenses)}`).join(" ");
  const areaPath = `${revPath} L${x(data.length - 1)},${h - pad.b} L${pad.l},${h - pad.b} Z`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: "100%", height }}>
      <defs>
        <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#0E6C68" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#0E6C68" stopOpacity="0.02" />
        </linearGradient>
      </defs>
      {[0, 0.25, 0.5, 0.75, 1].map(t => (
        <line key={t} x1={pad.l} y1={pad.t + ch * t} x2={w - pad.r} y2={pad.t + ch * t} stroke="#e2e8f0" strokeWidth="1" strokeDasharray="4 4" />
      ))}
      <path d={areaPath} fill="url(#revGrad)" />
      <path d={revPath} fill="none" stroke="#0E6C68" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d={expPath} fill="none" stroke="#14A3A0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="6 3" />
      {data.map((d, i) => (
        <g key={i}>
          <circle cx={x(i)} cy={y(d.revenue)} r="4" fill="#0E6C68" />
          <text x={x(i)} y={h - pad.b + 16} textAnchor="middle" fontSize="11" fill="#94a3b8">{d.month}</text>
        </g>
      ))}
      {[0, 0.25, 0.5, 0.75, 1].map((t, i) => (
        <text key={i} x={pad.l - 8} y={pad.t + ch * t + 4} textAnchor="end" fontSize="10" fill="#94a3b8">
          {Math.round(maxVal * (1 - t) / 1000)}k
        </text>
      ))}
    </svg>
  );
};

export const BarChart = ({ data, height = 200 }) => {
  if (!data || data.length === 0) return null;

  const w = 500, h = height;
  const pad = { t: 20, r: 20, b: 60, l: 20 };
  const cw = w - pad.l - pad.r, ch = h - pad.t - pad.b;

  const getValue = d => d.value ?? d.appointments ?? 0;
  const getLabel = d => {
    const raw = d.name ?? d.doctor ?? '';
    if (!raw || typeof raw !== 'string') return '';
    const parts = raw.trim().split(' ');
    return parts[parts.length - 1];
  };

  const maxVal = Math.max(...data.map(getValue), 1);
  const bw = (cw / data.length) * 0.55;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: "100%", height }}>
      {data.map((d, i) => {
        const val = getValue(d);
        const label = getLabel(d);
        const bx = pad.l + (i / data.length) * cw + (cw / data.length - bw) / 2;
        const bh = (val / maxVal) * ch;
        const completedVal = d.completed ?? 0;
        const bh2 = (completedVal / maxVal) * ch;

        return (
          <g key={i}>
            <rect x={bx} y={pad.t + ch - bh} width={bw} height={bh} rx="6" fill="#DFF7F6" />
            {completedVal > 0
              ? <rect x={bx} y={pad.t + ch - bh2} width={bw} height={bh2} rx="6" fill="#0E6C68" />
              : <rect x={bx} y={pad.t + ch - bh}  width={bw} height={bh}  rx="6" fill="#0E6C68" />
            }
            <text x={bx + bw / 2} y={h - pad.b + 16} textAnchor="middle" fontSize="9" fill="#94a3b8">
              {label}
            </text>
            <text x={bx + bw / 2} y={pad.t + ch - bh - 6} textAnchor="middle" fontSize="11" fontWeight="600" fill="#334155">
              {val}
            </text>
          </g>
        );
      })}
    </svg>
  );
};

export const DonutChart = ({ data, size = 160 }) => {
  const r = 60, cx = size / 2, cy = size / 2;
  const total = data.reduce((s, d) => s + d.value, 0);
  let angle = -90;
  return (
    <svg viewBox={`0 0 ${size} ${size}`} style={{ width: size, height: size }}>
      {data.map((d, i) => {
        const sweep = (d.value / total) * 360;
        
        // ✅ Fix: full circle when sweep is 360 (single segment)
        if (sweep >= 359.99) {
          angle += sweep;
          return <circle key={i} cx={cx} cy={cy} r={r} fill={d.color} opacity="0.9" />;
        }

        const startRad = (angle * Math.PI) / 180;
        const endRad   = ((angle + sweep) * Math.PI) / 180;
        const x1 = cx + r * Math.cos(startRad), y1 = cy + r * Math.sin(startRad);
        const x2 = cx + r * Math.cos(endRad),   y2 = cy + r * Math.sin(endRad);
        const lg = sweep > 180 ? 1 : 0;
        const path = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${lg} 1 ${x2} ${y2} Z`;
        angle += sweep;
        return <path key={i} d={path} fill={d.color} opacity="0.9" />;
      })}
      <circle cx={cx} cy={cy} r={r * 0.65} fill="white" />
      <text x={cx} y={cy - 4}  textAnchor="middle" fontSize="18" fontWeight="700" fill="#334155">{total}%</text>
      <text x={cx} y={cy + 14} textAnchor="middle" fontSize="9"  fill="#94a3b8">Total</text>
    </svg>
  );
};

export const AreaChart = ({ data, height = 160 }) => {
  const w = 500, h = height;
  const pad = { t: 10, r: 10, b: 30, l: 40 };
  const cw = w - pad.l - pad.r, ch = h - pad.t - pad.b;
  const maxVal = Math.max(...data.map(d => d.patients));
  const x = i => pad.l + (i / (data.length - 1)) * cw;
  const y = v => pad.t + ch - (v / maxVal) * ch;
  const linePath = data.map((d, i) => `${i === 0 ? "M" : "L"}${x(i)},${y(d.patients)}`).join(" ");
  const areaPath = `${linePath} L${x(data.length - 1)},${h - pad.b} L${pad.l},${h - pad.b} Z`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: "100%", height }}>
      <defs>
        <linearGradient id="patGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#14A3A0" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#14A3A0" stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill="url(#patGrad)" />
      <path d={linePath} fill="none" stroke="#14A3A0" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {data.map((d, i) => (
        <text key={i} x={x(i)} y={h - pad.b + 16} textAnchor="middle" fontSize="10" fill="#94a3b8">{d.month}</text>
      ))}
    </svg>
  );
};

// ── Encounters Line Chart ─────────────────────────────────────────────────────
// Expects: data = [{ month: "Oct", count: 3 }, ...]
// Mirrors the "Patient Registrations" style — single teal line + filled area + y-axis labels
export const EncountersLineChart = ({ data, height = 200 }) => {
  if (!data || data.length < 2) {
    return (
      <div style={{ height }} className="flex items-center justify-center text-slate-400 text-sm">
        No data
      </div>
    );
  }

  const w = 500, h = height;
  const pad = { t: 20, r: 20, b: 40, l: 50 };
  const cw = w - pad.l - pad.r, ch = h - pad.t - pad.b;

  const maxVal = Math.max(...data.map(d => d.count), 1);
  // round up to a nice ceiling so the top gridline isn't right on the data
  const ceil  = maxVal <= 3 ? maxVal + 1 : Math.ceil(maxVal * 1.2);

  const x = i => pad.l + (i / (data.length - 1)) * cw;
  const y = v => pad.t + ch - (v / ceil) * ch;

  const linePath = data.map((d, i) => `${i === 0 ? "M" : "L"}${x(i)},${y(d.count)}`).join(" ");
  const areaPath = `${linePath} L${x(data.length - 1)},${h - pad.b} L${pad.l},${h - pad.b} Z`;

  // 4 horizontal gridlines (0, 33%, 66%, 100% of ceil)
  const gridTicks = [0, 0.33, 0.66, 1];

  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: "100%", height }}>
      <defs>
        <linearGradient id="encGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#0E6C68" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#0E6C68" stopOpacity="0.01" />
        </linearGradient>
      </defs>

      {/* Grid lines */}
      {gridTicks.map((t, i) => (
        <line
          key={i}
          x1={pad.l} y1={pad.t + ch * (1 - t)}
          x2={w - pad.r} y2={pad.t + ch * (1 - t)}
          stroke="#e2e8f0" strokeWidth="1" strokeDasharray="4 4"
        />
      ))}

      {/* Y-axis labels */}
      {gridTicks.map((t, i) => (
        <text
          key={i}
          x={pad.l - 8}
          y={pad.t + ch * (1 - t) + 4}
          textAnchor="end"
          fontSize="10"
          fill="#94a3b8"
        >
          {Math.round(ceil * t)}
        </text>
      ))}

      {/* Area fill */}
      <path d={areaPath} fill="url(#encGrad)" />

      {/* Line */}
      <path
        d={linePath}
        fill="none"
        stroke="#0E6C68"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Dots + X-axis labels */}
      {data.map((d, i) => (
        <g key={i}>
          <circle cx={x(i)} cy={y(d.count)} r="4" fill="#0E6C68" stroke="white" strokeWidth="1.5" />
          <text x={x(i)} y={h - pad.b + 16} textAnchor="middle" fontSize="11" fill="#94a3b8">
            {d.month}
          </text>
        </g>
      ))}
    </svg>
  );
};