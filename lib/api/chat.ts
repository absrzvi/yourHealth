/**
 * Chat API client for interacting with chat sessions and messages
 */

// Types for API requests and responses
export interface ChatSessionResponse {
  id: string;
  userId: string;
  title: string | null;
  createdAt: string;
  updatedAt: string;
  messages: ChatMessageResponse[];
}

export interface ChatMessageResponse {
  id: string;
  chatSessionId: string;
  role: string;
  content: string;
  llmProvider?: string;
  llmModel?: string;
  createdAt: string;
}

/**
 * Get all chat sessions for the current user
 */
export async function getChatSessions(): Promise<ChatSessionResponse[]> {
  const response = await fetch('/api/chat/sessions', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  
  if (!response.ok) {
    throw new Error(`Error fetching chat sessions: ${response.statusText}`);
  }
  
  return response.json();
}

/**
 * Get a single chat session by ID with its messages
 */
export async function getChatSession(sessionId: string): Promise<ChatSessionResponse> {
  const response = await fetch(`/api/chat/sessions/${sessionId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  
  if (!response.ok) {
    throw new Error(`Error fetching chat session: ${response.statusText}`);
  }
  
  return response.json();
}

/**
 * Create a new chat session
 */
export async function createChatSession(title?: string): Promise<ChatSessionResponse> {
  const response = await fetch('/api/chat/sessions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ title: title || 'New Chat' }),
  });
  
  if (!response.ok) {
    throw new Error(`Error creating chat session: ${response.statusText}`);
  }
  
  return response.json();
}

/**
 * Update a chat session title
 */
export async function updateChatSessionTitle(sessionId: string, title: string): Promise<ChatSessionResponse> {
  const response = await fetch(`/api/chat/sessions/${sessionId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ title }),
  });
  
  if (!response.ok) {
    throw new Error(`Error updating chat session: ${response.statusText}`);
  }
  
  return response.json();
}

/**
 * Delete a chat session and all its messages
 */
export async function deleteChatSession(sessionId: string): Promise<void> {
  const response = await fetch(`/api/chat/sessions/${sessionId}`, {
    method: 'DELETE',
  });
  
  if (!response.ok) {
    throw new Error(`Error deleting chat session: ${response.statusText}`);
  }
}
