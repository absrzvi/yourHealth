'use client';

import { useSession } from 'next-auth/react';
import SignOutButton from './SignOutButton';

export default function UserMenu() {
  const { data: session } = useSession();

  if (!session?.user) return null;

  return (
    <div className="flex items-center gap-4">
      <div className="text-right">
        <p className="font-medium">{session.user.name || session.user.email}</p>
        <p className="text-sm text-gray-500">User</p>
      </div>
      <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
        <span className="text-gray-600">
          {session.user.name?.[0]?.toUpperCase() || session.user.email?.[0]?.toUpperCase()}
        </span>
      </div>
      <SignOutButton />
    </div>
  );
}
