
import { MongoClient } from 'mongodb';
import admin from 'firebase-admin';
import { readFileSync } from 'fs';

// --- CONFIGURATION ---
// ⚠️ SECURITY WARNING: Change your MongoDB password after running this!
const MONGO_URI = "mongodb+srv://mirsaid7787_db_user:1tXUT15RUi89qr3L@stomshop-cluster.rrwsw8f.mongodb.net/?appName=stomshop-cluster";
const MONGO_DB_NAME = "test"; // Usually 'test' is default in Atlas, change if your DB name is different

// Initialize Firebase Admin
try {
    const serviceAccount = JSON.parse(readFileSync('./serviceAccountKey.json', 'utf8'));
    // Check if already initialized to prevent errors
    if (!admin.apps.length) {
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
    }
    console.log('🔥 Firebase Admin Connected');
} catch (error) {
    console.error('❌ Error: "serviceAccountKey.json" not found.');
    console.error('Please download it from Firebase Console -> Project Settings -> Service Accounts');
    process.exit(1);
}

const firestore = admin.firestore();

async function migrate() {
    const client = new MongoClient(MONGO_URI);

    try {
        await client.connect();
        console.log('🍃 MongoDB Connected');

        const db = client.db(MONGO_DB_NAME);
        
        // 1. Fetch Data
        console.log('📥 Reading from MongoDB...');
        const webMessages = await db.collection('webMessages').find({}).toArray();
        const tgMessages = await db.collection('telegramMessages').find({}).toArray();

        console.log(`Found ${webMessages.length} Web messages and ${tgMessages.length} Telegram messages.`);

        const allMessages = [
            ...webMessages.map(m => ({ ...m, source: 'web' })),
            ...tgMessages.map(m => ({ ...m, source: 'telegram' }))
        ];

        if (allMessages.length === 0) {
            console.log("No messages to migrate.");
            return;
        }

        // 2. Write to Firebase (Batching)
        console.log('📤 Writing to Firestore...');
        
        // We use batches because Firestore allows max 500 writes per batch
        const batches = [];
        let currentBatch = firestore.batch();
        let operationCount = 0;

        for (const msg of allMessages) {
            // Prepare the data object
            // We use the Mongo _id as the Firestore Doc ID to prevent duplicates if you run this twice
            const docRef = firestore.collection('migrated_history').doc(msg._id.toString());

            const timestamp = msg.timestamp || msg.createdAt || new Date();
            
            const payload = {
                text: msg.text || msg.message || '',
                timestamp: timestamp, // Firestore handles JS Date objects
                username: msg.username || msg.senderName || 'Anonymous',
                source: msg.source, // 'web' or 'telegram'
                originalId: msg._id.toString(),
                migratedAt: admin.firestore.FieldValue.serverTimestamp()
            };

            // Remove undefined fields to prevent Firebase errors
            Object.keys(payload).forEach(key => payload[key] === undefined && delete payload[key]);

            currentBatch.set(docRef, payload, { merge: true });
            operationCount++;

            // If batch is full (500 limit), push to array and start new batch
            if (operationCount === 499) {
                batches.push(currentBatch.commit());
                currentBatch = firestore.batch();
                operationCount = 0;
            }
        }

        // Push any remaining operations
        if (operationCount > 0) {
            batches.push(currentBatch.commit());
        }

        // Wait for all batches to complete
        await Promise.all(batches);

        console.log(`✅ Successfully migrated ${allMessages.length} messages to 'migrated_history' collection!`);

    } catch (err) {
        console.error('❌ Migration Failed:', err);
    } finally {
        await client.close();
        process.exit(0);
    }
}

migrate();
