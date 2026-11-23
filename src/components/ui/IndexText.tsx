import { splitOverlines } from '../../core';

/**
 * Muestra un texto (por ejemplo, un mensaje de error del núcleo) dibujando la
 * barra de los índices negativos con la clase .bar, sobre el dígito correcto.
 */
export function IndexText({ text }: { text: string }) {
  return (
    <>
      {splitOverlines(text).map((s, i) =>
        s.bar ? (
          <span key={i} className="bar">
            {s.text}
          </span>
        ) : (
          <span key={i}>{s.text}</span>
        ),
      )}
    </>
  );
}
