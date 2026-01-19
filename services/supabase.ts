import { createClient } from '@supabase/supabase-js';

// Safely access env vars
const metaEnv = (import.meta as any).env || {};

const SUPABASE_URL = metaEnv.VITE_SUPABASE_URL || 'https://kyaftizairzstekjqekv.supabase.co';
const SUPABASE_ANON_KEY = metaEnv.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt5YWZ0aXphaXJ6c3Rla2pxZWt2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg3MDg5NjQsImV4cCI6MjA4NDI4NDk2NH0.JG07KLAqh5m1BteOU03tB-7zjrLLbScauL4RbF-wtnM';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export const uploadToSupabase = async (file: File | Blob, folder: string = 'uploads'): Promise<string | null> => {
  try {
    if (file.size > MAX_FILE_SIZE) {
        console.warn(`File too large: ${file.size} bytes`);
        return null;
    }
    
    // Determine strict mime type
    let mimeType = file.type;
    if (!mimeType || mimeType === 'application/octet-stream') {
        mimeType = 'image/jpeg'; 
    }
    
    // Determine extension
    let fileExt = 'jpg';
    if (mimeType.includes('png')) fileExt = 'png';
    else if (mimeType.includes('webp')) fileExt = 'webp';
    else if (mimeType.includes('gif')) fileExt = 'gif';
    else if (mimeType.includes('video/mp4')) fileExt = 'mp4';
    
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(7);
    const fileName = `${timestamp}_${randomStr}.${fileExt}`;
    const fullPath = `${folder}/${fileName}`;

    // Ensure we are sending a File object for better compatibility
    const fileToUpload = file instanceof File 
        ? file 
        : new File([file], fileName, { type: mimeType });

    console.log(`[Supabase] Attempting upload to bucket 'images': ${fullPath}`);

    const { data, error } = await supabase.storage
      .from('images') 
      .upload(fullPath, fileToUpload, {
        cacheControl: '3600',
        upsert: true,
        contentType: mimeType
      });

    if (error) {
      console.error('[Supabase] Upload Failed:', error.message, error);
      return null;
    }

    if (!data) {
        console.error('[Supabase] No data returned from upload');
        return null;
    }

    const { data: publicUrlData } = supabase.storage
      .from('images')
      .getPublicUrl(fullPath);

    if (!publicUrlData || !publicUrlData.publicUrl) {
        console.error('[Supabase] Failed to get public URL');
        return null;
    }

    console.log('[Supabase] Success. URL:', publicUrlData.publicUrl);
    return publicUrlData.publicUrl;
  } catch (e: any) {
    console.error('[Supabase] Exception:', e.message || e);
    return null;
  }
};

export const base64ToBlob = (base64: string): Blob => {
    try {
        // Check if base64 is clean or has prefix
        const parts = base64.split(',');
        let mime = 'image/jpeg';
        let bstr;

        if (parts.length > 1) {
            // Has prefix e.g. "data:image/png;base64,..."
            const mimeMatch = parts[0].match(/:(.*?);/);
            if (mimeMatch) mime = mimeMatch[1];
            bstr = atob(parts[1]);
        } else {
            // Raw base64, assume jpeg unless detected otherwise (hard to detect without prefix, assume standard)
            bstr = atob(base64);
        }

        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
            u8arr[n] = bstr.charCodeAt(n);
        }
        return new Blob([u8arr], { type: mime });
    } catch (e) {
        console.error("Error converting base64 to blob", e);
        // Return a safe empty blob to prevent crash, though upload will likely fail or be empty
        return new Blob([], { type: 'image/jpeg' });
    }
};
