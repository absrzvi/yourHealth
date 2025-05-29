"use client";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Activity, HeartPulse, Moon, Upload } from "lucide-react";

export default function AiCoachPage() {
  // Demo state for chat messages
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Hello! I'm Aria, your health companion. How can I help you understand your health data today?",
      sender: 'aria',
      timestamp: new Date(),
    },
  ]);
  const [message, setMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    const userMessage = {
      id: messages.length + 1,
      text: message,
      sender: 'user' as const,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);
    setMessage('');
    setIsTyping(true);
    setTimeout(() => {
      setMessages(prev => [
        ...prev,
        {
          id: messages.length + 2,
          text: `I'm analyzing your message: "${message}". This is a simulated response.`,
          sender: 'aria' as const,
          timestamp: new Date(),
        },
      ]);
      setIsTyping(false);
    }, 1000);
  };

  return (
    <div className="flex h-screen bg-bg-primary overflow-hidden">
      {/* Left: Aria Chat Interface (70%) */}
      <div className="w-full lg:w-7/10 flex flex-col border-r border-gray-200 bg-white">
        
        {/* Aria Header */}
        <div className="flex items-center gap-3 px-6 py-4 border-b bg-gradient-to-r from-[#4F46E5] to-[#06B6D4]">
          <div className="relative">
            <span className="block w-12 h-12 rounded-full bg-gradient-to-br from-[#4F46E5] to-[#06B6D4] shadow-lg animate-pulse" />
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 border-2 border-white rounded-full" />
          </div>
          <div>
            <div className="text-white font-bold text-lg">Aria</div>
            <div className="text-xs text-white/80">Your Personal Health Companion</div>
          </div>
        </div>
        
        {/* Main flex container for messages and input */}
        <div className="flex flex-col h-[calc(100%-68px)]">
          {/* Messages with auto overflow */}
          <div className="flex-grow overflow-y-auto p-4 space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} mb-4`}
              >
                <div
                  className={`max-w-3/4 rounded-2xl px-4 py-2 ${
                    msg.sender === 'user'
                      ? 'bg-blue-600 text-white rounded-tr-none'
                      : 'bg-gray-100 text-gray-800 rounded-tl-none'
                  }`}
                >
                  <p className="text-sm">{msg.text}</p>
                  {mounted && (
                    <p className="text-xs opacity-70 mt-1 text-right">
                      {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  )}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start mb-4">
                <div className="max-w-3/4 rounded-2xl px-4 py-2 bg-gray-100 text-gray-800 rounded-tl-none animate-pulse">
                  Aria is typing...
                </div>
              </div>
            )}
          </div>
          
          {/* Chat Input - Using flex layout rather than absolute positioning */}
          <div className="border-t border-gray-200 p-4 bg-white shadow-sm">
            <form className="flex gap-2" onSubmit={handleSendMessage}>
              <input
                type="text"
                className="flex-1 rounded-full border border-gray-200 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Ask Aria anything about your health data..."
                value={message}
                onChange={e => setMessage(e.target.value)}
                disabled={isTyping}
              />
              <Button type="submit" disabled={isTyping || !message.trim()}>Send</Button>
            </form>
          </div>
        </div>
      </div>

      {/* Right: Health Status Panel (30%) */}
      <div className="hidden lg:flex flex-col w-3/10 min-w-[350px] max-w-[420px] p-6 bg-bg-primary gap-6 h-full overflow-y-auto">
        {/* Health Metrics */}
        <div>
          <div className="font-semibold text-lg mb-3 text-primary-700">Health Status</div>
          <div className="flex flex-col gap-4">
            <Card className="flex items-center gap-4 p-4 bg-white shadow-sm border-l-4 border-[#F43F5E]">
              <HeartPulse className="text-[#F43F5E]" />
              <div>
                <div className="font-bold text-sm">Cardiovascular</div>
                <div className="text-xs text-gray-500">Excellent</div>
              </div>
            </Card>
            <Card className="flex items-center gap-4 p-4 bg-white shadow-sm border-l-4 border-[#10B981]">
              <Activity className="text-[#10B981]" />
              <div>
                <div className="font-bold text-sm">Metabolic</div>
                <div className="text-xs text-gray-500">Good</div>
              </div>
            </Card>
            <Card className="flex items-center gap-4 p-4 bg-white shadow-sm border-l-4 border-[#F59E0B]">
              <Moon className="text-[#F59E0B]" />
              <div>
                <div className="font-bold text-sm">Inflammation</div>
                <div className="text-xs text-gray-500">Low</div>
              </div>
            </Card>
          </div>
        </div>
        {/* Upload Drop Zone (placeholder) */}
        <Card className="mt-6 p-4 flex items-center gap-3 bg-white shadow-sm">
          <Upload className="text-primary-500" />
          <div>
            <div className="font-bold text-sm">Upload Health Report</div>
            <div className="text-xs text-gray-500">Drag & drop or click to upload</div>
          </div>
        </Card>
        {/* Recent Activity (placeholder) */}
        <Card className="mt-6 p-4 bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="text-primary-700 text-base">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-gray-500">No recent activity.</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
