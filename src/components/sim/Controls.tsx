/** Controles de entrada de los simuladores. */
import { useEffect, useId, useState, type ReactNode } from 'react';
import type { IndexKind, Indices } from '../../core';
import { Idx } from '../ui/Idx';
import styles from './Sim.module.css';

/**
 * Campo numérico que permite escribir valores intermedios ("-", "1.") sin
 * perder el foco; solo notifica cuando el texto es un número válido.
 */
export function NumInput({
  value,
  onChange,
  step = 1,
  min,
  max,
  integer = false,
  ariaLabel,
  className,
}: {
  value: number;
  onChange: (v: number) => void;
  step?: number;
  min?: number;
  max?: number;
  integer?: boolean;
  ariaLabel: string;
  className?: string;
}) {
  const [text, setText] = useState(String(value));
  useEffect(() => {
    if (Number(text) !== value) setText(String(value));
  }, [value]);
  const valid = (t: string) => t.trim() !== '' && Number.isFinite(Number(t)) && (!integer || Number.isInteger(Number(t)));
  return (
    <input
      type="number"
      inputMode={integer ? 'numeric' : 'decimal'}
      className={`${styles.num} ${className ?? ''}`}
      value={text}
      step={step}
      min={min}
      max={max}
      aria-label={ariaLabel}
      aria-invalid={!valid(text)}
      onChange={(e) => {
        setText(e.target.value);
        if (valid(e.target.value)) onChange(Number(e.target.value));
      }}
      onBlur={() => {
        if (!valid(text)) setText(String(value));
      }}
    />
  );
}

/** Tres índices (o componentes) con vista previa en notación cristalográfica. */
export function IndexInput({
  label,
  value,
  onChange,
  kind = 'direction',
  integer = true,
  letters = ['u', 'v', 'w'],
  color,
}: {
  label: ReactNode;
  value: Indices;
  onChange: (v: Indices) => void;
  kind?: IndexKind;
  integer?: boolean;
  letters?: [string, string, string];
  color?: string;
}) {
  const allInt = value.every((x) => Number.isInteger(x));
  return (
    <div className={styles.field}>
      <div className={styles.fieldHead}>
        <span className={styles.fieldLabel}>
          {color && <span className={styles.dot} style={{ background: color }} aria-hidden="true" />}
          {label}
        </span>
        <span className={styles.preview}>{allInt ? <Idx v={value} kind={kind} /> : <span className="mono">[{value.join(', ')}]</span>}</span>
      </div>
      <div className={styles.triple}>
        {value.map((v, i) => (
          <label key={i} className={styles.tripleItem}>
            <span className={styles.letter}>{letters[i]}</span>
            <NumInput
              value={v}
              integer={integer}
              step={integer ? 1 : 0.1}
              min={integer ? -9 : undefined}
              max={integer ? 9 : undefined}
              ariaLabel={`${typeof label === 'string' ? label : 'índice'} ${letters[i]}`}
              onChange={(n) => {
                const next = [...value] as [number, number, number];
                next[i] = n;
                onChange(next);
              }}
            />
          </label>
        ))}
      </div>
    </div>
  );
}

/** Selector segmentado (botones de opción). */
export function Segmented<T extends string>({
  value,
  options,
  onChange,
  ariaLabel,
}: {
  value: T;
  options: { value: T; label: ReactNode }[];
  onChange: (v: T) => void;
  ariaLabel: string;
}) {
  return (
    <div className={styles.segmented} role="radiogroup" aria-label={ariaLabel}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          className={styles.segment}
          data-active={value === o.value}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/** Número con selector de unidad. */
export function UnitField<U extends string>({
  label,
  value,
  unit,
  units,
  onValue,
  onUnit,
  hint,
}: {
  label: ReactNode;
  value: number;
  unit: U;
  units: readonly U[];
  onValue: (v: number) => void;
  onUnit: (u: U) => void;
  hint?: ReactNode;
}) {
  const id = useId();
  return (
    <div className={styles.field}>
      <label className={styles.fieldLabel} htmlFor={id}>
        {label}
      </label>
      <div className={styles.unitRow}>
        <NumInput value={value} onChange={onValue} step={0.1} min={0} ariaLabel={typeof label === 'string' ? label : 'valor'} className={styles.grow} />
        <select className={styles.select} value={unit} onChange={(e) => onUnit(e.target.value as U)} aria-label="Unidad">
          {units.map((u) => (
            <option key={u} value={u}>
              {u}
            </option>
          ))}
        </select>
      </div>
      {hint && <p className={styles.hint}>{hint}</p>}
    </div>
  );
}

export function Toggle({ checked, onChange, children }: { checked: boolean; onChange: (v: boolean) => void; children: ReactNode }) {
  return (
    <label className={styles.toggle}>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className={styles.toggleTrack} aria-hidden="true" />
      <span>{children}</span>
    </label>
  );
}

/** Tarjeta del panel lateral. */
export function PanelCard({ title, children, actions }: { title: ReactNode; children: ReactNode; actions?: ReactNode }) {
  return (
    <section className={styles.card}>
      <header className={styles.cardHead}>
        <h2 className={styles.cardTitle}>{title}</h2>
        {actions}
      </header>
      {children}
    </section>
  );
}

/** Botones de ejemplos rápidos. */
export function Chips<T>({ items, onPick, label }: { items: { label: ReactNode; value: T; title?: string }[]; onPick: (v: T) => void; label: string }) {
  return (
    <div className={styles.chips} role="group" aria-label={label}>
      {items.map((it, i) => (
        <button key={i} type="button" className={styles.chip} onClick={() => onPick(it.value)} title={it.title}>
          {it.label}
        </button>
      ))}
    </div>
  );
}
