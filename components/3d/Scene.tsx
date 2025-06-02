'use client';

import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { 
  Stars, 
  Float, 
  OrbitControls, 
  useGLTF,
  Environment,
  PerspectiveCamera,
  Stats,
  useHelper,
  ScrollControls,
  Scroll,
  useScroll
} from '@react-three/drei';
import { Suspense, useRef, useEffect } from 'react';
import { EffectComposer, Bloom, DepthOfField } from '@react-three/postprocessing';
import * as THREE from 'three';
import DnaModel from './DnaModel';

// Scene lighting component
function SceneLights() {
  const dirLightRef = useRef<THREE.DirectionalLight>(null);
  
  // Optional: Visualize light direction in development
  useEffect(() => {
    if (dirLightRef.current && process.env.NODE_ENV === 'development') {
      const helper = new THREE.DirectionalLightHelper(dirLightRef.current, 1);
      return () => {
        helper.dispose();
      };
    }
  }, []);

  return (
    <>
      {/* Ambient light for base illumination */}
      <ambientLight intensity={0.2} color="#4040ff" />
      
      {/* Main directional light */}
      <directionalLight 
        ref={dirLightRef}
        position={[5, 5, 5]}
        intensity={1.5}
        color="#7f7fff"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-near={0.5}
        shadow-camera-far={50}
      />
      
      {/* Fill light */}
      <directionalLight 
        position={[-5, 3, -5]} 
        intensity={0.5}
        color="#7f7fff"
      />
      
      {/* Back light */}
      <pointLight 
        position={[0, 0, -5]} 
        intensity={0.5}
        color="#7f7fff"
      />
    </>
  );
}

// Main scene content with scroll animation
function AnimatedScene() {
  const scroll = useScroll();
  const groupRef = useRef<THREE.Group>(null);
  
  useFrame(() => {
    if (!groupRef.current) return;
    
    // Get scroll offset (0 to 1)
    const offset = scroll.offset;
    
    // Rotate based on scroll
    groupRef.current.rotation.y = offset * Math.PI * 2; // Full rotation on full scroll
    
    // Add some subtle bobbing effect
    groupRef.current.position.y = -2.5 + Math.sin(offset * Math.PI * 5) * 0.1;
    
    // Scale slightly based on scroll
    const scaleFactor = 0.8 + (offset * 0.4);
    groupRef.current.scale.set(scaleFactor, scaleFactor, scaleFactor);
  });

  return (
    <group ref={groupRef}>
      <DnaModel scale={1} position={[0, 0, 0]} />
    </group>
  );
}

// Main scene component
export default function Scene() {
  return (
    <Canvas 
      dpr={[1, 2]}
      gl={{
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance',
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.2
      }}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: -1
      }}
    >
      <color attach="background" args={['#0a0b1e']} />
      
      <ScrollControls pages={3} damping={0.1}>
        <Scroll>
          <Suspense fallback={
            <mesh>
              <boxGeometry args={[1, 1, 1]} />
              <meshBasicMaterial color="#666" />
            </mesh>
          }>
            <SceneLights />
            <Environment preset="city" />
            
            <Float 
              speed={1.5}
              rotationIntensity={0.5}
              floatIntensity={0.5}
              floatingRange={[-0.1, 0.1]}
            >
              <AnimatedScene />
            </Float>
            
            <Stars 
              radius={150}
              depth={40}
              count={10000}
              factor={4}
              saturation={0.5}
              fade
              speed={0.5}
            />
          </Suspense>
        </Scroll>
      </ScrollControls>
      
      <EffectComposer>
        <Bloom 
          luminanceThreshold={0.4}
          luminanceSmoothing={0.9}
          intensity={1.5}
          radius={0.7}
        />
        <DepthOfField 
          focusDistance={0.01}
          focalLength={0.1}
          bokehScale={3}
        />
      </EffectComposer>
      
      {process.env.NODE_ENV === 'development' && (
        <OrbitControls 
          enableZoom={true}
          enablePan={false}
          minDistance={3}
          maxDistance={15}
          autoRotate
          autoRotateSpeed={0.5}
        />
      )}
    </Canvas>
  );
}
