import { Card } from '@/components/ui/card';

export function LLMSection() {
  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-primary/5 to-transparent">
      <div className="max-w-7xl mx-auto">
        <Card className="p-8 bg-white/80 backdrop-blur">
          <h2 className="text-3xl font-bold text-primary mb-6 font-montserrat">
            The Role of LLMs in Your Health Journey
          </h2>
          <p className="text-lg text-neutral-700 mb-6 leading-relaxed">
            Large Language Models serve as your intelligent health interpreter, transforming complex data into actionable insights:
          </p>
          <ul className="space-y-3">
            <li className="flex items-start gap-3">
              <span className="text-accent text-xl mt-1">✓</span>
              <span className="text-neutral-700">
                <strong>Translating Complex Data:</strong> Converting technical biomarkers into understandable explanations
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-accent text-xl mt-1">✓</span>
              <span className="text-neutral-700">
                <strong>Pattern Recognition:</strong> Identifying subtle connections between your various health metrics
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-accent text-xl mt-1">✓</span>
              <span className="text-neutral-700">
                <strong>Personalized Recommendations:</strong> Suggesting evidence-based interventions tailored to your unique profile
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-accent text-xl mt-1">✓</span>
              <span className="text-neutral-700">
                <strong>Continuous Learning:</strong> Adapting insights as your health data evolves over time
              </span>
            </li>
          </ul>
        </Card>
      </div>
    </section>
  );
}
