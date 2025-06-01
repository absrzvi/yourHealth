import React from 'react';

interface AIWelcomeProps {
  userName: string | null | undefined;
}

export function AIWelcome({ userName }: AIWelcomeProps) {
  const displayName = userName || "User";

  return (
    <section className="p-8 bg-gradient-to-br from-primary to-primary-dark rounded-xl shadow-2xl text-white mb-8">
      <h2 className="text-3xl font-bold mb-3 font-montserrat">Welcome Back, {displayName}!</h2>
      <p className="text-lg opacity-90 mb-4">
        Your AI health assistant, Aria, has new insights for you today.
      </p>
      <button className="px-6 py-3 bg-secondary hover:bg-secondary-dark rounded-full font-semibold text-lg transition-all transform hover:scale-105">
        View Insights
      </button>
    </section>
  );
};
