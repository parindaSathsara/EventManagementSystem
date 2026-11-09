'use client';

/**
 * Hand-rolled SVG charts for the admin console — no chart library.
 *
 * Follows the dataviz method: 2px lines, ~10% area wash, ≤24px columns with a
 * 4px rounded data-end and a square baseline, 2px surface gap between touching
 * columns, hairline solid grid, a crosshair + one tooltip listing every series
 * on hover/focus, a legend for ≥2 series, and every chart has a table view.
 * Series/category names go into the DOM as text nodes (React), never HTML.
 */

import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { BarChart3, Table2 } from 'lucide-react';
import { full } from '@/lib/admin';

const SURFACE = '#111111';

export type ChartSeries = { key: string; label: string; color: string; values: number[]; area?: boolean };

function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    setWidth(el.clientWidth);
    const observer = new ResizeObserver(([entry]) => setWidth(Math.round(entry.contentRect.width)));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return [ref, width] as const;
}

/** Round the axis top to 1/2/2.5/5 × 10ⁿ so four ticks land on clean numbers. */
function niceMax(value: number) {
  if (value <= 4) return 4;
  const exp = Math.pow(10, Math.floor(Math.log10(value)));
  const f = value / exp;
  const nice = f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10;
  const max = nice * exp;
  // Four integer steps — counts never get fractional ticks.
  return Math.ceil(max / 4) * 4;
}

function tickLabel(n: number) {
  if (n < 10000) return full(Math.round(n));
  return new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(n);
}

function labelEvery(count: number, width: number, minGap = 64) {
  const fits = Math.max(2, Math.floor(width / minGap));
  return Math.max(1, Math.ceil(count / fits));
}

function Tooltip({ x, width, title, rows }: { x: number; width: number; title: string; rows: Array<{ color: string; label: string; value: number; kind: 'line' | 'rect' }> }) {
  const tipW = 200;
  const left = Math.min(Math.max(x + 14, 0), Math.max(0, width - tipW));
  const flip = x + 14 + tipW > width;
  return (
    <div className="adm-tip" style={{ left: flip ? Math.max(0, x - tipW - 14) : left }} role="status">
      <div className="adm-tip-title">{title}</div>
      {rows.map((row) => (
        <div className="adm-tip-row" key={row.label}>
          <i className={row.kind === 'line' ? 'adm-key-line' : 'adm-key-rect'} style={{ background: row.color }} />
          <strong>{full(row.value)}</strong>
          <span>{row.label}</span>
        </div>
      ))}
    </div>
  );
}

export function Legend({ items, kind = 'line' }: { items: Array<{ label: string; color: string }>; kind?: 'line' | 'rect' }) {
  return (
    <div className="adm-legend">
      {items.map((item) => (
        <span key={item.label}><i className={kind === 'line' ? 'adm-key-line' : 'adm-key-rect'} style={{ background: item.color }} />{item.label}</span>
      ))}
    </div>
  );
}

// --- line / area -------------------------------------------------------------------

export function TrendChart({ series, labels, longLabels, height = 260, stale = false, ariaLabel }: {
  series: ChartSeries[];
  labels: string[];
  longLabels: string[];
  height?: number;
  stale?: boolean;
  ariaLabel: string;
}) {
  const [ref, width] = useWidth<HTMLDivElement>();
  const [active, setActive] = useState<number | null>(null);
  const clipId = useId();
  const n = labels.length;
  const pad = { top: 14, right: 46, bottom: 28, left: 46 };
  const innerW = Math.max(1, width - pad.left - pad.right);
  const innerH = height - pad.top - pad.bottom;
  const max = niceMax(Math.max(0, ...series.flatMap((s) => s.values)));
  const x = (i: number) => pad.left + (n <= 1 ? innerW / 2 : (i * innerW) / (n - 1));
  const y = (v: number) => pad.top + innerH - (v / max) * innerH;
  const ticks = [0, 1, 2, 3, 4].map((k) => (max * k) / 4);
  const every = labelEvery(n, innerW);

  // End labels only where they don't collide — otherwise legend + tooltip carry it.
  const endLabels = useMemo(() => {
    const ends = series.map((s) => ({ key: s.key, value: s.values[n - 1] ?? 0, y: y(s.values[n - 1] ?? 0) })).sort((a, b) => a.y - b.y);
    const ok = ends.every((e, i) => i === 0 || e.y - ends[i - 1].y >= 14);
    return ok ? ends : [];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [series, n, max, height]);

  function pick(clientX: number, target: SVGSVGElement) {
    const rect = target.getBoundingClientRect();
    const px = clientX - rect.left;
    const i = n <= 1 ? 0 : Math.round(((px - pad.left) / innerW) * (n - 1));
    setActive(Math.min(n - 1, Math.max(0, i)));
  }

  return (
    <div ref={ref} className={`adm-chart${stale ? ' is-stale' : ''}`} style={{ height }}>
      {width > 0 && n > 0 && (
        <svg
          width={width}
          height={height}
          role="img"
          aria-label={ariaLabel}
          tabIndex={0}
          onPointerMove={(e) => pick(e.clientX, e.currentTarget)}
          onPointerLeave={() => setActive(null)}
          onFocus={() => setActive((a) => a ?? n - 1)}
          onBlur={() => setActive(null)}
          onKeyDown={(e) => {
            if (e.key === 'ArrowLeft') { e.preventDefault(); setActive((a) => Math.max(0, (a ?? n) - 1)); }
            if (e.key === 'ArrowRight') { e.preventDefault(); setActive((a) => Math.min(n - 1, (a ?? -1) + 1)); }
          }}
        >
          <defs>
            <clipPath id={clipId}><rect x={pad.left} y={pad.top - 2} width={innerW} height={innerH + 4} /></clipPath>
          </defs>
          {ticks.map((t) => (
            <g key={t}>
              <line x1={pad.left} x2={pad.left + innerW} y1={y(t)} y2={y(t)} stroke={t === 0 ? 'var(--adm-axis)' : 'var(--adm-grid)'} strokeWidth={1} />
              <text className="adm-axis-text" x={pad.left - 10} y={y(t)} dy="0.32em" textAnchor="end">{tickLabel(t)}</text>
            </g>
          ))}
          {labels.map((label, i) => (i % every === 0 ? (
            <text key={`${label}-${i}`} className="adm-axis-text" x={x(i)} y={height - 8} textAnchor={i === 0 ? 'start' : 'middle'}>{label}</text>
          ) : null))}
          <g clipPath={`url(#${clipId})`}>
            {series.map((s) => {
              const line = s.values.map((v, i) => `${i ? 'L' : 'M'}${x(i)},${y(v)}`).join('');
              return (
                <g key={s.key}>
                  {s.area && <path d={`${line}L${x(n - 1)},${y(0)}L${x(0)},${y(0)}Z`} fill={s.color} opacity={0.1} />}
                  <path d={line} fill="none" stroke={s.color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
                </g>
              );
            })}
          </g>
          {active === null && endLabels.map((e) => {
            const s = series.find((item) => item.key === e.key)!;
            return (
              <g key={e.key}>
                <circle cx={x(n - 1)} cy={e.y} r={4} fill={s.color} stroke={SURFACE} strokeWidth={2} />
                <text className="adm-end-label" x={x(n - 1) + 9} y={e.y} dy="0.32em">{tickLabel(e.value)}</text>
              </g>
            );
          })}
          {active !== null && (
            <g pointerEvents="none">
              <line x1={x(active)} x2={x(active)} y1={pad.top} y2={pad.top + innerH} stroke="var(--adm-muted)" strokeWidth={1} />
              {series.map((s) => <circle key={s.key} cx={x(active)} cy={y(s.values[active] ?? 0)} r={4.5} fill={s.color} stroke={SURFACE} strokeWidth={2} />)}
            </g>
          )}
        </svg>
      )}
      {active !== null && width > 0 && (
        <Tooltip
          x={x(active)}
          width={width}
          title={longLabels[active]}
          rows={series.map((s) => ({ color: s.color, label: s.label, value: s.values[active] ?? 0, kind: 'line' }))}
        />
      )}
    </div>
  );
}

// --- grouped columns ------------------------------------------------------------------

function columnPath(x: number, w: number, top: number, base: number) {
  const h = base - top;
  if (h <= 0) return '';
  const r = Math.min(4, h, w / 2);
  return `M${x},${base}V${top + r}Q${x},${top} ${x + r},${top}H${x + w - r}Q${x + w},${top} ${x + w},${top + r}V${base}Z`;
}

export function ColumnChart({ series, labels, longLabels, height = 220, stale = false, ariaLabel }: {
  series: ChartSeries[];
  labels: string[];
  longLabels: string[];
  height?: number;
  stale?: boolean;
  ariaLabel: string;
}) {
  const [ref, width] = useWidth<HTMLDivElement>();
  const [active, setActive] = useState<number | null>(null);
  const n = labels.length;
  const pad = { top: 12, right: 8, bottom: 28, left: 40 };
  const innerW = Math.max(1, width - pad.left - pad.right);
  const innerH = height - pad.top - pad.bottom;
  const max = niceMax(Math.max(0, ...series.flatMap((s) => s.values)));
  const band = innerW / Math.max(1, n);
  const gap = 2;
  const barW = Math.max(1.5, Math.min(24, (band * 0.72 - gap * (series.length - 1)) / series.length));
  const groupW = barW * series.length + gap * (series.length - 1);
  const y = (v: number) => pad.top + innerH - (v / max) * innerH;
  const base = y(0);
  const ticks = [0, 1, 2, 3, 4].map((k) => (max * k) / 4);
  const every = labelEvery(n, innerW);

  return (
    <div ref={ref} className={`adm-chart${stale ? ' is-stale' : ''}`} style={{ height }}>
      {width > 0 && n > 0 && (
        <svg
          width={width}
          height={height}
          role="img"
          aria-label={ariaLabel}
          tabIndex={0}
          onPointerLeave={() => setActive(null)}
          onFocus={() => setActive((a) => a ?? n - 1)}
          onBlur={() => setActive(null)}
          onKeyDown={(e) => {
            if (e.key === 'ArrowLeft') { e.preventDefault(); setActive((a) => Math.max(0, (a ?? n) - 1)); }
            if (e.key === 'ArrowRight') { e.preventDefault(); setActive((a) => Math.min(n - 1, (a ?? -1) + 1)); }
          }}
        >
          {ticks.map((t) => (
            <g key={t}>
              <line x1={pad.left} x2={pad.left + innerW} y1={y(t)} y2={y(t)} stroke={t === 0 ? 'var(--adm-axis)' : 'var(--adm-grid)'} strokeWidth={1} />
              <text className="adm-axis-text" x={pad.left - 10} y={y(t)} dy="0.32em" textAnchor="end">{tickLabel(t)}</text>
            </g>
          ))}
          {labels.map((label, i) => (i % every === 0 ? (
            <text key={`${label}-${i}`} className="adm-axis-text" x={pad.left + band * i + band / 2} y={height - 8} textAnchor="middle">{label}</text>
          ) : null))}
          {labels.map((_, i) => {
            const gx = pad.left + band * i + (band - groupW) / 2;
            return (
              <g key={i} opacity={active === null || active === i ? 1 : 0.55}>
                {/* the whole band is the hit target, not just the painted bars */}
                <rect x={pad.left + band * i} y={pad.top} width={band} height={innerH} fill="transparent" onPointerEnter={() => setActive(i)} />
                {series.map((s, k) => (
                  <path key={s.key} d={columnPath(gx + k * (barW + gap), barW, y(s.values[i] ?? 0), base)} fill={s.color} pointerEvents="none" />
                ))}
              </g>
            );
          })}
        </svg>
      )}
      {active !== null && width > 0 && (
        <Tooltip
          x={pad.left + band * active + band / 2}
          width={width}
          title={longLabels[active]}
          rows={series.map((s) => ({ color: s.color, label: s.label, value: s.values[active] ?? 0, kind: 'rect' }))}
        />
      )}
    </div>
  );
}

// --- sparkline ------------------------------------------------------------------------

export function Sparkline({ values, color = 'var(--adm-muted)', accent }: { values: number[]; color?: string; accent: string }) {
  const [ref, width] = useWidth<HTMLDivElement>();
  const h = 28;
  const n = values.length;
  const max = Math.max(1, ...values);
  const x = (i: number) => 3 + (n <= 1 ? 0 : (i * (width - 8)) / (n - 1));
  const y = (v: number) => 4 + (h - 8) - (v / max) * (h - 8);
  return (
    <div ref={ref} className="adm-stat-spark" aria-hidden>
      {width > 0 && n > 1 && (
        <svg width={width} height={h}>
          <path d={values.map((v, i) => `${i ? 'L' : 'M'}${x(i)},${y(v)}`).join('')} fill="none" stroke={color} strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" opacity={0.7} />
          <circle cx={x(n - 1)} cy={y(values[n - 1])} r={3} fill={accent} stroke={SURFACE} strokeWidth={1.5} />
        </svg>
      )}
    </div>
  );
}

// --- one whole split into parts --------------------------------------------------------

export function SplitBar({ parts, unit }: { parts: Array<{ label: string; value: number; color: string; sub?: string }>; unit: string }) {
  const total = parts.reduce((s, p) => s + p.value, 0);
  return (
    <div>
      {total === 0 ? <div className="adm-split-empty" aria-label="No data yet" /> : (
        <div className="adm-split" role="img" aria-label={parts.map((p) => `${p.label}: ${full(p.value)} ${unit} (${Math.round((p.value / total) * 100)}%)`).join(', ')}>
          {parts.filter((p) => p.value > 0).map((p) => {
            const share = p.value / total;
            return (
              <div key={p.label} className="adm-split-part" style={{ flexGrow: p.value, flexBasis: 0, background: p.color }} title={`${p.label}: ${full(p.value)} ${unit}`}>
                {share >= 0.14 ? `${Math.round(share * 100)}%` : ''}
              </div>
            );
          })}
        </div>
      )}
      <div className="adm-split-rows">
        {parts.map((p) => (
          <div className="adm-split-row" key={p.label}>
            <i className="adm-key-rect" style={{ background: p.color }} />
            <span>{p.label}</span>
            <strong>{full(p.value)}</strong>
            <em>{p.sub ?? (total ? `${Math.round((p.value / total) * 100)}%` : '—')}</em>
          </div>
        ))}
      </div>
    </div>
  );
}

// --- chart ⇄ table ---------------------------------------------------------------------

export function ChartTableToggle({ showTable, onChange }: { showTable: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="adm-seg-control adm-table-toggle" role="group" aria-label="Chart or table view">
      <button type="button" aria-pressed={!showTable} onClick={() => onChange(false)} title="Chart"><BarChart3 size={15} /></button>
      <button type="button" aria-pressed={showTable} onClick={() => onChange(true)} title="Table"><Table2 size={15} /></button>
    </div>
  );
}

export function SeriesTable({ labels, series, height }: { labels: string[]; series: ChartSeries[]; height: number }) {
  return (
    <div className="adm-table-wrap" style={{ maxHeight: height, overflowY: 'auto' }}>
      <table className="adm-table adm-table-compact">
        <thead><tr><th>Period</th>{series.map((s) => <th key={s.key} className="adm-right">{s.label}</th>)}</tr></thead>
        <tbody>
          {labels.map((label, i) => (
            <tr key={`${label}-${i}`}><td>{label}</td>{series.map((s) => <td key={s.key} className="adm-right">{full(s.values[i] ?? 0)}</td>)}</tr>
          )).reverse()}
        </tbody>
      </table>
    </div>
  );
}
