import React from 'react';

export function HowItWorks() {
  const steps = [
    {
      icon: "📦",
      title: "Order Your Kit",
      description: "Choose from DNA, microbiome, or comprehensive testing packages"
    },
    {
      icon: "🧪",
      title: "Provide Sample",
      description: "Simple at-home collection with prepaid return shipping"
    },
    {
      icon: "🤖",
      title: "AI Analysis",
      description: "Our AI engine analyzes your data for personalized insights"
    },
    {
      icon: "🎯",
      title: "Achieve Goals",
      description: "Follow your custom health roadmap to reach your potential"
    }
  ];

  return (
    <section className="py-20 bg-neutral-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 font-montserrat">
          How It Works
        </h2>
        <p className="text-xl text-neutral-600 text-center mb-12 max-w-3xl mx-auto">
          Your journey to personalized health starts with three simple steps
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <div key={index} className="relative">
              {/* Connection Line */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-16 left-full w-full h-0.5 bg-gradient-to-r from-primary to-transparent" />
              )}
              
              <div className="text-center group">
                <div className="w-32 h-32 mx-auto mb-4 bg-white rounded-full shadow-lg flex items-center justify-center text-5xl group-hover:shadow-xl transition-shadow">
                  {step.icon}
                </div>
                <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                <p className="text-neutral-600">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
