import type { ActivationState } from '../../core';
import { DEFAULT_NEAR_RATIO, formatNumber } from '../../core';
import styles from './Sim.module.css';

const TEXT: Record<ActivationState, { title: string; body: string }> = {
  inactive: { title: 'Sistema no activado', body: '|τR| < τCRSS: el deslizamiento todavía no se activa.' },
  near: { title: 'Próximo a activarse', body: `|τR| ≥ ${DEFAULT_NEAR_RATIO * 100} % de τCRSS: un pequeño aumento del esfuerzo inicia el deslizamiento.` },
  active: { title: 'Sistema activado', body: '|τR| ≥ τCRSS: se alcanza la condición de inicio del deslizamiento según el criterio de Schmid.' },
};

/** Medidor |τR| / τCRSS con tres estados. */
export function ActivationMeter({ ratio, state }: { ratio: number | null; state: ActivationState | null }) {
  if (ratio === null || state === null) {
    return <div className={styles.meterEmpty}>Completa los datos para evaluar el sistema.</div>;
  }
  const MAX = 1.25;
  const pct = Math.min(ratio, MAX) / MAX;
  return (
    <div className={styles.meter} data-state={state} role="status" aria-live="polite">
      <div className={styles.meterHead}>
        <strong className={styles.meterTitle}>{TEXT[state].title}</strong>
        <span className={`mono ${styles.meterValue}`}>{formatNumber(ratio * 100, 3)} %</span>
      </div>
      <div className={styles.meterTrack} aria-hidden="true">
        <div className={styles.meterFill} style={{ width: `${pct * 100}%` }} />
        <div className={styles.meterMark} style={{ left: `${(DEFAULT_NEAR_RATIO / MAX) * 100}%` }} />
        <div className={styles.meterMark} data-strong="true" style={{ left: `${(1 / MAX) * 100}%` }} />
      </div>
      <p className={styles.meterCaption}>Marcas: 90 % (próximo) y 100 % (τCRSS) de |τR| / τCRSS.</p>
      <p className={styles.meterBody}>{TEXT[state].body}</p>
    </div>
  );
}
