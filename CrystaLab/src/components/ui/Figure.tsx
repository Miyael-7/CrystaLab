import type { ReactNode } from 'react';
import styles from './Figure.module.css';

/** Una o varias ilustraciones con pie de figura. */
export function Figure({ children, caption }: { children: ReactNode; caption?: ReactNode }) {
  return (
    <figure className={styles.figure}>
      <div className={styles.row}>{children}</div>
      {caption && <figcaption className={styles.caption}>{caption}</figcaption>}
    </figure>
  );
}

/** Ilustración con un rótulo corto debajo (para poner varias en fila). */
export function Panel({ children, label }: { children: ReactNode; label?: ReactNode }) {
  return (
    <div className={styles.panel}>
      {children}
      {label && <span className={styles.label}>{label}</span>}
    </div>
  );
}
