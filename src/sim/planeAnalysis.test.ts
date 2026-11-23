import { describe, expect, it } from 'vitest';
import { schmidFactor } from '../core';
import { familyPlanes, matchFamilyPlane, rowsInPlane } from './planeAnalysis';
import { computeSystems } from './systemsModel';

describe('análisis por plano', () => {
  it('FCC tiene 4 planos {111} y BCC 6 planos {110}', () => {
    expect(familyPlanes('FCC')).toHaveLength(4);
    expect(familyPlanes('BCC')).toHaveLength(6);
  });

  it('cada plano agrupa sus direcciones: 3 en FCC y 2 en BCC; en total, los 12 sistemas', () => {
    for (const [structure, per] of [['FCC', 3], ['BCC', 2]] as const) {
      const res = computeSystems({ structure, load: [1, 2, 3], stress: 100, crss: 40, unit: 'MPa' });
      let total = 0;
      for (const p of familyPlanes(structure)) {
        const rows = rowsInPlane(res.rows, p);
        expect(rows).toHaveLength(per);
        total += rows.length;
      }
      expect(total).toBe(12);
    }
  });

  it('las filas del plano son las mismas del ranking (mismo m), en el mismo orden', () => {
    const res = computeSystems({ structure: 'FCC', load: [1, 2, 3], stress: 100, crss: 40, unit: 'MPa' });
    const rows = rowsInPlane(res.rows, [1, 1, 1]);
    rows.forEach(({ row, index }) => {
      expect(res.rows[index]).toBe(row);
      expect(row.schmid.mAbs).toBeCloseTo(schmidFactor([1, 1, 1], row.direction, [1, 2, 3]).mAbs, 12);
    });
    for (let i = 1; i < rows.length; i++) expect(rows[i]!.index).toBeGreaterThan(rows[i - 1]!.index);
  });

  it('ejercicio tipo: FCC, carga [100], plano (111) → [11̄0] y [101̄] con m = 0.408; [011̄] con m = 0', () => {
    const res = computeSystems({ structure: 'FCC', load: [1, 0, 0], stress: 10, crss: 4, unit: 'MPa' });
    const rows = rowsInPlane(res.rows, [1, 1, 1]);
    expect(rows.map(({ row }) => row.schmid.mAbs).map((m) => Math.round(m * 1e4) / 1e4)).toEqual([0.4082, 0.4082, 0]);
    expect(rows[2]!.row.direction).toEqual([0, 1, -1]);
  });

  it('reconoce planos equivalentes y rechaza los que no son de deslizamiento', () => {
    expect(matchFamilyPlane('FCC', [-1, -1, -1])).toEqual({ ok: true, plane: [1, 1, 1], equivalent: true });
    expect(matchFamilyPlane('FCC', [2, 2, 2])).toEqual({ ok: true, plane: [1, 1, 1], equivalent: true });
    expect(matchFamilyPlane('BCC', [1, 1, 0])).toEqual({ ok: true, plane: [1, 1, 0], equivalent: false });
    const bad = matchFamilyPlane('BCC', [1, 1, 1]);
    expect(bad.ok).toBe(false);
    expect(matchFamilyPlane('FCC', [0, 0, 0]).ok).toBe(false);
  });
});
