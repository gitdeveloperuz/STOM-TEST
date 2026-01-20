import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { 
    getFirestore, 
    doc, 
    setDoc, 
    deleteDoc, 
    collection, 
    onSnapshot, 
    writeBatch,
    type Firestore,
    getDoc,
    query,
    orderBy,
    type DocumentSnapshot,
    waitForPendingWrites
} from 'firebase/firestore';
import { FirebaseConfig } from '../types';

// Default configuration from environment variables or provided defaults
const DEFAULT_FIREBASE_CONFIG: FirebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY || "AIzaSyD4TgCdJOnDv43XP_iGuuUmMuGP5jaSpIM",
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || "couz-1d994.firebaseapp.com",
  projectId: process.env.VITE_FIREBASE_PROJECT_ID || "couz-1d994",
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || "couz-1d994.firebasestorage.app",
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "1069146264746",
  appId: process.env.VITE_FIREBASE_APP_ID || "1:1069146264746:web:35778453adc52927362cd3",
  measurementId: process.env.VITE_FIREBASE_MEASUREMENT_ID || "G-33PGSJH4G8"
};

// Validate critical firebase config only if it's being used as default
if (!DEFAULT_FIREBASE_CONFIG.apiKey || !DEFAULT_FIREBASE_CONFIG.projectId) {
    console.warn("Missing Firebase Environment Variables. App will run but DB might fail if not configured dynamically.");
}

let firestoreInstance: Firestore | null = null;

// Singleton initializer for Firestore
export const getFirestoreInstance = (customConfig?: FirebaseConfig): Firestore => {
    if (firestoreInstance) {
        return firestoreInstance;
    }

    // Use custom config if valid, otherwise fallback to defaults
    const config = (customConfig && customConfig.apiKey && customConfig.apiKey.length > 5) 
        ? customConfig 
        : DEFAULT_FIREBASE_CONFIG;
    
    if (!config.apiKey) {
        throw new Error("Firebase Configuration is missing. Please check environment variables.");
    }

    let app: FirebaseApp;
    const apps = getApps();
    
    if (!apps.length) {
        try {
            app = initializeApp(config);
        } catch (e) {
            console.warn("Firebase initialization retry due to duplicate app:", e);
            app = getApps()[0];
        }
    } else {
        app = apps[0];
    }
    
    try {
        // Ensure app is valid
        if (!app) throw new Error("Firebase App not initialized");
        
        firestoreInstance = getFirestore(app);
        console.log("🔥 Firebase Firestore Connected:", config.projectId);
    } catch (error: any) {
        console.error("Error initializing Firestore:", error);
        throw new Error(`Firestore Init Failed: ${error.message}`);
    }
    
    return firestoreInstance;
};

// --- Helper: Deep Clean / Sanitize Data ---
const sanitizeData = (data: any): any => {
    const seen = new WeakSet();
    
    const clean = (obj: any): any => {
        if (obj === null || typeof obj !== 'object') {
            if (obj === undefined) return null; // Convert undefined to null for Firestore
            return obj;
        }
        
        // Handle specialized objects
        if (obj instanceof Date) return obj;
        
        // Circular reference check
        if (seen.has(obj)) {
            return null; 
        }
        seen.add(obj);

        if (Array.isArray(obj)) {
            return obj.map(clean);
        }

        // Handle DOM Nodes or other weird objects that might have slipped in
        if (obj.nodeType) return null; 

        const newObj: any = {};
        for (const key in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, key)) {
                // Skip internal React properties or potential large/dangerous keys if necessary
                if (key.startsWith('__')) continue; 
                
                const val = clean(obj[key]);
                if (val !== undefined && typeof val !== 'function') {
                    newObj[key] = val;
                }
            }
        }
        return newObj;
    };

    return clean(data);
};

// --- Helper: Retry Logic & Global Write Queue ---
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Global promise chain to serialize writes
let writeQueue = Promise.resolve();

const enqueueWrite = async <T>(operation: () => Promise<T>): Promise<T> => {
    // We attach the new operation to the queue. 
    // We use .then(run, run) to ensure the chain continues even if previous ops failed.
    const nextOp = writeQueue.then(
        () => operation(), // Previous succeeded
        () => operation()  // Previous failed (ignore error, run new op)
    ).then(async (result) => {
        const db = getFirestoreInstance();
        // Wait for server acknowledgment to prevent "resource exhausted" on rapid writes
        await waitForPendingWrites(db);
        await delay(300); // Buffer
        return result;
    }).catch((e: any) => {
        if (e.code === 'permission-denied') {
            console.error("🔥 PERMISSION DENIED: Please check your 'firestore.rules' file in the Firebase Console.");
        } else if (e.code === 'resource-exhausted') {
            console.error("🔥 RESOURCE EXHAUSTED: Too many writes. Slowing down...");
        } else {
            console.error("Write operation failed in queue:", e);
        }
        throw e;
    });

    // Update the queue pointer to this new operation (catching its error so the *next* append doesn't fail immediately)
    writeQueue = nextOp.then(() => {}).catch(() => {});

    // Return the operation result (or error) to the caller
    return nextOp;
};

const retryOperation = async <T>(operation: () => Promise<T>, retries = 5, backoff = 2000): Promise<T> => {
    try {
        return await operation();
    } catch (error: any) {
        // Check for specific error codes or messages indicating rate limits or connection issues
        const isResourceExhausted = error.code === 'resource-exhausted' || (error.message && error.message.includes('resource-exhausted'));
        const isUnavailable = error.code === 'unavailable';
        
        if (retries > 0 && (isResourceExhausted || isUnavailable)) {
            // Very aggressive backoff if resource exhausted
            const waitTime = isResourceExhausted ? backoff * 5 : backoff; 
            console.warn(`Firestore operation failed (${error.code || error.message}), retrying in ${waitTime}ms...`);
            await delay(waitTime);
            return retryOperation(operation, retries - 1, backoff * 2);
        }
        throw error;
    }
};

// --- Real-time and CRUD Operations ---

export const getDocument = async (collectionName: string, docId: string) => {
    try {
        const db = getFirestoreInstance();
        const docRef = doc(db, collectionName, docId);
        // Reads don't need strictly sequential queueing usually, but good to retry
        const snapshot = await retryOperation<DocumentSnapshot>(() => getDoc(docRef));
        if (snapshot.exists()) {
            return snapshot.data();
        }
        return null;
    } catch(e: any) {
        console.warn(`Error reading doc [${collectionName}/${docId}]:`, e.message);
        return null;
    }
};

export const setDocument = async (collectionName: string, data: any) => {
    return enqueueWrite(async () => {
        try {
            const db = getFirestoreInstance();
            
            let docId = data.id;
            if (collectionName === 'bot_states' && data.chatId) {
                docId = String(data.chatId);
            } else if (collectionName === 'site_config') {
                docId = 'hero_config';
            }

            if (!docId) {
                console.warn(`Document for [${collectionName}] must have a valid ID.`, data);
                return;
            }
            
            const docRef = doc(db, collectionName, String(docId));
            const sanitizedData = sanitizeData(data);
            
            if (!sanitizedData.id) sanitizedData.id = docId;

            await retryOperation(() => setDoc(docRef, { 
                ...sanitizedData, 
                _updatedAt: Date.now() 
            }, { merge: true }));
            
        } catch (e: any) {
            if (e.message && e.message.includes("Service firestore is not available")) {
                 console.warn(`Firebase unavailable for write [${collectionName}]: Service not available`);
            } else {
                 console.error(`Error writing to Firebase [${collectionName}]:`, e.message);
                 throw e;
            }
        }
    });
};

export const batchSave = async (collectionName: string, items: any[]) => {
    const db = getFirestoreInstance();
    // Ultra conservative batch size
    const chunkSize = 2; 
    
    for (let i = 0; i < items.length; i += chunkSize) {
        const chunk = items.slice(i, i + chunkSize);
        
        // We wrap the entire batch logic in the global write queue to ensure
        // it doesn't conflict with other ongoing single writes
        await enqueueWrite(async () => {
            const batch = writeBatch(db);
            
            chunk.forEach(item => {
                let docId = item.id;
                if (collectionName === 'bot_states' && item.chatId) docId = String(item.chatId);
                if (collectionName === 'site_config') docId = 'hero_config';
                
                if (docId) {
                    const docRef = doc(db, collectionName, String(docId));
                    const sanitized = sanitizeData(item);
                    if (!sanitized.id) sanitized.id = docId;
                    batch.set(docRef, { ...sanitized, _updatedAt: Date.now() }, { merge: true });
                }
            });
            
            try {
                await retryOperation(() => batch.commit());
                console.log(`✅ Batch synced ${chunk.length} items to ${collectionName}`);
            } catch (e: any) {
                console.error(`❌ Batch sync failed for ${collectionName}:`, e);
                if (e.code === 'resource-exhausted' || e.message?.includes('resource-exhausted')) {
                    // If exhausted, we throw so enqueueWrite logic can handle it or we handle it here by waiting long
                    await delay(10000);
                    throw e; // Retry
                }
                throw e;
            }
        });
    }
};

export const deleteDocument = async (collectionName: string, docId: string) => {
    return enqueueWrite(async () => {
        try {
            const db = getFirestoreInstance();
            const docRef = doc(db, collectionName, docId);
            await retryOperation(() => deleteDoc(docRef));
        } catch (e: any) {
            if (e.message && e.message.includes("Service firestore is not available")) {
                 console.warn(`Firebase unavailable for delete [${collectionName}]: Service not available`);
            } else {
                 console.error(`Error deleting from Firebase [${collectionName}]:`, e);
            }
        }
    });
};

export const listenToCollection = (collectionName: string, callback: (data: any[]) => void) => {
    try {
        const db = getFirestoreInstance();
        const collRef = collection(db, collectionName);
        
        return onSnapshot(collRef, (snapshot) => {
            const data = snapshot.docs.map(d => d.data());
            
            if (collectionName === 'chat_messages') {
                data.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
            } else if (collectionName === 'sessions' || collectionName === 'tg_users') {
                data.sort((a, b) => (b.lastActive || b.lastMessageTime || 0) - (a.lastActive || a.lastMessageTime || 0));
            } else if (collectionName === 'treatments' || collectionName === 'announcements' || collectionName === 'ads') {
                data.sort((a, b) => {
                    if (a.createdAt && b.createdAt) return b.createdAt - a.createdAt;
                    const idA = String(a.id || '');
                    const idB = String(b.id || '');
                    return idB.localeCompare(idA);
                });
            } else {
                data.sort((a, b) => String(a.id || '').localeCompare(String(b.id || '')));
            }

            callback(data);
        }, (error) => {
            console.error(`Firebase listener error for [${collectionName}]:`, error);
        });
    } catch (e: any) {
        console.error("Error setting up listener:", e);
        return () => {};
    }
};

export const migrateDataToFirebase = async (backupData: any, customConfig?: FirebaseConfig) => {
    console.log("🚀 Starting Cloud Migration...");
    // Ensure we are connected
    getFirestoreInstance(customConfig); 

    const stores = Object.keys(backupData.data);
    let totalMigrated = 0;
    let errors = 0;

    for (const storeName of stores) {
        const items = backupData.data[storeName];
        if (!Array.isArray(items) || items.length === 0) continue;

        console.log(`📦 Migrating [${items.length}] items from [${storeName}]...`);
        try {
            await batchSave(storeName, items);
            totalMigrated += items.length;
        } catch (e) {
            console.error(`Error migrating ${storeName}:`, e);
            errors += items.length;
        }
    }

    console.log(`🏁 Migration finished. Total successfully uploaded: ${totalMigrated}. Errors: ${errors}`);
    return { totalMigrated, errors };
};