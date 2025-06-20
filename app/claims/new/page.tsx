"use client";

import React from "react";
import { EnhancedClaimForm } from "@/components/claims/EnhancedClaimForm";

export default function NewClaimPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8">Create New Claim</h1>
      <EnhancedClaimForm />
    </div>
  );
}
