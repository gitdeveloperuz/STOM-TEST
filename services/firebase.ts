
import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { 
    getFirestore, 
    doc, 
    setDoc, 
    deleteDoc, 
    collection, 
    onSnapshot, 
    writeBatch,
    Firestore,
    query,
    orderBy
} from 'firebase/firestore';
import { FirebaseConfig } from '../types';

// Default configuration with User's credentials
const DEFAULT_FIREBASE_CONFIG: FirebaseConfig = {
  apiKey: "AIzaSyD4TgCdJOnDv43XP_iGuuUmMuGP5jaSpIM",
  authDomain: "couz-1d994.firebaseapp.com",
  projectId: "couz-1d994",
  storageBucket: "couz-1d994.firebasestorage.app",
  messagingSenderId: "1069146264746",
  appId: "1:1069146264746:web:35778453adc52927362cd3",
  measurementId: "G-33PGSJH4G8"
};

let firestoreInstance: Firestore | null = null;

// Singleton initializer for Firestore
export const getFirestoreInstance = (customConfig?: FirebaseConfig): Firestore => {
    if (firestoreInstance) {
        return firestoreInstance;
    }

    // Use custom config if valid, otherwise fallback to hardcoded defaults
    const config = (customConfig && customConfig.apiKey && customConfig.apiKey.length > 5) 
        ? customConfig 
        : DEFAULT_FIREBASE_CONFIG;
    
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

// --- Real-time and CRUD Operations ---

export const setDocument = async (collectionName: string, data: any) => {
    try {
        const db = getFirestoreInstance();
        
        let docId = data.id;
        if (collectionName === 'bot_states' && data.chatId) {
            docId = String(data.chatId);
        } else if (collectionName === 'site_config') {
            // Force hero_config for site settings
            docId = 'hero_config';
        }

        if (!docId) {
            console.warn(`Document for [${collectionName}] must have a valid ID.`, data);
            return;
        }
        
        const docRef = doc(db, collectionName, String(docId));
        
        // Remove undefined values to prevent Firebase errors
        const sanitizedData = JSON.parse(JSON.stringify(data));
        
        // Ensure ID is set in the document body as well
        if (!sanitizedData.id) sanitizedData.id = docId;

        await setDoc(docRef, { 
            ...sanitizedData, 
            _updatedAt: Date.now() // Add timestamp for sorting
        }, { merge: true });
    } catch (e: any) {
        if (e.message && e.message.includes("Service firestore is not available")) {
             console.warn(`Firebase unavailable for write [${collectionName}]: Service not available`);
        } else {
             console.error(`Error writing to Firebase [${collectionName}]:`, e);
        }
    }
};

export const batchSave = async (collectionName: string, items: any[]) => {
    const db = getFirestoreInstance();
    // Firestore batch limit is 500
    const chunkSize = 450; 
    
    for (let i = 0; i < items.length; i += chunkSize) {
        const chunk = items.slice(i, i + chunkSize);
        const batch = writeBatch(db);
        
        chunk.forEach(item => {
            let docId = item.id;
            if (collectionName === 'bot_states' && item.chatId) docId = String(item.chatId);
            if (collectionName === 'site_config') docId = 'hero_config';
            
            if (docId) {
                const docRef = doc(db, collectionName, String(docId));
                const sanitized = JSON.parse(JSON.stringify(item));
                // Ensure ID
                if (!sanitized.id) sanitized.id = docId;
                batch.set(docRef, { ...sanitized, _updatedAt: Date.now() }, { merge: true });
            }
        });
        
        try {
            await batch.commit();
            console.log(`✅ Batch synced ${chunk.length} items to ${collectionName}`);
        } catch (e) {
            console.error(`❌ Batch sync failed for ${collectionName}:`, e);
        }
    }
};

export const deleteDocument = async (collectionName: string, docId: string) => {
    try {
        const db = getFirestoreInstance();
        const docRef = doc(db, collectionName, docId);
        await deleteDoc(docRef);
    } catch (e: any) {
        if (e.message && e.message.includes("Service firestore is not available")) {
             console.warn(`Firebase unavailable for delete [${collectionName}]: Service not available`);
        } else {
             console.error(`Error deleting from Firebase [${collectionName}]:`, e);
        }
    }
};

export const listenToCollection = (collectionName: string, callback: (data: any[]) => void) => {
    try {
        const db = getFirestoreInstance();
        const collRef = collection(db, collectionName);
        
        return onSnapshot(collRef, (snapshot) => {
            const data = snapshot.docs.map(d => d.data());
            
            // SMART SORTING LOGIC
            // Ensure data presentation is stable (prevent jumping when edited) and logical
            
            if (collectionName === 'chat_messages') {
                // Messages: Oldest first (Timeline)
                data.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
            } else if (collectionName === 'sessions' || collectionName === 'tg_users') {
                // Chats/Users: Most recently active first
                data.sort((a, b) => (b.lastActive || b.lastMessageTime || 0) - (a.lastActive || a.lastMessageTime || 0));
            } else if (collectionName === 'treatments' || collectionName === 'announcements' || collectionName === 'ads') {
                // Content: Newest created first (Stable sort by ID/Timestamp)
                // We avoid _updatedAt here so items don't jump to top when edited
                data.sort((a, b) => {
                    // Try createdAt if available
                    if (a.createdAt && b.createdAt) return b.createdAt - a.createdAt;
                    
                    // Fallback to ID (assuming time-based IDs or at least stable string sort)
                    const idA = String(a.id || '');
                    const idB = String(b.id || '');
                    // Inverse sort for "Newest first" assuming ID roughly correlates to time
                    return idB.localeCompare(idA);
                });
            } else {
                // Default: Sort by ID to ensure stability
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
    const firestoreDb = getFirestoreInstance(customConfig); // Ensure init

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
