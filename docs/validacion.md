# Validación del núcleo matemático

Casos de referencia que comprueban las pruebas unitarias (`npm test`). Los valores se calcularon con `src/core` y coinciden con la solución analítica.

## Ejemplos de clase con índices de Miller

| Caso (presentación Ley de Schmid 2) | φ | λ | m | Resultado |
|---|---|---|---|---|
| FCC, eje [100], sistema (111)[11̄0] | 54.74° | 45.00° | 0.4082 (= 1/√6) | — |
| BCC, eje [121], sistema (110)[1̄11], τCRSS = 82.73 MPa | 30.00° | 61.87° | 0.4082 | σ = τCRSS / m = **202.6 MPa** |

## Ejemplos de clase con ángulos

| Caso (presentación Ley de Schmid 1) | m | τR | Conclusión |
|---|---|---|---|
| φ = 43.1°, λ = 47.9°, σ = 45 MPa, τCRSS = 20.7 MPa | 0.4895 | 22.03 MPa | 22.03 ≥ 20.7 → **sí desliza** |
| Al, φ = 28.1°, λ = 62.4°, σ = 1.95 MPa | 0.4087 | 0.797 MPa | Dirección **más favorable**; τCRSS = 0.797 MPa |
| Al, φ = 28.1°, λ = 72.0° | 0.2726 | 0.532 MPa | — |
| Al, φ = 28.1°, λ = 81.1° | 0.1365 | 0.266 MPa | — |

**Ejercicio excluido.** El caso φ = 32.5°, λ = 56.8° no se usa como ejemplo porque φ + λ = 89.3° < 90°, y esa orientación no puede existir. Solo se usa para comprobar que la calculadora muestra la advertencia.

## BCC {110}<111> con eje de tensión [123]

Ordenados del más favorable al menos favorable (ángulos agudos):

| Lugar | Sistema | φ | λ | \|m\| |
|---|---|---|---|---|
| 1 | (101)[11̄1̄] | 40.9° | 51.9° | 0.4666 |
| 2 | (101̄)[111] | 67.8° | 22.2° | 0.3499 |
| 2 | (110)[11̄1̄] | 55.5° | 51.9° | 0.3499 |
| 4 | (011)[11̄1] | 19.1° | 72.0° | 0.2916 |
| 5 | (011̄)[111] | 79.1° | 22.2° | 0.1750 |
| 5 | (110)[11̄1] | 55.5° | 72.0° | 0.1750 |
| 5 | (11̄0)[111] | 79.1° | 22.2° | 0.1750 |
| 8 | (101̄)[11̄1] | 67.8° | 72.0° | 0.1166 |
| 8 | (011̄)[11̄1̄] | 79.1° | 51.9° | 0.1166 |
| 10 | (011)[111̄] | 19.1° | 90.0° | 0 |
| 10 | (101)[111̄] | 40.9° | 90.0° | 0 |
| 10 | (11̄0)[111̄] | 79.1° | 90.0° | 0 |

Al aumentar el esfuerzo a lo largo de [123], el primer sistema en alcanzar τCRSS es (101)[11̄1̄], porque tiene el mayor |m|.

## Propiedades generales comprobadas

- hu + kv + lw = 0 para los 24 sistemas FCC y BCC; las combinaciones inválidas generan un mensaje explicativo.
- |m| ≤ 0.5 en 1000 orientaciones de carga; |m| = 0.5 solo en el caso coplanar con φ = λ = 45°.
- Entre ángulos agudos, φ + λ ≥ 90° siempre; la igualdad solo ocurre en el caso coplanar.
- Escalar los índices no cambia el resultado: [242] ≡ [121].
- Pasar de tensión a compresión invierte el signo de τR, pero no su magnitud.
- La tabla de clase de direcciones equivalentes se reproduce: <100> tiene 6, <110> tiene 12 y <111> tiene 8.
- Todos los vértices del polígono de cada plano cumplen la ecuación del plano y quedan dentro de la celda.
- **Dato curioso:** FCC y BCC dan exactamente los mismos factores de Schmid para cualquier eje de carga. Con el eje [2̄13̄], |m|máx = 0.4666 en ambas estructuras.

## Convenciones de ángulos y signos

- `phiAcuteDeg` y `lambdaAcuteDeg` son los ángulos entre **rectas**, en [0°, 90°]. Es la convención de clase y la que se mostrará por defecto.
- `phiDeg` y `lambdaDeg` son los ángulos entre **vectores**, en [0°, 180°]. Son coherentes con los cosenos con signo.
- m y τR conservan el signo: τR = σ (ê·n̂)(ê·d̂), con σ > 0 en tensión y σ < 0 en compresión. El signo indica el sentido del corte. La activación se evalúa con |τR| ≥ τCRSS.

## Simuladores (Etapa 4)

Comprobado con pruebas automáticas (`src/core/specimen.test.ts`, `src/scenes/scenes.test.ts`, `src/sim/schmidModel.test.ts`):

- **Escena de Miller.** La flecha de [uvw] va del inicio a la punta y es paralela a [uvw] ([1̄10]: de (1,0,0) a (0,1,0)). El plano (hkl) cumple su ecuación y su normal es paralela a [hkl]. (1̄11) usa el origen trasladado (1,0,0) con intersecciones x = −1, y = 1, z = 1. La familia <111> añade 7 direcciones y {111} añade 3 planos.
- **Escena de Schmid.** Las flechas dibujadas forman exactamente φ y λ con el eje de carga (BCC [121], (110)[1̄11]: 30° y 61.87°) y son perpendiculares entre sí. Los arcos van del eje a cada vector. El plano queda dentro de la probeta. Las fuerzas apuntan hacia afuera en tensión y hacia adentro en compresión. Los ejes del cristal rotados dejan [121] vertical.
- **Rotación cristal → probeta.** Es ortonormal con det = +1, lleva la carga a +z y conserva φ y λ en 5 orientaciones distintas.
- **Sección del plano.** Es una elipse sobre la superficie del cilindro. Se recorta con las tapas a φ = 80° y es un rectángulo a φ = 90°.
- **Ángulos → vectores.** Reproduce φ y λ con n̂ ⊥ d̂ y rechaza φ + λ < 90°.
- **Modelo del simulador.**
  - BCC [121]: σ para activar = 202.6 MPa.
  - Estados: 150 MPa → no activado, 190 MPa → próximo, 210 MPa → activado.
  - F = 5 kN y d = 10 mm → σ = 63.66 MPa, igual con área directa.
  - La compresión invierte los signos sin cambiar el estado.
  - Ejercicio φ = 43.1°, λ = 47.9° → τR = 22.03 MPa, activado.
  - m = 0 → σ para activar infinito, con advertencia.
- **Animación.** El desplazamiento es perpendicular a n̂ (el plano no se mueve), va en +d̂ en tensión y −d̂ en compresión, y es proporcional al progreso.

## Comparador FCC / BCC (Etapa 5)

Comprobado en `src/sim/systemsModel.test.ts` y `src/scenes/scenes.test.ts`:

- FCC con carga [100]: 8 sistemas primarios con m = 0.408 y 4 con m = 0. Con σ = 10 MPa y τCRSS = 4 MPa, los 8 se activan y σy = 9.80 MPa.
- BCC con carga [123]: un único primario, (101)[11̄1̄], con m = 0.4666. Los 3 sistemas con λ = 90° tienen m = 0 exacto.
- Gemelos: con la carga [2̄13̄], para FCC y BCC, el gemelo de cada sistema es válido (hu + kv + lw = 0) y tiene el mismo m.
- Escena: FCC tiene 14 átomos y BCC 9. La flecha de deslizamiento está sobre el plano y es perpendicular a la normal, y la flecha de carga es paralela a [abc].

## Ejercicios resueltos de fuentes externas (Etapa 6)

Para comprobar que el simulador resuelve correctamente problemas que no forman parte del material del curso, se agregaron como pruebas automáticas (`src/sim/externalExamples.test.ts`) ejercicios publicados con su solución:

| Fuente | Problema | Resultado publicado | CrystaLab |
|---|---|---|---|
| Callister, Ejemplo resuelto 7.1 | Fe BCC, tensión en [010], (110)[1̄11], σ = 52 MPa; τCRSS = 30 MPa | τR = 52 · (1/√2)(1/√3) = 21.2 MPa; σy = 73.4 MPa | 21.23 MPa; 73.48 MPa ✓ |
| Callister 7.12 | φ = 60°, λ = 35°, τCRSS = 6.2 MPa, σ = 12 MPa | No fluye; se requieren ≈ 15.1 MPa | τR = 4.91 MPa; 15.14 MPa ✓ |
| Callister 7.13 (zinc) | φ = 65°; λ = 30°, 48°, 78°; σ = 2.5 MPa | La más favorable es 30°; τCRSS ≈ 0.91 MPa | 30°; 0.915 MPa ✓ |
| Callister 7.14 (níquel) | Tensión en [001], (111)[1̄01], σ = 13.9 MPa | τCRSS ≈ 5.68 MPa | 5.675 MPa ✓ |
| Callister 7.15 | FCC, tensión en [100], τCRSS = 0.5 MPa, (111) en [1̄01], [1̄10], [01̄1] | 1.22 MPa, 1.22 MPa y sin deslizamiento (λ = 90°) | 1.2247, 1.2247 y ∞ ✓ |
| Universidad de Texas en Austin, «Single-Crystal Plasticity» | BCC {110}<111>, tensión en [123]: tabla de cos θ, cos λ y m **con signo** | (110)[1̄11]: 0.56695 · 0.61721 = 0.34993; (11̄0)[111]: −0.18898 · 0.92582 = −0.17496; (11̄0)[1̄1̄1]: 0 | Coinciden en 5 decimales ✓ |
| NPTEL (IIT), Lecture 9 | Direcciones contenidas en (111) | Cumplen hu + kv + lw = 0 | ✓ |
| Índices de Miller | Plano con intersecciones x = ∞, y = −1, z = ½ | (01̄2) | Origen trasladado (0,1,0) e intersecciones ∞, −1, ½ ✓ |

**Observación.** Una solución publicada en línea del problema 7.15 reporta 1.00 MPa usando la dirección [101], que **no** está contenida en el plano (111) porque 1 + 0 + 1 ≠ 0. El simulador rechaza esa combinación con un mensaje explicativo (también está probado). Es un buen ejemplo de por qué la validación hu + kv + lw = 0 es importante.

**Total: 203 pruebas automáticas aprobadas.**
