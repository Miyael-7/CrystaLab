# Decisiones de diseño y alcance

Registro de las decisiones acordadas con el equipo. Toda etapa nueva debe respetarlas.

## Alcance

- **Solo cristales cúbicos.** En un cristal cúbico, la normal al plano (hkl) es paralela a la dirección [hkl] y los ángulos no dependen del parámetro de red. Los sistemas no cúbicos (p. ej. HCP) requieren la red recíproca y quedan para versiones futuras.
- **Todo se calcula en el navegador.** No hay servidor, base de datos ni servicios externos.

## Notación (unificada en toda la aplicación)

| Símbolo | Significado |
|---|---|
| σ | Esfuerzo **normal** aplicado (σ = F / A₀) |
| τR | Esfuerzo **cortante** resuelto en el sistema de deslizamiento |
| τCRSS | Esfuerzo cortante crítico resuelto |
| φ | Ángulo entre el eje de carga y la **normal** al plano de deslizamiento |
| λ | Ángulo entre el eje de carga y la **dirección** de deslizamiento |
| m | Factor de Schmid, m = cos φ cos λ |

- Una de las presentaciones de clase usa α y β. En la biblioteca se aclara que **α ≡ φ** y **β ≡ λ**.
- Una diapositiva de clase llama "esfuerzo cortante" a σ. En la app, σ es siempre el esfuerzo normal aplicado.
- Los índices negativos se muestran con barra superior (1̄).

## Reglas físicas implementadas

- Validez del sistema de deslizamiento: hu + kv + lw = 0.
- Los vectores se normalizan antes de calcular los ángulos.
- φ y λ son independientes en el caso general; **no** se asume φ + λ = 90° (eso solo ocurre si el eje de carga está en el plano que forman la normal y la dirección de deslizamiento).
- Restricción geométrica: como la normal es perpendicular a la dirección de deslizamiento, siempre se cumple **φ + λ ≥ 90°**. La calculadora por ángulos muestra una advertencia si no se cumple.
- La activación se evalúa con |τR| ≥ τCRSS. El signo de τR indica el sentido del corte.
- "Próximo a activarse": |τR| ≥ 90 % de τCRSS (umbral configurable).

## Ejercicios de clase

- **Se excluyen** de la app los ejercicios con datos físicamente imposibles. Ejemplo: φ = 32.5°, λ = 56.8° (suma 89.3° < 90°).
- **Dato curioso (simetría FCC ↔ BCC).** Los sistemas {111}<110> (FCC) y {110}<111> (BCC) son familias intercambiadas, y m es simétrico al intercambiar normal y dirección. Por lo tanto, para cualquier eje de carga, ambas estructuras tienen el mismo conjunto de factores de Schmid. La app lo muestra como "Dato curioso" en el comparador FCC/BCC.

## Técnicas

- **Enrutamiento por hash** (`#/ruta`), implementado como un módulo propio pequeño (`src/lib/router`) para no depender de una librería externa. Evita los errores 404 de GitHub Pages al recargar la página.
- `base: './'` en Vite: la app funciona en GitHub Pages sin importar el nombre del repositorio.
- **CSS Modules** con variables CSS (`src/styles/tokens.css`).
- Separación estricta entre la física (`src/core`, TypeScript puro y probado) y la visualización (`src/scenes`).

## Interfaz (Etapa 3)

- Las familias de direcciones se escriben con `<uvw>`, como en las presentaciones de clase. Los paréntesis angulares tipográficos (⟨ ⟩) se descartaron porque en varias fuentes se confunden con los paréntesis de los planos.
- Los diagramas de la biblioteca son SVG generados con `src/core`, así que su geometría es exacta. Los ejemplos numéricos de la biblioteca también se calculan en vivo con el núcleo.
- Cada apartado de la biblioteca indica si es «Contenido de clase» o «Complemento bibliográfico».
- Los índices dentro de los diagramas SVG **no** usan el carácter de barra combinada (U+0305): varios navegadores lo dibujan sobre el dígito siguiente, y [1̄10] se veía como [11̄0]. Cada carácter se dibuja por separado y la barra es una línea explícita (`SvgIdx` + `indexGlyphs`, con prueba de regresión).
- Las direcciones con índices negativos pueden mostrar las coordenadas de **inicio** y **punta**, para comprobar «punta − inicio».

## Simuladores 3D (Etapa 4)

- **Arquitectura de escenas.** Cada simulador construye una lista de primitivas (flechas, líneas, polígonos, esferas, cilindro, etiquetas) con una función pura: `buildMillerScene` y `buildSchmidScene`, ambas probadas. Un único componente, `Primitives3D`, las convierte en objetos de Three.js. Así la geometría se verifica con pruebas y el código de Three.js no contiene física.
- **Ejes.** El mundo usa z hacia arriba, con x hacia el observador e y a la derecha, como en clase. Three.js usa y hacia arriba; la conversión `toThree` (x, y, z) → (y, z, x) es una rotación propia (det = +1) y está probada.
- **Probeta.** El cristal se rota para que la dirección de carga [abc] quede vertical. La rotación libre alrededor del eje se fija para que la normal se incline hacia la derecha de la pantalla; esa rotación no cambia φ, λ ni m (probado).
- **Ángulos mostrados.** φ y λ se muestran como ángulos agudos entre rectas (convención de clase). La normal y la dirección se dibujan en el sentido que forma ángulo agudo con +z. El panel «Magnitud y signo» muestra los ángulos entre vectores y los cosenos con signo.
- **Signo de τR.** τR = σ·m con σ > 0 en tensión y σ < 0 en compresión. La activación usa |τR| ≥ τCRSS; «próximo» significa |τR| ≥ 90 % de τCRSS.
- **Animación.** La mitad superior de la probeta se recorta con el plano de deslizamiento (planos de recorte de Three.js) y se traslada a lo largo de ±d̂: + en tensión, − en compresión. El desplazamiento está contenido en el plano, así que el plano no se mueve (probado). Es una representación conceptual y no modifica ningún resultado.
- **Plano muy inclinado.** Si el plano corta las tapas de la probeta, su sección se recorta con las tapas; si es vertical (φ = 90°), la sección es un rectángulo.
- **Estado compartido.** Un almacén propio de unas 30 líneas (`src/lib/store.ts`) reemplaza a Zustand, que se eliminó de las dependencias. El comparador FCC/BCC podrá cargar un sistema en el simulador con `loadSlipSystem`.
- **Etiquetas 3D.** Son elementos HTML (`Html` de Drei), así que los índices negativos usan el mismo componente `Idx` que el resto de la app. No se usa el texto 3D de Drei, que descarga fuentes de internet.
- **Ejemplos del simulador.** Cuando la presentación no da σ o τCRSS, se usan valores ilustrativos; cada ejemplo lo indica en su descripción emergente.

## Comparador FCC / BCC (Etapa 5)

- Para una dirección de carga, el comparador muestra los 12 sistemas de la estructura con φ, λ, |m|, τR, el estado y el σ necesario para activar cada uno, ordenados por |m|. Los sistemas empatados comparten lugar; los de mayor |m| se resaltan como **primarios**.
- σ de fluencia del monocristal según Schmid: σy = τCRSS / m_máx.
- «Simular» o «Ver en el simulador de Schmid» carga el sistema, la carga, σ y τCRSS en el simulador principal mediante el almacén compartido.
- **Dato curioso.** Cada sistema tiene un gemelo en la otra estructura (plano y dirección intercambiados) con el mismo m. Se muestran las dos listas de |m|, que son idénticas.
- **Ruido numérico.** Los cosenos menores que 10⁻¹² se toman como 0 exacto, así que los sistemas perpendiculares a la carga muestran m = 0 y no «5e−17».

## Validación final y publicación (Etapa 6)

- **Teoría corregida.**
  - La celda unitaria ya no se describe como «el bloque mínimo»: las celdas convencionales FCC y BCC no son las primitivas.
  - La resistencia teórica al corte se da como ≈ G/30 a G/10.
  - Se precisa que no todos los HCP deslizan en el plano basal.
- **Carga diferida.** Three.js solo se descarga al abrir un simulador (`LazyScene3D`), así que la portada y la biblioteca abren más rápido. Si el navegador no puede iniciar WebGL, se muestra un mensaje en lugar de una pantalla en blanco.
- **Limpieza.** Se eliminaron el marcador «En construcción» (`StagePlaceholder`) y una función sin uso.
- **Publicación.** Las acciones de GitHub se actualizaron a las versiones de la guía oficial de Vite (checkout v7, setup-node v7, configure-pages v6, upload-pages-artifact v5 y deploy-pages v5).
