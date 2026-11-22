# src/core — núcleo matemático y físico

TypeScript puro: sin React ni Three.js. Cada función debe tener pruebas unitarias (`*.test.ts`).

Módulos (ver `docs/validacion.md` para los casos verificados):

- `vector.ts`: normalización, producto punto, ángulo entre vectores, grados ↔ radianes.
- `miller.ts`: análisis de índices, reducción por MCD, notación con barra y polígono de un plano en la celda.
- `slip.ts`: pertenencia de una dirección a un plano, factor de Schmid y τR con signo.
- `families.ts`: generación de {hkl}, <uvw> y de los 12 sistemas FCC y BCC.
- `units.ts`: conversión de N/kN y Pa/MPa/GPa, y A₀ = πd²/4.

- `index.ts`: punto de entrada que reexporta todo el núcleo.

Para importar desde otra parte de la app: `import { schmidFactor } from '../core';`
