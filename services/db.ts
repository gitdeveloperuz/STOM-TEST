
import { 
    Treatment, Category, SiteConfig, Advertisement, AdminUser, ChatMessage, 
    ChatSession, CartItem, Announcement, TelegramUser, Order, 
    BotConfig, TelegramMenuCommand, TelegramProfileConfig, FirebaseConfig, 
    BotState, SystemCheckResult 
} from '../types';
import { TELEGRAM_BOT_TOKEN, TELEGRAM_ADMIN_ID } from '../constants';
import { getFirestoreInstance, listenToCollection, setDocument, deleteDocument, batchSave, getDocument } from './firebase';
import { getDoc, doc, collection, getDocs } from 'firebase/firestore';

export const UZB_OFFSET = 5 * 60 * 60 * 1000;

// Init DB (Firestore auto-inits on first usage via getFirestoreInstance, this is a placeholder for migration compatibility)
export const initDB = async () => {
    console.log('Database initialized (Firestore)');
};

// --- Config ---
export const setDynamicTelegramConfig = (token: string, adminId: string) => {
    // These values are typically used in cloud functions or runtime checks
    // In this frontend context, they might update local state if needed
};

export const initializeFirebaseListeners = async (config: FirebaseConfig) => {
    getFirestoreInstance(config);
};

export const isCloudConfigured = () => true;

// --- Treatments ---
export const saveTreatment = async (treatment: Treatment) => {
    await setDocument('treatments', treatment);
};

export const deleteTreatment = async (id: string) => {
    await deleteDocument('treatments', id);
};

export const subscribeToTreatments = (callback: (data: Treatment[]) => void, onError?: (err: any) => void) => {
    return listenToCollection('treatments', callback);
};

// --- Categories ---
export const saveCategory = async (category: Category) => {
    await setDocument('categories', category);
};

export const deleteCategory = async (id: string) => {
    await deleteDocument('categories', id);
};

export const subscribeToCategories = (callback: (data: Category[]) => void) => {
    return listenToCollection('categories', callback);
};

// --- Site Config ---
export const saveSiteConfig = async (config: SiteConfig) => {
    await setDocument('site_config', config);
};

export const subscribeToSiteConfig = (callback: (data: SiteConfig | null) => void) => {
    return listenToCollection('site_config', (docs) => {
        if (docs.length > 0) callback(docs[0] as SiteConfig);
        else callback(null);
    });
};

// --- Users & Orders ---
export const trackTgUser = async (userId: string, data: Partial<TelegramUser>) => {
    await setDocument('tg_users', { id: userId, ...data, lastActive: Date.now() });
};

export const subscribeToTelegramUsers = (callback: (data: TelegramUser[]) => void) => {
    return listenToCollection('tg_users', callback);
};

export const updateTelegramUser = async (user: TelegramUser) => {
    await setDocument('tg_users', user);
};

export const deleteTelegramUser = async (userId: string) => {
    await deleteDocument('tg_users', userId);
};

// --- Admins ---
export const saveAdmin = async (admin: AdminUser) => {
    await setDocument('admins', admin);
};

export const getAllAdmins = async (): Promise<AdminUser[]> => {
    const db = getFirestoreInstance();
    const snap = await getDocs(collection(db, 'admins'));
    return snap.docs.map(d => d.data() as AdminUser);
};

export const subscribeToAdmins = (callback: (data: AdminUser[]) => void) => {
    return listenToCollection('admins', callback);
};

export const authenticateAdmin = async (email: string, pass: string): Promise<AdminUser | null> => {
    const admins = await getAllAdmins();
    const admin = admins.find(a => a.email.toLowerCase() === email.toLowerCase());
    // Simple password check (In production, use hashing or Firebase Auth)
    if (admin && (admin.password === pass)) return admin;
    return null;
};

// --- Chat ---

// Rate Limit State
const messageTimestamps: Record<string, number[]> = {};
const userBlocks: Record<string, number> = {};

export const sendMessage = async (sessionId: string, text: string, sender: 'user'|'admin', type?: string, mediaUrl?: string, mediaType?: 'photo'|'video'|'audio'|'document') => {
    if (sender === 'user') {
        const now = Date.now();
        
        // 1. Check if user is temporarily blocked locally
        if (userBlocks[sessionId] && userBlocks[sessionId] > now) {
             throw new Error(`SPAM_LIMIT:${userBlocks[sessionId]}`);
        }

        // 2. Initialize history
        if (!messageTimestamps[sessionId]) messageTimestamps[sessionId] = [];
        
        // 3. Clean up old timestamps (keep last 60 seconds)
        const windowMs = 60000;
        messageTimestamps[sessionId] = messageTimestamps[sessionId].filter(t => now - t < windowMs);
        
        // 4. Check limit (e.g., max 5 messages per minute)
        const MAX_MSGS_PER_MIN = 5;
        if (messageTimestamps[sessionId].length >= MAX_MSGS_PER_MIN) {
            // Block for 2 minutes
            const blockUntil = now + 120000;
            userBlocks[sessionId] = blockUntil;
            throw new Error(`SPAM_LIMIT:${blockUntil}`);
        }

        // 5. Add current timestamp
        messageTimestamps[sessionId].push(now);
    }

    const msgId = `msg-${Date.now()}`;
    const message: ChatMessage = {
        id: msgId,
        text,
        sender,
        timestamp: Date.now(),
        read: false,
        mediaUrl,
        mediaType
    };
    
    // Store message in a session-specific collection
    await setDocument(`chat_${sessionId}`, message);
    
    // Update session info
    const currentSessionDoc = await getDocument('sessions', sessionId);
    const currentSession = currentSessionDoc as ChatSession | null;
    
    const newUnreadCount = sender === 'user' ? (currentSession?.unreadCount || 0) + 1 : 0;
    
    const sessionUpdate: ChatSession = {
        id: sessionId,
        userId: sessionId,
        userName: currentSession?.userName || `User ${sessionId.slice(0, 4)}`,
        lastMessage: text || (mediaType ? `[${mediaType}]` : '...'),
        lastMessageTime: Date.now(),
        unreadCount: newUnreadCount,
        blocked: currentSession?.blocked
    };
    
    await setDocument('sessions', sessionUpdate);
    return message;
};

export const subscribeToChatMessages = (sessionId: string, callback: (msgs: ChatMessage[]) => void) => {
    return listenToCollection(`chat_${sessionId}`, callback);
};

export const subscribeToAllSessions = (callback: (sessions: ChatSession[]) => void) => {
    return listenToCollection('sessions', callback);
};

export const subscribeToSession = (sessionId: string, callback: (session: ChatSession | null) => void) => {
    return listenToCollection('sessions', (data) => {
        const session = data.find(s => s.id === sessionId);
        callback(session || null);
    });
};

export const markSessionRead = async (sessionId: string) => {
    await setDocument('sessions', { id: sessionId, unreadCount: 0 });
};

export const deleteMessage = async (sessionId: string, msgId: string) => {
    await deleteDocument(`chat_${sessionId}`, msgId);
};

export const deleteChatSession = async (sessionId: string) => {
    await deleteDocument('sessions', sessionId);
    // Note: Firestore sub-collections or separate collections need manual deletion, 
    // but in client SDK we can't easily delete a whole collection. 
    // For now we just remove the session entry.
};

export const editMessage = async (sessionId: string, msgId: string, newText: string) => {
    await setDocument(`chat_${sessionId}`, { id: msgId, text: newText });
};

export const updateMessageTelegramId = async (sessionId: string, msgId: string, tgId: number) => {
    await setDocument(`chat_${sessionId}`, { id: msgId, telegramMessageId: tgId });
};

export const toggleSessionBlock = async (sessionId: string) => {
    const s = await getDocument('sessions', sessionId) as ChatSession;
    const newState = !s?.blocked;
    await setDocument('sessions', { id: sessionId, blocked: newState });
    return newState;
};

// --- Telegram Bot API Helpers (Mock/Stub for Client-side) ---
// In a real app, these would call a backend function (Firebase Cloud Function) 
// to interact with the Telegram Bot API securely.

export const notifyAdminsOfWebMessage = async (msgId: string, text: string, sessionId: string) => {
    // Placeholder for backend notification logic
};

export const replyToTelegramUser = async (chatId: string, text: string, file?: File) => {
    // Placeholder for backend logic
    return { ok: true, result: { message_id: Date.now() }, description: 'Sent via backend' };
};

export const editTelegramMessage = async (chatId: string, msgId: number, text: string, isMedia: boolean) => {
    // Placeholder for backend logic
};

export const processBotUpdates = async (token: string, adminIds: string[]) => {
    // Placeholder: This should be running in a backend environment (Node.js), not browser.
    // However, if running a client-side polling mechanism (not recommended for prod), implementation would go here.
};

export const setTelegramMyCommands = async (token: string, commands: TelegramMenuCommand[]) => {
    return { ok: true, description: 'Commands set' };
};

export const syncTelegramProfile = async (token: string, profile: TelegramProfileConfig) => {
    return [{ action: 'setMyName', ok: true }];
};

// --- Backup & Analytics ---
export const createBackup = async () => {
    // Mock backup generator
    return { data: {} };
};

export const restoreBackup = async (data: any) => {
    // Mock restore
};

export const subscribeToAnalytics = (callback: (data: any[]) => void) => {
    return listenToCollection('analytics', callback);
};

export const logAnalyticsEvent = async (eventName: string, data: any) => {
    await setDocument('analytics', { id: `ev-${Date.now()}-${Math.random()}`, eventName, ...data, timestamp: Date.now() });
};

// --- Diagnostics ---
export const diagnoseSystem = async (config: SiteConfig): Promise<SystemCheckResult[]> => {
    // Simplified checks
    const results: SystemCheckResult[] = [];
    if (!config.telegram?.botToken) {
        results.push({ id: 'tg', name: 'Telegram', status: 'warning', message: 'Bot token missing' });
    } else {
        results.push({ id: 'tg', name: 'Telegram', status: 'ok', message: 'Token present' });
    }
    return results;
};
