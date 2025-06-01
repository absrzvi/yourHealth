"use client";

import { signOut, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function LogoutButton() {
  const router = useRouter();
  const { data: session } = useSession(); // Get session to access user ID if needed

  const handleLogout = async () => {
    console.log('LogoutButton: Initiating logout...');

    // Get sessionId for the track-session call
    // This should ideally be the jti, but user.id can be a proxy if jti is not in client session
    const sessionId = session?.user?.id; 

    if (sessionId) {
      try {
        console.log('LogoutButton: Calling /api/auth/track-session to clear browser session cookie.');
        await fetch('/api/auth/track-session', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sessionId: sessionId, 
            rememberMe: true, // Signal to clear the browser-session cookie
          }),
        });
      } catch (error) {
        console.error('LogoutButton: Error calling /api/auth/track-session:', error);
        // Proceed with signOut even if track-session fails
      }
    }

    console.log('LogoutButton: Calling signOut...');
    await signOut({ callbackUrl: '/auth/login', redirect: true });
    // router.push('/auth/login'); // Fallback if redirect in signOut doesn't work as expected
  };

  return (
    <button
      onClick={handleLogout}
      className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50"
    >
      Logout
    </button>
  );
}
