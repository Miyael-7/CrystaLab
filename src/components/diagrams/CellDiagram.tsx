/**
 * Celda unitaria cúbica en proyección oblicua (SVG estático).
 * La geometría de direcciones y planos sale de src/core (directionDrawing,
 * planeDrawing), así que lo dibujado es matemáticamente exacto.
 * Convención de ejes como en clase: x hacia el observador, y a la derecha, z arriba.
 */
import { useId } from 'react';
import { directionDrawing, frac, planeDrawing, type Indices, type Vec3 } from '../../core';
import { SvgIdx } from './SvgIdx';

export interface DiagramDirection {
  uvw: Indices;
  color: string;
  label?: boolean;
  /** Muestra las coordenadas de inicio y punta (útil para comprobar «punta − inicio»). */
  endpoints?: boolean;
}
export interface DiagramPlane {
  hkl: Indices;
  color: string;
  label?: boolean;
  intercepts?: boolean;
}

interface Props {
  title: string;
  directions?: DiagramDirection[];
  planes?: DiagramPlane[];
  atoms?: 'none' | 'sc' | 'bcc' | 'fcc';
  axes?: boolean;
  coords?: boolean;
  width?: number;
  className?: string;
}

const S = 100;
/** Proyección oblicua: x hacia abajo-izquierda, y a la derecha, z arriba. */
export const project = (p: Vec3): [number, number] => [(p[1] - 0.5 * p[0]) * S, (-p[2] + 0.32 * p[0]) * S];
/** Profundidad hacia el observador (mayor = más cerca). */
const depth = (p: Vec3) => p[0] + 0.5 * p[1] + 0.32 * p[2];

const CORNERS: Vec3[] = [
  [0, 0, 0], [1, 0, 0], [0, 1, 0], [1, 1, 0],
  [0, 0, 1], [1, 0, 1], [0, 1, 1], [1, 1, 1],
];
const EDGES: [number, number][] = [
  [0, 1], [2, 3], [4, 5], [6, 7], [0, 2], [1, 3], [4, 6], [5, 7], [0, 4], [1, 5], [2, 6], [3, 7],
];

function atomSites(kind: Props['atoms']): Vec3[] {
  if (!kind || kind === 'none') return [];
  const sites: Vec3[] = [...CORNERS];
  if (kind === 'bcc') sites.push([0.5, 0.5, 0.5]);
  if (kind === 'fcc')
    sites.push([0.5, 0.5, 0], [0.5, 0.5, 1], [0.5, 0, 0.5], [0.5, 1, 0.5], [0, 0.5, 0.5], [1, 0.5, 0.5]);
  return sites;
}

const pts = (ps: Vec3[]) => ps.map((p) => project(p).join(',')).join(' ');
const fmt = (x: number) => (Number.isInteger(x) ? String(x) : x === 0.5 ? '½' : x.toFixed(2));
/** Texto pequeño con fondo opaco (para que ninguna línea lo atraviese). */
function CoordLabel({ text, x, y, anchor, color }: { text: string; x: number; y: number; anchor: 'start' | 'end'; color: string }) {
  const fs = 9.5;
  const w = text.length * fs * 0.6;
  const x0 = anchor === 'start' ? x : x - w;
  return (
    <g>
      <rect x={x0 - 2} y={y - fs} width={w + 4} height={fs + 4} rx={2} fill="var(--bg-viewport)" fillOpacity={0.9} />
      <text x={x} y={y} fontSize={fs} fill={color} textAnchor={anchor} fontFamily="var(--font-mono)">{text}</text>
    </g>
  );
}


export function CellDiagram({ title, directions = [], planes = [], atoms = 'none', axes = true, coords = false, width = 320, className }: Props) {
  const uid = useId().replace(/:/g, '');
  const colors = [...new Set(directions.map((d) => d.color))];
  const markerId = (c: string) => `${uid}-m${colors.indexOf(c)}`;
  const sites = atomSites(atoms).sort((a, b) => depth(a) - depth(b));
  const AX = 1.4;
  const axisDefs: { end: Vec3; label: string; color: string }[] = [
    { end: [AX, 0, 0], label: 'x', color: 'var(--c-axis-x)' },
    { end: [0, AX, 0], label: 'y', color: 'var(--c-axis-y)' },
    { end: [0, 0, AX], label: 'z', color: 'var(--c-axis-z)' },
  ];

  return (
    <svg
      viewBox="-95 -170 260 230"
      width={width}
      role="img"
      aria-label={title}
      className={className}
      style={{ maxWidth: '100%', height: 'auto', overflow: 'visible' }}
    >
      <title>{title}</title>
      <defs>
        {colors.map((c) => (
          <marker key={c} id={markerId(c)} viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M0,0 L10,5 L0,10 z" fill={c} />
          </marker>
        ))}
        <radialGradient id={`${uid}-atom`} cx="35%" cy="35%" r="70%">
          <stop offset="0%" stopColor="#cfe3f5" />
          <stop offset="55%" stopColor="#6b8aa8" />
          <stop offset="100%" stopColor="#2b3b4d" />
        </radialGradient>
      </defs>

      {/* Aristas de la celda (las que tocan el origen quedan atrás: punteadas) */}
      {EDGES.map(([a, b], i) => {
        const [x1, y1] = project(CORNERS[a]!);
        const [x2, y2] = project(CORNERS[b]!);
        const hidden = a === 0;
        return (
          <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="var(--text-faint)" strokeWidth={1.2}
            strokeDasharray={hidden ? '4 4' : undefined} opacity={hidden ? 0.7 : 1} />
        );
      })}

      {axes &&
        axisDefs.map((a) => {
          const [x, y] = project(a.end);
          const [lx, ly] = project(a.end.map((v) => (v ? v + 0.14 : 0)) as unknown as Vec3);
          return (
            <g key={a.label}>
              <line x1={0} y1={0} x2={x} y2={y} stroke={a.color} strokeWidth={1.4} opacity={0.85} />
              <text x={lx} y={ly + 4} fill={a.color} fontSize={13} fontWeight={700} textAnchor="middle" fontStyle="italic">
                {a.label}
              </text>
            </g>
          );
        })}

      {/* Planos */}
      {planes.map((p, i) => {
        const g = planeDrawing(p.hkl);
        return (
          <g key={i}>
            <polygon points={pts(g.polygon)} fill={p.color} fillOpacity={0.28} stroke={p.color} strokeWidth={1.6} strokeLinejoin="round" />
            {p.intercepts &&
              g.interceptPoints.map((q, j) => {
                const [x, y] = project(q);
                return <circle key={j} cx={x} cy={y} r={3.2} fill={p.color} stroke="var(--bg)" strokeWidth={1} />;
              })}
          </g>
        );
      })}

      {/* Átomos */}
      {sites.map((s, i) => {
        const [x, y] = project(s);
        return <circle key={i} cx={x} cy={y} r={atoms === 'fcc' ? 10 : 11} fill={`url(#${uid}-atom)`} opacity={0.92} />;
      })}

      {/* Direcciones */}
      {directions.map((d, i) => {
        const g = directionDrawing(d.uvw);
        const [x1, y1] = project(g.origin);
        const [x2, y2] = project(g.tip);
        const shifted = g.origin.some((v) => v !== 0);
        return (
          <g key={i}>
            {(shifted || d.endpoints) && <circle cx={x1} cy={y1} r={3.5} fill="none" stroke={d.color} strokeWidth={1.4} />}
            <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={d.color} strokeWidth={2.4} markerEnd={`url(#${markerId(d.color)})`} />
          </g>
        );
      })}

      {/* Etiquetas de direcciones (encima de todas las flechas) */}
      {directions.map((d, i) => {
        const g = directionDrawing(d.uvw);
        const [x1, y1] = project(g.origin);
        const [x2, y2] = project(g.tip);
        const right = x2 >= x1;
        return (
          <g key={i}>
            {d.label && <SvgIdx v={d.uvw} x={x2 + (right ? 8 : -8)} y={y2 - 8} color={d.color} anchor={right ? 'start' : 'end'} />}
            {d.endpoints && (
              <>
                <CoordLabel text={`inicio (${g.origin.map(frac).join(',')})`} x={x1 + (right ? -7 : 7)} y={right ? y1 - 8 : y1 + 16}
                  anchor={right ? 'end' : 'start'} color={d.color} />
                <CoordLabel text={`punta (${g.tip.map(frac).join(',')})`} x={x2 + (right ? 8 : -8)} y={y2 + 16}
                  anchor={right ? 'start' : 'end'} color={d.color} />
              </>
            )}
          </g>
        );
      })}

      {/* Etiquetas de planos (encima de los átomos) */}
      {planes.map((p, i) => {
        if (!p.label) return null;
        const g = planeDrawing(p.hkl);
        const c = g.polygon.reduce<[number, number]>((s, q) => { const [x, y] = project(q); return [s[0] + x / g.polygon.length, s[1] + y / g.polygon.length]; }, [0, 0]);
        return (
          <SvgIdx key={i} v={p.hkl} kind="plane" x={c[0]} y={c[1] + 4} color="var(--text)" anchor="middle" />
        );
      })}

      {coords &&
        CORNERS.map((c, i) => {
          const [x, y] = project(c);
          const right = c[1] === 1;
          return (
            <text key={i} x={x + (right ? 7 : -7)} y={y + (c[2] === 1 ? -6 : 14)} fontSize={9.5} fill="var(--text-muted)"
              textAnchor={right ? 'start' : 'end'} className="mono">
              ({c.map(fmt).join(',')})
            </text>
          );
        })}
    </svg>
  );
}
