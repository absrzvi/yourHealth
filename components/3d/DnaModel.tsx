'use client';

import { useGLTF, useAnimations, useScroll } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

// Use absolute path to ensure the file is found
const MODEL_PATH = '/DNA.glb';

// Preload the model
useGLTF.preload(MODEL_PATH);

interface DnaModelProps {
  scale?: number | [number, number, number];
  position?: [number, number, number];
}

export default function DnaModel({ 
  scale = 1, 
  position = [0, 0, 0] 
}: DnaModelProps) {
  const groupRef = useRef<THREE.Group>(null);
  const scroll = useScroll();
  const [model, setModel] = useState<THREE.Group | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { scene, animations } = useGLTF(MODEL_PATH);
  const { actions } = useAnimations(animations, groupRef);
  
  // Animation frame for scroll-based animations
  useFrame((state, delta) => {
    if (!groupRef.current) return;
    
    // Get scroll offset (0 to 1)
    const offset = scroll.offset;
    
    // Rotate based on scroll
    groupRef.current.rotation.y = offset * Math.PI * 2; // Full rotation on full scroll
    
    // Add some subtle bobbing effect
    groupRef.current.position.y = position[1] + Math.sin(offset * Math.PI * 5) * 0.1;
    
    // Scale slightly based on scroll
    const baseScale = typeof scale === 'number' ? scale : 1;
    const scaleFactor = 0.8 + (offset * 0.4);
    const finalScale = baseScale * scaleFactor;
    groupRef.current.scale.set(finalScale, finalScale, finalScale);
  });

  // Load the model with error handling
  useEffect(() => {
    let mounted = true;
    
    const loadModel = async () => {
      try {
        console.log('Loading DNA model from:', MODEL_PATH);
        
        // Clone the scene to avoid sharing materials between instances
        const modelScene = scene.clone();
        
        // Traverse the model and log its structure
        modelScene.traverse((child) => {
          console.log('Model child:', child.name, child.type);
        });
        
        if (mounted) {
          setModel(modelScene);
          setError(null);
          console.log('DNA model loaded successfully');
        }
      } catch (err) {
        console.error('Failed to load DNA model:', err);
        if (mounted) {
          setError(`Failed to load 3D model: ${err instanceof Error ? err.message : String(err)}`);
        }
      }
    };
    
    loadModel();
    
    return () => {
      mounted = false;
    };
  }, [scene]);
  
  // Play animations if any
  useEffect(() => {
    if (actions) {
      Object.values(actions).forEach(action => {
        if (action) {
          action.play();
        }
      });
    }
  }, [actions]);
  
  // Animation
  useFrame((_, delta) => {
    if (groupRef.current) {
      // Smooth rotation
      groupRef.current.rotation.y += 0.2 * delta;
    }
  });

  if (error) {
    console.error('Error in DnaModel:', error);
    return (
      <group position={position}>
        <mesh>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color="red" />
        </mesh>
      </group>
    );
  }

  if (!model) {
    // Show a loading placeholder
    return (
      <group position={position}>
        <mesh>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color="#666" />
        </mesh>
      </group>
    );
  }
  
  return (
    <group 
      ref={groupRef} 
      position={position} 
      scale={Array.isArray(scale) ? scale : [scale, scale, scale]}
    >
      <primitive 
        object={model} 
        onError={(e: Error) => {
          console.error('Error rendering DNA model:', e);
          setError(`Rendering error: ${e.message}`);
        }}
      />
    </group>
  );
}
