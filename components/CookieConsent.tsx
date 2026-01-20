import React, { useState, useEffect } from 'react';
import { Cookie, X, ChevronRight, ShieldCheck, BarChart3, Megaphone, Check, Settings, Settings2 } from 'lucide-react';

interface CookiePreferences {
    essential: boolean;
    analytics: boolean;
    marketing: boolean;
}

const STORAGE_KEY = 'stomatologiya_cookie_consent';

export const CookieConsent: React.FC = () => {
    const [isVisible, setIsVisible] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    // State to track if we should show the persistent "Re-open" button
    const [showPersistentButton, setShowPersistentButton] = useState(false);
    
    const [preferences, setPreferences] = useState<CookiePreferences>({
        essential: true, // Always true
        analytics: true,
        marketing: true
    });

    useEffect(() => {
        // Check if consent is already stored
        const stored = localStorage.getItem(STORAGE_KEY);
        if (!stored) {
            // Delay showing to allow initial page load animation
            const timer = setTimeout(() => setIsVisible(true), 1500);
            return () => clearTimeout(timer);
        } else {
            // If stored, load preferences and show persistent button
            const parsed = JSON.parse(stored);
            setPreferences(parsed.preferences || { essential: true, analytics: true, marketing: true });
            setShowPersistentButton(true);
        }
    }, []);

    const handleAcceptAll = () => {
        const allEnabled = { essential: true, analytics: true, marketing: true };
        savePreferences(allEnabled);
    };

    const handleRejectAll = () => {
        const onlyEssential = { essential: true, analytics: false, marketing: false };
        savePreferences(onlyEssential);
    };

    const handleSaveSelection = () => {
        savePreferences(preferences);
    };

    const savePreferences = (prefs: CookiePreferences) => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
            preferences: prefs,
            timestamp: Date.now()
        }));
        setPreferences(prefs);
        setIsVisible(false);
        setShowSettings(false);
        setShowPersistentButton(true);
        // Reload page to apply changes (optional, but ensures clean state for trackers)
        // window.location.reload(); 
    };

    const togglePreference = (key: keyof CookiePreferences) => {
        if (key === 'essential') return;
        setPreferences(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const handleReopen = () => {
        setShowPersistentButton(false);
        setIsVisible(true);
        setShowSettings(true);
    };

    // Persistent Floating Button when consent is already handled
    if (showPersistentButton && !isVisible) {
        return (
            <button 
                onClick={handleReopen}
                className="fixed bottom-4 left-4 z-[90] p-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-full shadow-lg border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-primary transition-all hover:scale-110 active:scale-95 group"
                title="Cookie Sozlamalari"
            >
                <Cookie className="h-5 w-5" />
                <span className="absolute left-full ml-2 px-2 py-1 bg-slate-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                    Cookie Sozlamalari
                </span>
            </button>
        );
    }

    if (!isVisible) return null;

    return (
        <div className="fixed inset-0 z-[100] pointer-events-none flex items-end justify-center sm:items-end sm:justify-end p-4">
            {/* Backdrop for Settings Mode */}
            {showSettings && (
                <div 
                    className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm pointer-events-auto animate-fade-in" 
                    onClick={() => setShowSettings(false)}
                />
            )}

            {/* Main Banner / Modal */}
            <div className={`
                pointer-events-auto w-full transition-all duration-500 ease-out shadow-2xl
                ${showSettings ? 'max-w-xl mb-0 sm:mb-12 sm:mr-0' : 'max-w-4xl mb-0'} 
                bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 
                rounded-t-2xl sm:rounded-2xl overflow-hidden
                ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'}
            `}>
                
                {/* SETTINGS VIEW */}
                {showSettings ? (
                    <div className="flex flex-col max-h-[85vh] animate-slide-up">
                        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-950/50">
                            <h3 className="font-bold text-lg flex items-center gap-2 text-slate-900 dark:text-white">
                                <Settings2 className="h-5 w-5 text-primary" /> Cookie Sozlamalari
                            </h3>
                            <button onClick={() => setShowSettings(false)} className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors">
                                <X className="h-5 w-5 text-slate-500" />
                            </button>
                        </div>
                        
                        <div className="p-5 space-y-4 overflow-y-auto custom-scrollbar">
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                Biz sizga eng yaxshi tajribani taqdim etish va xizmatlarimizni yaxshilash maqsadida ma'lumotlarni yig'amiz.
                            </p>

                            {/* Essential */}
                            <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                                <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg text-emerald-600 dark:text-emerald-400">
                                    <ShieldCheck className="h-5 w-5" />
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="font-bold text-sm text-slate-900 dark:text-white">Zaruriy (Essential)</span>
                                        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded uppercase">Doimiy</span>
                                    </div>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">Saytning to'g'ri ishlashi, xavfsizlik va savatcha funksiyalari uchun kerak.</p>
                                </div>
                            </div>

                            {/* Analytics */}
                            <div className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-primary/50 transition-colors cursor-pointer" onClick={() => togglePreference('analytics')}>
                                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
                                    <BarChart3 className="h-5 w-5" />
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="font-bold text-sm text-slate-900 dark:text-white">Analitika va Statistika</span>
                                        <div className={`w-10 h-5 rounded-full relative transition-colors ${preferences.analytics ? 'bg-primary' : 'bg-slate-300 dark:bg-slate-600'}`}>
                                            <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${preferences.analytics ? 'left-6' : 'left-1'}`} />
                                        </div>
                                    </div>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                                        Quyidagi ma'lumotlarni yig'ishga ruxsat berasiz:
                                    </p>
                                    <ul className="text-[10px] text-slate-500 dark:text-slate-400 list-disc pl-4 space-y-0.5">
                                        <li>✔ Sahifaga tashriflar (Page visits)</li>
                                        <li>✔ Mahsulot ko'rishlari (Product views)</li>
                                        <li>✔ Savatchaga qo'shish (Add-to-cart)</li>
                                        <li>✔ Muvaffaqiyatli buyurtma (Checkout success)</li>
                                        <li>✔ Trafik manbai (Traffic source)</li>
                                    </ul>
                                </div>
                            </div>

                            {/* Marketing */}
                            <div className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-primary/50 transition-colors cursor-pointer" onClick={() => togglePreference('marketing')}>
                                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg text-purple-600 dark:text-purple-400">
                                    <Megaphone className="h-5 w-5" />
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="font-bold text-sm text-slate-900 dark:text-white">Marketing</span>
                                        <div className={`w-10 h-5 rounded-full relative transition-colors ${preferences.marketing ? 'bg-primary' : 'bg-slate-300 dark:bg-slate-600'}`}>
                                            <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${preferences.marketing ? 'left-6' : 'left-1'}`} />
                                        </div>
                                    </div>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">Sizga moslashtirilgan reklama va takliflarni ko'rsatish uchun.</p>
                                </div>
                            </div>
                        </div>

                        <div className="p-5 border-t border-slate-100 dark:border-slate-800 flex gap-3">
                            <button 
                                onClick={handleSaveSelection}
                                className="flex-1 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold rounded-xl hover:opacity-90 transition-all active:scale-95"
                            >
                                Saqlash
                            </button>
                            <button 
                                onClick={handleAcceptAll}
                                className="flex-1 py-3 bg-primary text-white font-bold rounded-xl hover:bg-sky-600 transition-all active:scale-95"
                            >
                                Barchasini Qabul Qilish
                            </button>
                        </div>
                    </div>
                ) : (
                    /* COMPACT BANNER VIEW */
                    <div className="flex flex-col md:flex-row items-start md:items-center p-5 sm:p-6 gap-6">
                        <div className="flex items-start gap-4 flex-1">
                            <div className="p-3 bg-primary/10 rounded-2xl hidden sm:block">
                                <Cookie className="h-8 w-8 text-primary" />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-900 dark:text-white mb-1 flex items-center gap-2">
                                    <Cookie className="h-5 w-5 text-primary sm:hidden" /> 
                                    Cookie Fayllaridan Foydalanish
                                </h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                                    Biz sizga eng yaxshi tajribani taqdim etish uchun cookie fayllaridan foydalanamiz. Davom etish orqali siz barcha cookielarni qabul qilasiz.
                                </p>
                            </div>
                        </div>
                        
                        <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto shrink-0">
                            <button 
                                onClick={() => setShowSettings(true)}
                                className="px-4 py-2.5 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors flex items-center justify-center gap-2"
                            >
                                <Settings2 className="h-4 w-4" /> Sozlamalar
                            </button>
                            <button 
                                onClick={handleRejectAll}
                                className="px-4 py-2.5 text-sm font-bold text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 rounded-xl transition-colors"
                            >
                                Rad etish
                            </button>
                            <button 
                                onClick={handleAcceptAll}
                                className="px-6 py-2.5 text-sm font-bold text-white bg-slate-900 dark:bg-white dark:text-slate-900 rounded-xl shadow-lg shadow-primary/10 hover:shadow-xl hover:scale-105 transition-all active:scale-95 flex items-center justify-center gap-2"
                            >
                                Qabul qilish <ChevronRight className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
