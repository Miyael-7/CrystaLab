/**
 * Descripción declarativa de una escena 3D.
 *
 * Los simuladores no dibujan directamente con Three.js: construyen una lista
 * de primitivas con funciones puras (probadas con pruebas unitarias) y un único
 * componente (Primitives3D) las convierte en objetos de Three.js.
 *
 * Coordenadas "de mundo" con z hacia arriba (convención de clase: x hacia el
 * observador, y a la derecha, z arriba). La conversión a Three.js (y arriba)
 * se hace solo en el renderizador con toThree().
 */
import type { IndexKind, Indices, Vec3 } from '../core';

/** Grupo animable: las primitivas del grupo 'upper' se desplazan durante el deslizamiento. */
export type Group = 'static' | 'upper';

interface Base {
  id: string;
  group?: Group;
  opacity?: number;
}

export interface LinePrim extends Base {
  kind: 'line';
  points: Vec3[];
  color: string;
  width?: number;
  dashed?: boolean;
}

export interface ArrowPrim extends Base {
  kind: 'arrow';
  from: Vec3;
  to: Vec3;
  color: string;
  radius?: number;
}

export interface PolygonPrim extends Base {
  kind: 'polygon';
  points: Vec3[];
  color: string;
  outline?: boolean;
}

export interface SpherePrim extends Base {
  kind: 'sphere';
  center: Vec3;
  radius: number;
  color: string;
}

export interface LabelPrim extends Base {
  kind: 'label';
  position: Vec3;
  color: string;
  text?: string;
  idx?: { v: Indices; kind: IndexKind };
  /** Texto después de los índices. */
  suffix?: string;
  size?: 'sm' | 'md';
}

/** Cilindro de eje z centrado en el origen; `keep` lo recorta con el plano n̂·p = 0. */
export interface CylinderPrim extends Base {
  kind: 'cylinder';
  radius: number;
  halfHeight: number;
  color: string;
  clip?: { normal: Vec3; keep: 'above' | 'below' };
}

export type Prim = LinePrim | ArrowPrim | PolygonPrim | SpherePrim | LabelPrim | CylinderPrim;

export interface SceneCamera {
  /** Posición y objetivo en coordenadas de mundo (z arriba). */
  position: Vec3;
  target: Vec3;
  fov: number;
}

export interface SceneDescription {
  prims: Prim[];
  camera: SceneCamera;
}

/** Mundo (x, y, z con z arriba) → Three.js (X = y, Y = z, Z = x). Es una rotación (det = +1). */
export const toThree = (p: Vec3): [number, number, number] => [p[1], p[2], p[0]];

/**
 * Campo de visión vertical efectivo. Si el visor es más alto que ancho, se
 * amplía para que el ancho visible sea el mismo que con el campo base en un
 * visor cuadrado (así el modelo no se corta en teléfonos).
 */
export function effectiveFov(baseFovDeg: number, aspect: number): number {
  if (!(aspect > 0) || aspect >= 1) return baseFovDeg;
  const half = (baseFovDeg * Math.PI) / 360;
  const fov = (2 * Math.atan(Math.tan(half) / aspect) * 180) / Math.PI;
  return Math.min(fov, 80);
}
