
import React, { useState, useRef, useEffect } from 'react';
import { Plus, Check, ListPlus, Image as ImageIcon, Sparkles, DollarSign, Tag, Info, X, Upload, AlertTriangle, FileUp } from 'lucide-react';
import { Treatment, Category } from '../types';
import { uploadToSupabase, base64ToBlob } from '../services/supabase';

interface ProductEntryProps {
  image: string;
  categories: Category[];
  onSave: (data: Omit<Treatment, 'id'> & { imageUrl: string, images: string[] }) => void;
}

// Helper to compress image
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
                    resolve(canvas.toDataURL(outputType, 0.8)); 
                } else {
                    resolve(event.target?.result as string); 
                }
            };
            img.onerror = () => resolve(event.target?.result as string);
            img.src = event.target?.result as string;
        };
        reader.readAsDataURL(file);
    });
};

export const ProductEntry: React.FC<ProductEntryProps> = ({ image, categories, onSave }) => {
  const [name, setName] = useState('');
  const [price, setPrice] = useState<string>('');
  const [currency, setCurrency] = useState<'UZS' | 'USD'>('UZS');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [added, setAdded] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  
  // Image Management
  const [images, setImages] = useState<string[]>([image]);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
      setImages([image]);
      setPreviewIndex(0);
  }, [image]);

  const processFiles = async (files: FileList | null) => {
      if (files && files.length > 0) {
          setIsProcessing(true);
          const newImages: string[] = [];
          
          try {
              for (let i = 0; i < files.length; i++) {
                  const base64 = await compressImage(files[i]);
                  newImages.push(base64);
              }
              setImages(prev => [...prev, ...newImages]);
          } catch (err) {
              console.error("Image processing error", err);
          } finally {
              setIsProcessing(false);
          }
      }
  };

  const handleAddImage = (e: React.ChangeEvent<HTMLInputElement>) => {
      processFiles(e.target.files);
      if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDragOver = (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      processFiles(e.dataTransfer.files);
  };

  const handleRemoveImage = (index: number) => {
      if (images.length <= 1) {
          alert("Kamida bitta rasm bo'lishi kerak.");
          return;
      }
      const newImages = images.filter((_, i) => i !== index);
      setImages(newImages);
      setPreviewIndex(0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !price) return;

    setIsProcessing(true);
    setUploadError(null);

    try {
        const finalUrls: string[] = [];
        
        for (const img of images) {
            if (img.startsWith('data:')) {
                // Try upload to Supabase
                const blob = base64ToBlob(img);
                const url = await uploadToSupabase(blob);
                
                if (url) {
                    finalUrls.push(url);
                } else {
                    // Fallback to base64 ONLY if upload fails
                    // This is a safety measure, but we warn the user
                    console.warn("Supabase upload failed, using Base64 fallback.");
                    if (img.length > 900000) {
                        // Warn but still try, database might reject if too huge
                        console.warn("Image is large for database storage.");
                    }
                    finalUrls.push(img);
                }
            } else if (img.startsWith('http')) {
                finalUrls.push(img);
            }
        }

        if (finalUrls.length === 0) {
             setUploadError("Rasm yuklashda xatolik.");
             setIsProcessing(false);
             return;
        }

        onSave({
          name,
          price: Number(price),
          currency,
          category: categoryId,
          condition: 'new',
          description: description.trim(), 
          recommended: false,
          imageUrl: finalUrls[0], 
          images: finalUrls
        });
        
        setAdded(true);
        setName('');
        setPrice('');
        setCurrency('UZS');
        setCategoryId('');
        setDescription('');
        setImages([image]); // Reset to initial
        
        setTimeout(() => {
            setAdded(false);
        }, 2000);
    } catch (err: any) {
        console.error("Save error details:", err);
        setUploadError("Saqlashda xatolik yuz berdi. Internetni tekshiring.");
    } finally {
        setIsProcessing(false);
    }
  };

  const currentMedia = images[previewIndex] || images[0];
  const getRenderSrc = (imgStr: string) => {
      if (!imgStr) return '';
      if (imgStr.startsWith('data:') || imgStr.startsWith('http')) return imgStr;
      const mime = imgStr.startsWith('iVBOR') ? 'image/png' : 'image/jpeg';
      return `data:${mime};base64,${imgStr}`;
  };

  const renderSrc = getRenderSrc(currentMedia);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-xl shadow-slate-200/50 dark:shadow-black/30 border border-slate-100 dark:border-slate-800 overflow-hidden flex flex-col md:flex-row animate-fade-in ring-1 ring-slate-900/5 transition-colors">
        {/* Media Side (Drop Zone) */}
        <div 
            className={`md:w-5/12 bg-slate-100 dark:bg-slate-800 relative min-h-[300px] md:min-h-full group flex flex-col transition-all duration-300 ${isDragging ? 'bg-blue-50 dark:bg-blue-900/20 border-2 border-dashed border-primary ring-4 ring-primary/10' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            {isDragging && (
                <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm animate-fade-in pointer-events-none">
                    <div className="bg-primary/10 p-6 rounded-full mb-4 animate-bounce">
                        <FileUp className="h-10 w-10 text-primary" />
                    </div>
                    <h3 className="text-xl font-bold text-primary">Fayllarni shu yerga tashlang</h3>
                    <p className="text-sm text-slate-500">Rasmlarni yuklash uchun qo'yib yuboring</p>
                </div>
            )}

            <div className="relative flex-1 overflow-hidden flex items-center justify-center bg-black/5 dark:bg-black/20">
                <img 
                    src={renderSrc} 
                    alt="Preview" 
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                />
                
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent flex flex-col justify-end p-8 pointer-events-none">
                    <div className="bg-white/20 backdrop-blur-md border border-white/20 rounded-2xl p-4 text-white">
                    <div className="flex items-center gap-2 mb-1">
                        <ImageIcon className="h-4 w-4 text-sky-300" />
                        <span className="text-xs font-bold uppercase tracking-wider text-sky-200">Mahsulot Rasmi</span>
                    </div>
                    <p className="text-sm opacity-90">Rasmlarni drag & drop orqali yuklashingiz mumkin.</p>
                    </div>
                </div>
            </div>
            
            {/* Thumbnails */}
            <div className="bg-white dark:bg-slate-900 p-4 border-t border-slate-200 dark:border-slate-700 z-10 relative">
                <div className="flex justify-between items-center mb-2">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Rasmlar ({images.length})</p>
                    {isProcessing && <span className="text-xs text-primary animate-pulse">Yuklanmoqda...</span>}
                </div>
                <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                    {images.map((img, idx) => {
                        const thumbSrc = getRenderSrc(img);
                        return (
                            <div 
                                key={idx} 
                                onClick={() => setPreviewIndex(idx)}
                                className={`relative flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden cursor-pointer border-2 transition-all ${idx === previewIndex ? 'border-primary ring-2 ring-primary/20' : 'border-slate-200 dark:border-slate-700 opacity-60 hover:opacity-100'}`}
                            >
                                <img src={thumbSrc} className="w-full h-full object-cover" alt="" />
                                <button 
                                    onClick={(e) => { e.stopPropagation(); handleRemoveImage(idx); }}
                                    className="absolute top-0 right-0 bg-red-500 text-white p-0.5 rounded-bl-lg opacity-0 hover:opacity-100 group-hover:opacity-100 transition-opacity"
                                >
                                    <X className="h-3 w-3" />
                                </button>
                            </div>
                        );
                    })}
                    <button 
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isProcessing}
                        className="flex-shrink-0 w-16 h-16 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-600 hover:border-primary hover:text-primary text-slate-400 flex flex-col items-center justify-center transition-colors bg-slate-50 dark:bg-slate-800 disabled:opacity-50"
                    >
                        <Plus className="h-5 w-5" />
                        <span className="text-[10px] font-bold">Qo'shish</span>
                    </button>
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        className="hidden" 
                        accept="image/png, image/jpeg, image/webp" 
                        multiple
                        onChange={handleAddImage} 
                    />
                </div>
            </div>
        </div>

        {/* Form Side */}
        <div className="flex-1 p-6 sm:p-8 lg:p-10">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span className="bg-primary/10 dark:bg-primary/20 p-2 rounded-xl text-primary">
                  <Sparkles className="h-6 w-6" />
                </span>
                Mahsulot Yaratish
              </h2>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 ml-1">
                        Mahsulot Nomi
                    </label>
                    <input 
                        type="text" 
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Masalan: Tish oqartirish Premium"
                        className="w-full px-5 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:bg-white dark:focus:bg-slate-900 focus:ring-4 focus:ring-primary/10 focus:border-primary focus:outline-none transition-all font-semibold text-slate-900 dark:text-white placeholder:text-slate-400"
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 ml-1">
                          Narxi
                      </label>
                      <input 
                          type="number" 
                          step="0.01"
                          required
                          value={price}
                          onChange={(e) => setPrice(e.target.value)}
                          placeholder="0"
                          className="w-full px-5 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:bg-white dark:focus:bg-slate-900 focus:ring-4 focus:ring-primary/10 focus:border-primary focus:outline-none transition-all font-mono font-bold text-lg text-slate-900 dark:text-white placeholder:text-slate-400"
                      />
                  </div>
                  <div>
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 ml-1">
                          Valyuta
                      </label>
                      <div className="relative">
                        <select
                          value={currency}
                          onChange={(e) => setCurrency(e.target.value as 'UZS' | 'USD')}
                          className="w-full px-5 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:bg-white dark:focus:bg-slate-900 focus:ring-4 focus:ring-primary/10 focus:border-primary focus:outline-none transition-all font-bold text-slate-900 dark:text-white appearance-none"
                        >
                          <option value="UZS">So'm (UZS)</option>
                          <option value="USD">Dollar (USD)</option>
                        </select>
                        <DollarSign className="absolute right-5 top-4.5 h-5 w-5 text-slate-400 pointer-events-none" />
                      </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 ml-1">
                            Kategoriya
                        </label>
                        <div className="relative">
                            <select
                                value={categoryId}
                                onChange={(e) => setCategoryId(e.target.value)}
                                className="w-full px-5 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:bg-white dark:focus:bg-slate-900 focus:ring-4 focus:ring-primary/10 focus:border-primary focus:outline-none transition-all text-slate-900 dark:text-white appearance-none"
                            >
                                <option value="">Kategoriyasiz</option>
                                {categories.map(cat => (
                                    <option key={cat.id} value={cat.name}>{cat.name}</option>
                                ))}
                            </select>
                            <Tag className="absolute right-5 top-4.5 h-5 w-5 text-slate-400 pointer-events-none" />
                        </div>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 ml-1">
                        Tavsif <span className="text-slate-400 font-normal text-xs">(ixtiyoriy)</span>
                    </label>
                    <textarea 
                        rows={3}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Mijozlar uchun qisqacha ma'lumot..."
                        className="w-full px-5 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:bg-white dark:focus:bg-slate-900 focus:ring-4 focus:ring-primary/10 focus:border-primary focus:outline-none transition-all resize-none text-slate-600 dark:text-slate-300"
                    />
                </div>

                {uploadError && (
                    <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl text-sm flex items-center gap-2 animate-fade-in">
                        <AlertTriangle className="h-4 w-4 shrink-0" /> 
                        <span>{uploadError}</span>
                    </div>
                )}

                <div className="pt-4">
                    <button
                        type="submit"
                        disabled={added || isProcessing}
                        className={`w-full flex items-center justify-center gap-2 py-4.5 rounded-2xl font-bold text-lg transition-all transform active:scale-[0.99] ${
                            added 
                            ? 'bg-emerald-500 text-white shadow-xl shadow-emerald-500/25 ring-2 ring-emerald-500 ring-offset-2' 
                            : 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xl shadow-slate-900/20 hover:bg-slate-800 dark:hover:bg-slate-100 ring-2 ring-transparent ring-offset-2 hover:ring-slate-900 dark:hover:ring-slate-100'
                        } ${isProcessing ? 'opacity-70 cursor-not-allowed' : ''}`}
                    >
                        {isProcessing ? 'Yuklanmoqda...' : added ? (
                            <>
                                <Check className="w-6 h-6" /> Saqlandi
                            </>
                        ) : (
                            <>
                                <ListPlus className="w-6 h-6" /> Ro'yxatga Qo'shish
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    </div>
  );
};
