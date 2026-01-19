
import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Advertisement, AdConfig } from '../types';
import { ExternalLink, ChevronLeft, ChevronRight, Plus, Trash2, Edit2, Image as ImageIcon, Settings, X, LayoutGrid, Monitor, Smartphone, Tablet, Move, AlignLeft, AlignCenter, AlignRight, Play, Pause, MousePointerClick } from 'lucide-react';
import { GradientPicker } from './GradientPicker';
import { uploadToSupabase } from '../services/supabase';

interface AdBannerProps {
  ads: Advertisement[];
  config?: AdConfig;
  isEditing?: boolean;
  onAdUpdate?: (ad: Advertisement) => void;
  onAdAdd?: (ad: Advertisement) => void;
  onAdDelete?: (id: string) => void;
  onConfigUpdate?: (config: Partial<AdConfig>) => void;
}

export const AdBanner: React.FC<AdBannerProps> = ({ ads, config, isEditing, onAdUpdate, onAdAdd, onAdDelete, onConfigUpdate }) => {
  const activeAds = isEditing ? ads : ads.filter(ad => ad.isActive);
  const [currentIndex, setCurrentIndex] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  // Settings Panel State
  const [showSettings, setShowSettings] = useState(false);
  const [settingsPos, setSettingsPos] = useState({ x: 20, y: 100 });
  const isDraggingSettings = useRef(false);
  const dragStartPos = useRef({ x: 0, y: 0 });
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
      const handleResize = () => setIsMobile(window.innerWidth < 768);
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Defaults
  const layoutMode = config?.layoutMode || 'carousel';
  const autoplay = config?.autoplay ?? true;
  const showControls = config?.showControls ?? true;
  const intervalTime = (config?.interval || 5) * 1000;
  const gap = config?.gap ?? 16;
  const paddingX = config?.paddingX ?? 16;
  const paddingY = config?.paddingY ?? 32;
  const borderRadius = config?.borderRadius ?? 32;
  const height = config?.height || 0; // 0 = aspect ratio mode
  const contentAlign = config?.contentAlign || 'left';
  
  // Responsive Columns
  const colsMobile = config?.gridColumns?.mobile || 1;
  const colsTablet = config?.gridColumns?.tablet || 1;
  const colsDesktop = config?.gridColumns?.desktop || 1;

  // Drag Handlers
  useEffect(() => {
      const handleMove = (e: MouseEvent | TouchEvent) => {
          if (isDraggingSettings.current) {
              const clientX = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
              const clientY = 'touches' in e ? e.touches[0].clientY : (e as MouseEvent).clientY;
              setSettingsPos({ x: clientX - dragStartPos.current.x, y: clientY - dragStartPos.current.y });
          }
      };
      const handleUp = () => { isDraggingSettings.current = false; };
      if (showSettings) {
          window.addEventListener('mousemove', handleMove);
          window.addEventListener('mouseup', handleUp);
          window.addEventListener('touchmove', handleMove, { passive: false });
          window.addEventListener('touchend', handleUp);
      }
      return () => {
          window.removeEventListener('mousemove', handleMove);
          window.removeEventListener('mouseup', handleUp);
          window.removeEventListener('touchmove', handleMove);
          window.removeEventListener('touchend', handleUp);
      }
  }, [showSettings]);

  const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
      if (isMobile) return; // Disable dragging on mobile (use fixed bottom sheet)
      isDraggingSettings.current = true;
      const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
      dragStartPos.current = { x: clientX - settingsPos.x, y: clientY - settingsPos.y };
  };

  useEffect(() => {
    if (layoutMode !== 'carousel' || activeAds.length <= 1 || !autoplay || isEditing) return;
    const interval = setInterval(() => {
        setCurrentIndex(prev => (prev + 1) % activeAds.length);
    }, intervalTime);
    return () => clearInterval(interval);
  }, [activeAds.length, autoplay, intervalTime, isEditing, layoutMode]);

  const nextSlide = (e?: React.MouseEvent) => {
      e?.stopPropagation();
      setCurrentIndex((prev) => (prev + 1) % (activeAds.length || 1));
  };

  const prevSlide = (e?: React.MouseEvent) => {
      e?.stopPropagation();
      setCurrentIndex((prev) => (prev - 1 + (activeAds.length || 1)) % (activeAds.length || 1));
  };

  const formatUrl = (url?: string) => {
      if (!url) return '#';
      const cleanUrl = url.trim();
      if (cleanUrl.startsWith('http://') || cleanUrl.startsWith('https://')) return cleanUrl;
      return `https://${cleanUrl}`;
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file && onAdAdd) {
          setIsUploading(true);
          try {
              const url = await uploadToSupabase(file);
              if (url) {
                  const newAd: Advertisement = {
                      id: `ad-${Date.now()}`,
                      imageUrl: url,
                      title: 'Yangi Reklama',
                      description: 'Tavsif...',
                      buttonText: 'Batafsil',
                      buttonBgColor: '#ffffff',
                      buttonTextColor: '#0f172a',
                      link: '',
                      isActive: true,
                      createdAt: Date.now()
                  };
                  onAdAdd(newAd);
              }
          } catch(e) {
              console.error("Banner upload failed", e);
          } finally {
              setIsUploading(false);
          }
      }
      if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const renderAdContent = (ad: Advertisement) => (
      <div className={`absolute inset-0 bg-gradient-to-r from-black/90 via-black/50 to-transparent flex items-center ${isEditing ? 'opacity-100' : ''}`}>
          <div 
              className={`px-6 sm:px-10 w-full md:max-w-2xl text-white flex flex-col justify-center h-full`}
              style={{ 
                  textAlign: contentAlign,
                  alignItems: contentAlign === 'center' ? 'center' : contentAlign === 'right' ? 'flex-end' : 'flex-start' 
              }}
          >
              {isEditing ? (
                  <div className="space-y-2 bg-black/60 p-3 rounded-xl backdrop-blur-md border border-white/10 w-full max-w-sm cursor-auto" onClick={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()}>
                      <input 
                          value={ad.title || ''}
                          onChange={(e) => onAdUpdate && onAdUpdate({ ...ad, title: e.target.value })}
                          className="bg-transparent border-b border-white/30 text-white font-extrabold text-lg w-full focus:outline-none focus:border-white placeholder-white/50"
                          placeholder="Sarlavha..."
                      />
                      <textarea
                          value={ad.description || ''}
                          onChange={(e) => onAdUpdate && onAdUpdate({ ...ad, description: e.target.value })}
                          className="bg-transparent border-b border-white/30 text-white/90 text-xs w-full focus:outline-none focus:border-white resize-none placeholder-white/50"
                          rows={2}
                          placeholder="Tavsif..."
                      />
                      <div className="flex gap-2">
                          <input 
                              value={ad.buttonText || ''}
                              onChange={(e) => onAdUpdate && onAdUpdate({ ...ad, buttonText: e.target.value })}
                              className="bg-white/10 border border-white/20 rounded px-2 py-1 text-xs text-white flex-1 w-full"
                              placeholder="Tugma"
                          />
                          <input 
                              value={ad.link || ''}
                              onChange={(e) => onAdUpdate && onAdUpdate({ ...ad, link: e.target.value })}
                              className="bg-white/10 border border-white/20 rounded px-2 py-1 text-xs text-white flex-1 w-full"
                              placeholder="Link"
                          />
                      </div>
                      <div className="flex gap-2 items-center">
                          <input type="color" value={ad.buttonBgColor || '#ffffff'} onChange={(e) => onAdUpdate && onAdUpdate({ ...ad, buttonBgColor: e.target.value })} className="w-6 h-6 rounded cursor-pointer border-none p-0" />
                          <input type="color" value={ad.buttonTextColor || '#000000'} onChange={(e) => onAdUpdate && onAdUpdate({ ...ad, buttonTextColor: e.target.value })} className="w-6 h-6 rounded cursor-pointer border-none p-0" />
                      </div>
                  </div>
              ) : (
                  <div className="space-y-2 sm:space-y-4 pr-4">
                      <div>
                          {ad.title && <h3 className="text-lg sm:text-2xl md:text-3xl font-extrabold mb-1 drop-shadow-lg leading-tight line-clamp-2">{ad.title}</h3>}
                          {ad.description && <p className="text-xs sm:text-sm text-white/90 drop-shadow-md line-clamp-3 leading-relaxed max-w-lg">{ad.description}</p>}
                      </div>
                      {ad.link && ad.link.trim() !== '' && (
                          <a href={formatUrl(ad.link)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full font-bold text-xs sm:text-sm transition-all active:scale-95 shadow-lg pointer-events-auto transform hover:translate-x-1" style={{ backgroundColor: ad.buttonBgColor || '#ffffff', color: ad.buttonTextColor || '#0f172a' }} onClick={(e) => e.stopPropagation()}>
                              {ad.buttonText || 'Batafsil'} <ExternalLink className="h-3 w-3" />
                          </a>
                      )}
                  </div>
              )}
          </div>
      </div>
  );

  const getImageSrc = (url: string) => {
      if (url.startsWith('data:') || url.startsWith('http')) return url;
      // Fallback
      return `data:image/jpeg;base64,${url}`;
  };

  if (activeAds.length === 0 && !isEditing) return null;

  return (
    <div 
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative group/banner"
        style={{ paddingTop: `${paddingY * 0.25}rem`, paddingBottom: `${paddingY * 0.25}rem`, backgroundColor: config?.backgroundColor }}
    >
      {isEditing && (
          <div className="absolute top-4 right-4 z-40 flex gap-2">
              <button onClick={() => fileInputRef.current?.click()} disabled={isUploading} className="p-2 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 hover:text-primary transition-colors disabled:opacity-50" title="Banner Qo'shish">
                  {isUploading ? <div className="w-5 h-5 rounded-full border-2 border-primary border-t-transparent animate-spin" /> : <Plus className="h-5 w-5" />}
              </button>
              <button onClick={() => setShowSettings(!showSettings)} className={`p-2 rounded-lg shadow-lg border transition-colors ${showSettings ? 'bg-primary text-white border-primary' : 'bg-white dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700'}`}><Settings className="h-5 w-5" /></button>
          </div>
      )}

      {/* --- SETTINGS PANEL (PORTAL + MOBILE BOTTOM SHEET) --- */}
      {isEditing && showSettings && createPortal(
          <div 
              className={`fixed z-[9999] bg-white dark:bg-slate-900 p-4 shadow-2xl border border-slate-200 dark:border-slate-800 animate-fade-in text-left flex flex-col ${isMobile ? 'bottom-0 left-0 right-0 rounded-t-2xl border-b-0' : 'rounded-xl w-80'}`}
              style={isMobile ? { maxHeight: '85vh' } : { top: settingsPos.y, left: settingsPos.x, maxHeight: '80vh' }}
          >
              <div 
                  className={`flex justify-between items-center mb-3 pb-2 border-b border-slate-100 dark:border-slate-800 ${!isMobile ? 'cursor-move' : ''} touch-none`}
                  onMouseDown={handleDragStart}
                  onTouchStart={handleDragStart}
              >
                  <span className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2 pointer-events-none"><Move className="h-3 w-3" /> Banner Sozlamalari</span>
                  <button onClick={() => setShowSettings(false)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded"><X className="h-4 w-4 text-slate-400" /></button>
              </div>

              <div className="space-y-4 overflow-y-auto custom-scrollbar pr-1 flex-1">
                  <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Layout Mode</label>
                      <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg gap-1">
                          <button onClick={() => onConfigUpdate && onConfigUpdate({ layoutMode: 'carousel' })} className={`flex-1 text-[10px] py-1.5 rounded flex items-center justify-center gap-1 ${layoutMode === 'carousel' ? 'bg-white dark:bg-slate-700 shadow text-primary font-bold' : 'text-slate-500'}`}>Carousel</button>
                          <button onClick={() => onConfigUpdate && onConfigUpdate({ layoutMode: 'grid' })} className={`flex-1 text-[10px] py-1.5 rounded flex items-center justify-center gap-1 ${layoutMode === 'grid' ? 'bg-white dark:bg-slate-700 shadow text-primary font-bold' : 'text-slate-500'}`}><LayoutGrid className="h-3 w-3" /> Grid</button>
                      </div>
                  </div>

                  {layoutMode === 'carousel' && (
                      <div className="border-t border-slate-100 dark:border-slate-800 pt-2 space-y-3">
                          <label className="text-[10px] font-bold text-slate-400 uppercase block">Carousel Sozlamalari</label>
                          <div className="flex items-center justify-between">
                              <span className="text-[10px] text-slate-600 dark:text-slate-300 font-bold">Autoplay</span>
                              <button onClick={() => onConfigUpdate && onConfigUpdate({ autoplay: !autoplay })} className={`w-8 h-4 rounded-full transition-colors relative ${autoplay ? 'bg-primary' : 'bg-slate-300 dark:bg-slate-700'}`}>
                                  <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform ${autoplay ? 'left-4.5' : 'left-0.5'}`}></div>
                              </button>
                          </div>
                          <div className="flex items-center justify-between">
                              <span className="text-[10px] text-slate-600 dark:text-slate-300 font-bold">Navigatsiya</span>
                              <button onClick={() => onConfigUpdate && onConfigUpdate({ showControls: !showControls })} className={`w-8 h-4 rounded-full transition-colors relative ${showControls ? 'bg-primary' : 'bg-slate-300 dark:bg-slate-700'}`}>
                                  <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform ${showControls ? 'left-4.5' : 'left-0.5'}`}></div>
                              </button>
                          </div>
                          <div className="flex items-center gap-2">
                              <label className="text-[9px] w-12 text-slate-400">Tezlik (s)</label>
                              <input type="range" min="2" max="10" value={config?.interval || 5} onChange={(e) => onConfigUpdate && onConfigUpdate({ interval: parseInt(e.target.value) })} className="flex-1 h-1 bg-slate-200 rounded accent-primary" />
                              <span className="text-[9px] font-mono w-4 text-right">{config?.interval || 5}</span>
                          </div>
                      </div>
                  )}

                  {layoutMode === 'grid' && (
                    <div className="border-t border-slate-100 dark:border-slate-800 pt-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase block mb-2">Ustunlar (Responsive)</label>
                        <div className="grid grid-cols-3 gap-2 text-center">
                            <div className="flex flex-col items-center bg-slate-50 dark:bg-slate-800 p-2 rounded-lg">
                                <Smartphone className="h-4 w-4 text-slate-400 mb-1" />
                                <span className="text-[9px] font-bold mb-1">{colsMobile}</span>
                                <input type="range" min="1" max="4" value={colsMobile} onChange={(e) => onConfigUpdate && onConfigUpdate({ gridColumns: { mobile: parseInt(e.target.value), tablet: colsTablet, desktop: colsDesktop } })} className="w-full h-1 bg-slate-200 rounded accent-primary" />
                            </div>
                            <div className="flex flex-col items-center bg-slate-50 dark:bg-slate-800 p-2 rounded-lg">
                                <Tablet className="h-4 w-4 text-slate-400 mb-1" />
                                <span className="text-[9px] font-bold mb-1">{colsTablet}</span>
                                <input type="range" min="1" max="4" value={colsTablet} onChange={(e) => onConfigUpdate && onConfigUpdate({ gridColumns: { mobile: colsMobile, tablet: parseInt(e.target.value), desktop: colsDesktop } })} className="w-full h-1 bg-slate-200 rounded accent-primary" />
                            </div>
                            <div className="flex flex-col items-center bg-slate-50 dark:bg-slate-800 p-2 rounded-lg">
                                <Monitor className="h-4 w-4 text-slate-400 mb-1" />
                                <span className="text-[9px] font-bold mb-1">{colsDesktop}</span>
                                <input type="range" min="1" max="6" value={colsDesktop} onChange={(e) => onConfigUpdate && onConfigUpdate({ gridColumns: { mobile: colsMobile, tablet: colsTablet, desktop: parseInt(e.target.value) } })} className="w-full h-1 bg-slate-200 rounded accent-primary" />
                            </div>
                        </div>
                    </div>
                  )}

                  <div className="border-t border-slate-100 dark:border-slate-800 pt-2 space-y-2">
                      <div className="flex items-center gap-2">
                          <label className="text-[9px] w-12 text-slate-400">Balandlik</label>
                          <input type="range" min="0" max="600" step="10" value={height} onChange={(e) => onConfigUpdate && onConfigUpdate({ height: parseInt(e.target.value) })} className="flex-1 h-1 bg-slate-200 rounded accent-primary" />
                          <span className="text-[9px] font-mono w-8 text-right">{height ? `${height}px` : 'Auto'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                          <label className="text-[9px] w-12 text-slate-400">Gap</label>
                          <input type="range" min="0" max="64" value={gap} onChange={(e) => onConfigUpdate && onConfigUpdate({ gap: parseInt(e.target.value) })} className="flex-1 h-1 bg-slate-200 rounded accent-primary" />
                          <span className="text-[9px] font-mono w-8 text-right">{gap}px</span>
                      </div>
                      <div className="flex items-center gap-2">
                          <label className="text-[9px] w-12 text-slate-400">Padding Y</label>
                          <input type="range" min="0" max="64" value={paddingY} onChange={(e) => onConfigUpdate && onConfigUpdate({ paddingY: parseInt(e.target.value) })} className="flex-1 h-1 bg-slate-200 rounded accent-primary" />
                          <span className="text-[9px] font-mono w-8 text-right">{paddingY}px</span>
                      </div>
                      <div className="flex items-center gap-2">
                          <label className="text-[9px] w-12 text-slate-400">Radius</label>
                          <input type="range" min="0" max="64" value={borderRadius} onChange={(e) => onConfigUpdate && onConfigUpdate({ borderRadius: parseInt(e.target.value) })} className="flex-1 h-1 bg-slate-200 rounded accent-primary" />
                          <span className="text-[9px] font-mono w-8 text-right">{borderRadius}px</span>
                      </div>
                  </div>

                  <div className="border-t border-slate-100 dark:border-slate-800 pt-2 pb-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Orqa Fon (Gradient)</label>
                      <GradientPicker value={config?.backgroundGradient} onChange={(g) => onConfigUpdate && onConfigUpdate({ backgroundGradient: g })} />
                  </div>

                  <div className="border-t border-slate-100 dark:border-slate-800 pt-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Matn Joylashuvi</label>
                      <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg gap-1">
                          <button onClick={() => onConfigUpdate && onConfigUpdate({ contentAlign: 'left' })} className={`flex-1 p-1 rounded ${contentAlign === 'left' ? 'bg-white dark:bg-slate-700 shadow text-primary' : 'text-slate-400'}`}><AlignLeft className="h-3 w-3 mx-auto" /></button>
                          <button onClick={() => onConfigUpdate && onConfigUpdate({ contentAlign: 'center' })} className={`flex-1 p-1 rounded ${contentAlign === 'center' ? 'bg-white dark:bg-slate-700 shadow text-primary' : 'text-slate-400'}`}><AlignCenter className="h-3 w-3 mx-auto" /></button>
                          <button onClick={() => onConfigUpdate && onConfigUpdate({ contentAlign: 'right' })} className={`flex-1 p-1 rounded ${contentAlign === 'right' ? 'bg-white dark:bg-slate-700 shadow text-primary' : 'text-slate-400'}`}><AlignRight className="h-3 w-3 mx-auto" /></button>
                      </div>
                  </div>
              </div>
          </div>,
          document.body
      )}

      {/* Grid and Carousel rendering remains same ... */}
      {layoutMode === 'grid' && (
          <div className="grid" style={{ gap: `${gap}px`, gridTemplateColumns: `repeat(${colsMobile}, minmax(0, 1fr))` }}>
              <style>{`
                  #ad-grid-${config?.gap} { display: grid; gap: ${gap}px; grid-template-columns: repeat(${colsMobile}, minmax(0, 1fr)); }
                  @media (min-width: 640px) { #ad-grid-${config?.gap} { grid-template-columns: repeat(${colsTablet}, minmax(0, 1fr)); } }
                  @media (min-width: 1024px) { #ad-grid-${config?.gap} { grid-template-columns: repeat(${colsDesktop}, minmax(0, 1fr)); } }
              `}</style>
              
              <div id={`ad-grid-${config?.gap}`} className="contents">
                  {activeAds.map((ad) => {
                      return (
                          <div key={ad.id} className="relative overflow-hidden shadow-md hover:shadow-xl transition-shadow group w-full" style={{ height: height ? `${height}px` : 'auto', aspectRatio: !height ? (config?.aspectRatio === 'auto' ? undefined : (config?.aspectRatio?.replace('/', '/') || '3/1')) : undefined, minHeight: height ? undefined : '200px', borderRadius: `${borderRadius}px` }}>
                              <img src={getImageSrc(ad.imageUrl)} alt="" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                              {renderAdContent(ad)}
                              {isEditing && (
                                  <button onClick={() => onAdDelete && onAdDelete(ad.id)} className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-20"><Trash2 className="h-3 w-3" /></button>
                              )}
                          </div>
                      );
                  })}
                  {isEditing && (
                      <div onClick={() => fileInputRef.current?.click()} className="flex flex-col items-center justify-center border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-400 cursor-pointer hover:border-primary hover:text-primary transition-colors w-full" style={{ height: height ? `${height}px` : 'auto', minHeight: '200px', borderRadius: `${borderRadius}px` }}>
                          <Plus className="h-8 w-8 mb-2" /><span className="text-xs font-bold">Qo'shish</span>
                      </div>
                  )}
              </div>
          </div>
      )}

      {layoutMode === 'carousel' && (
          <div className="relative overflow-hidden shadow-2xl shadow-primary/5 bg-white dark:bg-slate-900 group select-none w-full" style={{ height: height ? `${height}px` : undefined, aspectRatio: !height ? (config?.aspectRatio === 'auto' ? undefined : (config?.aspectRatio?.replace('/', '/') || '3/1')) : undefined, minHeight: height ? undefined : '200px', borderRadius: `${borderRadius}px` }}>
            <div className="flex w-full h-full transition-transform duration-500 ease-out will-change-transform" style={{ transform: `translateX(-${currentIndex * 100}%)` }}>
                {activeAds.map((ad) => {
                    return (
                        <div key={ad.id} className="w-full h-full relative flex-shrink-0 overflow-hidden group/slide">
                            <img src={getImageSrc(ad.imageUrl)} alt="" className="w-full h-full object-cover pointer-events-none transition-transform duration-700 group-hover:scale-105" />
                            {renderAdContent(ad)}
                            {isEditing && <button onClick={() => onAdDelete && onAdDelete(ad.id)} className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full shadow-lg hover:bg-red-600 transition-colors z-20"><Trash2 className="h-4 w-4" /></button>}
                        </div>
                    );
                })}
                {isEditing && activeAds.length === 0 && <div className="w-full h-full flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-400"><p>Banner yo'q</p></div>}
            </div>
            {activeAds.length > 1 && showControls && (
                <><button onClick={prevSlide} className={`absolute left-2 top-1/2 -translate-y-1/2 z-20 bg-white/20 hover:bg-white/40 backdrop-blur-md text-white p-2 rounded-full transition-all active:scale-95 ${isEditing ? 'opacity-100 bg-black/30' : 'opacity-0 group-hover:opacity-100'}`}><ChevronLeft className="h-6 w-6" /></button><button onClick={nextSlide} className={`absolute right-2 top-1/2 -translate-y-1/2 z-20 bg-white/20 hover:bg-white/40 backdrop-blur-md text-white p-2 rounded-full transition-all active:scale-95 ${isEditing ? 'opacity-100 bg-black/30' : 'opacity-0 group-hover:opacity-100'}`}><ChevronRight className="h-6 w-6" /></button></>
            )}
          </div>
      )}

      <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
    </div>
  );
};
