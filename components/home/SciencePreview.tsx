import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { CheckCircle } from 'lucide-react';

const features = [
  'Cutting-edge DNA & microbiome analysis',
  'AI-driven personalized recommendations',
  'Evidence-based lifestyle interventions',
  'Validated biomarker tracking',
];

export function SciencePreview() {
  return (
    <section className="py-16 md:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div className="order-2 md:order-1">
            <span className="text-sm font-semibold text-primary uppercase tracking-wider">The Science Behind Your Health</span>
            <h2 className="text-3xl md:text-4xl font-bold text-neutral-800 mt-2 mb-6 font-montserrat">
              Precision Wellness, Rooted in Research.
            </h2>
            <p className="text-lg text-neutral-600 mb-6">
              We combine the latest advancements in genomics, microbiome science, and artificial intelligence to provide you with unparalleled insights into your health. Our approach is validated by ongoing research and a commitment to scientific rigor.
            </p>
            <ul className="space-y-3 mb-8">
              {features.map((feature, index) => (
                <li key={index} className="flex items-center">
                  <CheckCircle size={20} className="text-green-500 mr-3 flex-shrink-0" />
                  <span className="text-neutral-700">{feature}</span>
                </li>
              ))}
            </ul>
            <Link href="/science">
              <Button 
                size="lg"
                className="bg-primary hover:bg-primary-dark text-white rounded-full px-8 py-3 text-base font-semibold shadow-md transform hover:scale-105 transition-all"
              >
                Explore Our Approach
              </Button>
            </Link>
          </div>

          {/* Image */}
          <div className="order-1 md:order-2">
            <img 
              src="/images/science-lab-research.jpg" 
              alt="Scientist working in a modern lab"
              className="rounded-xl shadow-2xl object-cover w-full h-auto md:max-h-[500px]"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
