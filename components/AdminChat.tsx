
import React, { useState, useEffect, useRef } from 'react';
import { Search, User, Send, MessageSquare, Trash2, CheckCircle, Edit2, X, Paperclip, Image as ImageIcon, Video, Mic, Ban, ShieldCheck, ChevronUp } from 'lucide-react';
import { ChatSession, ChatMessage } from '../types';
import { subscribeToAllSessions, subscribeToChatMessages, sendMessage, markSessionRead, deleteMessage, deleteChatSession, replyToTelegramUser, editMessage, updateMessageTelegramId, editTelegramMessage, toggleSessionBlock } from '../services/db';
import { ConfirmModal } from './ConfirmModal';

export const AdminChat: React.FC = () => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [allMessages, setAllMessages] = useState<ChatMessage[]>([]);
  const [displayCount, setDisplayCount] = useState(20);
  const [replyText, setReplyText] = useState('');
  
  // States for Editing
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  
  // Media Upload State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Modal State
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'message' | 'session' | 'block', id?: string } | null>(null);

  // Load Session List
  useEffect(() => {
    const unsubscribe = subscribeToAllSessions((data) => {
        setSessions(data);
    });
    return () => unsubscribe();
  }, []);

  // Load Messages when session selected
  useEffect(() => {
    if (!selectedSessionId) return;
    
    // Reset pagination when switching sessions
    setDisplayCount(20);
    // Mark as read immediately
    markSessionRead(selectedSessionId);

    const unsubscribe = subscribeToChatMessages(selectedSessionId, (msgs) => {
        setAllMessages(msgs);
    });

    return () => unsubscribe();
  }, [selectedSessionId]);

  // Scroll to bottom on initial load or new messages (if not viewing history)
  useEffect(() => {
      // Simple heuristic: if we are near the bottom or just loaded, scroll to bottom
      if (messagesEndRef.current) {
          messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
      }
  }, [allMessages.length, selectedSessionId]);

  const handleLoadMore = () => {
      setDisplayCount(prev => prev + 20);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          // Check for restricted types (GIF and Stickers/WebP)
          if (file.type.includes('gif') || file.type === 'image/webp') {
              alert("Stiker va GIF formatidagi fayllar taqiqlangan!");
              if (fileInputRef.current) fileInputRef.current.value = '';
              return;
          }

          setSelectedFile(file);
          
          if (file.type.startsWith('image/')) {
              const reader = new FileReader();
              reader.onload = (ev) => {
                  setFilePreview(ev.target?.result as string);
              };
              reader.readAsDataURL(file);
          } else {
              setFilePreview(null);
          }
      }
  };

  const clearFile = () => {
      setSelectedFile(null);
      setFilePreview(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSessionId || (!replyText.trim() && !selectedFile)) return;

    if (editingMessageId) {
        // --- EDIT MODE ---
        // 1. Update Local DB
        await editMessage(editingMessageId, replyText.trim());

        // 2. If Telegram message, update on Telegram
        const originalMsg = allMessages.find(m => m.id === editingMessageId);
        if (originalMsg && selectedSessionId.startsWith('tg-') && originalMsg.telegramMessageId) {
             const tgChatId = selectedSessionId.replace('tg-', '');
             // Determine if it is a media message or text message
             // Important: Check if original message HAD mediaUrl or mediaType
             const isMedia = !!originalMsg.mediaUrl || !!originalMsg.mediaType;
             await editTelegramMessage(tgChatId, originalMsg.telegramMessageId, replyText.trim(), isMedia);
        }

        setEditingMessageId(null);
        setSuccessMessage("Xabar tahrirlandi");
    } else {
        // --- SEND MODE ---
        let mediaType: ChatMessage['mediaType'] = undefined;
        let base64Media: string | undefined = undefined;

        if (selectedFile) {
            if (selectedFile.type.startsWith('image/')) mediaType = 'photo';
            else if (selectedFile.type.startsWith('video/')) mediaType = 'video';
            else if (selectedFile.type.startsWith('audio/')) mediaType = 'audio';
            else mediaType = 'document';
            
            // Extract base64 from preview only if it's an image
            if (mediaType === 'photo') {
                base64Media = filePreview ? filePreview : undefined;
            }
        }

        // 1. Save message to DB (Optimistic update)
        const savedMsg = await sendMessage(
            selectedSessionId, 
            replyText.trim(), 
            'admin', 
            undefined, 
            base64Media, 
            mediaType
        );

        // 2. If it is a Telegram User Session, send to Telegram Bot
        if (selectedSessionId.startsWith('tg-') || /^\d+$/.test(selectedSessionId)) {
            const tgChatId = selectedSessionId.replace('tg-', ''); // Handles both tg- prefix and raw numeric ID if normalized
            const res = await replyToTelegramUser(tgChatId, replyText.trim(), selectedFile || undefined);
            
            // 3. Save the Telegram Message ID for future editing/deleting
            if (res && res.ok) {
                await updateMessageTelegramId(savedMsg.id, res.result.message_id);
                setSuccessMessage("Xabar foydalanuvchiga yuborildi!");
            } else {
                console.error("Failed to send reply to Telegram user:", JSON.stringify(res));
                setSuccessMessage(`Xatolik: ${res?.description || "Telegramga yuborilmadi"}`);
            }
        } else {
            setSuccessMessage("Xabar saqlandi");
        }
    }

    setReplyText('');
    clearFile();
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const handleEditClick = (msg: ChatMessage) => {
      setEditingMessageId(msg.id);
      setReplyText(msg.text);
      inputRef.current?.focus();
  };

  const cancelEdit = () => {
      setEditingMessageId(null);
      setReplyText('');
  };

  const handleDeleteMessage = (msgId: string) => {
     if (!selectedSessionId) return;
     setDeleteTarget({ type: 'message', id: msgId });
  };

  const handleDeleteSession = () => {
      if (!selectedSessionId) return;
      setDeleteTarget({ type: 'session' });
  };

  const handleBlockToggle = () => {
      if (!selectedSessionId) return;
      setDeleteTarget({ type: 'block' });
  };

  const confirmDelete = async () => {
    if (!selectedSessionId || !deleteTarget) return;

    if (deleteTarget.type === 'message' && deleteTarget.id) {
        await deleteMessage(selectedSessionId, deleteTarget.id);
    } else if (deleteTarget.type === 'session') {
        await deleteChatSession(selectedSessionId);
        setSelectedSessionId(null);
    } else if (deleteTarget.type === 'block') {
        const isBlocked = await toggleSessionBlock(selectedSessionId);
        setSuccessMessage(isBlocked ? "Foydalanuvchi bloklandi" : "Foydalanuvchi blokdan chiqarildi");
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 2000);
    }
    setDeleteTarget(null);
  };

  const currentSession = sessions.find(s => s.id === selectedSessionId);
  const visibleMessages = allMessages.filter(m => m.text !== "✍️ Adminga yozish").slice(-displayCount);
  const hasMoreMessages = allMessages.length > displayCount;

  return (
    <>
      <div className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col md:flex-row h-[600px] animate-fade-in relative z-0 transition-colors duration-300">
        
        {/* Success Popup */}
        {showSuccess && (
            <div className="absolute top-6 left-1/2 transform -translate-x-1/2 z-50 animate-fade-in">
                <div className={`bg-slate-900/95 dark:bg-white/95 backdrop-blur-md text-white dark:text-slate-900 px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-slate-800 dark:border-slate-200 ${successMessage.includes('Xatolik') ? 'border-red-500' : ''}`}>
                    <div className={`${successMessage.includes('Xatolik') ? 'bg-red-500' : 'bg-emerald-500'} rounded-full p-1`}>
                        {successMessage.includes('Xatolik') ? <X className="h-4 w-4 text-white" /> : <CheckCircle className="h-4 w-4 text-white" />}
                    </div>
                    <span className="font-bold text-sm">{successMessage}</span>
                </div>
            </div>
        )}

        {/* Sidebar List */}
        <div className={`w-full md:w-80 border-r border-slate-100 dark:border-slate-800 flex flex-col ${selectedSessionId ? 'hidden md:flex' : 'flex'}`}>
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50">
              <h2 className="font-bold text-slate-800 dark:text-white mb-3 flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-primary" />
                  Mijozlar Xabarlari
              </h2>
              <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input 
                      type="text" 
                      placeholder="Qidirish..."
                      className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
              </div>
          </div>
          <div className="flex-1 overflow-y-auto bg-white dark:bg-slate-900">
              {sessions.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-sm">
                      Xabarlar yo'q
                  </div>
              ) : (
                  sessions.map(session => (
                      <div 
                          key={session.id}
                          onClick={() => setSelectedSessionId(session.id)}
                          className={`p-4 border-b border-slate-50 dark:border-slate-800 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors ${selectedSessionId === session.id ? 'bg-primary/5 dark:bg-primary/10 border-l-4 border-l-primary' : ''}`}
                      >
                          <div className="flex justify-between items-start mb-1">
                              <span className="font-bold text-slate-800 dark:text-slate-200 text-sm truncate pr-2 flex items-center gap-1">
                                  {session.userName || (session.id.startsWith('tg-') ? `Telegram User` : `Mijoz (${session.id.slice(-4)})`)}
                                  {session.blocked && <Ban className="h-3 w-3 text-red-500" />}
                              </span>
                              {session.unreadCount > 0 && (
                                  <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                                      {session.unreadCount}
                                  </span>
                              )}
                          </div>
                          <p className={`text-xs truncate ${session.unreadCount > 0 ? 'text-slate-900 dark:text-white font-semibold' : 'text-slate-500 dark:text-slate-400'}`}>
                              {session.lastMessage}
                          </p>
                          <p className="text-[10px] text-slate-400 mt-1 text-right">
                              {new Date(session.lastMessageTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </p>
                      </div>
                  ))
              )}
          </div>
        </div>

        {/* Chat Area */}
        <div className={`flex-1 flex flex-col bg-slate-50 dark:bg-slate-950 ${!selectedSessionId ? 'hidden md:flex' : 'flex'}`}>
          {!selectedSessionId ? (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-400 dark:text-slate-500">
                  <MessageSquare className="h-12 w-12 mb-2 opacity-20" />
                  <p>Chatni tanlang</p>
              </div>
          ) : (
              <>
                  {/* Header */}
                  <div className="p-4 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                          <button onClick={() => setSelectedSessionId(null)} className="md:hidden text-slate-500">
                              Back
                          </button>
                          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                              <User className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                              <div className="flex items-center gap-2">
                                <h3 className="font-bold text-slate-800 dark:text-white">
                                    {currentSession?.userName || 'Mijoz suhbati'}
                                </h3>
                                {currentSession?.blocked && (
                                    <span className="bg-red-100 text-red-600 text-[10px] font-bold px-2 py-0.5 rounded-full">BLOKLANGAN</span>
                                )}
                              </div>
                              <p className="text-xs text-slate-500 dark:text-slate-400">ID: {selectedSessionId}</p>
                          </div>
                      </div>
                      <div className="flex gap-2">
                        <button 
                            onClick={handleBlockToggle}
                            className={`p-2 rounded-xl transition-colors ${currentSession?.blocked ? 'text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20' : 'text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20'}`}
                            title={currentSession?.blocked ? "Blokdan chiqarish" : "Foydalanuvchini bloklash"}
                        >
                            {currentSession?.blocked ? <ShieldCheck className="h-5 w-5" /> : <Ban className="h-5 w-5" />}
                        </button>
                        <button 
                            onClick={handleDeleteSession}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
                            title="Chatni butunlay o'chirish"
                        >
                            <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                      {hasMoreMessages && (
                          <div className="flex justify-center mb-4">
                              <button 
                                  onClick={handleLoadMore}
                                  className="text-xs text-slate-500 hover:text-primary bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-full shadow-sm flex items-center gap-1 transition-colors"
                              >
                                  <ChevronUp className="h-3 w-3" /> Oldingi xabarlarni yuklash
                              </button>
                          </div>
                      )}
                      
                      {visibleMessages.map(msg => (
                          <div key={msg.id} className={`group flex items-end gap-2 mb-4 ${msg.sender === 'admin' ? 'justify-end' : 'justify-start'}`}>
                              
                              {/* Controls for Admin Messages (Left Side) */}
                              {msg.sender === 'admin' && (
                                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                      <button 
                                          onClick={() => handleDeleteMessage(msg.id)}
                                          className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-full"
                                          title="O'chirish"
                                          type="button"
                                      >
                                          <Trash2 className="h-4 w-4" />
                                      </button>
                                      
                                      <button 
                                          onClick={() => handleEditClick(msg)}
                                          className="p-2 text-slate-300 hover:text-primary hover:bg-primary/10 rounded-full"
                                          title="Tahrirlash"
                                          type="button"
                                      >
                                          <Edit2 className="h-4 w-4" />
                                      </button>
                                  </div>
                              )}

                              <div className={`max-w-[70%] p-3 rounded-2xl text-sm shadow-sm whitespace-pre-wrap flex flex-col gap-2 ${
                                  msg.sender === 'admin' 
                                  ? 'bg-slate-800 dark:bg-slate-700 text-white rounded-br-none' 
                                  : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-bl-none'
                              }`}>
                                  {msg.mediaUrl && (
                                    <div className="mb-1">
                                        <img 
                                            src={msg.mediaUrl} 
                                            alt="Media" 
                                            className="rounded-lg max-w-full max-h-60 object-contain bg-black/10" 
                                        />
                                    </div>
                                  )}
                                  {msg.mediaType === 'video' && !msg.mediaUrl && (
                                      <div className="mb-1 flex items-center gap-2 bg-black/10 p-2 rounded-lg">
                                          <Video className="h-5 w-5" />
                                          <span className="text-xs">Video</span>
                                      </div>
                                  )}
                                  {(msg.mediaType === 'audio' || msg.mediaType === 'document') && !msg.mediaUrl && (
                                      <div className="mb-1 flex items-center gap-2 bg-black/10 p-2 rounded-lg">
                                          <Mic className="h-5 w-5" />
                                          <span className="text-xs">Audio/File</span>
                                      </div>
                                  )}
                                  {msg.text && <span>{msg.text}</span>}
                              </div>

                              {/* Delete Button for User Messages (Right Side) */}
                              {msg.sender === 'user' && (
                                  <button 
                                      onClick={() => handleDeleteMessage(msg.id)}
                                      className="opacity-0 group-hover:opacity-100 p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-all"
                                      title="O'chirish"
                                      type="button"
                                  >
                                      <Trash2 className="h-4 w-4" />
                                  </button>
                              )}
                          </div>
                      ))}
                      <div ref={messagesEndRef} />
                  </div>

                  {/* Formatting Hint & File Preview */}
                  <div className="px-4 py-2 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-2">
                      {selectedFile && (
                          <div className="flex items-center gap-2 mb-1 p-2 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 w-fit">
                              {filePreview ? (
                                  <img src={filePreview} alt="Selected" className="h-10 w-10 rounded object-cover" />
                              ) : (
                                  <div className="h-10 w-10 bg-slate-200 dark:bg-slate-700 rounded flex items-center justify-center">
                                      <Paperclip className="h-5 w-5 text-slate-500" />
                                  </div>
                              )}
                              <div className="text-xs">
                                  <p className="font-bold text-slate-700 dark:text-slate-200 truncate max-w-[150px]">{selectedFile?.name}</p>
                                  <p className="text-slate-400">{(selectedFile!.size / 1024).toFixed(1)} KB</p>
                              </div>
                              <button onClick={clearFile} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full text-slate-400 hover:text-red-500">
                                  <X className="h-4 w-4" />
                              </button>
                          </div>
                      )}
                      <div className="text-[10px] text-slate-400 flex gap-4">
                        <span>*<b>Qalin</b>*</span>
                        <span>_<i>Kursiv</i>_</span>
                        <span>__<u>Tagiga chizilgan</u>__</span>
                        <span>~<s>O'chirilgan</s>~</span>
                      </div>
                  </div>

                  {/* Input */}
                  <form onSubmit={handleReply} className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex gap-2">
                      <div className="flex items-center gap-2">
                        <input 
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept="*"
                            onChange={handleFileSelect}
                        />
                        <button 
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="p-3 text-slate-400 hover:text-primary hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors"
                            title="Media yuborish"
                        >
                            <Paperclip className="h-5 w-5" />
                        </button>
                      </div>
                      
                      <div className="flex-1 relative">
                        <input 
                            ref={inputRef}
                            type="text" 
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            placeholder={editingMessageId ? "Xabarni tahrirlash..." : (selectedFile ? "Izoh yozing..." : "Javob yozing...")}
                            disabled={currentSession?.blocked}
                            className={`w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/20 ${editingMessageId ? 'border-amber-400 focus:border-amber-400 pr-10' : 'border-slate-200 dark:border-slate-700'}`}
                        />
                        {editingMessageId && (
                            <button 
                                type="button" 
                                onClick={cancelEdit} 
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-red-500"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        )}
                      </div>
                      <button 
                          type="submit"
                          disabled={(!replyText.trim() && !selectedFile) || currentSession?.blocked}
                          className={`text-white px-6 rounded-xl font-bold transition-colors disabled:opacity-50 ${editingMessageId ? 'bg-amber-500 hover:bg-amber-600' : 'bg-primary hover:bg-sky-600'}`}
                      >
                          {editingMessageId ? <Edit2 className="h-5 w-5" /> : <Send className="h-5 w-5" />}
                      </button>
                  </form>
              </>
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
      <ConfirmModal 
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title={deleteTarget?.type === 'session' ? "Suhbatni o'chirish" : deleteTarget?.type === 'block' ? (currentSession?.blocked ? "Blokdan chiqarish" : "Foydalanuvchini bloklash") : "Xabarni o'chirish"}
        message={
            deleteTarget?.type === 'session' 
            ? "Siz rostdan ham ushbu suhbat tarixini butunlay o'chirmoqchimisiz? Bu amalni ortga qaytarib bo'lmaydi." 
            : deleteTarget?.type === 'block'
            ? (currentSession?.blocked ? "Foydalanuvchini blokdan chiqarmoqchimisiz? U yana xabar yozishi mumkin bo'ladi." : "Foydalanuvchini bloklamoqchimisiz? U endi xabar yozolmaydi.")
            : "Siz rostdan ham ushbu xabarni o'chirmoqchimisiz?"
        }
      />
    </>
  );
};
