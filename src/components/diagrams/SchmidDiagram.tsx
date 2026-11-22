/**
 * Esquema de la Ley de Schmid: probeta cilíndrica con eje de carga, plano de
 * deslizamiento (intersección exacta plano–cilindro), normal, dirección de
 * deslizamiento y arcos φ y λ. Se construye en 3D y se proyecta
 * ortográficamente; los ángulos mostrados se miden con src/core.
 */
import { useId } from 'react';
import { acuteAngleBetweenDeg, add, cross, degToRad, dot, normalize, scale, type Vec3 } from '../../core';

interface Props {
  title: string;
  /** Ángulo normal–eje de carga, en grados. */
  phi?: number;
  /** Ángulo dirección de deslizamiento–eje de carga, en grados (φ + λ ≥ 90°). */
  lambda?: number;
  load?: 'tension' | 'compression';
  width?: number;
  showValues?: boolean;
}

const R = 1;
const H = 1.55;
// Cámara elegida para que n̂, d̂ y el plano se vean sin escorzo excesivo.
const AZ = degToRad(80);
const EL = degToRad(24);
const CAM: Vec3 = [Math.cos(EL) * Math.cos(AZ), Math.cos(EL) * Math.sin(AZ), Math.sin(EL)];
const RIGHT: Vec3 = normalize(cross([0, 0, 1], CAM));
const UP: Vec3 = cross(CAM, RIGHT);
const K = 62;
const P = (p: Vec3): [number, number] => [dot(p, RIGHT) * K, -dot(p, UP) * K];
const path = (ps: Vec3[], close = false) =>
  ps.map((p, i) => `${i ? 'L' : 'M'}${P(p)[0].toFixed(2)},${P(p)[1].toFixed(2)}`).join('') + (close ? 'Z' : '');

/** Interpolación esférica entre dos unitarios (para los arcos de ángulo). */
function slerp(a: Vec3, b: Vec3, t: number): Vec3 {
  const om = Math.acos(Math.min(1, Math.max(-1, dot(a, b))));
  if (om < 1e-6) return a;
  return add(scale(a, Math.sin((1 - t) * om) / Math.sin(om)), scale(b, Math.sin(t * om) / Math.sin(om)));
}
const arc = (a: Vec3, b: Vec3, r: number) => Array.from({ length: 33 }, (_, i) => scale(slerp(a, b, i / 32), r));

export function SchmidDiagram({ title, phi = 38, lambda = 62, load = 'tension', width = 340, showValues = true }: Props) {
  const uid = useId().replace(/:/g, '');
  const ez: Vec3 = [0, 0, 1];
  const sp = Math.sin(degToRad(phi));
  const n: Vec3 = [sp, 0, Math.cos(degToRad(phi))];
  // d en el plano: d = cosβ·e1 + sinβ·e2, con cos λ = d·z = −cosβ·sin φ.
  const e1: Vec3 = [Math.cos(degToRad(phi)), 0, -sp];
  const e2: Vec3 = [0, 1, 0];
  const cb = Math.max(-1, Math.min(1, -Math.cos(degToRad(lambda)) / sp));
  const d: Vec3 = normalize(add(scale(e1, cb), scale(e2, Math.sqrt(1 - cb * cb))));

  const ring = (z: number) => Array.from({ length: 73 }, (_, i) => { const t = (i / 72) * 2 * Math.PI; return [R * Math.cos(t), R * Math.sin(t), z] as Vec3; });
  // Intersección exacta del plano n·p = 0 con la superficie del cilindro.
  const ellipse = Array.from({ length: 97 }, (_, i) => {
    const t = (i / 96) * 2 * Math.PI;
    const x = R * Math.cos(t), y = R * Math.sin(t);
    return [x, y, -(n[0] * x + n[1] * y) / n[2]] as Vec3;
  });
  // Siluetas laterales del cilindro: puntos del círculo con tangente paralela a la vista.
  const side = Math.atan2(RIGHT[1], RIGHT[0]);
  const sA: Vec3 = [R * Math.cos(side), R * Math.sin(side), 0];
  const sB: Vec3 = [-sA[0], -sA[1], 0];

  const tension = load === 'tension';
  const fTop: [Vec3, Vec3] = tension ? [[0, 0, H + 0.15], [0, 0, H + 1.0]] : [[0, 0, H + 1.0], [0, 0, H + 0.15]];
  const fBot: [Vec3, Vec3] = tension ? [[0, 0, -H - 0.15], [0, 0, -H - 1.0]] : [[0, 0, -H - 1.0], [0, 0, -H - 0.15]];
  const phiMeas = acuteAngleBetweenDeg(ez, n);
  const lamMeas = acuteAngleBetweenDeg(ez, d);
  const lab = (p: Vec3) => P(p);
  const arrow = (a: Vec3, b: Vec3, color: string, w = 2.4, dash?: string) => {
    const [x1, y1] = P(a); const [x2, y2] = P(b);
    return <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth={w} strokeDasharray={dash} markerEnd={`url(#${uid}-${color.replace(/\W/g, '')})`} />;
  };
  const COLORS = ['var(--c-load)', 'var(--c-normal)', 'var(--c-slip)'];

  return (
    <svg viewBox="-150 -200 300 400" width={width} role="img" aria-label={title} style={{ maxWidth: '100%', height: 'auto' }}>
      <title>{title}</title>
      <defs>
        {COLORS.map((c) => (
          <marker key={c} id={`${uid}-${c.replace(/\W/g, '')}`} viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="6.5" markerHeight="6.5" orient="auto-start-reverse">
            <path d="M0,0 L10,5 L0,10 z" fill={c} />
          </marker>
        ))}
        <linearGradient id={`${uid}-body`} x1="0" x2="1">
          <stop offset="0" stopColor="#3b4c60" stopOpacity="0.55" />
          <stop offset="0.45" stopColor="#8fa6bd" stopOpacity="0.32" />
          <stop offset="1" stopColor="#253241" stopOpacity="0.6" />
        </linearGradient>
      </defs>

      {/* Cuerpo de la probeta */}
      <polygon points={[add(sA, [0, 0, -H]), add(sA, [0, 0, H]), add(sB, [0, 0, H]), add(sB, [0, 0, -H])].map((p) => P(p).join(',')).join(' ')}
        fill={`url(#${uid}-body)`} />
      <path d={path(ring(-H), true)} fill="#2b3a4b" fillOpacity={0.6} stroke="var(--text-faint)" strokeWidth={1.2} />
      <path d={path(ring(H), true)} fill="#4a5f76" fillOpacity={0.55} stroke="var(--text-muted)" strokeWidth={1.2} />
      {[sA, sB].map((s, i) => { const [x1, y1] = P(add(s, [0, 0, -H])); const [x2, y2] = P(add(s, [0, 0, H])); return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="var(--text-muted)" strokeWidth={1.2} />; })}

      {/* Eje de carga */}
      {(() => { const [x1, y1] = P([0, 0, -H - 0.1]); const [x2, y2] = P([0, 0, H + 0.1]); return <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="var(--c-load)" strokeWidth={1.2} strokeDasharray="5 4" opacity={0.8} />; })()}

      {/* Plano de deslizamiento */}
      <path d={path(ellipse, true)} fill="var(--c-plane)" fillOpacity={0.3} stroke="var(--c-plane)" strokeWidth={1.8} />

      {/* Arcos */}
      <path d={path(arc(ez, n, 0.62))} fill="none" stroke="var(--c-phi)" strokeWidth={2} />
      <path d={path(arc(ez, d, 0.95))} fill="none" stroke="var(--c-lambda)" strokeWidth={2} />

      {/* Vectores */}
      {arrow([0, 0, 0], [0, 0, 1.45], 'var(--c-load)', 2)}
      {arrow([0, 0, 0], scale(n, 1.45), 'var(--c-normal)')}
      {arrow([0, 0, 0], scale(d, 1.35), 'var(--c-slip)')}

      {/* Fuerzas aplicadas */}
      {arrow(fTop[0], fTop[1], 'var(--c-load)', 3.2)}
      {arrow(fBot[0], fBot[1], 'var(--c-load)', 3.2)}

      {/* Etiquetas */}
      {(() => { const [x, y] = lab(scale(slerp(ez, n, 0.5), 0.78)); return <text x={x} y={y + 4} fill="var(--c-phi)" fontSize={15} fontWeight={700} textAnchor="middle" paintOrder="stroke" stroke="var(--bg)" strokeWidth={3}>φ</text>; })()}
      {(() => { const [x, y] = lab(scale(slerp(ez, d, 0.5), 1.12)); return <text x={x} y={y + 4} fill="var(--c-lambda)" fontSize={15} fontWeight={700} textAnchor="middle" paintOrder="stroke" stroke="var(--bg)" strokeWidth={3}>λ</text>; })()}
      {(() => { const [x, y] = lab(scale(n, 1.5)); return <text x={x + (x < 0 ? -4 : 4)} y={y - 6} fill="var(--c-normal)" fontSize={11} fontWeight={600} textAnchor={x < 0 ? 'end' : 'start'} paintOrder="stroke" stroke="var(--bg)" strokeWidth={3}>normal n̂</text>; })()}
      {(() => { const [x, y] = lab(scale(d, 1.4)); return <text x={x + (x < 0 ? -4 : 4)} y={y - 6} fill="var(--c-slip)" fontSize={11} fontWeight={600} textAnchor={x < 0 ? 'end' : 'start'} paintOrder="stroke" stroke="var(--bg)" strokeWidth={3}>dirección d̂</text>; })()}
      {(() => { const [x, y] = lab([0, 0, H + 1.08]); return <text x={x + 10} y={y + 10} fill="var(--c-load)" fontSize={12} fontWeight={700}>{tension ? 'F (tensión)' : 'F (compresión)'}</text>; })()}
      {(() => {
        const low = ellipse.reduce((a, b) => (P(b)[1] > P(a)[1] ? b : a));
        const [x, y] = P(low);
        return <text x={x} y={y + 16} fill="var(--c-plane)" fontSize={11} fontWeight={600} textAnchor="middle" paintOrder="stroke" stroke="var(--bg)" strokeWidth={3}>plano de deslizamiento</text>;
      })()}
      {showValues && (
        <text x={-140} y={188} fill="var(--text-muted)" fontSize={11} className="mono">
          φ = {phiMeas.toFixed(1)}°   λ = {lamMeas.toFixed(1)}°   φ + λ = {(phiMeas + lamMeas).toFixed(1)}°
        </text>
      )}
    </svg>
  );
}
