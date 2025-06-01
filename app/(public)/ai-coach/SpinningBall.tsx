'use client';

import React, { useRef, useEffect, useState, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF, OrbitControls, Environment } from '@react-three/drei';
import * as THREE from 'three';
import { useThree } from '@react-three/fiber';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { VelocityDepthNormalPass } from './realism-effects/v2/VelocityDepthNormalPass.js';

// Define a type for biomarker scores
export interface BiomarkerScores {
  sleep: number; // e.g., 0-100
  nutrition: number;
  exercise: number;
  genetics: number; 
  biome: number;
}

// Function to map score to color properties
const getBiomarkerMaterialProps = (score: number, baseColorHex = 0x888888) => {
  const intensity = Math.max(0, Math.min(1, score / 100)); // Clamp between 0 and 1
  const targetColor = new THREE.Color();
  // Interpolate from a dim/desaturated color to a vibrant one
  targetColor.lerpColors(new THREE.Color(0x333344), new THREE.Color(0x4facfe), intensity);

  return {
    color: targetColor,
    emissive: targetColor,
    emissiveIntensity: intensity * 0.5, // Make it glow more with higher scores
    roughness: 0.4 - intensity * 0.3, // Less rough (shinier) for higher scores
    metalness: 0.5 + intensity * 0.3, // More metallic for higher scores
  };
};

const Model = ({ biomarkerScores }: { biomarkerScores: BiomarkerScores }) => {
  const { scene, nodes } = useGLTF('/base_basic_pbr.glb'); // Assumes GLB is in /public
  const modelRef = useRef<THREE.Group>(null!);
  const desiredScale = 2.0; // Further increased scale for better visibility

  useFrame((state, delta) => {
    if (modelRef.current) {
      modelRef.current.rotation.y += 0.003;
      const time = state.clock.getElapsedTime();
      const breathFactor = Math.sin(time * 0.7) * 0.015 + 1; // Breathing factor (e.g., 0.985 to 1.015)
      const currentScale = desiredScale * breathFactor;
      modelRef.current.scale.set(currentScale, currentScale, currentScale);
    }
  });

  // Set initial scale
  useEffect(() => {
    if (modelRef.current) {
      modelRef.current.scale.set(desiredScale, desiredScale, desiredScale);
    }
  }, [desiredScale]);

  const clonedScene = useMemo(() => scene.clone(), [scene]);

  useEffect(() => {
    if (!nodes || !clonedScene) return;

    const partsToUpdate: { scoreKey: keyof BiomarkerScores; meshNamePattern: string }[] = [
      { scoreKey: 'sleep', meshNamePattern: 'Sleep_Part' },
      { scoreKey: 'nutrition', meshNamePattern: 'Nutrition_Part' },
      { scoreKey: 'exercise', meshNamePattern: 'Exercise_Part' },
      { scoreKey: 'genetics', meshNamePattern: 'Genetics_Part' },
      { scoreKey: 'biome', meshNamePattern: 'Biome_Part' },
    ];

    clonedScene.traverse((object) => {
      if ((object as THREE.Mesh).isMesh) {
        const mesh = object as THREE.Mesh;
        let materialApplied = false;

        if (!(mesh.material instanceof THREE.MeshStandardMaterial)) {
          mesh.material = new THREE.MeshStandardMaterial();
        }
        const standardMaterial = mesh.material as THREE.MeshStandardMaterial;

        for (const part of partsToUpdate) {
          if (mesh.name.toLowerCase().includes(part.meshNamePattern.toLowerCase())) {
            const score = biomarkerScores[part.scoreKey];
            const materialProps = getBiomarkerMaterialProps(score);
            
            standardMaterial.color.set(materialProps.color);
            standardMaterial.emissive.set(materialProps.emissive);
            standardMaterial.emissiveIntensity = materialProps.emissiveIntensity;
            standardMaterial.roughness = materialProps.roughness;
            standardMaterial.metalness = materialProps.metalness;
            materialApplied = true;
            break; 
          }
        }
        if (!materialApplied) {
            standardMaterial.color.set(0x555555);
            standardMaterial.metalness = 0.6;
            standardMaterial.roughness = 0.4;
            standardMaterial.emissive.set(0x000000);
            standardMaterial.emissiveIntensity = 0;
        }
      }
    });
  }, [nodes, biomarkerScores, clonedScene]);

  return <primitive object={clonedScene} ref={modelRef} dispose={null} position={[0, 0, 0]} />;
};

const Effects = () => {
  const { gl, scene, camera, size } = useThree();
  const composer = useMemo(() => {
    const effectComposer = new EffectComposer(gl);
    effectComposer.addPass(new RenderPass(scene, camera));

    // Ensure VelocityDepthNormalPass is correctly imported and instantiated
    // Note: The path './realism-effects/v2/VelocityDepthNormalPass.js' must be correct
    // and the VelocityDepthNormalPass class must be exported from that file.
    const velocityPass = new VelocityDepthNormalPass(scene, camera);
    effectComposer.addPass(velocityPass);

    return effectComposer;
  }, [gl, scene, camera]);

  useEffect(() => {
    composer.setSize(size.width, size.height);
  }, [composer, size]);

  useFrame((_, delta) => {
    composer.render(delta);
  }, 1); // Render priority 1, runs after default render loop

  return null;
};

const SpinningBall = ({ biomarkerData }: { biomarkerData?: BiomarkerScores }) => {
  const defaultScores: BiomarkerScores = {
    sleep: 75,
    nutrition: 80,
    exercise: 60,
    genetics: 90, 
    biome: 70,
  };
  const scores = biomarkerData || defaultScores;

  return (
    <Canvas camera={{ position: [0, 0, 1.8], fov: 50 }} style={{ touchAction: 'none', width: '100%', height: '100%' }}>
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 5, 5]} intensity={1.0} castShadow />
      <directionalLight position={[-5, -5, -5]} intensity={0.3} />
      <Environment preset="city" /> 
      <React.Suspense fallback={null}>
        <Model biomarkerScores={scores} />
      </React.Suspense>
      <OrbitControls enableZoom={true} enablePan={false} autoRotate autoRotateSpeed={0.4} minDistance={1.0} maxDistance={4.0} target={[0, 0, 0]} />
      <Effects />
    </Canvas>
  );
};

export default SpinningBall;
