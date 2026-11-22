/**
 * Unidades físicas. Internamente todo se calcula en el SI:
 * fuerza en N, longitud en m, área en m², esfuerzo en Pa.
 */

export type ForceUnit = 'N' | 'kN';
export type StressUnit = 'Pa' | 'MPa' | 'GPa';
export type LengthUnit = 'mm' | 'cm' | 'm';
export type AreaUnit = 'mm²' | 'cm²' | 'm²';

const FORCE: Record<ForceUnit, number> = { N: 1, kN: 1e3 };
const STRESS: Record<StressUnit, number> = { Pa: 1, MPa: 1e6, GPa: 1e9 };
const LENGTH: Record<LengthUnit, number> = { mm: 1e-3, cm: 1e-2, m: 1 };
const AREA: Record<AreaUnit, number> = { 'mm²': 1e-6, 'cm²': 1e-4, 'm²': 1 };

function requireFinite(x: number, what: string): void {
  if (!Number.isFinite(x)) throw new Error(`${what} debe ser un número.`);
}

export const forceToN = (value: number, unit: ForceUnit): number => (requireFinite(value, 'La fuerza'), value * FORCE[unit]);
export const stressToPa = (value: number, unit: StressUnit): number => (requireFinite(value, 'El esfuerzo'), value * STRESS[unit]);
export const paTo = (pa: number, unit: StressUnit): number => pa / STRESS[unit];
export const lengthToM = (value: number, unit: LengthUnit): number => (requireFinite(value, 'La longitud'), value * LENGTH[unit]);
export const areaToM2 = (value: number, unit: AreaUnit): number => (requireFinite(value, 'El área'), value * AREA[unit]);
export const m2To = (m2: number, unit: AreaUnit): number => m2 / AREA[unit];

/** Área transversal de una probeta cilíndrica: A₀ = π d² / 4 (d en m, A₀ en m²). */
export function circularArea(diameterM: number): number {
  requireFinite(diameterM, 'El diámetro');
  if (diameterM <= 0) throw new Error('El diámetro debe ser mayor que cero.');
  return (Math.PI * diameterM * diameterM) / 4;
}

/** Esfuerzo normal σ = F / A₀ (F en N, A₀ en m², σ en Pa). */
export function stressFromForce(forceN: number, areaM2: number): number {
  requireFinite(forceN, 'La fuerza');
  requireFinite(areaM2, 'El área');
  if (areaM2 <= 0) throw new Error('El área transversal debe ser mayor que cero.');
  return forceN / areaM2;
}

/** Elige la unidad de esfuerzo más legible para mostrar un valor en Pa. */
export function bestStressUnit(pa: number): StressUnit {
  const a = Math.abs(pa);
  if (a >= 1e9) return 'GPa';
  if (a >= 1e6) return 'MPa';
  if (a === 0) return 'MPa';
  return a >= 1e3 ? 'MPa' : 'Pa';
}

/** Texto con un número fijo de cifras significativas, sin notación exponencial para valores comunes. */
export function formatNumber(x: number, sig = 4): string {
  if (!Number.isFinite(x)) return x > 0 ? '∞' : x < 0 ? '−∞' : '—';
  if (Math.abs(x) < 1e-12) return '0';
  const s = Number(x.toPrecision(sig));
  const abs = Math.abs(s);
  const str = abs >= 1e-4 && abs < 1e9 ? String(s) : s.toExponential(sig - 1);
  return str.replace('-', '−');
}

export function formatStress(pa: number, unit: StressUnit = bestStressUnit(pa), sig = 4): string {
  return `${formatNumber(paTo(pa, unit), sig)} ${unit}`;
}
