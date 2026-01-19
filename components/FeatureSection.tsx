
import React, { useRef, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { FeatureCard, StyleConfig, ModalBlock, ModalBlockType, Treatment, ModalButton, FeatureSectionConfig, GradientConfig, GradientStop } from '../types';
import { ArrowRight, Star, Shield, Zap, Heart, Award, CheckCircle, Info, Smile, Clock, Phone, MapPin, Mail, Calendar, ThumbsUp, Trash2, Plus, Image as ImageIcon, Settings, Copy, Move, AlignLeft, AlignCenter, AlignRight, AlignJustify, X, Upload, Eye as EyeIcon, LayoutGrid, Type, Send, Globe, Facebook, Instagram, ChevronDown, Monitor, Smartphone, Maximize, Minimize, ChevronUp } from 'lucide-react';
import { formatPrice } from '../constants';
import { GradientPicker } from './GradientPicker';
import { uploadToSupabase } from '../services/supabase';

interface FeatureSectionProps {
  cards: FeatureCard[];
  style?: StyleConfig;
  config?: FeatureSectionConfig;
  isEditing?: boolean;
  onCardUpdate?: (id: string, field: keyof FeatureCard, value: any) => void;
  onCardReorder?: (dragIndex: number, dropIndex: number) => void;
  onCardDelete?: (id: string) => void;
  onCardAdd?: () => void;
  onCardDuplicate?: (id: string) => void;
  onStyleUpdate?: (updates: Partial<StyleConfig>) => void;
  onConfigUpdate?: (updates: Partial<FeatureSectionConfig>) => void; 
  onAddToCart?: (item: Treatment, qty: number) => void; 
}

const ICONS: Record<string, React.FC<any>> = {
    Star, Shield, Zap, Heart, Award, CheckCircle, Info, Smile, Clock, Phone, MapPin, Mail, Calendar, ThumbsUp
};

const BUTTON_ICONS: Record<string, React.ElementType> = {
    geolocation: MapPin,
    website: Globe,
    telegram: Send, 
    instagram: Instagram,
    facebook: Facebook,
    phone: Phone,
    default: ArrowRight,
    calendar: Calendar,
    info: Info,
    check: CheckCircle,
    download: ArrowRight,
    share: ArrowRight
};

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

// --- ModalContent (Editor Sub-component) ---
const ModalContent: React.FC<{ 
    card: FeatureCard; 
    isEditing: boolean; 
    onUpdate: (id: string, updates: Partial<ModalBlock>) => void; 
    onDelete: (id: string) => void; 
    onUpload: (e: any, id: string) => void; 
    onReorder: (index: number, direction: 'up' | 'down') => void;
}> = ({ card, isEditing, onUpdate, onDelete, onUpload, onReorder }) => {
    const [activeBlockSettingsId, setActiveBlockSettingsId] = useState<string | null>(null);

    const toggleSettings = (id: string) => setActiveBlockSettingsId(activeBlockSettingsId === id ? null : id);

    return (
        <div className="space-y-4">
            {card.modalBlocks?.map((block, index) => (
                <div key={block.id} className={`p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border transition-all ${activeBlockSettingsId === block.id ? 'border-primary ring-1 ring-primary/20' : 'border-slate-200 dark:border-slate-700'}`}>
                    {/* Header */}
                    <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                                {block.type === 'text' && <Type className="h-3 w-3" />}
                                {block.type === 'image' && <ImageIcon className="h-3 w-3" />}
                                {block.type === 'table' && <LayoutGrid className="h-3 w-3" />}
                                {block.type === 'buttons' && <Send className="h-3 w-3" />}
                                {block.type}
                            </span>
                            {/* Reorder Controls */}
                            <div className="flex gap-0.5 bg-slate-200 dark:bg-slate-700 rounded-md">
                                <button 
                                    onClick={() => onReorder(index, 'up')} 
                                    disabled={index === 0}
                                    className="p-1 text-slate-500 hover:text-primary disabled:opacity-30 transition-colors"
                                >
                                    <ChevronUp className="h-3 w-3" />
                                </button>
                                <button 
                                    onClick={() => onReorder(index, 'down')} 
                                    disabled={index === (card.modalBlocks?.length || 0) - 1}
                                    className="p-1 text-slate-500 hover:text-primary disabled:opacity-30 transition-colors"
                                >
                                    <ChevronDown className="h-3 w-3" />
                                </button>
                            </div>
                        </div>
                        <div className="flex gap-1">
                            <button onClick={() => toggleSettings(block.id)} className={`p-1.5 rounded transition-colors ${activeBlockSettingsId === block.id ? 'bg-primary text-white' : 'text-slate-400 hover:text-primary hover:bg-slate-200 dark:hover:bg-slate-700'}`}>
                                <Settings className="h-3.5 w-3.5" />
                            </button>
                            <button onClick={() => onDelete(block.id)} className="p-1.5 text-red-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors">
                                <Trash2 className="h-3.5 w-3.5" />
                            </button>
                        </div>
                    </div>
                    
                    {/* Basic Editor Content */}
                    <div className="space-y-2">
                        {['text', 'table'].includes(block.type) && (
                            <input value={block.title || ''} onChange={(e) => onUpdate(block.id, { title: e.target.value })} className="w-full text-xs p-2 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold" placeholder="Sarlavha (ixtiyoriy)" />
                        )}
                        {block.type === 'text' && (
                            <textarea value={block.content||''} onChange={(e)=>onUpdate(block.id, {content: e.target.value})} className="w-full text-xs p-2 bg-white dark:bg-slate-900 border rounded min-h-[80px]" placeholder="Matn (HTML)..." />
                        )}
                        {block.type === 'image' && (
                            <div className="flex items-center gap-2 bg-white dark:bg-slate-900 p-2 rounded border border-slate-200 dark:border-slate-700">
                                <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded overflow-hidden flex items-center justify-center shrink-0">
                                    {block.url ? <img src={block.url.startsWith('data:') || block.url.startsWith('http') ? block.url : `data:image/jpeg;base64,${block.url}`} className="w-full h-full object-cover" /> : <ImageIcon className="h-5 w-5 text-slate-300" />}
                                </div>
                                <button onClick={(e) => onUpload(e, block.id)} className="text-xs font-bold text-primary hover:underline">Rasm Yuklash/O'zgartirish</button>
                            </div>
                        )}
                        {/* ... Table and Buttons logic remains same ... */}
                        {block.type === 'table' && (
                            <div className="overflow-x-auto bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-700">
                                <table className="w-full text-[10px]">
                                    <thead>
                                        <tr className="bg-slate-100 dark:bg-slate-800">
                                            {block.headers?.map((h, i) => (
                                                <th key={i} className="p-1 border-r border-slate-200 dark:border-slate-700 last:border-0 min-w-[60px] relative group">
                                                    <input value={h} onChange={(e) => { const nh = [...(block.headers||[])]; nh[i] = e.target.value; onUpdate(block.id, { headers: nh }); }} className="bg-transparent w-full text-center font-bold" />
                                                    <button onClick={() => {
                                                        const nh = (block.headers || []).filter((_, idx) => idx !== i);
                                                        const nr = (block.tableRows || []).map(r => ({ ...r, cells: r.cells.filter((_, idx) => idx !== i) }));
                                                        onUpdate(block.id, { headers: nh, tableRows: nr });
                                                    }} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100"><X className="h-2 w-2"/></button>
                                                </th>
                                            ))}
                                            <th className="p-1 w-6 text-center">
                                                <button onClick={() => {
                                                    const nh = [...(block.headers || []), "Yangi"];
                                                    const nr = (block.tableRows || []).map(r => ({ ...r, cells: [...r.cells, ""] }));
                                                    onUpdate(block.id, { headers: nh, tableRows: nr });
                                                }} className="text-primary hover:bg-primary/10 rounded"><Plus className="h-3 w-3"/></button>
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {block.tableRows?.map((row, i) => (
                                            <tr key={row.id} className="border-t border-slate-100 dark:border-slate-800">
                                                {row.cells.map((cell, j) => (
                                                    <td key={j} className="p-1 border-r border-slate-200 dark:border-slate-700 last:border-0">
                                                        <input value={cell} onChange={(e) => { const nr = [...(block.tableRows||[])]; nr[i].cells[j] = e.target.value; onUpdate(block.id, { tableRows: nr }); }} className="bg-transparent w-full text-center" />
                                                    </td>
                                                ))}
                                                <td className="p-1 text-center">
                                                    <button onClick={() => {
                                                        const nr = (block.tableRows || []).filter((_, idx) => idx !== i);
                                                        onUpdate(block.id, { tableRows: nr });
                                                    }} className="text-red-400 hover:text-red-500"><Trash2 className="h-3 w-3"/></button>
                                                </td>
                                            </tr>
                                        ))}
                                        <tr>
                                            <td colSpan={(block.headers?.length || 0) + 1} className="p-1 text-center">
                                                <button onClick={() => {
                                                    const nr = [...(block.tableRows || []), { id: `tr-${Date.now()}`, cells: new Array(block.headers?.length || 0).fill("") }];
                                                    onUpdate(block.id, { tableRows: nr });
                                                }} className="w-full text-[9px] text-slate-400 hover:text-primary py-1">+ Qator Qo'shish</button>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        )}
                        {block.type === 'buttons' && (
                            <div className="flex flex-wrap gap-2">
                                {block.buttons?.map((btn, idx) => (
                                    <div key={btn.id} className="flex-1 min-w-[120px] bg-white dark:bg-slate-900 p-2 rounded border border-slate-200 dark:border-slate-700 flex flex-col gap-1">
                                        <input value={btn.text} onChange={(e) => { const nb = [...(block.buttons||[])]; nb[idx].text = e.target.value; onUpdate(block.id, { buttons: nb }); }} className="text-xs font-bold bg-transparent border-b border-dashed border-slate-300 w-full" placeholder="Tugma matni" />
                                        <input value={btn.url} onChange={(e) => { const nb = [...(block.buttons||[])]; nb[idx].url = e.target.value; onUpdate(block.id, { buttons: nb }); }} className="text-[10px] text-slate-400 bg-transparent w-full" placeholder="URL" />
                                    </div>
                                ))}
                                <button onClick={() => onUpdate(block.id, { buttons: [...(block.buttons||[]), { id: `btn-${Date.now()}`, text: 'Tugma', url: '#', variant: 'primary', bgColor: '#0ea5e9', textColor: '#ffffff' }] })} className="px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded border border-dashed border-slate-300 text-xs font-bold text-slate-500 hover:text-primary">+ Qo'shish</button>
                            </div>
                        )}
                    </div>

                    {/* Advanced Settings Panel ... same as before */}
                    {activeBlockSettingsId === block.id && (
                        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 -m-3 p-3 rounded-b-lg animate-slide-up">
                            {/* ... Settings controls ... */}
                            <h4 className="text-[10px] font-bold text-slate-400 uppercase mb-2">Qo'shimcha Sozlamalar</h4>
                            <div className="flex gap-2 mb-2">
                                <div><label className="text-[9px] block text-slate-400">Blok Foni</label><input type="color" value={block.blockBgColor || '#ffffff'} onChange={(e) => onUpdate(block.id, { blockBgColor: e.target.value })} className="w-8 h-6 rounded cursor-pointer border-none p-0" /></div>
                                <div className="flex-1"><label className="text-[9px] block text-slate-400">Ichki Bo'shliq (Padding): {block.blockPadding || 0}px</label><input type="range" min="0" max="32" value={block.blockPadding || 0} onChange={(e) => onUpdate(block.id, { blockPadding: parseInt(e.target.value) })} className="w-full h-1 bg-slate-300 rounded accent-primary" /></div>
                            </div>
                            {/* ... Rest of settings ... */}
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
};

// ... FeatureModal component remains largely same, just ensure image sources handle http/https URLs

const FeatureModal: React.FC<{ 
    card: FeatureCard; 
    onClose: () => void; 
    isEditing?: boolean;
    onUpdate?: (id: string, field: keyof FeatureCard, value: any) => void;
    onTriggerUpload?: (id: string, type: 'modal' | 'block', blockId?: string) => void;
}> = ({ card, onClose, isEditing, onUpdate, onTriggerUpload }) => {
    const [isClosing, setIsClosing] = useState(false);
    const handleClose = () => { setIsClosing(true); setTimeout(onClose, 300); };
    useEffect(() => { document.body.style.overflow = 'hidden'; return () => { document.body.style.overflow = ''; }; }, []);
    const layout = card.modalLayout || 'overlay';
    const isSplit = layout.startsWith('split');
    const bgGradient = generateCSS(card.modalBackgroundGradient);
    const contentGradient = generateCSS(card.modalContentGradient);

    const getImgSrc = (url: string) => {
        if(url.startsWith('data:') || url.startsWith('http')) return url;
        return `data:image/jpeg;base64,${url}`;
    };

    return createPortal(
        <div className={`fixed inset-0 z-[120] flex items-center justify-center p-4 transition-opacity duration-300 ${isClosing ? 'opacity-0' : 'opacity-100'}`}>
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleClose} />
            
            <div className={`relative w-full max-w-6xl h-[92vh] flex flex-col transition-transform duration-300 ${isClosing ? 'scale-95 translate-y-4' : 'scale-100 translate-y-0'} animate-slide-up`}>
                
                <button onClick={handleClose} className="absolute top-4 right-4 z-50 p-2 bg-black/20 hover:bg-black/40 text-white rounded-full transition-colors backdrop-blur-md"><X className="h-5 w-5" /></button>
                
                <div className={`w-full h-full bg-white dark:bg-slate-900 rounded-3xl overflow-hidden flex flex-col ${isSplit ? 'md:flex-row' : ''} shadow-2xl relative z-10`} style={{ background: bgGradient }}>
                    {!card.hideModalImage && card.modalImageUrl && (
                        <div className={`relative shrink-0 ${layout === 'split-left' ? 'md:w-5/12 order-1' : layout === 'split-right' ? 'md:w-5/12 order-2' : 'w-full h-48 md:h-64 order-1'}`} style={{ minHeight: '200px' }}>
                            <img src={getImgSrc(card.modalImageUrl)} alt={card.title} className="w-full h-full object-cover" style={{ objectFit: card.modalImageFit || 'cover' }} />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-60" />
                            {(layout === 'hero' || layout === 'overlay') && (
                                <div className="absolute bottom-4 left-4 right-4 text-white">
                                    {!card.hideModalTitle && <h2 className="text-2xl font-bold mb-1 drop-shadow-md">{card.title}</h2>}
                                    {!card.hideModalDescription && <p className="text-sm opacity-90 drop-shadow-md line-clamp-2">{card.description}</p>}
                                </div>
                            )}
                        </div>
                    )}
                    
                    <div className={`flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar relative ${layout === 'split-left' ? 'order-2' : layout === 'split-right' ? 'order-1' : 'order-2'}`} style={{ background: contentGradient }}>
                        {(layout === 'split-left' || layout === 'split-right' || !card.modalImageUrl) && (
                            <div className="mb-6">
                                {!card.hideModalTitle && <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">{card.title}</h2>}
                                {!card.hideModalDescription && <p className="text-slate-500 dark:text-slate-400">{card.description}</p>}
                            </div>
                        )}
                        <div className="space-y-6">
                            {card.modalBlocks?.map(block => (
                                <div 
                                    key={block.id} 
                                    style={{ 
                                        textAlign: block.textAlign || 'left',
                                        backgroundColor: block.blockBgColor,
                                        padding: block.blockPadding ? `${block.blockPadding}px` : undefined,
                                        borderRadius: block.blockPadding ? '12px' : undefined
                                    }}
                                >
                                    {block.type === 'text' && (
                                        <>
                                            {block.title && <h3 className="text-lg font-bold mb-2" style={{ color: block.titleColor, fontSize: block.titleSize }}>{block.title}</h3>}
                                            <div dangerouslySetInnerHTML={{ __html: block.content || '' }} style={{color: block.textColor, fontSize: block.fontSize}} className="prose dark:prose-invert max-w-none" />
                                        </>
                                    )}
                                    {block.type === 'image' && block.url && (
                                        <img 
                                            src={getImgSrc(block.url)} 
                                            className="rounded-lg"
                                            style={{ 
                                                width: block.imageWidth || '100%', 
                                                height: block.imageHeight || 'auto',
                                                objectFit: block.objectFit || 'cover',
                                                borderRadius: block.borderRadius ? `${block.borderRadius}px` : undefined
                                            }} 
                                        />
                                    )}
                                    {/* ... Table and Button renderers ... */}
                                    {block.type === 'table' && (
                                        <div className="overflow-x-auto rounded-lg" style={{ border: block.tableVariant === 'bordered' ? `1px solid ${block.tableBorderColor || '#e2e8f0'}` : undefined }}>
                                            {block.title && <h3 className="text-lg font-bold mb-2" style={{ color: block.titleColor, fontSize: block.titleSize }}>{block.title}</h3>}
                                            <table className="w-full text-sm text-left border-collapse">
                                                <thead style={{ 
                                                    background: block.tableHeaderGradient ? generateCSS(block.tableHeaderGradient) : (block.tableHeaderBg || '#f1f5f9'), 
                                                    color: block.tableHeaderTextColor 
                                                }}>
                                                    <tr>{block.headers?.map((h, i) => <th key={i} className="px-4 py-3 font-bold">{h}</th>)}</tr>
                                                </thead>
                                                <tbody style={{ backgroundColor: block.tableRowBg }}>
                                                    {block.tableRows?.map((row, i) => (
                                                        <tr key={row.id} className={`${block.tableVariant === 'striped' && i % 2 === 0 ? 'bg-slate-50 dark:bg-slate-800/50' : ''}`} style={{ borderBottom: `1px solid ${block.tableBorderColor || '#f1f5f9'}` }}>
                                                            {row.cells.map((cell, j) => (
                                                                <td key={j} className="px-4 py-3" style={{ borderRight: block.tableVariant === 'bordered' ? `1px solid ${block.tableBorderColor || '#e2e8f0'}` : undefined }}>{cell}</td>
                                                            ))}
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                    {block.type === 'buttons' && (
                                        <div className="flex gap-2 flex-wrap" style={{ justifyContent: block.textAlign === 'center' ? 'center' : block.textAlign === 'right' ? 'flex-end' : 'flex-start' }}>
                                            {block.buttons?.map(b => {
                                                const BtnIcon = b.icon ? BUTTON_ICONS[b.icon] : null;
                                                return (
                                                    <a key={b.id} href={b.url} className="px-4 py-2 rounded-lg font-bold flex items-center gap-2 transition-transform active:scale-95 shadow-sm" style={{backgroundColor: b.bgColor, color: b.textColor}}>
                                                        {BtnIcon && <BtnIcon className="h-4 w-4" />} {b.text}
                                                    </a>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

            </div>
        </div>, document.body
    );
};

export const FeatureSection: React.FC<FeatureSectionProps> = ({ 
    cards, style, config, isEditing, 
    onCardUpdate, onCardReorder, onCardDelete, onCardAdd, onCardDuplicate, onStyleUpdate, onConfigUpdate 
}) => {
  const [showSectionSettings, setShowSectionSettings] = useState(false);
  const [editingCardId, setEditingCardId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'content' | 'modal'>('content');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [currentUpload, setCurrentUpload] = useState<{ cardId: string, type: 'main' | 'modal' | 'block', blockId?: string } | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  const [popupPos, setPopupPos] = useState({ x: 50, y: 100 });
  const isDraggingPopup = useRef(false);
  const dragStartPos = useRef({ x: 0, y: 0 });
  const [viewCard, setViewCard] = useState<FeatureCard | null>(null);
  
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
      const handleResize = () => setIsMobile(window.innerWidth < 768);
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
  }, []);

  const activeModalCard = viewCard ? (cards.find(c => c.id === viewCard.id) || viewCard) : null;

  // Dragging Logic (Unified)
  useEffect(() => {
      const handleMove = (e: MouseEvent | TouchEvent) => {
          if (isDraggingPopup.current) {
              const clientX = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
              const clientY = 'touches' in e ? e.touches[0].clientY : (e as MouseEvent).clientY;
              setPopupPos({ x: clientX - dragStartPos.current.x, y: clientY - dragStartPos.current.y });
          }
      };
      const handleUp = () => { isDraggingPopup.current = false; };
      
      if (editingCardId) {
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
  }, [editingCardId]);

  const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
      if (isMobile) return;
      isDraggingPopup.current = true;
      const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
      dragStartPos.current = { x: clientX - popupPos.x, y: clientY - popupPos.y };
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file && currentUpload && onCardUpdate) {
          setIsUploading(true);
          try {
              const url = await uploadToSupabase(file);
              if (url) {
                  if (currentUpload.type === 'main') onCardUpdate(currentUpload.cardId, 'imageUrl', url);
                  else if (currentUpload.type === 'modal') onCardUpdate(currentUpload.cardId, 'modalImageUrl', url);
                  else if (currentUpload.type === 'block' && currentUpload.blockId) {
                      const card = cards.find(c => c.id === currentUpload.cardId);
                      const blocks = card?.modalBlocks || [];
                      const newBlocks = blocks.map(b => b.id === currentUpload.blockId ? { ...b, url: url } : b);
                      onCardUpdate(currentUpload.cardId, 'modalBlocks', newBlocks);
                  }
                  setCurrentUpload(null);
              }
          } catch(e) {
              console.error("Upload failed", e);
          } finally {
              setIsUploading(false);
          }
      }
      if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const triggerUpload = (cardId: string, type: 'main' | 'modal' | 'block', blockId?: string) => {
      setCurrentUpload({ cardId, type, blockId });
      fileInputRef.current?.click();
  };

  // Block Helpers for Modal Editor
  const handleAddBlock = (cardId: string, type: ModalBlockType) => {
      const card = cards.find(c => c.id === cardId);
      if(card && onCardUpdate) onCardUpdate(card.id, 'modalBlocks', [...(card.modalBlocks || []), { id: `b-${Date.now()}`, type, content: type === 'text' ? 'Matn' : undefined }]);
  };
  const handleUpdateBlock = (cardId: string, blockId: string, updates: Partial<ModalBlock>) => {
      const card = cards.find(c => c.id === cardId);
      if(card && onCardUpdate) onCardUpdate(card.id, 'modalBlocks', (card.modalBlocks || []).map(b => b.id === blockId ? { ...b, ...updates } : b));
  };
  const handleDeleteBlock = (cardId: string, blockId: string) => {
      const card = cards.find(c => c.id === cardId);
      if(card && onCardUpdate) onCardUpdate(card.id, 'modalBlocks', (card.modalBlocks || []).filter(b => b.id !== blockId));
  };
  
  // New: Reorder Blocks
  const handleBlockReorder = (cardId: string, index: number, direction: 'up' | 'down') => {
      const card = cards.find(c => c.id === cardId);
      if (!card || !card.modalBlocks || !onCardUpdate) return;
      const newBlocks = [...card.modalBlocks];
      
      if (direction === 'up' && index > 0) {
          [newBlocks[index], newBlocks[index - 1]] = [newBlocks[index - 1], newBlocks[index]];
      } else if (direction === 'down' && index < newBlocks.length - 1) {
          [newBlocks[index], newBlocks[index + 1]] = [newBlocks[index + 1], newBlocks[index]];
      }
      onCardUpdate(cardId, 'modalBlocks', newBlocks);
  };

  if (!cards || cards.length === 0 && !isEditing) return null;

  const layoutMode = config?.layoutMode || 'carousel';
  const paddingY = config?.paddingY !== undefined ? config.paddingY : 16;
  const cardsGap = config?.cardsGap !== undefined ? config.cardsGap : 24;
  const alignment = config?.cardsAlignment || 'center';

  const sectionStyle: React.CSSProperties = {
      paddingTop: `${paddingY * 0.25}rem`,
      paddingBottom: `${paddingY * 0.25}rem`,
      background: config?.sectionGradient ? generateCSS(config.sectionGradient) : (config?.bgGradientStart && config?.bgGradientEnd ? `linear-gradient(to bottom, ${config.bgGradientStart}, ${config.bgGradientEnd})` : undefined)
  };

  const gridClass = layoutMode === 'grid' 
      ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' 
      : 'flex flex-wrap justify-center';

  const getCardImgSrc = (url: string) => {
      if(url.startsWith('data:') || url.startsWith('http')) return url;
      return `data:image/jpeg;base64,${url}`;
  };

  return (
    <section className={`relative ${isEditing ? 'border-y-2 border-dashed border-slate-300 dark:border-slate-700' : ''}`} style={sectionStyle}>
      {/* ... Render logic remains mostly same, just updating image sources ... */}
      {activeModalCard && (
          <FeatureModal 
            card={activeModalCard} 
            onClose={() => setViewCard(null)} 
            isEditing={isEditing}
            onUpdate={onCardUpdate}
            onTriggerUpload={triggerUpload}
          />
      )}

      {/* SECTION SETTINGS (BOTTOM SHEET ON MOBILE) */}
      {isEditing && (
          <div className="absolute top-4 left-4 z-30">
              <button 
                  onClick={() => setShowSectionSettings(!showSectionSettings)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl shadow-lg border transition-colors ${showSectionSettings ? 'bg-primary text-white border-primary' : 'bg-white dark:bg-slate-900 text-slate-500 border-slate-200 dark:border-slate-800'}`}
              >
                  <Settings className="h-5 w-5" />
                  <span className="font-bold text-sm">Bo'lim Sozlamalari</span>
              </button>

              {showSectionSettings && createPortal(
                  <div 
                      className={`fixed z-[9999] bg-white dark:bg-slate-900 p-4 shadow-2xl border border-slate-200 dark:border-slate-800 animate-fade-in text-left flex flex-col ${isMobile ? 'bottom-0 left-0 right-0 rounded-t-2xl border-b-0' : 'rounded-xl w-80'}`}
                      style={isMobile ? { maxHeight: '85vh' } : { top: '3.5rem', left: '1rem', maxHeight: '60vh' }}
                  >
                      {/* ... settings content ... */}
                      <div className="flex justify-between items-center mb-4 border-b border-slate-100 dark:border-slate-800 pb-2">
                          <h3 className="text-xs font-bold uppercase text-slate-500">Bo'lim Sozlamalari</h3>
                          <button onClick={() => setShowSectionSettings(false)}><X className="h-4 w-4 text-slate-400" /></button>
                      </div>
                      <div className="space-y-4 overflow-y-auto custom-scrollbar pr-1 flex-1">
                          <div>
                              <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Joylashuv</label>
                              <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg gap-1">
                                  <button onClick={() => onConfigUpdate && onConfigUpdate({ layoutMode: 'carousel' })} className={`flex-1 text-[10px] py-1.5 rounded ${layoutMode === 'carousel' ? 'bg-white dark:bg-slate-700 shadow text-primary font-bold' : 'text-slate-500'}`}>Carousel</button>
                                  <button onClick={() => onConfigUpdate && onConfigUpdate({ layoutMode: 'grid' })} className={`flex-1 text-[10px] py-1.5 rounded ${layoutMode === 'grid' ? 'bg-white dark:bg-slate-700 shadow text-primary font-bold' : 'text-slate-500'}`}>Grid</button>
                              </div>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                              <div><label className="text-[9px] text-slate-400 block">Gap (Kartalar Orasi)</label><input type="range" min="0" max="100" value={cardsGap} onChange={(e) => onConfigUpdate && onConfigUpdate({ cardsGap: parseInt(e.target.value) })} className="w-full h-1 bg-slate-200 rounded-lg accent-primary" /></div>
                              <div><label className="text-[9px] text-slate-400 block">Padding (Yuqori/Past)</label><input type="range" min="0" max="64" value={paddingY} onChange={(e) => onConfigUpdate && onConfigUpdate({ paddingY: parseInt(e.target.value) })} className="w-full h-1 bg-slate-200 rounded-lg accent-primary" /></div>
                          </div>
                          <div className="border-t border-slate-100 dark:border-slate-800 pt-2">
                              <label className="text-[10px] font-bold text-slate-400 uppercase block mb-2">Orqa Fon (Gradient)</label>
                              <GradientPicker value={config?.sectionGradient} onChange={(g) => onConfigUpdate && onConfigUpdate({ sectionGradient: g })} />
                          </div>
                      </div>
                  </div>,
                  document.body
              )}
          </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className={gridClass} style={{ gap: `${cardsGap}px`, justifyContent: alignment }}>
            {cards.map((card, index) => {
                const bgGradient = generateCSS(card.cardGradient);
                const borderGradient = generateCSS(card.cardBorderGradient);
                const borderWidth = card.cardBorderWidth ?? 1;
                
                const isOverlay = card.hideTitleOnCard; 
                const shouldHideTitle = card.hideModalTitle; 

                return (
                    <div 
                        key={card.id}
                        className="group relative rounded-3xl overflow-hidden shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-xl w-full sm:w-[300px] md:w-[340px] shrink-0 flex flex-col"
                        style={{ 
                            background: isOverlay ? 'transparent' : (bgGradient || (card.contentBgStart ? `linear-gradient(135deg, ${card.contentBgStart}, ${card.contentBgEnd || card.contentBgStart})` : style?.darkModeColor || '#1e293b')),
                            border: !borderGradient ? `1px solid rgba(255,255,255,0.1)` : undefined,
                            position: 'relative',
                            width: card.width ? `${card.width}px` : undefined,
                            height: card.height ? `${card.height}px` : undefined,
                            flexBasis: card.width ? `${card.width}px` : undefined,
                            maxWidth: '100%'
                        }}
                        onClick={() => {
                            if (!isEditing) {
                                if (card.clickAction === 'none') return;
                                setViewCard(card);
                            }
                        }}
                    >
                        {/* ... (Existing card content) ... */}
                        {borderGradient && (
                            <div className="absolute inset-0 z-0 pointer-events-none rounded-3xl" style={{ padding: `${borderWidth}px`, background: borderGradient, mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)', maskComposite: 'exclude', WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)', WebkitMaskComposite: 'xor' }} />
                        )}

                        {!card.hideImageOnCard && card.imageUrl && (
                            <div className={`
                                ${isOverlay ? 'absolute inset-0 h-full w-full z-0' : 'h-48 relative z-0'} 
                                overflow-hidden bg-slate-200 dark:bg-slate-800
                            `}>
                                <img 
                                    src={getCardImgSrc(card.imageUrl)}
                                    alt={card.title} 
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                />
                                {isOverlay && <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" style={{ opacity: card.overlayOpacity ?? 0.7 }} />}
                            </div>
                        )}

                        <div className={`relative z-10 flex flex-col h-full ${isOverlay ? 'justify-end p-6 min-h-[300px]' : 'p-6'}`}>
                            {isEditing && (
                                <div className="absolute top-2 right-2 flex gap-1 z-50">
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); setViewCard(card); }} 
                                        className="p-1.5 bg-white text-slate-500 rounded shadow hover:text-primary"
                                        title="To'liq ko'rish & Modalni tahrirlash"
                                    >
                                        <Maximize className="h-4 w-4" />
                                    </button>
                                    <button onClick={(e) => { e.stopPropagation(); setEditingCardId(card.id); }} className="p-1.5 bg-white text-slate-500 rounded shadow hover:text-primary"><Settings className="h-4 w-4" /></button>
                                    <button onClick={(e) => { e.stopPropagation(); onCardDuplicate && onCardDuplicate(card.id); }} className="p-1.5 bg-white text-slate-500 rounded shadow hover:text-primary"><Copy className="h-4 w-4" /></button>
                                    <button onClick={(e) => { e.stopPropagation(); onCardDelete && onCardDelete(card.id); }} className="p-1.5 bg-red-100 text-red-500 rounded shadow hover:bg-red-500 hover:text-white"><Trash2 className="h-4 w-4" /></button>
                                </div>
                            )}

                            {!shouldHideTitle && (
                                <>
                                    {isOverlay ? (
                                        <div style={{ textAlign: card.captionAlign || 'left', width: '100%' }}>
                                            <h3 className="font-bold mb-1" style={{ 
                                                fontSize: card.captionSize ? `${card.captionSize}px` : '24px', 
                                                color: card.captionColor || '#ffffff',
                                                textShadow: '0 2px 4px rgba(0,0,0,0.5)'
                                            }}>
                                                {card.caption || card.title}
                                            </h3>
                                            <p className="line-clamp-3 leading-relaxed" style={{ 
                                                fontSize: card.captionDescriptionSize ? `${card.captionDescriptionSize}px` : '14px', 
                                                color: card.captionDescriptionColor || 'rgba(255,255,255,0.8)',
                                                textShadow: '0 1px 2px rgba(0,0,0,0.5)'
                                            }}>
                                                {card.captionDescription || card.description}
                                            </p>
                                        </div>
                                    ) : (
                                        <>
                                            <h3 
                                                className="text-xl font-bold mb-2"
                                                style={{ 
                                                    color: (card.titleGradientStart && card.titleGradientEnd) ? 'transparent' : card.titleColor || '#ffffff',
                                                    backgroundImage: (card.titleGradientStart && card.titleGradientEnd) ? `linear-gradient(to right, ${card.titleGradientStart}, ${card.titleGradientEnd})` : undefined,
                                                    backgroundClip: (card.titleGradientStart && card.titleGradientEnd) ? 'text' : undefined,
                                                    WebkitBackgroundClip: (card.titleGradientStart && card.titleGradientEnd) ? 'text' : undefined
                                                }}
                                            >
                                                {card.title}
                                            </h3>
                                            <p className="text-sm opacity-80 leading-relaxed mb-4" style={{ color: card.descColor || '#94a3b8' }}>
                                                {card.description}
                                            </p>
                                        </>
                                    )}
                                </>
                            )}

                            {card.additionalText && (
                                <div className="mt-auto pt-4 text-xs font-bold uppercase tracking-widest" style={{ color: card.additionalTextColor || style?.primaryColor || '#0ea5e9' }}>{card.additionalText}</div>
                            )}
                        </div>
                    </div>
                );
            })}
            
            {isEditing && (
                <div onClick={onCardAdd} className="w-full sm:w-[300px] md:w-[340px] aspect-[4/5] rounded-3xl border-4 border-dashed border-slate-300 dark:border-slate-700 flex flex-col items-center justify-center text-slate-400 cursor-pointer hover:border-primary hover:text-primary transition-colors bg-slate-50/50 dark:bg-slate-900/50">
                    <Plus className="h-10 w-10 mb-2" /><span className="font-bold">Yangi Karta</span>
                </div>
            )}
        </div>
      </div>

      {isEditing && editingCardId && createPortal(
          <div 
            className={`fixed z-[9999] bg-white dark:bg-slate-900 p-4 shadow-2xl border border-slate-200 dark:border-slate-800 animate-fade-in text-left flex flex-col ${isMobile ? 'bottom-0 left-0 right-0 rounded-t-2xl border-b-0' : 'rounded-xl w-[90vw] md:w-full max-w-2xl'}`}
            style={isMobile ? { maxHeight: '85vh' } : { top: popupPos.y, left: popupPos.x, maxHeight: '80vh' }}
          >
              <div 
                className={`flex justify-between items-center mb-3 pb-2 border-b border-slate-100 dark:border-slate-800 ${!isMobile ? 'cursor-move' : ''} touch-none`}
                onMouseDown={handleDragStart}
                onTouchStart={handleDragStart}
              >
                  <div className="flex items-center gap-4">
                      <span className="font-bold text-slate-700 dark:text-white uppercase text-sm pointer-events-none">Karta Tahrirlash</span>
                      <div className="flex bg-white dark:bg-slate-800 rounded-lg p-1 border border-slate-200 dark:border-slate-700">
                          <button onClick={() => setActiveTab('content')} className={`px-4 py-1.5 rounded text-xs font-bold transition-colors ${activeTab === 'content' ? 'bg-primary text-white shadow' : 'text-slate-500 hover:text-slate-700'}`}>Asosiy</button>
                          <button onClick={() => setActiveTab('modal')} className={`px-4 py-1.5 rounded text-xs font-bold transition-colors ${activeTab === 'modal' ? 'bg-primary text-white shadow' : 'text-slate-500 hover:text-slate-700'}`}>Modal</button>
                      </div>
                  </div>
                  <button onClick={() => setEditingCardId(null)} className="hover:bg-slate-200 dark:hover:bg-slate-700 p-1 rounded-lg"><X className="h-5 w-5 text-slate-400" /></button>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 pb-4">
                  {(() => {
                      const card = cards.find(c => c.id === editingCardId);
                      if (!card) return null;

                      if (activeTab === 'content') {
                          return (
                              <div className="space-y-6">
                                  {/* ... (Keep existing content tab content) ... */}
                                  <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                                      <h4 className="text-xs font-bold text-slate-400 uppercase mb-3">Asosiy Ma'lumotlar</h4>
                                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                                          <div><label className="text-xs font-bold text-slate-500 block mb-1">Sarlavha</label><input value={card.title} onChange={(e) => onCardUpdate && onCardUpdate(card.id, 'title', e.target.value)} className="w-full p-2 border rounded-lg bg-transparent text-sm font-bold" /></div>
                                          <div>
                                              <label className="text-xs font-bold text-slate-500 block mb-1">Rasm</label>
                                              <button onClick={() => triggerUpload(card.id, 'main')} disabled={isUploading} className="w-full p-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-bold flex items-center justify-center gap-2 border border-dashed border-slate-300 disabled:opacity-50">
                                                  {isUploading ? "Yuklanmoqda..." : <><Upload className="h-3 w-3" /> Yuklash</>}
                                              </button>
                                          </div>
                                      </div>
                                      <textarea value={card.description} onChange={(e) => onCardUpdate && onCardUpdate(card.id, 'description', e.target.value)} className="w-full p-2 border rounded-lg bg-transparent h-20 text-sm" placeholder="Tavsif..." />
                                  </div>
                                  
                                  {/* ... Rest of content settings ... */}
                                  <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                                      <h4 className="text-xs font-bold text-slate-400 uppercase mb-3">O'lchamlar (PX)</h4>
                                      <div className="space-y-4">
                                          <div>
                                              <div className="flex justify-between items-center mb-1">
                                                  <label className="text-xs font-bold text-slate-500">Kenglik</label>
                                                  <span className="text-[10px] font-mono">{card.width || 'Auto'}px</span>
                                              </div>
                                              <div className="flex gap-2">
                                                  <input type="range" min="200" max="600" step="10" value={card.width || 300} onChange={(e) => onCardUpdate && onCardUpdate(card.id, 'width', parseInt(e.target.value))} className="flex-1 h-1.5 bg-slate-200 rounded-lg accent-primary" />
                                                  <input type="number" value={card.width || ''} onChange={(e) => onCardUpdate && onCardUpdate(card.id, 'width', parseInt(e.target.value))} className="w-16 p-1 border rounded text-xs text-center" />
                                              </div>
                                          </div>
                                          <div>
                                              <div className="flex justify-between items-center mb-1">
                                                  <label className="text-xs font-bold text-slate-500">Balandlik</label>
                                                  <span className="text-[10px] font-mono">{card.height || 'Auto'}px</span>
                                              </div>
                                              <div className="flex gap-2">
                                                  <input type="range" min="200" max="800" step="10" value={card.height || 400} onChange={(e) => onCardUpdate && onCardUpdate(card.id, 'height', parseInt(e.target.value))} className="flex-1 h-1.5 bg-slate-200 rounded-lg accent-primary" />
                                                  <input type="number" value={card.height || ''} onChange={(e) => onCardUpdate && onCardUpdate(card.id, 'height', parseInt(e.target.value))} className="w-16 p-1 border rounded text-xs text-center" />
                                              </div>
                                          </div>
                                      </div>
                                  </div>

                                  {/* ... Appearance settings ... */}
                                  <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                                      {/* ... checkbox flags ... */}
                                      <div className="flex justify-between items-center mb-3">
                                          <label className="text-xs font-bold text-slate-400 uppercase">Ko'rinish</label>
                                          <div className="flex flex-col gap-2">
                                              <label className="flex items-center gap-2 text-xs font-bold text-slate-500 cursor-pointer p-2 bg-slate-50 dark:bg-slate-800 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700">
                                                  <input type="checkbox" checked={card.hideTitleOnCard} onChange={(e) => onCardUpdate && onCardUpdate(card.id, 'hideTitleOnCard', e.target.checked)} className="accent-primary w-4 h-4" /> 
                                                  Full Image Overlay (Rasm Fon)
                                              </label>
                                              <label className="flex items-center gap-2 text-xs font-bold text-slate-500 cursor-pointer p-2 bg-slate-50 dark:bg-slate-800 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700">
                                                  <input type="checkbox" checked={card.hideModalTitle} onChange={(e) => onCardUpdate && onCardUpdate(card.id, 'hideModalTitle', e.target.checked)} className="accent-primary w-4 h-4" /> 
                                                  Sarlavhani Yashirish
                                              </label>
                                              <label className="flex items-center gap-2 text-xs font-bold text-slate-500 cursor-pointer p-2 bg-slate-50 dark:bg-slate-800 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700">
                                                  <input type="checkbox" checked={card.hideImageOnCard} onChange={(e) => onCardUpdate && onCardUpdate(card.id, 'hideImageOnCard', e.target.checked)} className="accent-primary w-4 h-4" /> 
                                                  Rasmni Yashirish
                                              </label>
                                              <label className="flex items-center gap-2 text-xs font-bold text-slate-500 cursor-pointer p-2 bg-slate-50 dark:bg-slate-800 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700">
                                                  <input type="checkbox" checked={card.clickAction === 'none'} onChange={(e) => onCardUpdate && onCardUpdate(card.id, 'clickAction', e.target.checked ? 'none' : 'modal')} className="accent-primary w-4 h-4" /> 
                                                  Modalni O'chirish
                                              </label>
                                          </div>
                                      </div>
                                      {/* ... Overlay settings ... */}
                                      {card.hideTitleOnCard && (
                                          <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 animate-slide-up">
                                              <label className="text-xs font-bold text-slate-500 block mb-2 flex justify-between items-center">
                                                  <span>Overlay Matnlari</span>
                                                  <div className="flex bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-700 p-0.5">
                                                      <button onClick={() => onCardUpdate && onCardUpdate(card.id, 'captionAlign', 'left')} className={`p-1 rounded ${!card.captionAlign || card.captionAlign === 'left' ? 'bg-slate-100 dark:bg-slate-700 text-primary' : 'text-slate-400'}`}><AlignLeft className="h-3 w-3" /></button>
                                                      <button onClick={() => onCardUpdate && onCardUpdate(card.id, 'captionAlign', 'center')} className={`p-1 rounded ${card.captionAlign === 'center' ? 'bg-slate-100 dark:bg-slate-700 text-primary' : 'text-slate-400'}`}><AlignCenter className="h-3 w-3" /></button>
                                                      <button onClick={() => onCardUpdate && onCardUpdate(card.id, 'captionAlign', 'right')} className={`p-1 rounded ${card.captionAlign === 'right' ? 'bg-slate-100 dark:bg-slate-700 text-primary' : 'text-slate-400'}`}><AlignRight className="h-3 w-3" /></button>
                                                  </div>
                                              </label>

                                              <div className="mb-3 space-y-2 border-b border-slate-200 dark:border-slate-700 pb-3">
                                                  <label className="text-[10px] font-bold text-slate-400 uppercase">Sarlavha (Caption)</label>
                                                  <div className="flex gap-2">
                                                      <input value={card.caption || ''} onChange={(e) => onCardUpdate && onCardUpdate(card.id, 'caption', e.target.value)} className="flex-1 p-2 border rounded bg-white dark:bg-slate-900 text-xs font-bold" placeholder={card.title} />
                                                      <button onClick={() => onCardUpdate && onCardUpdate(card.id, 'caption', '')} className="p-2 text-red-400 hover:bg-red-50 rounded" title="O'chirish (Defaultga qaytish)"><Trash2 className="h-4 w-4" /></button>
                                                  </div>
                                                  <div className="flex gap-2 items-center">
                                                      <input type="color" value={card.captionColor || '#ffffff'} onChange={(e) => onCardUpdate && onCardUpdate(card.id, 'captionColor', e.target.value)} className="h-6 w-6 rounded cursor-pointer border-none p-0" />
                                                      <div className="flex-1 flex items-center gap-2">
                                                          <span className="text-[9px] text-slate-400 w-12">Size: {card.captionSize || 24}px</span>
                                                          <input type="range" min="12" max="64" value={card.captionSize || 24} onChange={(e) => onCardUpdate && onCardUpdate(card.id, 'captionSize', parseInt(e.target.value))} className="flex-1 h-1 bg-slate-200 rounded-lg accent-primary" />
                                                      </div>
                                                  </div>
                                              </div>

                                              <div className="space-y-2">
                                                  <label className="text-[10px] font-bold text-slate-400 uppercase">Qo'shimcha Matn</label>
                                                  <div className="flex gap-2">
                                                      <input value={card.captionDescription || ''} onChange={(e) => onCardUpdate && onCardUpdate(card.id, 'captionDescription', e.target.value)} className="flex-1 p-2 border rounded bg-white dark:bg-slate-900 text-xs" placeholder={card.description} />
                                                      <button onClick={() => onCardUpdate && onCardUpdate(card.id, 'captionDescription', '')} className="p-2 text-red-400 hover:bg-red-50 rounded" title="O'chirish (Defaultga qaytish)"><Trash2 className="h-4 w-4" /></button>
                                                  </div>
                                                  <div className="flex gap-2 items-center">
                                                      <input type="color" value={card.captionDescriptionColor || '#e2e8f0'} onChange={(e) => onCardUpdate && onCardUpdate(card.id, 'captionDescriptionColor', e.target.value)} className="h-6 w-6 rounded cursor-pointer border-none p-0" />
                                                      <div className="flex-1 flex items-center gap-2">
                                                          <span className="text-[9px] text-slate-400 w-12">Size: {card.captionDescriptionSize || 14}px</span>
                                                          <input type="range" min="10" max="32" value={card.captionDescriptionSize || 14} onChange={(e) => onCardUpdate && onCardUpdate(card.id, 'captionDescriptionSize', parseInt(e.target.value))} className="flex-1 h-1 bg-slate-200 rounded-lg accent-primary" />
                                                      </div>
                                                  </div>
                                              </div>

                                              <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                                                  <div className="flex items-center gap-2">
                                                      <span className="text-[10px] text-slate-400">Fon Qorong'uligi:</span>
                                                      <input type="range" min="0" max="1" step="0.1" value={card.overlayOpacity ?? 0.7} onChange={(e) => onCardUpdate && onCardUpdate(card.id, 'overlayOpacity', parseFloat(e.target.value))} className="flex-1 h-1 bg-slate-200 rounded-lg accent-primary" />
                                                      <span className="text-[10px] w-8 text-right">{card.overlayOpacity ?? 0.7}</span>
                                                  </div>
                                              </div>
                                          </div>
                                      )}
                                      <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
                                          <label className="text-xs font-bold text-slate-400 block mb-2">Orqa Fon Gradient (Agar Full Image o'chirilgan bo'lsa)</label>
                                          <GradientPicker value={card.cardGradient} onChange={(g) => onCardUpdate && onCardUpdate(card.id, 'cardGradient', g)} />
                                      </div>
                                  </div>
                              </div>
                          );
                      } else if (activeTab === 'modal') {
                          return (
                              <div className="space-y-6">
                                  {/* Layout & Image */}
                                  <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Layout & Rasm</label>
                                      <select value={card.modalLayout || 'overlay'} onChange={(e) => onCardUpdate && onCardUpdate(card.id, 'modalLayout', e.target.value)} className="w-full text-xs p-2.5 rounded-lg border dark:border-slate-700 bg-transparent font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all mb-3">
                                          <option value="overlay">Overlay</option>
                                          <option value="hero">Hero</option>
                                          <option value="split-left">Split Left</option>
                                          <option value="split-right">Split Right</option>
                                      </select>
                                      <div className="flex gap-2 mb-3">
                                          <button onClick={() => triggerUpload(card.id, 'modal')} disabled={isUploading} className="flex-1 px-3 py-2.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-bold flex items-center justify-center gap-2 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors disabled:opacity-50">
                                              {isUploading ? "Yuklanmoqda..." : <><Upload className="h-3.5 w-3.5" /> Rasm Yuklash</>}
                                          </button>
                                          {card.modalImageUrl && <button onClick={() => onCardUpdate && onCardUpdate(card.id, 'modalImageUrl', '')} className="px-3 py-2.5 bg-red-50 text-red-500 rounded-lg hover:bg-red-100 hover:text-red-600 transition-colors"><Trash2 className="h-3.5 w-3.5" /></button>}
                                      </div>
                                      <div className="grid grid-cols-2 gap-2">
                                          <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 font-medium bg-slate-50 dark:bg-slate-800 p-2 rounded-lg border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-colors cursor-pointer">
                                              <input type="checkbox" checked={card.hideModalImage} onChange={(e) => onCardUpdate && onCardUpdate(card.id, 'hideModalImage', e.target.checked)} className="accent-primary w-4 h-4 rounded" /> 
                                              Rasm Yo'q
                                          </label>
                                          <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 font-medium bg-slate-50 dark:bg-slate-800 p-2 rounded-lg border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-colors cursor-pointer">
                                              <input type="checkbox" checked={card.hideModalTitle} onChange={(e) => onCardUpdate && onCardUpdate(card.id, 'hideModalTitle', e.target.checked)} className="accent-primary w-4 h-4 rounded" /> 
                                              Sarlavha Yo'q
                                          </label>
                                      </div>
                                  </div>

                                  {/* Backgrounds */}
                                  <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-3">Orqa Fonlar</label>
                                      <div className="mb-4">
                                          <label className="text-[10px] text-slate-500 block mb-1.5 font-medium">Asosiy Gradient</label>
                                          <GradientPicker value={card.modalBackgroundGradient} onChange={(g) => onCardUpdate && onCardUpdate(card.id, 'modalBackgroundGradient', g)} />
                                      </div>
                                      <div>
                                          <label className="text-[10px] text-slate-500 block mb-1.5 font-medium">Content Gradient</label>
                                          <GradientPicker value={card.modalContentGradient} onChange={(g) => onCardUpdate && onCardUpdate(card.id, 'modalContentGradient', g)} />
                                      </div>
                                  </div>

                                  {/* Blocks Manager */}
                                  <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                                      <div className="flex justify-between items-center mb-3">
                                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Bloklar</label>
                                          <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                                              <button onClick={() => handleAddBlock(card.id, 'text')} className="p-1.5 rounded-md hover:bg-white dark:hover:bg-slate-700 text-slate-500 hover:text-primary transition-all shadow-sm" title="Matn"><Type className="h-3.5 w-3.5" /></button>
                                              <button onClick={() => handleAddBlock(card.id, 'image')} className="p-1.5 rounded-md hover:bg-white dark:hover:bg-slate-700 text-slate-500 hover:text-primary transition-all shadow-sm" title="Rasm"><ImageIcon className="h-3.5 w-3.5" /></button>
                                              <button onClick={() => handleAddBlock(card.id, 'table')} className="p-1.5 rounded-md hover:bg-white dark:hover:bg-slate-700 text-slate-500 hover:text-primary transition-all shadow-sm" title="Jadval"><LayoutGrid className="h-3.5 w-3.5" /></button>
                                              <button onClick={() => handleAddBlock(card.id, 'buttons')} className="p-1.5 rounded-md hover:bg-white dark:hover:bg-slate-700 text-slate-500 hover:text-primary transition-all shadow-sm" title="Tugmalar"><Send className="h-3.5 w-3.5" /></button>
                                          </div>
                                      </div>
                                      <ModalContent 
                                          card={card} 
                                          isEditing={true} 
                                          onUpdate={(bid, up) => handleUpdateBlock(card.id, bid, up)}
                                          onDelete={(bid) => handleDeleteBlock(card.id, bid)}
                                          onUpload={(e: any, bid: string) => { triggerUpload(card.id, 'block', bid); }}
                                          onReorder={(idx, dir) => handleBlockReorder(card.id, idx, dir)}
                                      />
                                  </div>
                              </div>
                          );
                      }
                  })()}
              </div>
          </div>,
          document.body
      )}
      
      <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
    </section>
  );
};
