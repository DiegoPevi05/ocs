import { useState, useRef, useEffect, useCallback } from 'react';
import { MessageCircle, X, Send, Bot, User, Loader2, Sparkles, AlertTriangle } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'error';
  content: string;
  ts: Date;
}

interface AiChatBubbleProps {
  locationId: string;
  /** Called when the AI modifies sceneData so the editor can reload the scene */
  onSceneUpdated: (updatedSceneData: string) => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const BASE = `${import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080'}/api`;

async function sendChatMessage(
  locationId: string,
  message: string
): Promise<{ message: string; updatedSceneData: string | null }> {
  const res = await fetch(`${BASE}/locations/${locationId}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: `API Error ${res.status}` }));
    throw new Error(err.message ?? `Error ${res.status}`);
  }
  return res.json();
}

function uid() {
  return Math.random().toString(36).slice(2);
}

function formatTime(d: Date) {
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// ─── Suggestion chips ─────────────────────────────────────────────────────────

const SUGGESTIONS = [
  'Add a pole at x=0 z=50 with 1 cantilever',
  'Create a cantilever from the first pole to the track',
  'Add a vane between cantilever 0 and 1',
  'What are the OCS design rules for span length?',
];

// ─── Component ────────────────────────────────────────────────────────────────

export function AiChatBubble({ locationId, onSceneUpdated }: AiChatBubbleProps) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: uid(),
      role: 'assistant',
      content: '👋 Hi! I am your OCS design assistant. I can help you create tracks, foundations, poles, cantilevers, and vanes. What would you like to build?',
      ts: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open]);

  // Focus input when opening
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 80);
  }, [open]);

  const handleSend = useCallback(async (text?: string) => {
    const content = (text ?? input).trim();
    if (!content || loading) return;

    const userMsg: ChatMessage = { id: uid(), role: 'user', content, ts: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const result = await sendChatMessage(locationId, content);

      const assistantMsg: ChatMessage = {
        id: uid(),
        role: 'assistant',
        content: result.message,
        ts: new Date(),
      };
      setMessages(prev => [...prev, assistantMsg]);

      // If the AI updated the scene, notify the parent editor
      if (result.updatedSceneData) {
        onSceneUpdated(result.updatedSceneData);
      }
    } catch (err: any) {
      const errMsg: ChatMessage = {
        id: uid(),
        role: 'error',
        content: err.message ?? 'An unexpected error occurred.',
        ts: new Date(),
      };
      setMessages(prev => [...prev, errMsg]);
    } finally {
      setLoading(false);
    }
  }, [input, loading, locationId, onSceneUpdated]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const showSuggestions = messages.length === 1; // only after the welcome message

  return (
    <>
      {/* ── Floating bubble trigger ── */}
      <button
        className="ai-bubble-trigger"
        onClick={() => setOpen(o => !o)}
        title="AI Design Assistant"
        aria-label="Open AI Design Assistant"
      >
        {open ? <X size={22} /> : <Sparkles size={22} />}
        {!open && <span className="ai-bubble-badge" />}
      </button>

      {/* ── Chat panel ── */}
      {open && (
        <div className="ai-chat-panel">
          {/* Header */}
          <div className="ai-chat-header">
            <div className="ai-chat-header__info">
              <div className="ai-chat-avatar ai-chat-avatar--bot">
                <Bot size={16} />
              </div>
              <div>
                <div className="ai-chat-header__title">OCS Assistant</div>
                <div className="ai-chat-header__sub">Powered by DeepSeek AI</div>
              </div>
            </div>
            <button className="ai-chat-close" onClick={() => setOpen(false)} aria-label="Close">
              <X size={16} />
            </button>
          </div>

          {/* Messages */}
          <div className="ai-chat-messages">
            {messages.map(msg => (
              <div key={msg.id} className={`ai-chat-msg ai-chat-msg--${msg.role}`}>
                <div className="ai-chat-msg__avatar">
                  {msg.role === 'user'
                    ? <User size={13} />
                    : msg.role === 'error'
                    ? <AlertTriangle size={13} />
                    : <Bot size={13} />}
                </div>
                <div className="ai-chat-msg__body">
                  <p className="ai-chat-msg__text">{msg.content}</p>
                  <span className="ai-chat-msg__time">{formatTime(msg.ts)}</span>
                </div>
              </div>
            ))}

            {/* Loading indicator */}
            {loading && (
              <div className="ai-chat-msg ai-chat-msg--assistant">
                <div className="ai-chat-msg__avatar"><Bot size={13} /></div>
                <div className="ai-chat-msg__body ai-chat-typing">
                  <span /><span /><span />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Suggestion chips */}
          {showSuggestions && (
            <div className="ai-chat-suggestions">
              {SUGGESTIONS.map(s => (
                <button key={s} className="ai-chat-chip" onClick={() => handleSend(s)}>
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Input area */}
          <div className="ai-chat-input-row">
            <textarea
              ref={inputRef}
              className="ai-chat-input"
              rows={1}
              placeholder="Ask me to design something…"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={loading}
            />
            <button
              className="ai-chat-send"
              onClick={() => handleSend()}
              disabled={!input.trim() || loading}
              aria-label="Send"
            >
              {loading ? <Loader2 size={18} className="ai-spin" /> : <Send size={18} />}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
