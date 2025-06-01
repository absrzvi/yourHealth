'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface TestResult {
  error?: string;
  detectedType?: string;
  parsingResult?: any;
  fileName?: string;
}

interface ApiResponse {
  results: {
    bloodTest: TestResult;
    dna: TestResult;
    microbiome: TestResult;
  };
  timestamp: string;
  error?: string;
}

export default function TestParsersPage() {
  const [results, setResults] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runTests = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/test-parsers');
      const data: ApiResponse = await response.json();
      
      if (data.error) {
        setError(data.error);
      } else {
        setResults(data);
      }
    } catch (err) {
      setError(`Error running tests: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Parser Testing Dashboard</h1>
        <p className="text-gray-600 mb-4">
          Test OCR and structured data extraction functionality with sample data
        </p>
        
        <div className="flex gap-4 mb-8">
          <Link 
            href="/"
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors"
          >
            Back to Home
          </Link>
          <button
            onClick={runTests}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? 'Running Tests...' : 'Run Parser Tests'}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {results && (
        <div className="space-y-6">
          <div className="text-sm text-gray-500">
            Tests run at: {new Date(results.timestamp).toLocaleString()}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Object.entries(results.results).map(([type, result]) => (
              <div key={type} className="border rounded-lg overflow-hidden">
                <div className="bg-gray-100 px-4 py-3 border-b">
                  <h2 className="text-lg font-semibold capitalize">{type.replace(/([A-Z])/g, ' $1').trim()} Parser</h2>
                  {result.fileName && <p className="text-sm text-gray-600">File: {result.fileName}</p>}
                </div>
                
                <div className="p-4">
                  {result.error ? (
                    <div className="text-red-600">{result.error}</div>
                  ) : (
                    <>
                      <div className="mb-4">
                        <p className="text-sm font-medium">Detected Type:</p>
                        <p className="text-sm bg-blue-100 inline-block px-2 py-1 rounded">
                          {result.detectedType || 'None'}
                        </p>
                      </div>
                      
                      <div>
                        <p className="text-sm font-medium mb-2">Parsing Result:</p>
                        {result.parsingResult?.success === true ? (
                          <div className="bg-green-100 text-green-800 px-3 py-2 rounded mb-2">
                            Successfully parsed!
                          </div>
                        ) : (
                          <div className="bg-red-100 text-red-800 px-3 py-2 rounded mb-2">
                            Failed to parse: {result.parsingResult?.error || 'Unknown error'}
                          </div>
                        )}
                        
                        {result.parsingResult?.data && (
                          <div className="mt-4">
                            <p className="text-sm font-medium">Extracted Data:</p>
                            <pre className="bg-gray-50 p-3 rounded text-xs overflow-auto max-h-48">
                              {JSON.stringify(result.parsingResult.data, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
