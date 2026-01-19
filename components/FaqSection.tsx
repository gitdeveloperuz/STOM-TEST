
import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, MessageCircleQuestion, Plus, Trash2, Settings, X, Move, Save } from 'lucide-react';
import { FaqItem, StyleConfig, FaqConfig, FaqStyleVariant, GradientConfig } from '../types';
import { GradientPicker } from './GradientPicker';

interface FaqSectionProps {
  items: FaqItem[];
  title?: string;
  subtitle?: string;
  style?: StyleConfig;
  isEditing?: boolean;
  config?: FaqConfig;
  onUpdateItem?: (id: string, field: keyof FaqItem, value: any) => void;
  onAddItem?: () => void;
  onDeleteItem?: (id: string) => void;
  onUpdateTitle?: (title: string) => void;
  onUpdateSubtitle?: (subtitle: string) => void;
  onUpdateConfig?: (config: Partial<FaqConfig>) => void;
  onSave?: () => void;
}

const generateCSS = (g?: GradientConfig) => {
    if (!g) return undefined;
    const stopsStr = g.stops.sort((a, b) => a.position - b.position).map(s => `${s.color} ${s.position}%`).join(', ');
    if (g.type === 'linear') return `linear-gradient(${g.angle}deg, ${stopsStr})`;
    if (g.type === 'radial') return `radial-gradient(circle at center, ${stopsStr})`;
    if (g.type === 'conic') return `conic-gradient(from ${g.angle}deg at 50% 50%, ${stopsStr})`;
    return `linear-gradient(${g.angle}deg, ${stopsStr})`;
};

export const FaqSection: React.FC<FaqSectionProps> = ({ items, title, subtitle, style, isEditing, config, onUpdateItem, onAddItem, onDeleteItem, onUpdateTitle, onUpdateSubtitle, onUpdateConfig, onSave }) => {
  const [openId, setOpenId] = useState<string | null>(null);
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

  const variant = config?.variant || 'simple';
  const cardBlur = config?.cardBlur ?? 0;
  const cardBorderWidth = config?.cardBorderWidth ?? 1;
  const questionColor = config?.questionColor;
  const answerColor = config?.answerColor;
  const primaryColor = style?.primaryColor || '#0ea5e9';
  const activeIconColor = config?.iconColor || primaryColor;
  const iconBorderWidth = config?.iconBorderWidth ?? 2;

  useEffect(() => {
      const handleMouseMove = (e: MouseEvent | TouchEvent) => {
          if (isDraggingSettings.current) {
              const clientX = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
              const clientY = 'touches' in e ? e.touches[0].clientY : (e as MouseEvent).clientY;
              setSettingsPos({ x: clientX - dragStartPos.current.x, y: clientY - dragStartPos.current.y });
          }
      };
      const handleMouseUp = () => { isDraggingSettings.current = false; };
      if (showSettings) {
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
  }, [showSettings]);

  const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
      if (isMobile) return;
      isDraggingSettings.current = true;
      const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
      dragStartPos.current = { x: clientX - settingsPos.x, y: clientY - settingsPos.y };
  };

  const displayItems = isEditing ? items : items.filter(item => item.isVisible);
  if ((!displayItems || displayItems.length === 0) && !isEditing) return null;
  const toggleItem = (id: string) => { if (isEditing) return; setOpenId(openId === id ? null : id); };
  const containerClasses = variant === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 gap-4' : 'space-y-4';
  const itemClasses = variant === 'boxed' ? 'rounded-2xl mb-4' : variant === 'grid' ? 'rounded-2xl h-fit' : 'border-b last:border-0 rounded-2xl';

  return (
    <section className={`py-20 bg-white dark:bg-slate-900 transition-colors duration-300 relative group/faq ${isEditing ? 'border-t-2 border-dashed border-slate-200 dark:border-slate-700' : ''}`}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        {isEditing && (
            <div className="absolute top-0 right-4 z-30 flex gap-2">
                {onSave && <button onClick={onSave} className="p-2 rounded-lg shadow-lg border transition-colors bg-white dark:bg-slate-800 text-emerald-500 border-slate-200 dark:border-slate-700 hover:bg-emerald-50 dark:hover:bg-emerald-900/20" title="O'zgarishlarni saqlash"><Save className="h-5 w-5" /></button>}
                <button onClick={() => setShowSettings(!showSettings)} className={`p-2 rounded-lg shadow-lg border transition-colors ${showSettings ? 'bg-primary text-white border-primary' : 'bg-white dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700'}`}><Settings className="h-5 w-5" /></button>
            </div>
        )}

        {/* SETTINGS PANEL */}
        {isEditing && showSettings && createPortal(
            <div 
                className={`fixed z-[9999] bg-white dark:bg-slate-900 p-4 shadow-2xl border border-slate-200 dark:border-slate-800 animate-fade-in text-left flex flex-col ${isMobile ? 'bottom-0 left-0 right-0 rounded-t-2xl border-b-0' : 'rounded-xl w-80'}`}
                style={isMobile ? { maxHeight: '85vh' } : { top: settingsPos.y, left: settingsPos.x, maxHeight: '80vh' }}
            >
                <div 
                    className={`flex justify-between items-center mb-3 border-b border-slate-100 dark:border-slate-800 pb-2 ${!isMobile ? 'cursor-move' : ''} touch-none`}
                    onMouseDown={handleDragStart}
                    onTouchStart={handleDragStart}
                >
                    <span className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2 pointer-events-none"><Move className="h-3 w-3" /> FAQ Dizayni</span>
                    <button onClick={() => setShowSettings(false)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded"><X className="h-4 w-4 text-slate-400" /></button>
                </div>
                
                <div className="space-y-4 overflow-y-auto custom-scrollbar pr-1 flex-1 pb-4">
                    <div><label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Stil (Layout)</label><select value={variant} onChange={(e) => onUpdateConfig && onUpdateConfig({ variant: e.target.value as FaqStyleVariant })} className="w-full text-xs p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"><option value="simple">Oddiy (Simple)</option><option value="boxed">Kartochkalar (Boxed)</option><option value="grid">Setka (Grid)</option></select></div>
                    
                    <div className="border-t border-slate-100 dark:border-slate-800 pt-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Chegara (Border)</label>
                        <div className="mb-2">
                            <label className="text-[9px] text-slate-400 block mb-1">Gradient (Ustuvor)</label>
                            <GradientPicker value={config?.cardBorderGradient} onChange={(g) => onUpdateConfig && onUpdateConfig({ cardBorderGradient: g })} />
                        </div>
                        <div className="mb-2">
                            <label className="text-[9px] text-slate-400 block mb-1">Yoki Rang (Solid)</label>
                            <input type="color" value={config?.cardBorderColor || '#e2e8f0'} onChange={(e) => onUpdateConfig && onUpdateConfig({ cardBorderColor: e.target.value })} className="w-full h-6 rounded cursor-pointer border-none bg-transparent p-0" />
                        </div>
                        <div className="mt-2"><label className="text-[9px] font-bold text-slate-400 block mb-1">Qalinlik: {cardBorderWidth}px</label><input type="range" min="0" max="10" value={cardBorderWidth} onChange={(e) => onUpdateConfig && onUpdateConfig({ cardBorderWidth: parseInt(e.target.value) })} className="w-full h-1 bg-slate-200 rounded-lg accent-primary"/></div>
                    </div>

                    <div className="border-t border-slate-100 dark:border-slate-800 pt-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Orqa Fon (Background)</label>
                        <GradientPicker value={config?.cardBgGradient} onChange={(g) => onUpdateConfig && onUpdateConfig({ cardBgGradient: g })} />
                        <div className="mt-2"><label className="text-[9px] font-bold text-slate-400 block mb-1">Blur: {cardBlur}px</label><input type="range" min="0" max="20" value={cardBlur} onChange={(e) => onUpdateConfig && onUpdateConfig({ cardBlur: parseInt(e.target.value) })} className="w-full h-1 bg-slate-200 rounded-lg accent-primary"/></div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 border-t border-slate-100 dark:border-slate-800 pt-2"><div><label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Savol Rangi</label><input type="color" value={questionColor || '#000000'} onChange={(e) => onUpdateConfig && onUpdateConfig({ questionColor: e.target.value })} className="w-full h-6 rounded cursor-pointer border-none bg-transparent"/></div><div><label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Javob Rangi</label><input type="color" value={answerColor || '#64748b'} onChange={(e) => onUpdateConfig && onUpdateConfig({ answerColor: e.target.value })} className="w-full h-6 rounded cursor-pointer border-none bg-transparent"/></div></div>
                    
                    <div className="border-t border-slate-100 dark:border-slate-800 pt-2 mt-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase block mb-2">Icon Sozlamalari</label>
                        <div className="mb-2">
                            <label className="text-[9px] text-slate-400 block mb-1">Icon Rangi (Solid)</label>
                            <input type="color" value={activeIconColor} onChange={(e) => onUpdateConfig && onUpdateConfig({ iconColor: e.target.value })} className="w-full h-6 rounded cursor-pointer border-none bg-transparent p-0"/>
                        </div>
                        <div className="mb-2">
                            <label className="text-[9px] text-slate-400 block mb-1">Icon Foni (Gradient)</label>
                            <GradientPicker value={config?.iconBgGradient} onChange={(g) => onUpdateConfig && onUpdateConfig({ iconBgGradient: g })} />
                        </div>
                        <div className="mb-2">
                            <label className="text-[9px] text-slate-400 block mb-1">Icon Border (Gradient)</label>
                            <GradientPicker value={config?.iconBorderGradient} onChange={(g) => onUpdateConfig && onUpdateConfig({ iconBorderGradient: g })} />
                            <div className="mt-1"><label className="text-[8px] text-slate-400 block">Width: {iconBorderWidth}px</label><input type="range" min="0" max="10" value={iconBorderWidth} onChange={(e) => onUpdateConfig && onUpdateConfig({ iconBorderWidth: parseInt(e.target.value) })} className="w-full h-1 bg-slate-200 rounded-lg accent-primary"/></div>
                        </div>
                    </div>
                </div>
            </div>,
            document.body
        )}

        <div className="text-center mb-12">
          {(() => {
              const iconBgCSS = generateCSS(config?.iconBgGradient) || config?.iconBgColor || `${primaryColor}20`;
              const iconBorderCSS = generateCSS(config?.iconBorderGradient) || (config?.iconBorderGradientStart ? `linear-gradient(135deg, ${config.iconBorderGradientStart}, ${config.iconBorderGradientEnd})` : 'transparent');
              const hasIconBorder = !!(config?.iconBorderGradient || (config?.iconBorderGradientStart && config?.iconBorderGradientEnd));
              const iconStyle: React.CSSProperties = {
                  background: hasIconBorder ? `${iconBgCSS}, ${iconBorderCSS}` : iconBgCSS,
                  backgroundOrigin: hasIconBorder ? 'border-box' : undefined,
                  backgroundClip: hasIconBorder ? 'padding-box, border-box' : undefined,
                  border: hasIconBorder ? `${iconBorderWidth}px solid transparent` : undefined
              };

              return (
                  <div className="inline-block relative mb-4">
                      <div className={`flex items-center justify-center w-14 h-14 rounded-full transition-all duration-300`} style={iconStyle}>
                          <MessageCircleQuestion className="h-7 w-7" style={{ color: activeIconColor }} />
                      </div>
                  </div>
              );
          })()}
          
          {isEditing ? <input value={title || "Tez-tez so'raladigan savollar"} onChange={(e) => onUpdateTitle && onUpdateTitle(e.target.value)} className="w-full text-3xl font-bold text-center text-slate-900 dark:text-white mb-4 bg-transparent border-b border-dashed border-slate-300 focus:outline-none focus:border-primary" placeholder="Sarlavha..." /> : <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">{title || "Tez-tez so'raladigan savollar"}</h2>}
          {isEditing ? <textarea value={subtitle || "Sizni qiziqtirgan savollarga shu yerda javob topishingiz mumkin."} onChange={(e) => onUpdateSubtitle && onUpdateSubtitle(e.target.value)} className="w-full text-slate-500 dark:text-slate-400 max-w-2xl mx-auto bg-transparent border border-dashed border-slate-300 rounded-lg p-2 text-center focus:outline-none focus:border-primary resize-none" rows={2} /> : <p className="text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">{subtitle || "Sizni qiziqtirgan savollarga shu yerda javob topishingiz mumkin."}</p>}
        </div>

        <div className={containerClasses}>
          {displayItems.map((item) => {
            const isOpen = openId === item.id || isEditing; 
            
            // Logic for Background
            const cardBgCSS = generateCSS(config?.cardBgGradient) || (config?.cardBgGradientStart ? `linear-gradient(135deg, ${config.cardBgGradientStart}, ${config.cardBgGradientEnd})` : config?.cardBgColor) || 'rgba(255,255,255,0.01)';
            
            // Logic for Border
            const gradientBorder = generateCSS(config?.cardBorderGradient) || (config?.cardBorderGradientStart ? `linear-gradient(135deg, ${config.cardBorderGradientStart}, ${config.cardBorderGradientEnd})` : undefined);
            const solidBorderColor = config?.cardBorderColor || 'transparent';
            
            // If gradient exists, use it. If not, check if width > 0 and solid color is set.
            const hasCustomStyle = !!(config?.cardBgGradient || config?.cardBgGradientStart || config?.cardBgColor || config?.cardBorderGradient || config?.cardBorderGradientStart || config?.cardBlur || (cardBorderWidth > 0 && config?.cardBorderColor));
            
            let cardStyle: React.CSSProperties = { 
                borderRadius: '1rem', 
                backdropFilter: cardBlur > 0 ? `blur(${cardBlur}px)` : undefined, 
                boxShadow: 'none' 
            };

            if (gradientBorder) {
                // Gradient Border logic (using background origin/clip trick)
                cardStyle = {
                    ...cardStyle,
                    border: `${cardBorderWidth}px solid transparent`,
                    backgroundOrigin: 'border-box',
                    backgroundClip: 'padding-box, border-box',
                    backgroundImage: `${cardBgCSS}, ${gradientBorder}`
                };
            } else {
                // Solid Border logic (standard CSS)
                cardStyle = {
                    ...cardStyle,
                    border: `${cardBorderWidth}px solid ${solidBorderColor}`,
                    background: cardBgCSS
                };
            }
            
            const isDefaultLook = !hasCustomStyle;
            const defaultClass = isDefaultLook ? 'bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800' : '';
            const simpleActiveClass = (variant === 'simple' && isOpen && isDefaultLook) ? 'bg-slate-50 dark:bg-slate-800' : '';
            const finalStyle = isDefaultLook ? {} : cardStyle;
            const finalClass = isDefaultLook ? `${itemClasses} ${defaultClass} ${simpleActiveClass}` : `${itemClasses}`;

            return (
              <div key={item.id} className={`overflow-hidden transition-all duration-300 relative group ${finalClass}`} style={finalStyle}>
                {isEditing && <div className="absolute top-2 right-2 flex gap-2 z-20"><button onClick={() => onDeleteItem && onDeleteItem(item.id)} className="p-1.5 bg-red-100 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-colors"><Trash2 className="h-4 w-4" /></button></div>}
                <button onClick={() => toggleItem(item.id)} className="w-full flex items-center justify-between p-5 text-left focus:outline-none relative z-10" disabled={isEditing}>
                  {isEditing ? <input value={item.question} onChange={(e) => onUpdateItem && onUpdateItem(item.id, 'question', e.target.value)} className="font-bold text-lg bg-transparent border-b border-dashed border-slate-300 dark:border-slate-600 w-full mr-8 focus:outline-none focus:border-primary" style={{ color: questionColor }} placeholder="Savol matni..." /> : <span className={`font-bold text-lg transition-colors ${!questionColor ? 'text-slate-900 dark:text-white' : ''}`} style={{ color: isOpen && !questionColor ? primaryColor : questionColor }}>{item.question}</span>}
                  {!isEditing && <span className={`ml-4 flex-shrink-0 p-1 rounded-full transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} style={{ backgroundColor: isOpen ? `${primaryColor}20` : 'transparent', color: isOpen ? primaryColor : '#94a3b8' }}><ChevronDown className="h-5 w-5" /></span>}
                </button>
                <div className={`transition-all duration-300 ease-in-out ${isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}><div className={`p-5 pt-0 leading-relaxed mt-2 ${variant !== 'simple' && isDefaultLook ? 'border-t border-dashed border-slate-200 dark:border-slate-700/50' : ''}`}><div className="pt-2">{isEditing ? <textarea value={item.answer} onChange={(e) => onUpdateItem && onUpdateItem(item.id, 'answer', e.target.value)} className="w-full bg-transparent border border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-2 focus:outline-none focus:border-primary min-h-[80px]" style={{ color: answerColor }} placeholder="Javob matni..." /> : <p className={`${!answerColor ? 'text-slate-600 dark:text-slate-300' : ''}`} style={{ color: answerColor }}>{item.answer}</p>}</div></div></div>
              </div>
            );
          })}
          {isEditing && <button onClick={onAddItem} className="w-full py-4 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl flex items-center justify-center text-slate-500 hover:text-primary hover:border-primary transition-colors font-bold gap-2 bg-slate-50 dark:bg-slate-900 mt-4"><Plus className="h-5 w-5" /> Yangi Savol Qo'shish</button>}
        </div>
      </div>
    </section>
  );
};
