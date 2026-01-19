
import React, { useState } from 'react';
import { Lock, X, ChevronRight, ShieldCheck, Mail, RefreshCw } from 'lucide-react';
import { authenticateAdmin, getAllAdmins, saveAdmin } from '../services/db';
import { AdminUser } from '../types';
import { TOTP, Secret } from 'otpauth';

interface AdminLoginProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (user: AdminUser) => void;
}

type LoginStep = 'credentials' | '2fa' | 'forgot_email' | 'forgot_2fa' | 'reset_password';

export const AdminLogin: React.FC<AdminLoginProps> = ({ isOpen, onClose, onLogin }) => {
  const [step, setStep] = useState<LoginStep>('credentials');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otpToken, setOtpToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [pendingUser, setPendingUser] = useState<AdminUser | null>(null);

  if (!isOpen) return null;

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    setIsLoading(true);

    try {
        const user = await authenticateAdmin(email, password);
        
        if (user) {
            setPendingUser(user);
            if (user.isTwoFactorEnabled && user.twoFactorSecret) {
                setStep('2fa');
            } else {
                onLogin(user);
                handleClose();
            }
        } else {
            setError("Email yoki parol noto'g'ri");
        }
    } catch (err) {
        setError("Tizim xatoligi");
    } finally {
        setIsLoading(false);
    }
  };

  const handle2FASubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!pendingUser || !pendingUser.twoFactorSecret) return;

      try {
          const totp = new TOTP({
              secret: Secret.fromBase32(pendingUser.twoFactorSecret),
              algorithm: 'SHA1',
              digits: 6,
              period: 30
          });

          const delta = totp.validate({ token: otpToken, window: 1 });

          if (delta !== null) {
              onLogin(pendingUser);
              handleClose();
          } else {
              setError("Tasdiqlash kodi noto'g'ri");
          }
      } catch (e) {
          console.error("2FA Error:", e);
          setError("Kod xato yoki tizim xatoligi");
      }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setIsLoading(true);
      setError('');
      
      try {
          const admins = await getAllAdmins();
          const user = admins.find(a => a.email.toLowerCase() === email.toLowerCase());

          if (user) {
              setPendingUser(user);
              if (!user.isTwoFactorEnabled) {
                  setError("Hisobingizda 2-bosqichli himoya yoqilmagan. Asosiy Adminga murojaat qiling.");
                  setIsLoading(false);
                  return;
              }
              setStep('forgot_2fa');
          } else {
              setError("Bunday Email topilmadi");
          }
      } catch (err) {
          setError("Xatolik yuz berdi");
      } finally {
          setIsLoading(false);
      }
  };

  const handleRecovery2FASubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!pendingUser || !pendingUser.twoFactorSecret) return;

      try {
          const totp = new TOTP({
              secret: Secret.fromBase32(pendingUser.twoFactorSecret),
              algorithm: 'SHA1',
              digits: 6,
              period: 30
          });

          const delta = totp.validate({ token: otpToken, window: 1 });

          if (delta !== null) {
              setStep('reset_password');
              setOtpToken('');
          } else {
              setError("Tasdiqlash kodi noto'g'ri");
          }
      } catch (e) {
          console.error("2FA Recovery Error:", e);
          setError("Kod xato");
      }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!newPassword || newPassword.length < 6) {
          setError("Parol kamida 6 belgidan iborat bo'lishi kerak");
          return;
      }

      setIsLoading(true);
      try {
          if (pendingUser) {
              const updatedUser = { ...pendingUser, password: newPassword };
              await saveAdmin(updatedUser);
              onLogin(updatedUser);
              handleClose();
          }
      } catch (err) {
          setError("Saqlashda xatolik");
      } finally {
          setIsLoading(false);
      }
  };

  const handleClose = () => {
      setStep('credentials');
      setPassword('');
      setEmail('');
      setOtpToken('');
      setNewPassword('');
      setError('');
      setPendingUser(null);
      onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={handleClose} />
      
      <div className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden animate-fade-in transition-colors">
        <div className="bg-slate-900 dark:bg-black/50 p-6 text-center border-b border-slate-800">
          <div className="mx-auto w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center mb-3">
            {step === 'credentials' && <Lock className="w-6 h-6 text-primary" />}
            {(step === '2fa' || step === 'forgot_2fa') && <ShieldCheck className="w-6 h-6 text-emerald-500" />}
            {step === 'forgot_email' && <Mail className="w-6 h-6 text-yellow-500" />}
            {step === 'reset_password' && <RefreshCw className="w-6 h-6 text-primary" />}
          </div>
          <h2 className="text-xl font-bold text-white">
              {step === 'credentials' && "Admin Kirish"}
              {(step === '2fa' || step === 'forgot_2fa') && "Xavfsizlik Kodi"}
              {step === 'forgot_email' && "Parolni Tiklash"}
              {step === 'reset_password' && "Yangi Parol"}
          </h2>
          <p className="text-slate-400 text-sm mt-1">
              {step === 'credentials' && "Tizimga kirish uchun ma'lumotlaringizni kiriting"}
              {(step === '2fa' || step === 'forgot_2fa') && "Authenticator ilovasidagi kodni kiriting"}
              {step === 'forgot_email' && "Hisobingizga bog'langan Emailni kiriting"}
              {step === 'reset_password' && "Yangi kuchli parol o'rnating"}
          </p>
          <button onClick={handleClose} className="absolute top-4 right-4 text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
            {/* Step 1: Credentials Input */}
            {step === 'credentials' && (
                <form onSubmit={handleCredentialsSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => {
                                setEmail(e.target.value);
                                setError('');
                            }}
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                            placeholder="admin@stomshop.uz"
                            autoFocus
                            disabled={isLoading}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Parol</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => {
                                setPassword(e.target.value);
                                setError('');
                            }}
                            className={`w-full px-4 py-3 rounded-xl border ${error ? 'border-red-500 focus:ring-red-200' : 'border-slate-200 dark:border-slate-700 focus:ring-primary/20 focus:border-primary'} bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 transition-all`}
                            placeholder="••••••••"
                            disabled={isLoading}
                        />
                    </div>

                    {error && <p className="text-red-500 text-xs font-medium animate-pulse text-center">{error}</p>}
                    
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-sky-600 text-white py-3 rounded-xl font-semibold transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? "Tekshirilmoqda..." : "Kirish"} <ChevronRight className="w-4 h-4" />
                    </button>
                    
                    <button 
                        type="button"
                        onClick={() => setStep('forgot_email')}
                        className="w-full text-center text-xs text-slate-500 dark:text-slate-400 hover:text-primary dark:hover:text-primary mt-2"
                    >
                        Parolni unutdingizmi?
                    </button>
                </form>
            )}

            {/* Step 2: 2FA Verification (Login Flow) */}
            {step === '2fa' && (
                 <form onSubmit={handle2FASubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">6 xonali kod</label>
                        <input
                            type="text"
                            inputMode="numeric"
                            value={otpToken}
                            onChange={(e) => {
                                setOtpToken(e.target.value.replace(/\D/g, '').slice(0, 6));
                                setError('');
                            }}
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-center text-2xl tracking-widest font-mono focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                            placeholder="000000"
                            autoFocus
                        />
                    </div>
                    {error && <p className="text-red-500 text-xs font-medium text-center">{error}</p>}
                    <button
                        type="submit"
                        className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-3 rounded-xl font-semibold transition-all active:scale-95"
                    >
                        Tasdiqlash
                    </button>
                 </form>
            )}

            {/* Step 3: Forgot Password - Email */}
            {step === 'forgot_email' && (
                <form onSubmit={handleForgotSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email manzili</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => {
                                setEmail(e.target.value);
                                setError('');
                            }}
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-yellow-500/20 focus:border-yellow-500 outline-none"
                            placeholder="admin@stomshop.uz"
                            autoFocus
                            disabled={isLoading}
                        />
                    </div>
                    {error && <p className="text-red-500 text-xs font-medium">{error}</p>}
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-3 rounded-xl font-semibold transition-all active:scale-95"
                    >
                        {isLoading ? "Qidirilmoqda..." : "Davom etish"}
                    </button>
                    <button 
                        type="button"
                        onClick={() => setStep('credentials')}
                        className="w-full text-center text-xs text-slate-500 hover:text-slate-700 mt-2"
                    >
                        Ortga
                    </button>
                </form>
            )}

            {/* Step 4: Forgot Password - 2FA Check */}
            {step === 'forgot_2fa' && (
                <form onSubmit={handleRecovery2FASubmit} className="space-y-4">
                   <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg border border-yellow-100 dark:border-yellow-900/30 text-xs text-yellow-800 dark:text-yellow-200 mb-2">
                       Xavfsizlik uchun Google Authenticator ilovasidagi kodni kiriting.
                   </div>
                   <div>
                       <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">6 xonali kod</label>
                       <input
                           type="text"
                           inputMode="numeric"
                           value={otpToken}
                           onChange={(e) => {
                               setOtpToken(e.target.value.replace(/\D/g, '').slice(0, 6));
                               setError('');
                           }}
                           className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-center text-2xl tracking-widest font-mono focus:ring-2 focus:ring-yellow-500/20 focus:border-yellow-500 outline-none"
                           placeholder="000000"
                           autoFocus
                       />
                   </div>
                   {error && <p className="text-red-500 text-xs font-medium text-center">{error}</p>}
                   <button
                       type="submit"
                       className="w-full bg-yellow-500 hover:bg-yellow-600 text-white py-3 rounded-xl font-semibold transition-all active:scale-95"
                   >
                       Tasdiqlash
                   </button>
                </form>
            )}

            {/* Step 5: Reset Password */}
            {step === 'reset_password' && (
                <form onSubmit={handleResetPassword} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Yangi Parol</label>
                        <input
                            type="password"
                            value={newPassword}
                            onChange={(e) => {
                                setNewPassword(e.target.value);
                                setError('');
                            }}
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                            placeholder="Yangi parol..."
                            autoFocus
                            disabled={isLoading}
                        />
                    </div>
                    {error && <p className="text-red-500 text-xs font-medium">{error}</p>}
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-primary hover:bg-sky-600 text-white py-3 rounded-xl font-semibold transition-all active:scale-95"
                    >
                        {isLoading ? "Saqlanmoqda..." : "Parolni yangilash"}
                    </button>
                </form>
            )}

        </div>
      </div>
    </div>
  );
};
