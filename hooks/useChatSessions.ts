import { useState, useCallback, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { 
  getChatSessions, 
  getChatSession, 
  createChatSession, 
  updateChatSessionTitle, 
  deleteChatSession,
  ChatSessionResponse
} from '@/lib/api/chat';

export function useChatSessions() {
  const { data: authSession, status } = useSession();
  const [sessions, setSessions] = useState<ChatSessionResponse[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [currentSession, setCurrentSession] = useState<ChatSessionResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch all chat sessions for the user
  const fetchSessions = useCallback(async () => {
    if (status !== 'authenticated') return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const fetchedSessions = await getChatSessions();
      setSessions(fetchedSessions);
      
      // If we have sessions but no current one selected, select the most recent
      if (fetchedSessions.length > 0 && !currentSessionId) {
        setCurrentSessionId(fetchedSessions[0].id);
      }
    } catch (err) {
      console.error('Error fetching chat sessions:', err);
      setError('Failed to load chat sessions. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [status, currentSessionId]);

  // Fetch a single chat session by ID
  const fetchSession = useCallback(async (sessionId: string) => {
    if (!sessionId || status !== 'authenticated') return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const fetchedSession = await getChatSession(sessionId);
      setCurrentSession(fetchedSession);
      return fetchedSession;
    } catch (err) {
      console.error(`Error fetching chat session ${sessionId}:`, err);
      setError('Failed to load chat session. Please try again.');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [status]);

  // Create a new chat session
  const createSession = useCallback(async (title?: string) => {
    if (status !== 'authenticated') return null;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const newSession = await createChatSession(title);
      setSessions(prev => [newSession, ...prev]);
      setCurrentSessionId(newSession.id);
      setCurrentSession(newSession);
      return newSession;
    } catch (err) {
      console.error('Error creating chat session:', err);
      setError('Failed to create new chat session. Please try again.');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [status]);

  // Update a chat session title
  const updateSessionTitle = useCallback(async (sessionId: string, title: string) => {
    if (!sessionId || status !== 'authenticated') return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const updatedSession = await updateChatSessionTitle(sessionId, title);
      
      // Update the sessions list
      setSessions(prev => 
        prev.map(session => 
          session.id === sessionId 
            ? { ...session, title: updatedSession.title } 
            : session
        )
      );
      
      // Update current session if it's the one being renamed
      if (currentSessionId === sessionId && currentSession) {
        setCurrentSession({ ...currentSession, title: updatedSession.title });
      }
      
      return updatedSession;
    } catch (err) {
      console.error(`Error updating chat session ${sessionId}:`, err);
      setError('Failed to update chat session. Please try again.');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [status, currentSessionId, currentSession]);

  // Delete a chat session
  const deleteSession = useCallback(async (sessionId: string) => {
    if (!sessionId || status !== 'authenticated') return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      await deleteChatSession(sessionId);
      
      // Remove the session from the list
      const updatedSessions = sessions.filter(session => session.id !== sessionId);
      setSessions(updatedSessions);
      
      // If we deleted the current session, select a new one
      if (currentSessionId === sessionId) {
        if (updatedSessions.length > 0) {
          setCurrentSessionId(updatedSessions[0].id);
          await fetchSession(updatedSessions[0].id);
        } else {
          setCurrentSessionId(null);
          setCurrentSession(null);
        }
      }
      
      return true;
    } catch (err) {
      console.error(`Error deleting chat session ${sessionId}:`, err);
      setError('Failed to delete chat session. Please try again.');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [status, sessions, currentSessionId, fetchSession]);

  // Change the current session
  const switchSession = useCallback(async (sessionId: string) => {
    setCurrentSessionId(sessionId);
    return await fetchSession(sessionId);
  }, [fetchSession]);

  // Load sessions on initial mount and when auth status changes
  useEffect(() => {
    if (status === 'authenticated') {
      fetchSessions();
    }
  }, [status, fetchSessions]);

  // Load the current session when currentSessionId changes
  useEffect(() => {
    if (currentSessionId) {
      fetchSession(currentSessionId);
    }
  }, [currentSessionId, fetchSession]);

  return {
    sessions,
    currentSessionId,
    currentSession,
    isLoading,
    error,
    fetchSessions,
    fetchSession,
    createSession,
    updateSessionTitle,
    deleteSession,
    switchSession,
  };
}
