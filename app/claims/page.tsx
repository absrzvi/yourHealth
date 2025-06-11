import { ClaimsList } from "@/components/claims/ClaimsList";
import { ClaimsOverview } from "@/components/claims/ClaimsOverview";

export default function ClaimsPage() {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Insurance Claims</h1>
      <ClaimsOverview />
      <div className="mt-8">
        <ClaimsList />
      </div>
    </div>
  );
}