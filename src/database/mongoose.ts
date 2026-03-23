import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGO_URI || 'mongodb+srv://moosabilal75608:moosabilal@cluster0.1xluc.mongodb.net/pollingApp?retryWrites=true&w=majority&appName=Cluster0';

export class Database {
    public static async connect(): Promise<void> {
        try {
            await mongoose.connect(MONGODB_URI);
            console.log('Successfully connected to MongoDB Atlas');

            // Fix index if it exists
            const db = mongoose.connection.db;
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
                } catch (err: any) {
                    console.log('Note: Error checking/dropping index:', err.message);
                }
            }
        } catch (error) {
            console.error('Error connecting to MongoDB Atlas:', error);
            process.exit(1);
        }
    }
}
