
import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, ShieldCheck, CheckCheck, AlertOctagon, Clock } from 'lucide-react';
import { ChatMessage, SiteConfig, StyleConfig } from '../types';
import { sendMessage, subscribeToChatMessages, checkTelegramReplies, notifyAdminsOfWebMessage, subscribeToSession } from '../services/db';
import { TELEGRAM_BOT_TOKEN, TELEGRAM_ADMIN_ID } from '../constants';

interface ChatWidgetProps {
  onSecretCode?: (code: string) => boolean;
  telegramConfig?: SiteConfig['telegram'];
  style?: StyleConfig;
}

export const ChatWidget: React.FC<ChatWidgetProps> = ({ onSecretCode, telegramConfig, style }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [sessionId, setSessionId] = useState<string>('');
  const [isBlocked, setIsBlocked] = useState(false);
  const [spamUntil, setSpamUntil] = useState<number>(0);
  const [spamTimer, setSpamTimer] = useState<number>(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize Session
  useEffect(() => {
    let storedId = localStorage.getItem('stomatologiya_chat_id');
    if (!storedId) {
      storedId = `user-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
      localStorage.setItem('stomatologiya_chat_id', storedId);
    }
    setSessionId(storedId);
  }, []);

  // Subscribe to messages and session status
  useEffect(() => {
    if (!sessionId || !isOpen) return;

    const unsubscribeMsgs = subscribeToChatMessages(sessionId, (msgs) => {
      setMessages(msgs);
      setTimeout(scrollToBottom, 100);
    });

    const unsubscribeSession = subscribeToSession(sessionId, (session) => {
        if (session) {
            setIsBlocked(!!session.blocked);
            if (session.spamBlockUntil && session.spamBlockUntil > Date.now()) {
                setSpamUntil(session.spamBlockUntil);
            } else {
                setSpamUntil(0);
            }
        }
    });

    return () => {
        unsubscribeMsgs();
        unsubscribeSession();
    };
  }, [sessionId, isOpen]);

  // Spam Timer Countdown
  useEffect(() => {
      if (spamUntil > Date.now()) {
          const interval = setInterval(() => {
              const diff = Math.ceil((spamUntil - Date.now()) / 1000);
              if (diff <= 0) {
                  setSpamUntil(0);
                  setSpamTimer(0);
                  clearInterval(interval);
              } else {
                  setSpamTimer(diff);
              }
          }, 1000);
          return () => clearInterval(interval);
      }
  }, [spamUntil]);

  // Poll Telegram for replies (Optimized with Error Backoff)
  useEffect(() => {
      const botToken = telegramConfig?.botToken || TELEGRAM_BOT_TOKEN;
      const rawAdminIds = telegramConfig?.adminId || TELEGRAM_ADMIN_ID;
      
      if (!botToken || botToken.includes('YOUR_')) return;

      const adminIds = rawAdminIds ? rawAdminIds.split(',').map(id => id.trim()) : [];

      let isRunning = true;
      let errorCount = 0;

      const poll = async () => {
          if (!isRunning) return;
          
          const success = await checkTelegramReplies(botToken, adminIds);
          
          if (isRunning) {
              if (success) {
                  errorCount = 0;
                  setTimeout(poll, 1000);
              } else {
                  errorCount++;
                  // If it fails (CORS), it will likely fail forever in this env. 
                  // Slow down significantly to avoid console spam.
                  setTimeout(poll, 30000);
              }
          }
      };
      
      poll();

      return () => {
          isRunning = false;
      };
  }, [telegramConfig]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // --- Sending Logic ---

  const handleSendText = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !sessionId || isBlocked || spamUntil > Date.now()) return;

    const text = inputText.trim();

    if (onSecretCode && onSecretCode(text)) {
        setInputText('');
        setIsOpen(false);
        return;
    }

    // Temporary keep text in case of error
    const tempText = text;
    setInputText('');
    
    try {
        const savedMsg = await sendMessage(sessionId, text, 'user', undefined);
        await notifyAdminsOfWebMessage(savedMsg.id, text, sessionId);
    } catch (error: any) {
        if (error.message === 'BLOCKED') {
            setIsBlocked(true);
        } else if (error.message.startsWith('SPAM_LIMIT')) {
            const until = parseInt(error.message.split(':')[1]);
            setSpamUntil(until);
        } else if (error.message === 'DAILY_LIMIT') {
            alert("Kunlik xabar limiti tugadi (20 ta). Ertaga urinib ko'ring.");
            setInputText(tempText); // Restore text
        } else if (error.message === 'TOO_FAST') {
            // Silently ignore or restore text
            // setInputText(tempText); // Optional: let user retry
        }
    }
  };

  const buttonColor = style?.chatButtonColor || style?.primaryColor || '#0ea5e9';

  return (
    <div className={`fixed z-[60] flex flex-col items-end pointer-events-none ${isOpen ? 'inset-0 lg:inset-auto lg:bottom-6 lg:right-6' : 'bottom-6 right-6'}`}>
      
      {isOpen && (
        <div className="pointer-events-auto w-full h-full lg:h-auto lg:max-h-[600px] lg:w-[450px] bg-white dark:bg-slate-900 lg:rounded-2xl shadow-2xl border-0 lg:border border-slate-100 dark:border-slate-800 lg:mb-4 overflow-hidden animate-slide-up origin-bottom-right transition-colors duration-300 flex flex-col">
          <div className="p-4 flex items-center justify-between text-white shrink-0" style={{ backgroundColor: buttonColor }}>
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-full">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm">Online Yordam</h3>
                <p className="text-xs text-white/80">Administrator bilan aloqa</p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="hover:bg-white/20 p-1 rounded-lg transition-colors">
              <X className="h-5 w-5" />
            </button>
          </div>
          
          {isBlocked ? (
             <div className="bg-red-500 p-2 text-center border-b border-red-600 shrink-0">
               <p className="text-xs text-white font-bold flex items-center justify-center gap-2">
                 <AlertOctagon className="h-4 w-4" />
                 Siz bloklangansiz
               </p>
             </div>
          ) : spamUntil > Date.now() ? (
            <div className="bg-amber-500 p-2 text-center border-b border-amber-600 shrink-0">
               <p className="text-xs text-white font-bold flex items-center justify-center gap-2">
                 <Clock className="h-4 w-4" />
                 Spam taqiqi: {spamTimer}s qoldi
               </p>
             </div>
          ) : (
             <div className="bg-sky-50 dark:bg-sky-900/20 p-2 text-center border-b border-sky-100 dark:border-sky-800 shrink-0">
                <p className="text-xs text-sky-600 dark:text-sky-400 font-medium">
                  Admin tez orada javob beradi
                </p>
             </div>
          )}

          <div className="flex-1 lg:min-h-[300px] overflow-y-auto p-4 bg-slate-50 dark:bg-slate-950 space-y-3">
            {messages.length === 0 && (
                <div className="text-center text-slate-400 text-sm mt-10">
                    <p>Savolingizni yozib qoldiring.</p>
                </div>
            )}
            {messages.map((msg) => (
              <div 
                key={msg.id} 
                className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm ${
                    msg.sender === 'user' 
                    ? 'text-white rounded-br-none' 
                    : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-bl-none shadow-sm'
                }`}
                style={msg.sender === 'user' ? { backgroundColor: buttonColor } : {}}
                >
                    <div className="flex flex-col gap-1">
                       {msg.mediaType === 'audio' && msg.mediaUrl ? (
                           <audio controls src={`data:audio/webm;base64,${msg.mediaUrl}`} className="max-w-[200px] h-8" />
                       ) : (
                           <span className="text-left whitespace-pre-wrap">{msg.text}</span>
                       )}
                       
                       <div className="flex justify-end">
                           {msg.sender === 'user' && (
                               <CheckCheck className={`h-3.5 w-3.5 ${msg.read ? 'text-white' : 'text-white/40'} transition-colors`} />
                           )}
                       </div>
                    </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 shrink-0">
             {isBlocked || spamUntil > Date.now() ? (
                 <div className="text-center py-3 text-slate-400 dark:text-slate-500 text-sm italic bg-slate-100 dark:bg-slate-800 rounded-xl">
                     {isBlocked ? "Xabar yozish imkoniyati cheklangan" : `Iltimos kuting: ${spamTimer}s`}
                 </div>
             ) : (
                <form onSubmit={handleSendText} className="flex gap-2">
                    <input 
                        type="text" 
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        placeholder="Xabar yozing..."
                        className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-primary transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500"
                    />
                    <button 
                        type="submit"
                        className={`text-white p-2.5 rounded-xl hover:opacity-90 transition-opacity ${!inputText.trim() ? 'opacity-50 cursor-not-allowed' : ''}`}
                        style={{ backgroundColor: buttonColor }}
                        disabled={!inputText.trim()}
                    >
                        <Send className="h-4 w-4" />
                    </button>
                </form>
             )}
          </div>
        </div>
      )}

      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`pointer-events-auto h-14 w-14 text-white rounded-full shadow-lg flex items-center justify-center transition-transform hover:scale-105 active:scale-95 dynamic-chat-btn ${isOpen ? 'hidden lg:flex' : 'flex'}`}
        style={{ backgroundColor: buttonColor }}
      >
        {isOpen ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>
    </div>
  );
};
