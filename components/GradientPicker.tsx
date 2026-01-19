
import React, { useState, useRef } from 'react';
import { GradientConfig, GradientStop } from '../types';
import { Trash2, Maximize, RotateCw, Circle, Box } from 'lucide-react';

interface GradientPickerProps {
    value?: GradientConfig;
    onChange: (value: GradientConfig) => void;
}

const DEFAULT_GRADIENT: GradientConfig = {
    type: 'linear',
    angle: 90,
    stops: [
        { id: '1', color: '#3b82f6', opacity: 1, position: 0 },
        { id: '2', color: '#06b6d4', opacity: 1, position: 100 }
    ]
};

export const GradientPicker: React.FC<GradientPickerProps> = ({ value, onChange }) => {
    const gradient = value || DEFAULT_GRADIENT;
    const [selectedStopId, setSelectedStopId] = useState<string | null>(null);
    const trackRef = useRef<HTMLDivElement>(null);

    // Generate CSS for the actual output/preview
    const generatePreviewCSS = (g: GradientConfig) => {
        const stopsStr = g.stops
            .sort((a, b) => a.position - b.position)
            .map(s => `${s.color} ${s.position}%`)
            .join(', ');

        if (g.type === 'radial') return `radial-gradient(circle at center, ${stopsStr})`;
        if (g.type === 'conic') return `conic-gradient(from ${g.angle}deg at 50% 50%, ${stopsStr})`;
        return `linear-gradient(${g.angle}deg, ${stopsStr})`;
    };

    const generateTrackCSS = (g: GradientConfig) => {
        const stopsStr = g.stops
            .sort((a, b) => a.position - b.position)
            .map(s => `${s.color} ${s.position}%`)
            .join(', ');
        return `linear-gradient(90deg, ${stopsStr})`;
    };

    const handleTrackClick = (e: React.MouseEvent | React.TouchEvent) => {
        if (!trackRef.current) return;
        const rect = trackRef.current.getBoundingClientRect();
        const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
        const percent = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
        
        const newStop: GradientStop = {
            id: `s-${Date.now()}`,
            color: '#ffffff',
            opacity: 1,
            position: Math.round(percent)
        };
        onChange({ ...gradient, stops: [...gradient.stops, newStop] });
        setSelectedStopId(newStop.id);
    };

    const updateStop = (id: string, updates: Partial<GradientStop>) => {
        onChange({ ...gradient, stops: gradient.stops.map(s => s.id === id ? { ...s, ...updates } : s) });
    };

    const removeStop = (id: string) => {
        if (gradient.stops.length <= 2) return;
        onChange({ ...gradient, stops: gradient.stops.filter(s => s.id !== id) });
        if (selectedStopId === id) setSelectedStopId(null);
    };

    const handleDragStart = (e: React.MouseEvent | React.TouchEvent, id: string) => {
        e.stopPropagation();
        setSelectedStopId(id);
        
        const moveHandler = (moveEvent: MouseEvent | TouchEvent) => {
            if (!trackRef.current) return;
            const rect = trackRef.current.getBoundingClientRect();
            const clientX = 'touches' in moveEvent ? moveEvent.touches[0].clientX : (moveEvent as MouseEvent).clientX;
            const percent = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
            updateStop(id, { position: Math.round(percent) });
        };

        const upHandler = () => {
            window.removeEventListener('mousemove', moveHandler);
            window.removeEventListener('touchmove', moveHandler);
            window.removeEventListener('mouseup', upHandler);
            window.removeEventListener('touchend', upHandler);
        };

        window.addEventListener('mousemove', moveHandler);
        window.addEventListener('touchmove', moveHandler);
        window.addEventListener('mouseup', upHandler);
        window.addEventListener('touchend', upHandler);
    };

    const selectedStop = gradient.stops.find(s => s.id === selectedStopId);

    return (
        <div className="space-y-4 p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 w-full max-w-full overflow-hidden">
            {/* Live Preview & Type Selector */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div 
                    className="w-full sm:w-20 h-12 sm:h-auto min-h-[3rem] rounded-xl shadow-inner border border-slate-200 dark:border-slate-700 shrink-0"
                    style={{ background: generatePreviewCSS(gradient) }}
                    title="Natija (Live Preview)"
                />
                
                <div className="flex-1 flex flex-col gap-2 min-w-0">
                    <div className="flex bg-slate-200 dark:bg-slate-800 p-1 rounded-lg">
                        <button onClick={() => onChange({ ...gradient, type: 'linear' })} className={`flex-1 flex items-center justify-center gap-1 py-1.5 px-1 rounded-md text-[10px] font-bold transition-all ${gradient.type === 'linear' ? 'bg-white dark:bg-slate-700 shadow text-primary' : 'text-slate-500'}`} title="Linear">
                            <Maximize className="h-3 w-3 rotate-45 shrink-0" />
                            <span className="hidden md:inline truncate">Linear</span>
                        </button>
                        <button onClick={() => onChange({ ...gradient, type: 'radial' })} className={`flex-1 flex items-center justify-center gap-1 py-1.5 px-1 rounded-md text-[10px] font-bold transition-all ${gradient.type === 'radial' ? 'bg-white dark:bg-slate-700 shadow text-primary' : 'text-slate-500'}`} title="Radial">
                            <Circle className="h-3 w-3 shrink-0" />
                            <span className="hidden md:inline truncate">Radial</span>
                        </button>
                        <button onClick={() => onChange({ ...gradient, type: 'conic' })} className={`flex-1 flex items-center justify-center gap-1 py-1.5 px-1 rounded-md text-[10px] font-bold transition-all ${gradient.type === 'conic' ? 'bg-white dark:bg-slate-700 shadow text-primary' : 'text-slate-500'}`} title="Conic">
                            <RotateCw className="h-3 w-3 shrink-0" />
                            <span className="hidden md:inline truncate">Conic</span>
                        </button>
                    </div>
                    {gradient.type !== 'radial' && (
                        <div className="flex items-center gap-2 px-1">
                            <span className="text-[10px] font-bold text-slate-400 whitespace-nowrap">Burchak</span>
                            <input type="range" min="0" max="360" value={gradient.angle} onChange={(e) => onChange({ ...gradient, angle: parseInt(e.target.value) })} className="flex-1 h-1.5 bg-slate-200 rounded-lg accent-primary" />
                            <span className="text-[10px] font-mono text-slate-500 w-8 text-right">{gradient.angle}°</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Gradient Track */}
            <div className="relative h-12 select-none group touch-none w-full">
                <div ref={trackRef} className="absolute top-4 left-2 right-2 h-4 rounded-full shadow-inner border border-slate-300 dark:border-slate-600 cursor-crosshair" style={{ background: generateTrackCSS(gradient) }} onClick={handleTrackClick} />
                {gradient.stops.map(stop => (
                    <div key={stop.id} className={`absolute top-2 w-8 h-8 -ml-4 rounded-full border-4 shadow-lg cursor-grab active:cursor-grabbing flex items-center justify-center transition-transform z-10 ${selectedStopId === stop.id ? 'border-primary scale-110 z-20' : 'border-white dark:border-slate-600'}`} style={{ left: `${stop.position}%`, backgroundColor: stop.color }} onMouseDown={(e) => handleDragStart(e, stop.id)} onTouchStart={(e) => handleDragStart(e, stop.id)}>
                       {selectedStopId === stop.id && <div className="w-2 h-2 bg-white rounded-full shadow-sm" />}
                    </div>
                ))}
            </div>

            {/* Selected Stop Details */}
            {selectedStop ? (
                <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 animate-slide-up space-y-3">
                    <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold text-slate-500 uppercase">Handle {selectedStopId}</span>
                        <button onClick={() => removeStop(selectedStop.id)} disabled={gradient.stops.length <= 2} className="text-red-500 disabled:opacity-30 p-1 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"><Trash2 className="h-4 w-4" /></button>
                    </div>
                    <div className="flex gap-3">
                        <div className="flex-1 min-w-0">
                            <label className="text-[9px] text-slate-400 block mb-1">Rang</label>
                            <div className="flex gap-2">
                                <input type="color" value={selectedStop.color} onChange={(e) => updateStop(selectedStop.id, { color: e.target.value })} className="w-8 h-8 rounded-lg cursor-pointer border-none p-0 bg-transparent shrink-0" />
                                <input type="text" value={selectedStop.color} onChange={(e) => updateStop(selectedStop.id, { color: e.target.value })} className="flex-1 text-xs px-2 rounded border border-slate-200 dark:border-slate-600 bg-transparent uppercase min-w-0 w-full" />
                            </div>
                        </div>
                        <div className="flex-1 min-w-0">
                            <label className="text-[9px] text-slate-400 block mb-1">Pozitsiya (%)</label>
                            <input type="number" min="0" max="100" value={selectedStop.position} onChange={(e) => updateStop(selectedStop.id, { position: parseInt(e.target.value) })} className="w-full h-8 px-2 text-xs rounded border border-slate-200 dark:border-slate-600 bg-transparent" />
                        </div>
                    </div>
                    <div>
                        <label className="text-[9px] text-slate-400 block mb-1">Shaffoflik (Opacity): {Math.round(selectedStop.opacity * 100)}%</label>
                        <input type="range" min="0" max="1" step="0.01" value={selectedStop.opacity} onChange={(e) => updateStop(selectedStop.id, { opacity: parseFloat(e.target.value) })} className="w-full h-2 bg-slate-200 rounded-lg accent-primary" />
                    </div>
                </div>
            ) : (
                <div className="text-center py-4 text-xs text-slate-400 italic">Dumaloq handle ustiga bosing</div>
            )}
        </div>
    );
};
