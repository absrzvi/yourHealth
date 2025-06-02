'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

// Define the biometric categories and their metrics
const biometricCategories = [
  {
    id: 'metabolic',
    romanNumeral: 'I',
    title: 'Deep Metabolic & Energy Regulation Metrics',
    icon: '⚡',
    metrics: [
      {
        name: 'Personalized Glycemic Response Signature (PGRS)',
        dataCorrelated: 'Continuous Glucose Monitor (CGM) data (glucose spikes, dips, variability), microbiome (specific taxa known to influence glucose metabolism, e.g., Akkermansia muciniphila, SCFA producers), DNA (genetic predispositions like TCF7L2 variants), food logs (if available), activity levels (pre/post meal), sleep quality (impact on insulin sensitivity), medication (e.g., metformin, insulin).',
        uniqueInsight: 'Moves beyond simple glucose numbers to predict your individual blood sugar response to specific meals and activities. This considers your genetic predispositions and current microbiome state, helping identify optimal meal timings or compositions tailored to you. It can even predict how a new food might impact your glucose levels.',
        llmExample: 'Your recent pasta dinner caused a higher spike than usual. Our AI suggests this could be linked to lower levels of Bifidobacterium in your gut this week, which typically helps process complex carbs, combined with your genetic tendency for slightly reduced insulin sensitivity.',
        aiMethod: 'Time-series forecasting, causal inference'
      },
      {
        name: 'Metabolic Flexibility Score',
        dataCorrelated: 'Heart rate variability (HRV), respiratory quotient (if available), activity data, sleep stages, fasting periods, macronutrient intake, stress levels (cortisol if available), body composition (if available).',
        uniqueInsight: 'Quantifies how efficiently your body switches between burning carbohydrates and fats for fuel. A higher score indicates better metabolic health and flexibility. The AI analyzes patterns in your data to suggest optimal fasting windows or dietary adjustments to improve metabolic flexibility.',
        llmExample: 'Your Metabolic Flexibility Score has improved by 15% since last month, coinciding with your increased morning fasts. The AI notes your body now switches to fat burning about 30 minutes earlier during exercise compared to last month.',
        aiMethod: 'Time-series clustering, pattern recognition'
      },
      {
        name: 'Chrono-Nutrient Optimization Index',
        dataCorrelated: 'Meal timing, macronutrient composition, activity data, sleep data, circadian rhythm markers (like core body temperature or melatonin if available), energy levels.',
        uniqueInsight: 'Identifies the optimal times of day for you to consume different macronutrients based on your unique circadian biology. This goes beyond generic advice to provide personalized recommendations for when your body processes carbs, proteins, and fats most efficiently.',
        llmExample: 'The AI has learned that your body processes carbohydrates most efficiently in the morning, while evening meals higher in healthy fats and protein lead to better sleep quality and morning energy levels based on your unique data patterns.',
        aiMethod: 'Temporal pattern analysis, reinforcement learning'
      },
      {
        name: 'Dynamic Energy Balance Score (DEBS)',
        dataCorrelated: 'Activity data, resting metabolic rate (if available), food logs, sleep data, body composition (if available), body temperature, heart rate data.',
        uniqueInsight: 'A dynamic calculation that goes beyond simple calories in/out by accounting for how your body processes and utilizes energy differently based on various factors like sleep, stress, and activity. It provides a more accurate picture of your energy balance than traditional calorie counting.',
        llmExample: 'Despite eating slightly more calories yesterday, your DEBS shows improved energy utilization efficiency, likely due to better sleep quality and the timing of your workout in relation to your meals.',
        aiMethod: 'Multivariate time-series analysis, energy balance modeling'
      },
      {
        name: 'Mitochondrial Efficiency & Stress Index (MESI)',
        dataCorrelated: 'HRV, resting heart rate, recovery metrics, activity data, sleep quality, blood biomarkers (if available), subjective energy levels.',
        uniqueInsight: 'Assesses the health and efficiency of your mitochondria (cellular energy producers) by analyzing various physiological markers. A higher score indicates better mitochondrial function and lower cellular stress. The AI can detect subtle patterns that might indicate mitochondrial stress before you notice symptoms.',
        llmExample: 'Your MESI score dropped slightly this week, suggesting your cells are under more oxidative stress. The AI correlates this with your increased training load and suggests adding more antioxidant-rich foods to support recovery.',
        aiMethod: 'Biomarker integration, stress response modeling'
      }
    ]
  },
  {
    id: 'inflammatory',
    romanNumeral: 'II',
    title: 'Advanced Inflammatory & Immune Response Metrics',
    icon: '🔥',
    metrics: [
      {
        name: 'Systemic Inflammation Index (SII)',
        dataCorrelated: 'Blood biomarkers (CRP, IL-6, TNF-α if available), resting heart rate, HRV, sleep quality, recovery metrics, food logs, stress levels.',
        uniqueInsight: 'Provides a composite score of your body\'s inflammatory status by analyzing multiple biomarkers and physiological signals. The AI detects subtle patterns that might indicate subclinical inflammation before it becomes problematic.',
        llmExample: 'Your SII has been trending downward over the past month, which aligns with your increased intake of anti-inflammatory foods like turmeric and fatty fish. The AI suggests maintaining this dietary pattern to continue supporting healthy inflammation levels.',
        aiMethod: 'Multivariate analysis, inflammation pattern recognition'
      },
      {
        name: 'Immune Resilience Score',
        dataCorrelated: 'Sleep data, stress levels, activity data, recovery metrics, HRV, previous illness history, vaccination status, blood biomarkers (if available).',
        uniqueInsight: 'Assesses your immune system\'s current state and ability to respond to challenges. The score considers both your baseline immune function and temporary factors that might affect it, providing insights into your susceptibility to illness.',
        llmExample: 'Your Immune Resilience Score has decreased slightly, possibly due to the combination of poor sleep and increased stress at work. The AI recommends prioritizing sleep and considering immune-supportive nutrients like vitamin D and zinc.',
        aiMethod: 'Immune system modeling, risk assessment'
      }
    ]
  }
];

export function BiometricsContent() {
  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {biometricCategories.map((category) => (
          <div key={category.id} className="mb-16">
            {/* Category Header */}
            <div className="flex items-center gap-4 mb-8">
              <span className="text-5xl">{category.icon}</span>
              <div>
                <h2 className="text-3xl font-bold text-primary font-montserrat">
                  {category.romanNumeral}. {category.title}
                </h2>
              </div>
            </div>
            
            {/* Subtle divider */}
            <div className="h-px bg-gradient-to-r from-primary/20 via-accent/20 to-transparent mb-8" />
            
            {/* Metrics Grid */}
            <div className="space-y-8">
              {category.metrics.map((metric, index) => (
                <Card key={index} className="p-6 hover:shadow-lg transition-shadow duration-300 border-l-4 border-l-primary">
                  <h3 className="text-2xl font-semibold text-primary-dark mb-4 font-montserrat">
                    {metric.name}
                  </h3>
                  
                  <div className="space-y-4">
                    {/* Data Correlated */}
                    <div>
                      <Badge variant="outline" className="mb-2 bg-primary/5 text-primary border-primary/20">
                        Data Correlated
                      </Badge>
                      <p className="text-neutral-700 leading-relaxed ml-4">
                        {metric.dataCorrelated}
                      </p>
                    </div>
                    
                    {/* Unique Insight */}
                    <div>
                      <Badge variant="outline" className="mb-2 bg-accent/5 text-accent-dark border-accent/20">
                        Unique Insight
                      </Badge>
                      <p className="text-neutral-700 leading-relaxed ml-4">
                        {metric.uniqueInsight}
                      </p>
                    </div>
                    
                    {/* LLM Role Example */}
                    <div>
                      <Badge variant="outline" className="mb-2 bg-secondary/5 text-secondary-dark border-secondary/20">
                        AI Example
                      </Badge>
                      <p className="text-neutral-600 italic leading-relaxed ml-4 bg-neutral-50 p-4 rounded-lg">
                        "{metric.llmExample}"
                      </p>
                    </div>
                    
                    {/* AI/ML Method */}
                    <div>
                      <Badge variant="outline" className="mb-2 bg-neutral-100 text-neutral-600 border-neutral-300">
                        AI/ML Method
                      </Badge>
                      <p className="text-neutral-600 ml-4">
                        {metric.aiMethod}
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
