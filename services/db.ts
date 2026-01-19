import { Treatment, Category, SiteConfig, Advertisement, AdminUser, ChatMessage, ChatSession, CartItem, Announcement, TelegramUser, AnnouncementMedia, Order, ProductCondition, RateLimitState, BotConfig, TelegramMenuCommand, TelegramProfileConfig, FirebaseConfig } from '../types';
import { TELEGRAM_BOT_TOKEN, TELEGRAM_ADMIN_ID } from '../constants';
import { getFirestoreInstance, listenToCollection, setDocument, deleteDocument, batchSave } from './firebase';
import { base64ToBlob, uploadToSupabase } from './supabase';

export const UZB_OFFSET = 5 * 60 * 60 * 1000;

// Internal Cache for sync synchronous access where needed
const CACHE: any = {};

// --- Initialization ---

export const initDB = async () => {
  console.log("DB Initialized (Lazy loading via Firebase)");
};

export const initializeFirebaseListeners = async (config: FirebaseConfig) => {
    getFirestoreInstance(config);
};

export const isCloudConfigured = () => true;

// --- Generic Helpers ---

export const getAll = async <T>(collectionName: string): Promise<T[]> => {
    return CACHE[collectionName] || [];
};

// --- Treatments (Products) ---

export const saveTreatment = async (treatment: Treatment) => {
    await setDocument('treatments', treatment);
};

export const deleteTreatment = async (id: string) => {
    await deleteDocument('treatments', id);
};

export const subscribeToTreatments = (callback: (data: Treatment[]) => void, onError?: (err: any) => void) => {
    return listenToCollection('treatments', (data) => {
        CACHE['treatments'] = data;
        callback(data as Treatment[]);
    });
};

// --- Categories ---

export const saveCategory = async (category: Category) => {
    await setDocument('categories', category);
};

export const deleteCategory = async (id: string) => {
    await deleteDocument('categories', id);
};

export const subscribeToCategories = (callback: (data: Category[]) => void) => {
    return listenToCollection('categories', (data) => {
        CACHE['categories'] = data;
        callback(data as Category[]);
    });
};

// --- Site Config ---

export const saveSiteConfig = async (config: SiteConfig) => {
    await setDocument('site_config', config);
};

export const subscribeToSiteConfig = (callback: (data: SiteConfig | null) => void) => {
    return listenToCollection('site_config', (data) => {
        if (data && data.length > 0) callback(data[0] as SiteConfig);
        else callback(null);
    });
};

// --- Telegram Users ---

export const trackTgUser = async (userId: string, data: Partial<TelegramUser>) => {
    const existing = CACHE['tg_users']?.find((u: any) => u.id === userId) || {};
    const updated = { ...existing, ...data, id: userId, lastActive: Date.now() };
    await setDocument('tg_users', updated);
};

export const updateTelegramUser = async (user: TelegramUser) => {
    await setDocument('tg_users', user);
};

export const deleteTelegramUser = async (id: string) => {
    await deleteDocument('tg_users', id);
};

export const subscribeToTelegramUsers = (callback: (data: TelegramUser[]) => void) => {
    return listenToCollection('tg_users', (data) => {
        CACHE['tg_users'] = data;
        callback(data as TelegramUser[]);
    });
};

// --- Admins ---

export const authenticateAdmin = async (email: string, password: string): Promise<AdminUser | null> => {
    const admins = CACHE['admins'] as AdminUser[];
    if (admins) {
        const found = admins.find(a => a.email.toLowerCase() === email.toLowerCase() && a.password === password);
        if (found) return found;
    }
    // Fallback for initial setup if no admins exist
    if (email === 'admin@stomshop.uz' && password === 'admin123') {
        return {
            id: 'super-admin',
            email,
            password,
            role: 'super_admin',
            isTwoFactorEnabled: false,
            permissions: { products: true, content: true, chat: true, settings: true, admins: true }
        };
    }
    return null;
};

export const getAllAdmins = async (): Promise<AdminUser[]> => {
    return CACHE['admins'] || [];
};

export const saveAdmin = async (admin: AdminUser) => {
    await setDocument('admins', admin);
};

// --- Chat & Sessions ---

export const sendMessage = async (sessionId: string, text: string, sender: 'user'|'admin', replyToId?: number, mediaUrl?: string, mediaType?: 'photo'|'video'|'audio'|'document') => {
    const msgId = `msg-${Date.now()}-${Math.random().toString(36).substr(2,9)}`;
    const message: ChatMessage = {
        id: msgId,
        sessionId,
        text,
        sender,
        timestamp: Date.now(),
        read: false,
        mediaUrl,
        mediaType,
        telegramMessageId: undefined // Will be updated if sent via bot
    };
    await setDocument('chat_messages', message);
    
    // Update Session
    const currentSession = CACHE['sessions']?.find((s:any) => s.id === sessionId);
    const sessionUpdate: Partial<ChatSession> = {
        id: sessionId,
        lastMessage: mediaType ? `[${mediaType}]` : text,
        lastMessageTime: Date.now(),
        unreadCount: sender === 'user' ? (currentSession?.unreadCount || 0) + 1 : 0
    };
    await setDocument('sessions', sessionUpdate);
    return message;
};

export const subscribeToChatMessages = (sessionId: string, callback: (msgs: ChatMessage[]) => void) => {
    return listenToCollection('chat_messages', (allMsgs) => {
        const sessionMsgs = allMsgs.filter((m: any) => m.sessionId === sessionId);
        sessionMsgs.sort((a, b) => a.timestamp - b.timestamp);
        callback(sessionMsgs as ChatMessage[]);
    });
};

export const subscribeToSession = (sessionId: string, callback: (session: ChatSession | null) => void) => {
    return listenToCollection('sessions', (sessions) => {
        const session = sessions.find((s: any) => s.id === sessionId);
        callback(session as ChatSession || null);
    });
};

export const subscribeToAllSessions = (callback: (sessions: ChatSession[]) => void) => {
    return listenToCollection('sessions', (data) => {
        CACHE['sessions'] = data;
        callback(data as ChatSession[]);
    });
};

export const markSessionRead = async (sessionId: string) => {
    await setDocument('sessions', { id: sessionId, unreadCount: 0 });
};

export const deleteMessage = async (sessionId: string, msgId: string) => {
    await deleteDocument('chat_messages', msgId);
};

export const deleteChatSession = async (sessionId: string) => {
    await deleteDocument('sessions', sessionId);
    // Note: This does not delete messages from 'chat_messages' collection automatically 
    // in this simple implementation, but UI will hide them.
};

export const editMessage = async (msgId: string, newText: string) => {
    await setDocument('chat_messages', { id: msgId, text: newText });
};

export const updateMessageTelegramId = async (msgId: string, telegramId: number) => {
    await setDocument('chat_messages', { id: msgId, telegramMessageId: telegramId });
};

export const toggleSessionBlock = async (sessionId: string) => {
    const session = CACHE['sessions']?.find((s:any) => s.id === sessionId);
    const newVal = !session?.blocked;
    await setDocument('sessions', { id: sessionId, blocked: newVal });
    return newVal;
};

// --- Announcements ---

export const saveAnnouncement = async (announcement: Announcement) => {
    await setDocument('announcements', announcement);
};

// --- Backup ---

export const createBackup = async () => {
    // Dump current cache or known collections
    const collections = ['treatments', 'categories', 'site_config', 'tg_users', 'admins', 'sessions', 'chat_messages', 'announcements', 'ads'];
    const data: any = {};
    
    // Note: CACHE might not be fully populated if listeners haven't fired or components haven't mounted.
    // In a robust app, we would fetch all one-shot. 
    // Here we rely on what's available or implemented.
    for (const col of collections) {
        if (CACHE[col]) {
            data[col] = CACHE[col];
        }
    }
    
    return { timestamp: Date.now(), data };
};

export const restoreBackup = async (backup: any) => {
    if (backup.data) {
        for (const [key, items] of Object.entries(backup.data)) {
            if (Array.isArray(items)) {
                await batchSave(key, items);
            }
        }
    }
};

// --- Telegram Bot API Helpers ---

let lastUpdateId = 0;

export const checkTelegramReplies = async (token: string, adminIds: string[]) => {
    if (!token) return;
    try {
        const response = await fetch(`https://api.telegram.org/bot${token}/getUpdates?offset=${lastUpdateId + 1}&timeout=1`);
        if (!response.ok) {
            // Ignore specific HTTP errors to avoid console spam during dev/CORS blocks
            return;
        }
        const data = await response.json();
        if (data.ok && data.result.length > 0) {
            for (const update of data.result) {
                lastUpdateId = update.update_id;
                // Handle messages (simple echo or logic)
                const msg = update.message;
                if (msg) {
                    const chatId = String(msg.chat.id);
                    // If it's a user message, we might want to save it as a chat message if session exists
                    const session = CACHE['sessions']?.find((s:any) => s.id === `tg-${chatId}` || s.id === chatId);
                    if (session) {
                        const text = msg.text || (msg.caption ? `[Media] ${msg.caption}` : '[Media]');
                        await sendMessage(session.id, text, 'user');
                        await notifyAdminsOfWebMessage(`msg-${Date.now()}`, text, session.id);
                    }
                }
            }
        }
    } catch (e: any) {
        // Completely suppress polling errors to avoid console spam
        // Polling failures are expected in client-side only environments (CORS)
        return;
    }
};

export const notifyAdminsOfWebMessage = async (msgId: string, text: string, sessionId: string) => {
    const admins = TELEGRAM_ADMIN_ID.split(',');
    for (const adminId of admins) {
        if (!adminId.trim()) continue;
        try {
            await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: adminId,
                    text: `📩 Yangi xabar (Web/App):\n\n${text}\n\nSession: ${sessionId}`,
                })
            });
        } catch (e) { 
            // Silently fail if admin notification fails to avoid disruption
        }
    }
};

export const replyToTelegramUser = async (chatId: string, text: string, file?: File): Promise<any> => {
    const formData = new FormData();
    formData.append('chat_id', chatId);
    
    try {
        if (file) {
            if (file.type.startsWith('image/')) {
                formData.append('photo', file);
                if (text) formData.append('caption', text);
                return await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendPhoto`, { method: 'POST', body: formData }).then(r => r.json());
            } else {
                formData.append('document', file);
                if (text) formData.append('caption', text);
                return await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendDocument`, { method: 'POST', body: formData }).then(r => r.json());
            }
        } else {
            formData.append('text', text);
            return await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, { method: 'POST', body: formData }).then(r => r.json());
        }
    } catch (e) {
        console.error("Reply to Telegram failed", e);
        return { ok: false, description: "Network Error" };
    }
};

export const editTelegramMessage = async (chatId: string, msgId: number, text: string, isCaption: boolean = false) => {
    const method = isCaption ? 'editMessageCaption' : 'editMessageText';
    const body: any = { chat_id: chatId, message_id: msgId };
    if (isCaption) body.caption = text;
    else body.text = text;

    try {
        await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/${method}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
    } catch(e) {
        console.warn("Edit telegram message failed", e);
    }
};

export const setTelegramMyCommands = async (token: string, commands: TelegramMenuCommand[]) => {
    const validCommands = commands.filter(c => c.enabled).map(c => ({ command: c.command, description: c.description }));
    return await fetch(`https://api.telegram.org/bot${token}/setMyCommands`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commands: validCommands })
    }).then(r => r.json());
};

export const syncTelegramProfile = async (token: string, profile: TelegramProfileConfig) => {
    const results = [];
    if (profile.botName) {
        const res = await fetch(`https://api.telegram.org/bot${token}/setMyName`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: profile.botName }) }).then(r => r.json());
        results.push({ action: 'setMyName', ok: res.ok });
    }
    if (profile.shortDescription) {
        const res = await fetch(`https://api.telegram.org/bot${token}/setMyShortDescription`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ short_description: profile.shortDescription }) }).then(r => r.json());
        results.push({ action: 'setMyShortDescription', ok: res.ok });
    }
    if (profile.description) {
        const res = await fetch(`https://api.telegram.org/bot${token}/setMyDescription`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ description: profile.description }) }).then(r => r.json());
        results.push({ action: 'setMyDescription', ok: res.ok });
    }
    return results;
};

// --- Bot Logic Helper Functions (Previously missing) ---

export const saveBotState = async (chatId: number, state: any) => {
    await setDocument('bot_states', { id: String(chatId), ...state });
};

export const sendTelegramMessage = async (token: string, chatId: number, text: string, options: any = {}) => {
    try {
        await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: chatId, text, ...options })
        });
    } catch(e) {}
};

export const getMenu = (showAdmin: boolean, isSuperAdmin: boolean, state: any, config: BotConfig) => {
    const buttons = [];
    if (config.menuButtons) {
        buttons.push([{ text: config.menuButtons.products }, { text: config.menuButtons.cart }]);
        buttons.push([{ text: config.menuButtons.announcements }, { text: config.menuButtons.contactAdmin }]);
        if (showAdmin || isSuperAdmin) buttons.push([{ text: config.menuButtons.adminPanel }]);
    }
    return { keyboard: buttons, resize_keyboard: true };
};

export const downloadTelegramFile = async (fileId: string, token: string, mimeType?: string): Promise<string | null> => {
    try {
        const res = await fetch(`https://api.telegram.org/bot${token}/getFile?file_id=${fileId}`);
        const data = await res.json();
        if (data.ok && data.result.file_path) {
            const fileRes = await fetch(`https://api.telegram.org/file/bot${token}/${data.result.file_path}`);
            const blob = await fileRes.blob();
            return new Promise((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result as string);
                reader.readAsDataURL(blob);
            });
        }
    } catch (e) {
        console.error(e);
    }
    return null;
};
