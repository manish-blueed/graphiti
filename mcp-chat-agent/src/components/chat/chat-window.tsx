'use client';

import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { Message } from './message';
import { Send, Loader2 } from 'lucide-react';
import { useEffect, useRef, useState, useCallback } from 'react';
import { cn } from '@/lib/utils';

export function ChatWindow({ groupId }: { groupId: string }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [input, setInput] = useState('');
  const [isAtBottom, setIsAtBottom] = useState(true);

  // Create a transport that passes groupId in the body
  const transport = new DefaultChatTransport({
    api: '/api/chat',
    body: { groupId },
  });

  const { messages, sendMessage, status, setMessages } = useChat({
    id: groupId,
    transport,
    onError: (error) => {
      console.error('useChat Error:', error);
    },
  });

  const isLoading = status === 'streaming' || status === 'submitted';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    const text = input.trim();
    setInput('');
    try {
      await sendMessage({ text });
    } catch (err) {
      // Restore input on send failure so the user doesn't lose their message
      setInput(text);
      console.error('Failed to send message:', err);
    }
  };

  // Track whether the user is near the bottom
  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const threshold = 100;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    setIsAtBottom(distanceFromBottom < threshold);
  }, []);

  // Auto-scroll to bottom only when the user is already near the bottom
  useEffect(() => {
    const el = scrollRef.current;
    if (el && isAtBottom) {
      el.scrollTop = el.scrollHeight;
    }
  }, [messages, isAtBottom]);

  return (
    <div className="flex flex-col h-full bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden shadow-2xl">
      {/* Header */}
      <div className="px-6 py-4 border-b border-zinc-800 bg-zinc-900/50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
          <h2 className="font-semibold text-zinc-100">MCP Chat Agent</h2>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setMessages([])}
            className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            Clear Chat
          </button>
          <div className="text-xs text-zinc-500">
            Group: <span className="text-blue-400 font-mono">{groupId}</span>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-6 space-y-2 scrollbar-thin scrollbar-thumb-zinc-800"
      >
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-zinc-500 space-y-4">
            <BotIcon className="w-12 h-12 text-zinc-800" />
            <p className="text-center max-w-xs">
              Welcome! I have access to your Graphiti knowledge graph. Ask me anything or upload documents to get started.
            </p>
          </div>
        ) : (
          messages.map((m) => <Message key={m.id} message={m} />)
        )}
        {isLoading && (
          <div className="flex items-center gap-2 text-zinc-500 text-xs italic ml-2">
            <Loader2 size={12} className="animate-spin" />
            Assistant is thinking...
          </div>
        )}
      </div>

      {/* Input */}
      <form
        onSubmit={handleSubmit}
        className="p-4 bg-zinc-900/50 border-t border-zinc-800"
      >
        <div className="relative flex items-center">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask your knowledge base..."
            className={cn(
              "w-full bg-zinc-800 text-zinc-100 pl-4 pr-12 py-3 rounded-xl border border-zinc-700",
              "focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500",
              "placeholder:text-zinc-500 transition-all"
            )}
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className={cn(
              "absolute right-2 p-2 rounded-lg transition-all",
              input.trim() && !isLoading
                ? "bg-blue-600 text-white hover:bg-blue-500"
                : "bg-zinc-700 text-zinc-500 cursor-not-allowed"
            )}
          >
            {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
          </button>
        </div>
      </form>
    </div>
  );
}

function BotIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M12 8V4H8" />
      <rect width="16" height="12" x="4" y="8" rx="2" />
      <path d="M2 14h2" />
      <path d="M20 14h2" />
      <path d="M15 13v2" />
      <path d="M9 13v2" />
    </svg>
  );
}
