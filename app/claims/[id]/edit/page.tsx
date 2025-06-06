"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ClaimForm } from "@/components/claims/ClaimForm";
import { Loader2 } from 'lucide-react';

export default function EditClaimPage() {
  const params = useParams();
  const router = useRouter();
  const claimId = params.id as string;
  
  const [claim, setClaim] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchClaim() {
      try {
        const response = await fetch(`/api/claims/${claimId}`);
        if (!response.ok) {
          throw new Error('Claim not found or you do not have permission to view it');
        }
        const data = await response.json();
        setClaim(data);
      } catch (err: any) {
        setError(err.message || 'Failed to load claim data');
        console.error('Error fetching claim:', err);
      } finally {
        setLoading(false);
      }
    }

    if (claimId) {
      fetchClaim();
    }
  }, [claimId]);

  const handleSuccess = (updatedClaim: any) => {
    router.push(`/claims`);
    router.refresh();
  };

  const handleCancel = () => {
    router.push(`/claims`);
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4 flex justify-center items-center min-h-[300px]">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading claim data...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md">
          <h2 className="text-xl font-bold mb-2">Error</h2>
          <p>{error}</p>
          <button 
            onClick={() => router.push('/claims')}
            className="mt-4 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
          >
            Back to Claims
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8">Edit Claim</h1>
      {claim && (
        <ClaimForm
          editMode={true}
          initialData={claim}
          onSuccess={handleSuccess}
          onCancel={handleCancel}
        />
      )}
    </div>
  );
}
