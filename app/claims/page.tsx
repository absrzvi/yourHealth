import { ClaimsList } from "@/components/claims/ClaimsList";
import { InsuranceManager } from "@/components/claims/InsuranceManager";
import { ClaimsToolsPanel } from "@/components/claims/ClaimsToolsPanel";

export default function ClaimsPage() {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Insurance Claims</h1>
      <ClaimsList />
      <InsuranceManager />
      <ClaimsToolsPanel />
    </div>
  );
}