import { describe, expect, it } from 'vitest';
import { isDirectionInPlane, schmidFactor } from '../core';
import { computeSystems, type SystemsInputs } from './systemsModel';

const base: SystemsInputs = { structure: 'FCC', load: [1, 0, 0], stress: 10, crss: 4, unit: 'MPa' };

describe('comparador de sistemas', () => {
  it('FCC con carga [100]: 8 sistemas primarios con m = 0.408', () => {
    const r = computeSystems(base);
    expect(r.rows).toHaveLength(12);
    expect(r.primary).toHaveLength(8);
    expect(r.mMax).toBeCloseTo(1 / Math.sqrt(6), 12);
    expect(r.family).toBe('{111}<110>');
  });

  it('τR, estado y σ para activar de cada sistema', () => {
    const r = computeSystems(base); // τR = 10 × 0.408 = 4.08 ≥ 4 → activado
    expect(r.rows[0]!.tau).toBeCloseTo(4.0825, 4);
    expect(r.rows[0]!.state).toBe('active');
    expect(r.rows[11]!.tau).toBeCloseTo(0, 12);
    expect(r.rows[11]!.sigmaToActivate).toBe(Infinity);
    expect(r.activeCount).toBe(8);
    expect(r.yieldStress!).toBeCloseTo(4 * Math.sqrt(6), 10); // σ = τCRSS / m_max = 9.80
  });

  it('BCC con carga [123]: el primario es (101)[11̄1̄], m = 0.467', () => {
    const r = computeSystems({ ...base, structure: 'BCC', load: [1, 2, 3] });
    expect(r.primary).toEqual([0]);
    expect(r.rows[0]!.plane).toEqual([1, 0, 1]);
    expect(r.rows[0]!.direction).toEqual([1, -1, -1]);
    expect(r.mMax).toBeCloseTo(0.4666, 4);
    // Los tres sistemas con λ = 90° tienen m exactamente 0 (sin ruido de redondeo).
    r.rows.slice(9).forEach((row) => expect(row.schmid.mAbs).toBe(0));
  });

  it('cada sistema tiene un gemelo en la otra estructura con el mismo m', () => {
    const load: [number, number, number] = [-2, 1, -3];
    for (const structure of ['FCC', 'BCC'] as const) {
      const r = computeSystems({ ...base, structure, load });
      expect(r.symmetryHolds).toBe(true);
      r.rows.forEach((row) => {
        expect(row.twin.structure).toBe(structure === 'FCC' ? 'BCC' : 'FCC');
        expect(isDirectionInPlane(row.twin.plane, row.twin.direction)).toBe(true);
        expect(schmidFactor(row.twin.plane, row.twin.direction, load).mAbs).toBeCloseTo(row.schmid.mAbs, 12);
      });
    }
  });

  it('valida las entradas', () => {
    expect(computeSystems({ ...base, load: [0, 0, 0] }).rows).toHaveLength(0);
    const r = computeSystems({ ...base, crss: 0 });
    expect(r.errors.length).toBeGreaterThan(0);
    expect(r.rows).toHaveLength(12); // el ordenamiento por m sigue disponible
    expect(r.yieldStress).toBe(null);
  });
});
