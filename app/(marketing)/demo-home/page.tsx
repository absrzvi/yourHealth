// app/(marketing)/demo-home/page.tsx
'use client';

import dynamic from 'next/dynamic';

const DnaHelix = dynamic(
  () => import('./DnaHelix'),
  { 
    ssr: false,
    loading: () => <div>Loading 3D model...</div>
  }
);

export default function DemoHomePage() {
  return (
    <main>
      <DnaHelix />
    </main>
  );
}