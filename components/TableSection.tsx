
import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { TableSectionConfig, TableRow, StyleConfig, GradientConfig, GradientStop } from '../types';
import { Settings, Plus, Trash2, X, Palette, AlignLeft, AlignCenter, AlignRight, Move } from 'lucide-react';

interface TableSectionProps {
    config?: TableSectionConfig;
    style?: StyleConfig;
    isEditing?: boolean;
    onUpdateConfig: (config: Partial<TableSectionConfig>) => void;
}

export const TableSection: React.FC<TableSectionProps> = ({ config, style, isEditing, onUpdateConfig }) => {
    const [showSettings, setShowSettings] = useState(false);
    const [settingsPos, setSettingsPos] = useState({ x: 20, y: 100 });
    const dragStartPos = React.useRef({ x: 0, y: 0 });
    const isDragging = React.useRef(false);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    React.useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Default Configuration
    const title = config?.title || "Jadval";
    const description = config?.description || "Ma'lumotlar";
    const headers = config?.headers || ["Ustun 1", "Ustun 2"];
    const rows = config?.rows || [{ id: 'r1', cells: ["A1", "B1"] }, { id: 'r2', cells: ["A2", "B2"] }];

    // Styling
    const variant = config?.variant || 'striped';
    const headerBgStart = config?.headerBgGradientStart || style?.primaryColor || '#0ea5e9';
    const headerBgEnd = config?.headerBgGradientEnd || style?.primaryColor || '#0ea5e9';
    const headerText = config?.headerTextColor || '#ffffff';
    const rowBg = config?.rowBgColor || '#ffffff';
    const rowText = config?.rowTextColor || '#334155';
    const borderColor = config?.borderColor || '#e2e8f0';
    const stripeColor = config?.stripeColor || 'rgba(0,0,0,0.02)';
    
    // Advanced Borders & Fonts
    const borderStyle = config?.borderStyle || 'solid';
    const borderWidth = config?.borderWidth ?? 1;
    const borderRadius = config?.borderRadius ?? 16;
    const borderGradientStart = config?.borderGradientStart;
    const borderGradientEnd = config?.borderGradientEnd;
    const fontFamily = config?.fontFamily || 'sans';
    const titleSize = config?.titleSize || 24;
    const titleColor = config?.titleColor;
    const titleAlign = config?.titleAlign || 'center';
    const descColor = config?.descColor;
    const headerFontSize = config?.headerFontSize || 14;
    const rowFontSize = config?.rowFontSize || 14;

    // Handlers
    const handleAddColumn = () => {
        const newHeaders = [...headers, "Yangi"];
        const newRows = rows.map(r => ({ ...r, cells: [...r.cells, ""] }));
        onUpdateConfig({ headers: newHeaders, rows: newRows });
    };
    const handleRemoveColumn = (index: number) => {
        if (headers.length <= 1) return;
        const newHeaders = headers.filter((_, i) => i !== index);
        const newRows = rows.map(r => ({ ...r, cells: r.cells.filter((_, i) => i !== index) }));
        onUpdateConfig({ headers: newHeaders, rows: newRows });
    };
    const handleAddRow = () => onUpdateConfig({ rows: [...rows, { id: `r-${Date.now()}`, cells: new Array(headers.length).fill("") }] });
    const handleRemoveRow = (id: string) => onUpdateConfig({ rows: rows.filter(r => r.id !== id) });
    const updateHeader = (index: number, value: string) => { const h = [...headers]; h[index] = value; onUpdateConfig({ headers: h }); };
    const updateCell = (rowId: string, idx: number, val: string) => { onUpdateConfig({ rows: rows.map(r => r.id === rowId ? { ...r, cells: r.cells.map((c, i) => i === idx ? val : c) } : r) }); };

    // Drag Logic
    const startDrag = (e: React.MouseEvent | React.TouchEvent) => {
        if (isMobile) return;
        isDragging.current = true;
        const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
        dragStartPos.current = { x: clientX - settingsPos.x, y: clientY - settingsPos.y }; 
    };
    
    React.useEffect(() => {
        const move = (e: MouseEvent | TouchEvent) => { 
            if(isDragging.current) {
                const clientX = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
                const clientY = 'touches' in e ? e.touches[0].clientY : (e as MouseEvent).clientY;
                setSettingsPos({ x: clientX - dragStartPos.current.x, y: clientY - dragStartPos.current.y }); 
            }
        };
        const stop = () => isDragging.current = false;
        if(showSettings) { window.addEventListener('mousemove', move); window.addEventListener('mouseup', stop); window.addEventListener('touchmove', move); window.addEventListener('touchend', stop); }
        return () => { window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', stop); window.removeEventListener('touchmove', move); window.removeEventListener('touchend', stop); }
    }, [showSettings]);

    const tableFontClass = fontFamily === 'serif' ? 'font-serif' : fontFamily === 'mono' ? 'font-mono' : 'font-sans';
    const hasOuterGradient = borderGradientStart && borderGradientEnd;

    return (
        <section className={`py-12 px-4 relative group/table ${isEditing ? 'border-y-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50' : 'bg-white dark:bg-slate-950'}`}>
            <div className="max-w-5xl mx-auto">
                {isEditing && (
                    <div className="absolute top-4 right-4 z-30">
                        <button onClick={() => setShowSettings(!showSettings)} className={`p-2 rounded-lg shadow-lg border transition-colors ${showSettings ? 'bg-primary text-white border-primary' : 'bg-white dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700'}`}>
                            <Settings className="h-5 w-5" />
                        </button>
                        {showSettings && createPortal(
                            <div 
                                className={`fixed z-[9999] bg-white dark:bg-slate-900 p-4 shadow-2xl border border-slate-200 dark:border-slate-800 animate-fade-in text-left flex flex-col ${isMobile ? 'bottom-0 left-0 right-0 rounded-t-2xl border-b-0' : 'rounded-xl w-80'}`}
                                style={isMobile ? { maxHeight: '85vh' } : { top: settingsPos.y, left: settingsPos.x, maxHeight: '60vh' }}
                            >
                                <div className={`flex justify-between items-center mb-3 border-b border-slate-100 dark:border-slate-800 pb-2 ${!isMobile ? 'cursor-move' : ''} touch-none`} onMouseDown={startDrag} onTouchStart={startDrag}>
                                    <span className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2 pointer-events-none"><Move className="h-3 w-3" /> Jadval Sozlamalari</span>
                                    <button onClick={() => setShowSettings(false)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded"><X className="h-4 w-4 text-slate-400" /></button>
                                </div>
                                <div className="space-y-4 overflow-y-auto custom-scrollbar pr-1 flex-1">
                                    <div><label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Variant</label><select value={variant} onChange={(e) => onUpdateConfig({ variant: e.target.value as any })} className="w-full text-xs p-2 rounded border bg-transparent"><option value="simple">Oddiy</option><option value="striped">Zebra (Striped)</option><option value="bordered">Katak (Bordered)</option></select></div>
                                    <div className="grid grid-cols-2 gap-2"><div><label className="text-[9px] text-slate-400 block">Shrift</label><select value={fontFamily} onChange={(e) => onUpdateConfig({ fontFamily: e.target.value as any })} className="w-full text-xs p-1 border rounded bg-transparent"><option value="sans">Sans</option><option value="serif">Serif</option><option value="mono">Mono</option></select></div><div><label className="text-[9px] text-slate-400 block">Border</label><select value={borderStyle} onChange={(e) => onUpdateConfig({ borderStyle: e.target.value as any })} className="w-full text-xs p-1 border rounded bg-transparent"><option value="solid">Solid</option><option value="dashed">Dashed</option><option value="dotted">Dotted</option></select></div></div>
                                    <div className="border-t border-slate-100 dark:border-slate-800 pt-2"><label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Ranglar</label><div className="grid grid-cols-2 gap-2"><div><label className="text-[9px] text-slate-400">Header Bg</label><div className="flex gap-1"><input type="color" value={headerBgStart} onChange={(e) => onUpdateConfig({ headerBgGradientStart: e.target.value })} className="w-full h-5 rounded cursor-pointer" /><input type="color" value={headerBgEnd} onChange={(e) => onUpdateConfig({ headerBgGradientEnd: e.target.value })} className="w-full h-5 rounded cursor-pointer" /></div></div><div><label className="text-[9px] text-slate-400">Header Text</label><input type="color" value={headerText} onChange={(e) => onUpdateConfig({ headerTextColor: e.target.value })} className="w-full h-5 rounded cursor-pointer" /></div></div><div className="grid grid-cols-2 gap-2 mt-2"><div><label className="text-[9px] text-slate-400">Row Bg</label><input type="color" value={rowBg} onChange={(e) => onUpdateConfig({ rowBgColor: e.target.value })} className="w-full h-5 rounded cursor-pointer" /></div><div><label className="text-[9px] text-slate-400">Row Text</label><input type="color" value={rowText} onChange={(e) => onUpdateConfig({ rowTextColor: e.target.value })} className="w-full h-5 rounded cursor-pointer" /></div></div></div>
                                    <div className="border-t border-slate-100 dark:border-slate-800 pt-2"><button onClick={handleAddColumn} className="w-full py-2 bg-slate-100 dark:bg-slate-800 text-xs font-bold rounded hover:bg-slate-200 dark:hover:bg-slate-700 mb-2">Ustun Qo'shish</button><button onClick={handleAddRow} className="w-full py-2 bg-slate-100 dark:bg-slate-800 text-xs font-bold rounded hover:bg-slate-200 dark:hover:bg-slate-700">Qator Qo'shish</button></div>
                                </div>
                            </div>,
                            document.body
                        )}
                    </div>
                )}

                <div className="text-center mb-8" style={{ textAlign: titleAlign as any }}>
                    {isEditing ? <input value={title} onChange={(e) => onUpdateConfig({ title: e.target.value })} className="text-3xl font-bold bg-transparent border-b border-dashed border-slate-300 w-full text-center outline-none mb-2" style={{ color: titleColor, fontSize: `${titleSize}px` }} /> : <h2 className="text-3xl font-bold mb-2" style={{ color: titleColor, fontSize: `${titleSize}px`, fontFamily: `var(--font-${fontFamily})` }}>{title}</h2>}
                    {isEditing ? <textarea value={description} onChange={(e) => onUpdateConfig({ description: e.target.value })} className="w-full text-center bg-transparent border-b border-dashed border-slate-300 outline-none text-slate-500 resize-none" style={{ color: descColor }} /> : <p className="text-slate-500 dark:text-slate-400" style={{ color: descColor }}>{description}</p>}
                </div>

                <div className={`overflow-x-auto rounded-[${borderRadius}px] shadow-lg ${hasOuterGradient ? 'p-[1px]' : ''}`} style={{ background: hasOuterGradient ? `linear-gradient(135deg, ${borderGradientStart}, ${borderGradientEnd})` : undefined, borderRadius: `${borderRadius}px` }}>
                    <table className={`w-full text-left border-collapse ${tableFontClass}`} style={{ borderRadius: `${borderRadius}px`, overflow: 'hidden' }}>
                        <thead>
                            <tr style={{ background: `linear-gradient(90deg, ${headerBgStart}, ${headerBgEnd})`, color: headerText }}>
                                {headers.map((h, i) => (
                                    <th key={i} className="p-4 font-bold border-b border-white/10 relative group" style={{ fontSize: `${headerFontSize}px` }}>
                                        {isEditing ? <div className="flex items-center gap-1"><input value={h} onChange={(e) => updateHeader(i, e.target.value)} className="bg-transparent outline-none w-full placeholder-white/50" /><button onClick={() => handleRemoveColumn(i)} className="opacity-0 group-hover:opacity-100 text-white/70 hover:text-white"><X className="h-3 w-3" /></button></div> : h}
                                    </th>
                                ))}
                                {isEditing && <th className="w-10"></th>}
                            </tr>
                        </thead>
                        <tbody style={{ backgroundColor: rowBg, color: rowText }}>
                            {rows.map((row, rIdx) => (
                                <tr key={row.id} className={`${variant === 'striped' && rIdx % 2 !== 0 ? 'bg-black/5 dark:bg-white/5' : ''} hover:bg-black/5 dark:hover:bg-white/5 transition-colors`} style={{ backgroundColor: variant === 'striped' && rIdx % 2 !== 0 ? stripeColor : undefined }}>
                                    {row.cells.map((cell, cIdx) => (
                                        <td key={cIdx} className={`p-4 ${variant === 'bordered' ? 'border' : 'border-b'} border-slate-200 dark:border-slate-800`} style={{ borderColor: borderColor, borderStyle: borderStyle, borderWidth: `${borderWidth}px`, fontSize: `${rowFontSize}px` }}>
                                            {isEditing ? <input value={cell} onChange={(e) => updateCell(row.id, cIdx, e.target.value)} className="w-full bg-transparent outline-none" /> : cell}
                                        </td>
                                    ))}
                                    {isEditing && <td className="p-2 text-center border-b border-slate-200 dark:border-slate-800"><button onClick={() => handleRemoveRow(row.id)} className="text-red-400 hover:text-red-600"><Trash2 className="h-4 w-4" /></button></td>}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </section>
    );
};
