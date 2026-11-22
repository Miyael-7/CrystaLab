/**
 * Índices de Miller dentro de un SVG.
 *
 * No se usa el carácter de barra combinada (U+0305): dentro de <text> varios
 * navegadores lo dibujan desplazado sobre el dígito SIGUIENTE, de modo que
 * [−1 1 0] se veía con la barra sobre el segundo 1. Aquí cada carácter es un
 * <text> independiente centrado en su propia celda, y la barra de los
 * negativos se dibuja como una línea explícita encima del dígito correcto.
 */
import { indexGlyphs, type IndexKind, type Indices } from '../../core';

/** Ancho de avance de un carácter monoespaciado, en em. */
const ADV = 0.6;

interface Props {
  v: Indices;
  kind?: IndexKind;
  x: number;
  y: number;
  color: string;
  fontSize?: number;
  anchor?: 'start' | 'middle' | 'end';
}

export function SvgIdx({ v, kind = 'direction', x, y, color, fontSize = 12, anchor = 'start' }: Props) {
  const glyphs = indexGlyphs(v, kind);
  const w = fontSize * ADV;
  const total = glyphs.length * w;
  const x0 = anchor === 'start' ? x : anchor === 'end' ? x - total : x - total / 2;
  const pad = 3;
  const barY = y - fontSize * 0.92;
  return (
    <g className="mono" aria-hidden="true">
      {/* Fondo para que ninguna línea del diagrama atraviese la etiqueta */}
      <rect x={x0 - pad} y={y - fontSize - 1} width={total + 2 * pad} height={fontSize + 5} rx={3} fill="var(--bg-viewport)" fillOpacity={0.85} />
      {glyphs.map((g, i) => (
        <text key={i} x={x0 + i * w + w / 2} y={y} fill={color} fontSize={fontSize} fontWeight={700} textAnchor="middle"
          fontFamily="var(--font-mono)">
          {g.ch}
        </text>
      ))}
      {glyphs.map((g, i) =>
        g.bar ? (
          <line key={`b${i}`} x1={x0 + i * w + w * 0.12} x2={x0 + (i + 1) * w - w * 0.12} y1={barY} y2={barY} stroke={color} strokeWidth={Math.max(1.2, fontSize / 10)} strokeLinecap="round" />
        ) : null,
      )}
    </g>
  );
}
