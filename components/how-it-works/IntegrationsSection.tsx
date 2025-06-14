'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useState } from 'react';
import { Check, Zap, Activity, Database, FileText, ChevronRight } from 'lucide-react';

export function IntegrationsSection() {
  const [activeIntegration, setActiveIntegration] = useState('lis');

  const integrationTypes = {
    lis: {
      name: 'Laboratory Information System (LIS)',
      description: 'Seamlessly connect with your existing LIS to automatically import test orders, results, and patient data.',
      features: [
        'Bidirectional data synchronization',
        'Automated test order processing',
        'Real-time result reporting',
        'HL7/API connectivity',
        'Error handling and alerts'
      ],
      icon: Activity,
      color: 'bg-blue-100 text-blue-600'
    },
    insurance: {
      name: 'Insurance Providers',
      description: 'Direct integration with major insurance payers for real-time eligibility verification and claim status updates.',
      features: [
        'Real-time eligibility verification',
        'Claim submission tracking',
        'Electronic remittance advice (ERA)',
        'Electronic funds transfer (EFT)',
        'Denial management'
      ],
      icon: FileText,
      color: 'bg-green-100 text-green-600'
    },
    ehr: {
      name: 'Electronic Health Records',
      description: 'Connect with leading EHR systems to maintain a complete patient health record across platforms.',
      features: [
        'Patient demographic synchronization',
        'Clinical document exchange',
        'Test order integration',
        'Results reporting',
        'Appointment scheduling'
      ],
      icon: Database,
      color: 'bg-purple-100 text-purple-600'
    },
    analytics: {
      name: 'Analytics & Reporting',
      description: 'Advanced analytics and reporting tools to track key performance indicators and financial metrics.',
      features: [
        'Custom report generation',
        'Revenue cycle analytics',
        'Denial rate tracking',
        'Provider productivity',
        'Financial performance'
      ],
      icon: Zap,
      color: 'bg-amber-100 text-amber-600'
    }
  };

  return (
    <section className="py-20 px-6 bg-white">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
            Seamless System Integrations
          </h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Our platform connects with all major healthcare systems to streamline your workflow and 
            ensure accurate, timely claim processing.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-12">
          {Object.entries(integrationTypes).map(([key, integration]) => (
            <button
              key={key}
              onClick={() => setActiveIntegration(key)}
              className={`p-6 rounded-xl text-left transition-all ${
                activeIntegration === key
                  ? 'ring-2 ring-blue-500 bg-white shadow-lg'
                  : 'bg-gray-50 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              <div className={`p-3 rounded-full ${integration.color} w-12 h-12 flex items-center justify-center mb-4`}>
                <integration.icon className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {integration.name}
              </h3>
              <p className="text-sm text-gray-600">
                {integration.description}
              </p>
              <div className="mt-4 flex items-center text-blue-600 text-sm font-medium">
                Learn more <ChevronRight className="h-4 w-4 ml-1" />
              </div>
            </button>
          ))}
        </div>

        <div className="bg-gray-50 rounded-2xl p-8">
          <div className="md:flex">
            <div className="md:w-1/2 md:pr-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                {integrationTypes[activeIntegration as keyof typeof integrationTypes].name}
              </h3>
              <p className="text-gray-600 mb-6">
                {integrationTypes[activeIntegration as keyof typeof integrationTypes].description}
              </p>
              <ul className="space-y-3">
                {integrationTypes[activeIntegration as keyof typeof integrationTypes].features.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <Check className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>
              <button className="mt-6 px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors">
                Configure Integration
              </button>
            </div>
            <div className="mt-8 md:mt-0 md:w-1/2">
              <div className="bg-white p-6 rounded-xl border border-gray-200">
                <div className="bg-gray-100 rounded-lg p-4 mb-4">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-3"></div>
                  <div className="h-3 bg-gray-200 rounded w-full mb-1"></div>
                  <div className="h-3 bg-gray-200 rounded w-5/6 mb-3"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </div>
                <div className="space-y-3">
                  <div className="h-3 bg-gray-100 rounded w-full"></div>
                  <div className="h-3 bg-gray-100 rounded w-11/12"></div>
                  <div className="h-3 bg-gray-100 rounded w-10/12"></div>
                </div>
              </div>
              <p className="text-sm text-gray-500 mt-3 text-center">
                Example of {integrationTypes[activeIntegration as keyof typeof integrationTypes].name.toLowerCase()} data flow
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
