
import React, { useState, useRef, useEffect } from 'react';
import { ShoppingCart, Activity, LogOut, Sun, Moon, Menu, X, Edit2 } from 'lucide-react';
import { StyleConfig, NavLink } from '../types';

interface NavbarProps {
  cartCount: number;
  onCartClick: () => void;
  onAdminClick: () => void;
  isAdmin: boolean;
  onLogout: () => void;
  isDarkMode: boolean;
  onToggleTheme: () => void;
  logoUrl?: string;
  logoText?: string;
  style?: StyleConfig;
  navLinks?: NavLink[];
  onNavigate?: (pageId: string | 'home') => void;
  activePageId?: string;
  onEditLogo?: () => void; // New prop for admin editing
  previewMode?: 'desktop' | 'tablet' | 'mobile'; // New prop to force layout
}

export const Navbar: React.FC<NavbarProps> = ({ 
    cartCount, onCartClick, onAdminClick, isAdmin, onLogout, 
    isDarkMode, onToggleTheme, logoUrl, logoText, style, navLinks, onNavigate, activePageId, onEditLogo, previewMode
}) => {
  const [clickCount, setClickCount] = useState(0);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const timeoutRef = useRef<any>(null);

  // Determine Nav Availability
  const hasNavLinks = navLinks && navLinks.length > 0;
  // Show hamburger if there are links OR if user is admin (need menu to logout)
  const showHamburger = hasNavLinks || isAdmin;

  // View Mode Logic for Admin Preview
  const isMobilePreview = previewMode === 'mobile';
  const isDesktopPreview = previewMode === 'desktop' || previewMode === 'tablet';

  // Responsive Classes Construction
  let navLinksContainerClass = '';
  let hamburgerBtnClass = '';
  let themeToggleClass = '';
  let adminLogoutClass = '';

  if (previewMode) {
      // --- PREVIEW MODE (Admin Settings) ---
      if (isMobilePreview) {
          navLinksContainerClass = 'hidden'; // Hide links on mobile
          hamburgerBtnClass = showHamburger ? 'block' : 'hidden'; // Show hamburger if needed
          themeToggleClass = showHamburger ? 'hidden' : 'block'; // Show theme toggle if no hamburger
          adminLogoutClass = 'hidden'; // Hide desktop logout
      } else {
          // Desktop/Tablet
          navLinksContainerClass = 'flex';
          hamburgerBtnClass = 'hidden';
          themeToggleClass = 'block';
          adminLogoutClass = 'flex';
      }
  } else {
      // --- REAL APP RESPONSIVE MODE ---
      // Desktop links: Hidden on mobile (md:flex)
      navLinksContainerClass = 'hidden md:flex';
      
      // Hamburger: Visible on mobile if needed (md:hidden)
      hamburgerBtnClass = showHamburger ? 'block md:hidden' : 'hidden';
      
      // Theme Toggle: 
      // If hamburger is shown -> Hide theme toggle on mobile (it's inside menu), Show on desktop (md:block)
      // If hamburger is hidden -> Show theme toggle everywhere (block)
      themeToggleClass = showHamburger ? 'hidden md:block' : 'block';
      
      // Admin Logout (Header): Hidden on mobile (in menu), Visible on desktop
      adminLogoutClass = 'hidden md:flex';
  }

  // Handle secret trigger via effect
  useEffect(() => {
      if (clickCount >= 5) {
          onAdminClick();
          setClickCount(0);
      }
  }, [clickCount, onAdminClick]);

  const handleLogoClick = () => {
    if (onEditLogo) {
        onEditLogo();
        return;
    }

    if (onNavigate) onNavigate('home');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setIsMenuOpen(false);
    
    if (!isAdmin) {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        setClickCount(prev => prev + 1);
        timeoutRef.current = setTimeout(() => {
            setClickCount(0);
        }, 1000);
    }
  };

  const logoHeight = style?.logoHeight || 40;
  const navAlignment = style?.navAlignment || 'left';

  const handleLinkClick = (e: React.MouseEvent, link: NavLink) => {
      e.preventDefault();
      setIsMenuOpen(false);

      if (link.type === 'internal' && link.pageId && onNavigate) {
          onNavigate(link.pageId);
          window.scrollTo({ top: 0, behavior: 'smooth' });
          return;
      }

      if (link.url.startsWith('#')) {
          if (activePageId !== 'home' && onNavigate) {
              onNavigate('home');
              setTimeout(() => {
                  const id = link.url.substring(1);
                  const element = document.getElementById(id);
                  if (element) {
                      const headerOffset = 80;
                      const elementPosition = element.getBoundingClientRect().top;
                      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
                      window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
                  }
              }, 100);
          } else {
              const id = link.url.substring(1);
              const element = document.getElementById(id);
              if (element) {
                  const headerOffset = 80;
                  const elementPosition = element.getBoundingClientRect().top;
                  const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
                  window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
              } else if (link.url === '#') {
                  window.scrollTo({ top: 0, behavior: 'smooth' });
              }
          }
      } else {
          window.open(link.url, '_blank');
      }
  };

  const getLogoSrc = (url: string) => {
      if (url.startsWith('data:')) return url;
      return `data:image/png;base64,${url}`;
  };

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  return (
    <nav className="sticky top-0 z-50 bg-white/80 dark:bg-slate-950/80 backdrop-blur-lg border-b border-slate-200/60 dark:border-slate-800/60 shadow-sm supports-[backdrop-filter]:bg-white/60 dark:supports-[backdrop-filter]:bg-slate-950/60 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-18 items-center py-3">
          
          {/* Logo */}
          <div className={`flex items-center gap-2.5 transition-transform active:scale-95 cursor-pointer select-none group relative shrink-0 ${onEditLogo ? 'ring-2 ring-primary/20 rounded-xl p-1' : ''}`} onClick={handleLogoClick}>
            {onEditLogo && (
                <div className="absolute -top-2 -right-2 bg-primary text-white p-1 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-10 animate-fade-in">
                    <Edit2 className="h-3 w-3" />
                </div>
            )}
            
            {logoUrl ? (
                <img 
                  src={getLogoSrc(logoUrl)}
                  alt="Logo" 
                  style={{ height: `${logoHeight}px` }}
                  className="w-auto object-contain max-w-[200px]" 
                />
            ) : (
                <>
                <div 
                    className="bg-gradient-to-tr from-primary to-sky-400 p-2.5 rounded-xl shadow-lg shadow-primary/20 text-white flex items-center justify-center"
                    style={{ height: `${logoHeight}px`, width: `${logoHeight}px`, padding: `${logoHeight * 0.25}px` }}
                >
                  <Activity className="w-full h-full" />
                </div>
                <div className="flex flex-col leading-none">
                  <span className="text-xl font-bold text-slate-800 dark:text-slate-100 tracking-tight transition-colors">
                    {logoText || 'StomShop'}
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium tracking-wide uppercase">
                    Dental Platform
                  </span>
                </div>
                </>
            )}
            
            {isAdmin && !onEditLogo && (
              <span className={`ml-2 px-2 py-1 bg-slate-900 dark:bg-slate-700 text-white text-[10px] font-bold uppercase tracking-wider rounded-md shadow-md animate-fade-in hidden sm:inline-block`}>
                Admin
              </span>
            )}
          </div>

          {/* Desktop/Tablet Nav Links */}
          <div className={`${navLinksContainerClass} items-center gap-4 flex-1 ${navAlignment === 'center' ? 'justify-center' : navAlignment === 'right' ? 'justify-end pr-6' : 'justify-start pl-6'}`}>
              {navLinks?.map(link => {
                  const isActive = link.type === 'internal' && link.pageId === activePageId;
                  return (
                      <a 
                        key={link.id} 
                        href={link.url}
                        onClick={(e) => handleLinkClick(e, link)}
                        className={`text-sm font-medium transition-colors cursor-pointer ${isActive ? 'text-primary font-bold' : 'text-slate-600 dark:text-slate-300 hover:text-primary dark:hover:text-primary'}`}
                      >
                          {link.text}
                      </a>
                  );
              })}
          </div>
          
          {/* Actions */}
          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
             {/* Theme Toggle (Visibility controlled by logic above) */}
             <button
              onClick={onToggleTheme}
              className={`p-1 text-slate-500 dark:text-slate-400 hover:text-primary transition-all active:scale-95 ${themeToggleClass}`}
              title={isDarkMode ? "Kunduzgi rejim" : "Tungi rejim"}
            >
              {isDarkMode ? <Sun className="h-6 w-6" /> : <Moon className="h-6 w-6" />}
            </button>

            {isAdmin && !onEditLogo && (
               <button 
                onClick={onLogout}
                className={`${adminLogoutClass} items-center gap-2 px-3 py-2 text-sm font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 rounded-xl transition-colors active:scale-95`}
              >
                <LogOut className="h-4 w-4" />
                <span>Chiqish</span>
              </button>
            )}

            <button 
              onClick={onCartClick}
              className="relative p-1 text-slate-700 dark:text-slate-200 hover:text-primary transition-all active:scale-95"
            >
              <ShoppingCart className="h-6 w-6" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-2 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold leading-none text-white transform bg-red-500 rounded-full shadow-sm">
                  {cartCount}
                </span>
              )}
            </button>

            {/* Hamburger Button */}
            <button 
                onClick={toggleMenu}
                className={`${hamburgerBtnClass} p-1 text-slate-700 dark:text-slate-200 hover:text-primary transition-all active:scale-95`}
            >
                {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
        
        {/* Mobile Menu Dropdown */}
        {isMenuOpen && (isMobilePreview || (!previewMode && window.innerWidth < 768)) && (
            <div className={`absolute top-full left-0 w-full bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 shadow-xl animate-slide-up pb-4 px-4 flex flex-col gap-2 z-50 ${!previewMode ? 'md:hidden' : ''}`}>
                {navLinks?.map(link => {
                    const isActive = link.type === 'internal' && link.pageId === activePageId;
                    return (
                        <a 
                            key={link.id} 
                            href={link.url}
                            onClick={(e) => handleLinkClick(e, link)}
                            className={`block w-full text-left px-4 py-3 rounded-xl text-base font-medium hover:bg-slate-50 dark:hover:bg-slate-800 active:bg-slate-100 dark:active:bg-slate-700 transition-colors cursor-pointer ${isActive ? 'text-primary bg-primary/5 dark:bg-primary/10' : 'text-slate-700 dark:text-slate-200'}`}
                        >
                            {link.text}
                        </a>
                    );
                })}
                
                <div className="h-px bg-slate-100 dark:bg-slate-800 my-2"></div>
                
                <div className="flex items-center justify-between px-4 py-2">
                    <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Mavzu:</span>
                    <button
                        onClick={() => { onToggleTheme(); }}
                        className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-sm transition-colors active:scale-95"
                    >
                        {isDarkMode ? <><Moon className="h-4 w-4" /> Tungi</> : <><Sun className="h-4 w-4" /> Kunduzgi</>}
                    </button>
                </div>

                {isAdmin && (
                    <button 
                        onClick={() => { onLogout(); setIsMenuOpen(false); }}
                        className="flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-xl transition-colors active:scale-95 mt-2"
                    >
                        <LogOut className="h-4 w-4" /> Chiqish (Admin)
                    </button>
                )}
            </div>
        )}
      </div>
    </nav>
  );
};