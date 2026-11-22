/** Estado compartido del simulador de Schmid (el comparador FCC/BCC podrá escribir aquí). */
import type { Indices, Vec3 } from '../core';
import { createStore } from '../lib/store';
import { DEFAULT_INPUTS, type SchmidInputs } from './schmidModel';

export const schmidStore = createStore<SchmidInputs>(DEFAULT_INPUTS);

/** Carga un sistema de deslizamiento y una dirección de carga en el simulador (más otros valores opcionales). */
export function loadSlipSystem(plane: Indices, dir: Indices, load: Vec3, extra: Partial<SchmidInputs> = {}) {
  schmidStore.set({ ...extra, mode: 'indices', plane, dir, load });
}

export interface SchmidPreset {
  id: string;
  /** Texto corto; la página añade el sistema (hkl)[uvw] con notación correcta. */
  label: string;
  title: string;
  values: Partial<SchmidInputs>;
}

/**
 * Ejemplos. Los de clase reproducen los datos de las presentaciones; cuando la
 * presentación no da σ o τCRSS se usan valores ilustrativos (se indica en `title`).
 */
export const SCHMID_PRESETS: SchmidPreset[] = [
  {
    id: 'bcc-121',
    label: 'BCC · carga [121]',
    title: 'Ejemplo de clase: τCRSS = 82.73 MPa; σ = 210 MPa (valor ilustrativo, mayor que los 202.6 MPa necesarios).',
    values: { mode: 'indices', plane: [1, 1, 0], dir: [-1, 1, 1], load: [1, 2, 1], loadType: 'tension', stressMode: 'stress', stress: 210, stressUnit: 'MPa', crss: 82.73, crssUnit: 'MPa' },
  },
  {
    id: 'fcc-100',
    label: 'FCC · carga [100]',
    title: 'Ejemplo de clase (m = 0.408). σ = 1.5 MPa y τCRSS = 0.7 MPa son valores ilustrativos del orden del cobre.',
    values: { mode: 'indices', plane: [1, 1, 1], dir: [1, -1, 0], load: [1, 0, 0], loadType: 'tension', stressMode: 'stress', stress: 1.5, stressUnit: 'MPa', crss: 0.7, crssUnit: 'MPa' },
  },
  {
    id: 'bcc-123',
    label: 'BCC · carga [123]',
    title: 'Ejemplo de clase: sistema primario, m = 0.467. σ = 135 MPa y τCRSS = 67 MPa (ilustrativos) → próximo a activarse.',
    values: { mode: 'indices', plane: [1, 0, 1], dir: [1, -1, -1], load: [1, 2, 3], loadType: 'tension', stressMode: 'stress', stress: 135, stressUnit: 'MPa', crss: 67, crssUnit: 'MPa' },
  },
  {
    id: 'coplanar',
    label: 'Coplanar · m = 0.5',
    title: 'Eje de carga en el plano de n̂ y d̂: φ = λ = 45°, factor de Schmid máximo. Valores ilustrativos.',
    values: { mode: 'indices', plane: [1, 0, 1], dir: [-1, 0, 1], load: [1, 0, 0], loadType: 'tension', stressMode: 'stress', stress: 100, stressUnit: 'MPa', crss: 40, crssUnit: 'MPa' },
  },
  {
    id: 'force',
    label: 'F = 5 kN, d = 10 mm',
    title: 'σ = F/A₀ con una probeta cilíndrica de 10 mm de diámetro (valores ilustrativos).',
    values: { mode: 'indices', plane: [1, 1, 1], dir: [1, -1, 0], load: [1, 2, 3], loadType: 'tension', stressMode: 'force', force: 5, forceUnit: 'kN', areaMode: 'diameter', diameter: 10, diameterUnit: 'mm', crss: 20, crssUnit: 'MPa' },
  },
  {
    id: 'ang-1',
    label: 'Ángulos · φ = 43.1°, λ = 47.9°',
    title: 'Ejercicio de clase: σ = 45 MPa, τCRSS = 20.7 MPa → sí desliza.',
    values: { mode: 'angles', phi: 43.1, lambda: 47.9, loadType: 'tension', stressMode: 'stress', stress: 45, stressUnit: 'MPa', crss: 20.7, crssUnit: 'MPa' },
  },
  {
    id: 'ang-al',
    label: 'Ángulos · Al, φ = 28.1°, λ = 62.4°',
    title: 'Ejercicio de clase (aluminio): σ = 1.95 MPa al inicio de la deformación; τCRSS = 0.797 MPa es el resultado del ejercicio.',
    values: { mode: 'angles', phi: 28.1, lambda: 62.4, loadType: 'tension', stressMode: 'stress', stress: 1.95, stressUnit: 'MPa', crss: 0.797, crssUnit: 'MPa' },
  },
];
