"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, name })
    });
    if (res.ok) router.push("/auth/login");
    else setError("Registration failed");
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h2 className="text-2xl font-bold mb-4">Register</h2>
      <form onSubmit={handleSubmit} className="flex flex-col w-80 space-y-4">
        <input type="text" placeholder="Name" value={name} onChange={e => setName(e.target.value)} className="p-2 border rounded" required />
        <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} className="p-2 border rounded" required />
        <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} className="p-2 border rounded" required />
        {error && <div className="text-red-500">{error}</div>}
        <button type="submit" className="bg-blue-500 text-white py-2 rounded">Register</button>
      </form>
      <p className="mt-2">Already have an account? <a href="/auth/login" className="text-blue-600 underline">Login</a></p>
    </div>
  );
}
