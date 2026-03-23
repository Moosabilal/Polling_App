"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Database = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const MONGODB_URI = process.env.MONGO_URI || 'mongodb+srv://moosabilal75608:moosabilal@cluster0.1xluc.mongodb.net/pollingApp?retryWrites=true&w=majority&appName=Cluster0';
class Database {
    static async connect() {
        try {
            await mongoose_1.default.connect(MONGODB_URI);
            console.log('Successfully connected to MongoDB Atlas');
            // Fix index if it exists
            const db = mongoose_1.default.connection.db;
            if (db) {
                try {
                    const collections = await db.listCollections().toArray();
                    if (collections.some(c => c.name === 'users')) {
                        const usersCollection = db.collection('users');
                        const indexes = await usersCollection.indexes();
                        if (indexes.some(idx => idx.name === 'username_1')) {
                            await usersCollection.dropIndex('username_1');
                            console.log('Successfully dropped obsolete username_1 index');
                        }
                    }
                }
                catch (err) {
                    console.log('Note: Error checking/dropping index:', err.message);
                }
            }
        }
        catch (error) {
            console.error('Error connecting to MongoDB Atlas:', error);
            process.exit(1);
        }
    }
}
exports.Database = Database;
