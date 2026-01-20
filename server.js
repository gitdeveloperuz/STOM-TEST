
import TelegramBot from 'node-telegram-bot-api';
import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import dotenv from 'dotenv';

dotenv.config();

// --- CONFIGURATION ---
const BOT_TOKEN = process.env.VITE_TELEGRAM_BOT_TOKEN || 'YOUR_BOT_TOKEN_HERE';
const ADMIN_IDS = (process.env.VITE_TELEGRAM_ADMIN_ID || '').split(',').map(id => id.trim());

// Initialize Firebase Admin
// You must download serviceAccountKey.json from Firebase Console -> Project Settings -> Service Accounts
try {
    const serviceAccount = JSON.parse(readFileSync('./serviceAccountKey.json', 'utf8'));
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
    console.log('🔥 Firebase Admin Initialized');
} catch (error) {
    console.error('❌ Error initializing Firebase Admin. Make sure "serviceAccountKey.json" is in the root folder.');
    console.error(error.message);
    process.exit(1);
}

const db = admin.firestore();
const bot = new TelegramBot(BOT_TOKEN, { polling: true });

console.log('🤖 Telegram Bot Started...');

// --- BOT LOGIC ---

// 1. Handle /start command
bot.onText(/\/start/, async (msg) => {
    const chatId = msg.chat.id;
    const user = msg.from;

    // Save User to Firestore
    const userRef = db.collection('tg_users').doc(String(chatId));
    await userRef.set({
        id: String(chatId),
        firstName: user.first_name || '',
        lastName: user.last_name || '',
        username: user.username || '',
        language: user.language_code || 'uz',
        lastActive: Date.now(),
        source: 'bot'
    }, { merge: true });

    const welcomeMsg = `👋 <b>Assalomu alaykum, ${user.first_name}!</b>\n\nStomatologiya.uz platformasiga xush kelibsiz.\nQuyidagi tugma orqali mahsulotlarni ko'rishingiz mumkin.`;

    const opts = {
        parse_mode: 'HTML',
        reply_markup: {
            keyboard: [
                [{ text: "🦷 Mahsulotlar & Buyurtma", web_app: { url: "https://stomshop.uz" } }], // Replace with your actual Vercel/Hosting URL
                [{ text: "📞 Admin bilan aloqa" }, { text: "ℹ️ Biz haqimizda" }]
            ],
            resize_keyboard: true
        }
    };

    bot.sendMessage(chatId, welcomeMsg, opts);
});

// 2. Handle Web App Data (Orders)
bot.on('message', async (msg) => {
    const chatId = msg.chat.id;

    if (msg.web_app_data) {
        try {
            const data = JSON.parse(msg.web_app_data.data);
            
            if (data.type === 'ORDER') {
                const orderText = `✅ <b>Yangi Buyurtma qabul qilindi!</b>\n\n🆔 <b>Buyurtma ID:</b> #${data.orderId}\n📞 <b>Telefon:</b> ${data.phone}\n💰 <b>Jami:</b> ${data.totalAmount}\n\n📦 <b>Mahsulotlar:</b>\n${data.itemsSummary}`;
                
                // 1. Send confirmation to User
                await bot.sendMessage(chatId, orderText, { parse_mode: 'HTML' });
                
                // 2. Save Order to Firestore (Already handled by Frontend, but we can double ensure or update status)
                // Note: The frontend app actually saves the order to Firestore directly. 
                // We just need to notify Admins here.

                // 3. Notify Admins
                for (const adminId of ADMIN_IDS) {
                    if (adminId) {
                        await bot.sendMessage(adminId, `🚨 <b>ADMIN: Yangi Buyurtma (Web)</b>\n\nKimdan: ${msg.from.first_name} (@${msg.from.username})\n${orderText}`, { parse_mode: 'HTML' });
                    }
                }
            }
        } catch (e) {
            console.error("Error parsing WebApp data:", e);
        }
    }
});

// 3. Handle Chat Messages (Sync with Admin Panel)
bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;

    // Ignore commands and web app data
    if (!text || text.startsWith('/') || msg.web_app_data) return;

    if (text === "📞 Admin bilan aloqa") {
        bot.sendMessage(chatId, "Savolingizni yozib qoldiring, operatorlarimiz tez orada javob berishadi.");
        return;
    }

    if (text === "ℹ️ Biz haqimizda") {
        bot.sendMessage(chatId, "Stomatologiya.uz - Stomatologlar uchun eng yaxshi uskunalar do'koni.");
        return;
    }

    // Save message to Firestore for the React Admin Panel
    const sessionId = String(chatId);
    const msgId = `msg-${Date.now()}`;
    
    // Update Session
    await db.collection('sessions').doc(sessionId).set({
        id: sessionId,
        userId: sessionId,
        userName: `${msg.from.first_name} ${msg.from.last_name || ''}`,
        lastMessage: text,
        lastMessageTime: Date.now(),
        unreadCount: admin.firestore.FieldValue.increment(1)
    }, { merge: true });

    // Add Message
    await db.collection(`chat_${sessionId}`).doc(msgId).set({
        id: msgId,
        text: text,
        sender: 'user',
        timestamp: Date.now(),
        read: false,
        telegramMessageId: msg.message_id
    });

    // Notify Admins about new message
    // (Optional: You can uncomment this if you want Telegram notifications for every chat message)
    /*
    for (const adminId of ADMIN_IDS) {
        if (adminId) {
            bot.sendMessage(adminId, `📩 <b>Yangi Xabar</b>\nUser: ${msg.from.first_name}\nXabar: ${text}`, { parse_mode: 'HTML' });
        }
    }
    */
});

// 4. Listen for Admin Replies from Firestore (Outgoing)
// This listens to the 'sessions' collection for changes where we might want to push back to Telegram
// However, the cleanest way is for the Frontend to call an API. 
// Since we are running this script, let's listen to a special 'outgoing_queue' or just rely on the React app 
// calling the Telegram API directly if configured, OR we can listen to `chat_{sessionId}` for admin messages without `telegramMessageId`.

// We will use a listener on all chat collections is too expensive. 
// Instead, let's assume the React App saves to Firestore, and this Bot is primarily for Incoming.
// For Outgoing (Admin -> User), the React App `AdminChat.tsx` handles it via direct API calls or we can add a listener here.

