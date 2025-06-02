Skip to main content

key
Get API key
Studio
Dashboard
Documentation
open_in_new
Abbas Rizvi
Ai UX/UI designer
ThinkingThoughts
(experimental)
Expand to view model thoughts

chevron_right
ThinkingThoughts
(experimental)
Expand to view model thoughts

chevron_right
ThinkingThoughts
(experimental)
Expand to view model thoughts

chevron_right
ThinkingThoughts
(experimental)
Expand to view model thoughts

chevron_right
ThinkingThoughts
(experimental)
Expand to view model thoughts

chevron_right
ThinkingThoughts
(experimental)
Expand to view model thoughts

chevron_right
ThinkingThoughts
(experimental)
Expand to view model thoughts

chevron_right
ThinkingThoughts
(experimental)
Expand to view model thoughts

chevron_right
ThinkingThoughts
(experimental)
Expand to view model thoughts

chevron_right
ThinkingThoughts
(experimental)
Expand to view model thoughts

chevron_right
ThinkingThoughts
(experimental)
Expand to view model thoughts

chevron_right
Okay, this is a significant update! You've provided the entire codebase for your current MVP. My previous advice was focused on a conceptual redesign. Now, we need to integrate this new, highly visual, 3D homepage concept into your existing Next.js application structure as a distinct demo page, without disrupting the current MVP functionality.
Understanding the Context:
Existing App: You have a functional Next.js application with authentication, file uploads, data parsing, a dashboard, AI integration, etc. This is built with Tailwind CSS and Shadcn/UI components.
New Homepage Goal: Create a visually stunning, 3D-interactive homepage (let's call it /demo-home or a similar unique route) inspired by dna-chain.vercel.app.
Non-Interference: This new demo page must not break any existing routes or functionality of your MVP.
Future Integration: The design should be mindful that if successful, elements of this new homepage might be integrated into the main site.
Vibe Coding: You'll be using an AI coding assistant ("Vibe Code" / "Windsurf") that needs precise, step-by-step instructions.
Key Technical Considerations for Integration:
Three.js in Next.js: The threejs-andy-boilerplate is vanilla JavaScript. For a Next.js (React) application, the standard and recommended way to integrate Three.js is using the react-three-fiber (R3F) library and drei (a helper library for R3F). This makes Three.js behave more like React components.
Routing: We'll create a new page route in your app directory.
Styling: We'll leverage Tailwind CSS where possible for text and basic layout, but much of the visual styling will come from Three.js materials, lighting, and potentially custom shaders.
Performance: Critical, especially with 3D. We'll need to be mindful of this.
Prompt for Vibe Code/Windsurf: Implement New 3D Interactive Demo Homepage
Overall Objective:
Create a new, visually immersive demo homepage at a dedicated route (e.g., /demo-home) within the existing Next.js application. This page will be heavily inspired by https://dna-chain.vercel.app/, featuring a prominent 3D DNA helix, scroll-driven animations, and a dark, futuristic aesthetic. This implementation must not interfere with any existing MVP functionality or routes.
I. Project Setup & Core Dependencies:
Install react-three-fiber and drei:
Instruction: "In the project terminal, run npm install three @react-three/fiber @react-three/drei (or yarn add three @react-three/fiber @react-three/drei)."
Guardrail: Ensure these are added to dependencies in package.json.
II. Create New Demo Homepage Route & Basic Structure:
Create New Page File:
Instruction: "Create a new page file for the demo homepage. In the app directory, create a new folder named (marketing) (or a similar grouping name that won't affect existing app routes, e.g., (demo-pages)). Inside (marketing), create a folder named demo-home. Inside app/(marketing)/demo-home/, create a page.tsx file."
Guardrail: This route structure ensures it's separate. The (marketing) segment is a Route Group that won't affect the URL path. The page will be accessible at /demo-home.
Basic Page Component in app/(marketing)/demo-home/page.tsx:
Instruction: "In app/(marketing)/demo-home/page.tsx, create a basic React functional component for the DemoHomePage. It should return a main div that will act as the container for our 3D scene and overlay content. For now, give this main div a dark background color using Tailwind CSS (e.g., bg-[#0A0F1E]) and make it take up the full viewport height (min-h-screen). Import React."
Initial Code Structure (Conceptual):
// app/(marketing)/demo-home/page.tsx
import React from 'react';

export default function DemoHomePage() {
  return (
    <main className="bg-[#0A0F1E] min-h-screen text-white relative overflow-hidden">
      {/* 3D Canvas and Overlay Content will go here */}
      <p className="p-8 text-center">Demo Homepage - 3D Scene Coming Soon</p>
    </main>
  );
}
Use code with caution.
Tsx
Guardrail: The page should be accessible at /demo-home and display the placeholder text with a dark background.
III. Implement the 3D Scene with react-three-fiber:
Create a Reusable 3D Scene Component:
Instruction: "Create a new client component file: components/3d/Scene.tsx. This component will encapsulate our react-three-fiber Canvas and core 3D elements."
Guardrail: Ensure "use client"; is at the top of this file.
Basic Scene Setup in components/3d/Scene.tsx:
Instruction: "In components/3d/Scene.tsx, import Canvas from @react-three/fiber. Create a component ThreeScene that returns a Canvas component. Inside the Canvas, add basic lighting (an ambientLight with intensity 0.5 and a directionalLight positioned at `` with intensity 1). Also, add `OrbitControls` from `@react-three/drei` for basic camera manipulation during development."
Conceptual Code Structure:
// components/3d/Scene.tsx
"use client";
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import React from 'react';

export default function ThreeScene() {
  return (
    <Canvas camera={{ position: [0, 0, 10], fov: 50 }}> {/* Adjust camera as needed */}
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 5, 5]} intensity={1} />
      {/* 3D Models will go here */}
      <OrbitControls />
    </Canvas>
  );
}
Use code with caution.
Tsx
Integrate ThreeScene into DemoHomePage:
Instruction: "In app/(marketing)/demo-home/page.tsx, import the ThreeScene component. Render it within the main div. Ensure the ThreeScene (Canvas) is styled to fill its container (e.g., using absolute positioning and w-full h-full)."
Conceptual Update to page.tsx:
// app/(marketing)/demo-home/page.tsx
import React from 'react';
import ThreeScene from '@/components/3d/Scene'; // Adjust path if needed

export default function DemoHomePage() {
  return (
    <main className="bg-[#0A0F1E] min-h-screen text-white relative overflow-hidden">
      <div className="absolute inset-0 z-0"> {/* Container for 3D scene */}
        <ThreeScene />
      </div>
      <div className="relative z-10"> {/* Container for overlay text content */}
        <p className="p-8 text-center">Demo Homepage - 3D Scene Active</p>
      </div>
    </main>
  );
}
Use code with caution.
Tsx
Guardrail: The /demo-home page should now render a blank 3D canvas (you might see a slight change in background if lighting affects it). You should be able to interact with OrbitControls (if no model is present, it might be hard to tell, but there shouldn't be errors).
IV. Implement the DNA Helix Model:
Place the .glb File:
Instruction: "Place your DNA helix .glb file into the public directory of your Next.js project (e.g., public/models/dna_helix.glb)."
Guardrail: The file path will be /models/dna_helix.glb when accessed from the application.
Create a DNA Helix Component:
Instruction: "Create a new client component file: components/3d/DnaHelix.tsx."
Load and Display the Helix in components/3d/DnaHelix.tsx:
Instruction: "In DnaHelix.tsx, import useGLTF from @react-three/drei and useFrame from @react-three/fiber. Create a component DnaHelixModel. Use useGLTF to load /models/dna_helix.glb. Access the loaded scene (nodes and materials). Render the primitive object from the loaded GLTF. Add a useFrame hook to implement a slow, continuous rotation around the Y-axis."
Conceptual Code Structure:
// components/3d/DnaHelix.tsx
"use client";
import React, { useRef } from 'react';
import { useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export default function DnaHelixModel(props: any) {
  const { scene } = useGLTF('/models/dna_helix.glb');
  const modelRef = useRef<THREE.Group>(null!);

  useFrame((state, delta) => {
    if (modelRef.current) {
      modelRef.current.rotation.y += 0.002; // Slow rotation
    }
  });

  // Scale and position the model as needed
  return <primitive object={scene} ref={modelRef} scale={1} position={[0, 0, 0]} {...props} />;
}
Use code with caution.
Tsx
Guardrail: Ensure proper handling of the GLTF structure. You might need to traverse scene.children if the model isn't a direct primitive.
Add Helix Coloring and Material (Placeholder - Developer will need to inspect GLTF):
Instruction: "Inside DnaHelixModel.tsx, after loading the GLTF, traverse the scene to find the mesh(es) that make up the DNA helix. Apply new MeshStandardMaterial (or MeshPhysicalMaterial for more advanced effects) to these meshes.
Set the color to a luminous cyan (e.g., #61DAFB).
Set emissive to a similar color but darker (e.g., #205A7D) and emissiveIntensity to around 0.3 for a subtle glow.
Set metalness to 0.3 and roughness to 0.4 for a slightly metallic sheen.
Adjust lighting in ThreeScene.tsx if needed to make the new material look good (e.g., stronger directional light, maybe a SpotLight or PointLight targeting the helix)."
Guardrail: This step is highly dependent on the structure of your .glb file. The developer will need to inspect it (e.g., in Blender or an online GLTF viewer) to correctly target the meshes and apply materials.
Add DnaHelixModel to ThreeScene.tsx:
Instruction: "In components/3d/Scene.tsx, import and render the DnaHelixModel component inside the Canvas."
Guardrail: The DNA helix should now appear, colored, and slowly rotating in the center of the scene. Adjust camera position in Canvas props if the helix is too close/far.
V. Implement Background Artifacts (Particles & Geometric Shapes):
Create Particle System Component:
Instruction: "Create components/3d/BackgroundParticles.tsx. Use Points, PointMaterial from @react-three/drei and Sphere (or random positions in a BufferGeometry) to create a field of small, white, slowly drifting particles. Use useFrame for subtle animation."
Create Geometric Shapes Component:
Instruction: "Create components/3d/GeometricShapes.tsx. Create a few instances of simple geometries like IcosahedronGeometry (looks like a pentagon from some angles) or DodecahedronGeometry. Apply a MeshStandardMaterial with a color slightly lighter than the background (e.g., #1E293B), low opacity, and maybe a subtle emissive color. Position them randomly in the background and animate them slowly using useFrame."
Add to ThreeScene.tsx:
Instruction: "Import and render BackgroundParticles and GeometricShapes in ThreeScene.tsx, ensuring they are positioned behind the DNA helix."
Guardrail: The background should now have depth and subtle movement.
VI. Implement Hero Section Content Overlay:
Update app/(marketing)/demo-home/page.tsx:
Instruction: "In the div with relative z-10, add the following content using Tailwind CSS classes for styling, mirroring the look of dna-chain.vercel.app's hero:
Placeholder Logo: Positioned top-left. Create a simple div for now or an img tag if you have a placeholder image.
Navigation (Placeholder): Top-right, simple text links for "Benefits," "How It Works," "Contact" (no functionality needed for demo).
Main Headline: "Unlock Your Unique Health Code." Centered, large, Montserrat ExtraBold/Black, white text.
Sub-headline: "Personalized wellness, decoded from your DNA, microbiome, and real-time biometrics. Your journey to peak health starts now." Centered, below headline, Montserrat Regular/Light, slightly off-white/light grey.
Primary CTA Button: "Discover Your Starter Pack." Centered, below sub-headline. Style it with a vibrant accent color (e.g., bg-[#FF7A59] hover:bg-[#FF6A49] text-white font-semibold py-3 px-8 rounded-lg shadow-md).
Scroll Indication: A simple animated SVG arrow or text "Scroll to Explore" at the bottom center."
Layout: Use Flexbox or Grid via Tailwind to position these elements. The text content area should likely have padding (e.g., p-8 md:p-16).
Guardrail: The hero text and CTA should overlay the 3D scene correctly and be readable.
VII. Implement Scroll-Driven Animations & Section Transitions (Conceptual - This is the most complex part for Vibe Coding):
This section requires a library for scroll animations with R3F, like @react-three/drei's ScrollControls and Scroll, or a more general React scroll animation library like Framer Motion or GSAP integrated with R3F state.
Wrap with ScrollControls:
Instruction: "In components/3d/Scene.tsx, import ScrollControls from @react-three/drei. Wrap the entire content of the Canvas (lights, models, etc.) with <ScrollControls pages={X} damping={Y}> ... </ScrollControls>, where X is the number of "pages" or scroll sections you anticipate (e.g., 4-5 based on our flow), and Y is a damping factor (e.g., 0.1 or 0.25) for smooth scrolling."
Create Scrollable HTML Content Component:
Instruction: "In app/(marketing)/demo-home/page.tsx, alongside the ThreeScene div, create another div that will hold the HTML content for each scroll section. Use the Scroll component from @react-three/drei (if using its HTML embedding feature) or manage visibility with React state based on scroll position.
For each 'scroll step' defined in our previous detailed plan:
Create a div section with appropriate height (e.g., h-screen).
Add the Headline and Body Copy for that step, styled with Montserrat and Tailwind.
Use opacity and transform animations triggered by scroll position to fade/slide these text blocks into view."
Animate 3D Helix with Scroll:
Instruction: "In components/3d/DnaHelix.tsx (or a new parent component managing its scroll behavior):
Import useScroll from @react-three/drei.
Inside useFrame, get the scroll.offset from useScroll(). This value goes from 0 to 1 as the user scrolls through the ScrollControls pages.
Modify the modelRef.current.rotation, modelRef.current.position, or camera properties based on scroll.offset to create the desired camera movements and helix transformations for each section (e.g., zoom, pan, rotate helix to a new orientation)."
Example Logic (Conceptual):
// Inside DnaHelixModel's useFrame
const scroll = useScroll();
// ...
modelRef.current.rotation.y = initialRotationY + scroll.offset * Math.PI * 2; // Example: rotate with scroll
// Change camera position or helix position based on ranges of scroll.offset
// if (scroll.offset > 0.2 && scroll.offset < 0.4) { /* animate for section 2 */ }
Use code with caution.
Tsx
Section Background/Lighting Changes with Scroll:
Instruction: "Similarly, use scroll.offset in ThreeScene.tsx or other relevant components to trigger changes in background color (if possible with your setup, maybe by changing a large background plane's material), lighting intensity/color, or particle system parameters to differentiate the visual feel of each scroll section."
VIII. Styling, Polish & Performance:
Typography & Spacing:
Instruction: "Ensure all text uses Montserrat with appropriate weights and sizes for strong hierarchy. Use Tailwind's spacing utilities for consistent padding and margins."
Button Styles:
Instruction: "Ensure all CTA buttons have clear hover and active states."
Optimization (Ongoing):
Instruction: "Regularly check for performance. If animations are choppy:
Reduce polygon count of 3D models.
Simplify particle systems.
Optimize textures.
Throttle useFrame updates if necessary for non-critical animations."
No Mobile Implementation (For this Demo):
Instruction: "For this demo, we are focusing only on the desktop experience. Do not spend time implementing responsive breakpoints for mobile for this specific /demo-home page yet."
Vibe Code/Windsurf Guardrails & Best Practices for This Prompt:
Step-by-Step Execution: Instruct Vibe Code to implement each numbered point (e.g., III.1, then III.2) sequentially and wait for confirmation/testing before proceeding.
Client Components: Remind Vibe Code that any component using React hooks (useState, useEffect, useRef) or browser-specific APIs for interactivity (like those in R3F) must be a Client Component ("use client";).
File Paths: Be explicit about file paths.
Tailwind CSS: Encourage leveraging Tailwind for all 2D layout, typography, and basic styling of HTML elements.
react-three-fiber Conventions: Emphasize using R3F hooks (useFrame, useLoader) and drei helpers.
Error Handling: Ask Vibe Code to report any errors immediately.
GLTF Structure Dependency: Reiterate that applying materials to the DNA helix (Step IV.4) will require inspecting the .glb structure. Vibe Code might need to output the GLTF node structure first.
Scroll Animation Complexity: Acknowledge that Step VII (Scroll-Driven Animations) is the most complex. It may require iterative refinement. If ScrollControls proves too complex for Vibe Code initially, a simpler approach might be to have distinct "pages" that transition with fades, and the 3D animation is less tightly coupled to the scroll offset, perhaps just changing state between sections.
Focus on Visuals over Functionality (for non-CTA elements): Navigation links, etc., don't need to work for this demo page.
This prompt is very detailed and breaks the task into manageable chunks. The scroll-based animation of the 3D elements synchronized with HTML content (Step VII) will be the most challenging for an AI coding assistant and may require you to guide it carefully or simplify the desired interaction if it struggles.
Start with getting the static scene and hero section looking perfect, then incrementally add the scroll-driven parts. This is going to be a showstopper demo!