import { describe, expect, it } from 'vitest';
import {
  canonicalSign,
  indexGlyphs,
  directionDrawing,
  familyMembers,
  formatIndices,
  parseIndices,
  planeDrawing,
  reduceIndices,
  sameFamily,
  validateIndices,
  type Indices,
} from './miller';
import { dot, normalize, type Vec3 } from './vector';

const close = (a: Vec3, b: Vec3, digits = 9) => a.forEach((x, i) => expect(x).toBeCloseTo(b[i]!, digits));
const inCell = (p: Vec3) => p.every((x) => x >= -1e-9 && x <= 1 + 1e-9);

describe('validación e interpretación de índices', () => {
  it('rechaza [000], no enteros y cantidad incorrecta', () => {
    expect(validateIndices([0, 0, 0]).ok).toBe(false);
    expect(validateIndices([1, 0.5, 0]).ok).toBe(false);
    expect(validateIndices([1, 1]).ok).toBe(false);
    expect(validateIndices([1, -1, 0]).ok).toBe(true);
  });

  it.each<[string, number[]]>([
    ['1 -1 0', [1, -1, 0]],
    ['1,-1,0', [1, -1, 0]],
    ['[1, -1, 0]', [1, -1, 0]],
    ['(1 1 2)', [1, 1, 2]],
    ['1-10', [1, -1, 0]],
    ['-1-11', [-1, -1, 1]],
    ['110', [1, 1, 0]],
    ['11̅0', [1, -1, 0]],
    ['1 12 0', [1, 12, 0]],
    ['−1 1 1', [-1, 1, 1]],
  ])('interpreta "%s"', (text, expected) => {
    const r = parseIndices(text);
    expect(r.ok).toBe(true);
    if (r.ok) expect([...r.value]).toEqual(expected);
  });

  it.each<[string]>([[''], ['1 1'], ['1 1 1 1'], ['000'], ['a b c'], ['1.5 1 0'], ['1--10']])('rechaza "%s"', (text) => {
    expect(parseIndices(text).ok).toBe(false);
  });
});

describe('notación', () => {
  it('barra superior para índices negativos y corchetes correctos', () => {
    expect(formatIndices([1, -1, 0])).toBe('[11̅0]');
    expect(formatIndices([-1, 1, 1], 'plane')).toBe('(1̅11)');
    expect(formatIndices([1, 1, 0], 'directionFamily')).toBe('<110>');
    expect(formatIndices([1, 1, 1], 'planeFamily')).toBe('{111}');
    expect(formatIndices([1, 12, 0])).toBe('[1 12 0]');
  });

  // Regresión: la barra debe quedar sobre el dígito NEGATIVO, no sobre el siguiente.
  it('barra sobre el dígito correcto en los diagramas', () => {
    const show = (g: { ch: string; bar: boolean }[]) => g.map((c) => (c.bar ? `-${c.ch}` : c.ch)).join('');
    expect(show(indexGlyphs([-1, 1, 0]))).toBe('[-110]');
    expect(show(indexGlyphs([1, -1, 0]))).toBe('[1-10]');
    expect(show(indexGlyphs([-1, -1, 1]))).toBe('[-1-11]');
    expect(show(indexGlyphs([-1, 1, 1], 'plane'))).toBe('(-111)');
    expect(show(indexGlyphs([1, -12, 0]))).toBe('[1 -1-2 0]');
    expect(indexGlyphs([1, 1, 0], 'directionFamily')[0]!.ch).toBe('<');
  });

  it('reducción a enteros mínimos', () => {
    expect(reduceIndices([2, 2, 2])).toEqual({ reduced: [1, 1, 1], factor: 2 });
    expect(reduceIndices([2, -4, 0])).toEqual({ reduced: [1, -2, 0], factor: 2 });
    expect(reduceIndices([1, 2, 3]).factor).toBe(1);
  });

  it('signo canónico', () => {
    expect([...canonicalSign([-1, 1, 0])]).toEqual([1, -1, 0]);
    expect([...canonicalSign([0, -1, 1])]).toEqual([0, 1, -1]);
  });
});

describe('dibujo de direcciones [uvw] en la celda', () => {
  it('[100], [110], [111] parten del origen', () => {
    close(directionDrawing([1, 0, 0]).tip, [1, 0, 0]);
    close(directionDrawing([1, 1, 0]).tip, [1, 1, 0]);
    close(directionDrawing([1, 1, 1]).tip, [1, 1, 1]);
    close(directionDrawing([1, 1, 1]).origin, [0, 0, 0]);
  });

  it('[123] se escala a (1/3, 2/3, 1) sin cambiar los índices', () => {
    const d = directionDrawing([1, 2, 3]);
    close(d.tip, [1 / 3, 2 / 3, 1]);
    expect(d.scaleFactor).toBeCloseTo(1 / 3, 12);
  });

  it('[1̄10]: el origen se traslada a x = 1', () => {
    const d = directionDrawing([-1, 1, 0]);
    close(d.origin, [1, 0, 0]);
    close(d.tip, [0, 1, 0]);
  });

  it('[1̄1̄1]: origen en (1,1,0) y punta en (0,0,1)', () => {
    const d = directionDrawing([-1, -1, 1]);
    close(d.origin, [1, 1, 0]);
    close(d.tip, [0, 0, 1]);
  });

  it.each<[Indices]>([[[1, 0, 0]], [[1, 2, 3]], [[-2, 1, 0]], [[-1, -1, -1]], [[3, -1, 2]]])(
    '%j: la flecha queda dentro de la celda y conserva la orientación',
    (uvw) => {
      const d = directionDrawing(uvw);
      expect(inCell(d.origin) && inCell(d.tip)).toBe(true);
      const v: Vec3 = [d.tip[0] - d.origin[0], d.tip[1] - d.origin[1], d.tip[2] - d.origin[2]];
      close(normalize(v), normalize(uvw));
    },
  );
});

describe('dibujo de planos (hkl) en la celda', () => {
  it('(100): la cara x = 1', () => {
    const p = planeDrawing([1, 0, 0]);
    expect(p.d).toBe(1);
    expect(p.polygon).toHaveLength(4);
    p.polygon.forEach((q) => expect(q[0]).toBeCloseTo(1, 12));
  });

  it('(110): rectángulo diagonal x + y = 1', () => {
    const p = planeDrawing([1, 1, 0]);
    expect(p.polygon).toHaveLength(4);
    p.polygon.forEach((q) => expect(q[0] + q[1]).toBeCloseTo(1, 12));
  });

  it('(111): triángulo con intersecciones en 1, 1, 1', () => {
    const p = planeDrawing([1, 1, 1]);
    expect(p.polygon).toHaveLength(3);
    expect(p.intercepts).toEqual([1, 1, 1]);
  });

  it('(112): intersecciones en x = 1, y = 1, z = 1/2', () => {
    const p = planeDrawing([1, 1, 2]);
    expect(p.intercepts[2]).toBeCloseTo(0.5, 12);
    close(p.interceptPoints[2]!, [0, 0, 0.5]);
  });

  it('(1̄11): se construye desde el origen trasladado (1,0,0)', () => {
    const p = planeDrawing([-1, 1, 1]);
    close(p.origin, [1, 0, 0]);
    expect(p.d).toBe(0);
    // Pasa por (0,0,0), (1,1,0) y (1,0,1)
    close(p.interceptPoints[0]!, [0, 0, 0]);
    close(p.interceptPoints[1]!, [1, 1, 0]);
    close(p.interceptPoints[2]!, [1, 0, 1]);
  });

  it('un plano que pasaría por el origen se representa por un paralelo dentro de la celda', () => {
    const p = planeDrawing([1, -1, 0]);
    expect(p.polygon.length).toBeGreaterThanOrEqual(3);
  });

  it.each<[Indices]>([
    [[1, 0, 0]], [[0, 1, 0]], [[0, 0, 1]], [[1, 1, 0]], [[1, 0, 1]], [[0, 1, 1]], [[1, 1, 1]],
    [[1, 1, 2]], [[2, 1, 0]], [[-1, 1, 1]], [[-1, -1, 1]], [[1, -1, 0]], [[1, 2, 3]], [[-2, 1, 3]], [[0, -1, 2]],
  ])('%j: todos los vértices cumplen la ecuación y están en la celda', (hkl) => {
    const p = planeDrawing(hkl);
    expect(p.polygon.length).toBeGreaterThanOrEqual(3);
    p.polygon.forEach((q) => {
      expect(dot(hkl, q)).toBeCloseTo(p.d, 9);
      expect(inCell(q)).toBe(true);
    });
  });

  it('la normal unitaria de (hkl) es paralela a [hkl] (cristal cúbico)', () => {
    close(planeDrawing([1, 1, 1]).unitNormal, normalize([1, 1, 1]));
  });
});

describe('familias', () => {
  // Tabla de la presentación de clase: número de direcciones equivalentes.
  it('<100> tiene 6, <110> tiene 12 y <111> tiene 8 direcciones', () => {
    expect(familyMembers([1, 0, 0])).toHaveLength(6);
    expect(familyMembers([1, 1, 0])).toHaveLength(12);
    expect(familyMembers([1, 1, 1])).toHaveLength(8);
  });

  it('sin opuestos: {111} tiene 4 planos y {110} tiene 6', () => {
    expect(familyMembers([1, 1, 1], false)).toHaveLength(4);
    expect(familyMembers([1, 1, 0], false)).toHaveLength(6);
  });

  it('pertenencia a una misma familia', () => {
    expect(sameFamily([1, -1, 0], [0, 1, 1])).toBe(true);
    expect(sameFamily([1, 1, 1], [1, 1, 0])).toBe(false);
  });
});
