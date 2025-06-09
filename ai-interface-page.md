AI Coach Page Redesign Implementation Plan
Tech Stack Recommendation
For simplicity and speed, I recommend using:

shadcn/ui components (already in your project)
Tailwind CSS for styling
Zustand for state management (already in use)
react-icons for additional icons if needed

Windsurf Implementation Instructions
markdown# AI Coach Page Complete Redesign

## Overview
Redesign the AI Coach page to create a dedicated chat interface with left sidebar for history, right sidebar for AI agents, and main chat area in the center.

## Pre-Implementation Checklist
- [ ] Backup current AI Coach page
- [ ] Ensure shadcn/ui components are installed
- [ ] Verify Zustand store is accessible
- [ ] Check that file upload functionality exists

## Implementation Steps

### STEP 1: Move AI Active Indicator to Global Header
**File:** `components/Header.tsx` or `components/Navigation.tsx`

**Task:** Move the AI Active indicator to the header's left corner
**Requirements:**
- Import the AI Active component
- Position it in the header's left side, before the logo
- Ensure it's visible on all pages
- Maintain the same functionality (toggle between local/OpenAI)

**Validation:**
- [ ] AI Active indicator appears in header on all pages
- [ ] Toggle functionality works correctly
- [ ] Responsive on mobile devices

### STEP 2: Create Left Sidebar - Chat History
**File:** `app/ai-coach/components/ChatHistorySidebar.tsx`

**Create new component with:**
```typescript
interface ChatHistoryItem {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: Date;
  aiType: 'local' | 'openai';
}
Requirements:

Fixed width sidebar (250px desktop, collapsible on mobile)
"CHAT HISTORY" header
List of clickable chat previews
Each preview shows:

Chat title (first message truncated)
Last message preview
Timestamp
AI type indicator


Scrollable if history exceeds viewport
Add hover states and active chat highlighting

Validation:

 Sidebar displays chat history
 Clicking a chat loads it in main area
 Responsive collapse on mobile
 Smooth scrolling for long lists

STEP 3: Create Right Sidebar - AI Agents
File: app/ai-coach/components/AIAgentsSidebar.tsx
Requirements:

Fixed width sidebar (280px desktop, collapsible on mobile)
"AI AGENTS" header
List of available AI agents:

Diagnostic AI Agent (currently implemented)
Future agents (grayed out if not available)


Each agent card shows:

Agent name
Description
Status indicator (online/offline)
Specialization tags


Click to switch active agent

Validation:

 All available agents displayed
 Click switches active agent
 Visual feedback for active agent
 Unavailable agents are clearly marked

STEP 4: Redesign Main Chat Area
File: app/ai-coach/components/ChatInterface.tsx
Requirements:

Full height container (viewport minus header and input area)
Messages display with:

User messages (right aligned)
AI messages (left aligned)
AI source validator under each AI message:
jsx<div className="text-xs text-gray-500 mt-1">
  {message.source === 'local' ? '🟢 Local LLM' : '🔵 OpenAI'}
</div>



Auto-scroll to bottom on new messages
Loading indicators for AI responses
Empty state with welcome message

Validation:

 Messages display correctly
 Source validators show for each AI message
 Smooth scrolling behavior
 Loading states work properly

STEP 5: Create Bottom Input Area
File: app/ai-coach/components/ChatInput.tsx
Requirements:

Fixed bottom position
Full width minus sidebars
Components:

File upload button (left side)
Text input area (center, expandable)
Send button (right side)


File upload shows selected files
Support for multiple file types (PDF, images, etc.)
Enter to send, Shift+Enter for new line

Validation:

 File upload works correctly
 Text input expands with content
 Keyboard shortcuts work
 Visual feedback for file uploads

STEP 6: Remove Floating Chatbox
File: app/ai-coach/page.tsx
Requirements:

Remove the blue floating chatbox component from AI Coach page only
Ensure it remains on all other pages
Update any conditional rendering logic

Validation:

 No floating chatbox on AI Coach page
 Chatbox still appears on other pages
 No console errors

STEP 7: Layout Integration
File: app/ai-coach/page.tsx
Complete layout structure:
jsx<div className="flex h-[calc(100vh-64px)]"> {/* Assuming 64px header */}
  <ChatHistorySidebar />
  <main className="flex-1 flex flex-col">
    <ChatInterface />
    <ChatInput />
  </main>
  <AIAgentsSidebar />
</div>
Validation:

 Layout is responsive
 No overflow issues
 Sidebars collapse on mobile
 Smooth transitions

State Management Updates
File: stores/aiCoachStore.ts (or similar)
Required state:
typescriptinterface AICoachState {
  currentChatId: string | null;
  chatHistory: ChatHistoryItem[];
  activeAgent: string;
  messages: Message[];
  isLoading: boolean;
  // ... other existing state
}
Testing Checkpoints
Checkpoint 1: Component Integration

 All components render without errors
 No TypeScript errors
 No console warnings

Checkpoint 2: Functionality Testing

 Can switch between AI agents
 Can load previous chats
 Can send messages
 Can upload files
 AI responses show correct source

Checkpoint 3: Responsive Design

 Desktop layout (>1024px) shows all sidebars
 Tablet layout (768px-1024px) shows one sidebar at a time
 Mobile layout (<768px) hides sidebars with toggle buttons

Checkpoint 4: Performance

 No lag when switching chats
 Smooth scrolling in chat history
 File uploads don't block UI
 Messages render efficiently

Error Handling

Add try-catch blocks for all async operations
Show user-friendly error messages
Implement retry logic for failed AI requests
Handle file upload errors gracefully

Accessibility Requirements

 Keyboard navigation works throughout
 Screen reader friendly labels
 Focus management when switching views
 Proper ARIA labels for interactive elements

Post-Implementation

 Remove old AI Coach components
 Update any imports/references
 Test all AI agent integrations
 Update documentation


### Quick Start Component Templates

Here are the component templates to get you started:

**ChatHistorySidebar.tsx:**
```tsx
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

export function ChatHistorySidebar() {
  return (
    <aside className="w-[250px] border-r bg-gray-50 dark:bg-gray-900 flex flex-col">
      <div className="p-4 border-b">
        <h2 className="font-semibold text-lg">CHAT HISTORY</h2>
      </div>
      <ScrollArea className="flex-1">
        {/* Chat history items */}
      </ScrollArea>
    </aside>
  );
}
AIAgentsSidebar.tsx:
tsximport { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function AIAgentsSidebar() {
  return (
    <aside className="w-[280px] border-l bg-gray-50 dark:bg-gray-900 flex flex-col">
      <div className="p-4 border-b">
        <h2 className="font-semibold text-lg">AI AGENTS</h2>
      </div>
      <ScrollArea className="flex-1 p-4">
        {/* AI agent cards */}
      </ScrollArea>
    </aside>
  );
}
This implementation plan provides a clear, step-by-step approach that Windsurf can follow to completely redesign your AI Coach page. The modular structure makes it easy to implement and test each component independently before integrating them together.