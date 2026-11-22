import { describe, expect, it } from 'vitest';
import { familyLabel, fccBccSchmidSymmetry, rankSlipSystems, slipSystems } from './families';
import { isDirectionInPlane } from './slip';
import type { Vec3 } from './vector';

describe('sistemas de deslizamiento', () => {
  it('FCC {111}<110> y BCC {110}<111> tienen 12 sistemas cada uno', () => {
    expect(slipSystems('FCC')).toHaveLength(12);
    expect(slipSystems('BCC')).toHaveLength(12);
    expect(familyLabel('FCC')).toBe('{111}<110>');
    expect(familyLabel('BCC')).toBe('{110}<111>');
  });

  it('cada dirección pertenece a su plano', () => {
    for (const s of [...slipSystems('FCC'), ...slipSystems('BCC')]) {
      expect(isDirectionInPlane(s.plane, s.direction)).toBe(true);
    }
  });

  it('FCC: 4 planos con 3 direcciones cada uno; BCC: 6 planos con 2 direcciones cada uno', () => {
    const count = (s: 'FCC' | 'BCC') => {
      const m = new Map<string, number>();
      slipSystems(s).forEach((x) => m.set(x.plane.join(), (m.get(x.plane.join()) ?? 0) + 1));
      return [...m.values()];
    };
    expect(count('FCC')).toEqual([3, 3, 3, 3]);
    expect(count('BCC')).toEqual([2, 2, 2, 2, 2, 2]);
  });

  it('no hay sistemas repetidos', () => {
    const keys = slipSystems('FCC').map((s) => s.plane.join() + '|' + s.direction.join());
    expect(new Set(keys).size).toBe(12);
  });
});

describe('ordenamiento por factor de Schmid', () => {
  it('FCC con carga [100]: 8 sistemas con m = 0.408 y 4 con m = 0', () => {
    const rows = rankSlipSystems('FCC', [1, 0, 0]);
    expect(rows.filter((r) => Math.abs(r.schmid.mAbs - 1 / Math.sqrt(6)) < 1e-12)).toHaveLength(8);
    expect(rows.filter((r) => r.schmid.mAbs < 1e-12)).toHaveLength(4);
    expect(rows[0]!.rank).toBe(1);
    expect(rows[7]!.rank).toBe(1); // empatados comparten lugar
    expect(rows[8]!.rank).toBe(9);
  });

  // Ley de Schmid 2: BCC {110}<111> con eje de tensión [123].
  it('BCC con carga [123]: el más favorable es (101)[11̄1̄] con m ≈ 0.467', () => {
    const rows = rankSlipSystems('BCC', [1, 2, 3]);
    expect(rows[0]!.schmid.mAbs).toBeCloseTo(0.4666, 4);
    expect(rows[0]!.plane).toEqual([1, 0, 1]);
    expect(rows[0]!.direction).toEqual([1, -1, -1]);
    expect(rows[1]!.schmid.mAbs).toBeLessThan(rows[0]!.schmid.mAbs);
    for (let i = 1; i < rows.length; i++) {
      expect(rows[i]!.schmid.mAbs).toBeLessThanOrEqual(rows[i - 1]!.schmid.mAbs);
    }
  });
});

describe('dato curioso: simetría FCC ↔ BCC', () => {
  it.each<[Vec3]>([[[1, 0, 0]], [[1, 2, 3]], [[1, 2, 1]], [[-2, 1, -3]], [[0.3, -1.7, 2.2]]])(
    'con carga %j, FCC y BCC tienen los mismos factores de Schmid',
    (load) => {
      expect(fccBccSchmidSymmetry(load).holds).toBe(true);
    },
  );

  it('eje [2̄13̄]: |m|max = 0.4666 en ambas estructuras', () => {
    const { fcc, bcc } = fccBccSchmidSymmetry([-2, 1, -3]);
    expect(fcc[0]).toBeCloseTo(0.4666, 4);
    expect(bcc[0]).toBeCloseTo(fcc[0]!, 12);
  });
});
