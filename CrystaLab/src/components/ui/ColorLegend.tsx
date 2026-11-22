import styles from './ColorLegend.module.css';

export const PHYSICS_LEGEND = [
  { color: 'var(--c-load)', label: 'Fuerza y eje de carga', shape: 'arrow' },
  { color: 'var(--c-normal)', label: 'Normal al plano  n̂', shape: 'arrow' },
  { color: 'var(--c-slip)', label: 'Dirección de deslizamiento  d̂', shape: 'arrow' },
  { color: 'var(--c-plane)', label: 'Plano de deslizamiento', shape: 'plane' },
  { color: 'var(--c-phi)', label: 'Ángulo φ', shape: 'arc' },
  { color: 'var(--c-lambda)', label: 'Ángulo λ', shape: 'arc' },
] as const;

/** Código de color fijo de los elementos físicos (igual en 3D, leyendas y paneles). */
export function ColorLegend({ compact = false }: { compact?: boolean }) {
  return (
    <ul className={styles.legend} data-compact={compact}>
      {PHYSICS_LEGEND.map((item) => (
        <li key={item.label} className={styles.item}>
          <span className={styles.swatch} data-shape={item.shape} style={{ ['--sw' as string]: item.color }} aria-hidden="true" />
          {item.label}
        </li>
      ))}
    </ul>
  );
}
