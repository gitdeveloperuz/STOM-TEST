
import React, { useState, useEffect } from 'react';
import { Search, User, Star, Trash2, Pin, Phone, Globe, Bot, ShoppingBag, Clock, Edit2, CheckCircle, X, StickyNote, MapPin, AlertTriangle, ExternalLink, Filter, DollarSign, Archive, Ban, RotateCcw, TrendingUp, Calendar, ArrowLeft } from 'lucide-react';
import { TelegramUser, Order } from '../types';
import { subscribeToTelegramUsers, updateTelegramUser, deleteTelegramUser, UZB_OFFSET } from '../services/db';
import { formatPrice } from '../constants';
import { ConfirmModal } from './ConfirmModal';

// Helper to parse currency strings
const parseCurrencyString = (str: string): { uzs: number, usd: number } => {
    let uzs = 0;
    let usd = 0;
    if (!str) return { uzs, usd };
    const parts = str.split('+').map(p => p.trim());
    parts.forEach(part => {
        // Use parseFloat to support decimals in analytics
        const numericPart = parseFloat(part.replace(/[^0-9.]/g, '')) || 0;
        if (part.includes('UZS')) { uzs += numericPart; } 
        else if (part.includes('$')) { usd += numericPart; }
    });
    return { uzs, usd };
};

export const AdminCustomers: React.FC = () => {
  const [users, setUsers] = useState<TelegramUser[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'loyal' | 'pinned' | 'website' | 'bot'>('all');
  
  // Modals
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [orderToDelete, setOrderToDelete] = useState<string | null>(null);
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [noteText, setNoteText] = useState('');

  // Load Users
  useEffect(() => {
    const unsubscribe = subscribeToTelegramUsers((data) => {
        setUsers(data);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
      if (selectedUserId) {
          const user = users.find(u => u.id === selectedUserId);
          if (user) {
              setNoteText(user.adminNotes || '');
          }
      }
  }, [selectedUserId, users]);

  const filteredUsers = users
    .filter(u => {
        // Filter out users who haven't placed any orders
        if (!u.orders || u.orders.length === 0) return false;

        if (filter === 'loyal' && !u.isLoyal) return false;
        if (filter === 'pinned' && !u.isPinned) return false;
        if (filter === 'website' && u.source !== 'website') return false;
        if (filter === 'bot' && u.source === 'website') return false;
        
        const searchLower = searchTerm.toLowerCase();
        return (
            (u.firstName?.toLowerCase() || '').includes(searchLower) ||
            (u.lastName?.toLowerCase() || '').includes(searchLower) ||
            (u.username?.toLowerCase() || '').includes(searchLower) ||
            (u.phone || '').includes(searchLower) ||
            u.id.includes(searchLower)
        );
    })
    .sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        if (a.isLoyal && !b.isLoyal) return -1;
        if (!a.isLoyal && b.isLoyal) return 1;
        return (b.lastActive || 0) - (a.lastActive || 0);
    });

  const selectedUser = users.find(u => u.id === selectedUserId);

  // Actions
  const handleToggleLoyal = async () => { if (!selectedUser) return; await updateTelegramUser({ ...selectedUser, isLoyal: !selectedUser.isLoyal }); };
  const handleTogglePin = async () => { if (!selectedUser) return; await updateTelegramUser({ ...selectedUser, isPinned: !selectedUser.isPinned }); };
  const handleSaveNote = async () => { if (!selectedUser) return; await updateTelegramUser({ ...selectedUser, adminNotes: noteText }); setIsEditingNote(false); };
  const handleDeleteUser = async () => { if (!deleteTarget) return; await deleteTelegramUser(deleteTarget); if (selectedUserId === deleteTarget) setSelectedUserId(null); setDeleteTarget(null); };
  const handleDeleteOrder = async () => { if (!selectedUser || !orderToDelete) return; const updatedOrders = selectedUser.orders?.filter(o => o.id !== orderToDelete) || []; await updateTelegramUser({ ...selectedUser, orders: updatedOrders }); setOrderToDelete(null); };
  const handleChangeOrderStatus = async (orderId: string, newStatus: Order['status']) => { if (!selectedUser || !selectedUser.orders) return; const updatedOrders = selectedUser.orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o); await updateTelegramUser({ ...selectedUser, orders: updatedOrders }); };

  // Calculation Helpers
  const getUserTotalSpent = (orders: Order[] = []) => {
      let uzs = 0; let usd = 0;
      orders.forEach(o => {
          if (o.status !== 'cancelled' && o.status !== 'fake') {
              const parsed = parseCurrencyString(o.totalAmount);
              uzs += parsed.uzs;
              usd += parsed.usd;
          }
      });
      return { uzs, usd };
  };

  const getAvgOrderValue = (orders: Order[] = []) => {
      const validOrders = orders.filter(o => o.status !== 'cancelled' && o.status !== 'fake');
      if (validOrders.length === 0) return { uzs: 0, usd: 0 };
      const total = getUserTotalSpent(validOrders);
      return { uzs: total.uzs / validOrders.length, usd: total.usd / validOrders.length };
  };

  const renderLocation = (loc?: string) => {
      if (!loc) return null;
      if (loc.startsWith('Loc:') || (loc.includes(',') && !isNaN(parseFloat(loc.split(',')[0])))) {
          const cleanLoc = loc.replace('Loc:', '').trim();
          const [lat, lng] = cleanLoc.split(',').map(s => s.trim());
          const mapUrl = `https://www.google.com/maps?q=${lat},${lng}`;
          return (
              <a href={mapUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-blue-600 bg-blue-50 px-2 py-1 rounded text-xs font-bold w-fit mt-1 border border-blue-200 hover:bg-blue-100" onClick={(e) => e.stopPropagation()}>
                  <MapPin className="h-3 w-3" /> Geo-lokatsiya <ExternalLink className="h-3 w-3 opacity-50" />
              </a>
          );
      }
      return <span className="flex items-center gap-1.5 text-slate-500 text-xs mt-1 bg-slate-100 px-2 py-1 rounded w-fit"><MapPin className="h-3 w-3" /> {loc}</span>;
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-none sm:rounded-[2rem] shadow-xl border-x-0 sm:border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col md:flex-row h-[calc(100dvh-72px)] sm:h-[calc(100vh-140px)] min-h-[600px] animate-fade-in relative z-0 transition-colors duration-300">
        
        {/* Sidebar List (Visible on Mobile if no user selected, always on Desktop) */}
        <div className={`w-full md:w-[350px] lg:w-[400px] border-r border-slate-100 dark:border-slate-800 flex flex-col ${selectedUserId ? 'hidden md:flex' : 'flex'}`}>
            <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/80 backdrop-blur-sm z-10 sticky top-0">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="font-bold text-lg text-slate-800 dark:text-white flex items-center gap-2">
                        <User className="h-5 w-5 text-indigo-500" />
                        Mijozlar <span className="text-slate-400 text-sm font-normal">({filteredUsers.length})</span>
                    </h2>
                </div>
                
                <div className="relative mb-3 group">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                    <input 
                        type="text" 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Qidirish (Ism, ID, Tel)..."
                        className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
                    />
                </div>

                <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                    {[
                        { id: 'all', label: 'Barchasi', color: 'bg-slate-800 dark:bg-white text-white dark:text-slate-900' },
                        { id: 'loyal', label: 'Sodiq', color: 'bg-amber-500 text-white' },
                        { id: 'pinned', label: 'Pinned', color: 'bg-indigo-500 text-white' },
                        { id: 'website', label: 'Web', color: 'bg-sky-500 text-white' },
                        { id: 'bot', label: 'Bot', color: 'bg-purple-500 text-white' },
                    ].map(btn => (
                        <button 
                            key={btn.id}
                            onClick={() => setFilter(btn.id as any)} 
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all shadow-sm active:scale-95 ${filter === btn.id ? btn.color : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'}`}
                        >
                            {btn.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto bg-white dark:bg-slate-900 custom-scrollbar pb-20 md:pb-0">
                {filteredUsers.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-center text-slate-400 p-8">
                        <Search className="h-12 w-12 mb-2 opacity-20" />
                        <p className="text-sm">Mijozlar topilmadi</p>
                    </div>
                ) : (
                    filteredUsers.map(user => {
                        const validOrders = user.orders?.filter(o => o.status !== 'fake' && o.status !== 'cancelled') || [];
                        const isSelected = selectedUserId === user.id;
                        return (
                            <div 
                                key={user.id}
                                onClick={() => setSelectedUserId(user.id)}
                                className={`p-4 border-b border-slate-50 dark:border-slate-800 cursor-pointer transition-all hover:bg-slate-50 dark:hover:bg-slate-800/50 group relative ${isSelected ? 'bg-indigo-50/50 dark:bg-indigo-900/10' : ''}`}
                            >
                                {isSelected && <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500 rounded-r-full" />}
                                
                                <div className="flex justify-between items-start mb-1.5">
                                    <div className="flex items-center gap-2 min-w-0">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm shrink-0 ${user.source === 'website' ? 'bg-gradient-to-br from-sky-400 to-blue-500' : 'bg-gradient-to-br from-indigo-400 to-purple-500'}`}>
                                            {user.firstName ? user.firstName[0].toUpperCase() : 'U'}
                                        </div>
                                        <div className="min-w-0">
                                            <h4 className={`text-sm font-bold truncate flex items-center gap-1.5 ${isSelected ? 'text-indigo-900 dark:text-indigo-200' : 'text-slate-800 dark:text-slate-200'}`}>
                                                {user.isPinned && <Pin className="h-3 w-3 text-indigo-500 fill-indigo-500" />}
                                                {user.firstName || 'Noma\'lum'} {user.lastName || ''}
                                            </h4>
                                            {user.username && <p className="text-xs text-slate-400 truncate">@{user.username}</p>}
                                        </div>
                                    </div>
                                    <span className="text-[10px] font-mono text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                                        {user.lastActive ? new Date(user.lastActive + UZB_OFFSET).toLocaleDateString() : '-'}
                                    </span>
                                </div>
                                
                                <div className="flex justify-between items-center pl-10">
                                    <div className="flex items-center gap-3">
                                        {user.isLoyal && <span className="flex items-center gap-1 text-[10px] font-bold text-amber-500 bg-amber-50 dark:bg-amber-900/20 px-1.5 py-0.5 rounded border border-amber-100 dark:border-amber-900"><Star className="h-3 w-3 fill-current" /> VIP</span>}
                                        <span className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400"><ShoppingBag className="h-3 w-3" /> {validOrders.length}</span>
                                    </div>
                                    {user.source === 'website' ? <Globe className="h-3.5 w-3.5 text-sky-400" /> : <Bot className="h-3.5 w-3.5 text-indigo-400" />}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>

        {/* Details Area (Visible on Desktop, or on Mobile when user selected) */}
        <div className={`flex-1 flex flex-col bg-slate-50 dark:bg-slate-950 ${!selectedUserId ? 'hidden md:flex' : 'flex absolute inset-0 md:static z-20 w-full h-full'}`}>
            {!selectedUser ? (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 p-8">
                    <div className="w-24 h-24 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6 shadow-inner">
                        <User className="h-10 w-10 opacity-20" />
                    </div>
                    <p className="font-medium text-lg text-center">Mijoz ma'lumotlarini ko'rish uchun ro'yxatdan tanlang</p>
                </div>
            ) : (
                <>
                    {/* Header */}
                    <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-4 sm:p-6 shadow-sm z-10 sticky top-0">
                        <div className="flex flex-col gap-6">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-4">
                                    <button onClick={() => setSelectedUserId(null)} className="md:hidden p-2 -ml-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"><ArrowLeft className="h-6 w-6" /></button>
                                    <div className={`w-12 h-12 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center text-white font-bold text-xl sm:text-3xl shadow-xl shadow-indigo-500/20 ${selectedUser.source === 'website' ? 'bg-gradient-to-br from-sky-400 to-blue-600' : 'bg-gradient-to-br from-indigo-400 to-purple-600'}`}>
                                        {selectedUser.firstName ? selectedUser.firstName[0].toUpperCase() : <User className="h-6 w-6 sm:h-8 sm:w-8" />}
                                    </div>
                                    <div className="min-w-0">
                                        <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2 truncate">
                                            {selectedUser.firstName} {selectedUser.lastName}
                                            {selectedUser.isLoyal && <Star className="h-5 w-5 text-amber-400 fill-amber-400 animate-pulse shrink-0" />}
                                        </h2>
                                        <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-sm text-slate-500 dark:text-slate-400 mt-1">
                                            <span className="font-mono bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-[10px] sm:text-xs truncate">ID: {selectedUser.id}</span>
                                            {selectedUser.username && <span className="text-indigo-500 font-medium text-xs sm:text-sm truncate">@{selectedUser.username}</span>}
                                        </div>
                                        {selectedUser.phone && (
                                            <a href={`tel:${selectedUser.phone}`} className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 font-bold mt-1 hover:text-indigo-500 transition-colors text-xs sm:text-sm">
                                                <Phone className="h-3 w-3 sm:h-3.5 sm:w-3.5" /> {selectedUser.phone}
                                            </a>
                                        )}
                                    </div>
                                </div>
                                <div className="flex flex-col sm:flex-row gap-2">
                                    <div className="flex gap-2">
                                        <button onClick={handleTogglePin} className={`p-2 sm:p-2.5 rounded-xl border transition-all active:scale-95 ${selectedUser.isPinned ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400 hover:text-indigo-500'}`}><Pin className={`h-4 w-4 sm:h-5 sm:w-5 ${selectedUser.isPinned ? 'fill-current' : ''}`} /></button>
                                        <button onClick={handleToggleLoyal} className={`p-2 sm:p-2.5 rounded-xl border transition-all active:scale-95 ${selectedUser.isLoyal ? 'bg-amber-50 border-amber-200 text-amber-500' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400 hover:text-amber-500'}`}><Star className={`h-4 w-4 sm:h-5 sm:w-5 ${selectedUser.isLoyal ? 'fill-current' : ''}`} /></button>
                                    </div>
                                    <button onClick={() => setDeleteTarget(selectedUser.id)} className="p-2 sm:p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all active:scale-95"><Trash2 className="h-4 w-4 sm:h-5 sm:w-5" /></button>
                                </div>
                            </div>

                            {/* Lifetime Stats */}
                            {(() => {
                                const { uzs, usd } = getUserTotalSpent(selectedUser.orders);
                                const avg = getAvgOrderValue(selectedUser.orders);
                                return (
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                                        <div className="bg-slate-50 dark:bg-slate-800 p-3 sm:p-4 rounded-2xl border border-slate-100 dark:border-slate-700 relative overflow-hidden group">
                                            <div className="absolute right-0 top-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity"><DollarSign className="h-10 w-10 sm:h-12 sm:w-12" /></div>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Jami Savdo</p>
                                            <div className="flex flex-col">
                                                {uzs > 0 && <span className="text-base sm:text-lg font-black text-slate-900 dark:text-white">{formatPrice(uzs, 'UZS')}</span>}
                                                {usd > 0 && <span className="text-xs sm:text-sm font-bold text-emerald-600 dark:text-emerald-400">{formatPrice(usd, 'USD')}</span>}
                                                {uzs === 0 && usd === 0 && <span className="text-base sm:text-lg font-bold text-slate-400">-</span>}
                                            </div>
                                        </div>
                                        <div className="bg-slate-50 dark:bg-slate-800 p-3 sm:p-4 rounded-2xl border border-slate-100 dark:border-slate-700 relative overflow-hidden group">
                                            <div className="absolute right-0 top-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity"><TrendingUp className="h-10 w-10 sm:h-12 sm:w-12" /></div>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">O'rtacha Chek</p>
                                            <div className="flex flex-col">
                                                {avg.uzs > 0 && <span className="text-base sm:text-lg font-black text-slate-900 dark:text-white">{formatPrice(avg.uzs, 'UZS')}</span>}
                                                {avg.usd > 0 && <span className="text-xs sm:text-sm font-bold text-blue-600 dark:text-blue-400">{formatPrice(avg.usd, 'USD')}</span>}
                                                {avg.uzs === 0 && avg.usd === 0 && <span className="text-base sm:text-lg font-bold text-slate-400">-</span>}
                                            </div>
                                        </div>
                                        <div className="bg-slate-50 dark:bg-slate-800 p-3 sm:p-4 rounded-2xl border border-slate-100 dark:border-slate-700 relative overflow-hidden group">
                                            <div className="absolute right-0 top-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity"><ShoppingBag className="h-10 w-10 sm:h-12 sm:w-12" /></div>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Buyurtmalar</p>
                                            <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">{selectedUser.orders?.filter(o => o.status !== 'fake').length || 0}</span>
                                        </div>
                                    </div>
                                );
                            })()}
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 pb-20">
                        {/* Admin Notes */}
                        <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 rounded-2xl p-4 sm:p-5 shadow-sm">
                            <div className="flex justify-between items-center mb-3">
                                <h3 className="font-bold text-amber-900 dark:text-amber-100 text-sm flex items-center gap-2"><StickyNote className="h-4 w-4" /> Admin Eslatmasi</h3>
                                {!isEditingNote ? (
                                    <button onClick={() => setIsEditingNote(true)} className="text-xs font-bold text-amber-700 hover:text-amber-900 flex items-center gap-1 bg-white/50 px-2 py-1 rounded transition-colors"><Edit2 className="h-3 w-3" /> Tahrirlash</button>
                                ) : (
                                    <div className="flex gap-2">
                                        <button onClick={() => setIsEditingNote(false)} className="text-xs text-slate-500 hover:text-slate-700">Bekor</button>
                                        <button onClick={handleSaveNote} className="text-xs font-bold text-white bg-amber-600 px-3 py-1 rounded hover:bg-amber-700 shadow-sm">Saqlash</button>
                                    </div>
                                )}
                            </div>
                            {isEditingNote ? (
                                <textarea 
                                    className="w-full bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-800 rounded-xl p-3 text-sm text-slate-700 dark:text-slate-300 focus:outline-none focus:border-amber-400"
                                    rows={3}
                                    value={noteText}
                                    onChange={(e) => setNoteText(e.target.value)}
                                    placeholder="Mijoz haqida muhim eslatma..."
                                    autoFocus
                                />
                            ) : (
                                <p className="text-sm text-slate-700 dark:text-slate-300 italic leading-relaxed">
                                    {selectedUser.adminNotes || "Hozircha eslatma yo'q."}
                                </p>
                            )}
                        </div>

                        {/* Order History */}
                        <div className="space-y-4">
                            <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 text-lg"><Clock className="h-5 w-5 text-indigo-500" /> Buyurtmalar Tarixi</h3>
                            {!selectedUser.orders || selectedUser.orders.length === 0 ? (
                                <div className="text-center py-12 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl bg-slate-50/50 dark:bg-slate-900/50 text-slate-400">
                                    <Archive className="h-10 w-10 mx-auto mb-2 opacity-50" />
                                    Buyurtmalar tarixi mavjud emas
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {selectedUser.orders.slice().reverse().map((order) => {
                                        const isFake = order.status === 'fake';
                                        const isCancelled = order.status === 'cancelled';
                                        const isCompleted = order.status === 'completed';
                                        
                                        return (
                                            <div key={order.id} className={`bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-all relative group overflow-hidden ${isFake ? 'opacity-60 bg-red-50/30' : ''}`}>
                                                <button onClick={() => setOrderToDelete(order.id)} className="absolute top-4 right-4 p-2 bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-red-500 rounded-lg opacity-0 group-hover:opacity-100 transition-all z-10"><Trash2 className="h-4 w-4" /></button>

                                                <div className="flex flex-col sm:flex-row justify-between gap-4 mb-4">
                                                    <div>
                                                        <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-1">
                                                            <span className="font-mono font-black text-indigo-600 dark:text-indigo-400 text-sm sm:text-base bg-indigo-50 dark:bg-indigo-900/20 px-2 py-0.5 rounded">#{order.id}</span>
                                                            <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded border ${order.source === 'website' ? 'bg-sky-50 text-sky-600 border-sky-100' : 'bg-purple-50 text-purple-600 border-purple-100'}`}>{order.source}</span>
                                                            {isCompleted && <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100"><CheckCircle className="h-3 w-3" /> BAJARILDI</span>}
                                                            {isFake && <span className="text-[10px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-100">FAKE/SPAM</span>}
                                                            {isCancelled && <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">BEKOR QILINDI</span>}
                                                        </div>
                                                        <span className="text-xs text-slate-400 font-medium flex items-center gap-1"><Calendar className="h-3 w-3" /> {new Date(order.date).toLocaleString('uz-UZ')}</span>
                                                        {order.location && <div className="mt-2">{renderLocation(order.location)}</div>}
                                                    </div>
                                                    
                                                    <div className="text-left sm:text-right">
                                                        <span className={`block font-black text-lg sm:text-xl mb-2 ${isFake || isCancelled ? 'line-through text-slate-300' : 'text-slate-900 dark:text-white'}`}>{order.totalAmount}</span>
                                                        <div className="flex sm:justify-end gap-1 flex-wrap">
                                                            {order.status === 'new' && (
                                                                <>
                                                                    <button onClick={() => handleChangeOrderStatus(order.id, 'completed')} className="px-3 py-1.5 bg-emerald-500 text-white text-xs font-bold rounded-lg hover:bg-emerald-600 shadow-lg shadow-emerald-500/20 transition-all active:scale-95 flex items-center gap-1"><CheckCircle className="h-3 w-3" /> Bajarildi</button>
                                                                    <button onClick={() => handleChangeOrderStatus(order.id, 'fake')} className="px-3 py-1.5 bg-red-100 text-red-600 text-xs font-bold rounded-lg hover:bg-red-200 transition-colors">Fake</button>
                                                                </>
                                                            )}
                                                            {(isCompleted || isFake || isCancelled) && (
                                                                <button onClick={() => handleChangeOrderStatus(order.id, 'new')} className="px-3 py-1.5 bg-slate-100 text-slate-500 text-xs font-bold rounded-lg hover:bg-slate-200 transition-colors flex items-center gap-1"><RotateCcw className="h-3 w-3" /> Qaytarish</button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="bg-slate-50 dark:bg-slate-950/50 p-3 sm:p-4 rounded-xl border border-slate-100 dark:border-slate-800 text-sm">
                                                    {order.items && order.items.length > 0 ? (
                                                        <div className="space-y-2">
                                                            {order.items.map((item, idx) => (
                                                                <div key={idx} className="flex justify-between items-center text-slate-700 dark:text-slate-300 border-b border-dashed border-slate-200 dark:border-slate-800 last:border-0 pb-1 last:pb-0 text-xs sm:text-sm">
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="w-5 h-5 flex items-center justify-center bg-white dark:bg-slate-800 rounded-full text-[10px] font-bold text-slate-400 border border-slate-200 dark:border-slate-700 shrink-0">{idx + 1}</span>
                                                                        <span className="truncate max-w-[150px] sm:max-w-none">{item.name}</span>
                                                                        {item.recommended && <span className="text-[9px] bg-blue-100 text-blue-600 px-1.5 rounded font-bold hidden sm:inline">AI</span>}
                                                                    </div>
                                                                    <div className="flex items-center gap-3">
                                                                        <span className="font-bold text-slate-400">x{item.quantity}</span>
                                                                        <span className="font-mono font-bold min-w-[60px] sm:min-w-[80px] text-right">{formatPrice(item.price * item.quantity, item.currency)}</span>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <p className="text-slate-600 dark:text-slate-400 whitespace-pre-wrap font-medium text-xs sm:text-sm">{order.itemsSummary}</p>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>

        {/* User Delete Modal */}
        <ConfirmModal 
            isOpen={!!deleteTarget}
            onClose={() => setDeleteTarget(null)}
            onConfirm={handleDeleteUser}
            title="Mijozni o'chirish"
            message="Siz rostdan ham ushbu mijozni va uning barcha ma'lumotlarini (buyurtmalar, chat tarixi) o'chirmoqchimisiz? Bu amalni ortga qaytarib bo'lmaydi."
        />

        {/* Order Delete Modal */}
        <ConfirmModal 
            isOpen={!!orderToDelete}
            onClose={() => setOrderToDelete(null)}
            onConfirm={handleDeleteOrder}
            title="Buyurtmani o'chirish"
            message="Ushbu buyurtmani o'chirib tashlamoqchimisiz? Bu amal statistikaga ta'sir qilishi mumkin."
        />
    </div>
  );
};
