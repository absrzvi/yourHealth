import Link from "next/link";

export default function Home() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen">
      <nav className="w-full flex justify-end p-4">
        <Link href="/data-sources" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition">Data Sources</Link>
      </nav>
      <h1 className="text-3xl font-bold mb-4">For Your Health MVP</h1>
      <p className="text-lg">Minimal personalized health platform for friends & family.</p>
    </main>
  );
}
