import type { ReactNode } from 'react';
import styles from './Callout.module.css';

export type CalloutKind = 'note' | 'curiosity' | 'warning' | 'example' | 'key';

const TITLES: Record<CalloutKind, string> = {
  note: 'Nota',
  curiosity: 'Dato curioso',
  warning: 'Atención',
  example: 'Ejemplo',
  key: 'Idea clave',
};

/** Recuadro destacado dentro del texto. */
export function Callout({ kind = 'note', title, children }: { kind?: CalloutKind; title?: string; children: ReactNode }) {
  return (
    <aside className={styles.callout} data-kind={kind}>
      <p className={styles.title}>{title ?? TITLES[kind]}</p>
      <div className={styles.body}>{children}</div>
    </aside>
  );
}

export type Source = 'clase' | 'complemento';

/** Etiqueta que distingue el contenido de clase del complemento bibliográfico. */
export function SourceTag({ source }: { source: Source }) {
  return (
    <span
      className={styles.source}
      data-source={source}
      title={
        source === 'clase'
          ? 'Basado en las presentaciones del curso'
          : 'Complemento tomado de la bibliografía; no aparece en las presentaciones del curso'
      }
    >
      {source === 'clase' ? 'Contenido de clase' : 'Complemento bibliográfico'}
    </span>
  );
}
