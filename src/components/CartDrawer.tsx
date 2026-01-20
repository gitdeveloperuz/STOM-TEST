
import React, { useState, useEffect } from 'react';
import { X, Trash2, CalendarCheck, ChevronLeft, User, Phone, MapPin, MessageSquare, CreditCard, Store, CheckCircle, Loader2, Banknote, Wallet, ShoppingBag, Plus, Minus, Truck, Package, Clock } from 'lucide-react';
import { CartItem, SiteConfig, Treatment, Order } from '../types';
import { CURRENCY_FORMATTER, USD_FORMATTER, TELEGRAM_BOT_TOKEN, TELEGRAM_ADMIN_ID, formatPrice } from '../constants';
import { trackTgUser, logAnalyticsEvent } from '../services/db';
import * as XLSX from 'xlsx';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onRemove: (id: string) => void;
  onUpdateQuantity: (cartId: string, newQty: number) => void;
  onClear: () => void;
  telegramConfig?: SiteConfig['telegram'];
}

type CheckoutStep = 'cart' | 'checkout' | 'success';
type PaymentMethod = 'transfer';
type DeliveryType = 'delivery' | 'pickup';

const INITIAL_FORM_DATA = {
  firstName: '',
  lastName: '',
  phone: '',
  address: '',
  comment: '',
  paymentMethod: 'transfer' as PaymentMethod,
  deliveryType: 'delivery' as DeliveryType
};

export const CartDrawer: React.FC<CartDrawerProps> = ({ isOpen, onClose, items, onRemove, onUpdateQuantity, onClear, telegramConfig }) => {
  const [step, setStep] = useState<CheckoutStep>('cart');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState(INITIAL_FORM_DATA);
  const [lastOrderId, setLastOrderId] = useState<string>('');

  // Calculate totals by currency
  const totalUZS = items.reduce((sum, item) => {
      if (item.currency === 'USD') return sum;
      return sum + (item.price * item.quantity);
  }, 0);

  const totalUSD = items.reduce((sum, item) => {
      if (item.currency === 'USD') return sum + (item.price * item.quantity);
      return sum;
  }, 0);

  const totalQty = items.reduce((sum, item) => sum + item.quantity, 0);

  const getFormattedTotal = () => {
      const parts = [];
      if (totalUZS > 0) parts.push(CURRENCY_FORMATTER.format(totalUZS));
      if (totalUSD > 0) parts.push(USD_FORMATTER.format(totalUSD));
      return parts.length > 0 ? parts.join(' + ') : CURRENCY_FORMATTER.format(0);
  };

  useEffect(() => {
    if (isOpen) {
      setStep('cart');
      setIsSubmitting(false);
    }
  }, [isOpen]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleDeliveryChange = (type: DeliveryType) => {
      setFormData(prev => ({ ...prev, deliveryType: type }));
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    const digits = rawValue.replace(/\D/g, '');
    let coreDigits = digits;
    if (coreDigits.startsWith('998')) {
        coreDigits = coreDigits.slice(3);
    }
    coreDigits = coreDigits.slice(0, 9);
    let formatted = '+998';
    if (coreDigits.length > 0) formatted += ' ' + coreDigits.slice(0, 2);
    if (coreDigits.length > 2) formatted += ' ' + coreDigits.slice(2, 5);
    if (coreDigits.length > 5) formatted += ' ' + coreDigits.slice(5, 7);
    if (coreDigits.length > 7) formatted += ' ' + coreDigits.slice(7, 9);
    setFormData(prev => ({ ...prev, phone: formatted }));
  };

  const createExcelBlob = (orderId: string): { blob: Blob, fileName: string } => {
    const wb = XLSX.utils.book_new();
    const paymentText = "Onlayn-o'tkazma";
    const deliveryText = formData.deliveryType === 'delivery' ? "Yetkazib berish" : "O'zi olib ketish";
    const dateText = new Date().toLocaleString('uz-UZ');

    const wsData = [
      ["STOMSHOP - BUYURTMA WARAQASI"],
      [""],
      ["BUYURTMA MA'LUMOTLARI"],
      ["Raqam:", orderId],
      ["Sana:", dateText],
      ["Holati:", "Yangi"],
      [""],
      ["MIJOZ"],
      ["Ism:", formData.firstName],
      ["Familiya:", formData.lastName],
      ["Telefon:", formData.phone],
      [""],
      ["YETKAZIB BERISH VA TO'LOV"],
      ["Usul:", deliveryText],
      ["Manzil:", formData.deliveryType === 'delivery' ? formData.address : "-"],
      ["To'lov turi:", paymentText],
      ["Izoh:", formData.comment || "Yo'q"],
      [""],
      ["TANLANGAN XIZMATLAR VA MAHSULOTLAR"],
      ["№", "Nomi", "Turi", "Soni", "Narxi (dona)", "Jami", "Valyuta"],
    ];

    items.forEach((item, index) => {
      wsData.push([
        (index + 1).toString(),
        item.name,
        item.recommended ? "Tavsiya" : "Standard",
        item.quantity.toString(),
        item.price.toString(),
        (item.price * item.quantity).toString(),
        item.currency || 'UZS'
      ]);
    });

    wsData.push([""]);
    wsData.push(["", "", "", "", "UMUMIY JAMI:", getFormattedTotal()]);
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    ws['!cols'] = [{ wch: 5 }, { wch: 40 }, { wch: 15 }, { wch: 10 }, { wch: 15 }, { wch: 20 }, { wch: 10 }];
    XLSX.utils.book_append_sheet(wb, ws, "Buyurtma");
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const fileName = `Buyurtma_${formData.firstName}_${formData.lastName}.xlsx`;
    return { blob, fileName };
  };

  const downloadLocally = (blob: Blob, fileName: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const sendToTelegram = async (blob: Blob, fileName: string, orderId: string) => {
    const botToken = telegramConfig?.botToken || TELEGRAM_BOT_TOKEN;
    const rawAdminIds = telegramConfig?.adminId || TELEGRAM_ADMIN_ID;
    
    // Skip if config is missing or default
    if (!botToken || botToken.includes('YOUR_')) return false;
    
    const paymentText = "Onlayn o'tkazma";
    const deliveryText = formData.deliveryType === 'delivery' ? "🚙 Yetkazib berish" : "🏃‍♂️ O'zi olib ketish";
    
    const itemsList = items.map((item, idx) => {
        const totalItemPrice = formatPrice(item.price * item.quantity, item.currency);
        const unitPrice = formatPrice(item.price, item.currency);
        const typeTag = item.recommended ? " (Tavsiya)" : "";
        return `${idx + 1}. ${item.name}${typeTag}\n   └ ${item.quantity} x ${unitPrice} = ${totalItemPrice}`;
    }).join('\n');

    const commentLine = formData.comment ? `\n💬 Izoh: ${formData.comment}` : "";
    const addressLine = formData.deliveryType === 'delivery' ? `\n📍 Manzil: ${formData.address}` : "";

    const caption = `🆕 YANGI BUYURTMA #${orderId} (Web)

👤 Mijoz ma'lumotlari:
• Ism: ${formData.firstName} ${formData.lastName}
• Telefon: ${formData.phone}

📦 Yetkazib berish:
• Usul: ${deliveryText}${addressLine}

💳 To'lov ma'lumotlari:
• Usul: ${paymentText}${commentLine}

🛒 BUYURTMA TARKIBI:
${itemsList}

▬▬▬▬▬▬▬▬▬▬▬▬
💰 UMUMIY JAMI: ${getFormattedTotal()}`;

    const adminIds = rawAdminIds ? rawAdminIds.split(',').map(id => id.trim()).filter(id => id) : [];
    let successCount = 0;
    
    for (const adminId of adminIds) {
        const formDataUpload = new FormData();
        formDataUpload.append('chat_id', adminId); 
        formDataUpload.append('document', blob, fileName);
        formDataUpload.append('caption', caption);
        try {
          const response = await fetch(`https://api.telegram.org/bot${botToken}/sendDocument`, { method: 'POST', body: formDataUpload });
          const result = await response.json();
          if (result.ok) successCount++;
        } catch (error) {
          console.error(`Telegram Upload Failed for ID ${adminId}:`, error);
        }
    }
    return successCount > 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.deliveryType === 'delivery' && !formData.address.trim()) {
        alert("Iltimos, manzilni kiriting.");
        return;
    }

    setIsSubmitting(true);
    const orderId = `ORD-${Date.now().toString().slice(-6)}`;
    setLastOrderId(orderId);

    try {
      // 1. Save to Internal Database (CRM Tracking)
      const webUserId = `web-${formData.phone.replace(/\D/g, '')}`;
      const newOrder: Order = {
          id: orderId,
          date: Date.now(),
          itemsSummary: items.map(i => `${i.name} (x${i.quantity})`).join(', '),
          totalAmount: getFormattedTotal(),
          source: 'website',
          status: 'new',
          userId: webUserId,
          userPhone: formData.phone,
          location: formData.deliveryType === 'delivery' ? formData.address : undefined,
          items: items // Store full structure for analytics
      };

      await trackTgUser(webUserId, {
          id: webUserId,
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone,
          orders: [newOrder],
          lastActive: Date.now(),
          source: 'website'
      });

      // 2. Log Analytics Event
      logAnalyticsEvent('checkout_success', {
          orderId: orderId,
          totalAmount: getFormattedTotal(),
          itemsCount: items.length
      });

      // 3. Send Telegram Notification (to Admin)
      const { blob, fileName } = createExcelBlob(orderId);
      // We try to send to admin channel/group if token exists
      await sendToTelegram(blob, fileName, orderId);

      // 4. Send Data via WebApp (If available, closes app)
      // This sends data back to the User who opened the WebApp
      // @ts-ignore
      const tg = window.Telegram?.WebApp;
      if (tg) {
          const itemsSummary = items.map(i => `${i.name} (x${i.quantity})`).join('\n');
          const payload = {
              type: 'ORDER',
              orderId,
              itemsSummary,
              totalAmount: getFormattedTotal(),
              phone: formData.phone,
              firstName: formData.firstName
          };
          
          tg.sendData(JSON.stringify(payload));
          // Note: sendData closes the WebApp. If we want to show success screen first, we shouldn't call it immediately.
          // However, usually sendData is the end of the flow.
      } else {
          // If not inside Telegram, download file
          downloadLocally(blob, fileName);
      }

      setStep('success');
    } catch (err) {
      console.error("Process failed", err);
      alert("Xatolik yuz berdi. Internet aloqasini tekshiring.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (step === 'success') {
      onClear();
      setFormData(INITIAL_FORM_DATA);
      setLastOrderId('');
      
      // Close WebApp if success
      // @ts-ignore
      if (window.Telegram?.WebApp) {
          // @ts-ignore
          window.Telegram.WebApp.close();
      }
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={handleClose} />
      <div className="absolute inset-y-0 right-0 flex max-w-full pl-0 sm:pl-10 pointer-events-none">
        <div className="w-full sm:w-screen sm:max-w-md pointer-events-auto bg-white dark:bg-slate-900 flex flex-col shadow-2xl h-full sm:rounded-l-[2rem] transition-colors duration-300">
          <div className="flex items-center justify-between px-6 py-5 bg-white dark:bg-slate-900 border-b border-slate-100/50 dark:border-slate-800 z-10 sm:rounded-tl-[2rem]">
            <div className="flex items-center gap-2">
              {step === 'checkout' && (
                <button onClick={() => !isSubmitting && setStep('cart')} className="p-2 -ml-2 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-200 rounded-xl transition-colors active:scale-95" disabled={isSubmitting}>
                  <ChevronLeft className="h-6 w-6" />
                </button>
              )}
              <h2 className="text-xl font-bold text-slate-800 dark:text-white tracking-tight">
                {step === 'cart' && 'Savatcha'}
                {step === 'checkout' && 'Rasmiylashtirish'}
                {step === 'success' && 'Muvaffaqiyatli'}
              </h2>
            </div>
            <button onClick={handleClose} disabled={isSubmitting} className="p-2 -mr-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all active:scale-95">
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-950 scroll-smooth">
            <div className="p-4 sm:p-6 space-y-6">
              {step === 'cart' && (
                items.length === 0 ? (
                  <div className="h-[60vh] flex flex-col items-center justify-center text-center text-slate-500 dark:text-slate-400 space-y-4 p-8">
                    <div className="w-24 h-24 bg-white dark:bg-slate-900 rounded-full flex items-center justify-center shadow-lg shadow-slate-200/50 dark:shadow-black/20 mb-2">
                      <CalendarCheck className="h-10 w-10 text-primary/50" />
                    </div>
                    <div>
                       <p className="font-bold text-xl text-slate-900 dark:text-white">Savatcha bo'sh</p>
                       <p className="text-sm mt-2 text-slate-400 max-w-[200px] mx-auto">Siz hali hech qanday xizmat tanlamadingiz.</p>
                    </div>
                    <button onClick={onClose} className="mt-4 px-6 py-3 bg-primary/10 dark:bg-primary/20 text-primary dark:text-sky-400 font-bold rounded-xl hover:bg-primary hover:text-white transition-all">
                      Xizmatlarni tanlash
                    </button>
                  </div>
                ) : (
                  <ul className="space-y-4 pb-20">
                    {items.map((item) => (
                      <li key={item.cartId} className="flex flex-col bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-2">
                           <div className="flex-1">
                             <h3 className="font-bold text-slate-900 dark:text-white line-clamp-2 pr-2 leading-snug">
                               {item.name} 
                             </h3>
                             <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{formatPrice(item.price, item.currency)} dan</p>
                           </div>
                           <div className="text-right flex flex-col items-end">
                             <span className="font-bold text-primary whitespace-nowrap block">{formatPrice(item.price * item.quantity, item.currency)}</span>
                             
                             {/* Quantity Controls */}
                             <div className="flex items-center gap-2 mt-2 bg-slate-50 dark:bg-slate-800 p-1 rounded-lg border border-slate-100 dark:border-slate-700">
                                <button 
                                  onClick={() => onUpdateQuantity(item.cartId, Math.max(1, item.quantity - 1))}
                                  className="w-6 h-6 flex items-center justify-center bg-white dark:bg-slate-700 rounded-md shadow-sm text-slate-500 hover:text-primary transition-colors"
                                >
                                  <Minus className="h-3 w-3" />
                                </button>
                                <span className="text-xs font-bold text-slate-700 dark:text-slate-200 min-w-[1.5rem] text-center">
                                  {item.quantity}
                                </span>
                                <button 
                                  onClick={() => onUpdateQuantity(item.cartId, item.quantity + 1)}
                                  className="w-6 h-6 flex items-center justify-center bg-white dark:bg-slate-700 rounded-md shadow-sm text-slate-500 hover:text-primary transition-colors"
                                >
                                  <Plus className="h-3 w-3" />
                                </button>
                             </div>
                           </div>
                        </div>
                        <div className="flex items-center justify-between border-t border-slate-50 dark:border-slate-800 pt-3 mt-3">
                          <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded-md tracking-wide ${item.recommended ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`}>
                            {item.recommended ? 'Tavsiya' : 'Standard'}
                          </span>
                          <button type="button" onClick={() => onRemove(item.cartId)} className="text-xs font-bold text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5">
                            <Trash2 className="h-3.5 w-3.5" /> O'chirish
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )
              )}

              {step === 'checkout' && (
                <form id="checkout-form" onSubmit={handleSubmit} className="space-y-6 pb-20">
                  <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
                    <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200 font-bold pb-3 border-b border-slate-50 dark:border-slate-800">
                      <div className="bg-primary/10 dark:bg-primary/20 p-1.5 rounded-lg">
                        <User className="h-4 w-4 text-primary dark:text-sky-400" />
                      </div>
                      <h3>Shaxsiy ma'lumotlar</h3>
                    </div>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Ism</label>
                          <input required type="text" name="firstName" value={formData.firstName} onChange={handleInputChange} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-0 ring-1 ring-slate-200 dark:ring-slate-700 rounded-xl focus:ring-2 focus:ring-primary focus:bg-white dark:focus:bg-slate-900 text-slate-900 dark:text-white transition-all text-base font-medium" placeholder="Ism" disabled={isSubmitting} />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Familiya</label>
                          <input required type="text" name="lastName" value={formData.lastName} onChange={handleInputChange} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-0 ring-1 ring-slate-200 dark:ring-slate-700 rounded-xl focus:ring-2 focus:ring-primary focus:bg-white dark:focus:bg-slate-900 text-slate-900 dark:text-white transition-all text-base font-medium" placeholder="Familiya" disabled={isSubmitting} />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Telefon</label>
                        <div className="relative">
                          <Phone className="absolute left-4 top-3.5 h-5 w-5 text-slate-400" />
                          <input required type="tel" name="phone" value={formData.phone} onChange={handlePhoneChange} maxLength={17} minLength={17} className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border-0 ring-1 ring-slate-200 dark:ring-slate-700 rounded-xl focus:ring-2 focus:ring-primary focus:bg-white dark:focus:bg-slate-900 text-slate-900 dark:text-white transition-all text-base font-medium placeholder-slate-400" placeholder="+998 90 123 45 67" disabled={isSubmitting} />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
                    <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200 font-bold pb-3 border-b border-slate-50 dark:border-slate-800">
                       <div className="bg-primary/10 dark:bg-primary/20 p-1.5 rounded-lg">
                        <Truck className="h-4 w-4 text-primary dark:text-sky-400" />
                      </div>
                      <h3>Yetkazib berish turi</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            type="button"
                            onClick={() => handleDeliveryChange('delivery')}
                            className={`p-4 rounded-xl border-2 flex flex-col items-center justify-center gap-2 transition-all ${formData.deliveryType === 'delivery' ? 'border-primary bg-primary/5 dark:bg-primary/10 text-primary' : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:border-slate-300'}`}
                        >
                            <Truck className="h-6 w-6" />
                            <span className="text-xs font-bold">Yetkazib berish</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => handleDeliveryChange('pickup')}
                            className={`p-4 rounded-xl border-2 flex flex-col items-center justify-center gap-2 transition-all ${formData.deliveryType === 'pickup' ? 'border-primary bg-primary/5 dark:bg-primary/10 text-primary' : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:border-slate-300'}`}
                        >
                            <Store className="h-6 w-6" />
                            <span className="text-xs font-bold">O'zi olib ketish</span>
                        </button>
                    </div>

                    {formData.deliveryType === 'delivery' && (
                        <div className="space-y-1.5 animate-slide-up">
                            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Manzil</label>
                            <textarea 
                                required 
                                name="address" 
                                value={formData.address} 
                                onChange={handleInputChange} 
                                rows={2}
                                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-0 ring-1 ring-slate-200 dark:ring-slate-700 rounded-xl focus:ring-2 focus:ring-primary focus:bg-white dark:focus:bg-slate-900 text-slate-900 dark:text-white transition-all text-base font-medium resize-none placeholder-slate-400" 
                                placeholder="Toshkent sh., Chilonzor tumani..." 
                                disabled={isSubmitting} 
                            />
                        </div>
                    )}
                  </div>

                  <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
                    <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200 font-bold pb-3 border-b border-slate-50 dark:border-slate-800">
                       <div className="bg-primary/10 dark:bg-primary/20 p-1.5 rounded-lg">
                        <MessageSquare className="h-4 w-4 text-primary dark:text-sky-400" />
                      </div>
                      <h3>Izoh</h3>
                    </div>
                    <textarea name="comment" value={formData.comment} onChange={handleInputChange} rows={3} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-0 ring-1 ring-slate-200 dark:ring-slate-700 rounded-xl focus:ring-2 focus:ring-primary focus:bg-white dark:focus:bg-slate-900 text-slate-900 dark:text-white transition-all text-base font-medium resize-none" placeholder="Qo'shimcha izoh..." disabled={isSubmitting} />
                  </div>
                </form>
              )}

              {step === 'success' && (
                <div className="flex flex-col items-center justify-center min-h-[50vh] text-center space-y-6 animate-fade-in p-4">
                  <div className="w-20 h-20 bg-emerald-50 dark:bg-emerald-900/20 rounded-full flex items-center justify-center animate-bounce shadow-xl shadow-emerald-100 dark:shadow-black/20">
                    <CheckCircle className="h-10 w-10 text-emerald-500 dark:text-emerald-400" />
                  </div>
                  
                  <div className="space-y-1">
                    <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white">Qabul Qilindi!</h3>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">Buyurtmangiz muvaffaqiyatli rasmiylashtirildi.</p>
                  </div>

                  <div className="w-full bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 text-left relative overflow-hidden">
                     {/* Decorative dashed line top */}
                     <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-slate-200 dark:via-slate-700 to-transparent"></div>

                     <div className="flex justify-between items-start mb-6 border-b border-dashed border-slate-200 dark:border-slate-700 pb-4">
                         <div>
                            <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-1">Buyurtma ID</p>
                            <p className="text-xl font-mono font-bold text-primary">#{lastOrderId}</p>
                         </div>
                         <div className="bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-100 dark:border-slate-700">
                             <Package className="h-5 w-5 text-slate-400" />
                         </div>
                     </div>

                     <div className="space-y-4 text-sm mb-6">
                         <div className="flex justify-between">
                            <span className="text-slate-500 dark:text-slate-400">Mijoz</span>
                            <span className="font-bold text-slate-900 dark:text-white text-right">{formData.firstName} {formData.lastName}</span>
                         </div>
                         <div className="flex justify-between">
                            <span className="text-slate-500 dark:text-slate-400">Telefon</span>
                            <span className="font-bold text-slate-900 dark:text-white text-right font-mono">{formData.phone}</span>
                         </div>
                         <div className="flex justify-between items-start gap-4">
                            <span className="text-slate-500 dark:text-slate-400 whitespace-nowrap">Yetkazib berish</span>
                            <span className="font-bold text-slate-900 dark:text-white text-right break-words">
                                {formData.deliveryType === 'delivery' ? (
                                    <>Yetkazib berish<br/><span className="text-xs font-normal text-slate-500">{formData.address}</span></>
                                ) : (
                                    "O'zi olib ketish"
                                )}
                            </span>
                         </div>
                     </div>

                     <div className="flex justify-between items-center pt-2 border-t border-dashed border-slate-200 dark:border-slate-700">
                        <span className="font-bold text-slate-500 dark:text-slate-400">Jami</span>
                        <span className="font-black text-lg text-primary">{getFormattedTotal()}</span>
                     </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {items.length > 0 && step !== 'success' && (
            <div className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-[0_-4px_20px_-5px_rgba(0,0,0,0.1)] z-20">
              <div className="flex justify-between items-end mb-4"><p className="text-slate-400 font-medium text-sm uppercase tracking-wide">Jami summa:</p><p className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{getFormattedTotal()}</p></div>
              {step === 'cart' ? (
                <button onClick={() => setStep('checkout')} className="w-full flex items-center justify-center gap-2 rounded-xl bg-slate-900 dark:bg-white px-6 py-4 text-lg font-bold text-white dark:text-slate-900 shadow-lg shadow-slate-900/30 hover:bg-slate-800 dark:hover:bg-slate-200 active:scale-[0.98] transition-all">Buyurtma berish <span className="ml-1 bg-white/20 dark:bg-black/10 px-2.5 py-0.5 rounded-lg text-sm">{totalQty}</span></button>
              ) : (
                <button type="submit" form="checkout-form" disabled={isSubmitting} className="w-full flex items-center justify-center gap-2 rounded-xl bg-slate-900 dark:bg-white px-6 py-4 text-lg font-bold text-white dark:text-slate-900 shadow-lg shadow-slate-900/30 hover:bg-slate-800 dark:hover:bg-slate-200 active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed">{isSubmitting ? <><Loader2 className="h-6 w-6 animate-spin" /> Yuborilmoqda...</> : 'Tasdiqlash'}</button>
              )}
            </div>
          )}

          {step === 'success' && (
             <div className="border-t border-slate-200 dark:border-slate-800 p-6 bg-white dark:bg-slate-900 z-20">
                <button onClick={handleClose} className="w-full flex items-center justify-center rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-6 py-4 text-lg font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-slate-300 active:scale-[0.98] transition-all">Yopish</button>
             </div>
          )}
        </div>
      </div>
    </div>
  );
};
