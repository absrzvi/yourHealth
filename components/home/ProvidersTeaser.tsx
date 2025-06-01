import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Stethoscope, Users, Zap } from 'lucide-react';

export function ProvidersTeaser() {
  return (
    <section className="py-16 md:py-24 bg-primary text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Image - Placeholder for a professional image of a provider or clinic setting */}
          <div className="order-2 md:order-1">
            <img 
              src="/images/healthcare-provider-consult.jpg" 
              alt="Healthcare provider discussing results with a patient"
              className="rounded-xl shadow-2xl object-cover w-full h-auto md:max-h-[450px]"
            />
          </div>

          {/* Content */}
          <div className="order-1 md:order-2">
            <span className="text-sm font-semibold text-secondary uppercase tracking-wider">Partner with Us</span>
            <h2 className="text-3xl md:text-4xl font-bold mt-2 mb-6 font-montserrat">
              Empower Your Practice with Precision Health.
            </h2>
            <p className="text-lg text-neutral-200 mb-6">
              Integrate our advanced AI-driven health insights into your practice. Offer your patients personalized, proactive care plans based on their unique biology. Enhance patient outcomes and stay at the forefront of modern medicine.
            </p>
            <ul className="space-y-3 mb-8">
              <li className="flex items-center">
                <Stethoscope size={20} className="text-secondary mr-3 flex-shrink-0" />
                <span className="text-neutral-100">Actionable insights for better patient care.</span>
              </li>
              <li className="flex items-center">
                <Users size={20} className="text-secondary mr-3 flex-shrink-0" />
                <span className="text-neutral-100">Seamless integration with your workflow.</span>
              </li>
              <li className="flex items-center">
                <Zap size={20} className="text-secondary mr-3 flex-shrink-0" />
                <span className="text-neutral-100">Drive patient engagement and satisfaction.</span>
              </li>
            </ul>
            <Link href="/providers">
              <Button 
                size="lg"
                variant="secondary"
                className="bg-secondary hover:bg-secondary-dark text-primary rounded-full px-8 py-3 text-base font-semibold shadow-md transform hover:scale-105 transition-all"
              >
                Learn More for Providers
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
