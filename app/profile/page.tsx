import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

export default async function ProfilePage() {
  const session = await getServerSession();
  if (!session) redirect("/auth/login");
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h2 className="text-2xl font-bold mb-4">Profile</h2>
      <div>Email: {session.user?.email}</div>
      <div>Name: {session.user?.name}</div>
    </div>
  );
}
