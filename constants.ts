import { Treatment } from './types';

export const CURRENCY_FORMATTER = new Intl.NumberFormat('uz-UZ', {
  style: 'currency',
  currency: 'UZS',
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

export const USD_FORMATTER = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

export const formatPrice = (price: number, currency: 'UZS' | 'USD' = 'UZS') => {
  return currency === 'USD' ? USD_FORMATTER.format(price) : CURRENCY_FORMATTER.format(price);
};

export const STATIC_SERVICES: Treatment[] = [];

// TELEGRAM CONFIGURATION
// Safely access env vars
const metaEnv = (import.meta as any).env || {};

export const TELEGRAM_BOT_TOKEN: string = metaEnv.VITE_TELEGRAM_BOT_TOKEN || '8540374918:AAG6TrUA8hku0UvCN-i1V7GuL5ycr9EtRC4'; 
export const TELEGRAM_ADMIN_ID: string = metaEnv.VITE_TELEGRAM_ADMIN_ID || '153931240';
