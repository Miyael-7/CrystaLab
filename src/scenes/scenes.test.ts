import { describe, expect, it } from 'vitest';
import {
  acuteAngleBetweenDeg,
  applyMat,
  dot,
  norm,
  normalize,
  planeDrawing,
  schmidFactor,
  specimenRotation,
  sub,
  type Indices,
  type Mat3,
  type Vec3,
} from '../core';
import { buildMillerScene } from './millerScene';
import type { ArrowPrim, LabelPrim, LinePrim, PolygonPrim, Prim } from './primitives';
import { effectiveFov, toThree } from './primitives';
import { buildSchmidScene, SPECIMEN } from './schmidScene';
import { atomSites, buildSystemsScene } from './systemsScene';

const get = <T extends Prim>(prims: Prim[], id: string) => prims.find((p) => p.id === id) as T;
const planeDrawingD = (h: Indices) => planeDrawing(h).d;
const close = (a: Vec3, b: Vec3, d = 9) => a.forEach((x, i) => expect(x).toBeCloseTo(b[i]!, d));

describe('conversión a Three.js', () => {
  it('es una rotación propia (conserva la orientación de los ejes)', () => {
    const X = toThree([1, 0, 0]);
    const Y = toThree([0, 1, 0]);
    const Zt = toThree([0, 0, 1]);
    const det = X[0] * (Y[1] * Zt[2] - Y[2] * Zt[1]) - X[1] * (Y[0] * Zt[2] - Y[2] * Zt[0]) + X[2] * (Y[0] * Zt[1] - Y[1] * Zt[0]);
    expect(det).toBe(1);
    expect(Zt).toEqual([0, 1, 0]); // z del cristal = arriba en Three.js
  });
});

describe('escena de Miller', () => {
  const base = { showFamily: false, showCoords: false, showIntercepts: true, showNormal: true };

  it.each<[Indices]>([[[1, 0, 0]], [[-1, 1, 0]], [[1, 2, 3]], [[-1, -1, 1]]])('dirección %j: la flecha va de inicio a punta', (uvw) => {
    const s = buildMillerScene({ ...base, mode: 'direction', indices: uvw });
    const a = get<ArrowPrim>(s.prims, 'dir');
    close(normalize(sub(a.to, a.from)), normalize(uvw));
    expect(get<LabelPrim>(s.prims, 'dir-label').idx!.v).toEqual(uvw);
  });

  it('dirección [1̄10]: inicio (1,0,0) y punta (0,1,0)', () => {
    const s = buildMillerScene({ ...base, mode: 'direction', indices: [-1, 1, 0] });
    const a = get<ArrowPrim>(s.prims, 'dir');
    close(a.from, [1, 0, 0]);
    close(a.to, [0, 1, 0]);
  });

  it('plano (111): polígono sobre el plano y normal paralela a [111]', () => {
    const s = buildMillerScene({ ...base, mode: 'plane', indices: [1, 1, 1] });
    const p = get<PolygonPrim>(s.prims, 'plane');
    expect(p.points).toHaveLength(3);
    p.points.forEach((q) => expect(dot([1, 1, 1], q)).toBeCloseTo(1, 9));
    const nrm = get<ArrowPrim>(s.prims, 'normal');
    close(normalize(sub(nrm.to, nrm.from)), normalize([1, 1, 1]));
  });

  it('familias: <111> dibuja 7 direcciones extra y {111} 3 planos extra', () => {
    const d = buildMillerScene({ ...base, showFamily: true, mode: 'direction', indices: [1, 1, 1] });
    expect(d.prims.filter((p) => p.id.startsWith('fam'))).toHaveLength(7);
    const pl = buildMillerScene({ ...base, showFamily: true, mode: 'plane', indices: [1, 1, 1] });
    expect(pl.prims.filter((p) => p.id.startsWith('famp'))).toHaveLength(3);
  });

  it('plano (1̄11): muestra el origen trasladado e intersecciones x = −1, y = 1, z = 1', () => {
    const s = buildMillerScene({ ...base, mode: 'plane', indices: [-1, 1, 1] });
    expect(s.prims.some((p) => p.id === 'origin-shift')).toBe(true);
    const texts = s.prims.filter((p): p is LabelPrim => p.kind === 'label' && p.id.startsWith('int-l')).map((l) => l.text);
    expect(texts).toEqual(['x = −1', 'y = 1', 'z = 1']);
  });
});

describe('escena de Schmid', () => {
  // BCC, eje [121], (110)[1̄11]: φ = 30°, λ = 61.87°
  const plane: Indices = [1, 1, 0];
  const dir: Indices = [-1, 1, 1];
  const load: Vec3 = [1, 2, 1];
  const R = specimenRotation(load, plane, dir);
  const sf = schmidFactor(plane, dir, load);
  const scene = buildSchmidScene({
    normal: applyMat(R, normalize(plane)),
    slip: applyMat(R, normalize(dir)),
    load: 'tension',
    phiDeg: sf.phiAcuteDeg,
    lambdaDeg: sf.lambdaAcuteDeg,
    state: 'inactive',
    rotation: R,
    planeIdx: plane,
    dirIdx: dir,
  });

  it('las flechas dibujadas forman exactamente φ y λ con el eje de carga', () => {
    const n = get<ArrowPrim>(scene.prims, 'normal');
    const d = get<ArrowPrim>(scene.prims, 'slip');
    expect(acuteAngleBetweenDeg([0, 0, 1], n.to)).toBeCloseTo(sf.phiAcuteDeg, 9);
    expect(acuteAngleBetweenDeg([0, 0, 1], d.to)).toBeCloseTo(sf.lambdaAcuteDeg, 9);
    expect(dot(n.to, d.to)).toBeCloseTo(0, 9); // n̂ ⊥ d̂
  });

  it('los arcos de φ y λ van del eje de carga a la normal y a la dirección', () => {
    const aPhi = get<LinePrim>(scene.prims, 'arc-phi');
    const aLam = get<LinePrim>(scene.prims, 'arc-lambda');
    expect(acuteAngleBetweenDeg([0, 0, 1], aPhi.points[0]!)).toBeCloseTo(0, 6);
    expect(acuteAngleBetweenDeg(scene.normalUp, aPhi.points[aPhi.points.length - 1]!)).toBeCloseTo(0, 6);
    expect(acuteAngleBetweenDeg(scene.slipUp, aLam.points[aLam.points.length - 1]!)).toBeCloseTo(0, 6);
  });

  it('las etiquetas muestran los valores de φ y λ', () => {
    expect(get<LabelPrim>(scene.prims, 'phi-l').text).toBe('φ = 30°');
    expect(get<LabelPrim>(scene.prims, 'lambda-l').text).toBe('λ = 61.9°');
  });

  it('el plano de deslizamiento está contenido en la probeta y es perpendicular a la normal', () => {
    const p = get<PolygonPrim>(scene.prims, 'slip-plane');
    p.points.forEach((q) => {
      expect(dot(scene.normalUp, q)).toBeCloseTo(0, 9);
      expect(Math.hypot(q[0], q[1])).toBeLessThanOrEqual(SPECIMEN.radius + 1e-9);
      expect(Math.abs(q[2])).toBeLessThanOrEqual(SPECIMEN.halfHeight + 1e-9);
    });
  });

  it('tensión: fuerzas hacia afuera; compresión: hacia adentro', () => {
    const t = get<ArrowPrim>(scene.prims, 'force-top');
    expect(t.to[2]).toBeGreaterThan(t.from[2]);
    const c = buildSchmidScene({ normal: [0, 0.6, 0.8], slip: [1, 0, 0], load: 'compression', phiDeg: 36.87, lambdaDeg: 90, state: null });
    const ct = get<ArrowPrim>(c.prims, 'force-top');
    expect(ct.to[2]).toBeLessThan(ct.from[2]);
  });

  it('los ejes del cristal están rotados: [121] queda vertical', () => {
    const ex = get<ArrowPrim>(scene.prims, 'cr-[100]');
    const ey = get<ArrowPrim>(scene.prims, 'cr-[010]');
    const ez = get<ArrowPrim>(scene.prims, 'cr-[001]');
    const v = (a: ArrowPrim) => normalize(sub(a.to, a.from));
    const axis121 = normalize([v(ex), v(ey), v(ez)].reduce<Vec3>((s, w, i) => [s[0] + w[0] * [1, 2, 1][i]!, s[1] + w[1] * [1, 2, 1][i]!, s[2] + w[2] * [1, 2, 1][i]!], [0, 0, 0]));
    close(axis121, [0, 0, 1]);
    expect(norm(sub(ex.to, ex.from))).toBeCloseTo(0.42, 9);
  });
});

describe('campo de visión adaptable', () => {
  it('no cambia en visores horizontales y se amplía en verticales', () => {
    expect(effectiveFov(38, 1.6)).toBe(38);
    expect(effectiveFov(38, 1)).toBe(38);
    const v = effectiveFov(38, 0.5);
    // ancho visible con aspecto 0.5 = ancho visible con aspecto 1 y 38°
    expect(Math.tan((v * Math.PI) / 360) * 0.5).toBeCloseTo(Math.tan((38 * Math.PI) / 360), 9);
    expect(effectiveFov(38, 0.05)).toBe(80);
  });
});

describe('etiquetas de n̂ y d̂ coherentes con el sentido dibujado', () => {
  const transpose = (R: Mat3): Mat3 => [[R[0][0], R[1][0], R[2][0]], [R[0][1], R[1][1], R[2][1]], [R[0][2], R[1][2], R[2][2]]];
  it.each<[string, Indices, Indices, Vec3]>([
    ['BCC [121]', [1, 1, 0], [-1, 1, 1], [1, 2, 1]],
    ['BCC [123]', [1, 0, 1], [1, -1, -1], [1, 2, 3]],
    ['coplanar', [1, 0, 1], [-1, 0, 1], [1, 0, 0]],
    ['normal hacia abajo', [-1, -1, -1], [1, -1, 0], [1, 2, 3]],
  ])('%s: cada flecha apunta en el sentido de los índices de su etiqueta', (_n, plane, dir, load) => {
    const R = specimenRotation(load, plane, dir);
    const sf = schmidFactor(plane, dir, load);
    const sc = buildSchmidScene({ normal: applyMat(R, normalize(plane)), slip: applyMat(R, normalize(dir)), load: 'tension', phiDeg: sf.phiAcuteDeg, lambdaDeg: sf.lambdaAcuteDeg, state: null, rotation: R, planeIdx: plane, dirIdx: dir });
    const back = (id: string) => applyMat(transpose(R), get<ArrowPrim>(sc.prims, id).to); // de la probeta al cristal
    expect(dot(back('slip'), get<LabelPrim>(sc.prims, 'slip-l').idx!.v)).toBeGreaterThan(0);
    expect(dot(back('normal'), get<LabelPrim>(sc.prims, 'normal-l').idx!.v)).toBeGreaterThan(0);
  });

  it('BCC [123]: la flecha verde se etiqueta [1̄11] (sentido hacia arriba de [11̄1̄])', () => {
    const plane: Indices = [1, 0, 1];
    const dir: Indices = [1, -1, -1];
    const R = specimenRotation([1, 2, 3], plane, dir);
    const sf = schmidFactor(plane, dir, [1, 2, 3]);
    const sc = buildSchmidScene({ normal: applyMat(R, normalize(plane)), slip: applyMat(R, normalize(dir)), load: 'tension', phiDeg: sf.phiAcuteDeg, lambdaDeg: sf.lambdaAcuteDeg, state: null, rotation: R, planeIdx: plane, dirIdx: dir });
    expect(get<LabelPrim>(sc.prims, 'slip-l').idx!.v).toEqual([-1, 1, 1]);
  });
});

describe('escena del comparador', () => {
  it('FCC tiene 14 átomos y BCC 9', () => {
    expect(atomSites('FCC')).toHaveLength(14);
    expect(atomSites('BCC')).toHaveLength(9);
  });

  it('el sistema seleccionado: dirección contenida en el plano y normal ⊥ plano', () => {
    const s = buildSystemsScene({ structure: 'BCC', load: [1, 2, 3], plane: [1, 0, 1], direction: [1, -1, -1] });
    const plane = get<PolygonPrim>(s.prims, 'plane');
    plane.points.forEach((q) => expect(dot([1, 0, 1], q)).toBeCloseTo(planeDrawingD([1, 0, 1]), 9));
    const sl = get<ArrowPrim>(s.prims, 'slip');
    expect(dot([1, 0, 1], sub(sl.to, sl.from))).toBeCloseTo(0, 12);
    expect(dot([1, 0, 1], sl.from)).toBeCloseTo(planeDrawingD([1, 0, 1]), 9); // apoyada sobre el plano
    const ld = get<ArrowPrim>(s.prims, 'load-arrow');
    close(normalize(sub(ld.to, ld.from)), normalize([1, 2, 3]));
  });

  it('sin sistema seleccionado no dibuja plano', () => {
    const s = buildSystemsScene({ structure: 'FCC', load: [1, 0, 0] });
    expect(s.prims.some((p) => p.id === 'plane')).toBe(false);
    expect(s.planeCenter).toBe(null);
  });
});
