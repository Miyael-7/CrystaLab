/** Escena del simulador de la Ley de Schmid (función pura). */
import {
  acuteTo,
  add,
  applyMat,
  arcPoints,
  cylinderSection,
  dot,
  formatNumber,
  normalize,
  scale,
  type ActivationState,
  type Indices,
  type LoadType,
  type Mat3,
  type Vec3,
} from '../core';
import { PALETTE } from '../styles/palette';
import type { Prim, SceneDescription } from './primitives';

export const SPECIMEN = { radius: 0.55, halfHeight: 1.5 };
export const SCHMID_CAMERA = { position: [6.4, 3.3, 2.3] as Vec3, target: [0, 0, 0.05] as Vec3, fov: 38 };

export interface SchmidSceneInput {
  /** Normal y dirección de deslizamiento en el marco de la probeta (z = eje de carga). */
  normal: Vec3;
  slip: Vec3;
  load: LoadType;
  phiDeg: number;
  lambdaDeg: number;
  state: ActivationState | null;
  /** Rotación cristal → probeta, para dibujar los ejes del cristal (opcional). */
  rotation?: Mat3 | null;
  planeIdx?: Indices;
  dirIdx?: Indices;
}

export interface SchmidScene extends SceneDescription {
  /** Normal y dirección orientadas con ángulo agudo respecto a +z (las que se dibujan). */
  normalUp: Vec3;
  slipUp: Vec3;
}

const Z: Vec3 = [0, 0, 1];

export function buildSchmidScene(s: SchmidSceneInput): SchmidScene {
  const { radius: R, halfHeight: H } = SPECIMEN;
  const n = acuteTo(normalize(s.normal), Z);
  const d = acuteTo(normalize(s.slip), Z);
  // Si una flecha se dibuja en sentido opuesto (para mostrar ángulos agudos),
  // su etiqueta debe mostrar los índices de ese sentido: [ūv̄w̄] en lugar de [uvw].
  const flipN = dot(normalize(s.normal), Z) < 0;
  const flipD = dot(normalize(s.slip), Z) < 0;
  const neg = (v: Indices): Indices => [-v[0] || 0, -v[1] || 0, -v[2] || 0];
  const planeLabel = s.planeIdx ? (flipN ? neg(s.planeIdx) : s.planeIdx) : undefined;
  const dirLabel = s.dirIdx ? (flipD ? neg(s.dirIdx) : s.dirIdx) : undefined;
  const prims: Prim[] = [];
  const active = s.state === 'active';
  const tension = s.load === 'tension';

  // Probeta dividida por el plano de deslizamiento (la mitad superior se anima).
  prims.push({ kind: 'cylinder', id: 'body-low', radius: R, halfHeight: H, color: PALETTE.specimen, opacity: 0.22, clip: { normal: n, keep: 'below' } });
  prims.push({ kind: 'cylinder', id: 'body-up', radius: R, halfHeight: H, color: PALETTE.specimen, opacity: 0.22, clip: { normal: n, keep: 'above' }, group: 'upper' });

  // Bordes de las tapas.
  const ring = (z: number): Vec3[] => Array.from({ length: 73 }, (_, i) => [R * Math.cos((i / 72) * 2 * Math.PI), R * Math.sin((i / 72) * 2 * Math.PI), z]);
  prims.push({ kind: 'line', id: 'ring-low', points: ring(-H), color: PALETTE.specimen, width: 1.5, opacity: 0.9 });
  prims.push({ kind: 'line', id: 'ring-up', points: ring(H), color: PALETTE.specimen, width: 1.5, opacity: 0.9, group: 'upper' });

  // Línea de referencia grabada en la superficie: se separa al deslizar.
  const az = Math.atan2(SCHMID_CAMERA.position[1], SCHMID_CAMERA.position[0]) - 0.35;
  const sx = R * 1.003 * Math.cos(az);
  const sy = R * 1.003 * Math.sin(az);
  const zc = Math.abs(n[2]) > 1e-6 ? Math.max(-H, Math.min(H, -(n[0] * sx + n[1] * sy) / n[2])) : 0;
  prims.push({ kind: 'line', id: 'ref-low', points: [[sx, sy, -H], [sx, sy, zc]], color: PALETTE.text, width: 2, opacity: 0.85 });
  prims.push({ kind: 'line', id: 'ref-up', points: [[sx, sy, zc], [sx, sy, H]], color: PALETTE.text, width: 2, opacity: 0.85, group: 'upper' });

  // Plano de deslizamiento (sección exacta plano–cilindro).
  const section = cylinderSection(n, R, H);
  prims.push({ kind: 'polygon', id: 'slip-plane', points: section, color: PALETTE.plane, opacity: active ? 0.62 : 0.4, outline: true });

  // Eje de carga y fuerzas aplicadas.
  prims.push({ kind: 'line', id: 'load-axis', points: [[0, 0, -H - 1.05], [0, 0, H + 1.05]], color: PALETTE.load, width: 1.5, dashed: true, opacity: 0.8 });
  const top: [Vec3, Vec3] = tension ? [[0, 0, H + 0.12], [0, 0, H + 0.95]] : [[0, 0, H + 0.95], [0, 0, H + 0.12]];
  const bot: [Vec3, Vec3] = tension ? [[0, 0, -H - 0.12], [0, 0, -H - 0.95]] : [[0, 0, -H - 0.95], [0, 0, -H - 0.12]];
  prims.push({ kind: 'arrow', id: 'force-top', from: top[0], to: top[1], color: PALETTE.load, radius: 0.035, group: 'upper' });
  prims.push({ kind: 'arrow', id: 'force-bot', from: bot[0], to: bot[1], color: PALETTE.load, radius: 0.035 });
  prims.push({ kind: 'label', id: 'force-l', position: [0, 0.75, H + 0.6], color: PALETTE.load, text: tension ? 'F · tensión' : 'F · compresión', size: 'md', group: 'upper' });

  // Vectores en el centro del plano.
  const L = 1.0;
  prims.push({ kind: 'arrow', id: 'axis-vec', from: [0, 0, 0], to: [0, 0, L], color: PALETTE.load, radius: 0.012 });
  prims.push({ kind: 'arrow', id: 'normal', from: [0, 0, 0], to: scale(n, L), color: PALETTE.normal, radius: 0.018 });
  prims.push({ kind: 'arrow', id: 'slip', from: [0, 0, 0], to: scale(d, L), color: PALETTE.slip, radius: 0.018 });
  prims.push({
    kind: 'label', id: 'normal-l', position: scale(n, L + 0.28), color: PALETTE.normal,
    ...(planeLabel ? { idx: { v: planeLabel, kind: 'direction' as const }, suffix: ' n̂' } : { text: 'n̂' }), size: 'sm',
  });
  prims.push({
    kind: 'label', id: 'slip-l', position: scale(d, L + 0.28), color: PALETTE.slip,
    ...(dirLabel ? { idx: { v: dirLabel, kind: 'direction' as const }, suffix: ' d̂' } : { text: 'd̂' }), size: 'sm',
  });

  // Arcos de φ y λ (ángulos agudos).
  const rPhi = 0.42;
  const rLam = 0.66;
  prims.push({ kind: 'line', id: 'arc-phi', points: arcPoints(Z, n, rPhi), color: PALETTE.phi, width: 3 });
  prims.push({ kind: 'line', id: 'arc-lambda', points: arcPoints(Z, d, rLam), color: PALETTE.lambda, width: 3 });
  const midPhi = arcPoints(Z, n, rPhi + 0.2, 2)[1]!;
  const midLam = arcPoints(Z, d, rLam + 0.3, 2)[1]!;
  prims.push({ kind: 'label', id: 'phi-l', position: midPhi, color: PALETTE.phi, text: `φ = ${formatNumber(s.phiDeg, 3)}°`, size: 'sm' });
  prims.push({ kind: 'label', id: 'lambda-l', position: midLam, color: PALETTE.lambda, text: `λ = ${formatNumber(s.lambdaDeg, 3)}°`, size: 'sm' });

  // Ejes del cristal (orientación cristalográfica dentro de la probeta).
  if (s.rotation) {
    const o: Vec3 = [0, -R - 0.75, -H + 0.15];
    ([
      ['[100]', [1, 0, 0], PALETTE.axisX],
      ['[010]', [0, 1, 0], PALETTE.axisY],
      ['[001]', [0, 0, 1], PALETTE.axisZ],
    ] as const).forEach(([name, v, color]) => {
      const w = applyMat(s.rotation!, v);
      prims.push({ kind: 'arrow', id: `cr-${name}`, from: o, to: add(o, scale(w, 0.42)), color, radius: 0.009 });
      prims.push({ kind: 'label', id: `cr-l-${name}`, position: add(o, scale(w, 0.56)), color, text: name, size: 'sm' });
    });
    prims.push({ kind: 'label', id: 'cr-title', position: add(o, [0, 0, -0.34]), color: PALETTE.muted, text: 'ejes del cristal', size: 'sm' });
  }

  return { prims, camera: SCHMID_CAMERA, normalUp: n, slipUp: d };
}
