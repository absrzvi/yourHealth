'use client';

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import React from 'react';

interface DnaStrandProps {
  position?: [number, number, number];
  radius?: number;
  length?: number;
  segments?: number;
  color?: string;
}

export function DnaStrand({
  position = [0, 0, 0],
  radius = 0.5,
  length = 10,
  segments = 20,
  color = '#00ffff',
}: DnaStrandProps) {
  const groupRef = useRef<THREE.Group>(null);
  const points = [];
  const points2 = [];
  
  // Create points for the two strands
  for (let i = 0; i <= segments; i++) {
    const angle = (i / segments) * Math.PI * 2 * 4; // 4 full rotations
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    const y = (i / segments - 0.5) * length;
    
    points.push(new THREE.Vector3(x, y, z));
    points2.push(new THREE.Vector3(-x, y, -z));
  }

  // Create the curve
  const curve = new THREE.CatmullRomCurve3(points);
  const curve2 = new THREE.CatmullRomCurve3(points2);

  // Create the tube geometry
  const tubeGeometry = new THREE.TubeGeometry(
    curve as any,
    segments * 2,
    0.1,
    8,
    false
  );
  
  const tubeGeometry2 = new THREE.TubeGeometry(
    curve2 as any,
    segments * 2,
    0.1,
    8,
    false
  );

  // Create the material
  const material = new THREE.MeshBasicMaterial({
    color: new THREE.Color(color),
    toneMapped: false,
  });

  // Create the connectors between the strands
  const connectors: [number, number, number][] = [];
  for (let i = 0; i <= segments; i += 2) {
    const t = i / segments;
    const point1 = curve.getPoint(t);
    const point2 = curve2.getPoint(t);
    const midPoint = new THREE.Vector3().lerpVectors(point1, point2, 0.5);
    const distance = point1.distanceTo(point2);
    
    connectors.push([
      midPoint.x,
      midPoint.y,
      midPoint.z,
    ]);
  }

  // Animation
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.getElapsedTime() * 0.2;
    }
  });

  return (
    <group ref={groupRef} position={position as [number, number, number]}>
      <mesh geometry={tubeGeometry} material={material} />
      <mesh geometry={tubeGeometry2} material={material} />
      
      {connectors.map((pos, i) => (
        <mesh
          key={i}
          position={pos as [number, number, number]}
          rotation={[0, 0, 0]}
        >
          <sphereGeometry args={[0.05, 8, 8]} />
          <meshBasicMaterial color="#ff00ff" toneMapped={false} />
        </mesh>
      ))}
    </group>
  );
}

export default DnaStrand;
