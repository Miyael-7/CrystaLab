/**
 * Escena del comparador FCC/BCC (función pura), en el marco del cristal:
 * celda unitaria con sus átomos, dirección de carga y el sistema seleccionado
 * (plano, normal y dirección de deslizamiento).
 */
import { add, dot, normalize, planeDrawing, scale, sub, type Indices, type Structure, type Vec3 } from '../core';
import { PALETTE } from '../styles/palette';
import { MILLER_CAMERA } from './millerScene';
import type { Prim, SceneDescription } from './primitives';

const CORNERS: Vec3[] = [
  [0, 0, 0], [1, 0, 0], [0, 1, 0], [1, 1, 0],
  [0, 0, 1], [1, 0, 1], [0, 1, 1], [1, 1, 1],
];
const EDGES: [number, number][] = [
  [0, 1], [2, 3], [4, 5], [6, 7], [0, 2], [1, 3], [4, 6], [5, 7], [0, 4], [1, 5], [2, 6], [3, 7],
];
const CENTER: Vec3 = [0.5, 0.5, 0.5];

export function atomSites(structure: Structure): Vec3[] {
  const s: Vec3[] = [...CORNERS];
  if (structure === 'BCC') s.push(CENTER);
  else s.push([0.5, 0.5, 0], [0.5, 0.5, 1], [0.5, 0, 0.5], [0.5, 1, 0.5], [0, 0.5, 0.5], [1, 0.5, 0.5]);
  return s;
}

export interface SystemsSceneInput {
  structure: Structure;
  load: Vec3;
  plane?: Indices;
  direction?: Indices;
}

export interface SystemsScene extends SceneDescription {
  /** Centro del plano dibujado (donde se apoyan n̂ y d̂). */
  planeCenter: Vec3 | null;
}

export function buildSystemsScene(s: SystemsSceneInput): SystemsScene {
  const prims: Prim[] = [];
  EDGES.forEach(([a, b], i) => prims.push({ kind: 'line', id: `edge${i}`, points: [CORNERS[a]!, CORNERS[b]!], color: PALETTE.edge, width: 1.4 }));
  atomSites(s.structure).forEach((p, i) =>
    prims.push({ kind: 'sphere', id: `atom${i}`, center: p, radius: s.structure === 'FCC' ? 0.085 : 0.1, color: PALETTE.vertex, opacity: 0.55 }),
  );
  ([
    ['x', [1.3, 0, 0], PALETTE.axisX],
    ['y', [0, 1.3, 0], PALETTE.axisY],
    ['z', [0, 0, 1.3], PALETTE.axisZ],
  ] as const).forEach(([name, end, color]) => {
    prims.push({ kind: 'arrow', id: `axis-${name}`, from: [0, 0, 0], to: end, color, radius: 0.007, opacity: 0.85 });
    prims.push({ kind: 'label', id: `axis-l-${name}`, position: scale(end, 1.1), color, text: name, size: 'md' });
  });

  // Dirección de carga a través del centro de la celda.
  const e = normalize(s.load);
  prims.push({ kind: 'line', id: 'load-line', points: [sub(CENTER, scale(e, 1.05)), add(CENTER, scale(e, 1.05))], color: PALETTE.load, width: 1.5, dashed: true, opacity: 0.85 });
  prims.push({ kind: 'arrow', id: 'load-arrow', from: add(CENTER, scale(e, 0.75)), to: add(CENTER, scale(e, 1.15)), color: PALETTE.load, radius: 0.016 });
  prims.push({ kind: 'arrow', id: 'load-arrow-2', from: sub(CENTER, scale(e, 0.75)), to: sub(CENTER, scale(e, 1.15)), color: PALETTE.load, radius: 0.016 });
  prims.push({ kind: 'label', id: 'load-l', position: add(CENTER, scale(e, 1.3)), color: PALETTE.load, text: 'carga', size: 'sm' });

  let planeCenter: Vec3 | null = null;
  if (s.plane && s.direction) {
    const g = planeDrawing(s.plane);
    const c = scale(g.polygon.reduce<Vec3>((acc, p) => add(acc, p), [0, 0, 0]), 1 / g.polygon.length);
    planeCenter = c;
    const n = normalize(s.plane);
    const d = normalize(s.direction);
    prims.push({ kind: 'polygon', id: 'plane', points: g.polygon, color: PALETTE.plane, opacity: 0.45, outline: true });
    prims.push({ kind: 'arrow', id: 'normal', from: c, to: add(c, scale(n, 0.42)), color: PALETTE.normal, radius: 0.012 });
    prims.push({ kind: 'arrow', id: 'slip', from: sub(c, scale(d, 0.32)), to: add(c, scale(d, 0.32)), color: PALETTE.slip, radius: 0.014 });
    prims.push({ kind: 'label', id: 'normal-l', position: add(c, scale(n, 0.56)), color: PALETTE.normal, idx: { v: s.plane, kind: 'direction' }, suffix: ' n̂', size: 'sm' });
    prims.push({ kind: 'label', id: 'slip-l', position: add(c, scale(d, 0.46)), color: PALETTE.slip, idx: { v: s.direction, kind: 'direction' }, suffix: ' d̂', size: 'sm' });
    // Comprobación interna: la flecha de deslizamiento está en el plano.
    if (Math.abs(dot(n, d)) > 1e-9) throw new Error('La dirección de deslizamiento no pertenece al plano.');
  }
  return { prims, camera: MILLER_CAMERA, planeCenter };
}
