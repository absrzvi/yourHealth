// No need for fetch-event-source since we're using native fetch with ReadableStream
import { 
  Message, 
  MessageStatus, 
  LLMProvider 
} from '@/types/chat.types';

type MessageUpdater = (prevMessages: Message[]) => Message[];
type ScrollToBottomFunction = () => void;

// Stream response data type
interface StreamData {
  content?: string;
  done?: boolean;
  source?: LLMProvider;
  error?: string;
}

/**
 * Handles sending a message to the chat API with streaming support
 * @param inputText The user's message text
 * @param currentSessionId The current chat session ID
 * @param setMessages Function to update messages state
 * @param setIsLoading Function to update loading state
 * @param setIsTyping Function to update typing state
 * @param abortController Reference to abort controller
 * @param aiMessageId Optional ID of the AI message to update
 */

export async function handleSendMessage(
  inputText: string,
  currentSessionId: string | undefined,
  setMessages: (updater: MessageUpdater) => void,
  setIsLoading: (loading: boolean) => void,
  setIsTyping: (typing: boolean) => void,
  abortController: AbortController,
  aiMessageId: string,
  scrollToBottom: ScrollToBottomFunction
) {
  if (!inputText.trim()) return;

  // Use the provided abort controller/signal or create a new one
  const controller = abortController;
  const signal = controller.signal;
  
  // Generate a message ID if not provided
  const messageId = aiMessageId;
  let fullContent = '';
  let currentSource: LLMProvider = 'pending' as const;
  let lastUpdateTime = 0;
  const updateInterval = 100; // Update UI at most every 100ms

  try {
    setIsLoading(true);
    setIsTyping(true);

    // Update the AI message to show it's processing
    setMessages(prev => prev.map(msg => 
      msg.id === messageId 
        ? { ...msg, status: 'streaming' as MessageStatus, llmProvider: 'pending' as LLMProvider }
        : msg
    ));

    // Make the API request with the abort controller's signal and credentials
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // This is required to include cookies in the request
      body: JSON.stringify({
        message: inputText,
        sessionId: currentSessionId,
      }),
      signal,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    // Handle streaming response
    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('Failed to read response stream');
    }

    const decoder = new TextDecoder();
    let buffer = '';
    let done = false;

    try {
      while (!done) {
        const { value, done: streamDone } = await reader.read();
        done = streamDone;

        if (value) {
          // Decode the chunk and add to buffer
          buffer += decoder.decode(value, { stream: true });
          
          // Process complete lines
          const lines = buffer.split('\n');
          buffer = lines.pop() || ''; // Keep incomplete line in buffer
          
          // Only update UI at most every updateInterval ms
          const now = Date.now();
          if (now - lastUpdateTime >= updateInterval || done) {
            lastUpdateTime = now;
            
            for (const line of lines) {
              if (!line.startsWith('data: ')) continue;
              
              try {
                const data: StreamData = JSON.parse(line.substring(6)); // Remove 'data: ' prefix
                
                // Update source if provided
                if (data.source) {
                  currentSource = data.source;
                }
                
                // Append content if provided
                if (data.content !== undefined) {
                  fullContent += data.content;
                  
                  setMessages(prev => prev.map(msg => 
                    msg.id === messageId 
                      ? { 
                          ...msg, 
                          content: fullContent,
                          llmProvider: currentSource,
                          status: 'streaming' as MessageStatus
                        } 
                      : msg
                  ));
                  
                  // Scroll to bottom if scrollToBottom function is defined
                  if (scrollToBottom) {
                    scrollToBottom();
                  }
                }
                
                // Handle completion
                if (data.done) {
                  setMessages(prev => prev.map(msg => 
                    msg.id === messageId 
                      ? { 
                          ...msg, 
                          status: 'delivered' as MessageStatus,
                          llmProvider: currentSource
                        } 
                      : msg
                  ));
                  setIsTyping(false);
                }
                
                // Handle error from server
                if (data.error) {
                  throw new Error(data.error);
                }
              } catch (error) {
                console.error('Error processing stream data:', error);
                console.error('Raw line:', line);
              }
            }
          }
        }
      }
      
      // Handle any remaining data in buffer
      if (buffer.trim()) {
        try {
          const data: StreamData = JSON.parse(buffer.trim());
          if (data.content) {
            fullContent += data.content;
            setMessages(prev => prev.map(msg => 
              msg.id === messageId 
                ? { ...msg, content: fullContent, status: 'delivered' as MessageStatus }
                : msg
            ));
          }
        } catch (error) {
          console.error('Error processing final buffer:', error);
        }
      }
      
      // Ensure message is marked as delivered
      setMessages(prev => prev.map(msg => 
        msg.id === messageId && msg.status === 'streaming'
          ? { ...msg, status: 'delivered' as MessageStatus }
          : msg
      ));
      
    } catch (error: unknown) {
      // Only update message if not aborted
      const isAbortError = error && 
                         typeof error === 'object' && 
                         'name' in error && 
                         (error as { name: unknown }).name === 'AbortError';
      
      if (!isAbortError) {
        console.error('Stream error:', error);
        
        setMessages(prev => prev.map(msg => {
          if (msg.id === messageId) {
            return {
              ...msg,
              status: 'error' as MessageStatus,
              content: fullContent || 'Sorry, I encountered an error. Please try again.',
              llmProvider: 'error' as LLMProvider
            };
          }
          return msg;
        }));
        
        setIsTyping(false);
        setIsLoading(false);
      }
    }
    
  } catch (error: any) {
    // Only handle non-abort errors
    if (error?.name !== 'AbortError') {
      console.error('Chat error:', error);
      
      setMessages(prev => prev.map(msg => {
        if (msg.id === messageId) {
          const errorMessage = error.message || 'Sorry, I encountered an error. Please try again.';
          return {
            ...msg,
            content: fullContent || errorMessage,
            status: 'error' as MessageStatus,
            llmProvider: 'error' as LLMProvider
          };
        }
        return msg;
      }));
    }
  } finally {
    setIsLoading(false);
    setIsTyping(false);
    
    // Ensure final scroll to bottom
    setTimeout(scrollToBottom, 100);
  }
}