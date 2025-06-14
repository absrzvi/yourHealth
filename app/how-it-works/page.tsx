import { Metadata } from 'next';
import { HowItWorksHero } from '@/components/how-it-works/HowItWorksHero';
import { ClaimsWorkflowSection } from '@/components/how-it-works/ClaimsWorkflowSection';
import { AppealsSystemSection } from '@/components/how-it-works/AppealsSystemSection';
import { IntegrationsSection } from '@/components/how-it-works/IntegrationsSection';
import { OperationalGuideSection } from '@/components/how-it-works/OperationalGuideSection';

export const metadata: Metadata = {
  title: 'How It Works - Claims Management System Guide',
  description: 'Complete user guide for understanding and operating your claims management system, including workflows, integrations, and best practices.',
};

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <HowItWorksHero />
      <ClaimsWorkflowSection />
      <AppealsSystemSection />
      <IntegrationsSection />
      <OperationalGuideSection />
    </div>
  );
}
