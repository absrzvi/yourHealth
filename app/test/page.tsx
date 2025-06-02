'use client';

import { useEffect, useState } from 'react';

export default function TestPage() {
  const [fileExists, setFileExists] = useState<boolean | null>(null);
  const [fileSize, setFileSize] = useState<number | null>(null);

  useEffect(() => {
    // Test if the file exists by making a HEAD request
    fetch('/DNA.glb', { method: 'HEAD' })
      .then(res => {
        setFileExists(res.ok);
        const contentLength = res.headers.get('content-length');
        if (contentLength) {
          setFileSize(parseInt(contentLength));
        }
      })
      .catch(() => setFileExists(false));
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
        <h1 className="text-2xl font-bold mb-4">DNA.glb File Test</h1>
        {fileExists === null ? (
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <span>Checking file...</span>
          </div>
        ) : fileExists ? (
          <div className="space-y-2">
            <div className="text-green-600 flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              DNA.glb file is accessible at <code className="ml-1 bg-gray-100 px-2 py-1 rounded">/DNA.glb</code>
            </div>
            {fileSize && (
              <div className="text-gray-700">
                File size: {(fileSize / 1024 / 1024).toFixed(2)} MB
              </div>
            )}
            <div className="mt-4 p-3 bg-blue-50 text-blue-800 rounded-md">
              <p className="font-medium">Next steps:</p>
              <ol className="list-decimal list-inside mt-1 space-y-1">
                <li>Check the browser's developer console (F12) for any errors</li>
                <li>Verify the model loads in the <a href="/demo-home" className="text-blue-600 hover:underline">demo page</a></li>
              </ol>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-red-600 flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              DNA.glb file not found at <code className="ml-1 bg-gray-100 px-2 py-1 rounded">/public/DNA.glb</code>
            </div>
            <div className="mt-2 p-3 bg-yellow-50 text-yellow-800 rounded-md">
              <p className="font-medium">Troubleshooting steps:</p>
              <ol className="list-decimal list-inside mt-1 space-y-1">
                <li>Verify the file exists in the <code className="bg-gray-100 px-1 py-0.5 rounded">public</code> folder</li>
                <li>Check the filename case (should be exactly <code className="bg-gray-100 px-1 py-0.5 rounded">DNA.glb</code>)</li>
                <li>Try restarting the Next.js development server</li>
                <li>Clear your browser cache</li>
              </ol>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
