
import React, { useRef, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { PhoneCall, MapPin, Clock, Mail, Calendar, Shield, Star, Info, CheckCircle, Heart, Award, ThumbsUp, Zap, Smile, Image as ImageIcon, Trash2, Plus, Settings, Move, X, Upload, AlignLeft, AlignCenter, AlignRight, Send, Instagram, Facebook, Youtube, Globe, Link as LinkIcon, DollarSign, Percent, Camera } from 'lucide-react';
import { SiteConfig, HeroMedia, GradientConfig, CustomInfoItem } from '../types';
import { GradientPicker } from './GradientPicker';
import { uploadToSupabase } from '../services/supabase';

interface HeroSectionProps {
  onImageSelected: (base64: string) => void;
  isAdmin: boolean;
  onAdminLoginClick: () => void;
  config: SiteConfig;
  isEditing?: boolean;
  onUpdateConfig?: (updates: Partial<SiteConfig>) => void;
  onMediaUpdate?: (media: HeroMedia[]) => void;
}

const DEFAULT_IMAGES = [
  "https://images.unsplash.com/photo-1629909613654-28e377c37b09?q=80&w=2600&auto=format&fit=crop", // Dental Clinic
  "https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?q=80&w=2600&auto=format&fit=crop", // Dental Chair
  "https://images.unsplash.com/photo-1598256989494-02638563a2a9?q=80&w=2600&auto=format&fit=crop"  // Dental Tools
];

const ICONS: Record<string, React.FC<any>> = {
    Phone: PhoneCall, MapPin, Clock, Mail, Calendar, Shield, Star, Info, CheckCircle, Heart, Award, ThumbsUp, Zap, Smile,
    Telegram: Send, Instagram, Facebook, Youtube: Youtube, Website: Globe, Link: LinkIcon, Dollar: DollarSign, Percent
};

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

export const HeroSection: React.FC<HeroSectionProps> = ({ onImageSelected, isAdmin, onAdminLoginClick, config, isEditing, onUpdateConfig, onMediaUpdate }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaInputRef = useRef<HTMLInputElement>(null);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  
  // Settings Logic
  const [showSettings, setShowSettings] = useState(false);
  const [activeTab, setActiveTab] = useState<'bg' | 'text' | 'info'>('bg');
  
  // Floating Window Logic (Global Settings)
  const [settingsPos, setSettingsPos] = useState({ x: 20, y: 100 });
  const isDraggingSettings = useRef(false);
  const dragStartPos = useRef({ x: 0, y: 0 });

  // Floating Window Logic (Item Settings)
  const [activeItemId, setActiveItemId] = useState<string | null>(null);
  const [itemSettingsPos, setItemSettingsPos] = useState({ x: 50, y: 150 });
  const isDraggingItemSettings = useRef(false);
  const itemDragStartPos = useRef({ x: 0, y: 0 });

  const mediaItems = config.heroMedia && config.heroMedia.length > 0 
    ? config.heroMedia 
    : DEFAULT_IMAGES.map((url, idx) => ({ id: `def-${idx}`, type: 'image' as const, url }));

  const heroBackgroundGradient = config.heroBackgroundGradient;
  const heroTextGradient = config.heroTextGradient;
  const customCardsGradient = config.customCardsGradient;

  useEffect(() => {
    if (mediaItems.length > 1 && !isEditing) {
        const interval = setInterval(() => {
            setCurrentMediaIndex((prev) => (prev + 1) % mediaItems.length);
        }, 5000); 
        return () => clearInterval(interval);
    }
  }, [mediaItems.length, isEditing]);

  // Global Drag Handlers
  useEffect(() => {
      const handleMove = (e: MouseEvent | TouchEvent) => {
          if (isDraggingSettings.current) {
              const clientX = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
              const clientY = 'touches' in e ? e.touches[0].clientY : (e as MouseEvent).clientY;
              setSettingsPos({ x: clientX - dragStartPos.current.x, y: clientY - dragStartPos.current.y });
          }
          if (isDraggingItemSettings.current) {
              const clientX = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
              const clientY = 'touches' in e ? e.touches[0].clientY : (e as MouseEvent).clientY;
              setItemSettingsPos({ x: clientX - itemDragStartPos.current.x, y: clientY - itemDragStartPos.current.y });
          }
      };
      const handleUp = () => { isDraggingSettings.current = false; isDraggingItemSettings.current = false; };
      
      if (showSettings || activeItemId) {
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
  }, [showSettings, activeItemId]);

  const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
      isDraggingSettings.current = true;
      const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
      dragStartPos.current = { x: clientX - settingsPos.x, y: clientY - settingsPos.y };
  };

  const handleItemDragStart = (e: React.MouseEvent | React.TouchEvent) => {
      isDraggingItemSettings.current = true;
      const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
      itemDragStartPos.current = { x: clientX - itemSettingsPos.x, y: clientY - itemSettingsPos.y };
  };

  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!onMediaUpdate || !e.target.files) return;
      const files = Array.from(e.target.files) as File[];
      setIsUploading(true);
      const newMedia: HeroMedia[] = [];
      
      try {
          for (const file of files) {
              const url = await uploadToSupabase(file);
              const type = file.type.startsWith('video') ? 'video' : 'image';
              if (url) {
                  newMedia.push({ id: `hm-${Date.now()}-${Math.random()}`, type, url });
              }
          }
          if (newMedia.length > 0) {
              onMediaUpdate([...(config.heroMedia || []), ...newMedia]);
          }
      } catch(e) {
          console.error("Upload failed", e);
      } finally {
          setIsUploading(false);
          if (mediaInputRef.current) mediaInputRef.current.value = '';
      }
  };

  const addCustomItem = () => {
      if(onUpdateConfig) onUpdateConfig({ customItems: [...(config.customItems || []), { id: `ci-${Date.now()}`, icon: 'Star', text: 'Yangi', label: 'Ma\'lumot', isVisible: true, link: '#' }] });
  };
  const updateCustomItem = (id: string, updates: Partial<CustomInfoItem>) => {
      if(onUpdateConfig) onUpdateConfig({ customItems: config.customItems?.map(i => i.id === id ? { ...i, ...updates } : i) });
  };
  const deleteCustomItem = (id: string) => {
      if(onUpdateConfig) onUpdateConfig({ customItems: config.customItems?.filter(i => i.id !== id) });
      if (activeItemId === id) setActiveItemId(null);
  };

  const heroHeight = config.style?.heroHeight || 600;

  const backgroundStyle = heroBackgroundGradient 
      ? { background: generateCSS(heroBackgroundGradient) } 
      : { background: `linear-gradient(to bottom, ${config.gradientStart}${Math.round((config.gradientStartOpacity || 86)/100*255).toString(16).padStart(2,'0')}, ${config.gradientEnd}${Math.round((config.gradientEndOpacity || 0)/100*255).toString(16).padStart(2,'0')})` };

  const headlineStyle = heroTextGradient
      ? { 
          backgroundImage: generateCSS(heroTextGradient), 
          color: 'transparent', 
          backgroundClip: 'text', 
          WebkitBackgroundClip: 'text' 
        } 
      : { 
          backgroundImage: (config.textGradientStart && config.textGradientEnd) ? `linear-gradient(to right, ${config.textGradientStart}, ${config.textGradientEnd})` : undefined,
          backgroundClip: (config.textGradientStart && config.textGradientEnd) ? 'text' : undefined,
          WebkitBackgroundClip: (config.textGradientStart && config.textGradientEnd) ? 'text' : undefined,
          color: (config.textGradientStart && config.textGradientEnd) ? 'transparent' : config.headlineColor || '#ffffff'
        };

  const customCardStyle = customCardsGradient 
      ? { background: generateCSS(customCardsGradient) }
      : { backgroundColor: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)' };

  return (
    <div className={`relative bg-secondary overflow-hidden w-full group/hero ${isEditing ? 'border-b-4 border-dashed border-primary/50' : ''}`}>
      
      {isEditing && (
          <>
            <div className="absolute top-4 left-4 z-50 flex gap-2">
                <button onClick={() => setShowSettings(!showSettings)} className={`px-4 py-2 rounded-xl font-bold shadow-lg flex items-center gap-2 transition-colors border ${showSettings ? 'bg-primary text-white border-primary' : 'bg-white text-slate-900 border-white/20'}`}>
                    <Settings className="h-4 w-4" /> Hero Sozlamalari
                </button>
            </div>

            {/* Main Settings Portal */}
            {showSettings && createPortal(
                <div 
                    className="fixed z-[100] bg-white dark:bg-slate-900 p-4 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 w-[90vw] md:w-96 animate-fade-in text-left rounded-xl flex flex-col"
                    style={{ top: settingsPos.y, left: settingsPos.x, maxHeight: '85vh' }}
                >
                    <div 
                        className="flex justify-between items-center mb-3 pb-2 border-b border-slate-100 dark:border-slate-800 cursor-move touch-none"
                        onMouseDown={handleDragStart}
                        onTouchStart={handleDragStart}
                    >
                        <span className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2 pointer-events-none"><Move className="h-3 w-3" /> Hero Sozlamalari</span>
                        <button onClick={() => setShowSettings(false)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded"><X className="h-4 w-4 text-slate-400" /></button>
                    </div>

                    <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg mb-4 shrink-0">
                        <button onClick={() => setActiveTab('bg')} className={`flex-1 py-1.5 rounded text-[10px] font-bold transition-colors ${activeTab === 'bg' ? 'bg-white dark:bg-slate-700 shadow text-primary' : 'text-slate-500'}`}>Fon</button>
                        <button onClick={() => setActiveTab('text')} className={`flex-1 py-1.5 rounded text-[10px] font-bold transition-colors ${activeTab === 'text' ? 'bg-white dark:bg-slate-700 shadow text-primary' : 'text-slate-500'}`}>Matn</button>
                        <button onClick={() => setActiveTab('info')} className={`flex-1 py-1.5 rounded text-[10px] font-bold transition-colors ${activeTab === 'info' ? 'bg-white dark:bg-slate-700 shadow text-primary' : 'text-slate-500'}`}>Labels</button>
                    </div>

                    <div className="space-y-4 overflow-y-auto custom-scrollbar pr-1 pb-2 flex-1">
                        {activeTab === 'bg' && (
                            <div className="space-y-4">
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-2">Media Yuklash</label>
                                    <div className="flex gap-2">
                                        <button onClick={() => mediaInputRef.current?.click()} disabled={isUploading} className="flex-1 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-bold border border-dashed border-slate-300 dark:border-slate-600 hover:border-primary hover:text-primary transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
                                            {isUploading ? <><div className="animate-spin h-3 w-3 border-2 border-primary border-t-transparent rounded-full"/> Yuklanmoqda...</> : <><ImageIcon className="h-4 w-4" /> Rasm/Video</>}
                                        </button>
                                        <input type="file" ref={mediaInputRef} className="hidden" multiple accept="image/*,video/*" onChange={handleMediaUpload} />
                                    </div>
                                    
                                    {config.heroMedia && config.heroMedia.length > 0 && (
                                        <div className="flex gap-2 mt-2 overflow-x-auto pb-2 custom-scrollbar">
                                            {config.heroMedia.map((m, idx) => (
                                                <div key={m.id} className="relative w-12 h-12 flex-shrink-0 rounded overflow-hidden group">
                                                    {m.type === 'video' ? <video src={m.url} className="w-full h-full object-cover" /> : <img src={m.url} className="w-full h-full object-cover" />}
                                                    <button onClick={() => onMediaUpdate && onMediaUpdate(config.heroMedia!.filter(x => x.id !== m.id))} className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white"><Trash2 className="h-4 w-4" /></button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <div className="border-t border-slate-100 dark:border-slate-800 pt-4">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-2">Overlay Gradient</label>
                                    <GradientPicker value={heroBackgroundGradient} onChange={(g) => onUpdateConfig && onUpdateConfig({ heroBackgroundGradient: g })} />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Balandlik: {heroHeight}px</label>
                                    <input type="range" min="400" max="1000" step="50" value={heroHeight} onChange={(e) => onUpdateConfig && onUpdateConfig({ style: { ...config.style, heroHeight: parseInt(e.target.value) } as any })} className="w-full h-1 bg-slate-200 rounded-lg accent-primary" />
                                </div>
                            </div>
                        )}

                        {activeTab === 'text' && (
                            <div className="space-y-4">
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-2">Sarlavha Gradienti</label>
                                    <GradientPicker value={heroTextGradient} onChange={(g) => onUpdateConfig && onUpdateConfig({ heroTextGradient: g })} />
                                </div>
                                <div className="border-t border-slate-100 dark:border-slate-800 pt-4">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-2">Subheadline Rangi</label>
                                    <input type="color" value={config.subheadlineColor || '#f1f5f9'} onChange={(e) => onUpdateConfig && onUpdateConfig({ subheadlineColor: e.target.value })} className="w-full h-8 rounded cursor-pointer border-none p-0 bg-transparent" />
                                </div>
                            </div>
                        )}

                        {activeTab === 'info' && (
                            <div className="space-y-4">
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-2">Kartalar Foni (Gradient)</label>
                                    <GradientPicker value={customCardsGradient} onChange={(g) => onUpdateConfig && onUpdateConfig({ customCardsGradient: g })} />
                                </div>
                                <div className="border-t border-slate-100 dark:border-slate-800 pt-4">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-2">Joylashuv</label>
                                    <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg gap-1">
                                        <button onClick={() => onUpdateConfig && onUpdateConfig({ customCardsPosition: 'left' })} className={`flex-1 p-1 rounded ${(!config.customCardsPosition || config.customCardsPosition === 'left') ? 'bg-white dark:bg-slate-700 shadow text-primary' : 'text-slate-400'}`}><AlignLeft className="h-3 w-3 mx-auto" /></button>
                                        <button onClick={() => onUpdateConfig && onUpdateConfig({ customCardsPosition: 'center' })} className={`flex-1 p-1 rounded ${config.customCardsPosition === 'center' ? 'bg-white dark:bg-slate-700 shadow text-primary' : 'text-slate-400'}`}><AlignCenter className="h-3 w-3 mx-auto" /></button>
                                        <button onClick={() => onUpdateConfig && onUpdateConfig({ customCardsPosition: 'right' })} className={`flex-1 p-1 rounded ${config.customCardsPosition === 'right' ? 'bg-white dark:bg-slate-700 shadow text-primary' : 'text-slate-400'}`}><AlignRight className="h-3 w-3 mx-auto" /></button>
                                    </div>
                                </div>
                                <div className="bg-blue-50 dark:bg-blue-900/20 p-2 rounded text-[10px] text-blue-600 dark:text-blue-300">
                                    Label sozlamalari uchun Preview dagi kartalar ustiga bosing.
                                </div>
                            </div>
                        )}
                    </div>
                </div>,
                document.body
            )}
          </>
      )}

      <div className="absolute inset-0 z-0 h-full w-full">
        {mediaItems.map((media, index) => {
            const isDefault = (typeof media.url === 'string' && media.url.startsWith('http'));
            const src = isDefault ? media.url : (media.type === 'video' ? (media.url.startsWith('http') ? media.url : `data:video/mp4;base64,${media.url}`) : (media.url.startsWith('http') ? media.url : `data:image/jpeg;base64,${media.url}`));
            
            return (
                <div key={media.id || index} className={`absolute inset-0 w-full h-full transition-opacity duration-1000 ease-in-out ${index === currentMediaIndex ? 'opacity-100' : 'opacity-0'}`}>
                    {media.type === 'video' ? (
                        <video src={src} autoPlay muted loop playsInline className="absolute inset-0 w-full h-full object-cover" />
                    ) : (
                        <img src={src} alt={`Slide ${index + 1}`} className="absolute inset-0 w-full h-full object-cover" />
                    )}
                </div>
            );
        })}
        
        <div 
            className="absolute inset-0 w-full h-full" 
            style={backgroundStyle}
        >
             <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-slate-50 dark:from-slate-950 to-transparent" />
        </div>
      </div>

      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center text-center justify-center transition-all duration-300">
        <div className="w-full flex flex-col justify-center items-center py-24 lg:py-0" style={{ minHeight: `${heroHeight}px` }}> 
            
            {isEditing ? (
                <textarea
                    value={config.headline}
                    onChange={(e) => onUpdateConfig && onUpdateConfig({ headline: e.target.value })}
                    className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold bg-transparent text-center border-2 border-dashed border-white/30 rounded-xl p-2 w-full resize-none outline-none focus:border-primary mb-6"
                    rows={2}
                    style={{ 
                        fontFamily: config.subheadlineFont || "'Inter', sans-serif",
                        ...headlineStyle
                    }}
                />
            ) : (
                <h1 
                    className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight mb-6 leading-[1.1] drop-shadow-lg flex flex-wrap justify-center gap-x-3 sm:gap-x-4"
                    style={{ 
                        fontFamily: config.subheadlineFont || "'Inter', sans-serif",
                        ...headlineStyle
                    }}
                >
                    {config.headline}
                </h1>
            )}
            
            {isEditing ? (
                <textarea 
                    value={config.subheadline}
                    onChange={(e) => onUpdateConfig && onUpdateConfig({ subheadline: e.target.value })}
                    className="max-w-2xl text-lg sm:text-xl bg-transparent text-center border-2 border-dashed border-white/30 rounded-xl p-2 w-full resize-none outline-none focus:border-primary mb-10"
                    rows={3}
                    style={{ color: config.subheadlineColor || '#f1f5f9' }}
                />
            ) : (
                <p 
                className="max-w-2xl text-lg sm:text-xl mb-10 leading-relaxed font-light drop-shadow-md"
                style={{ 
                    fontFamily: config.subheadlineFont || "'Inter', sans-serif",
                    color: config.subheadlineColor || '#f1f5f9'
                }}
                >
                {config.subheadline}
                </p>
            )}

            {/* Custom Labels Area */}
            <div className="flex flex-wrap items-center justify-center gap-4 mb-4 pointer-events-auto">
                {config.customItems && config.customItems.length > 0 ? (
                    <div 
                        className={`flex flex-wrap gap-4 animate-slide-up ${config.customCardsPosition === 'left' ? 'justify-start' : config.customCardsPosition === 'right' ? 'justify-end' : 'justify-center'}`}
                    >
                        {config.customItems.map(item => {
                            const Icon = ICONS[item.icon] || Star;
                            return (
                                <div key={item.id} className="relative group">
                                    <a 
                                        href={item.link || '#'}
                                        onClick={(e) => isEditing && e.preventDefault()}
                                        className="flex items-center gap-3 px-5 py-3 rounded-2xl shadow-lg backdrop-blur-md border border-white/10 transition-transform hover:-translate-y-1 hover:shadow-xl"
                                        style={customCardStyle}
                                    >
                                        <div className="p-2 bg-white/20 rounded-full text-white" style={item.color ? { backgroundColor: item.color, color: '#fff' } : {}}>
                                            <Icon className="h-5 w-5" />
                                        </div>
                                        <div className="text-left">
                                            <p className="text-xs text-white/70 font-medium uppercase tracking-wider">{item.label}</p>
                                            <p className="text-sm font-bold text-white group-hover:text-primary transition-colors">{item.text}</p>
                                        </div>
                                    </a>
                                    {isEditing && (
                                        <div className="absolute -top-3 -right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-50">
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); setActiveItemId(activeItemId === item.id ? null : item.id); setItemSettingsPos({ x: e.clientX, y: e.clientY + 20 }); }} 
                                                className="p-1.5 bg-white text-slate-500 rounded-full shadow hover:text-primary"
                                            >
                                                <Settings className="h-3 w-3" />
                                            </button>
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); deleteCustomItem(item.id); }} 
                                                className="p-1.5 bg-red-500 text-white rounded-full shadow hover:bg-red-600"
                                            >
                                                <Trash2 className="h-3 w-3" />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                        {/* Direct Add Button in Editing Mode */}
                        {isEditing && (
                            <button onClick={addCustomItem} className="flex items-center gap-2 px-5 py-3 rounded-2xl shadow-lg backdrop-blur-md border border-dashed border-white/40 hover:bg-white/20 transition-colors text-white z-50">
                                <Plus className="h-5 w-5" />
                                <span className="text-sm font-bold">Add Custom Label</span>
                            </button>
                        )}
                    </div>
                ) : (
                    /* Show Add Button even if list is empty in editing mode */
                    isEditing && (
                        <button onClick={addCustomItem} className="flex items-center gap-2 px-5 py-3 rounded-2xl shadow-lg backdrop-blur-md border border-dashed border-white/40 hover:bg-white/20 transition-colors text-white z-50">
                            <Plus className="h-5 w-5" />
                            <span className="text-sm font-bold">Add Custom Label</span>
                        </button>
                    )
                )}
            </div>

            {/* Admin Only Upload Button in Hero */}
            {!config.customItems?.length && isAdmin && !isEditing && (
                <div className="w-full max-w-4xl mx-auto animate-slide-up flex flex-col items-center gap-6 mt-8">
                    <div 
                        onClick={() => fileInputRef.current?.click()}
                        className="bg-white/10 backdrop-blur-md border border-white/20 p-2 rounded-[2rem] shadow-2xl shadow-primary/30 max-w-md w-full mx-auto relative group overflow-hidden cursor-pointer"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-sky-400/20 to-primary/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-pulse"></div>
                        <div className="relative bg-white/90 dark:bg-slate-900/90 rounded-[1.8rem] p-6 text-center transition-transform duration-300 group-hover:scale-[0.98]">
                            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 transition-colors">
                                <Upload className="h-8 w-8 text-primary" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1">Yangi Mahsulot</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Rasm yuklab mahsulot qo'shish</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
      </div>
      
      <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            const reader = new FileReader();
            reader.onload = (ev) => {
                const res = ev.target?.result as string;
                const base64 = res.split(',')[1]; // Keep standard base64 for local quick add without explicit upload if needed, but App.tsx handles this.
                onImageSelected(base64); // This might need refactor if onImageSelected expects base64 or URL
            };
            reader.readAsDataURL(file);
          }
          if (fileInputRef.current) fileInputRef.current.value = '';
      }} />
    </div>
  );
};
