"use client";

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface Correlation {
  id: string;
  variableA: string;
  variableB: string;
  coefficient: number;
  pValue: number;
  sampleSize: number;
  createdAt: string;
}

export default function CorrelationsPage() {
  const [correlations, setCorrelations] = useState<Correlation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCorrelations = async () => {
      try {
        const response = await fetch('/api/correlations');
        if (!response.ok) {
          throw new Error('Failed to fetch correlations');
        }
        const data = await response.json();
        setCorrelations(data.correlations || []);
      } catch (err) {
        console.error('Error fetching correlations:', err);
        setError('Failed to load correlation data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchCorrelations();
  }, []);

  const formatPValue = (pValue: number) => {
    if (pValue < 0.001) return '< 0.001';
    return pValue.toFixed(3);
  };

  const getCorrelationStrength = (coefficient: number) => {
    const absCoeff = Math.abs(coefficient);
    if (absCoeff >= 0.7) return 'Strong';
    if (absCoeff >= 0.3) return 'Moderate';
    return 'Weak';
  };

  const getCorrelationDirection = (coefficient: number) => {
    return coefficient > 0 ? 'Positive' : 'Negative';
  };

  return (
    <div className="content-section active max-w-6xl mx-auto px-4 py-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Health Data Correlations</h1>
        <p className="text-muted-foreground">
          Discover relationships between different health metrics in your data
        </p>
      </div>

      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          {error}
        </div>
      ) : correlations.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No Correlations Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Upload more health reports to discover correlations between your health metrics.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Top Correlations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Variables
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Correlation
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Strength
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        P-Value
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Samples
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {correlations.map((corr) => (
                      <tr key={corr.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {corr.variableA}
                          </div>
                          <div className="text-sm text-gray-500">
                            {corr.variableB}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            Math.abs(corr.coefficient) >= 0.7 
                              ? 'bg-green-100 text-green-800' 
                              : Math.abs(corr.coefficient) >= 0.3 
                                ? 'bg-yellow-100 text-yellow-800' 
                                : 'bg-blue-100 text-blue-800'
                          }`}>
                            {corr.coefficient.toFixed(3)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {getCorrelationStrength(corr.coefficient)} ({getCorrelationDirection(corr.coefficient)})
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatPValue(corr.pValue)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {corr.sampleSize}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Correlation Distribution</CardTitle>
              </CardHeader>
              <CardContent className="h-64 flex items-center justify-center">
                <p className="text-muted-foreground text-center">
                  Correlation distribution chart will appear here
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Top Correlations by Strength</CardTitle>
              </CardHeader>
              <CardContent className="h-64 flex items-center justify-center">
                <p className="text-muted-foreground text-center">
                  Top correlations chart will appear here
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
