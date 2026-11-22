/**
 * Modelo del simulador de Schmid: entradas del usuario → resultados.
 * Función pura (sin React), probada con los ejemplos de clase.
 */
import {
  activationState,
  applyMat,
  areaToM2,
  circularArea,
  DEFAULT_NEAR_RATIO,
  dot,
  forceToN,
  lengthToM,
  normalize,
  paTo,
  schmidFactor,
  schmidFromAngles,
  specimenRotation,
  stressFromForce,
  stressToActivate,
  stressToPa,
  validateSlipSystem,
  vectorsFromAngles,
  type ActivationState,
  type AreaUnit,
  type ForceUnit,
  type Indices,
  type LengthUnit,
  type LoadType,
  type Mat3,
  type StressUnit,
  type Vec3,
} from '../core';

export type InputMode = 'indices' | 'angles';
export type StressMode = 'force' | 'stress';
export type AreaMode = 'diameter' | 'area';

export interface SchmidInputs {
  mode: InputMode;
  plane: Indices;
  dir: Indices;
  load: Vec3;
  phi: number;
  lambda: number;
  loadType: LoadType;
  stressMode: StressMode;
  force: number;
  forceUnit: ForceUnit;
  areaMode: AreaMode;
  diameter: number;
  diameterUnit: LengthUnit;
  area: number;
  areaUnit: AreaUnit;
  stress: number;
  stressUnit: StressUnit;
  crss: number;
  crssUnit: StressUnit;
}

export const DEFAULT_INPUTS: SchmidInputs = {
  mode: 'indices',
  plane: [1, 1, 0],
  dir: [-1, 1, 1],
  load: [1, 2, 1],
  phi: 43.1,
  lambda: 47.9,
  loadType: 'tension',
  stressMode: 'stress',
  force: 5,
  forceUnit: 'kN',
  areaMode: 'diameter',
  diameter: 10,
  diameterUnit: 'mm',
  area: 78.54,
  areaUnit: 'mm²',
  stress: 180,
  stressUnit: 'MPa',
  crss: 82.73,
  crssUnit: 'MPa',
};

export interface SchmidModel {
  errors: string[];
  warnings: string[];
  /** Área transversal (m²) si se usa fuerza. */
  areaM2: number | null;
  forceN: number | null;
  /** Esfuerzo normal con signo (Pa): + tensión, − compresión. */
  sigmaPa: number | null;
  /** Ángulos agudos (convención de clase) y sus cosenos (≥ 0). */
  phiDeg: number | null;
  lambdaDeg: number | null;
  cosPhi: number | null;
  cosLambda: number | null;
  /** Factor de Schmid (≥ 0) con ángulos agudos. */
  m: number | null;
  /** τR = σ·m (Pa), con el signo de σ. */
  tauPa: number | null;
  crssPa: number | null;
  ratio: number | null;
  state: ActivationState | null;
  sigmaToActivatePa: number | null;
  coplanar: boolean;
  geometricallyPossible: boolean;
  /** Solo en modo índices: detalles con signo. */
  vector: {
    phiDeg: number;
    lambdaDeg: number;
    cosPhi: number;
    cosLambda: number;
    m: number;
    /** Sentido en que se desliza la parte superior: +1 → [uvw], −1 → [ūv̄w̄]. */
    upperSense: 1 | -1;
    dotNumPhi: number;
    dotNumLambda: number;
  } | null;
  /** Para la escena 3D (marco de la probeta). */
  scene: { normal: Vec3; slip: Vec3; rotation: Mat3 | null } | null;
  /** Unidad para mostrar σ y τ (la del esfuerzo crítico). */
  displayUnit: StressUnit;
}

const finite = (x: number) => Number.isFinite(x);

export function computeSchmid(i: SchmidInputs): SchmidModel {
  const errors: string[] = [];
  const warnings: string[] = [];
  const out: SchmidModel = {
    errors, warnings, areaM2: null, forceN: null, sigmaPa: null, phiDeg: null, lambdaDeg: null, cosPhi: null, cosLambda: null,
    m: null, tauPa: null, crssPa: null, ratio: null, state: null, sigmaToActivatePa: null, coplanar: false,
    geometricallyPossible: true, vector: null, scene: null, displayUnit: i.crssUnit,
  };

  // ---------- Esfuerzo aplicado ----------
  let sigmaAbs: number | null = null;
  try {
    if (i.stressMode === 'force') {
      if (!(finite(i.force) && i.force >= 0)) throw new Error('La fuerza debe ser un número mayor o igual que cero.');
      const F = forceToN(i.force, i.forceUnit);
      const A = i.areaMode === 'diameter' ? circularArea(lengthToM(i.diameter, i.diameterUnit)) : areaToM2(i.area, i.areaUnit);
      if (!(A > 0)) throw new Error('El área transversal debe ser mayor que cero.');
      out.forceN = F;
      out.areaM2 = A;
      sigmaAbs = stressFromForce(F, A);
    } else {
      if (!(finite(i.stress) && i.stress >= 0)) throw new Error('El esfuerzo aplicado debe ser un número mayor o igual que cero (elige tensión o compresión aparte).');
      sigmaAbs = stressToPa(i.stress, i.stressUnit);
    }
  } catch (e) {
    errors.push((e as Error).message);
  }
  if (sigmaAbs !== null) out.sigmaPa = i.loadType === 'tension' ? sigmaAbs : -sigmaAbs;

  if (finite(i.crss) && i.crss > 0) out.crssPa = stressToPa(i.crss, i.crssUnit);
  else errors.push('El esfuerzo cortante crítico τCRSS debe ser mayor que cero.');

  // ---------- Geometría ----------
  if (i.mode === 'indices') {
    const v = validateSlipSystem(i.plane, i.dir, i.load);
    if (!v.ok) {
      errors.push(...v.errors);
    } else {
      const s = schmidFactor(i.plane, i.dir, i.load);
      out.phiDeg = s.phiAcuteDeg;
      out.lambdaDeg = s.lambdaAcuteDeg;
      out.cosPhi = Math.abs(s.cosPhi);
      out.cosLambda = Math.abs(s.cosLambda);
      out.m = s.mAbs;
      out.coplanar = s.coplanarCase;
      const e = normalize(i.load);
      out.vector = {
        phiDeg: s.phiDeg,
        lambdaDeg: s.lambdaDeg,
        cosPhi: s.cosPhi,
        cosLambda: s.cosLambda,
        m: s.m,
        upperSense: ((i.loadType === 'tension' ? 1 : -1) * (dot(e, s.slipUnit) >= 0 ? 1 : -1)) as 1 | -1,
        dotNumPhi: dot(i.load, i.plane),
        dotNumLambda: dot(i.load, i.dir),
      };
      const R = specimenRotation(i.load, i.plane, i.dir);
      out.scene = { normal: applyMat(R, s.normalUnit), slip: applyMat(R, s.slipUnit), rotation: R };
    }
  } else {
    try {
      const r = schmidFromAngles(i.phi, i.lambda);
      out.phiDeg = i.phi;
      out.lambdaDeg = i.lambda;
      out.cosPhi = r.cosPhi;
      out.cosLambda = r.cosLambda;
      out.m = r.m;
      out.coplanar = r.coplanarCase;
      out.geometricallyPossible = r.geometricallyPossible;
      warnings.push(...r.warnings);
      const vecs = vectorsFromAngles(i.phi, i.lambda);
      if (vecs) out.scene = { normal: vecs.n, slip: vecs.d, rotation: null };
    } catch (e) {
      errors.push((e as Error).message);
    }
  }

  // ---------- Ley de Schmid ----------
  if (out.m !== null && out.sigmaPa !== null) {
    const tau = out.sigmaPa * out.m;
    out.tauPa = tau === 0 ? 0 : tau;
    if (out.crssPa !== null) {
      out.ratio = Math.abs(out.tauPa) / out.crssPa;
      out.state = activationState(out.tauPa, out.crssPa, DEFAULT_NEAR_RATIO);
      out.sigmaToActivatePa = stressToActivate(out.crssPa, out.m);
    }
  }
  if (out.m !== null && out.m < 1e-12) {
    warnings.push('m = 0: el esfuerzo no produce cortante en este sistema (φ = 90° o λ = 90°). Este sistema no puede deslizar con ningún esfuerzo uniaxial en esta dirección.');
  }
  return out;
}

/** Valor en la unidad de visualización. */
export const inUnit = (pa: number | null, unit: StressUnit) => (pa === null ? null : paTo(pa, unit));
