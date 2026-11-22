/**
 * Ley de Schmid para cristales cúbicos.
 *
 *   φ: ángulo entre el eje de carga y la NORMAL al plano de deslizamiento
 *   λ: ángulo entre el eje de carga y la DIRECCIÓN de deslizamiento
 *   m  = cos φ · cos λ               (factor de Schmid)
 *   τR = σ · cos φ · cos λ = σ · m   (esfuerzo cortante resuelto)
 *
 * Signos: con un esfuerzo uniaxial σ (positivo en tensión, negativo en
 * compresión) a lo largo del unitario ê, el cortante resuelto sobre el plano
 * de normal n̂ en la dirección d̂ es τR = σ (ê·n̂)(ê·d̂). Ese signo depende del
 * sentido elegido para n̂ y d̂ y del tipo de carga; indica el SENTIDO del corte.
 * La activación del deslizamiento se decide con la magnitud |τR|.
 *
 * En el caso general φ y λ son independientes: NO se cumple φ + λ = 90°.
 * Como n̂ ⊥ d̂, entre los ángulos agudos siempre se cumple φ + λ ≥ 90°;
 * la igualdad ocurre solo si el eje de carga está en el plano formado por
 * n̂ y d̂ (caso especial, donde m_max = 0.5 con φ = λ = 45°).
 */
import { type Indices, validateIndices, formatIndices } from './miller';
import { acuteAngleBetweenDeg, angleBetweenDeg, cosBetween, degToRad, dot, EPS, normalize, tripleProduct, type Vec3 } from './vector';

export type LoadType = 'tension' | 'compression';
export type ActivationState = 'inactive' | 'near' | 'active';

/** Umbral por defecto de "próximo a activarse": |τR| ≥ 90 % de τCRSS. */
export const DEFAULT_NEAR_RATIO = 0.9;

/** ¿La dirección [uvw] está contenida en el plano (hkl)? Condición: hu + kv + lw = 0. */
export const isDirectionInPlane = (plane: Indices, dir: Indices): boolean => Math.abs(dot(plane, dir)) < EPS;

export interface SlipValidation {
  ok: boolean;
  errors: string[];
}

/** Valida plano, dirección y eje de carga antes de calcular. */
export function validateSlipSystem(plane: Indices, dir: Indices, load: Vec3): SlipValidation {
  const errors: string[] = [];
  const vp = validateIndices(plane);
  if (!vp.ok) errors.push(`Plano de deslizamiento: ${vp.error}`);
  const vd = validateIndices(dir);
  if (!vd.ok) errors.push(`Dirección de deslizamiento: ${vd.error}`);
  if (!load.every(Number.isFinite) || Math.hypot(...load) < EPS)
    errors.push('Dirección del esfuerzo: debe ser un vector no nulo.');
  if (vp.ok && vd.ok && !isDirectionInPlane(plane, dir)) {
    const s = plane[0] * dir[0] + plane[1] * dir[1] + plane[2] * dir[2];
    errors.push(
      `La dirección ${formatIndices(dir)} no pertenece al plano ${formatIndices(plane, 'plane')}: ` +
        `hu + kv + lw = ${s} ≠ 0. Esta combinación no es un sistema de deslizamiento válido.`,
    );
  }
  return { ok: errors.length === 0, errors };
}

export interface SchmidResult {
  /** Unitarios usados en el cálculo. */
  loadUnit: Vec3;
  normalUnit: Vec3;
  slipUnit: Vec3;
  /** Cosenos con signo (proyecciones vectoriales). */
  cosPhi: number;
  cosLambda: number;
  /** Ángulos entre VECTORES, en [0°, 180°] (coherentes con los cosenos con signo). */
  phiDeg: number;
  lambdaDeg: number;
  /** Ángulos entre RECTAS, en [0°, 90°] (convención usual de clase). */
  phiAcuteDeg: number;
  lambdaAcuteDeg: number;
  /** Factor de Schmid con signo y su magnitud (0 ≤ |m| ≤ 0.5). */
  m: number;
  mAbs: number;
  /** Eje de carga contenido en el plano formado por n̂ y d̂ (caso especial φ + λ = 90°). */
  coplanarCase: boolean;
}

/** Factor de Schmid de un sistema (hkl)[uvw] bajo carga en la dirección `load`. */
export function schmidFactor(plane: Indices, dir: Indices, load: Vec3): SchmidResult {
  const v = validateSlipSystem(plane, dir, load);
  if (!v.ok) throw new Error(v.errors.join(' '));
  const e = normalize(load);
  const n = normalize(plane);
  const d = normalize(dir);
  const cosPhi = cosBetween(e, n);
  const cosLambda = cosBetween(e, d);
  const m = cosPhi * cosLambda;
  return {
    loadUnit: e,
    normalUnit: n,
    slipUnit: d,
    cosPhi,
    cosLambda,
    phiDeg: angleBetweenDeg(e, n),
    lambdaDeg: angleBetweenDeg(e, d),
    phiAcuteDeg: acuteAngleBetweenDeg(e, n),
    lambdaAcuteDeg: acuteAngleBetweenDeg(e, d),
    m: m === 0 ? 0 : m,
    mAbs: Math.abs(m),
    coplanarCase: Math.abs(tripleProduct(n, d, e)) < 1e-9,
  };
}

/** Esfuerzo normal con signo: positivo en tensión, negativo en compresión. */
export function signedStress(magnitude: number, load: LoadType): number {
  if (!(magnitude >= 0)) throw new Error('La magnitud del esfuerzo debe ser un número mayor o igual que cero.');
  return load === 'tension' ? magnitude : -magnitude;
}

/** τR = σ · m (mismas unidades que σ; conserva el signo). */
export const resolvedShearStress = (sigma: number, m: number): number => {
  const t = sigma * m;
  return t === 0 ? 0 : t;
};

/** Estado de activación según el criterio de Schmid: |τR| ≥ τCRSS. */
export function activationState(tauR: number, crss: number, nearRatio = DEFAULT_NEAR_RATIO): ActivationState {
  if (!(crss > 0)) throw new Error('El esfuerzo cortante crítico τCRSS debe ser mayor que cero.');
  if (!(nearRatio > 0 && nearRatio < 1)) throw new Error('El umbral de "próximo a activarse" debe estar entre 0 y 1.');
  const ratio = Math.abs(tauR) / crss;
  // Pequeña tolerancia relativa para que τR = τCRSS exacto cuente como activado.
  if (ratio >= 1 - 1e-12) return 'active';
  if (ratio >= nearRatio) return 'near';
  return 'inactive';
}

/** Esfuerzo normal necesario para iniciar el deslizamiento: σ = τCRSS / |m|. */
export function stressToActivate(crss: number, m: number): number {
  if (!(crss > 0)) throw new Error('El esfuerzo cortante crítico τCRSS debe ser mayor que cero.');
  return Math.abs(m) < EPS ? Infinity : crss / Math.abs(m);
}

/* ------------------------------------------------------------------ */
/* Calculadora por ángulos                                              */
/* ------------------------------------------------------------------ */

export interface AngleSchmidResult {
  cosPhi: number;
  cosLambda: number;
  m: number;
  /** false si φ + λ < 90°: no existe una orientación real con esos ángulos. */
  geometricallyPossible: boolean;
  /** true si φ + λ = 90° (eje de carga en el plano de n̂ y d̂). */
  coplanarCase: boolean;
  warnings: string[];
}

/** Factor de Schmid a partir de φ y λ en grados, ambos en [0°, 90°]. */
export function schmidFromAngles(phiDeg: number, lambdaDeg: number): AngleSchmidResult {
  for (const [name, a] of [['φ', phiDeg], ['λ', lambdaDeg]] as const) {
    if (!Number.isFinite(a)) throw new Error(`El ángulo ${name} debe ser un número.`);
    if (a < 0 || a > 90) throw new Error(`El ángulo ${name} debe estar entre 0° y 90°.`);
  }
  const cosPhi = Math.cos(degToRad(phiDeg));
  const cosLambda = Math.cos(degToRad(lambdaDeg));
  const sum = phiDeg + lambdaDeg;
  const geometricallyPossible = sum >= 90 - 1e-9;
  const warnings: string[] = [];
  if (!geometricallyPossible) {
    warnings.push(
      `φ + λ = ${sum.toFixed(2)}° < 90°. La normal y la dirección de deslizamiento son perpendiculares, ` +
        'por lo que siempre debe cumplirse φ + λ ≥ 90°. Esta orientación no puede existir; el resultado es solo aritmético.',
    );
  }
  const m = cosPhi * cosLambda;
  return {
    cosPhi,
    cosLambda,
    m,
    geometricallyPossible,
    coplanarCase: Math.abs(sum - 90) < 1e-9,
    warnings,
  };
}
