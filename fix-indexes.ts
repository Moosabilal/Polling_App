import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/pollingApp';

async function fixIndexes() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        const collections = await mongoose.connection.db.listCollections().toArray();
        const usersCollectionExists = collections.some(c => c.name === 'users');

        if (usersCollectionExists) {
            const usersCollection = mongoose.connection.db.collection('users');
            const indexes = await usersCollection.indexes();
            console.log('Current indexes:', indexes);

            if (indexes.some(idx => idx.name === 'username_1')) {
                await usersCollection.dropIndex('username_1');
                console.log('Successfully dropped username_1 index');
            } else {
                console.log('username_1 index not found');
            }
        }

        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    } catch (error) {
        console.error('Error fixing indexes:', error);
        process.exit(1);
    }
}

fixIndexes();
