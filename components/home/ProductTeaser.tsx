import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Package, Dna, Microscope } from 'lucide-react';

const products = [
  {
    icon: <Dna size={48} className="text-primary" />,
    name: 'DNA Blueprint Kit',
    description: 'Unlock your genetic predispositions and optimize your lifestyle for long-term health.',
    link: '/products/dna-blueprint',
  },
  {
    icon: <Microscope size={48} className="text-primary" />,
    name: 'Microbiome Insight Kit',
    description: 'Understand your gut health and get personalized dietary recommendations.',
    link: '/products/microbiome-insight',
  },
  {
    icon: <Package size={48} className="text-primary" />,
    name: 'Comprehensive Wellness Panel',
    description: 'A full spectrum analysis combining DNA, microbiome, and key biomarker data.',
    link: '/products/comprehensive-panel',
  },
];

export function ProductTeaser() {
  return (
    <section className="py-16 md:py-24 bg-neutral-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-neutral-800 font-montserrat">
            Discover Your Path to Personalized Health
          </h2>
          <p className="mt-4 text-lg text-neutral-600 max-w-2xl mx-auto">
            Explore our range of advanced testing kits designed to give you deep insights into your unique biology.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {products.map((product) => (
            <div 
              key={product.name} 
              className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col items-center text-center"
            >
              <div className="mb-6">
                {product.icon}
              </div>
              <h3 className="text-xl font-semibold text-neutral-800 mb-3 font-montserrat">
                {product.name}
              </h3>
              <p className="text-neutral-600 text-sm mb-6 flex-grow">
                {product.description}
              </p>
              <Link href={product.link} className="mt-auto">
                <Button variant="outline" className="border-primary text-primary hover:bg-primary hover:text-white rounded-full px-6">
                  Learn More
                </Button>
              </Link>
            </div>
          ))}
        </div>
        <div className="text-center mt-12">
          <Link href="/products">
            <Button 
              size="lg"
              className="bg-accent hover:bg-accent-dark text-white rounded-full px-10 py-3 text-base font-semibold shadow-md transform hover:scale-105 transition-all"
            >
              View All Products
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
