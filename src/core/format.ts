/** Coordenada como fracción simple (0.333… → 1/3), con signo menos tipográfico. */
export function frac(x: number): string {
  for (let den = 1; den <= 12; den++) {
    const num = Math.round(x * den);
    if (Math.abs(num / den - x) < 1e-9) {
      const s = den === 1 ? String(num) : `${num}/${den}`;
      return s.replace('-', '−');
    }
  }
  return x.toFixed(2).replace('-', '−');
}
