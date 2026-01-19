
import React, { useState, useEffect, useRef } from 'react';
import { Plus, Check, Edit2, Save, X, Trash2, Minus, ZoomIn, ChevronLeft, ChevronRight, ShoppingCart, Tag, ChevronDown, ChevronUp, Heart, Loader2 } from 'lucide-react';
import { Treatment, Category, SiteConfig, GradientConfig } from '../types';
import { formatPrice } from '../constants';
import { uploadToSupabase, base64ToBlob } from '../services/supabase';

interface TreatmentCardProps {
  treatment: Treatment;
  onAdd: (treatment: Treatment, quantity: number) => void;
  isAdmin: boolean;
  onRemove?: () => void;
  onImageClick?: (images: string[], index: number) => void;
  categories?: Category[];
  onUpdate?: (treatment: Treatment) => void;
  config?: SiteConfig;
  layout?: 'masonry' | 'grid' | 'list'; 
  hoverColor?: string;
  isLiked?: boolean;
  onToggleLike?: (id: string) => void;
}

// Helper for gradient generation
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

// Helper to compress image (Improved for fallback size constraints)
const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;
                const MAX_DIM = 1000;
                
                if (width > height) {
                    if (width > MAX_DIM) {
                        height = Math.round((height * MAX_DIM) / width);
                        width = MAX_DIM;
                    }
                } else {
                    if (height > MAX_DIM) {
                        width = Math.round((width * MAX_DIM) / height);
                        height = MAX_DIM;
                    }
                }
                
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                if (ctx) {
                    ctx.drawImage(img, 0, 0, width, height);
                    const outputType = 'image/jpeg';
                    resolve(canvas.toDataURL(outputType, 0.7));
                } else {
                    resolve(event.target?.result as string); // Fallback
                }
            };
            img.onerror = () => resolve(event.target?.result as string);
            img.src = event.target?.result as string;
        };
        reader.readAsDataURL(file);
    });
};

export const TreatmentCard: React.FC<TreatmentCardProps> = ({ treatment, onAdd, isAdmin, onRemove, onImageClick, categories, onUpdate, config, layout = 'masonry', hoverColor = '#0ea5e9', isLiked, onToggleLike }) => {
  const [added, setAdded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSelectingQuantity, setIsSelectingQuantity] = useState(false);
  const [quantity, setQuantity] = useState<string | number>(1);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  
  // Local state for editing
  const [name, setName] = useState(treatment.name);
  const [price, setPrice] = useState(treatment.price);
  const [currency, setCurrency] = useState<'UZS'|'USD'>(treatment.currency || 'UZS');
  const [description, setDescription] = useState(treatment.description);
  const [categoryId, setCategoryId] = useState(treatment.category || '');
  const [images, setImages] = useState<string[]>([]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const prevImagesLength = useRef(0);

  // Config settings
  const cardConfig = config?.style?.cardConfig;
  const showQuantityControl = cardConfig?.showQuantityControl;
  const hideLike = cardConfig?.hideLikeButton;
  const descriptionLines = cardConfig?.descriptionLines || 3;
  const titleSize = cardConfig?.titleSize;
  const categoryPosition = cardConfig?.categoryPosition || 'top-left';
  const imageHeight = cardConfig?.imageHeight;
  
  // Style Overrides
  const cardBg = config?.style?.productCardBg;
  const cardBgGradient = config?.style?.productCardBackgroundGradient;
  const cardText = config?.style?.productCardTextColor;
  const cardRadius = config?.style?.productCardBorderRadius ?? 16;
  const cardAlign = config?.style?.productCardTextAlign || 'left';
  const priceColor = config?.style?.productPriceColor;
  
  // Advanced Styles
  const cardBlur = config?.style?.productCardBlur ?? 0;
  const cardBorderWidth = config?.style?.productCardBorderWidth ?? 1;
  const cardBorderColor = config?.style?.productCardBorderColor || (config?.style?.darkModeColor ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)');
  const shadowColor = config?.style?.productCardShadowColor || hoverColor;

  // New Button Configurations
  const addToCartText = config?.style?.addToCartText || "Savatchaga qo'shish";
  const addedText = config?.style?.addedText || "Qo'shildi";
  
  const addToCartGradient = generateCSS(config?.style?.addToCartBtnGradient);
  const addedGradient = generateCSS(config?.style?.addedBtnGradient);
  
  const addToCartTextColor = config?.style?.addToCartBtnTextColor;
  const addedBtnTextColor = config?.style?.addedBtnTextColor;

  const DESCRIPTION_THRESHOLD = 80;
  const hasLongDescription = description && description.length > DESCRIPTION_THRESHOLD;

  useEffect(() => {
    setName(treatment.name);
    setPrice(treatment.price);
    setCurrency(treatment.currency || 'UZS');
    setDescription(treatment.description);
    setCategoryId(treatment.category || '');
    const imgs = treatment.images && treatment.images.length > 0 ? treatment.images : (treatment.imageUrl ? [treatment.imageUrl] : []);
    setImages(imgs);
    prevImagesLength.current = imgs.length;
  }, [treatment]);

  useEffect(() => {
      if (images.length > prevImagesLength.current) {
          setCurrentImageIndex(images.length - 1);
      }
      prevImagesLength.current = images.length;
  }, [images.length]);

  // Autoplay Logic
  useEffect(() => {
      const isAutoplayEnabled = config?.style?.productGalleryAutoplay;
      if (isAutoplayEnabled && images.length > 1 && !isEditing) {
          const interval = setInterval(() => {
              setCurrentImageIndex(prev => (prev + 1) % images.length);
          }, (config?.style?.productGalleryInterval || 3) * 1000);
          return () => clearInterval(interval);
      }
  }, [images.length, isEditing, config?.style?.productGalleryAutoplay, config?.style?.productGalleryInterval]);

  const nextImage = (e?: React.MouseEvent) => {
      e?.stopPropagation();
      setCurrentImageIndex(prev => (prev + 1) % images.length);
  };

  const prevImage = (e?: React.MouseEvent) => {
      e?.stopPropagation();
      setCurrentImageIndex(prev => (prev - 1 + images.length) % images.length);
  };

  const handleStartAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsSelectingQuantity(true);
    setQuantity(1);
  };

  const handleConfirmAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const finalQty = typeof quantity === 'string' ? (parseInt(quantity) || 1) : quantity;
    onAdd({ ...treatment, name, price, currency }, finalQty);
    setAdded(true);
    setIsSelectingQuantity(false);
    setTimeout(() => setAdded(false), showQuantityControl ? 1000 : 2000);
  };

  const adjustQuantity = (e: React.MouseEvent, delta: number) => {
      e.preventDefault();
      e.stopPropagation();
      setQuantity(prev => {
          const current = typeof prev === 'string' ? (parseInt(prev) || 0) : prev;
          const newValue = current + delta;
          return newValue < 1 ? 1 : newValue;
      });
  };

  const handleQuantityInput = (e: React.ChangeEvent<HTMLInputElement>) => {
      e.preventDefault();
      e.stopPropagation();
      const val = e.target.value;
      if (val === '' || /^[0-9]+$/.test(val)) {
          setQuantity(val === '' ? '' : parseInt(val));
      }
  };

  const handleSave = async (e?: React.MouseEvent) => {
    if (e) { e.stopPropagation(); e.preventDefault(); }
    setIsSaving(true);

    try {
        const processedImages = await Promise.all(images.map(async (img, idx) => {
            if (img.startsWith('data:')) {
                const blob = base64ToBlob(img);
                const url = await uploadToSupabase(blob);
                if (!url) {
                    console.warn("Using fallback base64 image");
                    return img; // Fallback
                }
                return url;
            }
            return img;
        }));

        const cleanImages = processedImages; 

        if (cleanImages.length === 0) {
             throw new Error("Hech qanday rasm qolmadi.");
        }

        const mainImage = cleanImages[0];

        if (onUpdate) {
            onUpdate({
                ...treatment, 
                name, 
                price: Number(price), 
                currency, 
                description, 
                category: categoryId,
                imageUrl: mainImage,
                images: cleanImages
            });
        }
        setIsEditing(false);
    } catch (err: any) {
        console.error("Save error:", err);
        let msg = "Xatolik yuz berdi.";
        if (err.message && err.message.includes('exceeds the maximum size')) {
            msg = "Rasm hajmi juda katta.";
        }
        alert(msg);
    } finally {
        setIsSaving(false);
    }
  };

  const toggleEdit = (e: React.MouseEvent) => {
    e.stopPropagation(); e.preventDefault();
    setIsEditing(!isEditing);
    setIsSelectingQuantity(false);
    if (!isEditing) setCurrentImageIndex(0);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation(); e.preventDefault();
    if (onRemove) onRemove();
  };

  const handleImageClickInternal = (e: React.MouseEvent) => {
    e.stopPropagation(); e.preventDefault();
    if (images.length > 0 && onImageClick && !isEditing) onImageClick(images, currentImageIndex);
  };

  const handleImageAdd = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
          const newImages: string[] = [];
          for (let i = 0; i < files.length; i++) {
              const base64 = await compressImage(files[i]);
              newImages.push(base64);
          }
          setImages(prev => [...prev, ...newImages]);
      }
      if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeImage = (indexToRemove: number) => {
      setImages(prev => {
          const newImages = prev.filter((_, idx) => idx !== indexToRemove);
          if (currentImageIndex >= newImages.length) setCurrentImageIndex(Math.max(0, newImages.length - 1));
          return newImages;
      });
  };

  const toggleDescription = (e: React.MouseEvent) => {
      e.stopPropagation();
      setIsExpanded(!isExpanded);
  };

  const handleLike = (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      if (onToggleLike) onToggleLike(treatment.id);
  };

  const currentQtyNum = typeof quantity === 'string' ? (parseInt(quantity) || 0) : quantity;
  const currentTotal = price * currentQtyNum;
  const isListLayout = layout === 'list';
  const isMasonry = layout === 'masonry';
  
  const containerFlexClass = isListLayout ? 'flex-row' : 'flex-col';
  const useFixedOrAspectRatio = !isListLayout && ((imageHeight && imageHeight > 0) || !isMasonry);
  
  let imageContainerClass = '';
  let imageContainerStyle: React.CSSProperties = {};

  if (isListLayout) {
      imageContainerClass = 'w-32 h-32 sm:w-48 sm:h-auto';
  } else {
      imageContainerClass = 'w-full relative shrink-0';
      if (imageHeight && imageHeight > 0) {
          imageContainerStyle = { height: `${imageHeight}px` };
      } else if (isMasonry) {
          imageContainerClass += ' h-auto min-h-[100px]';
      } else {
          imageContainerClass += ' aspect-[4/3]';
      }
  }

  const renderCategory = () => {
      if (!categoryId || isEditing || categoryPosition === 'hidden') return null;
      switch (categoryPosition) {
          case 'top-left': return <div className="absolute top-2 left-2 z-20"><span className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm text-slate-700 dark:text-slate-200 text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-md shadow-sm border border-slate-100 dark:border-slate-800 uppercase tracking-wide">{categoryId}</span></div>;
          case 'hover-overlay': return <div className="absolute top-2 left-2 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"><span className="bg-black/60 backdrop-blur-sm text-white text-[9px] sm:text-[10px] font-bold px-2 py-1 rounded-md shadow-sm uppercase tracking-wide">{categoryId}</span></div>;
          case 'breadcrumb': return <div className="flex items-center gap-1 text-[9px] sm:text-[10px] text-slate-400 mb-1" style={{ justifyContent: cardAlign === 'center' ? 'center' : cardAlign === 'right' ? 'flex-end' : 'flex-start' }}><Tag className="h-3 w-3" /><span className="font-medium uppercase tracking-wide">{categoryId}</span></div>;
          default: return null;
      }
  };

  const gradientBg = generateCSS(cardBgGradient);
  const dynamicShadowBlur = 20 + (cardBlur * 2); 
  const dynamicShadowSpread = -5; 
  
  const shadowStyle = isHovered 
    ? `0 20px ${dynamicShadowBlur}px ${dynamicShadowSpread}px ${shadowColor}40` 
    : (cardBlur > 0 ? `0 10px ${15 + cardBlur}px -5px ${shadowColor}20` : undefined);

  // Button Style Logic
  const buttonStyle: React.CSSProperties = {
      background: added ? (addedGradient || '#10b981') : (addToCartGradient || (isSelectingQuantity ? 'transparent' : (layout === 'list' ? 'transparent' : 'rgba(15, 23, 42, 1)'))),
      color: added ? (addedBtnTextColor || '#ffffff') : (addToCartTextColor || (layout === 'list' ? (config?.style?.darkModeColor ? '#ffffff' : '#0f172a') : '#ffffff')),
      borderColor: isSelectingQuantity ? hoverColor : 'transparent',
      // Fallback for dark mode in default state
      backgroundColor: (!addToCartGradient && !added && !isSelectingQuantity) ? (layout === 'list' ? 'transparent' : 'rgba(15, 23, 42, 1)') : undefined
  };
  
  if (!addToCartGradient && !added && !isSelectingQuantity) {
      if (!addToCartTextColor) {
          // Default colors
          buttonStyle.backgroundColor = '#0f172a'; // Slate 900
          buttonStyle.color = '#ffffff';
      }
  }

  // Override specifically for the "Add" button state
  const mainButtonStyle: React.CSSProperties = {
      background: added ? (addedGradient || '#10b981') : (addToCartGradient || undefined),
      backgroundColor: (!added && !addToCartGradient) ? '#0f172a' : undefined, // Default fallback
      color: added ? (addedBtnTextColor || '#ffffff') : (addToCartTextColor || '#ffffff'),
      boxShadow: added ? '0 10px 15px -3px rgba(16, 185, 129, 0.3)' : '0 10px 15px -3px rgba(15, 23, 42, 0.2)'
  };

  const finalBtnClass = added 
    ? `relative overflow-hidden flex items-center justify-center gap-1 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl text-[10px] sm:text-xs font-bold transition-all active:scale-95 shadow-md h-full`
    : `relative overflow-hidden flex items-center justify-center gap-1 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl text-[10px] sm:text-xs font-bold transition-all active:scale-95 shadow-md h-full`;

  return (
    <div 
        className={`group flex transition-all duration-300 overflow-hidden relative isolate mb-4 break-inside-avoid transform ${isMasonry ? '' : 'h-full'} ${containerFlexClass}`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{
            boxShadow: shadowStyle,
            borderColor: isHovered ? hoverColor : cardBorderColor,
            borderWidth: `${cardBorderWidth}px`,
            borderStyle: 'solid',
            background: gradientBg || cardBg || undefined,
            borderRadius: `${cardRadius}px`,
            backdropFilter: cardBlur > 0 ? `blur(${cardBlur}px)` : undefined,
            WebkitBackdropFilter: cardBlur > 0 ? `blur(${cardBlur}px)` : undefined,
        }}
    >
      {(!cardBg && !gradientBg) && <div className="absolute inset-0 bg-white dark:bg-slate-900 -z-10" />}
      
      <div 
        className={`relative bg-slate-100 dark:bg-slate-800 overflow-hidden shrink-0 ${imageContainerClass} ${isEditing ? '' : 'cursor-zoom-in group/image'}`}
        onClick={!isEditing ? handleImageClickInternal : undefined}
        style={imageContainerStyle}
      >
        {renderCategory()}
        {!isEditing && !hideLike && (
            <button 
                onClick={handleLike} 
                className={`absolute top-2 right-2 z-30 p-1.5 sm:p-2 rounded-full transition-all active:scale-95 shadow-sm backdrop-blur-sm ${isLiked ? 'bg-red-500 text-white' : 'bg-white/80 dark:bg-slate-900/80 text-slate-400 hover:text-red-500'}`}
            >
                <Heart className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${isLiked ? 'fill-current' : ''}`} />
            </button>
        )}

        {images.length > 0 ? (
            !useFixedOrAspectRatio ? (
                <img 
                    src={(() => {
                        const img = images[currentImageIndex];
                        const isRawBase64 = !img.startsWith('data:') && !img.startsWith('http');
                        if (isRawBase64) {
                            const mime = img.startsWith('iVBOR') ? 'image/png' : 'image/jpeg';
                            return `data:${mime};base64,${img}`;
                        }
                        return img;
                    })()}
                    alt={name}
                    className={`w-full h-auto block transition-transform duration-700 ease-out ${!isEditing ? 'group-hover/image:scale-110' : ''}`}
                />
            ) : (
                images.map((img, idx) => {
                    const isRawBase64 = !img.startsWith('data:') && !img.startsWith('http');
                    let src = img;
                    if (isRawBase64) {
                        const mime = img.startsWith('iVBOR') ? 'image/png' : 'image/jpeg';
                        src = `data:${mime};base64,${img}`;
                    }
                    return (
                        <div key={idx} className={`absolute inset-0 w-full h-full transition-all duration-700 ease-out will-change-transform ${idx === currentImageIndex ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}>
                             <img src={src} alt={`${name}`} className={`w-full h-full object-cover ${!isEditing ? 'group-hover/image:scale-110' : ''} transition-transform duration-700 ease-out`} />
                        </div>
                    );
                })
            )
        ) : (
            <div className={`absolute inset-0 flex items-center justify-center text-slate-300 dark:text-slate-600 ${isMasonry && !imageHeight ? 'h-[200px]' : ''}`}><span className="text-4xl font-light">🦷</span></div>
        )}
        
        {!isEditing && images.length > 0 && useFixedOrAspectRatio && <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/image:opacity-100 transition-opacity duration-300 z-20 bg-black/10 pointer-events-none"><div className="bg-white/20 backdrop-blur-md p-3 rounded-full text-white"><ZoomIn className="h-6 w-6" /></div></div>}

        {(images.length > 1) && (
            <>
                <button onClick={prevImage} className={`absolute left-2 top-1/2 -translate-y-1/2 p-1 bg-black/30 hover:bg-black/50 text-white rounded-full transition-opacity z-40 ${isEditing ? 'opacity-100' : 'opacity-0 group-hover/image:opacity-100'}`}><ChevronLeft className="h-4 w-4" /></button>
                <button onClick={nextImage} className={`absolute right-2 top-1/2 -translate-y-1/2 p-1 bg-black/30 hover:bg-black/50 text-white rounded-full transition-opacity z-40 ${isEditing ? 'opacity-100' : 'opacity-0 group-hover/image:opacity-100'}`}><ChevronRight className="h-4 w-4" /></button>
            </>
        )}
        
        {isEditing && (
            <div className="absolute inset-x-0 bottom-0 bg-slate-900/80 backdrop-blur-sm p-2 flex gap-2 overflow-x-auto z-40 no-scrollbar">
                {images.map((img, idx) => (
                    <div key={idx} className={`relative flex-shrink-0 w-10 h-10 rounded overflow-hidden border-2 cursor-pointer ${idx === currentImageIndex ? 'border-primary' : 'border-transparent opacity-70 hover:opacity-100'}`} onClick={(e) => { e.stopPropagation(); setCurrentImageIndex(idx); }}>
                        <img src={img.startsWith('data:') || img.startsWith('http') ? img : `data:image/jpeg;base64,${img}`} className="w-full h-full object-cover" alt="" />
                        <button onClick={(e) => { e.stopPropagation(); removeImage(idx); }} className="absolute top-0 right-0 bg-red-500 text-white p-0.5 rounded-bl-md"><X className="h-2 w-2" /></button>
                    </div>
                ))}
                <button onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }} className="flex-shrink-0 w-10 h-10 rounded border-2 border-dashed border-slate-500 text-slate-400 flex items-center justify-center bg-white/5"><Plus className="h-4 w-4" /></button>
            </div>
        )}
        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" multiple onChange={handleImageAdd} />
      </div>

      {/* Content Area */}
      <div className={`flex-1 flex flex-col p-3 sm:p-4 ${isListLayout ? 'justify-between' : ''}`} style={{ textAlign: cardAlign }}>
        <div className="flex-1">
          {isEditing ? (
            <div className="space-y-2 mb-2" onClick={(e) => e.stopPropagation()}>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full p-1.5 border rounded text-sm font-bold bg-white dark:bg-slate-800" placeholder="Nomi" />
              
              {/* Category selector during edit */}
              <div className="relative">
                <select 
                  value={categoryId} 
                  onChange={(e) => setCategoryId(e.target.value)} 
                  className="w-full p-1.5 border rounded text-xs bg-white dark:bg-slate-800 appearance-none pr-8"
                >
                  <option value="">Kategoriyasiz</option>
                  {categories?.map(cat => (
                    <option key={cat.id} value={cat.name}>{cat.name}</option>
                  ))}
                </select>
                <Tag className="absolute right-2 top-1.5 h-3 w-3 text-slate-400 pointer-events-none" />
              </div>

              <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="w-full p-1.5 border rounded text-xs bg-white dark:bg-slate-800 resize-none" placeholder="Tavsif" />
              <div className="flex gap-1">
                <input type="number" step="0.01" value={price} onChange={(e) => setPrice(Number(e.target.value))} className="w-2/3 p-1.5 border rounded text-xs font-bold" placeholder="Narx" />
                <select value={currency} onChange={(e) => setCurrency(e.target.value as 'UZS' | 'USD')} className="w-1/3 p-1.5 border rounded text-xs"><option value="UZS">UZS</option><option value="USD">USD</option></select>
              </div>
            </div>
          ) : (
            <>
              {categoryPosition === 'breadcrumb' && renderCategory()}
              {categoryPosition === 'above-title' && categoryId && <p className="text-[9px] font-bold text-primary uppercase tracking-wider mb-1">{categoryId}</p>}
              <h3 className={`text-base sm:text-lg font-bold mb-1.5 break-words leading-tight transition-all duration-300 origin-left group-hover:scale-105 ${isListLayout ? 'line-clamp-2' : ''} ${!cardText ? 'text-slate-900 dark:text-white' : ''}`} style={{ color: isHovered ? hoverColor : cardText, fontSize: titleSize ? `${titleSize}px` : undefined }}>{name}</h3>
              {categoryPosition === 'below-title' && categoryId && <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">{categoryId}</p>}
              
              <div className="mb-3">
                  <p 
                    className={`text-xs sm:text-sm leading-relaxed break-words whitespace-pre-wrap ${isExpanded || !hasLongDescription ? '' : `line-clamp-${descriptionLines}`} ${!cardText ? 'text-slate-600 dark:text-slate-300' : ''}`} 
                    style={{ 
                        color: cardText ? `${cardText}BB` : undefined 
                    }}
                  >
                      {description}
                  </p>
                  {hasLongDescription && (
                      <button 
                        onClick={toggleDescription} 
                        className="text-[10px] font-bold text-primary mt-1 flex items-center gap-0.5 hover:underline focus:outline-none"
                      >
                          {isExpanded ? (
                              <>Qisqartirish <ChevronUp className="h-3 w-3" /></>
                          ) : (
                              <>Ko'proq o'qish <ChevronDown className="h-3 w-3" /></>
                          )}
                      </button>
                  )}
              </div>
            </>
          )}
        </div>
        
        {/* Footer Area */}
        <div className={`mt-auto pt-3 border-t border-slate-50 dark:border-slate-800 flex flex-row flex-wrap items-end justify-between gap-2 ${isListLayout ? 'mt-2 pt-0 border-0' : ''}`} style={{ borderColor: cardBorderColor }}>
          <div className="flex flex-col flex-1 min-w-[60px]">
            <span className={`text-[9px] sm:text-[10px] font-medium transition-colors duration-300 ${isSelectingQuantity || showQuantityControl ? 'text-primary' : 'text-slate-400 dark:text-slate-500'}`}>{(isSelectingQuantity || showQuantityControl) ? `Jami (${quantity})` : 'Narxi'}</span>
            <span className={`text-base sm:text-lg font-bold transition-all duration-300 origin-left whitespace-nowrap ${(isSelectingQuantity || showQuantityControl) ? 'scale-105' : 'group-hover:scale-105'} ${!priceColor ? 'text-slate-900 dark:text-white' : ''}`} style={{ color: (isSelectingQuantity || showQuantityControl || (isHovered && !isSelectingQuantity)) ? hoverColor : priceColor }}>{formatPrice((isSelectingQuantity || showQuantityControl) ? currentTotal : price, currency)}</span>
          </div>
          
          {!isEditing && (
            <div className="h-[36px] flex items-center justify-end shrink-0">
              {(isSelectingQuantity || showQuantityControl) ? (
                  <div className={`flex items-center gap-1 rounded-xl p-1 shadow-md animate-fade-in ${showQuantityControl ? 'bg-slate-100 dark:bg-slate-800' : 'bg-slate-900 dark:bg-slate-800'}`}>
                      <button onClick={(e) => adjustQuantity(e, -1)} className={`w-7 h-7 flex items-center justify-center rounded-lg transition-colors active:scale-95 ${showQuantityControl ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'bg-slate-800 dark:bg-slate-700 text-white'}`}><Minus className="h-3 w-3" /></button>
                      <input 
                          type="text" 
                          inputMode="numeric"
                          value={quantity}
                          onChange={handleQuantityInput}
                          onClick={(e) => e.stopPropagation()}
                          className={`w-8 text-center font-bold text-xs border border-slate-300 dark:border-slate-600 rounded-md focus:ring-1 focus:ring-primary px-0.5 py-0.5 outline-none mx-0.5 ${showQuantityControl ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white' : 'bg-slate-800 dark:bg-slate-900 text-white'}`}
                      />
                      <button onClick={(e) => adjustQuantity(e, 1)} className={`w-7 h-7 flex items-center justify-center rounded-lg transition-colors active:scale-95 ${showQuantityControl ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'bg-slate-800 dark:bg-slate-700 text-white'}`}><Plus className="h-3 w-3" /></button>
                      <button onClick={handleConfirmAdd} className={`ml-1 w-7 h-7 flex items-center justify-center rounded-lg text-white transition-colors active:scale-95 shadow-md ${added ? 'bg-emerald-500' : ''}`} style={{ backgroundColor: added ? undefined : hoverColor }}>{added ? <Check className="h-3.5 w-3.5" /> : (showQuantityControl ? <ShoppingCart className="h-3.5 w-3.5" /> : <Check className="h-3.5 w-3.5" />)}</button>
                  </div>
              ) : (
                <button 
                    onClick={handleStartAdd} 
                    disabled={added} 
                    type="button" 
                    className={finalBtnClass}
                    style={mainButtonStyle}
                >
                  <div className={`flex items-center gap-1 transition-transform duration-300`}>
                    {added ? <><Check className="h-3 w-3" /> <span className="inline">{addedText}</span></> : <><Plus className="h-3 w-3" /> <span className="inline">{addToCartText}</span></>}
                  </div>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {isAdmin && (
        <div className="absolute top-2 right-2 z-[100] flex gap-1">
            <button onClick={handleDelete} type="button" className="p-1.5 rounded-full backdrop-blur-md bg-white/95 dark:bg-slate-900/95 text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-lg active:scale-95 border border-red-100 dark:border-red-900/30 cursor-pointer" title="O'chirish"><Trash2 className="h-3.5 w-3.5" /></button>
            <button onClick={isEditing ? handleSave : toggleEdit} disabled={isSaving} type="button" className={`p-1.5 rounded-full backdrop-blur-md transition-all shadow-lg active:scale-95 border cursor-pointer ${isEditing ? 'bg-primary text-white border-primary' : 'bg-white/95 dark:bg-slate-900/95 text-slate-500 dark:text-slate-400 hover:text-primary hover:bg-white dark:hover:bg-slate-800 border-slate-100 dark:border-slate-800'}`} title="Tahrirlash">
                {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : (isEditing ? <Save className="h-3.5 w-3.5" /> : <Edit2 className="h-3.5 w-3.5" />)}
            </button>
        </div>
      )}
    </div>
  );
};
