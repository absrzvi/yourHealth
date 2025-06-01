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
    <section className="relative py-16 md:py-24 lg:py-32 bg-white overflow-hidden">
      {/* Background elements */}
      <div className="absolute -right-20 -top-20 w-64 h-64 bg-blue-50 rounded-full mix-blend-multiply filter blur-3xl opacity-50"></div>
      <div className="absolute -left-20 -bottom-20 w-72 h-72 bg-purple-50 rounded-full mix-blend-multiply filter blur-3xl opacity-50"></div>
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Content */}
          <div 
            className="order-2 lg:order-1"
            data-aos="fade-right"
            data-aos-delay="100"
          >
            <div className="inline-block px-4 py-2 bg-blue-50 rounded-full mb-6">
              <span className="text-sm font-semibold text-primary uppercase tracking-wider">The Science Behind Your Health</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-6 leading-tight">
              Precision Wellness,<br />
              <span className="text-primary">Rooted in Research</span>.
            </h2>
            <p className="text-lg text-gray-600 mb-8 leading-relaxed max-w-2xl">
              We combine the latest advancements in genomics, microbiome science, and artificial intelligence to provide you with unparalleled insights into your health. Our approach is validated by ongoing research and a commitment to scientific rigor.
            </p>
            <ul className="space-y-4 mb-10">
              {features.map((feature, index) => (
                <li 
                  key={index} 
                  className="flex items-start group"
                  data-aos="fade-up"
                  data-aos-delay={100 + (index * 100)}
                >
                  <div className="flex-shrink-0 mt-1 mr-4">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-50 group-hover:bg-green-100 transition-colors">
                      <CheckCircle size={18} className="text-green-500" />
                    </div>
                  </div>
                  <span className="text-gray-700 text-lg">{feature}</span>
                </li>
              ))}
            </ul>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/science" className="w-full sm:w-auto">
                <Button 
                  size="lg"
                  className="w-full sm:w-auto bg-primary hover:bg-primary-dark text-white rounded-xl px-8 py-6 text-base font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300"
                >
                  Explore Our Approach
                </Button>
              </Link>
              <Link href="/research" className="w-full sm:w-auto">
                <Button 
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto border-2 border-gray-200 hover:border-primary text-gray-700 hover:text-primary rounded-xl px-8 py-6 text-base font-semibold transition-all duration-300"
                >
                  View Research
                </Button>
              </Link>
            </div>
          </div>

          {/* Image */}
          <div 
            className="order-1 lg:order-2 relative"
            data-aos="fade-left"
            data-aos-delay="200"
          >
            <div className="relative rounded-2xl overflow-hidden shadow-2xl">
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent z-10"></div>
              <img 
                src="/images/pic4.jpg" 
                alt="Scientist working in a modern lab"
                className="w-full h-auto object-cover aspect-[4/5] sm:aspect-[3/4] lg:aspect-auto lg:h-[600px]"
                loading="lazy"
              />
            </div>
            {/* Decorative element */}
            <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-yellow-100 rounded-2xl -z-10"></div>
          </div>
        </div>
      </div>
    </section>
  );
}
