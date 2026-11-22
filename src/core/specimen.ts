/**
 * Geometría de la probeta para el simulador de Schmid.
 *
 * Marco de la probeta ("mundo"): z hacia arriba = eje de carga. El cristal se
 * rota para que la dirección de carga [abc] quede a lo largo de +z. Queda libre
 * una rotación alrededor de z, que no cambia φ, λ ni m; por convención se fija
 * de modo que la componente horizontal de la normal apunte hacia +y.
 */
import { add, cross, dot, EPS, norm, normalize, scale, sub, type Vec3 } from './vector';

/** Matriz 3×3 por filas. */
export type Mat3 = readonly [Vec3, Vec3, Vec3];

export const applyMat = (m: Mat3, v: Vec3): Vec3 => [dot(m[0], v), dot(m[1], v), dot(m[2], v)];
export const det3 = (m: Mat3): number => dot(m[0], cross(m[1], m[2]));

/**
 * Rotación cristal → probeta: lleva `load` a +z y la parte horizontal de `ref`
 * a +y. Si `ref` es paralelo a la carga se usa `fallback`.
 */
export function specimenRotation(load: Vec3, ref: Vec3, fallback: Vec3): Mat3 {
  const ez = normalize(load);
  let h = sub(ref, scale(ez, dot(ref, ez)));
  if (norm(h) < 1e-7) h = sub(fallback, scale(ez, dot(fallback, ez)));
  if (norm(h) < 1e-7) {
    // Último recurso: cualquier perpendicular a ez.
    h = Math.abs(ez[0]) < 0.9 ? cross(ez, [1, 0, 0]) : cross(ez, [0, 1, 0]);
  }
  const ey = normalize(h);
  const ex = cross(ey, ez);
  return [ex, ey, ez];
}

/** Interpolación esférica entre dos vectores unitarios. */
export function slerp(a: Vec3, b: Vec3, t: number): Vec3 {
  const om = Math.acos(Math.min(1, Math.max(-1, dot(a, b))));
  if (om < 1e-9) return a;
  const s = Math.sin(om);
  return add(scale(a, Math.sin((1 - t) * om) / s), scale(b, Math.sin(t * om) / s));
}

/** Puntos de un arco de radio r entre las direcciones a y b (para dibujar ángulos). */
export function arcPoints(a: Vec3, b: Vec3, r: number, segments = 32): Vec3[] {
  const ua = normalize(a);
  const ub = normalize(b);
  return Array.from({ length: segments + 1 }, (_, i) => scale(slerp(ua, ub, i / segments), r));
}

/** Orienta v para que forme un ángulo agudo con `axis` (misma recta, sentido opuesto si hace falta). */
export const acuteTo = (v: Vec3, axis: Vec3): Vec3 => (dot(v, axis) < 0 ? scale(v, -1) : v);

/**
 * Sección del plano n·p = 0 (que pasa por el centro) con un cilindro de eje z,
 * radio R y altura 2h. Devuelve un polígono convexo ordenado: una elipse,
 * recortada por las tapas si el plano está muy inclinado, o un rectángulo si
 * el plano es vertical.
 */
export function cylinderSection(n: Vec3, R: number, h: number, segments = 96): Vec3[] {
  const nn = normalize(n);
  if (Math.abs(nn[2]) < 1e-6) {
    const u = normalize(cross(nn, [0, 0, 1]));
    return [add(scale(u, R), [0, 0, -h]), add(scale(u, R), [0, 0, h]), add(scale(u, -R), [0, 0, h]), add(scale(u, -R), [0, 0, -h])];
  }
  const ellipse: Vec3[] = Array.from({ length: segments }, (_, i) => {
    const t = (i / segments) * 2 * Math.PI;
    const x = R * Math.cos(t);
    const y = R * Math.sin(t);
    return [x, y, -(nn[0] * x + nn[1] * y) / nn[2]];
  });
  return clipZ(clipZ(ellipse, h, 1), -h, -1);
}

/**
 * Recorte de Sutherland–Hodgman de un polígono contra el semiespacio
 * sign·z ≤ sign·limit (sign = 1: z ≤ limit; sign = −1: z ≥ limit).
 */
function clipZ(poly: Vec3[], limit: number, sign: 1 | -1): Vec3[] {
  const inside = (p: Vec3) => sign * (p[2] - limit) <= 1e-12;
  const out: Vec3[] = [];
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i]!;
    const b = poly[(i + 1) % poly.length]!;
    const ia = inside(a);
    const ib = inside(b);
    if (ia) out.push(a);
    if (ia !== ib) {
      const t = (limit - a[2]) / (b[2] - a[2]);
      out.push(add(a, scale(sub(b, a), t)));
    }
  }
  return out;
}

/**
 * Normal y dirección de deslizamiento en el marco de la probeta a partir de
 * φ y λ (grados). La normal se coloca hacia +y. Devuelve null si la
 * orientación es imposible (φ + λ < 90°).
 */
export function vectorsFromAngles(phiDeg: number, lambdaDeg: number): { n: Vec3; d: Vec3 } | null {
  const phi = (phiDeg * Math.PI) / 180;
  const lam = (lambdaDeg * Math.PI) / 180;
  const sp = Math.sin(phi);
  const n: Vec3 = [0, sp, Math.cos(phi)];
  if (sp < EPS) {
    // Normal paralela a la carga: d es horizontal, por lo que λ debe ser 90°.
    return Math.abs(lambdaDeg - 90) < 1e-9 ? { n: [0, 0, 1], d: [1, 0, 0] } : null;
  }
  const e1: Vec3 = [0, Math.cos(phi), -sp]; // en el plano, en el plano vertical y–z
  const e2: Vec3 = [1, 0, 0]; // en el plano, horizontal
  const cb = -Math.cos(lam) / sp;
  if (cb < -1 - 1e-9 || cb > 1 + 1e-9) return null;
  const c = Math.max(-1, Math.min(1, cb));
  const d = normalize(add(scale(e1, c), scale(e2, Math.sqrt(1 - c * c))));
  return { n, d };
}

/**
 * Desplazamiento de la mitad superior de la probeta durante la animación.
 * En tensión la parte superior (lado de +n̂, con n̂·ẑ > 0) avanza en +d̂
 * (con d̂·ẑ ≥ 0); en compresión, en −d̂. El desplazamiento está contenido en el
 * plano de deslizamiento, por lo que el plano no se mueve.
 */
export function slipOffset(dUp: Vec3, sigmaSign: number, progress: number, amplitude: number): Vec3 {
  const t = Math.max(0, Math.min(1, progress));
  return scale(normalize(dUp), (sigmaSign >= 0 ? 1 : -1) * amplitude * t);
}
