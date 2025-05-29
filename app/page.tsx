import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "./api/auth/[...nextauth]/route";
import AIFirstLayout from "./ai-first-layout";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Aria Health Coach | For Your Health",
  description: "Your personal AI health companion to help you understand and improve your health",
};

export default async function Home() {
  // HIPAA-compliance: Ensure user is authenticated
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect("/auth/login");
  }
  
  return (
    <AIFirstLayout>
      {/* Main content is now handled by the AI-first layout */}
    </AIFirstLayout>
  );
}
