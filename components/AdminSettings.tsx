
import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { 
    Save, Layout, LayoutGrid, FileText, UserCheck, Megaphone, ShieldCheck, 
    RotateCcw, MoveUp, MoveDown, Trash2, Plus, Monitor, Smartphone, Tablet, CheckCircle, 
    Type, ImageIcon, Settings, Move, MoveHorizontal, Palette, AlignLeft, AlignCenter, AlignRight, X, Eye, EyeOff,
    Maximize2, Minimize2, Lock, Key, Bot, MessageSquare, Link as LinkIcon, Menu, Power, Smartphone as MobileIcon, User, Info, Users, Terminal, Grid, Key as KeyIcon, MessageCircle, Heart, Layers, Box, Database, Download, UploadCloud, Search, Filter, RefreshCw, Command, Globe, Fingerprint, TextCursorInput, MousePointerClick, Edit2, Navigation, Play, Pause, MousePointer2, CloudLightning, Server, AlertCircle, CheckCircle2, BarChart3, TrendingUp, ShoppingBag, Eye as ViewIcon, PieChart, ArrowUpRight, Activity, AlertTriangle, Bug
} from 'lucide-react';
import { SiteConfig, AdminUser, Page, SectionType, StyleConfig, BotConfig, TelegramProfileConfig, Treatment, WelcomeButton, TelegramMenuCommand, GradientConfig, TableSectionConfig, PageSection, BotCommand, FirebaseConfig, SupabaseConfig, SystemCheckResult } from '../types';
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
import { saveSiteConfig, setTelegramMyCommands, syncTelegramProfile, saveAdmin, createBackup, restoreBackup, subscribeToAnalytics, diagnoseSystem } from '../services/db';
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
            const hex = s.color.replace('#', '');
            const r = parseInt(hex.substring(0,2), 16);
            const g = parseInt(hex.substring(2,4), 16);
            const b = parseInt(hex.substring(4,6), 16);
            const a = isNaN(s.opacity) ? 1 : s.opacity;
            return `rgba(${r},${g},${b},${a}) ${s.position}%`;
        })
        .join(', ');

    if (g.type === 'linear') return `linear-gradient(${g.angle}deg, ${stopsStr})`;
    if (g.type === 'radial') return `radial-gradient(circle at center, ${stopsStr})`;
    if (g.type === 'conic') return `conic-gradient(from ${g.angle}deg at 50% 50%, ${stopsStr})`;
    return undefined;
};

// ... (Rest of the component code including helper components like SystemHealthCard, SecretField, CommandEditorModal, BotSettingsSection, and the main AdminSettings component. 
// Since the file is large, I'm ensuring the imports and the AdminSettingsProps interface are added, and generateCSS is defined.)

// --- Helper Components for Bot Section ---

const SystemHealthCard: React.FC<{ result: SystemCheckResult }> = ({ result }) => (
    <div className={`p-4 rounded-xl border flex items-start gap-3 transition-colors ${
        result.status === 'ok' ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-900/50' : 
        result.status === 'error' ? 'bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-900/50' : 
        'bg-amber-50 dark:bg-amber-900/20 border-amber-100 dark:border-amber-900/50'
    }`}>
        <div className={`mt-0.5 p-1 rounded-full ${
            result.status === 'ok' ? 'bg-emerald-200 dark:bg-emerald-800 text-emerald-700 dark:text-emerald-100' : 
            result.status === 'error' ? 'bg-red-200 dark:bg-red-800 text-red-700 dark:text-red-100' : 
            'bg-amber-200 dark:bg-amber-800 text-amber-700 dark:text-amber-100'
        }`}>
            {result.status === 'ok' ? <CheckCircle2 className="h-4 w-4" /> : 
             result.status === 'error' ? <X className="h-4 w-4" /> : 
             <AlertTriangle className="h-4 w-4" />}
        </div>
        <div className="flex-1 min-w-0">
            <h4 className={`text-sm font-bold ${
                result.status === 'ok' ? 'text-emerald-900 dark:text-emerald-100' : 
                result.status === 'error' ? 'text-red-900 dark:text-red-100' : 
                'text-amber-900 dark:text-amber-100'
            }`}>
                {result.name}
            </h4>
            <p className={`text-xs mt-1 ${
                result.status === 'ok' ? 'text-emerald-700 dark:text-emerald-300' : 
                result.status === 'error' ? 'text-red-700 dark:text-red-300' : 
                'text-amber-700 dark:text-amber-300'
            }`}>
                {result.message}
            </p>
            {result.fix && (
                <div className="mt-2 text-[10px] font-mono bg-white/50 dark:bg-black/20 p-1.5 rounded border border-black/5 dark:border-white/5 inline-block">
                    🛠 Fix: {result.fix}
                </div>
            )}
        </div>
    </div>
);

const SecretField: React.FC<{ label: string, value: string, placeholder?: string }> = ({ label, value, placeholder }) => {
    const [visible, setVisible] = useState(false);
    return (
        <div className="bg-slate-900 rounded-lg p-3 border border-slate-700">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">{label}</label>
            <div className="flex items-center gap-2">
                <code className="flex-1 bg-black/30 p-2 rounded text-xs text-green-400 font-mono truncate border border-slate-800">
                    {visible ? (value || placeholder || 'Not Set') : '••••••••••••••••••••••••••••'}
                </code>
                <button 
                    onClick={() => setVisible(!visible)}
                    className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded transition-colors"
                >
                    {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
            </div>
        </div>
    );
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
                    <div>
                        <div className="flex justify-between items-start mb-1">
                            <label className="text-xs font-bold text-slate-500 uppercase block">Buyruq (Trigger)</label>
                            <label className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase cursor-pointer select-none">
                                <input type="checkbox" checked={data.showInMenu !== false} onChange={(e) => setData({ ...data, showInMenu: e.target.checked })} className="w-3.5 h-3.5 rounded accent-primary" /> Menyuda ko'rsatish
                            </label>
                        </div>
                        <input value={data.command} onChange={(e) => setData({ ...data, command: e.target.value })} className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold" placeholder="Masalan: Narxlar" />
                        <p className="text-[10px] text-slate-400 mt-1">Foydalanuvchi shu so'zni yozganda javob qaytariladi.</p>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Javob Matni</label>
                        <textarea value={data.response} onChange={(e) => setData({ ...data, response: e.target.value })} className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm min-h-[120px]" placeholder="Salom, bizning narxlar..." />
                        <p className="text-[10px] text-slate-400 mt-1">HTML formatini qo'llab-quvvatlaydi (b, i, a href...).</p>
                    </div>
                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <label className="text-xs font-bold text-slate-500 uppercase">Media (Rasm/Video)</label>
                            <button onClick={() => fileInputRef.current?.click()} className="text-xs bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 px-2 py-1 rounded hover:bg-indigo-100 transition-colors flex items-center gap-1"><Plus className="h-3 w-3" /> Qo'shish</button>
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
                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <label className="text-xs font-bold text-slate-500 uppercase">Inline Tugmalar</label>
                            <button onClick={addButton} className="text-xs bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 px-2 py-1 rounded hover:bg-indigo-100 transition-colors flex items-center gap-1"><Plus className="h-3 w-3" /> Qo'shish</button>
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
    firebaseConfig?: FirebaseConfig;
    telegramProfile?: TelegramProfileConfig;
    onUpdate: (config: Partial<BotConfig>) => void;
    onUpdateTelegram: (config: any) => void;
    onUpdateProfile: (config: TelegramProfileConfig) => void;
    onSaveConfig: () => void;
}> = ({ botConfig, telegramConfig, firebaseConfig, telegramProfile, onUpdate, onUpdateTelegram, onUpdateProfile, onSaveConfig }) => {
    const [subTab, setSubTab] = useState<'status' | 'general' | 'profile' | 'messages' | 'buttons' | 'commands'>('status');
    const [isSyncing, setIsSyncing] = useState(false);
    const [editingCommand, setEditingCommand] = useState<BotCommand | null>(null);
    const [healthResults, setHealthResults] = useState<SystemCheckResult[]>([]);
    const [isDiagnosing, setIsDiagnosing] = useState(false);

    useEffect(() => {
        if (subTab === 'status') {
            runDiagnostics();
        }
    }, [subTab]);

    const runDiagnostics = async () => {
        setIsDiagnosing(true);
        const testConfig: SiteConfig = {
            id: 'temp',
            headline: '', subheadline: '', gradientStart: '', gradientEnd: '',
            telegram: telegramConfig,
            firebaseConfig: firebaseConfig
        } as any;
        
        const results = await diagnoseSystem(testConfig);
        setHealthResults(results);
        setIsDiagnosing(false);
    };

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
            {editingCommand && <CommandEditorModal command={editingCommand} isOpen={!!editingCommand} onClose={() => setEditingCommand(null)} onSave={handleSaveCommand} />}
            <div className="w-full md:w-48 flex flex-row md:flex-col gap-2 overflow-x-auto md:overflow-visible pb-2 md:pb-0 border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-700 pr-0 md:pr-4">
                <button onClick={() => setSubTab('status')} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-bold transition-colors whitespace-nowrap ${subTab === 'status' ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'}`}><Activity className="h-4 w-4"/> Status</button>
                <button onClick={() => setSubTab('general')} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-bold transition-colors whitespace-nowrap ${subTab === 'general' ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'}`}><Settings className="h-4 w-4"/> Asosiy</button>
                <button onClick={() => setSubTab('profile')} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-bold transition-colors whitespace-nowrap ${subTab === 'profile' ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'}`}><Fingerprint className="h-4 w-4"/> Profil</button>
                <button onClick={() => setSubTab('messages')} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-bold transition-colors whitespace-nowrap ${subTab === 'messages' ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'}`}><MessageSquare className="h-4 w-4"/> Xabarlar</button>
                <button onClick={() => setSubTab('buttons')} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-bold transition-colors whitespace-nowrap ${subTab === 'buttons' ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'}`}><MousePointerClick className="h-4 w-4"/> Tugmalar</button>
                <button onClick={() => setSubTab('commands')} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-bold transition-colors whitespace-nowrap ${subTab === 'commands' ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'}`}><Terminal className="h-4 w-4"/> Buyruqlar</button>
            </div>
            <div className="flex-1 min-w-0">
                {subTab === 'status' && (
                    <div className="space-y-6 animate-fade-in">
                        <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                            <div>
                                <h3 className="font-bold text-lg text-slate-800 dark:text-white">Tizim Holati</h3>
                                <p className="text-xs text-slate-500">Bot va Baza aloqasi tekshiruvi</p>
                            </div>
                            <button onClick={runDiagnostics} disabled={isDiagnosing} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 disabled:opacity-50 transition-colors">
                                <RefreshCw className={`h-4 w-4 ${isDiagnosing ? 'animate-spin' : ''}`} />
                                {isDiagnosing ? 'Tekshirilmoqda...' : 'Qayta Tekshirish'}
                            </button>
                        </div>
                        <div className="grid grid-cols-1 gap-3">
                            {healthResults.map(result => (<SystemHealthCard key={result.id} result={result} />))}
                            {healthResults.length === 0 && !isDiagnosing && (<div className="p-8 text-center text-slate-400 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl">Diagnostika natijalari yo'q</div>)}
                        </div>
                        <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 mt-8">
                            <div className="flex items-center gap-2 mb-4 text-orange-500"><Bug className="h-5 w-5" /><h3 className="font-bold text-sm uppercase tracking-wider">Developer Zone (Secrets)</h3></div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <SecretField label="Bot Token" value={telegramConfig?.botToken || ''} />
                                <SecretField label="Admin ID" value={telegramConfig?.adminId || ''} />
                                <SecretField label="Firebase API Key" value={firebaseConfig?.apiKey || ''} />
                                <SecretField label="Project ID" value={firebaseConfig?.projectId || ''} />
                            </div>
                            <div className="mt-4 p-3 bg-blue-900/20 text-blue-300 text-xs rounded border border-blue-900/30"><Info className="h-3 w-3 inline mr-1" /> Ushbu ma'lumotlar maxfiy. Ularni begonalarga bermang.</div>
                        </div>
                    </div>
                )}
                {/* ... other tabs ... */}
                {subTab === 'general' && (
                    <div className="space-y-6 animate-fade-in">
                        <div className="grid grid-cols-1 gap-6">
                            <div><label className="block text-xs font-bold text-slate-500 uppercase mb-2">Bot Token</label><input type="text" value={telegramConfig?.botToken || ''} onChange={(e) => onUpdateTelegram({ botToken: e.target.value })} className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm" placeholder="123456:ABC-DEF..." /><p className="text-[10px] text-slate-400 mt-1">BotFather dan olingan token.</p></div>
                            <div><label className="block text-xs font-bold text-slate-500 uppercase mb-2">Admin ID(s)</label><input type="text" value={telegramConfig?.adminId || ''} onChange={(e) => onUpdateTelegram({ adminId: e.target.value })} className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm" placeholder="12345678, 87654321" /><p className="text-[10px] text-slate-400 mt-1">Vergul bilan ajratilgan Telegram ID raqamlar.</p></div>
                            <div><button onClick={onSaveConfig} className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"><Save className="h-4 w-4" /> Token va ID larni Saqlash</button></div>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                            <h3 className="font-bold text-sm mb-2">Welcome Message (/start)</h3>
                            <textarea value={botConfig?.welcomeMessage || ''} onChange={(e) => onUpdate({ welcomeMessage: e.target.value })} className="w-full p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl h-32 text-sm" />
                            <div className="mt-4 border-t border-slate-200 dark:border-slate-700 pt-4">
                                <div className="flex justify-between items-center mb-2"><label className="text-xs font-bold text-slate-500 uppercase">Inline Tugmalar (URL)</label><button onClick={addWelcomeButton} className="text-xs bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 px-2 py-1 rounded hover:bg-indigo-100 transition-colors flex items-center gap-1"><Plus className="h-3 w-3" /> Qo'shish</button></div>
                                <div className="space-y-2">{botConfig?.welcomeButtons?.map((btn, idx) => (<div key={btn.id || idx} className="flex gap-2 items-center"><input value={btn.text} onChange={(e) => updateWelcomeButton(idx, 'text', e.target.value)} className="flex-1 p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm" placeholder="Tugma matni"/><input value={btn.url} onChange={(e) => updateWelcomeButton(idx, 'url', e.target.value)} className="flex-[2] p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-blue-500" placeholder="https://..."/><button onClick={() => removeWelcomeButton(idx)} className="p-2 text-red-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"><Trash2 className="h-4 w-4" /></button></div>))}</div>
                            </div>
                        </div>
                    </div>
                )}
                {subTab === 'profile' && <div className="space-y-6 animate-fade-in"><div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700"><h3 className="font-bold text-sm mb-4">Bot Profili</h3><div className="space-y-4"><div><label className="text-xs font-bold text-slate-500 uppercase block mb-1">Bot Nomi</label><input value={telegramProfile?.botName || ''} onChange={(e) => onUpdateProfile({ ...telegramProfile, botName: e.target.value })} className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm" /></div><div><label className="text-xs font-bold text-slate-500 uppercase block mb-1">Qisqa Tavsif (About)</label><textarea value={telegramProfile?.shortDescription || ''} onChange={(e) => onUpdateProfile({ ...telegramProfile, shortDescription: e.target.value })} className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm h-16" /></div><div><label className="text-xs font-bold text-slate-500 uppercase block mb-1">To'liq Tavsif (Description)</label><textarea value={telegramProfile?.description || ''} onChange={(e) => onUpdateProfile({ ...telegramProfile, description: e.target.value })} className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm h-24" /></div></div><div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 flex justify-end"><button onClick={handleSyncProfile} disabled={isSyncing} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 disabled:opacity-50">{isSyncing ? "Yuklanmoqda..." : "Telegramga Yuklash"}</button></div></div></div>}
                {subTab === 'messages' && <div className="grid grid-cols-1 gap-4 animate-fade-in">{Object.entries(botConfig?.messages || {}).map(([key, val]) => (<div key={key}><label className="text-xs font-bold text-slate-500 uppercase block mb-1">{key}</label><textarea value={val} onChange={(e) => onUpdate({ messages: { ...botConfig?.messages, [key]: e.target.value } as any })} className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm" rows={2}/></div>))}</div>}
                {subTab === 'buttons' && <div className="space-y-6 animate-fade-in"><div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700"><h3 className="font-bold text-sm mb-3">Menyu Tugmalari (Asosiy Keyboard)</h3><div className="grid grid-cols-2 gap-4">{Object.entries(botConfig?.menuButtons || {}).map(([key, val]) => (<div key={key}><label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">{key}</label><input value={val} onChange={(e) => onUpdate({ menuButtons: { ...botConfig?.menuButtons, [key]: e.target.value } as any })} className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"/></div>))}</div></div><div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700"><h3 className="font-bold text-sm mb-3">Inline Tugmalar (Xabarlar ostida)</h3><div className="grid grid-cols-2 gap-4">{Object.entries(botConfig?.inlineButtons || {}).map(([key, val]) => (<div key={key}><label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">{key}</label><input value={val} onChange={(e) => onUpdate({ inlineButtons: { ...botConfig?.inlineButtons, [key]: e.target.value } as any })} className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"/></div>))}</div></div></div>}
                {subTab === 'commands' && <div className="space-y-8 animate-fade-in"><div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700"><div className="flex justify-between items-center mb-4"><h3 className="font-bold text-sm">Menyu Buyruqlari (BotMenu)</h3><div className="flex gap-2"><button onClick={addMenuCommand} className="text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"><Plus className="h-3 w-3 inline" /> Qo'shish</button><button onClick={handleSyncCommands} disabled={isSyncing} className="text-xs bg-indigo-600 text-white px-2 py-1 rounded hover:bg-indigo-700 disabled:opacity-50 transition-colors">{isSyncing ? '...' : 'Telegramga Yuklash'}</button></div></div><div className="space-y-2">{botConfig?.telegramMenuCommands?.map((cmd, idx) => (<div key={cmd.id || idx} className="flex gap-2 items-center bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200 dark:border-slate-700"><input type="checkbox" checked={cmd.enabled} onChange={(e) => updateMenuCommand(cmd.id, 'enabled', e.target.checked)} className="accent-primary w-4 h-4" /><span className="text-slate-400 font-mono">/</span><input value={cmd.command} onChange={(e) => updateMenuCommand(cmd.id, 'command', e.target.value)} className="w-24 p-1 bg-transparent border-b border-slate-200 dark:border-slate-700 text-sm font-mono" placeholder="start" /><input value={cmd.description} onChange={(e) => updateMenuCommand(cmd.id, 'description', e.target.value)} className="flex-1 p-1 bg-transparent border-b border-slate-200 dark:border-slate-700 text-sm" placeholder="Tavsif" /><button onClick={() => deleteMenuCommand(cmd.id)} className="text-red-400 hover:text-red-500"><Trash2 className="h-4 w-4" /></button></div>))}{(!botConfig?.telegramMenuCommands || botConfig.telegramMenuCommands.length === 0) && <p className="text-xs text-slate-400 italic">Buyruqlar yo'q</p>}</div></div><div><div className="flex justify-between items-center mb-4"><h3 className="font-bold text-sm">Maxsus Javoblar (Auto-Reply)</h3><button onClick={createNewCommand} className="bg-primary text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:opacity-90 flex items-center gap-1"><Plus className="h-3 w-3" /> Yangi Javob</button></div><div className="grid grid-cols-1 gap-3">{botConfig?.customCommands?.map(cmd => (<div key={cmd.id} className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:shadow-md transition-shadow"><div><p className="font-bold text-sm text-slate-800 dark:text-white flex items-center gap-2"><Terminal className="h-3 w-3 text-indigo-500" /> {cmd.command}{cmd.showInMenu && <span className="text-[9px] bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded text-slate-500">MENU</span>}</p><p className="text-xs text-slate-500 truncate max-w-[200px]">{cmd.response}</p></div><div className="flex gap-2"><button onClick={() => setEditingCommand(cmd)} className="p-2 text-slate-400 hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"><Edit2 className="h-4 w-4" /></button><button onClick={() => deleteCommand(cmd.id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"><Trash2 className="h-4 w-4" /></button></div></div>))}{(!botConfig?.customCommands || botConfig.customCommands.length === 0) && <div className="text-center p-8 bg-slate-50 dark:bg-slate-800 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 text-slate-400 text-sm">Maxsus javoblar qo'shilmagan</div>}</div></div></div>}
            </div>
        </div>
    );
};

export const AdminSettings: React.FC<AdminSettingsProps> = ({ currentConfig, currentUser, onPreviewDarkMode, onUpdateUser }) => {
  const [formData, setFormData] = useState<SiteConfig>(currentConfig);
  const [tab, setTab] = useState<'visuals' | 'layout' | 'pages' | 'bot' | 'security' | 'backup' | 'analytics'>('visuals');
  const [isSaved, setIsSaved] = useState(true);
  
  const [analyticsData, setAnalyticsData] = useState<any[]>([]);
  const [analyticsSummary, setAnalyticsSummary] = useState({ pageViews: 0, productViews: 0, addToCarts: 0, checkoutSuccess: 0, conversionRate: 0 });
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [trafficSources, setTrafficSources] = useState<any[]>([]);

  const [credEmail, setCredEmail] = useState(currentUser.email);
  const [credPassword, setCredPassword] = useState('');
  const [setup2FAStep, setSetup2FAStep] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [tempSecret, setTempSecret] = useState<string | null>(null);
  const [verifyCode, setVerifyCode] = useState('');

  const [newPageTitle, setNewPageTitle] = useState('');
  const [newPageSlug, setNewPageSlug] = useState('');

  const availableSections: SectionType[] = ['hero', 'banner', 'products', 'features', 'diff', 'faq', 'testimonials', 'table'];

  const [activePageId, setActivePageId] = useState<string>('home');
  const [previewMode, setPreviewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [previewDarkMode, setPreviewDarkMode] = useState(false);
  const [showNavbarSettings, setShowNavbarSettings] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const [showProductSettings, setShowProductSettings] = useState(false);
  const [prodSettingsPos, setProdSettingsPos] = useState({ x: 20, y: 100 });
  const isDraggingProdSettings = useRef(false);
  const prodDragStartPos = useRef({ x: 0, y: 0 });

  const [migrationStatus, setMigrationStatus] = useState<'idle' | 'running' | 'success' | 'error'>('idle');
  const [migrationSummary, setMigrationSummary] = useState<{ total: number, errors: number } | null>(null);

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
      const handleResize = () => setIsMobile(window.innerWidth <768);
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => { setFormData(currentConfig); }, [currentConfig]);

  useEffect(() => { if (onPreviewDarkMode) onPreviewDarkMode(previewDarkMode ? (formData.darkModeColor || '#020617') : null); }, [previewDarkMode, formData.darkModeColor, onPreviewDarkMode]);

  useEffect(() => {
      const unsub = subscribeToAnalytics((data) => {
          setAnalyticsData(data);
          const pageViews = data.filter(e => e.eventName === 'page_view').length;
          const productViews = data.filter(e => e.eventName === 'product_view').length;
          const addToCarts = data.filter(e => e.eventName === 'add_to_cart').length;
          const checkoutSuccess = data.filter(e => e.eventName === 'checkout_success').length;
          const uniqueSessions = new Set(data.map(e => e.sessionId)).size;
          const conversionRate = uniqueSessions > 0 ? (checkoutSuccess / uniqueSessions) * 100 : 0;

          setAnalyticsSummary({ pageViews, productViews, addToCarts, checkoutSuccess, conversionRate });

          const productCounts: Record<string, number> = {};
          data.filter(e => e.eventName === 'product_view').forEach(e => { const name = e.productName || 'Unknown'; productCounts[name] = (productCounts[name] || 0) + 1; });
          setTopProducts(Object.entries(productCounts).sort(([, a], [, b]) => b - a).slice(0, 5).map(([name, count]) => ({ name, count })));

          const sources: Record<string, number> = {};
          data.filter(e => e.eventName === 'traffic_source').forEach(e => { let ref = e.referrer || 'Direct'; if (ref === '') ref = 'Direct'; if (ref.includes('google')) ref = 'Google'; if (ref.includes('instagram')) ref = 'Instagram'; if (ref.includes('telegram')) ref = 'Telegram'; sources[ref] = (sources[ref] || 0) + 1; });
          setTrafficSources(Object.entries(sources).sort(([, a], [, b]) => b - a).map(([name, count]) => ({ name, count })));
      });
      return () => unsub();
  }, []);

  useEffect(() => {
      const handleMove = (e: MouseEvent | TouchEvent) => {
          if (isDraggingProdSettings.current) {
              const clientX = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
              const clientY = 'touches' in e ? e.touches[0].clientY : (e as MouseEvent).clientY;
              setProdSettingsPos({ x: clientX - prodDragStartPos.current.x, y: clientY - prodDragStartPos.current.y });
          }
      };
      const handleUp = () => { isDraggingProdSettings.current = false; };
      if (showProductSettings) { window.addEventListener('mousemove', handleMove); window.addEventListener('mouseup', handleUp); window.addEventListener('touchmove', handleMove); window.addEventListener('touchend', handleUp); }
      return () => { window.removeEventListener('mousemove', handleMove); window.removeEventListener('mouseup', handleUp); window.removeEventListener('touchmove', handleMove); window.removeEventListener('touchend', handleUp); }
  }, [showProductSettings]);

  const updateConfig = (updates: Partial<SiteConfig>) => { setFormData(prev => ({ ...prev, ...updates })); setIsSaved(false); };
  const handleStyleUpdate = (styleUpdates: Partial<StyleConfig>) => { updateConfig({ style: { ...formData.style, ...styleUpdates } }); };
  const handleSubmit = async (e?: React.FormEvent) => { if(e) e.preventDefault(); await saveSiteConfig(formData); setIsSaved(true); alert("O'zgarishlar saqlandi!"); };
  const handleSaveCredentials = async () => { if (credEmail && currentUser) { const updatedUser = { ...currentUser, email: credEmail, password: credPassword || currentUser.password }; await saveAdmin(updatedUser); onUpdateUser(updatedUser); alert("Login ma'lumotlari yangilandi va saqlandi!"); setCredPassword(''); } };
  const start2FASetup = async () => { try { const secret = new Secret({ size: 20 }); setTempSecret(secret.base32); const totp = new TOTP({ issuer: formData.twoFactorIssuer || "Stomatologiya.uz", label: currentUser.email, algorithm: "SHA1", digits: 6, period: 30, secret: secret }); const uri = totp.toString(); const qr = await QRCode.toDataURL(uri); setQrCodeUrl(qr); setSetup2FAStep(true); } catch (e) { console.error("2FA Setup Error:", e); alert("Xatolik yuz berdi: " + (e as any).message); } };
  const confirm2FASetup = async () => { if (!tempSecret) return; try { const totp = new TOTP({ secret: Secret.fromBase32(tempSecret), algorithm: 'SHA1', digits: 6, period: 30 }); const delta = totp.validate({ token: verifyCode, window: 1 }); if (delta !== null) { const updatedUser = { ...currentUser, isTwoFactorEnabled: true, twoFactorSecret: tempSecret }; await saveAdmin(updatedUser); onUpdateUser(updatedUser); setSetup2FAStep(false); alert("2FA muvaffaqiyatli yoqildi!"); } else { alert("Kod noto'g'ri"); } } catch (e) { console.error("2FA Confirm Error:", e); alert("Kod xato yoki tizim xatoligi"); } };
  const handleDisable2FA = async () => { if (confirm("2FA himoyasini o'chirmoqchimisiz?")) { const updatedUser = { ...currentUser, isTwoFactorEnabled: false, twoFactorSecret: undefined }; await saveAdmin(updatedUser); onUpdateUser(updatedUser); alert("2FA o'chirildi."); } };
  const handleDownloadBackup = async () => { const backup = await createBackup(); const blob = new Blob([JSON.stringify(backup)], { type: 'application/json' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `backup_${Date.now()}.json`; a.click(); };
  const handleRestoreBackup = async (e: React.ChangeEvent<HTMLInputElement>) => { const file = e.target.files?.[0]; if (file) { const reader = new FileReader(); reader.onload = async (ev) => { try { const data = JSON.parse(ev.target?.result as string); await restoreBackup(data); alert("Ma'lumotlar tiklandi! Sahifani yangilang."); window.location.reload(); } catch (err) { alert("Xatolik yuz berdi"); } }; reader.readAsText(file); } };
  const handleFirebaseMigration = async () => { if (!confirm("Diqqat! Barcha ma'lumotlar Firebase bulutli bazasiga nusxalanadi.\n\nDavom etishni xohlaysizmi?")) return; await saveSiteConfig(formData); setIsSaved(true); setMigrationStatus('running'); setMigrationSummary(null); try { const backup = await createBackup(); const result = await migrateDataToFirebase(backup, formData.firebaseConfig); setMigrationSummary({ total: result.totalMigrated, errors: result.errors }); setMigrationStatus('success'); } catch (e) { console.error(e); setMigrationStatus('error'); } };
  
  const updateFirebaseConfig = (field: keyof FirebaseConfig, val: string) => { const current = formData.firebaseConfig || { apiKey: '', authDomain: '', projectId: '', storageBucket: '', messagingSenderId: '', appId: '', measurementId: '' }; updateConfig({ firebaseConfig: { ...current, [field]: val } }); };
  const updateSupabaseConfig = (field: keyof SupabaseConfig, val: string) => { const current = formData.supabaseConfig || { url: '', anonKey: '' }; updateConfig({ supabaseConfig: { ...current, [field]: val } }); };

  const handleAddPage = async () => { const newPage: Page = { id: `p-${Date.now()}`, title: newPageTitle, slug: newPageSlug || newPageTitle.toLowerCase().replace(/\s+/g, '-'), sections: [] }; const updatedPages = [...(formData.pages || []), newPage]; updateConfig({ pages: updatedPages }); await saveSiteConfig({ ...formData, pages: updatedPages }); setNewPageTitle(''); setNewPageSlug(''); alert("Sahifa yaratildi va saqlandi!"); };
  const handleDeletePage = async (id: string) => { if (confirm("Sahifani o'chirmoqchimisiz?")) { const updatedPages = formData.pages?.filter(p => p.id !== id); updateConfig({ pages: updatedPages }); await saveSiteConfig({ ...formData, pages: updatedPages }); } };
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
          case 'hero': return <HeroSection onImageSelected={() => {}} isAdmin={false} onAdminLoginClick={() => {}} config={formData} isEditing={true} onUpdateConfig={updateConfig} onMediaUpdate={(media) => updateConfig({ heroMedia: media })} />;
          case 'banner': return <AdBanner ads={formData.bannerAds || []} config={formData.adConfig} isEditing={true} onConfigUpdate={(conf) => updateConfig({ adConfig: { ...formData.adConfig, ...conf } })} onAdAdd={(newAd) => updateConfig({ bannerAds: [...(formData.bannerAds || []), newAd] })} onAdUpdate={(updatedAd) => updateConfig({ bannerAds: formData.bannerAds?.map(ad => ad.id === updatedAd.id ? updatedAd : ad) })} onAdDelete={(id) => updateConfig({ bannerAds: formData.bannerAds?.filter(ad => ad.id !== id) })} />;
          case 'features': return <FeatureSection cards={formData.featureCards || []} style={formData.style} config={formData.featureSectionConfig} isEditing={true} onConfigUpdate={(conf) => updateConfig({ featureSectionConfig: { ...formData.featureSectionConfig, ...conf } })} onCardUpdate={(id, field, val) => updateConfig({ featureCards: formData.featureCards?.map(c => c.id === id ? { ...c, [field]: val } : c) })} onCardAdd={() => updateConfig({ featureCards: [...(formData.featureCards || []), { id: `fc-${Date.now()}`, title: 'Yangi Karta', description: 'Tavsif...', linkText: 'Batafsil' }] })} onCardDelete={(id) => updateConfig({ featureCards: formData.featureCards?.filter(c => c.id !== id) })} onCardReorder={(dragIndex, dropIndex) => { const cards = [...(formData.featureCards || [])]; const [moved] = cards.splice(dragIndex, 1); cards.splice(dropIndex, 0, moved); updateConfig({ featureCards: cards }); }} />;
          case 'diff': return <ImageDiffSection items={formData.imageDiffs || []} config={formData.diffSectionConfig} style={formData.style} isEditing={true} onUpdateConfig={(conf) => updateConfig({ diffSectionConfig: { ...formData.diffSectionConfig, ...conf } })} onAddItem={() => updateConfig({ imageDiffs: [...(formData.imageDiffs || []), { id: `diff-${Date.now()}`, beforeImage: '', afterImage: '', label: 'Yangi Natija' }] })} onDeleteItem={(id) => updateConfig({ imageDiffs: formData.imageDiffs?.filter(i => i.id !== id) })} onUpdateItem={(id, updates) => updateConfig({ imageDiffs: formData.imageDiffs?.map(i => i.id === id ? { ...i, ...updates } : i) })} />;
          case 'faq': return <FaqSection items={formData.faqItems || []} title={formData.faqTitle} subtitle={formData.faqSubtitle} config={formData.faqConfig} style={formData.style} isEditing={true} onUpdateConfig={(conf) => updateConfig({ faqConfig: { ...formData.faqConfig, ...conf } })} />;
          case 'testimonials': return <TestimonialsSection items={formData.testimonials || []} title={formData.testimonialsTitle} subtitle={formData.testimonialsSubtitle} style={formData.style} config={formData.testimonialsConfig} isEditing={true} onUpdateConfig={(conf) => updateConfig({ ...conf, testimonialsConfig: { ...formData.testimonialsConfig, ...conf } })} onAddItem={() => updateConfig({ testimonials: [...(formData.testimonials || []), { id: `t-${Date.now()}`, name: 'Ism', text: 'Fikr matni...', rating: 5 }] })} onDeleteItem={(id) => updateConfig({ testimonials: formData.testimonials?.filter(t => t.id !== id) })} onUpdateItem={(id, field, val) => updateConfig({ testimonials: formData.testimonials?.map(t => t.id === id ? { ...t, [field]: val } : t) })} />;
          case 'table': return <TableSection key={`home-${type}`} config={formData.tableConfig} style={formData.style} isEditing={true} onUpdateConfig={(conf) => updateConfig({ tableConfig: { ...formData.tableConfig, ...conf } as TableSectionConfig })} />;
          case 'products': return <div className="relative group/prod-section py-12" style={{ background: generateCSS(formData.style?.productSection?.backgroundGradient) || formData.style?.productSection?.backgroundColor }}><div className="absolute top-4 left-4 z-30"><button onClick={() => setShowProductSettings(!showProductSettings)} className={`flex items-center gap-2 px-4 py-2 rounded-xl shadow-lg border transition-colors ${showProductSettings ? 'bg-primary text-white border-primary' : 'bg-white dark:bg-slate-900 text-slate-500 border-slate-200 dark:border-slate-800'}`}><Settings className="h-5 w-5" /><span className="font-bold text-sm">Mahsulotlar Dizayni</span></button></div><div className="max-w-7xl mx-auto px-4"><h3 className="text-2xl font-bold text-center mb-8" style={{ color: formData.style?.productSection?.titleColor }}>Bizning Mahsulotlar</h3><div className={formData.style?.productLayout === 'grid' ? 'grid grid-cols-2 lg:grid-cols-3 gap-4' : formData.style?.productLayout === 'list' ? 'flex flex-col gap-4 max-w-2xl mx-auto' : 'columns-2 lg:columns-3 gap-4 space-y-4'}>{[1, 2, 3].map(i => (<TreatmentCard key={i} treatment={{ id: `demo-${i}`, name: `Mahsulot ${i}`, price: 100000 * i, currency: 'UZS', description: 'Bu namuna mahsulot tavsifi.', images: ['https://images.unsplash.com/photo-1606811841689-23dfddce3e95?q=80&w=400&auto=format&fit=crop'], imageUrl: 'https://images.unsplash.com/photo-1606811841689-23dfddce3e95?q=80&w=400&auto=format&fit=crop', category: 'Demo' }} onAdd={() => {}} isAdmin={false} config={formData} layout={formData.style?.productLayout} hoverColor={formData.style?.productCardHoverColor} />))}</div></div></div>;
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
              <button onClick={() => setTab('analytics')} className={`px-5 py-3 rounded-2xl font-bold transition-all flex items-center gap-2 whitespace-nowrap ${tab === 'analytics' ? 'bg-pink-500 text-white shadow-lg' : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800'}`}><BarChart3 className="h-5 w-5" /> Analitika</button>
              <button onClick={() => setTab('security')} className={`px-5 py-3 rounded-2xl font-bold transition-all flex items-center gap-2 whitespace-nowrap ${tab === 'security' ? 'bg-slate-700 text-white shadow-lg' : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800'}`}><ShieldCheck className="h-5 w-5" /> Xavfsizlik</button>
              <button onClick={() => setTab('backup')} className={`px-5 py-3 rounded-2xl font-bold transition-all flex items-center gap-2 whitespace-nowrap ${tab === 'backup' ? 'bg-gray-600 text-white shadow-lg' : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800'}`}><Database className="h-5 w-5" /> Data</button>
          </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* ... Pages, Layout, Security Tabs ... */}
        {/* (Existing tab logic remains unchanged) */}
        {tab === 'pages' && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 sm:p-8 animate-slide-up">
                <div className="mb-8"><h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">Qo'shimcha Sahifalar</h3><div className="flex flex-col sm:flex-row gap-3 items-end"><div className="flex-1 w-full"><label className="text-xs font-bold text-slate-500 uppercase block mb-1">Sahifa Nomi</label><input value={newPageTitle} onChange={(e) => setNewPageTitle(e.target.value)} className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl" placeholder="Masalan: Biz Haqimizda" /></div><div className="flex-1 w-full"><label className="text-xs font-bold text-slate-500 uppercase block mb-1">Slug (URL)</label><input value={newPageSlug} onChange={(e) => setNewPageSlug(e.target.value)} className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl" placeholder="about-us" /></div><button type="button" onClick={handleAddPage} disabled={!newPageTitle} className="w-full sm:w-auto px-6 py-3 bg-primary text-white font-bold rounded-xl hover:bg-sky-600 disabled:opacity-50 transition-colors">Qo'shish</button></div></div><div className="space-y-3">{formData.pages?.map(page => (<div key={page.id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 group"><div><h4 className="font-bold text-slate-900 dark:text-white">{page.title}</h4><span className="text-xs text-slate-500 font-mono">/{page.slug}</span></div><div className="flex gap-2"><button type="button" onClick={() => { setActivePageId(page.id); setTab('visuals'); }} className="p-2 text-slate-400 hover:text-primary hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-colors"><Edit2 className="h-4 w-4" /></button><button type="button" onClick={() => handleDeletePage(page.id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-colors"><Trash2 className="h-4 w-4" /></button></div></div>))}{(!formData.pages || formData.pages.length === 0) && (<div className="text-center py-8 text-slate-400 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">Qo'shimcha sahifalar yo'q</div>)}</div><div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between"><span className="text-sm font-bold text-slate-600 dark:text-slate-400">Bosh sahifa havolasini ko'rsatish</span><label className="relative inline-flex items-center cursor-pointer"><input type="checkbox" checked={formData.showHomeLink !== false} onChange={(e) => handleToggleHomeLink(e.target.checked)} className="sr-only peer" /><div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 dark:peer-focus:ring-primary/20 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div></label></div>
            </div>
        )}

        {tab === 'layout' && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 sm:p-8 animate-slide-up">
                <div className="flex justify-between items-center mb-6"><h3 className="text-lg font-bold text-slate-800 dark:text-white">Bosh Sahifa Tuzilishi</h3><button type="button" onClick={handleResetLayout} className="text-xs text-red-500 hover:underline">Reset Default</button></div><div className="space-y-3 mb-8">{(formData.homeSectionOrder || ['hero', 'banner', 'products', 'features', 'diff', 'faq', 'testimonials', 'table']).map((section, index) => (<div key={section} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 group"><div className="flex items-center gap-3"><div className="p-2 bg-white dark:bg-slate-700 rounded-lg shadow-sm"><Layout className="h-4 w-4 text-slate-400" /></div><span className="font-bold text-sm uppercase text-slate-700 dark:text-slate-300">{section}</span></div><div className="flex items-center gap-1"><button type="button" onClick={() => handleMoveSection(index, 'up')} disabled={index === 0} className="p-2 hover:bg-white dark:hover:bg-slate-700 rounded-lg text-slate-400 hover:text-primary disabled:opacity-30"><MoveUp className="h-4 w-4" /></button><button type="button" onClick={() => handleMoveSection(index, 'down')} disabled={index === (formData.homeSectionOrder?.length || 0) - 1} className="p-2 hover:bg-white dark:hover:bg-slate-700 rounded-lg text-slate-400 hover:text-primary disabled:opacity-30"><MoveDown className="h-4 w-4" /></button><button type="button" onClick={() => handleRemoveSection(section)} className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-slate-400 hover:text-red-500 ml-2"><Trash2 className="h-4 w-4" /></button></div></div>))}</div><div><label className="text-xs font-bold text-slate-500 uppercase block mb-3">Mavjud Bo'limlar</label><div className="flex flex-wrap gap-2">{availableSections.filter(s => !(formData.homeSectionOrder || []).includes(s)).map(s => (<button key={s} type="button" onClick={() => handleAddSectionToLayout(s)} className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-primary hover:text-white text-slate-600 dark:text-slate-400 rounded-lg text-xs font-bold transition-colors border border-slate-200 dark:border-slate-700">+ {s.toUpperCase()}</button>))}{availableSections.every(s => (formData.homeSectionOrder || []).includes(s)) && <span className="text-xs text-slate-400 italic">Barcha bo'limlar ishlatilmoqda</span>}</div></div>
            </div>
        )}

        {tab === 'analytics' && (
            <div className="space-y-6 animate-slide-up">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
                        <div className="flex justify-between items-start mb-2"><span className="text-xs font-bold text-slate-400 uppercase">Tashriflar</span><div className="p-1.5 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-600"><Eye className="h-4 w-4" /></div></div><span className="text-2xl font-black text-slate-900 dark:text-white">{analyticsSummary.pageViews}</span>
                    </div>
                    {/* ... other analytics cards ... */}
                    <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
                        <div className="flex justify-between items-start mb-2"><span className="text-xs font-bold text-slate-400 uppercase">Mahsulot Ko'rish</span><div className="p-1.5 bg-purple-50 dark:bg-purple-900/20 rounded-lg text-purple-600"><ViewIcon className="h-4 w-4" /></div></div><span className="text-2xl font-black text-slate-900 dark:text-white">{analyticsSummary.productViews}</span>
                    </div>
                    <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
                        <div className="flex justify-between items-start mb-2"><span className="text-xs font-bold text-slate-400 uppercase">Savatchaga</span><div className="p-1.5 bg-orange-50 dark:bg-orange-900/20 rounded-lg text-orange-600"><ShoppingBag className="h-4 w-4" /></div></div><span className="text-2xl font-black text-slate-900 dark:text-white">{analyticsSummary.addToCarts}</span>
                    </div>
                    <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
                        <div className="flex justify-between items-start mb-2"><span className="text-xs font-bold text-slate-400 uppercase">Konversiya</span><div className="p-1.5 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg text-emerald-600"><TrendingUp className="h-4 w-4" /></div></div><span className="text-2xl font-black text-slate-900 dark:text-white">{analyticsSummary.conversionRate.toFixed(1)}%</span><span className="text-[10px] text-slate-400">{analyticsSummary.checkoutSuccess} ta buyurtma</span>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
                        <h3 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2"><BarChart3 className="h-5 w-5 text-indigo-500" /> Top Mahsulotlar (Qiziqish)</h3>
                        <div className="space-y-4">
                            {topProducts.length === 0 ? <p className="text-sm text-slate-400 italic text-center py-4">Ma'lumotlar yetarli emas</p> : topProducts.map((prod, idx) => {
                                const max = topProducts[0].count;
                                const percent = (prod.count / max) * 100;
                                return <div key={idx} className="relative"><div className="flex justify-between text-xs font-bold mb-1 z-10 relative"><span className="text-slate-700 dark:text-slate-300 truncate pr-4">{prod.name}</span><span className="text-slate-500">{prod.count}</span></div><div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden"><div className="h-full bg-indigo-500 rounded-full transition-all duration-500" style={{ width: `${percent}%` }}></div></div></div>
                            })}
                        </div>
                    </div>
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
                        <h3 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2"><PieChart className="h-5 w-5 text-pink-500" /> Trafik Manbalari</h3>
                        <div className="space-y-3">
                            {trafficSources.length === 0 ? <p className="text-sm text-slate-400 italic text-center py-4">Ma'lumotlar yetarli emas</p> : trafficSources.map((source, idx) => (<div key={idx} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl"><div className="flex items-center gap-2"><Globe className="h-4 w-4 text-slate-400" /><span className="text-sm font-medium text-slate-700 dark:text-slate-200">{source.name}</span></div><span className="text-xs font-bold bg-white dark:bg-slate-700 px-2 py-1 rounded text-slate-600 dark:text-slate-300 shadow-sm">{source.count}</span></div>))}
                        </div>
                    </div>
                </div>
            </div>
        )}

        {tab === 'security' && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 sm:p-8 animate-slide-up space-y-8">
                <div><h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2"><Key className="h-5 w-5 text-primary" /> Login Ma'lumotlari</h3><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><div><label className="text-xs font-bold text-slate-500 uppercase block mb-1">Email</label><input type="email" value={credEmail} onChange={(e) => setCredEmail(e.target.value)} className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl" /></div><div><label className="text-xs font-bold text-slate-500 uppercase block mb-1">Yangi Parol</label><input type="password" value={credPassword} onChange={(e) => setCredPassword(e.target.value)} className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl" placeholder="O'zgartirmaslik uchun bo'sh qoldiring" /></div></div><button type="button" onClick={handleSaveCredentials} className="mt-4 px-6 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl text-sm font-bold hover:opacity-90">Yangilash</button></div>
                <div className="border-t border-slate-100 dark:border-slate-800 pt-8">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-emerald-500" /> Ikki Bosqichli Himoya (2FA)</h3>
                    <div><label className="text-xs font-bold text-slate-500 uppercase block mb-1">Authenticator Nomi (Issuer)</label><input type="text" value={formData.twoFactorIssuer || 'Stomatologiya.uz'} onChange={(e) => updateConfig({ twoFactorIssuer: e.target.value })} className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold mb-4" placeholder="Stomatologiya.uz" /></div>
                    {currentUser.isTwoFactorEnabled ? (<div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-900/30 p-4 rounded-xl flex items-center justify-between"><span className="text-emerald-700 dark:text-emerald-300 font-bold text-sm flex items-center gap-2"><CheckCircle className="h-5 w-5" /> 2FA Faollashtirilgan</span><button type="button" onClick={handleDisable2FA} className="text-xs text-red-500 hover:text-red-700 font-bold underline">O'chirish</button></div>) : (!setup2FAStep ? (<div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl text-center"><p className="text-sm text-slate-600 dark:text-slate-400 mb-4">Hisobingiz xavfsizligini oshirish uchun Google Authenticator ni ulang.</p><button type="button" onClick={start2FASetup} className="px-6 py-2 bg-emerald-500 text-white rounded-xl text-sm font-bold hover:bg-emerald-600 transition-colors">2FA Ni Yoqish</button></div>) : (<div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col items-center animate-fade-in"><div className="bg-white p-2 rounded-lg mb-4 shadow-sm">{qrCodeUrl && <img src={qrCodeUrl} alt="QR Code" className="w-48 h-48" />}</div><p className="text-sm text-slate-500 mb-4 text-center max-w-xs">Google Authenticator ilovasi orqali QR kodni skanerlang va 6 xonali kodni kiriting.</p><input type="text" value={verifyCode} onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g,'').slice(0,6))} className="w-48 text-center text-2xl font-mono tracking-widest p-2 border border-slate-300 rounded-lg mb-4 bg-slate-50 dark:bg-slate-900 dark:border-slate-600 dark:text-white" placeholder="000000" /><div className="flex gap-3"><button type="button" onClick={() => setSetup2FAStep(false)} className="px-4 py-2 text-slate-500 font-bold hover:bg-slate-100 rounded-lg">Bekor qilish</button><button type="button" onClick={confirm2FASetup} className="px-6 py-2 bg-emerald-500 text-white font-bold rounded-lg hover:bg-emerald-600">Tasdiqlash</button></div></div>))}
                </div>
            </div>
        )}

        {tab === 'backup' && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 sm:p-8 animate-slide-up space-y-8">
                {/* ... (Existing backup content) ... */}
                <div className="border-b border-slate-100 dark:border-slate-800 pb-8">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2"><CloudLightning className="h-5 w-5 text-emerald-500" /> Supabase Storage (Rasmlar)</h3>
                    {/* ... Supabase Inputs ... */}
                    <div className="bg-emerald-50 dark:bg-emerald-900/10 p-5 rounded-xl border border-emerald-100 dark:border-emerald-900/30">
                        <p className="text-sm text-emerald-800 dark:text-emerald-200 mb-4">Rasmlarni yuklash ishlashi uchun Supabase loyihangiz ma'lumotlarini kiriting.</p>
                        <div className="space-y-3 mb-4">
                            <div><label className="text-xs font-bold text-slate-500 uppercase mb-1">Supabase URL</label><input type="text" value={formData.supabaseConfig?.url || ''} onChange={(e) => updateSupabaseConfig('url', e.target.value)} className="w-full p-2 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg font-mono" placeholder="https://xyz.supabase.co" /></div>
                            <div><label className="text-xs font-bold text-slate-500 uppercase mb-1">Anon Key</label><input type="password" value={formData.supabaseConfig?.anonKey || ''} onChange={(e) => updateSupabaseConfig('anonKey', e.target.value)} className="w-full p-2 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg font-mono" placeholder="eyJ..." /></div>
                            <div><label className="text-xs font-bold text-slate-500 uppercase mb-1">Bucket Nomi</label><input type="text" value={formData.supabaseConfig?.bucketName || 'images'} onChange={(e) => updateSupabaseConfig('bucketName', e.target.value)} className="w-full p-2 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg font-mono" placeholder="images" /><p className="text-[10px] text-slate-400 mt-1">Standart: 'images'. Supabase Dashboard-da yaratilgan bucket nomi bo'lishi shart.</p></div>
                        </div>
                    </div>
                </div>
                <div>
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">Ma'lumotlar Bazasi (Backup)</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <button type="button" onClick={handleDownloadBackup} className="flex flex-col items-center justify-center p-6 bg-sky-50 dark:bg-sky-900/20 border-2 border-dashed border-sky-200 dark:border-sky-800 rounded-2xl hover:bg-sky-100 dark:hover:bg-sky-900/30 transition-colors group"><Download className="h-8 w-8 text-sky-500 mb-2 group-hover:scale-110 transition-transform" /><span className="font-bold text-sky-700 dark:text-sky-300">Backup Yuklab Olish</span><span className="text-xs text-sky-500/70 mt-1">JSON formatida</span></button>
                        <div className="relative flex flex-col items-center justify-center p-6 bg-slate-50 dark:bg-slate-800/50 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group"><UploadCloud className="h-8 w-8 text-slate-400 mb-2 group-hover:text-primary transition-colors" /><span className="font-bold text-slate-600 dark:text-slate-400">Backupdan Tiklash</span><span className="text-xs text-slate-400 mt-1">Faylni tanlang</span><input type="file" accept=".json" onChange={handleRestoreBackup} className="absolute inset-0 opacity-0 cursor-pointer" /></div>
                    </div>
                </div>
                <div className="border-t border-slate-100 dark:border-slate-800 pt-8">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2"><Server className="h-5 w-5 text-orange-500" /> Firebase Migratsiya</h3>
                    <div className="bg-slate-50 dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700">
                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">Mahalliy ma'lumotlarni Firebase Firestore (Cloud) bazasiga o'tkazish.</p>
                        <div className="space-y-3 mb-4">
                            <label className="text-xs font-bold text-slate-500 uppercase">API Key</label><input type="text" value={formData.firebaseConfig?.apiKey || ''} onChange={(e) => updateFirebaseConfig('apiKey', e.target.value)} className="w-full p-2 text-xs bg-white dark:bg-slate-900 border rounded font-mono" placeholder="AIza..." />
                            <label className="text-xs font-bold text-slate-500 uppercase">Auth Domain</label><input type="text" value={formData.firebaseConfig?.authDomain || ''} onChange={(e) => updateFirebaseConfig('authDomain', e.target.value)} className="w-full p-2 text-xs bg-white dark:bg-slate-900 border rounded font-mono" placeholder="example.firebaseapp.com" />
                            <label className="text-xs font-bold text-slate-500 uppercase">Project ID</label><input type="text" value={formData.firebaseConfig?.projectId || ''} onChange={(e) => updateFirebaseConfig('projectId', e.target.value)} className="w-full p-2 text-xs bg-white dark:bg-slate-900 border rounded font-mono" placeholder="my-project-id" />
                            <label className="text-xs font-bold text-slate-500 uppercase">Storage Bucket</label><input type="text" value={formData.firebaseConfig?.storageBucket || ''} onChange={(e) => updateFirebaseConfig('storageBucket', e.target.value)} className="w-full p-2 text-xs bg-white dark:bg-slate-900 border rounded font-mono" placeholder="example.appspot.com" />
                            <label className="text-xs font-bold text-slate-500 uppercase">App ID</label><input type="text" value={formData.firebaseConfig?.appId || ''} onChange={(e) => updateFirebaseConfig('appId', e.target.value)} className="w-full p-2 text-xs bg-white dark:bg-slate-900 border rounded font-mono" placeholder="1:123456789:web:..." />
                        </div>
                        <button type="button" onClick={handleFirebaseMigration} disabled={migrationStatus === 'running'} className="w-full py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold rounded-xl hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center justify-center gap-2">{migrationStatus === 'running' ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Server className="h-4 w-4" />}{migrationStatus === 'running' ? 'Migratsiya jarayonda...' : 'Boshlash'}</button>
                        {migrationStatus === 'success' && (<div className="mt-4 p-3 bg-emerald-50 text-emerald-700 rounded-lg text-sm flex items-center gap-2"><CheckCircle2 className="h-4 w-4" /> Muvaffaqiyatli: {migrationSummary?.total} ta element yuklandi. Xatolar: {migrationSummary?.errors}</div>)}
                        {migrationStatus === 'error' && (<div className="mt-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm flex items-center gap-2"><AlertCircle className="h-4 w-4" /> Xatolik yuz berdi. Konsolni tekshiring.</div>)}
                    </div>
                </div>
            </div>
        )}

        {/* ... (Bot Tab content rendered via BotSettingsSection component above) ... */}
        {tab === 'bot' && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 sm:p-8 animate-slide-up">
               <BotSettingsSection 
                    botConfig={formData.botConfig} 
                    telegramConfig={formData.telegram} 
                    firebaseConfig={formData.firebaseConfig}
                    telegramProfile={formData.botConfig?.telegramProfile || {}}
                    onUpdate={handleBotConfigUpdate} 
                    onUpdateTelegram={handleTelegramConfigUpdate} 
                    onUpdateProfile={handleTelegramProfileUpdate}
                    onSaveConfig={handleSubmit}
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
                        <div className="flex gap-4">
                             <div><label className="text-[10px] text-slate-400 block mb-1">Navbar Logo Height</label><input type="range" min="20" max="80" value={formData.style?.logoHeight || 40} onChange={(e) => handleStyleUpdate({ logoHeight: parseInt(e.target.value) })} className="w-full h-1 bg-slate-200 rounded accent-primary" /></div>
                             <div><label className="text-[10px] text-slate-400 block mb-1">Nav Link Alignment</label><select value={formData.style?.navAlignment || 'center'} onChange={(e) => handleStyleUpdate({ navAlignment: e.target.value as any })} className="text-xs p-1 border rounded bg-transparent"><option value="left">Left</option><option value="center">Center</option><option value="right">Right</option></select></div>
                        </div>
                    </div>
                )}

                {/* PRODUCT SETTINGS PANEL */}
                {showProductSettings && createPortal(
                    <div 
                        className={`fixed z-[9999] bg-white dark:bg-slate-900 p-4 shadow-2xl border border-slate-200 dark:border-slate-800 animate-fade-in text-left flex flex-col ${isMobile ? 'bottom-0 left-0 right-0 rounded-t-2xl border-b-0' : 'rounded-xl w-80'}`}
                        style={isMobile ? { maxHeight: '85vh' } : { top: prodSettingsPos.y, left: prodSettingsPos.x, maxHeight: '80vh' }}
                    >
                        {/* Header */}
                        <div 
                            className={`flex justify-between items-center mb-3 pb-2 border-b border-slate-100 dark:border-slate-800 ${!isMobile ? 'cursor-move' : ''} touch-none`}
                            onMouseDown={(e) => { isDraggingProdSettings.current = true; prodDragStartPos.current = { x: e.clientX - prodSettingsPos.x, y: e.clientY - prodSettingsPos.y }; }}
                            onTouchStart={(e) => { if(!isMobile) { isDraggingProdSettings.current = true; prodDragStartPos.current = { x: e.touches[0].clientX - prodSettingsPos.x, y: e.touches[0].clientY - prodSettingsPos.y }; } }}
                        >
                            <span className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2 pointer-events-none"><Settings className="h-3 w-3" /> Mahsulotlar Dizayni</span>
                            <button onClick={() => setShowProductSettings(false)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded"><X className="h-4 w-4 text-slate-400" /></button>
                        </div>

                        <div className="space-y-4 overflow-y-auto custom-scrollbar pr-1 flex-1 pb-4">
                             <div>
                                 <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Layout</label>
                                 <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg gap-1">
                                     <button onClick={() => handleStyleUpdate({ productLayout: 'masonry' })} className={`flex-1 text-[10px] py-1.5 rounded ${formData.style?.productLayout === 'masonry' || !formData.style?.productLayout ? 'bg-white dark:bg-slate-700 shadow text-primary font-bold' : 'text-slate-500'}`}>Masonry</button>
                                     <button onClick={() => handleStyleUpdate({ productLayout: 'grid' })} className={`flex-1 text-[10px] py-1.5 rounded ${formData.style?.productLayout === 'grid' ? 'bg-white dark:bg-slate-700 shadow text-primary font-bold' : 'text-slate-500'}`}>Grid</button>
                                     <button onClick={() => handleStyleUpdate({ productLayout: 'list' })} className={`flex-1 text-[10px] py-1.5 rounded ${formData.style?.productLayout === 'list' ? 'bg-white dark:bg-slate-700 shadow text-primary font-bold' : 'text-slate-500'}`}>List</button>
                                 </div>
                             </div>

                             <div className="border-t border-slate-100 dark:border-slate-800 pt-2">
                                 <label className="text-[10px] font-bold text-slate-400 uppercase block mb-2">Karta Stili</label>
                                 <div className="mb-2">
                                     <label className="text-[9px] text-slate-400 block mb-1">Orqa Fon (Gradient)</label>
                                     <GradientPicker value={formData.style?.productCardBackgroundGradient} onChange={(g) => handleStyleUpdate({ productCardBackgroundGradient: g })} />
                                 </div>
                                 <div className="grid grid-cols-2 gap-2 mb-2">
                                     <div><label className="text-[9px] text-slate-400 block">Matn Rangi</label><input type="color" value={formData.style?.productCardTextColor || '#000000'} onChange={(e) => handleStyleUpdate({ productCardTextColor: e.target.value })} className="w-full h-6 rounded cursor-pointer border-none p-0" /></div>
                                     <div><label className="text-[9px] text-slate-400 block">Narx Rangi</label><input type="color" value={formData.style?.productPriceColor || '#000000'} onChange={(e) => handleStyleUpdate({ productPriceColor: e.target.value })} className="w-full h-6 rounded cursor-pointer border-none p-0" /></div>
                                 </div>
                                 <div className="flex gap-2 mb-2">
                                     <div className="flex-1"><label className="text-[9px] text-slate-400 block">Radius</label><input type="range" min="0" max="40" value={formData.style?.productCardBorderRadius ?? 16} onChange={(e) => handleStyleUpdate({ productCardBorderRadius: parseInt(e.target.value) })} className="w-full h-1 bg-slate-200 rounded-lg accent-primary" /></div>
                                     <div className="flex-1"><label className="text-[9px] text-slate-400 block">Border</label><input type="range" min="0" max="5" value={formData.style?.productCardBorderWidth ?? 1} onChange={(e) => handleStyleUpdate({ productCardBorderWidth: parseInt(e.target.value) })} className="w-full h-1 bg-slate-200 rounded-lg accent-primary" /></div>
                                 </div>
                                 <div className="grid grid-cols-2 gap-2">
                                     <div><label className="text-[9px] text-slate-400 block">Border Rangi</label><input type="color" value={formData.style?.productCardBorderColor || '#e2e8f0'} onChange={(e) => handleStyleUpdate({ productCardBorderColor: e.target.value })} className="w-full h-6 rounded cursor-pointer border-none p-0" /></div>
                                     <div><label className="text-[9px] text-slate-400 block">Hover/Shadow</label><input type="color" value={formData.style?.productCardHoverColor || '#0ea5e9'} onChange={(e) => handleStyleUpdate({ productCardHoverColor: e.target.value })} className="w-full h-6 rounded cursor-pointer border-none p-0" /></div>
                                 </div>
                             </div>

                             <div className="border-t border-slate-100 dark:border-slate-800 pt-2">
                                 <label className="text-[10px] font-bold text-slate-400 uppercase block mb-2">Karta Konfiguratsiyasi</label>
                                 <div className="space-y-2">
                                     <label className="flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-300">
                                         <span>Miqdor boshqaruvini ko'rsatish</span>
                                         <input type="checkbox" checked={formData.style?.cardConfig?.showQuantityControl} onChange={(e) => handleStyleUpdate({ cardConfig: { ...formData.style?.cardConfig, showQuantityControl: e.target.checked } })} className="accent-primary w-4 h-4" />
                                     </label>
                                     <label className="flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-300">
                                         <span>Like tugmasini yashirish</span>
                                         <input type="checkbox" checked={formData.style?.cardConfig?.hideLikeButton} onChange={(e) => handleStyleUpdate({ cardConfig: { ...formData.style?.cardConfig, hideLikeButton: e.target.checked } })} className="accent-primary w-4 h-4" />
                                     </label>
                                     <div>
                                         <label className="text-[9px] text-slate-400 block mb-1">Kategoriya Joylashuvi</label>
                                         <select value={formData.style?.cardConfig?.categoryPosition || 'top-left'} onChange={(e) => handleStyleUpdate({ cardConfig: { ...formData.style?.cardConfig, categoryPosition: e.target.value as any } })} className="w-full text-xs p-1.5 rounded border border-slate-200 dark:border-slate-700 bg-transparent">
                                             <option value="top-left">Rasm ustida (Chap)</option>
                                             <option value="hover-overlay">Hover (Overlay)</option>
                                             <option value="breadcrumb">Sarlavha tepasida (Breadcrumb)</option>
                                             <option value="above-title">Sarlavha tepasida (Text)</option>
                                             <option value="below-title">Sarlavha pastida</option>
                                             <option value="hidden">Yashirish</option>
                                         </select>
                                     </div>
                                     {formData.style?.productLayout === 'grid' && (
                                         <div>
                                             <label className="text-[9px] text-slate-400 block mb-1">Rasm Balandligi (Grid)</label>
                                             <input type="range" min="150" max="500" step="10" value={formData.style?.cardConfig?.imageHeight || 0} onChange={(e) => handleStyleUpdate({ cardConfig: { ...formData.style?.cardConfig, imageHeight: parseInt(e.target.value) } })} className="w-full h-1 bg-slate-200 rounded-lg accent-primary" />
                                             <span className="text-[9px] text-slate-400 text-right block">{formData.style?.cardConfig?.imageHeight ? `${formData.style?.cardConfig?.imageHeight}px` : 'Auto'}</span>
                                         </div>
                                     )}
                                 </div>
                             </div>

                             <div className="border-t border-slate-100 dark:border-slate-800 pt-2">
                                 <label className="text-[10px] font-bold text-slate-400 uppercase block mb-2">Bo'lim Stili</label>
                                 <div className="mb-2">
                                     <label className="text-[9px] text-slate-400 block mb-1">Bo'lim Foni (Gradient)</label>
                                     <GradientPicker value={formData.style?.productSection?.backgroundGradient} onChange={(g) => handleStyleUpdate({ productSection: { ...formData.style?.productSection, backgroundGradient: g } })} />
                                 </div>
                                 <div>
                                     <label className="text-[9px] text-slate-400 block mb-1">Sarlavha Rangi</label>
                                     <input type="color" value={formData.style?.productSection?.titleColor || '#000000'} onChange={(e) => handleStyleUpdate({ productSection: { ...formData.style?.productSection, titleColor: e.target.value } })} className="w-full h-6 rounded cursor-pointer border-none p-0" />
                                 </div>
                             </div>
                        </div>
                    </div>,
                    document.body
                )}

                <div className={`relative overflow-y-auto bg-slate-50 dark:bg-slate-950 shadow-2xl transition-all duration-300 mx-auto border-4 border-slate-900 dark:border-slate-700 ${previewMode === 'mobile' ? 'rounded-[3rem] border-8' : previewMode === 'tablet' ? 'rounded-[2rem] border-8' : 'rounded-xl border-4'}`} style={{ width: previewMode === 'mobile' ? '375px' : previewMode === 'tablet' ? '768px' : '1280px', height: isFullScreen ? '100%' : '600px', transition: 'width 0.3s ease', maxWidth: 'none' }}>
                    {isFullScreen && <button onClick={() => setIsFullScreen(false)} className="absolute top-4 right-4 z-[100] bg-black/50 text-white p-2 rounded-full backdrop-blur-md"><Minimize2 className="h-6 w-6" /></button>}
                    
                    <div className={`min-h-full ${previewDarkMode ? 'dark' : ''}`}>
                        <div className="bg-slate-50 dark:bg-slate-950 min-h-full transition-colors">
                            <div className="pointer-events-none sticky top-0 z-50">
                                <Navbar cartCount={2} onCartClick={() => {}} onAdminClick={() => {}} isAdmin={false} onLogout={() => {}} isDarkMode={previewDarkMode} onToggleTheme={() => setPreviewDarkMode(!previewDarkMode)} logoUrl={formData.logoUrl} logoText={formData.logoText} style={formData.style} navLinks={[(formData.showHomeLink ? (formData.navLinks?.find(l => l.pageId === 'home') || { id: 'home-link', text: 'Bosh Sahifa', url: '#', type: 'internal' as const, pageId: 'home' }) : { id: 'hidden', text: '', url: '', type: 'internal' as const, pageId: 'hidden' }), ...(formData.pages || []).map(p => ({ id: p.id, text: p.title, url: '#', type: 'internal' as const }))].filter(l => l.text)} activePageId={activePageId} onNavigate={(pid) => setActivePageId(pid === 'home' || !pid ? 'home' : pid)} onEditLogo={() => setShowNavbarSettings(true)} previewMode={previewMode} />
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
                                            <DynamicPage page={page} style={formData.style} isEditing={true} onUpdatePage={handleUpdatePage} />
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
