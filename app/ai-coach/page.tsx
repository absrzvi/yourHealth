'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import ChatWidget from '@/components/ai-coach/ChatWidget';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, MessageSquare, BarChart3, HeartPulse, Activity } from 'lucide-react';

type BiomarkerData = {
  sleep: number;
  nutrition: number;
  exercise: number;
  genetics: number;
  biome: number;
};

export default function AiCoachPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [biomarkerData, setBiomarkerData] = useState<BiomarkerData>({
    sleep: 0,
    nutrition: 0,
    exercise: 0,
    genetics: 0,
    biome: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
    } else if (status === 'authenticated') {
      // Simulate data loading
      const timer = setTimeout(() => {
        setBiomarkerData({
          sleep: 85,
          nutrition: 75,
          exercise: 90,
          genetics: 65,
          biome: 80,
        });
        setIsLoading(false);
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [status, router]);

  if (status === 'loading' || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
      </div>
    );
  }

  // Calculate overall health score (simple average for demo)
  const healthScore = Object.values(biomarkerData).reduce((a, b) => a + b, 0) / 5;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">AI Health Coach</h1>
          <div className="flex items-center space-x-4">
            <Button variant="outline" onClick={() => router.push('/dashboard')}>
              Back to Dashboard
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Welcome Section */}
        <section className="mb-12">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Welcome back, {session?.user?.name?.split(' ')[0] || 'User'}! 👋
            </h2>
            <p className="text-gray-600 mb-6">
              Your AI health coach is here to help you understand your health metrics and improve your well-being.
            </p>
            
            {/* Health Score Card */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Activity className="h-5 w-5 mr-2 text-blue-600" />
                  Your Health Score
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-4xl font-bold text-gray-900">
                      {Math.round(healthScore)}/100
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                      Updated just now
                    </div>
                  </div>
                  <div className="w-24 h-24 rounded-full border-8 border-blue-100 flex items-center justify-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {Math.round(healthScore)}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
              <Button className="flex flex-col items-center justify-center p-6 h-full">
                <HeartPulse className="h-8 w-8 mb-2 text-blue-600" />
                <span>View Health Report</span>
              </Button>
              <Button variant="outline" className="flex flex-col items-center justify-center p-6 h-full">
                <BarChart3 className="h-8 w-8 mb-2 text-blue-600" />
                <span>Track Progress</span>
              </Button>
              <Button variant="outline" className="flex flex-col items-center justify-center p-6 h-full">
                <MessageSquare className="h-8 w-8 mb-2 text-blue-600" />
                <span>Chat with Aria</span>
              </Button>
            </div>
          </div>
        </section>

        {/* Biomarker Overview */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Your Biomarkers</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Object.entries(biomarkerData).map(([key, value]) => (
              <Card key={key} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg capitalize">
                    {key}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div 
                      className={`h-2.5 rounded-full ${
                        value > 80 ? 'bg-green-500' : 
                        value > 60 ? 'bg-blue-500' : 
                        value > 40 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${value}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between mt-2 text-sm text-gray-600">
                    <span>0%</span>
                    <span className="font-medium">{value}%</span>
                    <span>100%</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </main>

      {/* Chat Widget */}
      <ChatWidget />
    </div>
  );
}
