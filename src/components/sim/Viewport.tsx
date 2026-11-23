import { useState, type ReactNode } from 'react';
import styles from './Sim.module.css';

const wide = () => typeof window === 'undefined' || window.matchMedia('(min-width: 861px)').matches;

/**
 * Ventana del simulador: lienzo 3D con leyenda plegable, ayuda de navegación,
 * botón para restablecer la vista y, opcionalmente, una franja inferior
 * (`footer`) dentro del mismo marco, que no tapa el modelo.
 */
export function Viewport({
  children,
  onResetView,
  overlay,
  legend,
  footer,
}: {
  children: ReactNode;
  onResetView: () => void;
  overlay?: ReactNode;
  legend?: ReactNode;
  footer?: ReactNode;
}) {
  const [showLegend, setShowLegend] = useState(wide);
  return (
    <div className={styles.viewport} data-has-footer={footer ? 'true' : undefined}>
      <div className={styles.stage}>
        {children}
        {overlay && <div className={styles.overlay}>{overlay}</div>}
        {legend && showLegend && <div className={styles.legend}>{legend}</div>}
        <div className={styles.viewBar}>
          <span className={styles.viewHint}>Arrastra para rotar · rueda o pellizco para acercar · clic derecho o dos dedos para desplazar</span>
          <span className={styles.viewButtons}>
            {legend && (
              <button type="button" className={styles.viewButton} aria-pressed={showLegend} onClick={() => setShowLegend((v) => !v)}>
                {showLegend ? 'Ocultar leyenda' : 'Leyenda'}
              </button>
            )}
            <button type="button" className={styles.viewButton} onClick={onResetView}>
              Restablecer vista
            </button>
          </span>
        </div>
      </div>
      {footer && <div className={styles.footer}>{footer}</div>}
    </div>
  );
}
