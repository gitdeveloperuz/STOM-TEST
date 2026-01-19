
import React from 'react';
import { Facebook, Instagram, Send, Youtube, Activity, Link as LinkIcon, Plus, Trash2, Globe } from 'lucide-react';
import { SiteConfig, StyleConfig, FooterLink, FooterSocial } from '../types';

interface FooterProps {
  config?: SiteConfig['footer'];
  logoUrl?: string;
  style?: StyleConfig;
  isEditing?: boolean;
  onUpdate?: (updates: Partial<SiteConfig['footer']>) => void;
}

export const Footer: React.FC<FooterProps> = ({ config, logoUrl, style, isEditing, onUpdate }) => {
  if (!config) return null;

  const socialIcons: Record<string, React.ElementType> = {
    telegram: Send,
    instagram: Instagram,
    facebook: Facebook,
    youtube: Youtube
  };

  const socialColors: Record<string, string> = {
      telegram: 'hover:text-sky-500 hover:border-sky-500 hover:bg-sky-50 dark:hover:bg-sky-900/20',
      instagram: 'hover:text-pink-600 hover:border-pink-600 hover:bg-pink-50 dark:hover:bg-pink-900/20',
      facebook: 'hover:text-blue-600 hover:border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20',
      youtube: 'hover:text-red-600 hover:border-red-600 hover:bg-red-50 dark:hover:bg-red-900/20'
  };

  const formatUrl = (url: string) => {
      if (!url) return '#';
      const cleanUrl = url.trim();
      if (cleanUrl === '#' || cleanUrl === '') return '#';
      if (cleanUrl.startsWith('/')) return cleanUrl;
      if (cleanUrl.match(/^[a-zA-Z]+:/)) return cleanUrl;
      return `https://${cleanUrl}`;
  };

  const getLogoSrc = (url: string) => {
      if (url.startsWith('data:')) return url;
      return `data:image/png;base64,${url}`;
  };

  // Handlers for editing
  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      if(onUpdate) onUpdate({ ...config, description: e.target.value });
  };

  const handleLinkUpdate = (id: string, field: keyof FooterLink, value: string) => {
      if(onUpdate) {
          const newLinks = config.links.map(l => l.id === id ? { ...l, [field]: value } : l);
          onUpdate({ ...config, links: newLinks });
      }
  };

  const handleAddLink = () => {
      if(onUpdate) {
          const newLink: FooterLink = { id: `fl-${Date.now()}`, text: 'Yangi havola', url: '#' };
          onUpdate({ ...config, links: [...config.links, newLink] });
      }
  };

  const handleDeleteLink = (id: string) => {
      if(onUpdate) {
          const newLinks = config.links.filter(l => l.id !== id);
          onUpdate({ ...config, links: newLinks });
      }
  };

  const handleSocialUpdate = (id: string, field: keyof FooterSocial, value: string) => {
      if(onUpdate) {
          const newSocials = config.socials.map(s => s.id === id ? { ...s, [field]: value } : s);
          onUpdate({ ...config, socials: newSocials });
      }
  };

  const handleAddSocial = () => {
      if(onUpdate) {
          const newSocial: FooterSocial = { id: `fs-${Date.now()}`, platform: 'telegram', url: 'https://t.me/' };
          onUpdate({ ...config, socials: [...config.socials, newSocial] });
      }
  };

  const handleDeleteSocial = (id: string) => {
      if(onUpdate) {
          const newSocials = config.socials.filter(s => s.id !== id);
          onUpdate({ ...config, socials: newSocials });
      }
  };

  return (
    <footer className={`bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 pt-16 pb-8 transition-colors mt-auto relative z-10 ${isEditing ? 'border-t-4 border-dashed border-primary/20' : ''}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
            {/* Brand & Desc */}
            <div className="space-y-6 col-span-1 md:col-span-2 lg:col-span-2">
                <div className="flex items-center gap-2">
                    {logoUrl ? (
                        <img 
                          src={getLogoSrc(logoUrl)}
                          alt="Logo" 
                          style={{ height: style?.logoHeight ? `${style.logoHeight}px` : '40px' }}
                          className="w-auto object-contain max-w-[150px]" 
                        />
                    ) : (
                        <>
                        <div className="bg-gradient-to-tr from-primary to-sky-400 p-2.5 rounded-xl shadow-lg shadow-primary/20 text-white">
                            <Activity className="h-6 w-6" />
                        </div>
                        <span className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                            StomShop
                        </span>
                        </>
                    )}
                </div>
                {isEditing ? (
                    <textarea 
                        value={config.description}
                        onChange={handleDescriptionChange}
                        className="w-full h-24 bg-slate-50 dark:bg-slate-800 border border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-3 text-sm focus:outline-none focus:border-primary resize-none"
                        placeholder="Klinika haqida ma'lumot..."
                    />
                ) : (
                    <p className="text-slate-500 dark:text-slate-400 text-base leading-relaxed max-w-md">
                        {config.description}
                    </p>
                )}
            </div>

            {/* Links */}
            <div>
                <h4 className="font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                    <LinkIcon className="h-4 w-4 text-primary" /> Foydali Havolalar
                </h4>
                <ul className="space-y-3">
                    {config.links.map(link => (
                        <li key={link.id} className={`${isEditing ? 'flex items-center gap-2' : ''}`}>
                            {isEditing ? (
                                <>
                                    <div className="flex-1 flex flex-col gap-1">
                                        <input 
                                            value={link.text} 
                                            onChange={(e) => handleLinkUpdate(link.id, 'text', e.target.value)}
                                            className="w-full text-xs p-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded"
                                            placeholder="Nomi"
                                        />
                                        <input 
                                            value={link.url} 
                                            onChange={(e) => handleLinkUpdate(link.id, 'url', e.target.value)}
                                            className="w-full text-[10px] p-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-slate-400"
                                            placeholder="URL"
                                        />
                                    </div>
                                    <button onClick={() => handleDeleteLink(link.id)} className="text-red-500 hover:bg-red-50 p-1 rounded"><Trash2 className="h-4 w-4" /></button>
                                </>
                            ) : (
                                <a 
                                    href={formatUrl(link.url)} 
                                    target={formatUrl(link.url).startsWith('http') ? "_blank" : "_self"}
                                    rel={formatUrl(link.url).startsWith('http') ? "noopener noreferrer" : ""}
                                    className="transition-colors text-sm font-medium flex items-center gap-2 group dynamic-footer-link"
                                >
                                    <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700 group-hover:bg-current transition-colors"></span>
                                    {link.text}
                                </a>
                            )}
                        </li>
                    ))}
                    {isEditing && (
                        <li>
                            <button onClick={handleAddLink} className="text-xs text-primary font-bold flex items-center gap-1 hover:underline"><Plus className="h-3 w-3" /> Havola qo'shish</button>
                        </li>
                    )}
                    {(!config.links || config.links.length === 0) && !isEditing && (
                        <li className="text-slate-400 text-xs italic">Havolalar mavjud emas</li>
                    )}
                </ul>
            </div>

            {/* Socials */}
            <div>
                <h4 className="font-bold text-slate-900 dark:text-white mb-6">Ijtimoiy Tarmoqlar</h4>
                <div className={`flex flex-wrap gap-3 ${isEditing ? 'flex-col' : ''}`}>
                    {config.socials.map(social => {
                        const Icon = socialIcons[social.platform] || Send;
                        const hoverClass = socialColors[social.platform] || 'hover:text-primary hover:border-primary hover:bg-primary/5';
                        
                        if (isEditing) {
                            return (
                                <div key={social.id} className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 p-2 rounded-lg border border-slate-200 dark:border-slate-700">
                                    <select 
                                        value={social.platform} 
                                        onChange={(e) => handleSocialUpdate(social.id, 'platform', e.target.value as any)}
                                        className="bg-transparent text-xs font-bold w-20"
                                    >
                                        <option value="telegram">Telegram</option>
                                        <option value="instagram">Instagram</option>
                                        <option value="facebook">Facebook</option>
                                        <option value="youtube">Youtube</option>
                                    </select>
                                    <input 
                                        value={social.url} 
                                        onChange={(e) => handleSocialUpdate(social.id, 'url', e.target.value)}
                                        className="flex-1 text-xs bg-transparent border-b border-slate-300 dark:border-slate-600 focus:outline-none"
                                        placeholder="URL"
                                    />
                                    <button onClick={() => handleDeleteSocial(social.id)} className="text-red-500"><Trash2 className="h-4 w-4" /></button>
                                </div>
                            );
                        }

                        return (
                            <a 
                                key={social.id}
                                href={formatUrl(social.url)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`h-11 w-11 flex items-center justify-center rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 transition-all duration-300 ${hoverClass}`}
                                title={social.platform}
                            >
                                <Icon className="h-5 w-5" />
                            </a>
                        );
                    })}
                    {isEditing && (
                        <button onClick={handleAddSocial} className="text-xs text-primary font-bold flex items-center gap-1 hover:underline mt-2"><Plus className="h-3 w-3" /> Tarmoq qo'shish</button>
                    )}
                    {(!config.socials || config.socials.length === 0) && !isEditing && (
                         <p className="text-slate-400 text-xs italic">Ijtimoiy tarmoqlar ulanmagan</p>
                    )}
                </div>
            </div>
        </div>

        <div className="border-t border-slate-100 dark:border-slate-800 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-slate-500 dark:text-slate-400 text-sm text-center md:text-left w-full md:w-auto">
                {isEditing ? (
                    <input 
                        value={config.copyright}
                        onChange={(e) => onUpdate && onUpdate({ ...config, copyright: e.target.value })}
                        className="bg-transparent border-b border-dashed border-slate-300 dark:border-slate-700 w-full md:w-64 text-center md:text-left focus:outline-none focus:border-primary"
                        placeholder="© 2024..."
                    />
                ) : (
                    config.copyright
                )}
            </div>
            <div className="text-slate-400 text-xs flex items-center gap-1">
               Powered by 
               {isEditing ? (
                   <input 
                       value={config.poweredBy || ''}
                       onChange={(e) => onUpdate && onUpdate({ ...config, poweredBy: e.target.value })}
                       className="bg-transparent border-b border-dashed border-slate-300 dark:border-slate-700 w-24 font-bold text-slate-700 dark:text-slate-300 focus:outline-none focus:border-primary"
                       placeholder="StomShop"
                   />
               ) : (
                   <span className="font-bold text-slate-700 dark:text-slate-300">{config.poweredBy || 'StomShop'}</span>
               )}
            </div>
        </div>
      </div>
    </footer>
  );
};