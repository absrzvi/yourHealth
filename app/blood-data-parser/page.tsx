"use client";

import React, { useState } from 'react';
import { UploadCard } from '@/components/upload/UploadCard'; // Adjusted import path
import { ParserResult } from '@/lib/parsers'; // Assuming ParserResult is exported from here

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react'; // For a spinner icon

export default function BloodDataParserPage() {
  const [parsedResult, setParsedResult] = useState<ParserResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleUploadComplete = (result: ParserResult) => {
    console.log("Upload complete on page:", result);
    setParsedResult(result);
    setErrorMessage(null);
    setIsLoading(false);
  };

  const handleError = (error: string) => {
    console.error("Upload error on page:", error);
    setErrorMessage(error);
    setParsedResult(null);
    setIsLoading(false);
  };

  const handleUploadStart = () => {
    setIsLoading(true);
    setErrorMessage(null);
    setParsedResult(null);
  }

  return (
    <main className="container mx-auto py-8 px-4 min-h-screen bg-background text-foreground">
      <header className="mb-12 text-center">
        <h1 className="text-4xl font-bold font-heading tracking-tight lg:text-5xl">Comprehensive File Upload & Parser Test</h1>
        <p className="mt-2 text-lg text-muted-foreground">Test file upload functionality and parsing scenarios.</p>
      </header>

      <section className="max-w-2xl mx-auto mb-12">
        <UploadCard 
          onUploadComplete={handleUploadComplete} 
          onUploadError={handleError}
          onUploadStart={handleUploadStart}
        />
      </section>

      {isLoading && (
        <section className="mt-8 text-center">
          <div className="inline-flex items-center text-lg font-semibold text-primary">
            <Loader2 className="mr-2 h-6 w-6 animate-spin" />
            Processing file, please wait...
          </div>
        </section>
      )}

      {errorMessage && (
        <section className="mt-8 max-w-2xl mx-auto">
          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="text-destructive">Upload Error</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="whitespace-pre-wrap text-sm">{errorMessage}</pre>
            </CardContent>
          </Card>
        </section>
      )}

      {parsedResult && !isLoading && (
        <section className="mt-10 max-w-4xl mx-auto space-y-8">
          <h2 className="text-3xl font-bold font-heading text-center mb-6">Parsing Results</h2>
          
          {parsedResult.success && parsedResult.data ? (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="text-green-600">Upload Successful!</CardTitle>
                </CardHeader>
                <CardContent className="space-y-1 text-sm">
                  <p><strong>File Name:</strong> {(parsedResult.data.metadata as any)?.fileName || 'N/A'}</p>
                  <p><strong>Detected Report Type:</strong> {parsedResult.data.type || 'N/A'}</p>
                  <p><strong>Parser Used:</strong> {(parsedResult.data.metadata as any)?.parser || 'N/A'}</p>
                </CardContent>
              </Card>

              {parsedResult.data.type === 'BLOOD_TEST' && (parsedResult.data as any).biomarkers && (parsedResult.data as any).biomarkers.length > 0 ? (
                <Card>
                  <CardHeader>
                    <CardTitle>Biomarkers Extracted</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {(parsedResult.data as any).biomarkers.map((biomarker: any, index: number) => (
                        <li key={index} className="p-3 bg-muted/50 rounded-md flex justify-between items-center text-sm">
                          <div>
                            <span className="font-semibold text-foreground">{biomarker.name || biomarker.id || 'Unknown Biomarker'}: </span> 
                            <span className="text-muted-foreground">{biomarker.value} {biomarker.unit || ''}</span>
                            {biomarker.referenceRange && <span className="text-xs text-muted-foreground/80 ml-2"> (Ref: {biomarker.referenceRange})</span>}
                          </div>
                          {biomarker.flag && 
                            <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full 
                              ${biomarker.flag === 'High' ? 'bg-destructive/20 text-destructive' : 
                                biomarker.flag === 'Low' ? 'bg-yellow-400/20 text-yellow-600' : 
                                'bg-blue-500/20 text-blue-600'}`}>
                              {biomarker.flag}
                            </span>}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent>
                    <p className="text-muted-foreground">No specific biomarkers were extracted, or the parser does not itemize them.</p>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader>
                  <CardTitle>Full Parsed Data (JSON)</CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="bg-foreground/5 text-foreground p-4 rounded-md text-xs overflow-x-auto">
                    {JSON.stringify(parsedResult, null, 2)}
                  </pre>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card className="border-destructive">
              <CardHeader>
                <CardTitle className="text-destructive">Parsing Failed or No Data</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm">{parsedResult.error || 'An unknown error occurred during parsing.'}</p>
                <pre className="bg-destructive/10 text-destructive-foreground p-4 rounded-md text-xs overflow-x-auto mt-2">
                  {JSON.stringify(parsedResult, null, 2)}
                </pre>
              </CardContent>
            </Card>
          )}
        </section>
      )}
    </main>
  );
}
