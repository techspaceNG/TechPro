'use client';

import { useState, useRef, useEffect } from 'react';
import { 
  Sparkles, 
  X, 
  Send, 
  MessageSquare,
  ChevronDown,
  User,
  Cpu
} from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function ChatAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { 
      role: 'assistant', 
      content: "Hello! I am your TechPro Assistant. I can interact directly with your workspace. Try asking me:\n\n* *'Create a project called SmartApp'* \n* *'Add task Wireframe login to SmartApp'* \n* *'Save password SafePass123 for user admin on Github'* \n* *'Add a global note titled Configs'*"
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    setLoading(true);

    const updatedMessages: Message[] = [...messages, { role: 'user', content: userMessage }];
    setMessages(updatedMessages);

    try {
      const res = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // Send messages in format expected by Claude API
        body: JSON.stringify({ messages: updatedMessages }),
      });

      const data = await res.json();
      
      if (res.ok) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.content }]);
      } else {
        setMessages(prev => [
          ...prev, 
          { role: 'assistant', content: `Sorry, I ran into an error: ${data.error || 'Failed to complete action'}` }
        ]);
      }
    } catch (err) {
      setMessages(prev => [
        ...prev, 
        { role: 'assistant', content: "Sorry, I couldn't reach the AI assistant endpoint." }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans">
      {/* Closed Floating Bubble Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="w-14 h-14 rounded-full bg-brand-blue text-white flex items-center justify-center hover:bg-brand-blue-dark transition-all duration-300 shadow-strong hover:scale-105 secure-glow-pulse border border-brand-blue/30"
          aria-label="Open AI Assistant"
        >
          <Sparkles size={24} className="animate-pulse" />
        </button>
      )}

      {/* Chat Pane */}
      {isOpen && (
        <div className="bg-white border border-slate-200 rounded-xl shadow-xl w-80 sm:w-96 h-[480px] flex flex-col justify-between overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-300">
          {/* Header */}
          <div className="bg-slate-900 px-4 py-3 text-white flex items-center justify-between border-b border-slate-800">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-md bg-brand-blue flex items-center justify-center text-white font-bold text-sm">
                AI
              </div>
              <div className="text-left">
                <span className="font-bold text-xs block">TechPro Assistant</span>
                <span className="text-[9px] text-brand-blue font-semibold tracking-wider uppercase">Active Engine</span>
              </div>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-white p-1 transition-colors"
            >
              <ChevronDown size={20} />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-50/50">
            {messages.map((msg, index) => {
              const isAssistant = msg.role === 'assistant';
              return (
                <div 
                  key={index}
                  className={`flex gap-2.5 items-start ${isAssistant ? 'justify-start' : 'justify-end'}`}
                >
                  {isAssistant && (
                    <div className="w-6 h-6 rounded-full bg-brand-blue/10 border border-brand-blue/20 flex items-center justify-center text-brand-blue flex-shrink-0">
                      <Cpu size={12} />
                    </div>
                  )}

                  <div className={`
                    max-w-[75%] rounded-lg p-3 text-xs leading-relaxed text-left whitespace-pre-wrap
                    ${isAssistant 
                      ? 'bg-white border border-slate-200 text-slate-700 shadow-xs' 
                      : 'bg-brand-blue text-white shadow-glow'}
                  `}>
                    {msg.content}
                  </div>

                  {!isAssistant && (
                    <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 flex-shrink-0 text-[10px] font-bold">
                      U
                    </div>
                  )}
                </div>
              );
            })}

            {/* Typing indicator */}
            {loading && (
              <div className="flex gap-2.5 items-start justify-start">
                <div className="w-6 h-6 rounded-full bg-brand-blue/10 border border-brand-blue/20 flex items-center justify-center text-brand-blue flex-shrink-0 animate-spin">
                  <Cpu size={12} />
                </div>
                <div className="bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-xs text-slate-400 flex items-center gap-1.5 shadow-xs">
                  <span>Executing workspace action</span>
                  <span className="flex gap-0.5 mt-0.5">
                    <span className="w-1 h-1 bg-slate-400 rounded-full animate-bounce" />
                    <span className="w-1 h-1 bg-slate-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                    <span className="w-1 h-1 bg-slate-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                  </span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Footer */}
          <form 
            onSubmit={handleSend}
            className="p-3 border-t border-slate-100 bg-white flex gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask assistant to update project or vault..."
              disabled={loading}
              className="flex-grow rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:border-brand-blue focus:outline-hidden focus:ring-1 focus:ring-brand-blue transition-all"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="px-3 py-2 rounded-lg bg-brand-blue text-white hover:bg-brand-blue-dark transition-all shadow-glow disabled:opacity-50 flex items-center justify-center flex-shrink-0"
            >
              <Send size={14} />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
