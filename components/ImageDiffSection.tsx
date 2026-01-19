
import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ImageDiffItem, ImageDiffSectionConfig, StyleConfig, FeatureActionButton, GradientConfig, GradientStop } from '../types';
import { ImageDiffSlider } from './ImageDiffSlider';
import { Trash2, Plus, Eye, EyeOff, Settings, X, Palette, Image as ImageIcon, MoveHorizontal, MoveVertical, ExternalLink, Sliders, MousePointerClick, Hand, Move, AlignLeft, AlignCenter, AlignRight, Copy, Maximize, Minimize, LayoutTemplate, Grid } from 'lucide-react';
import { GradientPicker } from './GradientPicker';
import { uploadToSupabase } from '../services/supabase';

interface ImageDiffSectionProps {
  items: ImageDiffItem[];
  config?: ImageDiffSectionConfig;
  style?: StyleConfig;
  isEditing?: boolean;
  onUpdateConfig?: (config: Partial<ImageDiffSectionConfig>) => void;
  onDeleteItem?: (id: string) => void;
  onAddItem?: () => void;
  onUpdateItem?: (id: string, updates: Partial<ImageDiffItem>) => void;
  onDuplicateItem?: (id: string) => void;
}

const generateCSS = (g?: GradientConfig) => {
    if (!g) return undefined;
    const stopsStr = g.stops.sort((a, b) => a.position - b.position).map(s => `${s.color} ${s.position}%`).join(', ');
    if (g.type === 'linear') return `linear-gradient(${g.angle}deg, ${stopsStr})`;
    if (g.type === 'radial') return `radial-gradient(circle at center, ${stopsStr})`;
    if (g.type === 'conic') return `conic-gradient(from ${g.angle}deg at 50% 50%, ${stopsStr})`;
    return `linear-gradient(${g.angle}deg, ${stopsStr})`;
};

export const ImageDiffSection: React.FC<ImageDiffSectionProps> = ({ items, config, style, isEditing, onUpdateConfig, onDeleteItem, onAddItem, onUpdateItem, onDuplicateItem }) => {
  const [showSettings, setShowSettings] = useState(false);
  const [activeSettingsId, setActiveSettingsId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeUpload, setActiveUpload] = useState<{ id: string, type: 'before' | 'after' } | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const [settingsPos, setSettingsPos] = useState({ x: 20, y: 100 });
  const isDraggingSettings = useRef(false);
  const dragStartPos = useRef({ x: 0, y: 0 });

  const [globalSettingsPos, setGlobalSettingsPos] = useState({ x: 20, y: 100 });
  const isDraggingGlobal = useRef(false);
  const globalDragStartPos = useRef({ x: 0, y: 0 });
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
      const handleResize = () => setIsMobile(window.innerWidth < 768);
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isVisible = config?.isVisible ?? true;
  const paddingY = config?.paddingY !== undefined ? config.paddingY : 16;
  const sectionGradient = config?.sectionGradient;
  const cardBorderGradient = config?.cardBorderGradient;
  const cardsGap = config?.cardsGap ?? 32; 
  const cardsAlignment = config?.cardsAlignment || 'center';
  const bgColor = config?.bgColor || '#ffffff';
  const legacyBgCSS = (config?.sectionBgGradientStart && config?.sectionBgGradientEnd) ? `linear-gradient(${config.bgDirection || 'to bottom'}, ${config.sectionBgGradientStart}, ${config.sectionBgGradientEnd})` : bgColor;
  const finalSectionBg = sectionGradient ? generateCSS(sectionGradient) : legacyBgCSS;
  const textColor = config?.textColor || '#0f172a';
  const borderWidth = config?.borderWidth ?? 1;
  const borderRadius = config?.borderRadius ?? 16;
  const beforeLabel = config?.beforeLabel !== undefined ? config.beforeLabel : 'OLDIN';
  const afterLabel = config?.afterLabel !== undefined ? config.afterLabel : 'KEYIN';
  
  // New Configs
  const layoutMode = config?.layoutMode || 'flex';
  const gridColumns = config?.gridColumns || 2;
  const hideHandle = config?.hideHandle || false;
  const handleStyle = config?.handleStyle || 'circle-arrows';
  const labelAlignment = config?.labelAlignment || 'top-left';

  useEffect(() => {
      const handleMouseMove = (e: MouseEvent | TouchEvent) => {
          const clientX = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
          const clientY = 'touches' in e ? e.touches[0].clientY : (e as MouseEvent).clientY;
          if (isDraggingSettings.current) setSettingsPos({ x: clientX - dragStartPos.current.x, y: clientY - dragStartPos.current.y });
          if (isDraggingGlobal.current) setGlobalSettingsPos({ x: clientX - globalDragStartPos.current.x, y: clientY - globalDragStartPos.current.y });
      };
      const handleMouseUp = () => { isDraggingSettings.current = false; isDraggingGlobal.current = false; };
      if (activeSettingsId || showSettings) {
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
  }, [activeSettingsId, showSettings]);

  const handleSettingsDragStart = (e: React.MouseEvent | React.TouchEvent) => {
      if (isMobile) return;
      isDraggingSettings.current = true;
      const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
      dragStartPos.current = { x: clientX - settingsPos.x, y: clientY - settingsPos.y };
  };

  const handleGlobalDragStart = (e: React.MouseEvent | React.TouchEvent) => {
      if (isMobile) return;
      isDraggingGlobal.current = true;
      const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
      globalDragStartPos.current = { x: clientX - globalSettingsPos.x, y: clientY - globalSettingsPos.y };
  };

  const handleUploadClick = (id: string, type: 'before' | 'after') => { setActiveUpload({ id, type }); fileInputRef.current?.click(); };
  
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file && activeUpload && onUpdateItem) {
          setIsUploading(true);
          try {
              const url = await uploadToSupabase(file);
              if (url) {
                  onUpdateItem(activeUpload.id, { [activeUpload.type === 'before' ? 'beforeImage' : 'afterImage']: url });
                  setActiveUpload(null);
              }
          } catch(e) {
              console.error("Diff upload failed", e);
          } finally {
              setIsUploading(false);
          }
      }
      if (fileInputRef.current) fileInputRef.current.value = '';
  };
  
  if (!isVisible && !isEditing) return null;
  if ((!items || items.length === 0) && !isEditing) return null;

  // Grid Style Construction
  const containerStyle = layoutMode === 'grid' 
      ? { gap: `${cardsGap}px`, display: 'grid', gridTemplateColumns: `repeat(1, 1fr)` } // base mobile
      : { gap: `${cardsGap}px`, justifyContent: cardsAlignment, display: 'flex', flexWrap: 'wrap' as const };

  const gridClass = layoutMode === 'grid' 
      ? `md:grid-cols-2 lg:grid-cols-${gridColumns}` 
      : '';

  return (
    <section className={`transition-colors relative group/diff ${isEditing ? 'border-y-2 border-dashed border-slate-300 dark:border-slate-700' : ''}`} style={{ paddingTop: `${paddingY * 0.25}rem`, paddingBottom: `${paddingY * 0.25}rem`, background: finalSectionBg }}>
      {/* GLOBAL SETTINGS POPUP (Portal) */}
      {isEditing && showSettings && createPortal(
          <div 
              className={`fixed z-[9999] bg-white dark:bg-slate-900 p-4 shadow-2xl border border-slate-200 dark:border-slate-800 animate-fade-in text-left flex flex-col ${isMobile ? 'bottom-0 left-0 right-0 rounded-t-2xl border-b-0' : 'rounded-xl w-96'}`} 
              style={isMobile ? { maxHeight: '85vh' } : { top: globalSettingsPos.y, left: globalSettingsPos.x, maxHeight: '80vh' }}
          >
              <div 
                  className={`flex justify-between items-center mb-3 border-b border-slate-100 dark:border-slate-800 pb-2 ${!isMobile ? 'cursor-move' : ''} touch-none`}
                  onMouseDown={handleGlobalDragStart}
                  onTouchStart={handleGlobalDragStart}
              >
                  <span className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2 pointer-events-none"><Move className="h-3 w-3" /> Dizayn Sozlamalari</span>
                  <button onClick={() => setShowSettings(false)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded"><X className="h-4 w-4 text-slate-400" /></button>
              </div>
              <div className="space-y-4 overflow-y-auto custom-scrollbar pr-1 flex-1 pb-4">
                  
                  {/* --- LAYOUT SETTINGS --- */}
                  <div className="border-b border-slate-100 dark:border-slate-800 pb-4 mb-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Layout (Joylashuv)</label>
                      <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg gap-1 mb-3">
                          <button onClick={() => onUpdateConfig && onUpdateConfig({ layoutMode: 'flex' })} className={`flex-1 text-[10px] py-1.5 rounded flex items-center justify-center gap-1 ${layoutMode === 'flex' ? 'bg-white dark:bg-slate-700 shadow text-primary font-bold' : 'text-slate-500 hover:text-slate-700'}`}>Flex (Auto)</button>
                          <button onClick={() => onUpdateConfig && onUpdateConfig({ layoutMode: 'grid' })} className={`flex-1 text-[10px] py-1.5 rounded flex items-center justify-center gap-1 ${layoutMode === 'grid' ? 'bg-white dark:bg-slate-700 shadow text-primary font-bold' : 'text-slate-500 hover:text-slate-700'}`}><Grid className="h-3 w-3" /> Grid (Setka)</button>
                      </div>
                      
                      {layoutMode === 'grid' && (
                          <div className="mb-3">
                              <label className="text-[9px] text-slate-400 block mb-1">Ustunlar soni: {gridColumns}</label>
                              <input type="range" min="1" max="4" value={gridColumns} onChange={(e) => onUpdateConfig && onUpdateConfig({ gridColumns: parseInt(e.target.value) })} className="w-full h-1.5 bg-slate-200 rounded-lg accent-primary" />
                              <div className="flex justify-between text-[8px] text-slate-400 mt-1"><span>1</span><span>2</span><span>3</span><span>4</span></div>
                          </div>
                      )}

                      <div className="mb-2"><label className="text-[9px] text-slate-400 block mb-1">Kartalar Orasi: {cardsGap}px</label><input type="range" min="0" max="100" value={cardsGap} onChange={(e) => onUpdateConfig && onUpdateConfig({ cardsGap: parseInt(e.target.value) })} className="w-full h-1.5 bg-slate-200 rounded-lg accent-primary" /></div>
                      
                      {layoutMode === 'flex' && (
                          <>
                            <label className="text-[9px] text-slate-400 block mb-1">Horizontal Tekislash</label>
                            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg gap-1"><button onClick={() => onUpdateConfig && onUpdateConfig({ cardsAlignment: 'left' })} className={`flex-1 p-1 rounded ${cardsAlignment === 'left' ? 'bg-white dark:bg-slate-700 shadow text-primary' : 'text-slate-400'}`}><AlignLeft className="h-3 w-3 mx-auto" /></button><button onClick={() => onUpdateConfig && onUpdateConfig({ cardsAlignment: 'center' })} className={`flex-1 p-1 rounded ${cardsAlignment === 'center' ? 'bg-white dark:bg-slate-700 shadow text-primary' : 'text-slate-400'}`}><AlignCenter className="h-3 w-3 mx-auto" /></button><button onClick={() => onUpdateConfig && onUpdateConfig({ cardsAlignment: 'right' })} className={`flex-1 p-1 rounded ${cardsAlignment === 'right' ? 'bg-white dark:bg-slate-700 shadow text-primary' : 'text-slate-400'}`}><AlignRight className="h-3 w-3 mx-auto" /></button></div>
                          </>
                      )}
                  </div>

                  <div className="border-b border-slate-100 dark:border-slate-800 pb-4 mb-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Section Background</label>
                      <GradientPicker value={sectionGradient} onChange={(g) => onUpdateConfig && onUpdateConfig({ sectionGradient: g })} />
                      <div className="mt-3"><label className="text-[9px] text-slate-400 block mb-1">Padding Vertical: {paddingY * 0.25}rem</label><input type="range" min="0" max="64" value={paddingY} onChange={(e) => onUpdateConfig && onUpdateConfig({ paddingY: parseInt(e.target.value) })} className="w-full h-1.5 bg-slate-200 rounded-lg accent-primary" /></div>
                  </div>
                  
                  <div className="border-b border-slate-100 dark:border-slate-800 pb-4 mb-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Slider Sozlamalari</label>
                      <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg gap-1 mb-2">
                          <button onClick={() => onUpdateConfig && onUpdateConfig({ interactionMode: 'drag' })} className={`flex-1 text-[10px] py-1.5 rounded flex items-center justify-center gap-1 ${(!config?.interactionMode || config?.interactionMode === 'drag') ? 'bg-white dark:bg-slate-700 shadow text-primary font-bold' : 'text-slate-500 hover:text-slate-700'}`}><MousePointerClick className="h-3 w-3" /> Click/Drag</button>
                          <button onClick={() => onUpdateConfig && onUpdateConfig({ interactionMode: 'hover' })} className={`flex-1 text-[10px] py-1.5 rounded flex items-center justify-center gap-1 ${config?.interactionMode === 'hover' ? 'bg-white dark:bg-slate-700 shadow text-primary font-bold' : 'text-slate-500 hover:text-slate-700'}`}><Hand className="h-3 w-3" /> Hover</button>
                      </div>
                      <label className="text-[9px] font-bold text-slate-400 block mb-1">Handle Style</label>
                      <select value={handleStyle} onChange={(e) => onUpdateConfig && onUpdateConfig({ handleStyle: e.target.value as any })} className="w-full text-xs p-1.5 rounded border border-slate-200 dark:border-slate-700 bg-transparent mb-2">
                          <option value="circle-arrows">Circle with Arrows</option>
                          <option value="circle">Circle Only</option>
                          <option value="square">Square</option>
                          <option value="line">Line Only</option>
                      </select>
                      <label className="flex items-center gap-2 text-[10px] font-bold text-slate-500 cursor-pointer bg-slate-50 dark:bg-slate-800 p-2 rounded-lg">
                          <input type="checkbox" checked={hideHandle} onChange={(e) => onUpdateConfig && onUpdateConfig({ hideHandle: e.target.checked })} className="accent-primary w-3 h-3" />
                          <span>Tutqichni Yashirish (Global Hide)</span>
                      </label>
                  </div>

                  <div className="border-b border-slate-100 dark:border-slate-800 pb-4 mb-2"><label className="text-[10px] font-bold text-slate-400 uppercase block mb-2">Card Border Gradient</label><GradientPicker value={cardBorderGradient} onChange={(g) => onUpdateConfig && onUpdateConfig({ cardBorderGradient: g })} /><div className="mt-2 flex gap-2"><div className="flex-1"><label className="text-[9px] text-slate-400 block">Width: {borderWidth}px</label><input type="range" min="0" max="10" value={borderWidth} onChange={(e) => onUpdateConfig && onUpdateConfig({ borderWidth: parseInt(e.target.value) })} className="w-full h-1.5 bg-slate-200 rounded-lg accent-primary" /></div><div className="flex-1"><label className="text-[9px] text-slate-400 block">Radius: {borderRadius}px</label><input type="range" min="0" max="40" value={borderRadius} onChange={(e) => onUpdateConfig && onUpdateConfig({ borderRadius: parseInt(e.target.value) })} className="w-full h-1.5 bg-slate-200 rounded-lg accent-primary" /></div></div></div>
                  
                  <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Overlay Matnlar</label>
                      <div className="grid grid-cols-2 gap-2 mb-2"><input value={beforeLabel} onChange={(e) => onUpdateConfig && onUpdateConfig({ beforeLabel: e.target.value })} className="w-full text-xs p-1.5 rounded border border-slate-200 dark:border-slate-700 bg-transparent" placeholder="OLDIN" /><input value={afterLabel} onChange={(e) => onUpdateConfig && onUpdateConfig({ afterLabel: e.target.value })} className="w-full text-xs p-1.5 rounded border border-slate-200 dark:border-slate-700 bg-transparent" placeholder="KEYIN" /></div>
                      <label className="text-[9px] text-slate-400 block mb-1">Matn Joylashuvi (Align)</label>
                      <select value={labelAlignment} onChange={(e) => onUpdateConfig && onUpdateConfig({ labelAlignment: e.target.value as any })} className="w-full text-xs p-1.5 rounded border border-slate-200 dark:border-slate-700 bg-transparent">
                          <option value="top-left">Yuqori Chap</option>
                          <option value="top-right">Yuqori O'ng</option>
                          <option value="bottom-left">Pastki Chap</option>
                          <option value="bottom-right">Pastki O'ng</option>
                      </select>
                  </div>
              </div>
          </div>,
          document.body
      )}

      {isEditing && (
          <div className="absolute top-4 left-4 z-30">
              <button 
                  onClick={() => setShowSettings(!showSettings)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl shadow-lg border transition-colors ${showSettings ? 'bg-primary text-white border-primary' : 'bg-white dark:bg-slate-900 text-slate-500 border-slate-200 dark:border-slate-800'}`}
              >
                  <Settings className="h-5 w-5" />
                  <span className="font-bold text-sm">Dizayn Sozlamalari</span>
              </button>
          </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div style={containerStyle} className={layoutMode === 'grid' ? gridClass : ''}>
            {items.map((item) => (
                <div key={item.id} style={layoutMode === 'flex' ? { width: '100%', maxWidth: '600px', flex: '1 1 400px' } : undefined} className="group/card relative">
                    {isEditing && (
                        <div className="absolute top-2 right-2 z-50 flex gap-1 opacity-0 group-hover/card:opacity-100 transition-opacity">
                            <button onClick={() => handleUploadClick(item.id, 'before')} className="bg-white/90 text-slate-600 px-2 py-1 rounded text-[10px] font-bold shadow hover:text-primary">Oldin</button>
                            <button onClick={() => handleUploadClick(item.id, 'after')} className="bg-white/90 text-slate-600 px-2 py-1 rounded text-[10px] font-bold shadow hover:text-primary">Keyin</button>
                            <button onClick={() => onDuplicateItem && onDuplicateItem(item.id)} className="p-1.5 bg-white text-slate-500 rounded shadow hover:text-primary"><Copy className="h-3 w-3" /></button>
                            <button onClick={() => onDeleteItem && onDeleteItem(item.id)} className="p-1.5 bg-red-100 text-red-500 rounded shadow hover:bg-red-500 hover:text-white"><Trash2 className="h-3 w-3" /></button>
                        </div>
                    )}
                    
                    <ImageDiffSlider 
                        item={item} 
                        style={style} 
                        config={config} 
                    />

                    {isEditing && (
                        <div className="mt-2 grid grid-cols-1 gap-2 bg-slate-50 dark:bg-slate-800 p-2 rounded-lg border border-slate-200 dark:border-slate-700">
                            <input value={item.label || ''} onChange={(e) => onUpdateItem && onUpdateItem(item.id, { label: e.target.value })} className="bg-transparent border-b border-dashed border-slate-300 text-xs font-bold w-full" placeholder="Sarlavha" />
                            <input value={item.description || ''} onChange={(e) => onUpdateItem && onUpdateItem(item.id, { description: e.target.value })} className="bg-transparent border-b border-dashed border-slate-300 text-xs w-full" placeholder="Tavsif" />
                        </div>
                    )}
                </div>
            ))}
            
            {isEditing && (
                <div onClick={onAddItem} className="flex flex-col items-center justify-center border-4 border-dashed border-slate-300 dark:border-slate-700 rounded-3xl min-h-[300px] cursor-pointer hover:border-primary hover:text-primary text-slate-400 transition-colors bg-slate-50/50 dark:bg-slate-900/50" style={layoutMode === 'flex' ? { width: '100%', maxWidth: '600px', flex: '1 1 400px' } : undefined}>
                    <Plus className="h-10 w-10 mb-2" />
                    <span className="font-bold">Yangi Natija</span>
                </div>
            )}
        </div>
      </div>
      
      <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
    </section>
  );
};
