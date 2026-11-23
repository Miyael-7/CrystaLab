/**
 * Análisis por plano para el comparador FCC / BCC.
 *
 * No calcula factores de Schmid: solo organiza las filas que ya produce
 * computeSystems() (systemsModel.ts) para mostrar las direcciones de un plano.
 */
import { canonicalSign, formatIndices, reduceIndices, slipSystems, validateIndices, type Indices, type Structure } from '../core';
import type { SystemRow } from './systemsModel';

const same = (a: Indices, b: Indices) => a[0] === b[0] && a[1] === b[1] && a[2] === b[2];

/** Planos de deslizamiento de la estructura (FCC: 4 planos {111}; BCC: 6 planos {110}), sin repetir. */
export function familyPlanes(structure: Structure): Indices[] {
  const out: Indices[] = [];
  for (const s of slipSystems(structure)) if (!out.some((p) => same(p, s.plane))) out.push(s.plane);
  return out;
}

export type PlaneMatch =
  | { ok: true; plane: Indices; equivalent: boolean }
  | { ok: false; error: string };

/**
 * Busca el plano escrito por el usuario entre los planos de deslizamiento.
 * (hkl) y (h̄k̄l̄) son el mismo plano, y (222) equivale a (111).
 */
export function matchFamilyPlane(structure: Structure, plane: Indices): PlaneMatch {
  const v = validateIndices(plane);
  if (!v.ok) return { ok: false, error: v.error! };
  const canon = canonicalSign(reduceIndices(plane).reduced);
  const found = familyPlanes(structure).find((p) => same(p, canon));
  if (!found) {
    const fam = structure === 'FCC' ? '{111}' : '{110}';
    return {
      ok: false,
      error: `${formatIndices(plane, 'plane')} no es un plano de deslizamiento ${structure}: los planos de deslizamiento de esta estructura son los de la familia ${fam}.`,
    };
  }
  return { ok: true, plane: found, equivalent: !same(found, plane) };
}

/** Filas (ya ordenadas por |m|) cuyo plano es `plane`, con su posición en la lista completa. */
export function rowsInPlane(rows: SystemRow[], plane: Indices): { row: SystemRow; index: number }[] {
  return rows.map((row, index) => ({ row, index })).filter(({ row }) => same(row.plane, plane));
}
