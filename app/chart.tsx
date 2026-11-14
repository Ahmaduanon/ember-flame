'use client';
import { useId } from 'react';

export function Plot({
  series,
  labels,
  unit = '',
  height = 150,
  empty = 'Run an experiment to see the response.'
}: {
  series: { values: { x: number; y: number }[]; color: string; name: string; dashed?: boolean }[];
  labels?: boolean;
  unit?: string;
  height?: number;
  empty?: string;
}) {
  const id = useId().replace(/:/g, '');
  const all = series.flatMap(s => s.values).filter(p => Number.isFinite(p.x) && Number.isFinite(p.y));
  if (!all.length) return <div className="plot-empty" style={{ height }}>{empty}</div>;

  const minX = Math.min(...all.map(p => p.x));
  const maxX = Math.max(minX + 1, ...all.map(p => p.x));
  const minY = Math.min(0, ...all.map(p => p.y));
  const maxY = Math.max(1, ...all.map(p => p.y)) * 1.12;
  const W = 700;
  const H = height;
  const L = 43;
  const R = 12;
  const T = 14;
  const B = 25;

  const xx = (x: number) => L + ((x - minX) / (maxX - minX)) * (W - L - R);
  const yy = (y: number) => H - B - ((y - minY) / (maxY - minY)) * (H - T - B);

  return (
    <div className="plot">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={series.map(s => s.name).join(' and ') + ` over elapsed seconds (${unit})`}
      >
        <defs>
          {series.map((s, i) => (
            <linearGradient key={i} id={`${id}-${i}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor={s.color} stopOpacity=".18" />
              <stop offset="1" stopColor={s.color} stopOpacity="0" />
            </linearGradient>
          ))}
        </defs>
        {[0, 0.5, 1].map(n => (
          <g key={n}>
            <line
              x1={L}
              y1={yy(minY + (maxY - minY) * n)}
              x2={W - R}
              y2={yy(minY + (maxY - minY) * n)}
              stroke="var(--border)"
              strokeDasharray="3 5"
            />
            <text
              x={L - 8}
              y={yy(minY + (maxY - minY) * n) + 3}
              fill="var(--muted)"
              fontSize="10"
              fontFamily="ui-monospace, monospace"
              textAnchor="end"
            >
              {maxY - minY < 5 ? (minY + (maxY - minY) * n).toFixed(1) : Math.round(minY + (maxY - minY) * n)}
            </text>
          </g>
        ))}
        {[0, 0.25, 0.5, 0.75, 1].map(n => (
          <text
            key={n}
            x={L + n * (W - L - R)}
            y={H - 5}
            fill="var(--muted)"
            fontSize="10"
            fontFamily="ui-monospace, monospace"
            textAnchor="middle"
          >
            {(minX + (maxX - minX) * n).toFixed(0)}s
          </text>
        ))}
        {series.map((s, i) => {
          const pts = s.values.filter(p => Number.isFinite(p.x) && Number.isFinite(p.y));
          if (!pts.length) return null;
          const d = pts.map((p, k) => `${k ? 'L' : 'M'}${xx(p.x).toFixed(2)},${yy(p.y).toFixed(2)}`).join(' ');
          return (
            <g key={i}>
              <path
                d={`${d} L${xx(pts.at(-1)!.x)},${H - B} L${xx(pts[0].x)},${H - B} Z`}
                fill={`url(#${id}-${i})`}
              />
              <path
                d={d}
                fill="none"
                stroke={s.color}
                strokeWidth="2.2"
                strokeDasharray={s.dashed ? '4 3' : undefined}
                vectorEffect="non-scaling-stroke"
              />
            </g>
          );
        })}
        <text x={L} y={9} fill="var(--muted)" fontSize="9" fontFamily="ui-monospace, monospace">{unit}</text>
      </svg>
      {labels && (
        <div className="legend">
          {series.map(s => (
            <span key={s.name}>
              <i style={{ background: s.color }} />
              {s.name}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
