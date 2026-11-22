/**
 * Sistemas de deslizamiento de las estructuras FCC y BCC.
 *
 *  FCC: planos {111} y direcciones <110> contenidas en ellos → 12 sistemas.
 *  BCC: planos {110} y direcciones <111> contenidas en ellos → 12 sistemas.
 *
 * Un plano y su opuesto (hkl)/(h̄k̄l̄) son el mismo plano, y una dirección y su
 * opuesta [uvw]/[ūv̄w̄] están sobre la misma recta. Por eso se cuenta un solo
 * representante de cada par (con signo canónico) y salen 12 sistemas.
 */
import { canonicalSign, familyMembers, formatIndices, type Indices } from './miller';
import { schmidFactor, type SchmidResult } from './slip';
import type { Vec3 } from './vector';

export type Structure = 'FCC' | 'BCC';

export interface SlipSystemDef {
  plane: Indices;
  direction: Indices;
}

const FAMILY: Record<Structure, { plane: Indices; direction: Indices }> = {
  FCC: { plane: [1, 1, 1], direction: [1, 1, 0] },
  BCC: { plane: [1, 1, 0], direction: [1, 1, 1] },
};

export const familyLabel = (s: Structure): string =>
  `${formatIndices(FAMILY[s].plane, 'planeFamily')}${formatIndices(FAMILY[s].direction, 'directionFamily')}`;

/** Lista de sistemas de deslizamiento (plano, dirección) de la estructura. */
export function slipSystems(structure: Structure): SlipSystemDef[] {
  const fam = FAMILY[structure];
  const planes = familyMembers(fam.plane, false).map(canonicalSign);
  const dirs = familyMembers(fam.direction, false).map(canonicalSign);
  const out: SlipSystemDef[] = [];
  for (const plane of planes) {
    for (const direction of dirs) {
      if (plane[0] * direction[0] + plane[1] * direction[1] + plane[2] * direction[2] === 0) {
        out.push({ plane, direction });
      }
    }
  }
  return out;
}

export interface RankedSlipSystem extends SlipSystemDef {
  label: string;
  schmid: SchmidResult;
  /** 1 = más favorable. Sistemas con el mismo |m| comparten lugar. */
  rank: number;
}

/**
 * Factor de Schmid de cada sistema para una dirección de carga, ordenado
 * del más favorable (|m| mayor) al menos favorable.
 */
export function rankSlipSystems(structure: Structure, load: Vec3): RankedSlipSystem[] {
  const rows = slipSystems(structure).map((s) => ({
    ...s,
    label: `${formatIndices(s.plane, 'plane')}${formatIndices(s.direction)}`,
    schmid: schmidFactor(s.plane, s.direction, load),
    rank: 0,
  }));
  rows.sort((a, b) => b.schmid.mAbs - a.schmid.mAbs);
  let rank = 0;
  let prev = NaN;
  rows.forEach((r, i) => {
    if (!(Math.abs(r.schmid.mAbs - prev) < 1e-9)) rank = i + 1;
    prev = r.schmid.mAbs;
    r.rank = rank;
  });
  return rows;
}

/**
 * DATO CURIOSO — simetría FCC ↔ BCC.
 * m = (ê·n̂)(ê·d̂) no cambia si se intercambian n̂ y d̂, y los sistemas FCC
 * {111}<110> son exactamente los BCC {110}<111> con plano y dirección
 * intercambiados. Por eso, para cualquier eje de carga, ambas estructuras
 * tienen el mismo conjunto de |m|. Esta función lo comprueba numéricamente.
 */
export function fccBccSchmidSymmetry(load: Vec3): { holds: boolean; fcc: number[]; bcc: number[] } {
  const fcc = rankSlipSystems('FCC', load).map((r) => r.schmid.mAbs);
  const bcc = rankSlipSystems('BCC', load).map((r) => r.schmid.mAbs);
  const holds = fcc.length === bcc.length && fcc.every((v, i) => Math.abs(v - bcc[i]!) < 1e-12);
  return { holds, fcc, bcc };
}
