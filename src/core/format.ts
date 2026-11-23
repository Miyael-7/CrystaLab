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

/**
 * Divide un texto que contiene índices con barra combinada (U+0305) en
 * segmentos, marcando los dígitos que llevan barra. La interfaz los dibuja con
 * la clase .bar, porque varios navegadores colocan el carácter combinado sobre
 * el carácter siguiente. Ejemplo: "[11̄0]" → "[1", "1"(barra), "0]".
 */
export function splitOverlines(text: string): { text: string; bar: boolean }[] {
  const out: { text: string; bar: boolean }[] = [];
  const re = /(\d)̅/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push({ text: text.slice(last, m.index), bar: false });
    out.push({ text: m[1]!, bar: true });
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push({ text: text.slice(last), bar: false });
  return out;
}
