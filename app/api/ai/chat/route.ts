import { NextRequest, NextResponse } from 'next/server';
import { HybridLLMService } from '@/lib/ai-coach/server/llm/hybrid-llm-service';
import { CPUMedicalLLM } from '@/lib/ai-coach/server/llm/cpu-medical-llm';
import { OpenAIFallbackLLM } from '@/lib/ai-coach/server/llm/openai-fallback-llm';

// Initialize the local CPU LLM service with model preferences [SF, REH]
// We'll use a model name that suggests it should try Ollama
const cpuLLM = new CPUMedicalLLM('ollama-llama3.2');

// Initialize the fallback LLM (OpenAI)
const fallbackLLM = new OpenAIFallbackLLM();

// Create the hybrid service that will try local first, then fallback
const llmService = new HybridLLMService(cpuLLM, fallbackLLM, {
  useFallback: true,
  timeoutMs: 15000, // 15 seconds timeout for local model
  fallbackThreshold: 0.5 // Lower threshold to make fallback more likely if quality is questionable
});

export async function POST(req: NextRequest) {
  try {
    const { message } = await req.json();
    
    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // For streaming responses, we'll start a stream [PA]
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        // Track controller state across both try and catch blocks
        let isControllerClosed = false;
        
        try {
          let fullResponse = '';
          
          // Define the expected shape of chunks
          interface LLMChunk {
            text?: string;
            isComplete?: boolean;
            error?: string;
            provider?: 'ollama' | 'openai' | 'pending' | 'error';
          }
          
          // Create a handler function for streaming chunks
          const onChunk = (chunk: LLMChunk | null | undefined) => {
            if (isControllerClosed) return; // Skip if controller already closed
            
            try {
              // Check if chunk is null/undefined
              if (!chunk) {
                console.warn('Received null/undefined chunk');
                return; // Skip this chunk
              }
              
              // Handle text chunks safely, providing a default empty string
              const chunkText = chunk.text || '';
              if (chunkText) {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
                  text: chunkText, 
                  isComplete: false,
                  provider: chunk.provider || 'unknown'
                })}\n\n`));
                fullResponse += chunkText;
              }
              
              // Handle errors in chunks
              if (chunk.error) {
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify({ error: chunk.error, isComplete: false })}\n\n`)
                );
              }
              
              // Handle completion (only do this once)
              if (chunk.isComplete) {
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify({ 
                    isComplete: true,
                    fullText: fullResponse,
                    provider: chunk.provider || 'unknown'
                  })}\n\n`)
                );
                
                isControllerClosed = true;
                controller.close();
              }
            } catch (chunkError) {
              console.error('Error processing chunk:', chunkError);
              if (!isControllerClosed) {
                try {
                  controller.enqueue(
                    encoder.encode(`data: ${JSON.stringify({ 
                      error: 'Error processing response chunk',
                      isComplete: true 
                    })}\n\n`)
                  );
                  
                  isControllerClosed = true;
                  controller.close();
                } catch (e) {
                  // Already closed, just log
                  console.error('Controller already closed:', e);
                }
              }
            }
          };
          
          // Start the stream using the LLM service
          const streamGenerator = llmService.stream(message, {}, onChunk);
          
          // Process the generator without needing to use the chunk values
          // The onChunk callback is already processing each chunk as it arrives
          await (async () => {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            for await (const _chunk of streamGenerator) {
              // All processing already handled by onChunk callback
            }
          })();
        } catch (error) {
          if (!isControllerClosed) {
            try {
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ 
                  error: error instanceof Error ? error.message : 'An unknown error occurred',
                  isComplete: true,
                  provider: 'error'
                })}\n\n`)
              );
              
              isControllerClosed = true;
              controller.close();
            } catch (closeError) {
              console.error('Error while sending error response:', closeError);
              // Controller might already be closed, we've done our best to handle it
            }
          }
        }
      }
    });
    
    return new NextResponse(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      }
    });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Failed to process message', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
