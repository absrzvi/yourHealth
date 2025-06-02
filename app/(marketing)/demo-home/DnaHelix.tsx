// app/(marketing)/demo-home/DnaHelix.tsx
'use client';

import { useGLTF } from '@react-three/drei';
import { Canvas, useFrame } from '@react-three/fiber';
import { Suspense, useRef } from 'react';
import * as THREE from 'three';

function Model() {
  const group = useRef<THREE.Group>(null);
  const { scene } = useGLTF('/DNA.glb');

  useFrame(() => {
    if (group.current) {
      group.current.rotation.y += 0.005;
    }
  });

  return (
    <group ref={group}>
      <primitive 
        object={scene} 
        scale={0.5}
        position={[0, 0, 0]}
      />
    </group>
  );
}

export default function DnaHelix() {
  useGLTF.preload('/DNA.glb');
  
  return (
    <div style={{ width: '100%', height: '100vh' }}>
      <Canvas
        camera={{ position: [2, 2, 2], fov: 50 }}
        gl={{ preserveDrawingBuffer: true, alpha: false }}
      >
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        <Suspense fallback={null}>
          <Model />
        </Suspense>
      </Canvas>
    </div>
  );
}