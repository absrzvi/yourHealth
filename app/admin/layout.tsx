"use client";

import React from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();

  // Check if user is authenticated and has admin role
  if (status === "loading") {
    return <div className="p-8">Loading...</div>;
  }

  if (status === "unauthenticated" || !session) {
    redirect("/login");
  }

  // @ts-ignore - We added the role field to the session user
  if (session?.user?.role !== "ADMIN") {
    redirect("/dashboard");
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>
      
      <Tabs defaultValue="users" className="w-full mb-8">
        <TabsList className="grid w-full grid-cols-3">
          <Link href="/admin/users" passHref legacyBehavior>
            <TabsTrigger value="users" asChild>
              <a>User Management</a>
            </TabsTrigger>
          </Link>
          <Link href="/admin/claims" passHref legacyBehavior>
            <TabsTrigger value="claims" asChild>
              <a>Claims Management</a>
            </TabsTrigger>
          </Link>
          <Link href="/admin/insurance" passHref legacyBehavior>
            <TabsTrigger value="insurance" asChild>
              <a>Insurance Plans</a>
            </TabsTrigger>
          </Link>
        </TabsList>
      </Tabs>
      
      {children}
    </div>
  );
}
