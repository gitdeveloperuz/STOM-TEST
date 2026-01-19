
import React, { useState, useRef, useEffect } from 'react';
import { ImageDiffItem, StyleConfig, ImageDiffSectionConfig, GradientConfig } from '../types';
import { ChevronLeft, ChevronRight, ExternalLink, Calendar, Info, CheckCircle, ArrowDown, Share2, Phone, Send, Instagram, Facebook, Globe, MapPin } from 'lucide-react';

interface ImageDiffSliderProps {
  item: ImageDiffItem;
  style?: StyleConfig;
  config?: ImageDiffSectionConfig;
}

const BUTTON_ICONS: Record<string, React.ElementType> = {
    geolocation: MapPin,
    website: Globe,
    telegram: Send,
    instagram: Instagram,
    facebook: Facebook,
    phone: Phone,
    default: ExternalLink,
    calendar: Calendar,
    info: Info,
    check: CheckCircle,
    download: ArrowDown,
    share: Share2
};

const generateGradientCSS = (g?: GradientConfig) => {
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

export const ImageDiffSlider: React.FC<ImageDiffSliderProps> = ({ item, style, config }) => {
  const [sliderPosition, setSliderPosition] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  const interactionMode = config?.interactionMode || 'drag';
  const textLayout = item.textLayout || 'top';
  
  // Styles
  const sliderColor = item.sliderColor || config?.sliderColor || style?.primaryColor || '#ffffff';
  const sliderThickness = item.sliderThickness ?? config?.sliderThickness ?? 4; 
  const handleColor = item.handleColor || config?.handleColor || sliderColor;
  const labelBg = config?.labelBgColor || 'rgba(0,0,0,0.5)';
  const labelText = config?.labelTextColor || '#ffffff';
  const borderRadius = config?.borderRadius !== undefined ? config.borderRadius : 16;
  const borderWidth = config?.borderWidth || 1;
  const borderColor = config?.borderColor || (style?.primaryColor ? `${style.primaryColor}20` : 'rgba(0,0,0,0.1)'); 
  const advancedBorderGradient = generateGradientCSS(config?.cardBorderGradient);

  // Labels & Config
  const beforeLabel = config?.beforeLabel;
  const afterLabel = config?.afterLabel;
  const labelAlignment = config?.labelAlignment || 'top-left';
  
  // Handle Logic
  const handleStyle = item.handleStyle || config?.handleStyle || 'circle-arrows';
  const hideHandle = item.hideHandle || config?.hideHandle || false;

  const handleMove = (clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const percent = Math.max(0, Math.min((x / rect.width) * 100, 100));
    setSliderPosition(percent);
  };

  const handleMouseDown = () => { isDragging.current = true; };
  const handleMouseUp = () => { isDragging.current = false; };
  const handleMouseMove = (e: React.MouseEvent) => {
    if (interactionMode === 'hover' || isDragging.current) {
        handleMove(e.clientX);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    handleMove(e.touches[0].clientX);
  };

  useEffect(() => {
    const handleGlobalMouseUp = () => { isDragging.current = false; };
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
  }, []);

  const getBase64 = (str: string) => {
      if (!str) return '';
      if (str.startsWith('data:')) return str;
      const mime = str.startsWith('iVBOR') ? 'image/png' : 'image/jpeg';
      return `data:${mime};base64,${str}`;
  };

  const getLabelStyle = (type: 'before' | 'after'): React.CSSProperties => {
      const baseStyle: React.CSSProperties = {
          backgroundColor: labelBg,
          color: labelText,
          zIndex: 10
      };

      if (type === 'before') {
          switch(labelAlignment) {
              case 'top-left': return { ...baseStyle, top: '1rem', left: '1rem' };
              case 'top-right': return { ...baseStyle, top: '1rem', right: '1rem' }; 
              case 'bottom-left': return { ...baseStyle, bottom: '1rem', left: '1rem' };
              case 'bottom-right': return { ...baseStyle, bottom: '1rem', right: '1rem' };
              default: return { ...baseStyle, top: '1rem', left: '1rem' };
          }
      } else {
          switch(labelAlignment) {
              case 'top-left': return { ...baseStyle, top: '1rem', right: '1rem' }; 
              case 'top-right': return { ...baseStyle, top: '1rem', left: '1rem' }; 
              case 'bottom-left': return { ...baseStyle, bottom: '1rem', right: '1rem' };
              case 'bottom-right': return { ...baseStyle, bottom: '1rem', left: '1rem' };
              default: return { ...baseStyle, top: '1rem', right: '1rem' };
          }
      }
  };

  // Render Handle Based on Style
  const renderHandle = () => {
      if (hideHandle) return null;

      const baseClasses = "absolute top-0 bottom-0 z-20 shadow-[0_0_10px_rgba(0,0,0,0.5)] flex items-center justify-center transition-colors";
      const baseStyle = { 
          left: `${sliderPosition}%`,
          width: `${sliderThickness}px`,
          marginLeft: `-${sliderThickness / 2}px`,
          backgroundColor: sliderColor,
          cursor: interactionMode === 'hover' ? 'crosshair' : 'ew-resize' 
      };

      return (
          <div className={baseClasses} style={baseStyle}>
              {handleStyle !== 'line' && (
                  <div 
                      className={`flex items-center justify-center shadow-lg ${handleStyle === 'square' ? 'w-8 h-8 rounded-lg' : 'w-8 h-8 rounded-full'}`}
                      style={{ backgroundColor: handleColor }}
                  >
                      {handleStyle !== 'circle' && (
                          <div className="flex gap-0.5">
                              <ChevronLeft className="h-3 w-3" style={{ color: labelText === '#ffffff' ? '#000' : '#fff' }} />
                              <ChevronRight className="h-3 w-3" style={{ color: labelText === '#ffffff' ? '#000' : '#fff' }} />
                          </div>
                      )}
                  </div>
              )}
          </div>
      );
  };

  const showHeader = (item.label && item.label.trim().length > 0) || (item.description && item.description.trim().length > 0) || (item.buttons && item.buttons.length > 0);

  const renderContent = () => {
      if (!showHeader) return null;
      
      const contentBg = item.contentGradient
          ? generateGradientCSS(item.contentGradient)
          : (item.contentBgGradientStart && item.contentBgGradientEnd 
              ? `linear-gradient(to bottom, ${item.contentBgGradientStart}, ${item.contentBgGradientEnd})`
              : 'transparent');

      const contentStyle: React.CSSProperties = { background: contentBg };

      const titleBg = item.titleGradient ? generateGradientCSS(item.titleGradient) : undefined;
      const titleStyle: React.CSSProperties = {
          color: titleBg ? 'transparent' : item.titleColor || undefined,
          backgroundImage: titleBg,
          backgroundClip: titleBg ? 'text' : undefined,
          WebkitBackgroundClip: titleBg ? 'text' : undefined
      };

      const descBg = item.descGradient ? generateGradientCSS(item.descGradient) : undefined;
      const descStyle: React.CSSProperties = {
          color: descBg ? 'transparent' : item.descColor || undefined,
          backgroundImage: descBg,
          backgroundClip: descBg ? 'text' : undefined,
          WebkitBackgroundClip: descBg ? 'text' : undefined
      };

      return (
          <div className={`p-4 ${textLayout !== 'overlay' ? 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800' : 'absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent z-20 text-white'}`} style={contentStyle}>
              {item.label && <h3 className={`text-lg font-bold ${textLayout !== 'overlay' ? 'text-slate-900 dark:text-white' : 'text-white'}`} style={titleStyle}>{item.label}</h3>}
              {item.description && <p className={`text-sm mt-1 ${textLayout !== 'overlay' ? 'text-slate-500 dark:text-slate-400' : 'text-white/80'}`} style={descStyle}>{item.description}</p>}
              {item.additionalText && <div className="mt-2 text-xs font-bold" style={{ color: item.additionalTextColor || '#ef4444' }}>{item.additionalText}</div>}
              {item.buttons && item.buttons.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                      {item.buttons.map(btn => {
                          const Icon = BUTTON_ICONS[btn.icon] || ExternalLink;
                          return (
                              <a key={btn.id} href={btn.url} target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-transform active:scale-95 hover:brightness-110 shadow-sm" style={{ backgroundColor: btn.bgColor, color: btn.textColor }}>
                                  <Icon className="h-3 w-3" style={{ color: btn.iconColor }} /> {btn.text}
                              </a>
                          );
                      })}
                  </div>
              )}
          </div>
      );
  };

  let wrapperStyle: React.CSSProperties = { borderRadius: `${borderRadius}px`, height: item.height || '100%' };
  let innerStyle: React.CSSProperties = { borderRadius: `${Math.max(0, borderRadius - borderWidth)}px` };

  if (advancedBorderGradient) {
      wrapperStyle = {
          ...wrapperStyle,
          border: `${borderWidth}px solid transparent`,
          backgroundImage: `linear-gradient(white, white), ${advancedBorderGradient}`,
          background: advancedBorderGradient,
          padding: `${borderWidth}px`
      };
      innerStyle = { ...innerStyle, background: style?.darkModeColor || '#0f172a', height: '100%', width: '100%', overflow: 'hidden' };
  } else {
      wrapperStyle = { ...wrapperStyle, border: `${borderWidth}px solid ${borderColor}`, overflow: 'hidden' };
      innerStyle = { ...innerStyle, height: '100%', width: '100%', overflow: 'hidden' };
  }

  return (
    <div className="flex flex-col bg-white dark:bg-slate-900 shadow-lg relative" style={wrapperStyle}>
        <div className="flex flex-col h-full w-full relative" style={innerStyle}>
            {textLayout === 'top' && renderContent()}
            <div className="flex-1 relative overflow-hidden">
                <div ref={containerRef} className={`relative w-full h-full select-none group ${interactionMode === 'hover' ? 'cursor-crosshair' : 'cursor-ew-resize'}`} onMouseDown={interactionMode === 'drag' ? handleMouseDown : undefined} onMouseMove={handleMouseMove} onTouchMove={handleTouchMove}>
                    <img src={getBase64(item.afterImage)} alt="After" className="absolute top-0 left-0 w-full h-full object-cover" draggable={false} />
                    {afterLabel && afterLabel.trim() !== '' && <span className="absolute text-xs font-bold px-2 py-1 rounded backdrop-blur-md pointer-events-none" style={getLabelStyle('after')}>{afterLabel}</span>}
                    <div className="absolute top-0 left-0 w-full h-full overflow-hidden" style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}>
                        <img src={getBase64(item.beforeImage)} alt="Before" className="absolute top-0 left-0 w-full h-full object-cover max-w-none" style={{ width: '100%', height: '100%' }} draggable={false} />
                        {beforeLabel && beforeLabel.trim() !== '' && <span className="absolute text-xs font-bold px-2 py-1 rounded backdrop-blur-md pointer-events-none" style={getLabelStyle('before')}>{beforeLabel}</span>}
                    </div>
                    {renderHandle()}
                    {textLayout === 'overlay' && renderContent()}
                </div>
            </div>
            {textLayout === 'bottom' && renderContent()}
        </div>
    </div>
  );
};
