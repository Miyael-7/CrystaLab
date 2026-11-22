/**
 * Carga diferida del lienzo 3D: Three.js (la parte más pesada de la app) solo
 * se descarga al abrir un simulador. Incluye una barrera de errores por si el
 * navegador no puede iniciar WebGL.
 */
import { Component, lazy, Suspense, type ComponentProps, type ReactNode } from 'react';
import type { Scene3D as Scene3DType } from './Scene3D';
import styles from './Scene3D.module.css';

const Scene3D = lazy(() => import('./Scene3D').then((m) => ({ default: m.Scene3D })));

class WebGLBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    if (this.state.failed) {
      return (
        <div className={styles.fallback} role="alert">
          <strong>No se pudo mostrar el modelo 3D.</strong>
          <span>
            Tu navegador o tu tarjeta gráfica no permitió iniciar WebGL. Los cálculos del panel siguen funcionando. Prueba con
            una versión reciente de Chrome, Edge, Firefox o Safari, o activa la aceleración por hardware.
          </span>
        </div>
      );
    }
    return this.props.children;
  }
}

export function LazyScene3D(props: ComponentProps<typeof Scene3DType>) {
  return (
    <WebGLBoundary>
      <Suspense fallback={<div className={styles.fallback}>Cargando modelo 3D…</div>}>
        <Scene3D {...props} />
      </Suspense>
    </WebGLBoundary>
  );
}
