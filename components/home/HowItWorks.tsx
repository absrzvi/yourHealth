'use client';

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
    <section id="how-it-works" className="py-16 md:py-24 lg:py-32 bg-gradient-to-b from-white to-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-4xl mx-auto mb-16 lg:mb-20">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-4 font-montserrat">
            How It Works
          </h2>
          <p className="text-lg sm:text-xl text-gray-600 leading-relaxed">
            Your journey to personalized health starts with our simple, science-backed process
          </p>
        </div>
        
        <div className="relative">
          {/* Decorative background elements */}
          <div className="absolute -top-12 -left-12 w-64 h-64 bg-blue-100 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
          <div className="absolute -bottom-8 -right-8 w-64 h-64 bg-purple-100 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
          
          <div className="relative grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-10 lg:gap-12">
            {steps.map((step, index) => (
              <div 
                key={index} 
                className="relative group"
                data-aos="fade-up"
                data-aos-delay={index * 100}
              >
                {/* Connection Line */}
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-20 left-3/4 w-1/2 h-1 bg-gradient-to-r from-primary/40 via-primary to-primary/40" />
                )}
                
                <div className="h-full bg-white rounded-2xl p-6 md:p-8 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                  <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-blue-50 to-white rounded-2xl shadow-sm flex items-center justify-center text-4xl transition-transform duration-300 group-hover:scale-110 group-hover:shadow-md">
                    <span className="block transform group-hover:scale-110 transition-transform">
                      {step.icon}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{step.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{step.description}</p>
                </div>
                
                {/* Step number */}
                <div className="absolute -top-4 -right-4 w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center font-bold text-sm shadow-lg">
                  {index + 1}
                </div>
              </div>
            ))}
          </div>
          
          <style jsx global>{`
            @keyframes blob {
              0% { transform: translate(0px, 0px) scale(1); }
              33% { transform: translate(30px, -50px) scale(1.1); }
              66% { transform: translate(-20px, 20px) scale(0.9); }
              100% { transform: translate(0px, 0px) scale(1); }
            }
            .animate-blob {
              animation: blob 7s infinite;
            }
            .animation-delay-2000 {
              animation-delay: 2s;
            }
          `}</style>
        </div>
      </div>
    </section>
  );
};
