
import { createClient } from '@supabase/supabase-js';

// Initial check for environment variables, but don't strictly require them
const defaultSupabaseUrl = process.env.VITE_SUPABASE_URL || '';
const defaultSupabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';

let supabaseInstance: any = null;
let currentBucket = 'images'; // Default bucket

const createSupabaseClient = (url: string, key: string) => {
  const cleanUrl = url.trim();
  const cleanKey = key.trim();
  
  if (cleanUrl && cleanKey) {
    try {
      return createClient(cleanUrl, cleanKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false
        }
      });
    } catch (e) {
      console.warn("Failed to create Supabase client with provided credentials:", e);
    }
  }
  
  // Mock client if credentials are missing
  return {
    storage: {
      from: () => ({
        upload: async () => ({ error: { message: "Supabase not configured or invalid credentials" }, data: null }),
        getPublicUrl: () => ({ data: { publicUrl: "" } }),
        remove: async () => ({ error: null, data: [] })
      })
    }
  } as any;
};

// Initialize with defaults if available
supabaseInstance = createSupabaseClient(defaultSupabaseUrl, defaultSupabaseAnonKey);

export const updateSupabaseConfig = (url: string, key: string, bucketName?: string) => {
    if (url && key) {
        supabaseInstance = createSupabaseClient(url, key);
        console.log("Supabase client updated with new credentials");
    }
    if (bucketName) {
        currentBucket = bucketName.trim();
        console.log(`Supabase bucket set to: ${currentBucket}`);
    }
};

// Legacy export compatibility
export const supabase = supabaseInstance;

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

// Helper to convert File/Blob to Base64
const fileToBase64 = (file: File | Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
};

// Helper to compress image for local storage fallback
const compressImageForFallback = (file: File | Blob): Promise<string> => {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;
                const MAX_DIM = 800; // Aggressive compression for DB storage
                
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
                    // Low quality jpeg to keep string size down
                    resolve(canvas.toDataURL('image/jpeg', 0.6));
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

export const uploadToSupabase = async (file: File | Blob, folder: string = 'uploads'): Promise<string | null> => {
  const client = supabaseInstance;

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

    // Sanitize bucket name
    const bucket = currentBucket || 'images';

    const { data, error } = await client.storage
      .from(bucket) 
      .upload(fullPath, fileToUpload, {
        cacheControl: '3600',
        upsert: true,
        contentType: mimeType
      });

    if (error) {
      console.error(`[Supabase] Upload Failed to bucket '${bucket}':`, error.message);
      return null;
    }

    if (!data) {
        console.error('[Supabase] No data returned from upload');
        return null;
    }

    const { data: publicUrlData } = client.storage
      .from(bucket)
      .getPublicUrl(fullPath);

    if (!publicUrlData || !publicUrlData.publicUrl) {
        console.error('[Supabase] Failed to get public URL');
        return null;
    }

    return publicUrlData.publicUrl;
  } catch (e: any) {
    console.error('[Supabase] Exception:', e.message || e);
    return null;
  }
};

export const deleteFromSupabase = async (urls: string[]) => {
  const client = supabaseInstance;
  if (!urls || urls.length === 0) return;

  // Group files by bucket to handle deletions correctly even if buckets changed
  const filesByBucket: Record<string, string[]> = {};
  const defaultBucket = currentBucket || 'images';

  urls.forEach(url => {
      if (!url || typeof url !== 'string' || !url.startsWith('http')) return;

      // Try to extract bucket and path from standard Supabase URL structure
      // Format: https://[project].supabase.co/storage/v1/object/public/[bucket]/[path]
      const match = url.match(/\/storage\/v1\/object\/public\/([^/]+)\/(.+)$/);

      if (match) {
          const bucket = match[1];
          const path = decodeURIComponent(match[2]);
          
          if (!filesByBucket[bucket]) filesByBucket[bucket] = [];
          filesByBucket[bucket].push(path);
      } else {
          // Fallback: If URL doesn't match standard pattern, try to split by current configured bucket
          if (url.includes(`/${defaultBucket}/`)) {
              const parts = url.split(`/${defaultBucket}/`);
              if (parts.length > 1) {
                  const path = decodeURIComponent(parts[1]);
                  if (!filesByBucket[defaultBucket]) filesByBucket[defaultBucket] = [];
                  filesByBucket[defaultBucket].push(path);
              }
          }
      }
  });

  // Execute removals per bucket
  for (const [bucket, paths] of Object.entries(filesByBucket)) {
      if (paths.length > 0) {
          try {
              const { data, error } = await client.storage
                  .from(bucket)
                  .remove(paths);
              
              if (error) {
                  console.error(`Error deleting from Supabase bucket [${bucket}]:`, error);
              } else {
                  console.log(`Deleted ${paths.length} files from Supabase bucket [${bucket}]`);
              }
          } catch (e) {
              console.error(`Exception deleting from Supabase bucket [${bucket}]:`, e);
          }
      }
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
