'use client';

import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import DnaStrand from './DnaStrand';

interface DnaHelixModelProps {
  scale?: number | [number, number, number];
  position?: [number, number, number];
}

const DnaHelixModel: React.FC<DnaHelixModelProps> = ({
  scale = 2,
  position = [0, 0, 0]
}) => {
  const groupRef = useRef<THREE.Group>(null);
  
  // Animation
  useFrame((state, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.1; // Gentle rotation
    }
  });

  return (
    <group ref={groupRef} position={position} scale={Array.isArray(scale) ? scale : [scale, scale, scale]}>
      <DnaStrand position={[0, 0, 0]} />
    </group>
  );
};

export default DnaHelixModel;
