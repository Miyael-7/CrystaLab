/** Escena del simulador de Índices de Miller (función pura). */
import {
  add,
  canonicalSign,
  directionDrawing,
  familyMembers,
  frac,
  normalize,
  planeDrawing,
  scale,
  sub,
  type Indices,
  type Vec3,
} from '../core';
import { PALETTE } from '../styles/palette';
import type { Prim, SceneDescription } from './primitives';

export type MillerMode = 'direction' | 'plane';

export interface MillerSceneOptions {
  mode: MillerMode;
  indices: Indices;
  showFamily: boolean;
  showCoords: boolean;
  showIntercepts: boolean;
  showNormal: boolean;
}

const CORNERS: Vec3[] = [
  [0, 0, 0], [1, 0, 0], [0, 1, 0], [1, 1, 0],
  [0, 0, 1], [1, 0, 1], [0, 1, 1], [1, 1, 1],
];
const EDGES: [number, number][] = [
  [0, 1], [2, 3], [4, 5], [6, 7], [0, 2], [1, 3], [4, 6], [5, 7], [0, 4], [1, 5], [2, 6], [3, 7],
];

export const MILLER_CAMERA = { position: [4.1, 2.35, 2.15] as Vec3, target: [0.5, 0.55, 0.5] as Vec3, fov: 36 };

const coord = (p: Vec3) => `(${p.map(frac).join(', ')})`;
const same = (a: Indices, b: Indices) => a[0] === b[0] && a[1] === b[1] && a[2] === b[2];

export function buildMillerScene(o: MillerSceneOptions): SceneDescription {
  const prims: Prim[] = [];

  // Celda unitaria
  EDGES.forEach(([a, b], i) =>
    prims.push({ kind: 'line', id: `edge${i}`, points: [CORNERS[a]!, CORNERS[b]!], color: PALETTE.edge, width: 1.5 }),
  );
  CORNERS.forEach((c, i) => {
    prims.push({ kind: 'sphere', id: `v${i}`, center: c, radius: 0.022, color: PALETTE.vertex });
    if (o.showCoords) {
      prims.push({ kind: 'label', id: `vl${i}`, position: add(c, [0.06, 0.06, 0.07]), color: PALETTE.muted, text: coord(c), size: 'sm' });
    }
  });

  // Ejes cristalográficos
  const AX = 1.35;
  ([
    ['x', [AX, 0, 0], PALETTE.axisX],
    ['y', [0, AX, 0], PALETTE.axisY],
    ['z', [0, 0, AX], PALETTE.axisZ],
  ] as const).forEach(([name, end, color]) => {
    prims.push({ kind: 'arrow', id: `axis-${name}`, from: [0, 0, 0], to: end, color, radius: 0.008, opacity: 0.9 });
    prims.push({ kind: 'label', id: `axis-l-${name}`, position: scale(end, 1.09), color, text: name, size: 'md' });
  });

  if (o.mode === 'direction') {
    const g = directionDrawing(o.indices);
    if (o.showFamily) {
      familyMembers(o.indices)
        .filter((m) => !same(m, o.indices))
        .forEach((m, i) => {
          const f = directionDrawing(m);
          prims.push({ kind: 'arrow', id: `fam${i}`, from: f.origin, to: f.tip, color: PALETTE.family, radius: 0.007, opacity: 0.4 });
        });
    }
    const shifted = g.origin.some((v) => v !== 0);
    prims.push({ kind: 'arrow', id: 'dir', from: g.origin, to: g.tip, color: PALETTE.accent, radius: 0.012 });
    prims.push({ kind: 'sphere', id: 'dir-origin', center: g.origin, radius: shifted ? 0.04 : 0.03, color: PALETTE.accent });
    prims.push({ kind: 'label', id: 'dir-label', position: add(g.tip, scale(g.unit, 0.16)), color: PALETTE.accent, idx: { v: o.indices, kind: 'direction' }, size: 'md' });
    prims.push({ kind: 'label', id: 'dir-start', position: add(g.origin, [0.05, -0.05, -0.12]), color: PALETTE.accent, text: `inicio ${coord(g.origin)}${shifted ? ' · origen trasladado' : ''}`, size: 'sm' });
    prims.push({ kind: 'label', id: 'dir-tip', position: add(g.tip, [0.05, 0.05, -0.12]), color: PALETTE.accent, text: `punta ${coord(g.tip)}`, size: 'sm' });
  } else {
    const g = planeDrawing(o.indices);
    if (o.showFamily) {
      const main = canonicalSign(o.indices);
      familyMembers(o.indices, false)
        .filter((m) => !same(canonicalSign(m), main))
        .forEach((m, i) => {
          prims.push({ kind: 'polygon', id: `famp${i}`, points: planeDrawing(m).polygon, color: PALETTE.family, opacity: 0.1, outline: true });
        });
    }
    prims.push({ kind: 'polygon', id: 'plane', points: g.polygon, color: PALETTE.plane, opacity: 0.42, outline: true });
    const c = scale(g.polygon.reduce<Vec3>((s, p) => add(s, p), [0, 0, 0]), 1 / g.polygon.length);
    prims.push({ kind: 'label', id: 'plane-label', position: add(c, [0, 0, 0.0]), color: PALETTE.text, idx: { v: o.indices, kind: 'plane' }, size: 'md' });

    if (o.showIntercepts) {
      if (g.origin.some((v) => v !== 0)) {
        prims.push({ kind: 'sphere', id: 'origin-shift', center: g.origin, radius: 0.04, color: PALETTE.plane });
        prims.push({ kind: 'label', id: 'origin-shift-l', position: add(g.origin, [0.08, -0.08, -0.1]), color: PALETTE.plane, text: `origen trasladado ${coord(g.origin)}`, size: 'sm' });
      }
      const axes = ['x', 'y', 'z'];
      g.interceptPoints.forEach((p, i) => {
        const axis = [0, 1, 2].filter((k) => Number.isFinite(g.intercepts[k]!))[i]!;
        prims.push({ kind: 'sphere', id: `int${i}`, center: p, radius: 0.035, color: PALETTE.plane });
        const away = normalize(sub(p, [0.5, 0.5, 0.5]));
        prims.push({ kind: 'label', id: `int-l${i}`, position: add(p, scale(away, 0.2)), color: PALETTE.plane, text: `${axes[axis]} = ${frac(g.intercepts[axis]!)}`, size: 'sm' });
      });
    }
    if (o.showNormal) {
      const tip = add(c, scale(normalize(o.indices), 0.5));
      prims.push({ kind: 'arrow', id: 'normal', from: c, to: tip, color: PALETTE.normal, radius: 0.012 });
      prims.push({ kind: 'label', id: 'normal-l', position: add(tip, scale(normalize(o.indices), 0.12)), color: PALETTE.normal, idx: { v: o.indices, kind: 'direction' }, suffix: ' normal', size: 'sm' });
    }
  }

  return { prims, camera: MILLER_CAMERA };
}
