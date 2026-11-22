/**
 * Índices de Miller para cristales cúbicos.
 *
 * Convención de dibujo (la de clase):
 *  - DIRECCIONES [uvw]: si un índice es negativo, el origen se traslada a la
 *    esquina de la celda donde esa coordenada vale 1. Si algún índice es
 *    mayor que 1, el vector se escala (se divide entre el índice de mayor
 *    magnitud) para que quepa en la celda, sin cambiar los índices.
 *  - PLANOS (hkl): mismo traslado de origen para índices negativos; el plano
 *    corta el eje i en 1/h_i medido desde el nuevo origen (no lo corta si
 *    h_i = 0). Así un plano que pasaría por el origen se dibuja como un plano
 *    paralelo equivalente.
 *  - Solo en cristales cúbicos la normal al plano (hkl) es paralela a [hkl].
 */
import { add, dot, EPS, normalize, scale, sub, type Vec3 } from './vector';

export type Indices = readonly [number, number, number];
export type IndexKind = 'direction' | 'plane' | 'directionFamily' | 'planeFamily';

export interface ValidationResult {
  ok: boolean;
  error?: string;
}

/** Comprueba que los índices sean tres enteros, no todos cero. */
export function validateIndices(idx: readonly number[]): ValidationResult {
  if (idx.length !== 3) return { ok: false, error: 'Se requieren exactamente tres índices.' };
  if (!idx.every((x) => Number.isFinite(x))) return { ok: false, error: 'Todos los índices deben ser números.' };
  if (!idx.every((x) => Number.isInteger(x)))
    return { ok: false, error: 'Los índices de Miller deben ser números enteros.' };
  if (idx.every((x) => x === 0)) return { ok: false, error: 'Los índices [000] / (000) no definen ninguna dirección ni plano.' };
  return { ok: true };
}

export function gcd(a: number, b: number): number {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) [a, b] = [b, a % b];
  return a;
}

/** Máximo común divisor de los tres índices. */
export const gcd3 = (i: Indices): number => gcd(gcd(i[0], i[1]), i[2]);

/** Reduce los índices a sus enteros mínimos: [222] → [111] (factor 2). */
export function reduceIndices(i: Indices): { reduced: Indices; factor: number } {
  const g = gcd3(i);
  if (g <= 1) return { reduced: [i[0], i[1], i[2]], factor: 1 };
  return { reduced: [i[0] / g, i[1] / g, i[2] / g], factor: g };
}

const OVERLINE = '̅';

/** Un índice como texto: los negativos llevan barra superior (−1 → 1̄). */
export function formatIndex(n: number): string {
  if (n >= 0) return String(n);
  return String(-n)
    .split('')
    .map((c) => c + OVERLINE)
    .join('');
}

const BRACKETS: Record<IndexKind, [string, string]> = {
  direction: ['[', ']'],
  plane: ['(', ')'],
  directionFamily: ['<', '>'],
  planeFamily: ['{', '}'],
};

/**
 * Notación cristalográfica convencional. Si algún índice tiene más de un
 * dígito se separan con espacios para evitar ambigüedad: [1 12 0].
 */
export function formatIndices(i: Indices, kind: IndexKind = 'direction'): string {
  const [open, close] = BRACKETS[kind];
  const sep = i.some((x) => Math.abs(x) >= 10) ? ' ' : '';
  return open + i.map(formatIndex).join(sep) + close;
}

/** Piezas para renderizar en la interfaz con la clase CSS .bar. */
export function indexTokens(i: Indices): { text: string; negative: boolean }[] {
  return i.map((n) => ({ text: String(Math.abs(n)), negative: n < 0 }));
}

/**
 * Caracteres de la notación, uno por uno, indicando cuáles llevan barra
 * superior. Sirve para dibujar índices en SVG sin el carácter combinado
 * U+0305, que algunos navegadores colocan sobre el dígito equivocado.
 * [−1 1 0] → '[' '1'(barra) '1' '0' ']'
 */
export function indexGlyphs(i: Indices, kind: IndexKind = 'direction'): { ch: string; bar: boolean }[] {
  const [open, close] = BRACKETS[kind];
  const multi = i.some((n) => Math.abs(n) >= 10);
  const out: { ch: string; bar: boolean }[] = [{ ch: open, bar: false }];
  i.forEach((n, k) => {
    if (multi && k > 0) out.push({ ch: ' ', bar: false });
    for (const ch of String(Math.abs(n))) out.push({ ch, bar: n < 0 });
  });
  out.push({ ch: close, bar: false });
  return out;
}

/**
 * Interpreta texto escrito por el usuario. Acepta:
 *  - separados: "1 -1 0", "1,-1,0", "[1, -1, 0]", "(1 1 2)"
 *  - compactos de un dígito: "1-10", "-1-11", "110"
 *  - barra superior combinada: "11̄0"
 */
export function parseIndices(text: string): { ok: true; value: Indices } | { ok: false; error: string } {
  let s = text.trim().replace(/[[\](){}<>⟨⟩]/g, '').trim();
  // Barra superior combinada: "1̄" → "-1"
  s = s.replace(/(\d)̅/g, '-$1').replace(/−/g, '-');
  if (!s) return { ok: false, error: 'Escribe tres índices, por ejemplo 1 -1 0.' };

  let parts: string[];
  if (/[\s,;]/.test(s)) {
    parts = s.split(/[\s,;]+/).filter(Boolean);
  } else {
    parts = s.match(/-?\d/g) ?? [];
    if (parts.join('') !== s) return { ok: false, error: 'Formato no reconocido. Usa, por ejemplo, 1 -1 0 o 1-10.' };
  }
  if (parts.length !== 3) return { ok: false, error: `Se esperaban 3 índices y se encontraron ${parts.length}.` };
  if (!parts.every((p) => /^-?\d+$/.test(p))) return { ok: false, error: 'Los índices deben ser números enteros.' };

  const value = parts.map(Number) as unknown as Indices;
  const v = validateIndices(value);
  if (!v.ok) return { ok: false, error: v.error! };
  return { ok: true, value };
}

/** Origen de dibujo: coordenada 1 en los ejes cuyo índice es negativo. */
export const drawingOrigin = (i: Indices): Vec3 => [i[0] < 0 ? 1 : 0, i[1] < 0 ? 1 : 0, i[2] < 0 ? 1 : 0];

export interface DirectionDrawing {
  /** Punto de inicio de la flecha (esquina de la celda). */
  origin: Vec3;
  /** Punta de la flecha, siempre dentro de la celda 1 × 1 × 1. */
  tip: Vec3;
  /** Factor aplicado a [uvw] para que quepa: 1 / max|índice|. */
  scaleFactor: number;
  unit: Vec3;
}

/** Geometría para dibujar una dirección [uvw] dentro de la celda unitaria. */
export function directionDrawing(i: Indices): DirectionDrawing {
  const v = validateIndices(i);
  if (!v.ok) throw new Error(v.error);
  const maxAbs = Math.max(...i.map(Math.abs));
  const scaleFactor = 1 / maxAbs;
  const origin = drawingOrigin(i);
  const tip = add(origin, scale(i, scaleFactor));
  return { origin, tip, scaleFactor, unit: normalize(i) };
}

export interface PlaneDrawing {
  /** Ecuación del plano en coordenadas de la celda: h·x + k·y + l·z = d. */
  normal: Indices;
  d: number;
  /** Origen trasladado usado para construir el plano. */
  origin: Vec3;
  /** Intersección con cada eje medida desde el origen trasladado (Infinity si es paralelo). */
  intercepts: [number, number, number];
  /** Puntos de corte con los ejes (solo para índices ≠ 0). */
  interceptPoints: Vec3[];
  /** Polígono de intersección del plano con la celda, ordenado. */
  polygon: Vec3[];
  unitNormal: Vec3;
}

/** Las 8 esquinas y 12 aristas del cubo unitario. */
const CORNERS: Vec3[] = [
  [0, 0, 0], [1, 0, 0], [0, 1, 0], [1, 1, 0],
  [0, 0, 1], [1, 0, 1], [0, 1, 1], [1, 1, 1],
];
const EDGES: [number, number][] = [
  [0, 1], [2, 3], [4, 5], [6, 7], // paralelas a x
  [0, 2], [1, 3], [4, 6], [5, 7], // paralelas a y
  [0, 4], [1, 5], [2, 6], [3, 7], // paralelas a z
];

/**
 * Polígono que resulta de cortar la celda unitaria con el plano n·x = d.
 * Devuelve los vértices ordenados alrededor del centroide (listo para dibujar).
 */
export function clipPlaneToUnitCube(n: Vec3, d: number): Vec3[] {
  const pts: Vec3[] = [];
  const pushUnique = (p: Vec3) => {
    if (!pts.some((q) => Math.abs(q[0] - p[0]) < 1e-7 && Math.abs(q[1] - p[1]) < 1e-7 && Math.abs(q[2] - p[2]) < 1e-7))
      pts.push(p);
  };
  for (const [ia, ib] of EDGES) {
    const a = CORNERS[ia]!;
    const b = CORNERS[ib]!;
    const fa = dot(n, a) - d;
    const fb = dot(n, b) - d;
    if (Math.abs(fa) < EPS) pushUnique(a);
    if (Math.abs(fb) < EPS) pushUnique(b);
    if (fa * fb < 0 && Math.abs(fa) >= EPS && Math.abs(fb) >= EPS) {
      const t = fa / (fa - fb);
      pushUnique(add(a, scale(sub(b, a), t)));
    }
  }
  if (pts.length < 3) return pts;

  // Ordenar por ángulo alrededor del centroide, en una base del propio plano.
  const c = scale(pts.reduce((s, p) => add(s, p), [0, 0, 0] as Vec3), 1 / pts.length);
  const nn = normalize(n);
  const ref: Vec3 = Math.abs(nn[0]) < 0.9 ? [1, 0, 0] : [0, 1, 0];
  const u = normalize(sub(ref, scale(nn, dot(ref, nn))));
  const w: Vec3 = [nn[1] * u[2] - nn[2] * u[1], nn[2] * u[0] - nn[0] * u[2], nn[0] * u[1] - nn[1] * u[0]];
  return pts
    .map((p) => {
      const r = sub(p, c);
      return { p, ang: Math.atan2(dot(r, w), dot(r, u)) };
    })
    .sort((x, y) => x.ang - y.ang)
    .map((x) => x.p);
}

/** Geometría para dibujar el plano (hkl) dentro de la celda unitaria. */
export function planeDrawing(i: Indices): PlaneDrawing {
  const v = validateIndices(i);
  if (!v.ok) throw new Error(v.error);
  const origin = drawingOrigin(i);
  const intercepts = i.map((h) => (h === 0 ? Infinity : 1 / h)) as [number, number, number];
  // Plano: h(x − ox) + k(y − oy) + l(z − oz) = 1
  const d = 1 + dot(i, origin);
  const interceptPoints: Vec3[] = [];
  for (let axis = 0; axis < 3; axis++) {
    const t = intercepts[axis]!;
    if (!Number.isFinite(t)) continue;
    const p: [number, number, number] = [origin[0], origin[1], origin[2]];
    p[axis] = origin[axis]! + t;
    interceptPoints.push(p);
  }
  return {
    normal: i,
    d,
    origin,
    intercepts,
    interceptPoints,
    polygon: clipPlaneToUnitCube(i, d),
    unitNormal: normalize(i),
  };
}

/**
 * Todos los miembros de una familia <uvw> o {hkl} en un cristal cúbico:
 * permutaciones y cambios de signo, sin repetidos.
 * includeOpposites = false conserva solo uno de cada par ±v.
 */
export function familyMembers(i: Indices, includeOpposites = true): Indices[] {
  const perms: Indices[] = [
    [i[0], i[1], i[2]], [i[0], i[2], i[1]], [i[1], i[0], i[2]],
    [i[1], i[2], i[0]], [i[2], i[0], i[1]], [i[2], i[1], i[0]],
  ];
  const seen = new Set<string>();
  const out: Indices[] = [];
  for (const p of perms) {
    for (const sx of [1, -1]) for (const sy of [1, -1]) for (const sz of [1, -1]) {
      const m: Indices = [p[0] * sx || 0, p[1] * sy || 0, p[2] * sz || 0];
      const key = m.join(',');
      if (seen.has(key)) continue;
      if (!includeOpposites && seen.has(m.map((x) => -x || 0).join(','))) continue;
      seen.add(key);
      out.push(m);
    }
  }
  return out;
}

/** Signo canónico: el primer índice distinto de cero es positivo ([1̄10] → [11̄0]). */
export function canonicalSign(i: Indices): Indices {
  const first = i.find((x) => x !== 0) ?? 0;
  return first < 0 ? [-i[0] || 0, -i[1] || 0, -i[2] || 0] : [i[0], i[1], i[2]];
}

/** ¿Pertenecen a y b a la misma familia (cristal cúbico)? */
export function sameFamily(a: Indices, b: Indices): boolean {
  const key = (x: Indices) => x.map(Math.abs).sort((p, q) => p - q).join(',');
  return key(a) === key(b);
}
