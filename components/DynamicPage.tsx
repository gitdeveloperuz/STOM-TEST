
import React, { useState } from 'react';
import { Page, PageSection, SiteConfig, StyleConfig, SectionType } from '../types';
import { HeroSection } from './HeroSection';
import { AdBanner } from './AdBanner';
import { FeatureSection } from './FeatureSection';
import { ImageDiffSection } from './ImageDiffSection';
import { FaqSection } from './FaqSection';
import { TestimonialsSection } from './TestimonialsSection';
import { TableSection } from './TableSection';
import { Trash2, Plus, GripVertical, MoveUp, MoveDown, Layout, Image as ImageIcon, MessageSquare, SplitSquareHorizontal, Megaphone, UserCheck, Table as TableIcon, LayoutGrid } from 'lucide-react';

interface DynamicPageProps {
    page: Page;
    style?: StyleConfig;
    isEditing?: boolean;
    onUpdatePage: (updatedPage: Page) => void;
    onDeletePage?: (id: string) => void;
}

export const DynamicPage: React.FC<DynamicPageProps> = ({ page, style, isEditing, onUpdatePage, onDeletePage }) => {
    const [isAddingSection, setIsAddingSection] = useState(false);

    // Section CRUD
    const handleAddSection = (type: SectionType) => {
        const newSection: PageSection = {
            id: `sec-${Date.now()}`,
            type,
            data: {} // Init empty
        };
        
        // Initialize basic defaults based on type
        if (type === 'hero') {
            newSection.data.heroConfig = {
                id: `hero-${Date.now()}`,
                headline: 'Yangi Sahifa',
                subheadline: 'Bu yerda sarlavha osti matni bo\'ladi',
                gradientStart: '#38bdf8',
                gradientEnd: '#34d399',
                subheadlineFont: "'Inter', sans-serif"
            } as SiteConfig;
        } else if (type === 'features') {
            newSection.data.featureCards = [
                { id: `fc-${Date.now()}`, title: 'Yangi Karta', description: 'Tavsif...', linkText: 'Batafsil' }
            ];
            newSection.data.featureSectionConfig = {
                layoutMode: 'carousel',
                cardsGap: 24,
                paddingY: 32
            };
        } else if (type === 'faq') {
            newSection.data.faqTitle = "Savollar";
            newSection.data.faqItems = [{ id: `faq-${Date.now()}`, question: 'Savol?', answer: 'Javob', isVisible: true }];
        } else if (type === 'table') {
            newSection.data.tableConfig = {
                title: "Yangi Jadval",
                headers: ["Xizmat Nomi", "Narxi"],
                rows: [{ id: `r-${Date.now()}`, cells: ["Masalan: Konsultatsiya", "Bepul"] }],
                variant: 'striped'
            };
        } else if (type === 'diff') {
            newSection.data.diffConfig = { 
                isVisible: true, 
                title: 'Oldin va Keyin', 
                subtitle: 'Natijalar',
                bgColor: '#ffffff'
            };
            newSection.data.diffItems = [{ id: `diff-${Date.now()}`, beforeImage: '', afterImage: '', label: 'Yangi Natija' }];
        } else if (type === 'testimonials') {
            newSection.data.testimonials = [{ id: `t-${Date.now()}`, name: 'Ism', text: 'Fikr matni...', rating: 5 }];
            newSection.data.testimonialsTitle = "Mijozlar fikri";
        }

        const updatedPage = { ...page, sections: [...page.sections, newSection] };
        onUpdatePage(updatedPage);
        setIsAddingSection(false);
    };

    const handleUpdateSection = (sectionId: string, updates: Partial<PageSection['data']>) => {
        const updatedSections = page.sections.map(s => 
            s.id === sectionId ? { ...s, data: { ...s.data, ...updates } } : s
        );
        onUpdatePage({ ...page, sections: updatedSections });
    };

    const handleDeleteSection = (sectionId: string) => {
        const updatedSections = page.sections.filter(s => s.id !== sectionId);
        onUpdatePage({ ...page, sections: updatedSections });
    };

    const handleMoveSection = (index: number, direction: 'up' | 'down') => {
        const newSections = [...page.sections];
        if (direction === 'up' && index > 0) {
            [newSections[index], newSections[index - 1]] = [newSections[index - 1], newSections[index]];
        } else if (direction === 'down' && index < newSections.length - 1) {
            [newSections[index], newSections[index + 1]] = [newSections[index + 1], newSections[index]];
        }
        onUpdatePage({ ...page, sections: newSections });
    };

    // Render logic for specific sections
    const renderSection = (section: PageSection) => {
        const commonProps = { style, isEditing };

        switch (section.type) {
            case 'hero':
                return (
                    <HeroSection
                        {...commonProps}
                        config={(section.data.heroConfig as SiteConfig) || {
                            id: 'hero-default',
                            headline: "Sarlavha",
                            subheadline: "Matn",
                            gradientStart: "#3b82f6",
                            gradientEnd: "#8b5cf6",
                            subheadlineFont: "'Inter', sans-serif"
                        }}
                        onUpdateConfig={(updates) => handleUpdateSection(section.id, { heroConfig: { ...section.data.heroConfig, ...updates } as SiteConfig })}
                        onMediaUpdate={(media) => handleUpdateSection(section.id, { heroConfig: { ...section.data.heroConfig, heroMedia: media } as SiteConfig })}
                        onImageSelected={() => {}}
                        isAdmin={!!isEditing}
                        onAdminLoginClick={() => {}}
                    />
                );
            case 'features':
                return (
                    <FeatureSection
                        {...commonProps}
                        cards={section.data.featureCards || []}
                        config={section.data.featureSectionConfig}
                        onConfigUpdate={(conf) => handleUpdateSection(section.id, { featureSectionConfig: { ...section.data.featureSectionConfig, ...conf } })}
                        onCardUpdate={(id, field, val) => {
                            const newCards = section.data.featureCards?.map(c => c.id === id ? { ...c, [field]: val } : c);
                            handleUpdateSection(section.id, { featureCards: newCards });
                        }}
                        onCardAdd={() => {
                            const newCard = { id: `fc-${Date.now()}`, title: 'Yangi', description: '...' };
                            handleUpdateSection(section.id, { featureCards: [...(section.data.featureCards || []), newCard] });
                        }}
                        onCardDelete={(id) => {
                            const newCards = section.data.featureCards?.filter(c => c.id !== id);
                            handleUpdateSection(section.id, { featureCards: newCards });
                        }}
                        onCardDuplicate={(id) => {
                            const card = section.data.featureCards?.find(c => c.id === id);
                            if (card) {
                                // Deep copy
                                const newCard = JSON.parse(JSON.stringify(card));
                                newCard.id = `fc-${Date.now()}`;
                                newCard.title = `${card.title} (Nusxa)`;
                                
                                // Regenerate IDs
                                if (newCard.cardButtons) {
                                    newCard.cardButtons = newCard.cardButtons.map((b: any) => ({...b, id: `cb-${Date.now()}-${Math.random()}`}));
                                }
                                if (newCard.modalBlocks) {
                                    newCard.modalBlocks = newCard.modalBlocks.map((b: any) => ({
                                        ...b,
                                        id: `mb-${Date.now()}-${Math.random()}`,
                                        buttons: b.buttons?.map((btn: any) => ({...btn, id: `btn-${Date.now()}-${Math.random()}`})),
                                        tableRows: b.tableRows?.map((row: any) => ({...row, id: `tr-${Date.now()}-${Math.random()}`}))
                                    }));
                                }

                                const newCards = [...(section.data.featureCards || [])];
                                const index = newCards.findIndex(c => c.id === id);
                                newCards.splice(index + 1, 0, newCard);
                                handleUpdateSection(section.id, { featureCards: newCards });
                            }
                        }}
                        onCardReorder={(dragIndex, dropIndex) => {
                            const newCards = [...(section.data.featureCards || [])];
                            const [item] = newCards.splice(dragIndex, 1);
                            newCards.splice(dropIndex, 0, item);
                            handleUpdateSection(section.id, { featureCards: newCards });
                        }}
                    />
                );
            case 'banner':
                return (
                    <AdBanner
                        {...commonProps}
                        ads={section.data.ads || []}
                        config={section.data.adConfig}
                        onAdAdd={(ad) => handleUpdateSection(section.id, { ads: [...(section.data.ads || []), ad] })}
                        onAdUpdate={(ad) => handleUpdateSection(section.id, { ads: section.data.ads?.map(a => a.id === ad.id ? { ...a, ...ad } : a) })}
                        onAdDelete={(id) => handleUpdateSection(section.id, { ads: section.data.ads?.filter(a => a.id !== id) })}
                        onConfigUpdate={(conf) => handleUpdateSection(section.id, { adConfig: { ...section.data.adConfig, ...conf } })}
                    />
                );
            case 'diff':
                return (
                    <ImageDiffSection
                        {...commonProps}
                        items={section.data.diffItems || []}
                        config={section.data.diffConfig}
                        onUpdateConfig={(conf) => handleUpdateSection(section.id, { diffConfig: { ...section.data.diffConfig, ...conf } })}
                        onAddItem={() => {
                            const newItem = { id: `diff-${Date.now()}`, beforeImage: '', afterImage: '', label: 'Yangi Natija' };
                            handleUpdateSection(section.id, { diffItems: [...(section.data.diffItems || []), newItem] });
                        }}
                        onDeleteItem={(id) => handleUpdateSection(section.id, { diffItems: section.data.diffItems?.filter(i => i.id !== id) })}
                        onUpdateItem={(id, updates) => handleUpdateSection(section.id, { diffItems: section.data.diffItems?.map(i => i.id === id ? { ...i, ...updates } : i) })}
                        onDuplicateItem={(id) => {
                            const item = section.data.diffItems?.find(i => i.id === id);
                            if (item) {
                                // Deep copy
                                const newItem = JSON.parse(JSON.stringify(item));
                                newItem.id = `diff-${Date.now()}`;
                                // Regenerate IDs for buttons if present
                                if(newItem.buttons) newItem.buttons = newItem.buttons.map((b: any) => ({...b, id: `btn-${Date.now()}-${Math.random()}`}));
                                
                                const items = [...(section.data.diffItems || [])];
                                const index = items.findIndex(i => i.id === id);
                                items.splice(index + 1, 0, newItem);
                                handleUpdateSection(section.id, { diffItems: items });
                            }
                        }}
                    />
                );
            case 'faq':
                return (
                    <FaqSection
                        {...commonProps}
                        items={section.data.faqItems || []}
                        title={section.data.faqTitle}
                        subtitle={section.data.faqSubtitle}
                        config={section.data.faqConfig}
                        onUpdateTitle={(val) => handleUpdateSection(section.id, { faqTitle: val })}
                        onUpdateSubtitle={(val) => handleUpdateSection(section.id, { faqSubtitle: val })}
                        onUpdateConfig={(conf) => handleUpdateSection(section.id, { faqConfig: { ...section.data.faqConfig, ...conf } })}
                        onAddItem={() => handleUpdateSection(section.id, { faqItems: [...(section.data.faqItems || []), { id: `f-${Date.now()}`, question: '?', answer: '...', isVisible: true }] })}
                        onDeleteItem={(id) => handleUpdateSection(section.id, { faqItems: section.data.faqItems?.filter(i => i.id !== id) })}
                        onUpdateItem={(id, field, val) => handleUpdateSection(section.id, { faqItems: section.data.faqItems?.map(i => i.id === id ? { ...i, [field]: val } : i) })}
                    />
                );
            case 'testimonials':
                return (
                    <TestimonialsSection
                        {...commonProps}
                        items={section.data.testimonials || []}
                        title={section.data.testimonialsTitle}
                        subtitle={section.data.testimonialsSubtitle}
                        config={section.data.testimonialsConfig}
                        onUpdateConfig={(conf) => handleUpdateSection(section.id, { ...conf, testimonialsConfig: { ...section.data.testimonialsConfig, ...conf } })}
                        onAddItem={() => handleUpdateSection(section.id, { testimonials: [...(section.data.testimonials || []), { id: `t-${Date.now()}`, name: 'Name', text: 'Text', rating: 5 }] })}
                        onDeleteItem={(id) => handleUpdateSection(section.id, { testimonials: section.data.testimonials?.filter(t => t.id !== id) })}
                        onUpdateItem={(id, field, val) => handleUpdateSection(section.id, { testimonials: section.data.testimonials?.map(t => t.id === id ? { ...t, [field]: val } : t) })}
                        onDuplicateItem={(id) => {
                            const item = section.data.testimonials?.find(t => t.id === id);
                            if(item) handleUpdateSection(section.id, { testimonials: [...(section.data.testimonials || []), { ...item, id: `t-${Date.now()}` }] });
                        }}
                        onReorder={(d, o) => {
                            const items = [...(section.data.testimonials || [])];
                            const [moved] = items.splice(d, 1);
                            items.splice(o, 0, moved);
                            handleUpdateSection(section.id, { testimonials: items });
                        }}
                    />
                );
            case 'table':
                return (
                    <TableSection 
                        {...commonProps}
                        config={section.data.tableConfig}
                        onUpdateConfig={(conf) => handleUpdateSection(section.id, { tableConfig: { ...section.data.tableConfig, ...conf } })}
                    />
                );
            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen pb-20">
            {/* Page Header (Admin Only) */}
            {isEditing && (
                <div className="bg-slate-900 text-white p-4 sticky top-[72px] z-40 flex justify-between items-center shadow-md">
                    <div>
                        <span className="text-xs uppercase text-slate-400 font-bold">Sahifa:</span>
                        <h1 className="text-xl font-bold">{page.title}</h1>
                    </div>
                    <div className="flex gap-2">
                        <button 
                            onClick={() => onDeletePage && onDeletePage(page.id)}
                            className="bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1"
                        >
                            <Trash2 className="h-3 w-3" /> O'chirish
                        </button>
                    </div>
                </div>
            )}

            {/* Sections */}
            <div className="space-y-0">
                {page.sections.map((section, index) => (
                    <div key={section.id} className="relative group/wrapper">
                        {renderSection(section)}
                        
                        {/* Section Controls - Ensuring Clickability with Pointer Events and Z-Index */}
                        {isEditing && (
                            <div className="absolute top-2 left-1/2 -translate-x-1/2 z-[100] flex gap-1 opacity-0 group-hover/wrapper:opacity-100 transition-opacity pointer-events-auto">
                                <div className="bg-slate-900 text-white p-1.5 rounded-lg shadow-xl flex items-center gap-2 border border-slate-700 select-none">
                                    <div className="flex items-center gap-2 border-r border-slate-700 pr-2 mr-1 cursor-grab active:cursor-grabbing">
                                        <GripVertical className="h-4 w-4 text-slate-500" />
                                        <span className="text-[10px] uppercase font-bold text-slate-300">{section.type}</span>
                                    </div>
                                    <button onClick={(e) => { e.stopPropagation(); handleMoveSection(index, 'up'); }} disabled={index === 0} className="p-1 hover:bg-white/20 rounded disabled:opacity-30 transition-colors" title="Yuqoriga"><MoveUp className="h-4 w-4" /></button>
                                    <button onClick={(e) => { e.stopPropagation(); handleMoveSection(index, 'down'); }} disabled={index === page.sections.length - 1} className="p-1 hover:bg-white/20 rounded disabled:opacity-30 transition-colors" title="Pastga"><MoveDown className="h-4 w-4" /></button>
                                    <div className="w-px h-4 bg-slate-700 mx-1"></div>
                                    <button 
                                        onMouseDown={(e) => e.stopPropagation()}
                                        onClick={(e) => { e.stopPropagation(); e.preventDefault(); handleDeleteSection(section.id); }} 
                                        className="p-1 hover:bg-red-500 rounded text-red-400 hover:text-white transition-colors cursor-pointer"
                                        title="O'chirish"
                                    >
                                        <Trash2 className="h-4 w-4 pointer-events-none" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Empty State / Add Section */}
            {isEditing && (
                <div className="py-12 px-4 flex flex-col items-center justify-center">
                    {!isAddingSection ? (
                        <button 
                            onClick={() => setIsAddingSection(true)}
                            className="flex flex-col items-center gap-2 text-slate-400 hover:text-primary transition-colors p-8 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-3xl hover:border-primary w-full max-w-2xl"
                        >
                            <Plus className="h-10 w-10" />
                            <span className="font-bold">Yangi Bo'lim Qo'shish</span>
                        </button>
                    ) : (
                        <div className="w-full max-w-4xl bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 animate-slide-up">
                            <h3 className="text-center font-bold text-slate-900 dark:text-white mb-6">Bo'lim Turini Tanlang</h3>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                <button onClick={() => handleAddSection('hero')} className="flex flex-col items-center gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 hover:bg-primary/10 hover:text-primary transition-colors group">
                                    <div className="p-3 bg-white dark:bg-slate-700 rounded-xl shadow-sm group-hover:scale-110 transition-transform"><Layout className="h-6 w-6" /></div>
                                    <span className="text-xs font-bold">Hero (Banner)</span>
                                </button>
                                <button onClick={() => handleAddSection('features')} className="flex flex-col items-center gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 hover:bg-primary/10 hover:text-primary transition-colors group">
                                    <div className="p-3 bg-white dark:bg-slate-700 rounded-xl shadow-sm group-hover:scale-110 transition-transform"><LayoutGrid className="h-6 w-6" /></div>
                                    <span className="text-xs font-bold">Features (Grid)</span>
                                </button>
                                <button onClick={() => handleAddSection('banner')} className="flex flex-col items-center gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 hover:bg-primary/10 hover:text-primary transition-colors group">
                                    <div className="p-3 bg-white dark:bg-slate-700 rounded-xl shadow-sm group-hover:scale-110 transition-transform"><Megaphone className="h-6 w-6" /></div>
                                    <span className="text-xs font-bold">Reklama Banner</span>
                                </button>
                                <button onClick={() => handleAddSection('diff')} className="flex flex-col items-center gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 hover:bg-primary/10 hover:text-primary transition-colors group">
                                    <div className="p-3 bg-white dark:bg-slate-700 rounded-xl shadow-sm group-hover:scale-110 transition-transform"><SplitSquareHorizontal className="h-6 w-6" /></div>
                                    <span className="text-xs font-bold">Oldin/Keyin</span>
                                </button>
                                <button onClick={() => handleAddSection('faq')} className="flex flex-col items-center gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 hover:bg-primary/10 hover:text-primary transition-colors group">
                                    <div className="p-3 bg-white dark:bg-slate-700 rounded-xl shadow-sm group-hover:scale-110 transition-transform"><MessageSquare className="h-6 w-6" /></div>
                                    <span className="text-xs font-bold">FAQ (Savollar)</span>
                                </button>
                                <button onClick={() => handleAddSection('testimonials')} className="flex flex-col items-center gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 hover:bg-primary/10 hover:text-primary transition-colors group">
                                    <div className="p-3 bg-white dark:bg-slate-700 rounded-xl shadow-sm group-hover:scale-110 transition-transform"><UserCheck className="h-6 w-6" /></div>
                                    <span className="text-xs font-bold">Izohlar</span>
                                </button>
                                <button onClick={() => handleAddSection('table')} className="flex flex-col items-center gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 hover:bg-primary/10 hover:text-primary transition-colors group">
                                    <div className="p-3 bg-white dark:bg-slate-700 rounded-xl shadow-sm group-hover:scale-110 transition-transform"><TableIcon className="h-6 w-6" /></div>
                                    <span className="text-xs font-bold">Jadval</span>
                                </button>
                            </div>
                            <button onClick={() => setIsAddingSection(false)} className="w-full mt-6 py-3 text-slate-500 font-bold hover:text-slate-700 dark:hover:text-slate-300">Bekor qilish</button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
