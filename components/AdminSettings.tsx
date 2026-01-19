
import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { 
    Save, Layout, LayoutGrid, FileText, UserCheck, Megaphone, ShieldCheck, 
    RotateCcw, MoveUp, MoveDown, Trash2, Plus, Monitor, Smartphone, Tablet, CheckCircle, 
    Type, ImageIcon, Settings, Move, MoveHorizontal, Palette, AlignLeft, AlignCenter, AlignRight, X, Eye, EyeOff,
    Maximize2, Minimize2, Lock, Key, Bot, MessageSquare, Link as LinkIcon, Menu, Power, Smartphone as MobileIcon, User, Info, Users, Terminal, Grid, Key as KeyIcon, MessageCircle, Heart, Layers, Box, Database, Download, UploadCloud, Search, Filter, RefreshCw, Command, Globe, Fingerprint, TextCursorInput, MousePointerClick, Edit2, Navigation, Play, Pause, MousePointer2, CloudLightning, Server, AlertCircle, CheckCircle2
} from 'lucide-react';
import { SiteConfig, AdminUser, Page, SectionType, StyleConfig, BotConfig, TelegramProfileConfig, Treatment, WelcomeButton, TelegramMenuCommand, GradientConfig, TableSectionConfig, PageSection, BotCommand, FirebaseConfig } from '../types';
import { HeroSection } from './HeroSection';
import { AdBanner } from './AdBanner';
import { FeatureSection } from './FeatureSection';
import { ImageDiffSection } from './ImageDiffSection';
import { FaqSection } from './FaqSection';
import { TestimonialsSection } from './TestimonialsSection';
import { TableSection } from './TableSection';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { ChatWidget } from './ChatWidget';
import { DynamicPage } from './DynamicPage';
import { TreatmentCard } from './TreatmentCard';
import { saveSiteConfig, setTelegramMyCommands, syncTelegramProfile, saveAdmin, createBackup, restoreBackup } from '../services/db';
import { migrateDataToFirebase } from '../services/firebase';
import { GradientPicker } from './GradientPicker';
import { TOTP, Secret } from 'otpauth';
import QRCode from 'qrcode';

interface AdminSettingsProps {
    currentConfig: SiteConfig;
    currentUser: AdminUser;
    onPreviewDarkMode?: (color: string | null) => void;
    onUpdateUser: (user: AdminUser) => void;
}

const generateCSS = (g?: GradientConfig) => {
    if (!g) return undefined;
    const stopsStr = g.stops
        .sort((a, b) => a.position - b.position)
        .map(s => {
            return `${s.color} ${s.position}%`;
        })
        .join(', ');

    if (g.type === 'linear') return `linear-gradient(${g.angle}deg, ${stopsStr})`;
    if (g.type === 'radial') return `radial-gradient(circle at center, ${stopsStr})`;
    if (g.type === 'conic') return `conic-gradient(from ${g.angle}deg at 50% 50%, ${stopsStr})`;
    return undefined;
};

const CommandEditorModal: React.FC<{
    command: BotCommand;
    isOpen: boolean;
    onClose: () => void;
    onSave: (updated: BotCommand) => void;
}> = ({ command, isOpen, onClose, onSave }) => {
    const [data, setData] = useState<BotCommand>(command);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => { setData(command); }, [command]);

    if (!isOpen) return null;

    const handleMediaUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            Array.from(files).forEach(file => {
                const reader = new FileReader();
                reader.onload = (ev) => {
                    const res = ev.target?.result as string;
                    if (res) {
                        const base64 = res.split(',')[1];
                        setData(prev => ({
                            ...prev,
                            media: [...(prev.media || []), { type: 'photo', url: base64 }]
                        }));
                    }
                };
                reader.readAsDataURL(file as Blob);
            });
        }
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const removeMedia = (idx: number) => {
        setData(prev => ({
            ...prev,
            media: prev.media?.filter((_, i) => i !== idx)
        }));
    };

    const addButton = () => {
        setData(prev => ({
            ...prev,
            buttons: [...(prev.buttons || []), { id: `btn-${Date.now()}`, text: 'Tugma', url: 'https://' }]
        }));
    };

    const updateButton = (idx: number, field: 'text' | 'url', val: string) => {
        setData(prev => ({
            ...prev,
            buttons: prev.buttons?.map((b, i) => i === idx ? { ...b, [field]: val } : b)
        }));
    };

    const removeButton = (idx: number) => {
        setData(prev => ({
            ...prev,
            buttons: prev.buttons?.filter((_, i) => i !== idx)
        }));
    };

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
                <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                    <h3 className="font-bold text-lg text-slate-800 dark:text-white flex items-center gap-2">
                        <Terminal className="h-5 w-5 text-indigo-500" /> Buyruq Tahrirlash
                    </h3>
                    <button onClick={onClose} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded"><X className="h-5 w-5" /></button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                    {/* Trigger */}
                    <div>
                        <div className="flex justify-between items-start mb-1">
                            <label className="text-xs font-bold text-slate-500 uppercase block">Buyruq (Trigger)</label>
                            <label className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase cursor-pointer select-none">
                                <input 
                                    type="checkbox" 
                                    checked={data.showInMenu !== false} 
                                    onChange={(e) => setData({ ...data, showInMenu: e.target.checked })} 
                                    className="w-3.5 h-3.5 rounded accent-primary" 
                                />
                                Menyuda ko'rsatish
                            </label>
                        </div>
                        <input 
                            value={data.command} 
                            onChange={(e) => setData({ ...data, command: e.target.value })} 
                            className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold" 
                            placeholder="Masalan: Narxlar" 
                        />
                        <p className="text-[10px] text-slate-400 mt-1">Foydalanuvchi shu so'zni yozganda javob qaytariladi.</p>
                    </div>

                    {/* Response Text */}
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Javob Matni</label>
                        <textarea 
                            value={data.response} 
                            onChange={(e) => setData({ ...data, response: e.target.value })} 
                            className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm min-h-[120px]" 
                            placeholder="Salom, bizning narxlar..." 
                        />
                        <p className="text-[10px] text-slate-400 mt-1">HTML formatini qo'llab-quvvatlaydi (b, i, a href...).</p>
                    </div>

                    {/* Media */}
                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <label className="text-xs font-bold text-slate-500 uppercase">Media (Rasm/Video)</label>
                            <button onClick={() => fileInputRef.current?.click()} className="text-xs bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 px-2 py-1 rounded hover:bg-indigo-100 transition-colors flex items-center gap-1">
                                <Plus className="h-3 w-3" /> Qo'shish
                            </button>
                            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" multiple onChange={handleMediaUpload} />
                        </div>
                        
                        {data.media && data.media.length > 0 ? (
                            <div className="flex gap-2 overflow-x-auto pb-2">
                                {data.media.map((m, idx) => (
                                    <div key={idx} className="relative w-20 h-20 shrink-0 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 group">
                                        <img src={`data:image/jpeg;base64,${m.url}`} className="w-full h-full object-cover" alt="" />
                                        <button onClick={() => removeMedia(idx)} className="absolute top-1 right-1 bg-red-500 text-white p-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity"><X className="h-3 w-3" /></button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center p-4 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-slate-400 text-xs">Media yo'q</div>
                        )}
                    </div>

                    {/* Buttons */}
                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <label className="text-xs font-bold text-slate-500 uppercase">Inline Tugmalar</label>
                            <button onClick={addButton} className="text-xs bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 px-2 py-1 rounded hover:bg-indigo-100 transition-colors flex items-center gap-1">
                                <Plus className="h-3 w-3" /> Qo'shish
                            </button>
                        </div>
                        <div className="space-y-2">
                            {data.buttons?.map((btn, idx) => (
                                <div key={idx} className="flex gap-2 items-center bg-slate-50 dark:bg-slate-800 p-2 rounded-lg border border-slate-200 dark:border-slate-700">
                                    <input value={btn.text} onChange={(e) => updateButton(idx, 'text', e.target.value)} className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded px-2 py-1 text-xs" placeholder="Tugma nomi" />
                                    <input value={btn.url} onChange={(e) => updateButton(idx, 'url', e.target.value)} className="flex-[2] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded px-2 py-1 text-xs text-blue-500" placeholder="URL" />
                                    <button onClick={() => removeButton(idx)} className="text-red-400 hover:text-red-500"><Trash2 className="h-4 w-4" /></button>
                                </div>
                            ))}
                            {(!data.buttons || data.buttons.length === 0) && <p className="text-xs text-slate-400 italic">Tugmalar yo'q</p>}
                        </div>
                    </div>
                </div>

                <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
                    <button onClick={onClose} className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl text-sm font-bold">Bekor qilish</button>
                    <button onClick={() => { onSave(data); onClose(); }} className="px-4 py-2 bg-primary text-white rounded-xl text-sm font-bold hover:opacity-90">Saqlash</button>
                </div>
            </div>
        </div>,
        document.body
    );
};

const BotSettingsSection: React.FC<{
    botConfig?: BotConfig;
    telegramConfig?: SiteConfig['telegram'];
    telegramProfile?: TelegramProfileConfig;
    onUpdate: (config: Partial<BotConfig>) => void;
    onUpdateTelegram: (config: any) => void;
    onUpdateProfile: (config: TelegramProfileConfig) => void;
}> = ({ botConfig, telegramConfig, telegramProfile, onUpdate, onUpdateTelegram, onUpdateProfile }) => {
    const [subTab, setSubTab] = useState<'general' | 'profile' | 'messages' | 'buttons' | 'commands'>('general');
    const [isSyncing, setIsSyncing] = useState(false);
    const [editingCommand, setEditingCommand] = useState<BotCommand | null>(null);

    const handleSyncCommands = async () => {
        if (!telegramConfig?.botToken) return alert("Bot Token kiritilmagan");
        setIsSyncing(true);
        try {
            const res = await setTelegramMyCommands(telegramConfig.botToken, botConfig?.telegramMenuCommands || []);
            if(res.ok) alert("Buyruqlar Telegramga muvaffaqiyatli yuklandi!");
            else alert("Xatolik: " + res.description);
        } catch(e) { alert("Tarmoq xatoligi"); }
        setIsSyncing(false);
    };

    const handleSyncProfile = async () => {
        if (!telegramConfig?.botToken) return alert("Bot Token kiritilmagan");
        setIsSyncing(true);
        try {
            const results = await syncTelegramProfile(telegramConfig.botToken, telegramProfile || {});
            const failed = results.filter(r => !r.ok);
            if(failed.length === 0) alert("Profil muvaffaqiyatli yangilandi!");
            else alert(`Ba'zi sozlarmalar o'xshamadi:\n${failed.map(f => f.action).join(', ')}`);
        } catch(e) { alert("Tarmoq xatoligi"); }
        setIsSyncing(false);
    };

    const handleSaveCommand = (updatedCmd: BotCommand) => {
        const newCmds = botConfig?.customCommands?.map(c => c.id === updatedCmd.id ? updatedCmd : c) || [];
        const exists = botConfig?.customCommands?.find(c => c.id === updatedCmd.id);
        if (!exists) {
             onUpdate({ customCommands: [...(botConfig?.customCommands || []), updatedCmd] });
        } else {
             onUpdate({ customCommands: newCmds });
        }
    };

    const deleteCommand = (id: string) => onUpdate({ customCommands: botConfig?.customCommands?.filter(c => c.id !== id) });
    const createNewCommand = () => {
        setEditingCommand({ id: `cmd-${Date.now()}`, command: '', response: '', media: [], buttons: [] });
    };

    const updateMenuCommand = (id: string, field: keyof TelegramMenuCommand, val: any) => {
        const newCmds = botConfig?.telegramMenuCommands?.map(c => c.id === id ? { ...c, [field]: val } : c) || [];
        onUpdate({ telegramMenuCommands: newCmds });
    };
    const addMenuCommand = () => onUpdate({ telegramMenuCommands: [...(botConfig?.telegramMenuCommands || []), { id: `mc-${Date.now()}`, command: 'command', description: 'Description', enabled: true }] });
    const deleteMenuCommand = (id: string) => onUpdate({ telegramMenuCommands: botConfig?.telegramMenuCommands?.filter(c => c.id !== id) });

    const addWelcomeButton = () => {
        const current = botConfig?.welcomeButtons || [];
        onUpdate({ welcomeButtons: [...current, { id: `wb-${Date.now()}`, text: 'Kanalga o\'tish', url: 'https://t.me/' }] });
    };

    const updateWelcomeButton = (idx: number, field: 'text' | 'url', val: string) => {
        const current = [...(botConfig?.welcomeButtons || [])];
        if(current[idx]) {
            current[idx] = { ...current[idx], [field]: val };
            onUpdate({ welcomeButtons: current });
        }
    };

    const removeWelcomeButton = (idx: number) => {
        const current = [...(botConfig?.welcomeButtons || [])];
        current.splice(idx, 1);
        onUpdate({ welcomeButtons: current });
    };

    return (
        <div className="flex flex-col md:flex-row gap-6">
            {editingCommand && (
                <CommandEditorModal 
                    command={editingCommand} 
                    isOpen={!!editingCommand} 
                    onClose={() => setEditingCommand(null)} 
                    onSave={handleSaveCommand} 
                />
            )}

            <div className="w-full md:w-48 flex flex-row md:flex-col gap-2 overflow-x-auto md:overflow-visible pb-2 md:pb-0 border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-700 pr-0 md:pr-4">
                <button onClick={() => setSubTab('general')} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-bold transition-colors whitespace-nowrap ${subTab === 'general' ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'}`}><Settings className="h-4 w-4"/> Asosiy</button>
                <button onClick={() => setSubTab('profile')} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-bold transition-colors whitespace-nowrap ${subTab === 'profile' ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'}`}><Fingerprint className="h-4 w-4"/> Profil</button>
                <button onClick={() => setSubTab('messages')} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-bold transition-colors whitespace-nowrap ${subTab === 'messages' ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'}`}><MessageSquare className="h-4 w-4"/> Xabarlar</button>
                <button onClick={() => setSubTab('buttons')} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-bold transition-colors whitespace-nowrap ${subTab === 'buttons' ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'}`}><MousePointerClick className="h-4 w-4"/> Tugmalar</button>
                <button onClick={() => setSubTab('commands')} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-bold transition-colors whitespace-nowrap ${subTab === 'commands' ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'}`}><Terminal className="h-4 w-4"/> Buyruqlar</button>
            </div>

            <div className="flex-1 min-w-0">
                {subTab === 'general' && (
                    <div className="space-y-6 animate-fade-in">
                        <div className="grid grid-cols-1 gap-6">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Bot Token</label>
                                <input type="text" value={telegramConfig?.botToken || ''} onChange={(e) => onUpdateTelegram({ botToken: e.target.value })} className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm" placeholder="123456:ABC-DEF..." />
                                <p className="text-[10px] text-slate-400 mt-1">BotFather dan olingan token.</p>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Admin ID(s)</label>
                                <input type="text" value={telegramConfig?.adminId || ''} onChange={(e) => onUpdateTelegram({ adminId: e.target.value })} className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm" placeholder="12345678, 87654321" />
                                <p className="text-[10px] text-slate-400 mt-1">Vergul bilan ajratilgan Telegram ID raqamlar.</p>
                            </div>
                        </div>
                        
                        <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                            <h3 className="font-bold text-sm mb-2">Welcome Message (/start)</h3>
                            <textarea value={botConfig?.welcomeMessage || ''} onChange={(e) => onUpdate({ welcomeMessage: e.target.value })} className="w-full p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl h-32 text-sm" />
                            <p className="text-[10px] text-slate-400 mt-1">O'zgaruvchilar: $username, $first_name, $fullname</p>
                            
                            <div className="mt-4 border-t border-slate-200 dark:border-slate-700 pt-4">
                                <div className="flex justify-between items-center mb-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase">Inline Tugmalar (URL)</label>
                                    <button onClick={addWelcomeButton} className="text-xs bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 px-2 py-1 rounded hover:bg-indigo-100 transition-colors flex items-center gap-1">
                                        <Plus className="h-3 w-3" /> Qo'shish
                                    </button>
                                </div>
                                <div className="space-y-2">
                                    {botConfig?.welcomeButtons?.map((btn, idx) => (
                                        <div key={btn.id || idx} className="flex gap-2 items-center">
                                            <input 
                                                value={btn.text} 
                                                onChange={(e) => updateWelcomeButton(idx, 'text', e.target.value)} 
                                                className="flex-1 p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                                                placeholder="Tugma matni"
                                            />
                                            <input 
                                                value={btn.url} 
                                                onChange={(e) => updateWelcomeButton(idx, 'url', e.target.value)} 
                                                className="flex-[2] p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-blue-500"
                                                placeholder="https://..."
                                            />
                                            <button onClick={() => removeWelcomeButton(idx)} className="p-2 text-red-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded">
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    ))}
                                    {(!botConfig?.welcomeButtons || botConfig.welcomeButtons.length === 0) && (
                                        <p className="text-xs text-slate-400 italic">Tugmalar yo'q</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {subTab === 'profile' && (
                    <div className="space-y-6 animate-fade-in">
                        <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                            <h3 className="font-bold text-sm mb-4">Bot Profili</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Bot Nomi</label>
                                    <input value={telegramProfile?.botName || ''} onChange={(e) => onUpdateProfile({ ...telegramProfile, botName: e.target.value })} className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm" />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Qisqa Tavsif (About)</label>
                                    <textarea value={telegramProfile?.shortDescription || ''} onChange={(e) => onUpdateProfile({ ...telegramProfile, shortDescription: e.target.value })} className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm h-16" />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase block mb-1">To'liq Tavsif (Description)</label>
                                    <textarea value={telegramProfile?.description || ''} onChange={(e) => onUpdateProfile({ ...telegramProfile, description: e.target.value })} className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm h-24" />
                                </div>
                            </div>
                            <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 flex justify-end">
                                <button onClick={handleSyncProfile} disabled={isSyncing} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 disabled:opacity-50">
                                    {isSyncing ? "Yuklanmoqda..." : "Telegramga Yuklash"}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {subTab === 'messages' && (
                    <div className="grid grid-cols-1 gap-4 animate-fade-in">
                        {Object.entries(botConfig?.messages || {}).map(([key, val]) => (
                            <div key={key}>
                                <label className="text-xs font-bold text-slate-500 uppercase block mb-1">{key}</label>
                                <textarea 
                                    value={val} 
                                    onChange={(e) => onUpdate({ messages: { ...botConfig?.messages, [key]: e.target.value } as any })} 
                                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm" 
                                    rows={2}
                                />
                            </div>
                        ))}
                    </div>
                )}

                {subTab === 'buttons' && (
                    <div className="space-y-6 animate-fade-in">
                        <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                            <h3 className="font-bold text-sm mb-3">Menyu Tugmalari (Asosiy Keyboard)</h3>
                            <div className="grid grid-cols-2 gap-4">
                                {Object.entries(botConfig?.menuButtons || {}).map(([key, val]) => (
                                    <div key={key}>
                                        <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">{key}</label>
                                        <input 
                                            value={val} 
                                            onChange={(e) => onUpdate({ menuButtons: { ...botConfig?.menuButtons, [key]: e.target.value } as any })} 
                                            className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                            <h3 className="font-bold text-sm mb-3">Inline Tugmalar (Xabarlar ostida)</h3>
                            <div className="grid grid-cols-2 gap-4">
                                {Object.entries(botConfig?.inlineButtons || {}).map(([key, val]) => (
                                    <div key={key}>
                                        <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">{key}</label>
                                        <input 
                                            value={val} 
                                            onChange={(e) => onUpdate({ inlineButtons: { ...botConfig?.inlineButtons, [key]: e.target.value } as any })} 
                                            className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {subTab === 'commands' && (
                    <div className="space-y-8 animate-fade-in">
                        <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-bold text-sm">Menyu Buyruqlari (BotMenu)</h3>
                                <div className="flex gap-2">
                                    <button onClick={addMenuCommand} className="text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"><Plus className="h-3 w-3 inline" /> Qo'shish</button>
                                    <button onClick={handleSyncCommands} disabled={isSyncing} className="text-xs bg-indigo-600 text-white px-2 py-1 rounded hover:bg-indigo-700 disabled:opacity-50 transition-colors">{isSyncing ? '...' : 'Telegramga Yuklash'}</button>
                                </div>
                            </div>
                            <div className="space-y-2">
                                {botConfig?.telegramMenuCommands?.map((cmd, idx) => (
                                    <div key={cmd.id || idx} className="flex gap-2 items-center bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200 dark:border-slate-700">
                                        <input type="checkbox" checked={cmd.enabled} onChange={(e) => updateMenuCommand(cmd.id, 'enabled', e.target.checked)} className="accent-primary w-4 h-4" />
                                        <span className="text-slate-400 font-mono">/</span>
                                        <input value={cmd.command} onChange={(e) => updateMenuCommand(cmd.id, 'command', e.target.value)} className="w-24 p-1 bg-transparent border-b border-slate-200 dark:border-slate-700 text-sm font-mono" placeholder="start" />
                                        <input value={cmd.description} onChange={(e) => updateMenuCommand(cmd.id, 'description', e.target.value)} className="flex-1 p-1 bg-transparent border-b border-slate-200 dark:border-slate-700 text-sm" placeholder="Tavsif" />
                                        <button onClick={() => deleteMenuCommand(cmd.id)} className="text-red-400 hover:text-red-500"><Trash2 className="h-4 w-4" /></button>
                                    </div>
                                ))}
                                {(!botConfig?.telegramMenuCommands || botConfig.telegramMenuCommands.length === 0) && <p className="text-xs text-slate-400 italic">Buyruqlar yo'q</p>}
                            </div>
                        </div>

                        <div>
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-bold text-sm">Maxsus Javoblar (Auto-Reply)</h3>
                                <button onClick={createNewCommand} className="bg-primary text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:opacity-90 flex items-center gap-1"><Plus className="h-3 w-3" /> Yangi Javob</button>
                            </div>
                            <div className="grid grid-cols-1 gap-3">
                                {botConfig?.customCommands?.map(cmd => (
                                    <div key={cmd.id} className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:shadow-md transition-shadow">
                                        <div>
                                            <p className="font-bold text-sm text-slate-800 dark:text-white flex items-center gap-2">
                                                <Terminal className="h-3 w-3 text-indigo-500" /> {cmd.command}
                                                {cmd.showInMenu && <span className="text-[9px] bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded text-slate-500">MENU</span>}
                                            </p>
                                            <p className="text-xs text-slate-500 truncate max-w-[200px]">{cmd.response}</p>
                                        </div>
                                        <div className="flex gap-2">
                                            <button onClick={() => setEditingCommand(cmd)} className="p-2 text-slate-400 hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"><Edit2 className="h-4 w-4" /></button>
                                            <button onClick={() => deleteCommand(cmd.id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"><Trash2 className="h-4 w-4" /></button>
                                        </div>
                                    </div>
                                ))}
                                {(!botConfig?.customCommands || botConfig.customCommands.length === 0) && (
                                    <div className="text-center p-8 bg-slate-50 dark:bg-slate-800 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 text-slate-400 text-sm">
                                        Maxsus javoblar qo'shilmagan
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export const AdminSettings: React.FC<AdminSettingsProps> = ({ currentConfig, currentUser, onPreviewDarkMode, onUpdateUser }) => {
  const [formData, setFormData] = useState<SiteConfig>(currentConfig);
  const [tab, setTab] = useState<'visuals' | 'layout' | 'pages' | 'bot' | 'security' | 'backup'>('visuals');
  const [isSaved, setIsSaved] = useState(true);
  
  // Security Tab States
  const [credEmail, setCredEmail] = useState(currentUser.email);
  const [credPassword, setCredPassword] = useState('');
  const [setup2FAStep, setSetup2FAStep] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [tempSecret, setTempSecret] = useState<string | null>(null);
  const [verifyCode, setVerifyCode] = useState('');

  // Pages Tab State
  const [newPageTitle, setNewPageTitle] = useState('');
  const [newPageSlug, setNewPageSlug] = useState('');

  // Layout Tab State
  const availableSections: SectionType[] = ['hero', 'banner', 'products', 'features', 'diff', 'faq', 'testimonials', 'table'];

  // Visuals (Preview) Tab State
  const [activePageId, setActivePageId] = useState<string>('home');
  const [previewMode, setPreviewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [previewDarkMode, setPreviewDarkMode] = useState(false);
  const [showNavbarSettings, setShowNavbarSettings] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

  // PRODUCT SETTINGS IN PREVIEW
  const [showProductSettings, setShowProductSettings] = useState(false);
  const [prodSettingsPos, setProdSettingsPos] = useState({ x: 20, y: 100 });
  const isDraggingProdSettings = useRef(false);
  const prodDragStartPos = useRef({ x: 0, y: 0 });

  // Migration State
  const [migrationStatus, setMigrationStatus] = useState<'idle' | 'running' | 'success' | 'error'>('idle');
  const [migrationSummary, setMigrationSummary] = useState<{ total: number, errors: number } | null>(null);

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
      const handleResize = () => setIsMobile(window.innerWidth < 768);
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
      setFormData(currentConfig);
  }, [currentConfig]);

  useEffect(() => {
      if (onPreviewDarkMode) {
          onPreviewDarkMode(previewDarkMode ? (formData.darkModeColor || '#020617') : null);
      }
  }, [previewDarkMode, formData.darkModeColor, onPreviewDarkMode]);

  useEffect(() => {
      const handleMove = (e: MouseEvent | TouchEvent) => {
          if (isDraggingProdSettings.current) {
              const clientX = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
              const clientY = 'touches' in e ? e.touches[0].clientY : (e as MouseEvent).clientY;
              setProdSettingsPos({ x: clientX - prodDragStartPos.current.x, y: clientY - prodDragStartPos.current.y });
          }
      };
      const handleUp = () => { isDraggingProdSettings.current = false; };
      if (showProductSettings) {
          window.addEventListener('mousemove', handleMove);
          window.addEventListener('mouseup', handleUp);
          window.addEventListener('touchmove', handleMove);
          window.addEventListener('touchend', handleUp);
      }
      return () => {
          window.removeEventListener('mousemove', handleMove);
          window.removeEventListener('mouseup', handleUp);
          window.removeEventListener('touchmove', handleMove);
          window.removeEventListener('touchend', handleUp);
      }
  }, [showProductSettings]);

  const handleProdSettingsDragStart = (e: React.MouseEvent | React.TouchEvent) => {
      if (isMobile) return;
      isDraggingProdSettings.current = true;
      const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
      prodDragStartPos.current = { x: clientX - prodSettingsPos.x, y: clientY - prodSettingsPos.y };
  };

  const updateConfig = (updates: Partial<SiteConfig>) => {
      setFormData(prev => ({ ...prev, ...updates }));
      setIsSaved(false);
  };

  const handleStyleUpdate = (styleUpdates: Partial<StyleConfig>) => {
      updateConfig({ style: { ...formData.style, ...styleUpdates } });
  };
  
  const handleCardConfigUpdate = (cardUpdates: Partial<any>) => {
      handleStyleUpdate({ cardConfig: { ...formData.style?.cardConfig, ...cardUpdates } });
  };

  const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      await saveSiteConfig(formData);
      setIsSaved(true);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, callback: (base64: string) => void) => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onload = (ev) => {
              const res = ev.target?.result as string;
              if (res) callback(res.split(',')[1]);
          };
          reader.readAsDataURL(file);
      }
      if (logoInputRef.current) logoInputRef.current.value = '';
  };

  const handleSaveCredentials = async () => { 
      if (credEmail && currentUser) { 
          const updatedUser = { ...currentUser, email: credEmail, password: credPassword || currentUser.password }; 
          await saveAdmin(updatedUser);
          onUpdateUser(updatedUser); 
          alert("Login ma'lumotlari yangilandi"); 
          setCredPassword(''); 
      } 
  };
  const start2FASetup = async () => { 
      try {
          const secret = new Secret({ size: 20 }); 
          setTempSecret(secret.base32); 
          
          const totp = new TOTP({
              issuer: formData.twoFactorIssuer || "Stomatologiya Admin",
              label: currentUser.email,
              algorithm: "SHA1",
              digits: 6,
              period: 30,
              secret: secret
          });
          const uri = totp.toString();
          
          const qr = await QRCode.toDataURL(uri); 
          setQrCodeUrl(qr); 
          setSetup2FAStep(true); 
      } catch (e) {
          console.error("2FA Setup Error:", e);
          alert("Xatolik yuz berdi: " + (e as any).message);
      }
  };
  const confirm2FASetup = async () => { 
      if (!tempSecret) return; 
      try {
          const totp = new TOTP({ 
              secret: Secret.fromBase32(tempSecret),
              algorithm: 'SHA1',
              digits: 6,
              period: 30
          }); 
          const delta = totp.validate({ token: verifyCode, window: 1 }); 
          if (delta !== null) { 
              const updatedUser = { ...currentUser, isTwoFactorEnabled: true, twoFactorSecret: tempSecret };
              await saveAdmin(updatedUser);
              onUpdateUser(updatedUser); 
              setSetup2FAStep(false); 
              alert("2FA muvaffaqiyatli yoqildi!"); 
          } else { 
              alert("Kod noto'g'ri"); 
          } 
      } catch (e) {
          console.error("2FA Confirm Error:", e);
          alert("Kod xato yoki tizim xatoligi");
      }
  };
  const handleDisable2FA = async () => { 
      if (confirm("2FA himoyasini o'chirmoqchimisiz?")) { 
          const updatedUser = { ...currentUser, isTwoFactorEnabled: false, twoFactorSecret: undefined };
          await saveAdmin(updatedUser);
          onUpdateUser(updatedUser); 
          alert("2FA o'chirildi.");
      } 
  };

  const handleDownloadBackup = async () => { 
      const backup = await createBackup(); 
      const blob = new Blob([JSON.stringify(backup)], { type: 'application/json' }); 
      const url = URL.createObjectURL(blob); 
      const a = document.createElement('a'); 
      a.href = url; 
      a.download = `backup_${Date.now()}.json`; 
      a.click(); 
  };
  const handleRestoreBackup = async (e: React.ChangeEvent<HTMLInputElement>) => { 
      const file = e.target.files?.[0]; 
      if (file) { 
          const reader = new FileReader(); 
          reader.onload = async (ev) => { 
              try { 
                  const data = JSON.parse(ev.target?.result as string); 
                  await restoreBackup(data); 
                  alert("Ma'lumotlar tiklandi! Sahifani yangilang."); 
                  window.location.reload(); 
              } catch (err) { alert("Xatolik yuz berdi"); } 
          }; 
          reader.readAsText(file); 
      } 
  };

  const handleFirebaseMigration = async () => {
      if (!confirm("Diqqat! Barcha ma'lumotlar Firebase bulutli bazasiga nusxalanadi.\n\nDavom etishni xohlaysizmi?")) return;
      await saveSiteConfig(formData);
      setIsSaved(true);
      setMigrationStatus('running');
      setMigrationSummary(null);
      try {
          const backup = await createBackup();
          const result = await migrateDataToFirebase(backup, formData.firebaseConfig);
          setMigrationSummary({ total: result.totalMigrated, errors: result.errors });
          setMigrationStatus('success');
      } catch (e) {
          console.error(e);
          setMigrationStatus('error');
      }
  };

  const updateFirebaseConfig = (field: keyof FirebaseConfig, val: string) => {
      const current = formData.firebaseConfig || {
          apiKey: '', authDomain: '', projectId: '', storageBucket: '', messagingSenderId: '', appId: '', measurementId: ''
      };
      updateConfig({ firebaseConfig: { ...current, [field]: val } });
  };

  const handleAddPage = () => { const newPage: Page = { id: `p-${Date.now()}`, title: newPageTitle, slug: newPageSlug || newPageTitle.toLowerCase().replace(/\s+/g, '-'), sections: [] }; updateConfig({ pages: [...(formData.pages || []), newPage] }); setNewPageTitle(''); setNewPageSlug(''); };
  const handleDeletePage = (id: string) => { if (confirm("Sahifani o'chirmoqchimisiz?")) { updateConfig({ pages: formData.pages?.filter(p => p.id !== id) }); } };
  const handleResetLayout = () => { updateConfig({ homeSectionOrder: ['hero', 'banner', 'products', 'features', 'diff', 'faq', 'testimonials', 'table'] }); };
  const handleMoveSection = (index: number, direction: 'up' | 'down') => { const newOrder = [...(formData.homeSectionOrder || [])]; if (direction === 'up' && index > 0) { [newOrder[index], newOrder[index - 1]] = [newOrder[index - 1], newOrder[index]]; } else if (direction === 'down' && index < newOrder.length - 1) { [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]]; } updateConfig({ homeSectionOrder: newOrder }); };
  const handleRemoveSection = (section: string) => { updateConfig({ homeSectionOrder: (formData.homeSectionOrder || []).filter(s => s !== section) }); };
  const handleAddSectionToLayout = (section: SectionType) => { updateConfig({ homeSectionOrder: [...(formData.homeSectionOrder || []), section] }); };
  const handleBotConfigUpdate = (config: Partial<BotConfig>) => { updateConfig({ botConfig: { ...formData.botConfig, ...config } as BotConfig }); };
  const handleTelegramConfigUpdate = (config: any) => { updateConfig({ telegram: { ...formData.telegram, ...config } }); };
  const handleTelegramProfileUpdate = (profile: TelegramProfileConfig) => { updateConfig({ botConfig: { ...formData.botConfig, telegramProfile: profile } as any }); };
  const handleToggleHomeLink = (checked: boolean) => { updateConfig({ showHomeLink: checked }); };
  const handleUpdatePage = (updatedPage: Page) => { const newPages = formData.pages?.map(p => p.id === updatedPage.id ? updatedPage : p) || []; updateConfig({ pages: newPages }); };
  const handleFooterUpdate = (updates: any) => { updateConfig({ footer: { ...formData.footer, ...updates } }); };

  const renderPreviewSection = (type: SectionType) => {
      switch (type) {
          case 'hero':
              return (
                  <HeroSection 
                      onImageSelected={() => {}} 
                      isAdmin={false} 
                      onAdminLoginClick={() => {}} 
                      config={formData} 
                      isEditing={true} 
                      onUpdateConfig={updateConfig} 
                      onMediaUpdate={(media) => updateConfig({ heroMedia: media })} 
                  />
              );
          case 'banner': return (
              <AdBanner 
                  ads={formData.bannerAds || []} 
                  config={formData.adConfig} 
                  isEditing={true} 
                  onConfigUpdate={(conf) => updateConfig({ adConfig: { ...formData.adConfig, ...conf } })} 
                  onAdAdd={(newAd) => updateConfig({ bannerAds: [...(formData.bannerAds || []), newAd] })}
                  onAdUpdate={(updatedAd) => updateConfig({ bannerAds: formData.bannerAds?.map(ad => ad.id === updatedAd.id ? updatedAd : ad) })}
                  onAdDelete={(id) => updateConfig({ bannerAds: formData.bannerAds?.filter(ad => ad.id !== id) })}
              />
          );
          case 'features': return (
              <FeatureSection 
                  cards={formData.featureCards || []} 
                  style={formData.style} 
                  config={formData.featureSectionConfig} 
                  isEditing={true} 
                  onConfigUpdate={(conf) => updateConfig({ featureSectionConfig: { ...formData.featureSectionConfig, ...conf } })} 
                  onCardUpdate={(id, field, val) => updateConfig({ featureCards: formData.featureCards?.map(c => c.id === id ? { ...c, [field]: val } : c) })} 
                  onCardAdd={() => updateConfig({ featureCards: [...(formData.featureCards || []), { id: `fc-${Date.now()}`, title: 'Yangi Karta', description: 'Tavsif...', linkText: 'Batafsil' }] })}
                  onCardDelete={(id) => updateConfig({ featureCards: formData.featureCards?.filter(c => c.id !== id) })}
                  onCardDuplicate={(id) => {
                      const card = formData.featureCards?.find(c => c.id === id);
                      if (card) {
                           const newCard = JSON.parse(JSON.stringify(card));
                           newCard.id = `fc-${Date.now()}`;
                           updateConfig({ featureCards: [...(formData.featureCards || []), newCard] });
                      }
                  }}
                  onCardReorder={(dragIndex, dropIndex) => {
                      const cards = [...(formData.featureCards || [])];
                      const [moved] = cards.splice(dragIndex, 1);
                      cards.splice(dropIndex, 0, moved);
                      updateConfig({ featureCards: cards });
                  }}
              />
          );
          case 'diff': return (
              <ImageDiffSection 
                  items={formData.imageDiffs || []} 
                  config={formData.diffSectionConfig} 
                  style={formData.style} 
                  isEditing={true} 
                  onUpdateConfig={(conf) => updateConfig({ diffSectionConfig: { ...formData.diffSectionConfig, ...conf } })} 
                  onAddItem={() => updateConfig({ imageDiffs: [...(formData.imageDiffs || []), { id: `diff-${Date.now()}`, beforeImage: '', afterImage: '', label: 'Yangi Natija' }] })}
                  onDeleteItem={(id) => updateConfig({ imageDiffs: formData.imageDiffs?.filter(i => i.id !== id) })}
                  onUpdateItem={(id, updates) => updateConfig({ imageDiffs: formData.imageDiffs?.map(i => i.id === id ? { ...i, ...updates } : i) })}
                  onDuplicateItem={(id) => {
                      const item = formData.imageDiffs?.find(i => i.id === id);
                      if (item) updateConfig({ imageDiffs: [...(formData.imageDiffs || []), { ...item, id: `diff-${Date.now()}` }] });
                  }}
              />
          );
          case 'faq': return <FaqSection items={formData.faqItems || []} title={formData.faqTitle} subtitle={formData.faqSubtitle} config={formData.faqConfig} style={formData.style} isEditing={true} onUpdateConfig={(conf) => updateConfig({ faqConfig: { ...formData.faqConfig, ...conf } })} />;
          case 'testimonials': return (
                <TestimonialsSection 
                    items={formData.testimonials || []} 
                    title={formData.testimonialsTitle} 
                    subtitle={formData.testimonialsSubtitle} 
                    style={formData.style} 
                    config={formData.testimonialsConfig} 
                    isEditing={true} 
                    onUpdateConfig={(conf) => updateConfig({ ...conf, testimonialsConfig: { ...formData.testimonialsConfig, ...conf } })} 
                    onAddItem={() => updateConfig({ testimonials: [...(formData.testimonials || []), { id: `t-${Date.now()}`, name: 'Ism', text: 'Fikr matni...', rating: 5 }] })}
                    onDeleteItem={(id) => updateConfig({ testimonials: formData.testimonials?.filter(t => t.id !== id) })}
                    onUpdateItem={(id, field, val) => updateConfig({ testimonials: formData.testimonials?.map(t => t.id === id ? { ...t, [field]: val } : t) })}
                    onDuplicateItem={(id) => {
                        const item = formData.testimonials?.find(t => t.id === id);
                        if (item) updateConfig({ testimonials: [...(formData.testimonials || []), { ...item, id: `t-${Date.now()}` }] });
                    }}
                    onReorder={(dragIndex, dropIndex) => {
                        const items = [...(formData.testimonials || [])];
                        const [moved] = items.splice(dragIndex, 1);
                        items.splice(dropIndex, 0, moved);
                        updateConfig({ testimonials: items });
                    }}
                />
          );
          case 'table':
              return (
                  <TableSection 
                      key={`home-${type}`}
                      config={formData.tableConfig}
                      style={formData.style}
                      isEditing={true}
                      // CASTING HERE TO FIX THE ERROR
                      onUpdateConfig={(conf) => updateConfig({ tableConfig: { ...formData.tableConfig, ...conf } as TableSectionConfig })} 
                  />
              );
          case 'products':
              return (
                  <div className="relative group/prod-section py-12" style={{ background: generateCSS(formData.style?.productSection?.backgroundGradient) || formData.style?.productSection?.backgroundColor }}>
                      
                      <div className="absolute top-4 left-4 z-30">
                          <button 
                              onClick={() => setShowProductSettings(!showProductSettings)}
                              className={`flex items-center gap-2 px-4 py-2 rounded-xl shadow-lg border transition-colors ${showProductSettings ? 'bg-primary text-white border-primary' : 'bg-white dark:bg-slate-900 text-slate-500 border-slate-200 dark:border-slate-800'}`}
                          >
                              <Settings className="h-5 w-5" />
                              <span className="font-bold text-sm">Mahsulotlar Dizayni</span>
                          </button>
                      </div>

                      {showProductSettings && createPortal(
                          <div 
                              className={`fixed z-[9999] bg-white dark:bg-slate-900 p-4 shadow-2xl border border-slate-200 dark:border-slate-800 animate-fade-in text-left flex flex-col ${previewMode === 'mobile' ? 'bottom-0 left-0 right-0 rounded-t-2xl border-b-0' : 'rounded-xl w-80'}`}
                              style={previewMode === 'mobile' ? { maxHeight: '85vh' } : { top: prodSettingsPos.y, left: prodSettingsPos.x, maxHeight: '80vh' }}
                          >
                              <div 
                                  className={`flex justify-between items-center mb-3 pb-2 border-b border-slate-100 dark:border-slate-800 ${!isMobile ? 'cursor-move' : ''} touch-none`}
                                  onMouseDown={handleProdSettingsDragStart}
                                  onTouchStart={handleProdSettingsDragStart}
                              >
                                  <span className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2 pointer-events-none"><Move className="h-3 w-3" /> Mahsulotlar Dizayni</span>
                                  <button onClick={() => setShowProductSettings(false)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded"><X className="h-4 w-4 text-slate-400" /></button>
                              </div>
                              <div className="space-y-4 overflow-y-auto custom-scrollbar pr-1 flex-1">
                                  <div>
                                      <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Layout</label>
                                      <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg gap-1">
                                          <button onClick={() => handleStyleUpdate({ productLayout: 'masonry' })} className={`flex-1 text-[10px] py-1.5 rounded ${formData.style?.productLayout === 'masonry' ? 'bg-white dark:bg-slate-700 shadow text-primary font-bold' : 'text-slate-500'}`}>Masonry</button>
                                          <button onClick={() => handleStyleUpdate({ productLayout: 'grid' })} className={`flex-1 text-[10px] py-1.5 rounded ${formData.style?.productLayout === 'grid' ? 'bg-white dark:bg-slate-700 shadow text-primary font-bold' : 'text-slate-500'}`}>Grid</button>
                                          <button onClick={() => handleStyleUpdate({ productLayout: 'list' })} className={`flex-1 text-[10px] py-1.5 rounded ${formData.style?.productLayout === 'list' ? 'bg-white dark:bg-slate-700 shadow text-primary font-bold' : 'text-slate-500'}`}>List</button>
                                      </div>
                                  </div>
                                  {/* ... other controls ... */}
                              </div>
                          </div>,
                          document.body
                      )}

                      <div className="max-w-7xl mx-auto px-4">
                          <h3 className="text-2xl font-bold text-center mb-8" style={{ color: formData.style?.productSection?.titleColor }}>Bizning Mahsulotlar</h3>
                          <div className={
                              formData.style?.productLayout === 'grid' ? 'grid grid-cols-2 lg:grid-cols-3 gap-4' : 
                              formData.style?.productLayout === 'list' ? 'flex flex-col gap-4 max-w-2xl mx-auto' : 
                              'columns-2 lg:columns-3 gap-4 space-y-4'
                          }>
                              {[1, 2, 3].map(i => (
                                  <TreatmentCard 
                                      key={i}
                                      treatment={{ 
                                          id: `demo-${i}`, 
                                          name: `Mahsulot ${i}`, 
                                          price: 100000 * i, 
                                          currency: 'UZS', 
                                          description: 'Bu namuna mahsulot tavsifi.', 
                                          images: [
                                              'https://images.unsplash.com/photo-1606811841689-23dfddce3e95?q=80&w=400&auto=format&fit=crop',
                                              'https://images.unsplash.com/photo-1598256989494-02638563a2a9?q=80&w=400&auto=format&fit=crop'
                                          ],
                                          imageUrl: 'https://images.unsplash.com/photo-1606811841689-23dfddce3e95?q=80&w=400&auto=format&fit=crop',
                                          category: 'Demo'
                                      }}
                                      onAdd={() => {}}
                                      isAdmin={false}
                                      config={formData}
                                      layout={formData.style?.productLayout}
                                      hoverColor={formData.style?.productCardHoverColor}
                                  />
                              ))}
                          </div>
                      </div>
                  </div>
              );
          default: return null;
      }
  };

  return (
    <div className={`max-w-[1400px] mx-auto px-4 mt-8 animate-fade-in pb-20 ${isFullScreen ? 'relative z-[100]' : ''}`}>
      {!isFullScreen && (
          <div className="flex gap-3 mb-8 overflow-x-auto pb-2 no-scrollbar">
              <button onClick={() => setTab('visuals')} className={`px-5 py-3 rounded-2xl font-bold transition-all flex items-center gap-2 whitespace-nowrap ${tab === 'visuals' ? 'bg-indigo-500 text-white shadow-lg' : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800'}`}><Layout className="h-5 w-5" /> Live Editor</button>
              <button onClick={() => setTab('layout')} className={`px-5 py-3 rounded-2xl font-bold transition-all flex items-center gap-2 whitespace-nowrap ${tab === 'layout' ? 'bg-blue-500 text-white shadow-lg' : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800'}`}><LayoutGrid className="h-5 w-5" /> Layout & Sections</button>
              <button onClick={() => setTab('pages')} className={`px-5 py-3 rounded-2xl font-bold transition-all flex items-center gap-2 whitespace-nowrap ${tab === 'pages' ? 'bg-orange-500 text-white shadow-lg' : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800'}`}><FileText className="h-5 w-5" /> Sahifalar</button>
              <button onClick={() => setTab('bot')} className={`px-5 py-3 rounded-2xl font-bold transition-all flex items-center gap-2 whitespace-nowrap ${tab === 'bot' ? 'bg-purple-500 text-white shadow-lg' : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800'}`}><Bot className="h-5 w-5" /> Bot Content</button>
              <button onClick={() => setTab('security')} className={`px-5 py-3 rounded-2xl font-bold transition-all flex items-center gap-2 whitespace-nowrap ${tab === 'security' ? 'bg-slate-700 text-white shadow-lg' : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800'}`}><ShieldCheck className="h-5 w-5" /> Xavfsizlik</button>
              <button onClick={() => setTab('backup')} className={`px-5 py-3 rounded-2xl font-bold transition-all flex items-center gap-2 whitespace-nowrap ${tab === 'backup' ? 'bg-gray-600 text-white shadow-lg' : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800'}`}><Database className="h-5 w-5" /> Data</button>
          </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {tab === 'pages' && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 sm:p-8 animate-slide-up">
                {/* Pages content would go here */}
            </div>
        )}
        {tab === 'layout' && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 sm:p-8 animate-slide-up">
                {/* Layout content would go here */}
            </div>
        )}
        {tab === 'security' && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 sm:p-8 animate-slide-up">
                {/* Security content would go here */}
            </div>
        )}
        {tab === 'backup' && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 sm:p-8 animate-slide-up">
                {/* Backup content would go here */}
            </div>
        )}
        {tab === 'bot' && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 sm:p-8 animate-slide-up">
               <BotSettingsSection 
                    botConfig={formData.botConfig} 
                    telegramConfig={formData.telegram} 
                    telegramProfile={formData.botConfig?.telegramProfile || {}}
                    onUpdate={handleBotConfigUpdate} 
                    onUpdateTelegram={handleTelegramConfigUpdate} 
                    onUpdateProfile={handleTelegramProfileUpdate}
                />
            </div>
        )}

        {tab === 'visuals' && (
            <div className={`transition-all duration-500 ${isFullScreen ? 'w-full h-full' : 'animate-slide-up'}`} style={isFullScreen ? { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 200, backgroundColor: '#0f172a', padding: window.innerWidth < 640 ? '0' : '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: window.innerWidth < 640 ? 'flex-start' : 'center' } : {}}>
                {!isFullScreen && (
                    <div className="flex flex-wrap justify-between items-center mb-4 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                        <div className="flex items-center gap-2">
                            <button onClick={() => setPreviewMode('desktop')} className={`p-2 rounded-lg ${previewMode === 'desktop' ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400' : 'text-slate-400 hover:text-slate-600'}`}><Monitor className="h-5 w-5"/></button>
                            <button onClick={() => setPreviewMode('tablet')} className={`p-2 rounded-lg ${previewMode === 'tablet' ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400' : 'text-slate-400 hover:text-slate-600'}`}><Tablet className="h-5 w-5"/></button>
                            <button onClick={() => setPreviewMode('mobile')} className={`p-2 rounded-lg ${previewMode === 'mobile' ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400' : 'text-slate-400 hover:text-slate-600'}`}><Smartphone className="h-5 w-5"/></button>
                            <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 mx-2"></div>
                            <button onClick={() => setPreviewDarkMode(!previewDarkMode)} className={`p-2 rounded-lg ${previewDarkMode ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600'}`} title="Dark Mode Preview">{previewDarkMode ? '🌙' : '☀️'}</button>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={() => setShowNavbarSettings(!showNavbarSettings)} className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors ${showNavbarSettings ? 'bg-primary text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'}`}>Navbar Sozlamalari</button>
                            <button onClick={() => setIsFullScreen(true)} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"><Maximize2 className="h-5 w-5" /></button>
                        </div>
                    </div>
                )}

                {showNavbarSettings && !isFullScreen && (
                    <div className="mb-4 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 animate-slide-up">
                        <h3 className="text-xs font-bold text-slate-500 uppercase mb-3">Navbar Dizayni</h3>
                    </div>
                )}

                <div className={`relative overflow-y-auto bg-slate-50 dark:bg-slate-950 shadow-2xl transition-all duration-300 mx-auto border-4 border-slate-900 dark:border-slate-700 ${previewMode === 'mobile' ? 'rounded-[3rem] border-8' : previewMode === 'tablet' ? 'rounded-[2rem] border-8' : 'rounded-xl border-4'}`} style={{ width: previewMode === 'mobile' ? '375px' : previewMode === 'tablet' ? '768px' : '1280px', height: isFullScreen ? '100%' : '600px', transition: 'width 0.3s ease', maxWidth: 'none' }}>
                    {isFullScreen && <button onClick={() => setIsFullScreen(false)} className="absolute top-4 right-4 z-[100] bg-black/50 text-white p-2 rounded-full backdrop-blur-md"><Minimize2 className="h-6 w-6" /></button>}
                    
                    <div className={`min-h-full ${previewDarkMode ? 'dark' : ''}`}>
                        <div className="bg-slate-50 dark:bg-slate-950 min-h-full transition-colors">
                            <div className="pointer-events-none sticky top-0 z-50">
                                <Navbar 
                                    cartCount={2} 
                                    onCartClick={() => {}} 
                                    onAdminClick={() => {}} 
                                    isAdmin={false} 
                                    onLogout={() => {}} 
                                    isDarkMode={previewDarkMode} 
                                    onToggleTheme={() => setPreviewDarkMode(!previewDarkMode)} 
                                    logoUrl={formData.logoUrl} 
                                    logoText={formData.logoText}
                                    style={formData.style}
                                    navLinks={[
                                        (formData.showHomeLink 
                                            ? (formData.navLinks?.find(l => l.pageId === 'home') || { id: 'home-link', text: 'Bosh Sahifa', url: '#', type: 'internal' as const, pageId: 'home' })
                                            : { id: 'hidden', text: '', url: '', type: 'internal' as const, pageId: 'hidden' }),
                                        ...(formData.pages || []).map(p => ({ id: p.id, text: p.title, url: '#', type: 'internal' as const }))
                                    ].filter(l => l.text)}
                                    activePageId={activePageId}
                                    onNavigate={(pid) => setActivePageId(pid === 'home' || !pid ? 'home' : pid)}
                                    onEditLogo={() => setShowNavbarSettings(true)}
                                    previewMode={previewMode}
                                />
                            </div>

                            <div className="min-h-[500px]">
                                {activePageId === 'home' ? (
                                    (formData.homeSectionOrder || ['hero', 'banner', 'products', 'features', 'diff', 'testimonials']).map(section => (
                                        <div key={section} className="relative group/edit-section">
                                            {renderPreviewSection(section)}
                                            <div className="absolute inset-0 border-2 border-transparent group-hover/edit-section:border-indigo-500/30 pointer-events-none transition-colors z-10"></div>
                                            <div className="absolute top-2 right-2 opacity-0 group-hover/edit-section:opacity-100 transition-opacity bg-indigo-600 text-white text-[10px] font-bold px-2 py-1 rounded shadow-lg pointer-events-none z-20 uppercase">{section}</div>
                                        </div>
                                    ))
                                ) : (
                                    (() => {
                                        const page = formData.pages?.find(p => p.id === activePageId);
                                        return page ? (
                                            <DynamicPage 
                                                page={page} 
                                                style={formData.style} 
                                                isEditing={true} 
                                                onUpdatePage={handleUpdatePage} 
                                            />
                                        ) : <div className="p-10 text-center text-slate-400">Sahifa topilmadi</div>;
                                    })()
                                )}
                            </div>

                            <Footer config={formData.footer} logoUrl={formData.logoUrl} style={formData.style} isEditing={true} onUpdate={handleFooterUpdate} />
                        </div>
                    </div>
                </div>
            </div>
        )}

        <div className={`fixed bottom-6 left-1/2 transform -translate-x-1/2 z-[150] transition-all duration-500 ${isSaved ? 'translate-y-24 opacity-0' : 'translate-y-0 opacity-100'}`}>
            <button onClick={handleSubmit} className="flex items-center gap-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-8 py-4 rounded-full shadow-2xl hover:scale-105 active:scale-95 transition-all font-bold text-lg"><Save className="h-6 w-6" /> O'zgarishlarni Saqlash</button>
        </div>
      </form>
    </div>
  );
};
