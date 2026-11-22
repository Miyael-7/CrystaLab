/**
 * Modelo del comparador de sistemas de deslizamiento FCC / BCC (función pura).
 */
import {
  activationState,
  DEFAULT_NEAR_RATIO,
  familyLabel,
  fccBccSchmidSymmetry,
  formatIndices,
  rankSlipSystems,
  stressToActivate,
  stressToPa,
  type ActivationState,
  type Indices,
  type RankedSlipSystem,
  type StressUnit,
  type Structure,
  type Vec3,
} from '../core';

export interface SystemsInputs {
  structure: Structure;
  load: Vec3;
  /** Magnitud del esfuerzo aplicado (opcional para el análisis de activación). */
  stress: number;
  crss: number;
  unit: StressUnit;
}

export interface SystemRow extends RankedSlipSystem {
  /** τR = σ·m (misma unidad que la entrada). */
  tau: number;
  state: ActivationState;
  /** σ necesario para activar este sistema (misma unidad), Infinity si m = 0. */
  sigmaToActivate: number;
  /** Sistema equivalente en la otra estructura: plano y dirección intercambiados. */
  twin: { structure: Structure; plane: Indices; direction: Indices };
}

export interface SystemsResult {
  errors: string[];
  rows: SystemRow[];
  /** Índices (en `rows`) de los sistemas primarios: los de mayor |m| (pueden empatar). */
  primary: number[];
  mMax: number;
  /** σ de fluencia del monocristal según Schmid: τCRSS / m_max. */
  yieldStress: number | null;
  activeCount: number;
  symmetryHolds: boolean;
  family: string;
}

export const otherStructure = (s: Structure): Structure => (s === 'FCC' ? 'BCC' : 'FCC');

export function computeSystems(i: SystemsInputs): SystemsResult {
  const errors: string[] = [];
  if (!i.load.every(Number.isFinite) || Math.hypot(...i.load) < 1e-12) errors.push('La dirección del esfuerzo debe ser un vector no nulo.');
  if (!(Number.isFinite(i.stress) && i.stress >= 0)) errors.push('El esfuerzo aplicado debe ser un número mayor o igual que cero.');
  if (!(Number.isFinite(i.crss) && i.crss > 0)) errors.push('τCRSS debe ser mayor que cero.');
  const empty: SystemsResult = { errors, rows: [], primary: [], mMax: 0, yieldStress: null, activeCount: 0, symmetryHolds: true, family: familyLabel(i.structure) };
  if (errors.some((e) => e.startsWith('La dirección'))) return empty;

  const ranked = rankSlipSystems(i.structure, i.load);
  const okStress = errors.length === 0;
  // Se trabaja en Pa internamente para el criterio y se devuelve en la unidad de entrada.
  const crssPa = okStress ? stressToPa(i.crss, i.unit) : 1;
  const rows: SystemRow[] = ranked.map((r) => {
    const tau = okStress ? i.stress * r.schmid.mAbs : 0;
    return {
      ...r,
      tau,
      state: okStress ? activationState(stressToPa(tau, i.unit), crssPa, DEFAULT_NEAR_RATIO) : 'inactive',
      sigmaToActivate: okStress ? stressToActivate(i.crss, r.schmid.mAbs) : Infinity,
      twin: { structure: otherStructure(i.structure), plane: r.direction, direction: r.plane },
    };
  });
  const mMax = rows[0]?.schmid.mAbs ?? 0;
  const primary = rows.map((r, k) => (Math.abs(r.schmid.mAbs - mMax) < 1e-9 && mMax > 0 ? k : -1)).filter((k) => k >= 0);
  return {
    errors,
    rows,
    primary,
    mMax,
    yieldStress: okStress && mMax > 1e-12 ? i.crss / mMax : null,
    activeCount: rows.filter((r) => r.state === 'active').length,
    symmetryHolds: fccBccSchmidSymmetry(i.load).holds,
    family: familyLabel(i.structure),
  };
}

/** Texto plano del sistema, por ejemplo "(111)[1-10]" (para atributos accesibles y claves). */
export const systemKey = (plane: Indices, dir: Indices) => `${formatIndices(plane, 'plane')}${formatIndices(dir)}`;
