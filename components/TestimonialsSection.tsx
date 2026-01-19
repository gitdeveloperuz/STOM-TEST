
import React, { useRef, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { TestimonialItem, StyleConfig, GradientConfig, TestimonialsSectionConfig } from '../types';
import { Star, User, Quote, Trash2, Plus, Upload, GripVertical, Settings, X, Palette, Type, Copy, ArrowUpDown, Maximize, Minimize, MoveHorizontal, MoveVertical, Square, Move } from 'lucide-react';
import { GradientPicker } from './GradientPicker';
import { Pagination } from './Pagination';

interface TestimonialsSectionProps {
  items: TestimonialItem[];
  title?: string;
  subtitle?: string;
  style?: StyleConfig;
  config?: TestimonialsSectionConfig;
  isEditing?: boolean;
  onUpdateItem?: (id: string, field: keyof TestimonialItem, value: any) => void;
  onDeleteItem?: (id: string) => void;
  onAddItem?: () => void;
  onDuplicateItem?: (id: string) => void;
  onImageUpload?: (id: string, file: File) => void; // Kept for interface compatibility, but internal logic prefers direct update
  onReorder?: (dragIndex: number, dropIndex: number) => void;
  onUpdateConfig?: (updates: Partial<TestimonialsSectionConfig> & { testimonialsTitle?: string; testimonialsSubtitle?: string }) => void;
}

const generateCSS = (g?: GradientConfig) => {
    if (!g) return undefined;
    const stopsStr = g.stops.sort((a, b) => a.position - b.position).map(s => `${s.color} ${s.position}%`).join(', ');
    if (g.type === 'linear') return `linear-gradient(${g.angle}deg, ${stopsStr})`;
    if (g.type === 'radial') return `radial-gradient(circle at center, ${stopsStr})`;
    if (g.type === 'conic') return `conic-gradient(from ${g.angle}deg at 50% 50%, ${stopsStr})`;
    return `linear-gradient(${g.angle}deg, ${stopsStr})`;
};

export const TestimonialsSection: React.FC<TestimonialsSectionProps> = ({ 
  items, title, subtitle, style, config, isEditing, onUpdateItem, onDeleteItem, onAddItem, onDuplicateItem, onImageUpload, onReorder, onUpdateConfig
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeUploadId, setActiveUploadId] = useState<string | null>(null);
  const [activeSettingsId, setActiveSettingsId] = useState<string | null>(null);
  const [showSectionSettings, setShowSectionSettings] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [settingsPos, setSettingsPos] = useState({ x: 20, y: 100 });
  const isDraggingSettings = useRef(false);
  const dragStartPos = useRef({ x: 0, y: 0 });
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  useEffect(() => {
      const handleResize = () => setIsMobile(window.innerWidth < 768);
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
      const handleMouseMove = (e: MouseEvent | TouchEvent) => {
          if (isDraggingSettings.current) {
              const clientX = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
              const clientY = 'touches' in e ? e.touches[0].clientY : (e as MouseEvent).clientY;
              setSettingsPos({ x: clientX - dragStartPos.current.x, y: clientY - dragStartPos.current.y });
          }
      };
      const handleMouseUp = () => { isDraggingSettings.current = false; };
      if (activeSettingsId || showSectionSettings) {
          window.addEventListener('mousemove', handleMouseMove);
          window.addEventListener('mouseup', handleMouseUp);
          window.addEventListener('touchmove', handleMouseMove, { passive: false });
          window.addEventListener('touchend', handleMouseUp);
      }
      return () => {
          window.removeEventListener('mousemove', handleMouseMove);
          window.removeEventListener('mouseup', handleMouseUp);
          window.removeEventListener('touchmove', handleMouseMove);
          window.removeEventListener('touchend', handleMouseUp);
      }
  }, [activeSettingsId, showSectionSettings]);

  const handleSettingsDragStart = (e: React.MouseEvent | React.TouchEvent) => {
      if (isMobile) return;
      isDraggingSettings.current = true;
      const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
      dragStartPos.current = { x: clientX - settingsPos.x, y: clientY - settingsPos.y };
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file && activeUploadId) {
          // Internal handler to read base64 immediately for smoother UX
          const reader = new FileReader();
          reader.onload = (ev) => {
              const result = ev.target?.result as string;
              // Remove data:image/...;base64, prefix if you want raw base64, 
              // but mostly the app handles full data URIs. 
              // The App's TreatmentCard handles both. Let's pass the full result.
              const cleanBase64 = result.includes(',') ? result.split(',')[1] : result;
              
              if (onUpdateItem) {
                  onUpdateItem(activeUploadId, 'avatarUrl', cleanBase64);
              }
          };
          reader.readAsDataURL(file);
      }
      setActiveUploadId(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const triggerUpload = (id: string) => { setActiveUploadId(id); fileInputRef.current?.click(); };
  const handleDragStart = (e: React.DragEvent, index: number) => { if (!isEditing) return; setDraggedIndex(index); e.dataTransfer.effectAllowed = "move"; e.dataTransfer.setData("text/plain", index.toString()); };
  const handleDragOver = (e: React.DragEvent, index: number) => { e.preventDefault(); if (!isEditing || draggedIndex === null) return; if (draggedIndex !== index) { setDragOverIndex(index); e.dataTransfer.dropEffect = "move"; } };
  const handleDrop = (e: React.DragEvent, dropIndex: number) => { e.preventDefault(); if (!isEditing || draggedIndex === null || !onReorder) return; onReorder(draggedIndex, dropIndex); setDraggedIndex(null); setDragOverIndex(null); };
  const handleDragEnd = () => { setDraggedIndex(null); setDragOverIndex(null); };

  if ((!items || items.length === 0) && !isEditing) return null;

  const sectionBg = config?.sectionGradient ? generateCSS(config.sectionGradient) : config?.backgroundColor || undefined;
  const paddingY = config?.paddingY ?? 20;

  // Pagination Logic
  const totalPages = Math.ceil(items.length / itemsPerPage);
  const currentItems = items.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <section className={`transition-colors relative ${isEditing ? 'border-y-2 border-dashed border-slate-300 dark:border-slate-700' : ''} ${!sectionBg ? 'bg-slate-50 dark:bg-slate-900/50' : ''}`} style={{ background: sectionBg, paddingTop: `${paddingY * 4}px`, paddingBottom: `${paddingY * 4}px` }}>
      
      {isEditing && (
          <div className="absolute top-4 left-4 z-30">
              <button onClick={() => { setShowSectionSettings(!showSectionSettings); setActiveSettingsId(null); setSettingsPos({ x: 20, y: 100 }); }} className={`flex items-center gap-2 px-4 py-2 rounded-xl shadow-lg border transition-colors ${showSectionSettings ? 'bg-primary text-white border-primary' : 'bg-white dark:bg-slate-900 text-slate-500 border-slate-200 dark:border-slate-800'}`}>
                  <Settings className="h-5 w-5" />
                  <span className="font-bold text-sm">Bo'lim Sozlamalari</span>
              </button>
          </div>
      )}

      {/* SECTION SETTINGS PORTAL */}
      {isEditing && showSectionSettings && createPortal(
          <div className={`fixed z-[9999] bg-white dark:bg-slate-900 p-4 shadow-2xl border border-slate-200 dark:border-slate-800 animate-fade-in text-left flex flex-col ${isMobile ? 'bottom-0 left-0 right-0 rounded-t-2xl border-b-0' : 'rounded-xl w-80'}`} style={isMobile ? { maxHeight: '85vh' } : { top: settingsPos.y, left: settingsPos.x, maxHeight: '80vh' }}>
              <div className={`flex justify-between items-center mb-3 pb-2 border-b border-slate-100 dark:border-slate-800 ${!isMobile ? 'cursor-move' : ''} touch-none`} onMouseDown={handleSettingsDragStart} onTouchStart={handleSettingsDragStart}>
                  <span className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2 pointer-events-none"><Move className="h-3 w-3" /> Bo'lim Sozlamalari</span>
                  <button onClick={() => setShowSectionSettings(false)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded"><X className="h-4 w-4 text-slate-400" /></button>
              </div>
              <div className="space-y-4 overflow-y-auto custom-scrollbar pr-1 flex-1">
                  <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Orqa Fon (Gradient)</label>
                      <GradientPicker value={config?.sectionGradient} onChange={(g) => onUpdateConfig && onUpdateConfig({ sectionGradient: g })} />
                  </div>
                  <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Padding Vertical: {paddingY * 4}px</label>
                      <input type="range" min="0" max="40" value={paddingY} onChange={(e) => onUpdateConfig && onUpdateConfig({ paddingY: parseInt(e.target.value) })} className="w-full h-1.5 bg-slate-200 rounded-lg accent-primary" />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                      <div><label className="text-[9px] text-slate-400 block">Sarlavha Rangi</label><input type="color" value={config?.titleColor || '#0f172a'} onChange={(e) => onUpdateConfig && onUpdateConfig({ titleColor: e.target.value })} className="w-full h-6 rounded cursor-pointer border-none" /></div>
                      <div><label className="text-[9px] text-slate-400 block">Izoh Rangi</label><input type="color" value={config?.subtitleColor || '#64748b'} onChange={(e) => onUpdateConfig && onUpdateConfig({ subtitleColor: e.target.value })} className="w-full h-6 rounded cursor-pointer border-none" /></div>
                  </div>
              </div>
          </div>,
          document.body
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
            {isEditing ? <input value={title ?? "Mijozlarimiz fikrlari"} onChange={(e) => onUpdateConfig?.({ testimonialsTitle: e.target.value })} className="w-full text-3xl font-extrabold text-slate-900 dark:text-white mb-4 bg-transparent text-center border-b border-dashed border-slate-300 focus:outline-none focus:border-primary" style={{ color: config?.titleColor }} placeholder="Sarlavha" /> : (title === undefined || title !== '') && <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-4" style={{ color: config?.titleColor }}>{title ?? "Mijozlarimiz fikrlari"}</h2>}
            {isEditing ? <textarea value={subtitle ?? "Bizga ishonch bildirganlarning taassurotlari"} onChange={(e) => onUpdateConfig?.({ testimonialsSubtitle: e.target.value })} className="w-full text-slate-500 dark:text-slate-400 bg-transparent text-center border border-dashed border-slate-300 rounded p-2 focus:outline-none resize-none" style={{ color: config?.subtitleColor }} placeholder="Izoh" rows={1} /> : (subtitle === undefined || subtitle !== '') && <p className="text-slate-500 dark:text-slate-400" style={{ color: config?.subtitleColor }}>{subtitle ?? "Bizga ishonch bildirganlarning taassurotlari"}</p>}
        </div>

        <div className="flex flex-wrap justify-center gap-6">
            {currentItems.map((item, localIndex) => {
                const globalIndex = (currentPage - 1) * itemsPerPage + localIndex;
                const bgStyle = item.bgGradient ? { background: generateCSS(item.bgGradient) } : (item.bgGradientStart && item.bgGradientEnd) ? { background: `linear-gradient(135deg, ${item.bgGradientStart}, ${item.bgGradientEnd})` } : {};
                const hasCustomBg = !!(item.bgGradient || (item.bgGradientStart && item.bgGradientEnd));
                const textColor = item.textColor || (hasCustomBg ? '#ffffff' : undefined);
                const nameColor = item.nameColor || (hasCustomBg ? '#ffffff' : undefined);
                const roleColor = item.roleColor || (hasCustomBg ? 'rgba(255,255,255,0.8)' : style?.primaryColor || '#0ea5e9');
                const iconColor = item.iconColor || (hasCustomBg ? '#ffffff' : style?.primaryColor || '#0ea5e9');
                const shadowColor = item.blurColor || 'rgba(0,0,0,0.1)';
                
                const avatarSize = item.avatarSize || 40;
                const isReverse = item.reverseLayout;
                const fontFamily = item.fontFamily === 'serif' ? 'font-serif' : item.fontFamily === 'mono' ? 'font-mono' : 'font-sans';
                const cardWidth = item.width || 320; 
                const cardMinHeight = item.minHeight || 300;
                
                const textSize = item.textSize || 14;
                const nameSize = item.nameSize || 14;
                const roleSize = item.roleSize || 12;
                const starSize = item.starSize || 16;
                const borderWidth = item.borderWidth || 0;
                const borderGradientCSS = item.borderGradient ? generateCSS(item.borderGradient) : (item.borderGradientStart && item.borderGradientEnd ? `linear-gradient(135deg, ${item.borderGradientStart}, ${item.borderGradientEnd})` : undefined);
                const hasBorderGradient = !!borderGradientCSS && borderWidth > 0;
                
                return (
                <div key={item.id} draggable={isEditing} onDragStart={(e) => handleDragStart(e, globalIndex)} onDragOver={(e) => handleDragOver(e, globalIndex)} onDrop={(e) => handleDrop(e, globalIndex)} onDragEnd={handleDragEnd} className={`rounded-2xl relative group transition-all duration-300 flex flex-col h-auto ${!hasBorderGradient ? (hasCustomBg ? 'border-transparent' : 'bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800') : ''} ${draggedIndex === globalIndex ? 'opacity-40 scale-95' : 'opacity-100'} ${dragOverIndex === globalIndex ? 'ring-4 ring-primary scale-105' : ''} ${fontFamily}`} style={{ borderRadius: style?.buttonRadius ? `${style.buttonRadius * 1.5}px` : undefined, boxShadow: `0 10px 25px -5px ${shadowColor}`, width: `${cardWidth}px`, minHeight: `${cardMinHeight}px`, maxWidth: '100%', ...(!hasBorderGradient ? bgStyle : {}), ...(hasBorderGradient ? { background: borderGradientCSS, padding: `${borderWidth}px` } : {}) }}>
                    <div className={`w-full h-full flex flex-col p-6 rounded-xl overflow-hidden relative ${hasBorderGradient ? (hasCustomBg ? '' : 'bg-white dark:bg-slate-900') : ''}`} style={{ ...(hasBorderGradient && hasCustomBg ? bgStyle : {}), borderRadius: style?.buttonRadius ? `${(style.buttonRadius * 1.5) - 2}px` : undefined }}>
                        <Quote className="absolute top-4 right-4 h-8 w-8 transition-colors opacity-20 z-0" style={{ color: iconColor }} />
                        {isEditing && (
                            <div className="absolute top-2 right-2 flex gap-1 z-50 pointer-events-auto"> 
                                <div className="p-1.5 bg-slate-900/50 text-white rounded-lg cursor-grab active:cursor-grabbing"><GripVertical className="h-4 w-4" /></div>
                                <button onClick={(e) => { e.stopPropagation(); onDuplicateItem && onDuplicateItem(item.id); }} className="p-1.5 bg-sky-100 text-sky-600 rounded-lg hover:bg-sky-500 hover:text-white transition-colors"><Copy className="h-4 w-4" /></button>
                                <button onClick={(e) => { e.stopPropagation(); setActiveSettingsId(activeSettingsId === item.id ? null : item.id); setShowSectionSettings(false); setSettingsPos({ x: 100, y: 100 }); }} className={`p-1.5 rounded-lg transition-colors ${activeSettingsId === item.id ? 'bg-primary text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-primary hover:text-white'}`}><Settings className="h-4 w-4" /></button>
                                <button onMouseDown={(e) => e.stopPropagation()} onClick={(e) => { e.stopPropagation(); e.preventDefault(); if (onDeleteItem) onDeleteItem(item.id); }} className="p-1.5 bg-red-100 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-colors z-50 relative cursor-pointer"><Trash2 className="h-4 w-4 pointer-events-none" /></button>
                            </div>
                        )}

                        {/* CARD SETTINGS POPOVER */}
                        {isEditing && activeSettingsId === item.id && createPortal(
                            <div className={`fixed z-[9999] bg-white dark:bg-slate-900 p-4 shadow-2xl border border-slate-200 dark:border-slate-800 animate-fade-in text-left flex flex-col ${isMobile ? 'bottom-0 left-0 right-0 rounded-t-2xl border-b-0' : 'rounded-xl w-80'}`} style={isMobile ? { maxHeight: '85vh' } : { top: settingsPos.y, left: settingsPos.x, maxHeight: '70vh' }}>
                                <div className={`flex justify-between items-center mb-3 pb-2 border-b border-slate-100 dark:border-slate-800 ${!isMobile ? 'cursor-move' : ''} touch-none`} onMouseDown={handleSettingsDragStart} onTouchStart={handleSettingsDragStart}>
                                    <span className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2 pointer-events-none"><Move className="h-3 w-3" /> Karta Sozlamalari</span>
                                    <button onClick={(e) => { e.stopPropagation(); setActiveSettingsId(null); }} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded"><X className="h-4 w-4 text-slate-400" /></button>
                                </div>
                                <div className="space-y-3 overflow-y-auto custom-scrollbar pr-1 flex-1">
                                    <div><button onClick={() => onUpdateItem && onUpdateItem(item.id, 'reverseLayout', !item.reverseLayout)} className="w-full flex items-center justify-between px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-primary/10 hover:text-primary transition-colors mb-3"><span>{item.reverseLayout ? "User Info Tepa, Matn Past" : "Matn Tepa, User Info Past"}</span><ArrowUpDown className="h-4 w-4" /></button></div>
                                    <div className="border-t border-slate-100 dark:border-slate-800 pt-2 mb-2"><label className="text-[10px] font-bold text-slate-400 uppercase block mb-2">Border (Gradient)</label><GradientPicker value={item.borderGradient} onChange={(g) => onUpdateItem && onUpdateItem(item.id, 'borderGradient', g)} /><div className="mt-2"><label className="text-[9px] text-slate-400">Qalinlik: {borderWidth}px</label><input type="range" min="0" max="10" step="1" value={borderWidth} onChange={(e) => onUpdateItem && onUpdateItem(item.id, 'borderWidth', parseInt(e.target.value))} className="w-full h-1 bg-slate-200 rounded-lg accent-primary" /></div></div>
                                    
                                    {/* Text & Icon Sizes */}
                                    <div className="border-t border-slate-100 dark:border-slate-800 pt-2 mb-2">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Matn & Icon O'lchamlari</label>
                                        <div className="flex items-center gap-2 mb-2"><span className="text-[9px] w-12">Matn:</span><input type="range" min="10" max="32" step="1" value={textSize} onChange={(e) => onUpdateItem && onUpdateItem(item.id, 'textSize', parseInt(e.target.value))} className="flex-1 h-1 bg-slate-200 rounded-lg accent-primary" /><span className="text-[9px] w-6">{textSize}px</span></div>
                                        <div className="flex items-center gap-2 mb-2"><span className="text-[9px] w-12">Ism:</span><input type="range" min="10" max="32" step="1" value={nameSize} onChange={(e) => onUpdateItem && onUpdateItem(item.id, 'nameSize', parseInt(e.target.value))} className="flex-1 h-1 bg-slate-200 rounded-lg accent-primary" /><span className="text-[9px] w-6">{nameSize}px</span></div>
                                        <div className="flex items-center gap-2 mb-2"><span className="text-[9px] w-12">Rol:</span><input type="range" min="8" max="24" step="1" value={roleSize} onChange={(e) => onUpdateItem && onUpdateItem(item.id, 'roleSize', parseInt(e.target.value))} className="flex-1 h-1 bg-slate-200 rounded-lg accent-primary" /><span className="text-[9px] w-6">{roleSize}px</span></div>
                                        <div className="flex items-center gap-2 mb-2 border-t border-slate-50 dark:border-slate-800 pt-2">
                                            <span className="text-[9px] font-bold text-slate-500">Rating</span>
                                            <label className="flex items-center gap-1 cursor-pointer ml-auto"><input type="checkbox" checked={!item.hideRating} onChange={(e) => onUpdateItem && onUpdateItem(item.id, 'hideRating', !e.target.checked)} className="accent-primary w-3 h-3" /> <span className="text-[9px]">Ko'rsatish</span></label>
                                        </div>
                                        {!item.hideRating && (
                                            <>
                                                <div className="flex items-center gap-2"><span className="text-[9px] w-12">Yulduz:</span><input type="range" min="10" max="40" step="1" value={starSize} onChange={(e) => onUpdateItem && onUpdateItem(item.id, 'starSize', parseInt(e.target.value))} className="flex-1 h-1 bg-slate-200 rounded-lg accent-primary" /><span className="text-[9px] w-6">{starSize}px</span></div>
                                                <div className="flex items-center gap-2 mt-2"><span className="text-[9px] w-12">Qiymat:</span><input type="range" min="1" max="5" step="1" value={item.rating} onChange={(e) => onUpdateItem && onUpdateItem(item.id, 'rating', parseInt(e.target.value))} className="flex-1 h-1 bg-slate-200 rounded-lg accent-primary" /><span className="text-[9px] w-6">{item.rating}</span></div>
                                            </>
                                        )}
                                    </div>

                                    {/* Avatar Size */}
                                    <div className="border-t border-slate-100 dark:border-slate-800 pt-2 mb-2">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Rasm (Avatar) O'lchami</label>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[9px] w-12">{avatarSize}px</span>
                                            <input type="range" min="32" max="120" step="4" value={avatarSize} onChange={(e) => onUpdateItem && onUpdateItem(item.id, 'avatarSize', parseInt(e.target.value))} className="flex-1 h-1 bg-slate-200 rounded-lg accent-primary" />
                                        </div>
                                    </div>

                                    <div className="border-t border-slate-100 dark:border-slate-800 pt-2"><label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Kartochka O'lchami</label><div className="mb-2"><div className="flex justify-between items-center mb-1"><span className="text-[10px] text-slate-500 flex items-center gap-1"><MoveHorizontal className="h-3 w-3" /> Kenglik</span><span className="text-[10px] font-mono">{cardWidth}px</span></div><input type="range" min="250" max="800" step="10" value={cardWidth} onChange={(e) => onUpdateItem && onUpdateItem(item.id, 'width', parseInt(e.target.value))} className="w-full h-1.5 bg-slate-200 rounded-lg accent-primary cursor-pointer" /></div><div><div className="flex justify-between items-center mb-1"><span className="text-[10px] text-slate-500 flex items-center gap-1"><MoveVertical className="h-3 w-3" /> Balandlik</span><span className="text-[10px] font-mono">{cardMinHeight}px</span></div><input type="range" min="200" max="800" step="10" value={cardMinHeight} onChange={(e) => onUpdateItem && onUpdateItem(item.id, 'minHeight', parseInt(e.target.value))} className="w-full h-1.5 bg-slate-200 rounded-lg accent-primary cursor-pointer" /></div></div>
                                    <div className="border-t border-slate-100 dark:border-slate-800 pt-2"><label className="text-[10px] font-bold text-slate-400 uppercase block mb-2">Orqa Fon (Gradient)</label><GradientPicker value={item.bgGradient} onChange={(g) => onUpdateItem && onUpdateItem(item.id, 'bgGradient', g)} /></div>
                                    <div className="grid grid-cols-2 gap-3"><div><label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Ism Rangi</label><input type="color" value={item.nameColor || '#000000'} onChange={(e) => onUpdateItem && onUpdateItem(item.id, 'nameColor', e.target.value)} className="w-full h-6 rounded cursor-pointer border-none bg-transparent p-0" /></div><div><label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Fikr Rangi</label><input type="color" value={item.textColor || '#64748b'} onChange={(e) => onUpdateItem && onUpdateItem(item.id, 'textColor', e.target.value)} className="w-full h-6 rounded cursor-pointer border-none bg-transparent p-0" /></div><div><label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Rol Rangi</label><input type="color" value={item.roleColor || '#0ea5e9'} onChange={(e) => onUpdateItem && onUpdateItem(item.id, 'roleColor', e.target.value)} className="w-full h-6 rounded cursor-pointer border-none bg-transparent p-0" /></div><div><label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Icon Rangi</label><input type="color" value={item.iconColor || '#0ea5e9'} onChange={(e) => onUpdateItem && onUpdateItem(item.id, 'iconColor', e.target.value)} className="w-full h-6 rounded cursor-pointer border-none bg-transparent p-0" /></div></div>
                                </div>
                            </div>,
                            document.body
                        )}

                        <div className={`flex flex-col h-full z-10 relative ${isReverse ? 'flex-col-reverse justify-end' : 'flex-col justify-start'}`}>
                            {!item.hideRating && (
                                <div className={`flex items-center gap-1 relative z-10 ${isReverse ? 'mt-4 mb-0' : 'mb-4'}`}>{[...Array(5)].map((_, i) => (<Star key={i} className={`cursor-pointer ${i < item.rating ? 'text-amber-400 fill-amber-400' : (hasCustomBg ? 'text-white/30' : 'text-slate-200 dark:text-slate-700')}`} style={{ width: `${starSize}px`, height: `${starSize}px` }} onClick={isEditing ? () => onUpdateItem && onUpdateItem(item.id, 'rating', i + 1) : undefined} />))}</div>
                            )}
                            <div className={`flex-1 ${isReverse ? 'mb-0' : 'mb-6'}`}>{isEditing ? <textarea value={item.text} onChange={(e) => { onUpdateItem && onUpdateItem(item.id, 'text', e.target.value); e.target.style.height = 'auto'; e.target.style.height = `${e.target.scrollHeight}px`; }} ref={(el) => { if (el) { el.style.height = 'auto'; el.style.height = `${el.scrollHeight}px`; } }} className="w-full bg-transparent border border-dashed border-white/50 rounded p-2 resize-none focus:outline-none focus:border-white overflow-hidden min-h-[100px]" style={{ color: textColor, fontSize: `${textSize}px` }} placeholder="Fikr matni..." rows={1} /> : <p className="italic leading-relaxed text-slate-600 dark:text-slate-300 whitespace-pre-wrap" style={{ color: textColor, fontSize: `${textSize}px` }}>"{item.text}"</p>}</div>
                            <div className={`flex items-center gap-3 ${isReverse ? 'mb-6 pt-0 border-b pb-4' : 'pt-4 border-t'} ${hasCustomBg ? (isReverse ? 'border-white/20' : 'border-white/20') : (isReverse ? 'border-slate-50 dark:border-slate-800' : 'border-slate-50 dark:border-slate-800')}`}><div className={`rounded-full overflow-hidden flex items-center justify-center shrink-0 border relative ${isEditing ? 'cursor-pointer' : ''} ${hasCustomBg ? 'bg-white/20 border-white/20' : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700'}`} style={{ width: `${avatarSize}px`, height: `${avatarSize}px` }} onClick={isEditing ? () => triggerUpload(item.id) : undefined}>{item.avatarUrl ? <img src={item.avatarUrl.startsWith('data:') ? item.avatarUrl : `data:image/jpeg;base64,${item.avatarUrl}`} alt={item.name} className="w-full h-full object-cover" /> : <User className={`w-1/2 h-1/2 ${hasCustomBg ? 'text-white' : 'text-slate-400'}`} />}{isEditing && <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"><Upload className="h-4 w-4 text-white" /></div>}</div><div className="flex-1 min-w-0">{isEditing ? <><input value={item.name} onChange={(e) => onUpdateItem && onUpdateItem(item.id, 'name', e.target.value)} className="w-full bg-transparent font-bold border-b border-dashed border-white/30 focus:outline-none focus:border-white mb-1" style={{ color: nameColor, fontSize: `${nameSize}px` }} placeholder="Ism" /><input value={item.role || ''} onChange={(e) => onUpdateItem && onUpdateItem(item.id, 'role', e.target.value)} className="w-full bg-transparent border-b border-dashed border-white/30 focus:outline-none focus:border-white" style={{ color: roleColor, fontSize: `${roleSize}px` }} placeholder="Rol (Mijoz)" /></> : <><h4 className="font-bold truncate text-slate-900 dark:text-white" style={{ color: nameColor, fontSize: `${nameSize}px` }}>{item.name}</h4>{item.role && <p className="truncate" style={{ color: roleColor, fontSize: `${roleSize}px` }}>{item.role}</p>}</>}</div></div>
                        </div>
                    </div>
                </div>
                );
            })}
            
            {/* ADD CARD BUTTON (ALWAYS VISIBLE IN EDIT MODE ON LAST PAGE) */}
            {isEditing && (currentPage === totalPages || items.length === 0) && (
                <button onClick={onAddItem} className="w-[320px] min-h-[300px] rounded-2xl border-4 border-dashed border-slate-300 dark:border-slate-700 flex flex-col items-center justify-center text-slate-400 hover:text-primary hover:border-primary hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all group">
                    <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-full mb-3 group-hover:bg-primary group-hover:text-white transition-colors">
                        <Plus className="h-8 w-8" />
                    </div>
                    <span className="font-bold">Yangi Fikr Qo'shish</span>
                </button>
            )}
        </div>

        {totalPages > 1 && (
            <div className="mt-8">
                <Pagination 
                    currentPage={currentPage} 
                    totalPages={totalPages} 
                    onPageChange={setCurrentPage} 
                    primaryColor={style?.primaryColor} 
                />
            </div>
        )}
      </div>
      <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
    </section>
  );
};
