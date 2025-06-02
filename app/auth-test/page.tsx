'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function AuthTestPage() {
  const { data: session, status, update } = useSession();
  const isAuthenticated = status === 'authenticated';
  const isSessionLoading = status === 'loading';
  const router = useRouter();
  const searchParams = useSearchParams();
  const [tokenInfo, setTokenInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        setIsLoading(true);
        console.log('Fetching session from /api/auth/session...');
        
        // Add cache-busting to prevent stale data
        const timestamp = new Date().getTime();
        const res = await fetch(`/api/auth/session?t=${timestamp}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          },
          credentials: 'same-origin' // Important for sending cookies
        });
        
        const data = await res.json();
        console.log('Session API response:', { status: res.status, data });
        
        if (res.ok) {
          setTokenInfo(data);
          setError(null);
        } else {
          setError(data.error || `Failed to fetch session (${res.status})`);
        }
      } catch (err) {
        console.error('Error fetching session:', err);
        setError(`Failed to fetch session: ${err instanceof Error ? err.message : String(err)}`);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
    
    // Also log the session from useSession
    console.log('useSession data:', { status, session });
  }, [status, session]);

  useEffect(() => {
    console.log('Auth Test Page - Status:', status);
    console.log('Auth Test Page - Session:', session);
    
    // Check for callback URL after login
    const callbackUrl = searchParams.get('callbackUrl');
    if (status === 'authenticated' && callbackUrl) {
      router.push(callbackUrl);
    }
  }, [status, session, searchParams, router]);

  const handleSignOut = async () => {
    try {
      await signOut({ redirect: false });
      router.push('/auth/login');
      router.refresh();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const refreshSession = async () => {
    try {
      await update();
      router.refresh();
    } catch (error) {
      console.error('Error refreshing session:', error);
    }
  };

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading session...</p>
        </div>
      </div>
    );
  }

  // Format the session data for better display
  const formatSessionData = (data: any) => {
    if (!data) return null;
    
    // Create a clean copy without circular references
    const cleanData = { ...data };
    
    // Format dates for better readability
    if (cleanData.expires) {
      cleanData.expires = new Date(cleanData.expires).toLocaleString();
    }
    
    // Format user data if it exists
    if (cleanData.user) {
      cleanData.user = {
        ...cleanData.user,
        // Add any specific user field formatting here
      };
    }
    
    return cleanData;
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Authentication Test</h1>
          <p className="mt-2 text-sm text-gray-600">
            Test and debug your authentication flow
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6 rounded-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700 font-medium">Error: {error}</p>
                <p className="mt-1 text-xs text-red-600">Check the browser console for more details.</p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-6">
          {/* Status Card */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h2 className="text-lg font-medium text-gray-900">Authentication Status</h2>
              <div className="mt-4">
                {isAuthenticated ? (
                  <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                    Authenticated
                  </div>
                ) : isSessionLoading ? (
                  <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                    Loading...
                  </div>
                ) : (
                  <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                    Not Authenticated
                  </div>
                )}
                {isAuthenticated && session?.user?.email && (
                  <p className="mt-2 text-sm text-gray-600">
                    Logged in as: <span className="font-medium">{session.user.email}</span>
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Session Information */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-medium text-gray-900">Session Information</h2>
                  <span className="text-xs text-gray-500">from useSession()</span>
                </div>
                <div className="mt-4 bg-gray-50 p-4 rounded-md overflow-auto max-h-96">
                  {session ? (
                    <pre className="text-xs">
                      {JSON.stringify(formatSessionData(session), null, 2)}
                    </pre>
                  ) : (
                    <p className="text-sm text-gray-500">No active session found</p>
                  )}
                </div>
              </div>
            </div>

            {/* Token Information */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-medium text-gray-900">Token Information</h2>
                  <span className="text-xs text-gray-500">from /api/auth/session</span>
                </div>
                <div className="mt-4 bg-gray-50 p-4 rounded-md overflow-auto max-h-96">
                  {tokenInfo ? (
                    <pre className="text-xs">
                      {JSON.stringify(formatSessionData(tokenInfo), null, 2)}
                    </pre>
                  ) : (
                    <p className="text-sm text-gray-500">No token information available</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-8 bg-white shadow overflow-hidden rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h2 className="text-lg font-medium text-gray-900">Actions</h2>
            <div className="mt-4 flex flex-wrap gap-4">
              <button
                onClick={refreshSession}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Refresh Session
              </button>
              <button
                onClick={() => window.location.reload()}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Reload Page
              </button>
              {status === 'authenticated' && (
                <button
                  onClick={handleSignOut}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 ml-auto"
                >
                  Sign Out
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Debug Info */}
        <div className="mt-8 p-4 bg-yellow-50 border-l-4 border-yellow-400">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">Debug Information</h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>Check your browser's developer console for detailed logs.</p>
                <p className="mt-1">Status: <span className="font-mono">{status}</span></p>
                <p className="mt-1">Session expires: <span className="font-mono">{session?.expires}</span></p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
