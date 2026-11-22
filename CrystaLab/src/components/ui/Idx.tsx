import type { IndexKind, Indices } from '../../core';
import { indexTokens } from '../../core';

const BRACKETS: Record<IndexKind, [string, string]> = {
  direction: ['[', ']'],
  plane: ['(', ')'],
  directionFamily: ['<', '>'],
  planeFamily: ['{', '}'],
};

/**
 * Índices de Miller con notación cristalográfica: los negativos llevan barra
 * superior (clase global .bar). <Idx v={[1,-1,0]} /> → [11̄0]
 */
export function Idx({ v, kind = 'direction' }: { v: Indices; kind?: IndexKind }) {
  const [open, close] = BRACKETS[kind];
  const multi = v.some((x) => Math.abs(x) >= 10);
  return (
    <span className="mono" style={{ whiteSpace: 'nowrap' }}>
      {open}
      {indexTokens(v).map((t, i) => (
        <span key={i}>
          {multi && i > 0 ? ' ' : ''}
          <span className={t.negative ? 'bar' : undefined}>{t.text}</span>
        </span>
      ))}
      {close}
    </span>
  );
}
