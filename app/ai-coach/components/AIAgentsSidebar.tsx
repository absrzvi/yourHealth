'use client';

import React from 'react';
import { useAICoachStore } from '@/stores/aiCoachStore';
import { cn } from '@/lib/utils';

export default function AIAgentsSidebar() {
  const { agents, activeAgentId, setActiveAgent } = useAICoachStore();

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <h3 className="text-sm font-medium">Available Agents</h3>
        <p className="text-xs text-muted-foreground">
          Select an AI agent to chat with
        </p>
      </div>
      
      <div className="space-y-2">
        {Object.values(agents).map((agent) => (
          <button
            key={agent.id}
            onClick={() => setActiveAgent(agent.id)}
            className={cn(
              'w-full flex items-center p-3 rounded-lg transition-colors',
              'text-left border',
              activeAgentId === agent.id
                ? 'bg-accent border-primary'
                : 'border-transparent hover:bg-accent/50',
            )}
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <div
                  className={cn(
                    'h-2 w-2 rounded-full',
                    agent.isAvailable ? 'bg-green-500' : 'bg-gray-400',
                  )}
                />
                <p className="font-medium truncate">{agent.name}</p>
              </div>
              <p className="text-xs text-muted-foreground truncate">
                {agent.role}
              </p>
            </div>
          </button>
        ))}
      </div>
      
      <div className="pt-4 border-t">
        <div className="flex items-center gap-2 text-sm">
          <div className="h-2 w-2 rounded-full bg-green-500" />
          <span className="text-muted-foreground">Available</span>
        </div>
        <div className="flex items-center gap-2 text-sm mt-1">
          <div className="h-2 w-2 rounded-full bg-gray-400" />
          <span className="text-muted-foreground">Busy</span>
        </div>
      </div>
    </div>
  );
}
