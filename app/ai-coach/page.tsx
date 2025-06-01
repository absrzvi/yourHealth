"use client";
import { useEffect, useState, useRef } from 'react';
import styles from './aiCoach.module.css';
import dynamic from 'next/dynamic';
import ChatInterface from '@/components/ai-coach/ChatInterface'; // Adjust path if needed

export default function AiCoachPage() {
  const [isChatPanelOpen, setIsChatPanelOpen] = useState(true); // Default to open for now
  
  // Debug: Log when component mounts
  useEffect(() => {
    console.log('AI Coach page mounted');
    return () => console.log('AI Coach page unmounted');
  }, []);
  
  // Debug: Log when chat panel state changes
  useEffect(() => {
    console.log('Chat panel is now:', isChatPanelOpen ? 'open' : 'closed');
  }, [isChatPanelOpen]);

  return (
    <div className={styles.aiCoachContainer}>
      {/* Header, Main, and Timeline Sidebar removed */}
      {/* The ChatInterface is now the primary content. 
          Its open/close mechanism might need adjustment 
          as the original hover trigger (styles.timeline) is gone. */}
      <ChatInterface 
        isOpen={isChatPanelOpen} 
        // onMouseEnter={openChatPanel} // Original trigger was the timeline sidebar
        // onMouseLeave={closeChatPanelWithDelay} // Original trigger was the timeline sidebar
        // TODO: Decide on a new trigger for opening/closing the chat panel or make it always open.
        // For now, let's make it always open for simplicity until a new trigger is decided.
        // You can control this by setting isChatPanelOpen to true by default or via a button.
      />
    </div>
  );
}
