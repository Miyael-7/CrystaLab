/**
 * Lienzo 3D (React Three Fiber). Recibe una descripción de escena y la dibuja,
 * con cámara orbital (rotar, acercar y desplazar) y, opcionalmente, la
 * animación de deslizamiento del grupo 'upper'.
 */
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef, type ReactNode } from 'react';
import type { Group } from 'three';
import { scale, type Vec3 } from '../core';
import { Primitives3D } from './Primitives3D';
import type { SceneDescription } from './primitives';
import { effectiveFov, toThree } from './primitives';

export interface SlipAnimation {
  /** Desplazamiento total de la mitad superior (mundo, z arriba). */
  offset: Vec3;
  playing: boolean;
  /** Cambiarlo regresa la animación al inicio. */
  resetToken: number;
  /** Duración en segundos. */
  duration?: number;
  onDone?: () => void;
}

interface Props {
  scene: SceneDescription;
  animation?: SlipAnimation;
  /** Cambiarlo restablece la cámara. */
  viewKey?: number;
  ariaLabel: string;
  children?: ReactNode;
}

function AnimatedGroup({ animation, children }: { animation?: SlipAnimation; children: ReactNode }) {
  const ref = useRef<Group>(null);
  const progress = useRef(0);
  const done = useRef(false);

  useEffect(() => {
    progress.current = 0;
    done.current = false;
    ref.current?.position.set(0, 0, 0);
  }, [animation?.resetToken]);

  useFrame((_, dt) => {
    if (!ref.current || !animation) return;
    if (animation.playing && progress.current < 1) {
      progress.current = Math.min(1, progress.current + dt / (animation.duration ?? 2.5));
      if (progress.current >= 1 && !done.current) {
        done.current = true;
        animation.onDone?.();
      }
    }
    // Suavizado: arranque y frenado graduales.
    const t = progress.current;
    const eased = t * t * (3 - 2 * t);
    const [x, y, z] = toThree(scale(animation.offset, eased));
    ref.current.position.set(x, y, z);
  });

  return <group ref={ref}>{children}</group>;
}

/** Ajusta el campo de visión al aspecto del visor (útil en teléfonos). */
function ResponsiveFov({ baseFov }: { baseFov: number }) {
  const camera = useThree((st: { camera: { fov?: number; updateProjectionMatrix: () => void } }) => st.camera);
  const size = useThree((st: { size: { width: number; height: number } }) => st.size);
  useEffect(() => {
    if (camera.fov === undefined) return;
    camera.fov = effectiveFov(baseFov, size.width / size.height);
    camera.updateProjectionMatrix();
  }, [camera, size.width, size.height, baseFov]);
  return null;
}

export function Scene3D({ scene, animation, viewKey = 0, ariaLabel, children }: Props) {
  const staticPrims = useMemo(() => scene.prims.filter((p) => p.group !== 'upper'), [scene.prims]);
  const upperPrims = useMemo(() => scene.prims.filter((p) => p.group === 'upper'), [scene.prims]);
  return (
    <Canvas
      gl={{ antialias: true, localClippingEnabled: true }}
      onCreated={({ gl }: { gl: { localClippingEnabled: boolean } }) => {
        // Necesario para recortar la probeta con el plano de deslizamiento.
        gl.localClippingEnabled = true;
      }}
      dpr={[1, 2]}
      aria-label={ariaLabel}
      role="img"
    >
      <PerspectiveCamera key={`cam-${viewKey}`} makeDefault position={toThree(scene.camera.position)} fov={scene.camera.fov} near={0.05} far={100} />
      <OrbitControls
        key={`ctl-${viewKey}`}
        makeDefault
        target={toThree(scene.camera.target)}
        enableDamping
        dampingFactor={0.08}
        minDistance={1.2}
        maxDistance={14}
      />
      <ResponsiveFov key={`fov-${viewKey}`} baseFov={scene.camera.fov} />
      <ambientLight intensity={0.75} />
      <directionalLight position={[4, 6, 5]} intensity={1.15} />
      <directionalLight position={[-5, -3, -4]} intensity={0.35} />
      <Primitives3D prims={staticPrims} />
      <AnimatedGroup animation={animation}>
        <Primitives3D prims={upperPrims} />
      </AnimatedGroup>
      {children}
    </Canvas>
  );
}
