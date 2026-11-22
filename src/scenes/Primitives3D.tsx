/**
 * Convierte la lista de primitivas (primitives.ts) en objetos de Three.js.
 * Aquí no hay física ni geometría cristalográfica: solo dibujo.
 */
import { Html, Line } from '@react-three/drei';
import { useEffect, useMemo } from 'react';
import { BufferGeometry, DoubleSide, Float32BufferAttribute, Plane, Quaternion, Vector3 } from 'three';
import { Idx } from '../components/ui/Idx';
import type { ArrowPrim, CylinderPrim, LabelPrim, PolygonPrim, Prim } from './primitives';
import { toThree } from './primitives';
import styles from './Scene3D.module.css';

const key = (v: unknown) => JSON.stringify(v);

function ArrowMesh({ p }: { p: ArrowPrim }) {
  const radius = p.radius ?? 0.015;
  const opacity = p.opacity ?? 1;
  const g = useMemo(() => {
    const a = new Vector3(...toThree(p.from));
    const b = new Vector3(...toThree(p.to));
    const dir = b.clone().sub(a);
    const len = dir.length();
    dir.normalize();
    const headLen = Math.min(len * 0.35, radius * 7);
    const q = new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), dir);
    return { a, q, shaft: Math.max(len - headLen, 1e-4), headLen };
  }, [key(p.from), key(p.to), radius]);
  return (
    <group position={g.a} quaternion={g.q}>
      <mesh position={[0, g.shaft / 2, 0]}>
        <cylinderGeometry args={[radius, radius, g.shaft, 12]} />
        <meshStandardMaterial color={p.color} transparent={opacity < 1} opacity={opacity} />
      </mesh>
      <mesh position={[0, g.shaft + g.headLen / 2, 0]}>
        <coneGeometry args={[radius * 2.6, g.headLen, 20]} />
        <meshStandardMaterial color={p.color} transparent={opacity < 1} opacity={opacity} />
      </mesh>
    </group>
  );
}

function PolygonMesh({ p }: { p: PolygonPrim }) {
  const geometry = useMemo(() => {
    const pts = p.points.map(toThree);
    const arr: number[] = [];
    for (let i = 1; i < pts.length - 1; i++) arr.push(...pts[0]!, ...pts[i]!, ...pts[i + 1]!);
    const geo = new BufferGeometry();
    geo.setAttribute('position', new Float32BufferAttribute(arr, 3));
    geo.computeVertexNormals();
    return geo;
  }, [key(p.points)]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  const outline = useMemo(() => [...p.points, p.points[0]!].map(toThree), [p.points]);
  return (
    <group>
      <mesh geometry={geometry} renderOrder={2}>
        <meshBasicMaterial color={p.color} side={DoubleSide} transparent opacity={p.opacity ?? 0.4} depthWrite={false} />
      </mesh>
      {p.outline && <Line points={outline} color={p.color} lineWidth={2} transparent opacity={Math.min(1, (p.opacity ?? 0.4) * 2.2)} />}
    </group>
  );
}

function CylinderMesh({ p }: { p: CylinderPrim }) {
  const planes = useMemo(() => {
    if (!p.clip) return [];
    const n = new Vector3(...toThree(p.clip.normal));
    // Three.js descarta los puntos con distancia negativa al plano.
    return [new Plane(p.clip.keep === 'above' ? n : n.clone().negate(), 0)];
  }, [key(p.clip)]);
  return (
    <mesh renderOrder={1}>
      <cylinderGeometry args={[p.radius, p.radius, 2 * p.halfHeight, 72, 1, false]} />
      <meshStandardMaterial
        color={p.color}
        transparent
        opacity={p.opacity ?? 0.25}
        depthWrite={false}
        side={DoubleSide}
        clippingPlanes={planes}
        roughness={0.35}
        metalness={0.3}
      />
    </mesh>
  );
}

function Label({ p }: { p: LabelPrim }) {
  return (
    <Html position={toThree(p.position)} center zIndexRange={[20, 0]} style={{ pointerEvents: 'none' }}>
      <span className={styles.label} data-size={p.size ?? 'sm'} style={{ color: p.color }}>
        {p.idx && <Idx v={p.idx.v} kind={p.idx.kind} />}
        {p.text}
        {p.suffix}
      </span>
    </Html>
  );
}

export function Primitives3D({ prims }: { prims: Prim[] }) {
  return (
    <>
      {prims.map((p) => {
        switch (p.kind) {
          case 'line':
            return (
              <Line
                key={p.id}
                points={p.points.map(toThree)}
                color={p.color}
                lineWidth={p.width ?? 1.5}
                dashed={p.dashed ?? false}
                dashSize={0.09}
                gapSize={0.06}
                transparent={(p.opacity ?? 1) < 1}
                opacity={p.opacity ?? 1}
              />
            );
          case 'arrow':
            return <ArrowMesh key={p.id} p={p} />;
          case 'polygon':
            return <PolygonMesh key={p.id} p={p} />;
          case 'sphere':
            return (
              <mesh key={p.id} position={toThree(p.center)}>
                <sphereGeometry args={[p.radius, 20, 14]} />
                <meshStandardMaterial color={p.color} transparent={(p.opacity ?? 1) < 1} opacity={p.opacity ?? 1} />
              </mesh>
            );
          case 'cylinder':
            return <CylinderMesh key={p.id} p={p} />;
          case 'label':
            return <Label key={p.id} p={p} />;
          default:
            return null;
        }
      })}
    </>
  );
}
