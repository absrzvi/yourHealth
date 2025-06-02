import { Card } from '@/components/ui/card';

export function SystemBuildingSection() {
  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <Card className="p-8 bg-gradient-to-br from-white to-neutral-50 border-2 border-primary/10">
          <h2 className="text-3xl font-bold text-primary mb-6 font-montserrat">
            Building This Advanced System
          </h2>
          <p className="text-lg text-neutral-700 mb-6 leading-relaxed">
            Our sophisticated health intelligence platform combines cutting-edge technologies:
          </p>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-xl font-semibold text-primary-dark mb-3">Core Technologies</h3>
              <ul className="space-y-2">
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-primary rounded-full"></span>
                  <span className="text-neutral-700">Multi-modal sensor fusion algorithms</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-primary rounded-full"></span>
                  <span className="text-neutral-700">Advanced time-series analysis</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-primary rounded-full"></span>
                  <span className="text-neutral-700">Causal inference models</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-primary rounded-full"></span>
                  <span className="text-neutral-700">Graph neural networks</span>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-primary-dark mb-3">Data Integration</h3>
              <ul className="space-y-2">
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-accent rounded-full"></span>
                  <span className="text-neutral-700">Real-time wearable device APIs</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-accent rounded-full"></span>
                  <span className="text-neutral-700">Clinical lab data pipelines</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-accent rounded-full"></span>
                  <span className="text-neutral-700">Genomic analysis platforms</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-accent rounded-full"></span>
                  <span className="text-neutral-700">Microbiome sequencing integration</span>
                </li>
              </ul>
            </div>
          </div>
          <p className="text-sm text-neutral-600 mt-6 text-center italic">
            Note: Many of these metrics gain their true power when tracked over time, revealing trends and patterns unique to your health journey.
          </p>
        </Card>
      </div>
    </section>
  );
}
