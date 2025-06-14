'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Monitor, BarChart, Settings, AlertTriangle, CheckCircle, Clock, FileText, HelpCircle } from 'lucide-react';
import { useState } from 'react';

type GuideSection = {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  content: React.ReactNode;
};

export function OperationalGuideSection() {
  const [activeTab, setActiveTab] = useState('monitoring');

  const guideSections: Record<string, GuideSection> = {
    monitoring: {
      title: 'Monitoring & Alerts',
      icon: Monitor,
      description: 'Track system health and set up notifications',
      content: <MonitoringGuideContent />
    },
    reporting: {
      title: 'Reporting',
      icon: BarChart,
      description: 'Generate and analyze reports',
      content: <ReportingGuideContent />
    },
    maintenance: {
      title: 'System Maintenance',
      icon: Settings,
      description: 'Scheduled tasks and system updates',
      content: <MaintenanceGuideContent />
    },
    bestPractices: {
      title: 'Best Practices',
      icon: CheckCircle,
      description: 'Recommended guidelines for optimal operation',
      content: <BestPracticesContent />
    }
  };

  return (
    <section className="py-20 px-6 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Operational Guidelines
          </h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Comprehensive guides for managing and optimizing your claims processing workflow.
          </p>
        </div>

        <Card className="overflow-hidden">
          <Tabs 
            defaultValue="monitoring" 
            className="w-full"
            onValueChange={setActiveTab}
          >
            <TabsList className="w-full justify-start rounded-none border-b bg-gray-50 p-0">
              {Object.entries(guideSections).map(([key, section]) => {
                const Icon = section.icon;
                return (
                  <TabsTrigger 
                    key={key} 
                    value={key}
                    className={`relative py-6 px-6 text-sm font-medium transition-all ${
                      activeTab === key 
                        ? 'text-blue-600' 
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Icon className="h-5 w-5" />
                      <span>{section.title}</span>
                    </div>
                    {activeTab === key && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></div>
                    )}
                  </TabsTrigger>
                );
              })}
            </TabsList>

            {Object.entries(guideSections).map(([key, section]) => (
              <TabsContent key={key} value={key} className="p-8">
                <div className="prose max-w-none">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    {section.title}
                  </h3>
                  <p className="text-gray-600 mb-6">
                    {section.description}
                  </p>
                  {section.content}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </Card>
      </div>
    </section>
  );
}

// Guide Content Components
function MonitoringGuideContent() {
  return (
    <div className="space-y-8">
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Key Metrics</h4>
          <ul className="space-y-3">
            {[
              'Claim submission success/failure rates',
              'Average processing time by status',
              'Denial rates by reason code',
              'Aging claims report',
              'Revenue cycle metrics'
            ].map((item, index) => (
              <li key={index} className="flex items-start">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                <span className="text-gray-700">{item}</span>
              </li>
            ))}
          </ul>
        </div>
        
        <div>
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Alert Configuration</h4>
          <ul className="space-y-3">
            {[
              'Email/SMS notifications for claim denials',
              'System error alerts',
              'Custom alerts for specific payers',
              'SLA breach notifications',
              'Dashboard widgets for key metrics'
            ].map((item, index) => (
              <li key={index} className="flex items-start">
                <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5 mr-2 flex-shrink-0" />
                <span className="text-gray-700">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="bg-blue-50 p-6 rounded-lg border border-blue-100">
        <h4 className="text-lg font-semibold text-blue-800 mb-3">Quick Start Guide</h4>
        <ol className="list-decimal list-inside space-y-2 text-blue-700">
          <li>Navigate to <span className="font-mono font-medium">Dashboard &gt; Monitoring</span></li>
          <li>Configure your preferred notification channels</li>
          <li>Set up custom alert thresholds</li>
          <li>Save your preferences</li>
        </ol>
      </div>

      <div>
        <h4 className="text-lg font-semibold text-gray-900 mb-4">Troubleshooting</h4>
        <div className="space-y-4">
          <div className="p-4 bg-white rounded-lg border border-gray-200">
            <h5 className="font-medium text-gray-900">Not receiving alerts?</h5>
            <ul className="mt-2 space-y-1 text-sm text-gray-600 list-disc list-inside">
              <li>Check your notification settings</li>
              <li>Verify your email/phone is correctly configured</li>
              <li>Ensure alerts are enabled for your user role</li>
            </ul>
          </div>
          <div className="p-4 bg-white rounded-lg border border-gray-200">
            <h5 className="font-medium text-gray-900">False positives in alerts?</h5>
            <ul className="mt-2 space-y-1 text-sm text-gray-600 list-disc list-inside">
              <li>Adjust your alert thresholds</li>
              <li>Review and update your alert rules</li>
              <li>Check for system updates</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

function ReportingGuideContent() {
  const reportTypes = [
    {
      name: 'Financial Reports',
      icon: FileText,
      description: 'Revenue, payments, adjustments, and AR aging',
      items: [
        'Daily/Weekly/Monthly revenue reports',
        'Payment posting summaries',
        'Adjustment analysis',
        'Accounts receivable aging'
      ]
    },
    {
      name: 'Claim Status',
      icon: CheckCircle,
      description: 'Submitted, paid, denied, and pending claims',
      items: [
        'Claim status by date range',
        'Paid claims summary',
        'Denial analysis by reason',
        'Clean claim rate'
      ]
    },
    {
      name: 'Denial Analysis',
      icon: AlertTriangle,
      description: 'Denial reasons, trends, and recovery rates',
      items: [
        'Top denial reasons',
        'Denial trends over time',
        'Recovery success rates',
        'Appeal status tracking'
      ]
    },
    {
      name: 'Provider Productivity',
      icon: BarChart,
      description: 'Claims volume, reimbursement rates, and coding',
      items: [
        'Provider productivity metrics',
        'Coding accuracy rates',
        'Reimbursement by provider',
        'Procedure code utilization'
      ]
    }
  ];

  return (
    <div className="space-y-8">
      <div className="bg-blue-50 p-6 rounded-lg border border-blue-100">
        <h4 className="text-lg font-semibold text-blue-800 mb-3">Quick Start</h4>
        <ol className="list-decimal list-inside space-y-2 text-blue-700">
          <li>Go to <span className="font-mono font-medium">Reports &gt; New Report</span></li>
          <li>Select your report type and date range</li>
          <li>Apply any necessary filters</li>
          <li>Choose export format (PDF, Excel, CSV)</li>
          <li>Generate or schedule your report</li>
        </ol>
      </div>

      <div>
        <h4 className="text-xl font-semibold text-gray-900 mb-6">Available Report Types</h4>
        <div className="grid md:grid-cols-2 gap-6">
          {reportTypes.map((report, index) => {
            const Icon = report.icon;
            return (
              <Card key={index} className="h-full">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Icon className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h5 className="font-semibold text-gray-900">{report.name}</h5>
                      <p className="text-sm text-gray-500">{report.description}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    {report.items.map((item, i) => (
                      <li key={i} className="flex items-start">
                        <div className="h-1.5 w-1.5 rounded-full bg-gray-300 mt-2 mr-2"></div>
                        <span className="text-gray-700">{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mt-8">
        <div>
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Scheduled Reports</h4>
          <ul className="space-y-3">
            {[
              'Set up daily/weekly/monthly auto-delivery',
              'Email reports to multiple recipients',
              'Configure report parameters once',
              'Pause/resume schedules as needed'
            ].map((item, index) => (
              <li key={index} className="flex items-start">
                <Clock className="h-5 w-5 text-blue-500 mt-0.5 mr-2 flex-shrink-0" />
                <span className="text-gray-700">{item}</span>
              </li>
            ))}
          </ul>
        </div>
        
        <div>
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Export Options</h4>
          <ul className="space-y-3">
            {[
              'Export to PDF for sharing',
              'Download as Excel for further analysis',
              'CSV for data integration',
              'Print-friendly formats'
            ].map((item, index) => (
              <li key={index} className="flex items-start">
                <FileText className="h-5 w-5 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                <span className="text-gray-700">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function MaintenanceGuideContent() {
  const maintenanceTasks = [
    {
      frequency: 'Daily',
      tasks: [
        'Verify system backups completed successfully',
        'Check system logs for errors',
        'Monitor server resource usage',
        'Review and address system alerts'
      ],
      icon: '📅',
      color: 'bg-blue-100 text-blue-800'
    },
    {
      frequency: 'Weekly',
      tasks: [
        'Update system software and security patches',
        'Clean up temporary files and logs',
        'Review and optimize database performance',
        'Test backup restoration process'
      ],
      icon: '📆',
      color: 'bg-green-100 text-green-800'
    },
    {
      frequency: 'Monthly',
      tasks: [
        'Review and update user access permissions',
        'Perform security audit and vulnerability scan',
        'Archive old reports and logs',
        'Update system documentation'
      ],
      icon: '📊',
      color: 'bg-purple-100 text-purple-800'
    },
    {
      frequency: 'Quarterly',
      tasks: [
        'Review and test disaster recovery plan',
        'Update system architecture documentation',
        'Evaluate and optimize system performance',
        'Review and update backup strategy'
      ],
      icon: '🔄',
      color: 'bg-amber-100 text-amber-800'
    }
  ];

  return (
    <div className="space-y-8">
      <div className="bg-blue-50 p-6 rounded-lg border border-blue-100">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <AlertTriangle className="h-6 w-6 text-blue-600" />
          </div>
          <div className="ml-3">
            <h4 className="text-lg font-semibold text-blue-800 mb-2">Scheduled Maintenance</h4>
            <p className="text-blue-700">
              Regular system maintenance is performed every <strong>Sunday from 1:00 AM to 3:00 AM EST</strong>. 
              During this time, some features may be temporarily unavailable.
            </p>
          </div>
        </div>
      </div>

      <div>
        <h4 className="text-xl font-semibold text-gray-900 mb-6">Maintenance Schedule</h4>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {maintenanceTasks.map((task, index) => (
            <Card key={index} className="h-full">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <span className={`text-2xl ${task.color} p-2 rounded-lg`}>{task.icon}</span>
                  <h5 className="text-lg font-semibold text-gray-900">{task.frequency}</h5>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {task.tasks.map((item, i) => (
                    <li key={i} className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                      <span className="text-gray-700">{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <div>
          <h4 className="text-lg font-semibold text-gray-900 mb-4">System Requirements</h4>
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <tbody className="divide-y divide-gray-200">
                {[
                  ['Operating System', 'Windows Server 2019+, Ubuntu 20.04 LTS+, RHEL 8+'],
                  ['CPU', '4+ cores'],
                  ['Memory', '16GB+ RAM'],
                  ['Storage', '100GB+ free disk space'],
                  ['Database', 'PostgreSQL 13+, MongoDB 5.0+'],
                  ['Browser', 'Chrome 100+, Firefox 90+, Safari 15+']
                ].map(([requirement, value], i) => (
                  <tr key={i} className={i % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                    <td className="px-6 py-3 text-sm font-medium text-gray-900">{requirement}</td>
                    <td className="px-6 py-3 text-sm text-gray-500">{value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Troubleshooting</h4>
          <div className="space-y-4">
            <div className="p-4 bg-white rounded-lg border border-gray-200">
              <h5 className="font-medium text-gray-900">System Running Slow?</h5>
              <ul className="mt-2 space-y-1 text-sm text-gray-600 list-disc list-inside">
                <li>Check server resource usage (CPU, memory, disk I/O)</li>
                <li>Review and optimize database queries</li>
                <li>Clear application cache</li>
                <li>Check for network latency issues</li>
              </ul>
            </div>
            <div className="p-4 bg-white rounded-lg border border-gray-200">
              <h5 className="font-medium text-gray-900">Connection Issues?</h5>
              <ul className="mt-2 space-y-1 text-sm text-gray-600 list-disc list-inside">
                <li>Verify network connectivity</li>
                <li>Check firewall settings and open ports</li>
                <li>Restart network services</li>
                <li>Contact IT support if issue persists</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function BestPracticesContent() {
  const bestPractices = [
    {
      category: 'Claims Submission',
      icon: '📤',
      items: [
        'Submit claims within 24 hours of service',
        'Verify patient eligibility before submission',
        'Use the most specific diagnosis codes available',
        'Include all required documentation with initial submission',
        'Double-check NPI and tax ID numbers'
      ]
    },
    {
      category: 'Denial Prevention',
      icon: '🛡️',
      items: [
        'Review common denial reasons monthly',
        'Address front-end claim edits before submission',
        'Maintain updated provider credentials',
        'Track and analyze denial patterns',
        'Appeal all inappropriately denied claims'
      ]
    },
    {
      category: 'Documentation',
      icon: '📝',
      items: [
        'Document all patient interactions thoroughly',
        'Maintain detailed notes for complex cases',
        'Use standardized templates when possible',
        'Keep records of all claim submissions and responses',
        'Document all phone calls with payers'
      ]
    },
    {
      category: 'Compliance',
      icon: '⚖️',
      items: [
        'Stay current with HIPAA regulations',
        'Regularly review and update security protocols',
        'Conduct periodic compliance audits',
        'Ensure proper staff training on compliance',
        'Maintain documentation of all compliance activities'
      ]
    }
  ];

  const tips = [
    {
      title: 'Streamline Your Workflow',
      content: 'Use claim scrubbing software to catch errors before submission and save time on resubmissions.'
    },
    {
      title: 'Stay Organized',
      content: 'Create a systematic approach to tracking claims from submission to payment to avoid missing deadlines.'
    },
    {
      title: 'Leverage Technology',
      content: 'Utilize electronic remittance advice (ERA) for faster payment posting and reconciliation.'
    },
    {
      title: 'Regular Training',
      content: 'Conduct quarterly training sessions to keep staff updated on coding changes and best practices.'
    }
  ];

  return (
    <div className="space-y-8">
      <div className="bg-blue-50 p-6 rounded-lg border border-blue-100">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <CheckCircle className="h-6 w-6 text-blue-600" />
          </div>
          <div className="ml-3">
            <h4 className="text-lg font-semibold text-blue-800 mb-2">Proven Success Strategies</h4>
            <p className="text-blue-700">
              These best practices are compiled from industry standards and successful implementations 
              to help you optimize your claims management process.
            </p>
          </div>
        </div>
      </div>

      <div>
        <h4 className="text-xl font-semibold text-gray-900 mb-6">Best Practices by Category</h4>
        <div className="grid md:grid-cols-2 gap-6">
          {bestPractices.map((practice, index) => (
            <Card key={index} className="h-full">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{practice.icon}</span>
                  <h5 className="text-lg font-semibold text-gray-900">{practice.category}</h5>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {practice.items.map((item, i) => (
                    <li key={i} className="flex items-start">
                      <div className="h-1.5 w-1.5 rounded-full bg-blue-500 mt-2 mr-2 flex-shrink-0"></div>
                      <span className="text-gray-700">{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div>
        <h4 className="text-xl font-semibold text-gray-900 mb-6">Quick Tips for Success</h4>
        <div className="grid md:grid-cols-2 gap-6">
          {tips.map((tip, index) => (
            <div key={index} className="p-5 bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
              <h5 className="font-semibold text-gray-900 mb-2">{tip.title}</h5>
              <p className="text-gray-600">{tip.content}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-green-50 p-6 rounded-lg border border-green-200">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="ml-3">
            <h4 className="text-lg font-semibold text-green-800 mb-2">Did You Know?</h4>
            <p className="text-green-700">
              Implementing these best practices has helped similar practices reduce claim denials by up to 40% 
              and accelerate payment cycles by an average of 15 days.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
