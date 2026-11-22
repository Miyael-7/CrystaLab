# src/scenes — escenas 3D

- `primitives.ts`: tipos de primitivas (flecha, línea, polígono, esfera, cilindro, etiqueta), `toThree()` y `effectiveFov()`.
- `millerScene.ts` y `schmidScene.ts`: funciones **puras** que construyen la escena de cada simulador. Se prueban en `scenes.test.ts`.
- `Primitives3D.tsx`: convierte las primitivas en objetos de Three.js (React Three Fiber + Drei). No contiene física.
- `Scene3D.tsx`: lienzo, cámara orbital, luces y animación del grupo `upper` (deslizamiento).

Coordenadas de mundo con z hacia arriba (x hacia el observador, y a la derecha). La conversión a Three.js (y hacia arriba) ocurre solo en el renderizador.
