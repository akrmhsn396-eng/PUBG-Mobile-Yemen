import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MessageSquare, Send, ChevronDown, ChevronUp, Radio, Users, ShieldAlert } from 'lucide-react';
import { soundManager } from '../audio/SoundManager';

export interface ChatMessage {
  id: string;
  sender: string;
  text: string;
  time: number;
  badge?: string;
  color?: string;
  isQuickRadio?: boolean;
}

const QUICK_RADIO_PRESETS = [
  { text: '🚨 أحتاج دعم وتغطية نارية فوراً!', badge: 'SUPPORT' },
  { text: '🎯 تم رصد مدرعات العدو، استعدوا!', badge: 'RECON' },
  { text: '💥 هاجموا دبابة القلعة بكل قوة!', badge: 'ATTACK' },
  { text: '🛡️ تم تدمير الهدف والمنطقة مؤمنة!', badge: 'SECURE' },
  { text: '🚁 اطلبوا استطلاع جوي UAV!', badge: 'AIR' },
];

export const GlobalChatOverlay: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [senderName, setSenderName] = useState(() => {
    return localStorage.getItem('yemen_pubg_chat_name') || `مقاتل #${Math.floor(100 + Math.random() * 900)}`;
  });
  const [isNameEditing, setIsNameEditing] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [userCount, setUserCount] = useState(1);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showPresets, setShowPresets] = useState(false);

  const socketRef = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // Connect to WebSocket server
  const connectWebSocket = useCallback(() => {
    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws/chat`;

      const ws = new WebSocket(wsUrl);
      socketRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'init') {
            setMessages(data.messages || []);
            if (data.userCount) setUserCount(data.userCount);
          } else if (data.type === 'presence') {
            setUserCount(data.userCount || 1);
          } else if (data.type === 'message' && data.message) {
            setMessages((prev) => {
              // Deduplicate
              if (prev.some((m) => m.id === data.message.id)) return prev;
              return [...prev, data.message];
            });

            if (isCollapsed) {
              setUnreadCount((c) => c + 1);
            }

            // Tactical radio beep for incoming messages
            soundManager.playLaser(1.6);
          }
        } catch (err) {
          console.error('Error parsing WS message:', err);
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        // Attempt reconnection after 3 seconds
        reconnectTimeoutRef.current = window.setTimeout(() => {
          connectWebSocket();
        }, 3000);
      };

      ws.onerror = () => {
        setIsConnected(false);
      };
    } catch (e) {
      console.error('Failed to initialize WebSocket:', e);
    }
  }, [isCollapsed]);

  useEffect(() => {
    connectWebSocket();

    // Also fetch initial history as an immediate REST fallback
    fetch('/api/chat/history')
      .then((res) => res.json())
      .then((data) => {
        if (data && data.messages && data.messages.length > 0) {
          setMessages((prev) => (prev.length === 0 ? data.messages : prev));
          if (data.userCount) setUserCount(data.userCount);
        }
      })
      .catch(() => {});

    return () => {
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, [connectWebSocket]);

  useEffect(() => {
    if (!isCollapsed) {
      scrollToBottom();
      setUnreadCount(0);
    }
  }, [messages, isCollapsed, scrollToBottom]);

  const handleSendMessage = (textToSend?: string, badge = 'COMBAT', isQuickRadio = false) => {
    const text = (textToSend !== undefined ? textToSend : inputText).trim();
    if (!text) return;

    const payload = {
      type: 'message',
      text,
      sender: senderName,
      badge,
      color: badge === 'HQ' ? '#00f0ff' : isQuickRadio ? '#f59e0b' : '#38bdf8',
      isQuickRadio,
    };

    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(payload));
      if (!textToSend) setInputText('');
    } else {
      // Fallback local echo if socket is temporarily reconnecting
      const fallbackMsg: ChatMessage = {
        id: `local-${Date.now()}`,
        sender: senderName,
        text,
        time: Date.now(),
        badge,
        color: '#38bdf8',
        isQuickRadio,
      };
      setMessages((prev) => [...prev, fallbackMsg]);
      if (!textToSend) setInputText('');
    }

    soundManager.playLaser(1.2);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSaveName = (newName: string) => {
    const clean = newName.trim().slice(0, 20) || 'مقاتل';
    setSenderName(clean);
    localStorage.setItem('yemen_pubg_chat_name', clean);
    setIsNameEditing(false);
  };

  return (
    <div className="flex flex-col pointer-events-auto select-none w-[280px] sm:w-[320px] font-sans text-xs transition-all duration-200">
      {/* Chat Header Bar */}
      <div className="bg-[#090f1d]/95 border border-cyan-500/40 rounded-t-xl px-2.5 py-1.5 shadow-2xl backdrop-blur-md flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <MessageSquare className="w-3.5 h-3.5 text-cyan-400" />
          <span className="font-mono font-bold text-slate-100 text-[11px]">
            الدردشة العالمية (Global Comms)
          </span>
          <span
            className={`w-2 h-2 rounded-full ${
              isConnected ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]' : 'bg-amber-400 animate-pulse'
            }`}
            title={isConnected ? 'متصل بالخادم' : 'جاري الاتصال...'}
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Active players presence count */}
          <div className="flex items-center gap-1 text-[10px] font-mono text-cyan-300/80 bg-cyan-950/60 px-1.5 py-0.5 rounded border border-cyan-800/60">
            <Users className="w-3 h-3 text-cyan-400" />
            <span className="tabular-nums font-bold">{userCount}</span>
          </div>

          {/* Collapse / Expand Toggle Button */}
          <button
            onClick={() => {
              setIsCollapsed((prev) => !prev);
              if (isCollapsed) setUnreadCount(0);
            }}
            className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition relative"
            title={isCollapsed ? 'توسيع نافذة الدردشة' : 'طي نافذة الدردشة'}
          >
            {isCollapsed ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            {isCollapsed && unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-red-500 text-[9px] font-bold text-white flex items-center justify-center animate-bounce shadow">
                {unreadCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Main Body (Collapsible) */}
      {!isCollapsed && (
        <div className="bg-[#080d18]/92 border-x border-b border-cyan-500/30 rounded-b-xl shadow-2xl backdrop-blur-md flex flex-col overflow-hidden">
          {/* Sender Nickname Bar */}
          <div className="px-2.5 py-1 bg-black/40 border-b border-cyan-900/40 flex items-center justify-between text-[10px] font-mono">
            <span className="text-slate-400">اسم المقاتل:</span>
            {isNameEditing ? (
              <input
                type="text"
                defaultValue={senderName}
                autoFocus
                onBlur={(e) => handleSaveName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveName(e.currentTarget.value);
                  if (e.key === 'Escape') setIsNameEditing(false);
                }}
                className="bg-slate-900 border border-cyan-400 px-1.5 py-0.2 rounded text-cyan-200 text-[10px] w-24 outline-none"
              />
            ) : (
              <button
                onClick={() => setIsNameEditing(true)}
                className="text-cyan-300 font-bold hover:underline flex items-center gap-1"
                title="اضغط لتغيير اسمك"
              >
                <span>{senderName}</span>
                <span className="text-[9px] text-slate-500">✏️</span>
              </button>
            )}
          </div>

          {/* Scrollable Chat Messages Container */}
          <div className="flex flex-col gap-1.5 p-2 h-36 max-h-36 overflow-y-auto scrollbar-thin scrollbar-thumb-cyan-500/30">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-500 text-[10px] font-mono text-center">
                <span>لا توجد رسائل حالياً...</span>
                <span>كن أول من يبدأ الاتصال اللاسلكي!</span>
              </div>
            ) : (
              messages.map((msg) => {
                const isHQ = msg.badge === 'HQ';
                const isRadio = msg.isQuickRadio;
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col p-1.5 rounded-lg border text-right transition-all ${
                      isHQ
                        ? 'bg-cyan-950/60 border-cyan-500/60 text-cyan-200 shadow-[0_0_8px_rgba(0,240,255,0.2)]'
                        : isRadio
                        ? 'bg-amber-950/40 border-amber-500/40 text-amber-200'
                        : 'bg-slate-900/70 border-slate-800 text-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[9px] font-mono mb-0.5">
                      <span className="text-slate-400 opacity-70 tabular-nums">
                        {new Date(msg.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <div className="flex items-center gap-1">
                        <span className="font-bold text-white truncate max-w-[120px]">{msg.sender}</span>
                        {msg.badge && (
                          <span
                            className={`px-1 rounded text-[8px] font-bold ${
                              isHQ
                                ? 'bg-cyan-500 text-slate-950'
                                : isRadio
                                ? 'bg-amber-500 text-slate-950'
                                : 'bg-slate-700 text-slate-300'
                            }`}
                          >
                            {msg.badge}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-[11px] leading-tight break-words select-text font-medium">
                      {msg.text}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Tactical Radio Presets Toggle & Drawer */}
          {showPresets && (
            <div className="p-1.5 bg-black/60 border-t border-cyan-900/50 flex flex-col gap-1 animate-fadeIn">
              <div className="text-[9px] font-mono text-amber-400 font-bold text-right flex items-center justify-between">
                <span>نداءات تكتيكية سريعة (Radio Presets):</span>
                <Radio className="w-3 h-3 text-amber-400" />
              </div>
              <div className="grid grid-cols-1 gap-1">
                {QUICK_RADIO_PRESETS.map((preset, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      handleSendMessage(preset.text, preset.badge, true);
                      setShowPresets(false);
                    }}
                    className="px-2 py-1 rounded bg-slate-900/80 hover:bg-slate-800 text-amber-300 text-[10px] text-right font-medium transition border border-amber-500/30 hover:border-amber-400"
                  >
                    {preset.text}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Chat Input & Action Bar */}
          <div className="p-1.5 bg-black/40 border-t border-cyan-900/40 flex items-center gap-1.5">
            {/* Toggle quick radio presets */}
            <button
              onClick={() => setShowPresets((p) => !p)}
              className={`p-1.5 rounded-lg border transition ${
                showPresets
                  ? 'bg-amber-500 text-slate-950 border-amber-300 font-bold'
                  : 'bg-slate-800 hover:bg-slate-700 text-amber-400 border-slate-700'
              }`}
              title="نداءات لاسلكية سريعة"
            >
              <Radio className="w-3.5 h-3.5" />
            </button>

            {/* Input field */}
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="اكتب رسالة تكتيكية..."
              maxLength={180}
              className="flex-1 bg-slate-900/90 border border-slate-700 focus:border-cyan-400 text-white px-2 py-1 rounded-lg text-[11px] placeholder:text-slate-500 outline-none text-right transition"
            />

            {/* Send button */}
            <button
              onClick={() => handleSendMessage()}
              disabled={!inputText.trim()}
              className={`p-1.5 rounded-lg border transition flex items-center justify-center ${
                inputText.trim()
                  ? 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 border-cyan-300 shadow-[0_0_10px_rgba(0,240,255,0.6)] cursor-pointer'
                  : 'bg-slate-800 text-slate-600 border-slate-800 cursor-not-allowed'
              }`}
              title="إرسال (Enter)"
            >
              <Send className="w-3.5 h-3.5 rotate-180" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
