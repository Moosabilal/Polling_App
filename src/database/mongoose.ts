import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/polling_app';

export class Database {
    public static async connect(): Promise<void> {
        try {
            await mongoose.connect(MONGODB_URI);
            console.log('Successfully connected to MongoDB Atlas');
        } catch (error) {
            console.error('Error connecting to MongoDB Atlas:', error);
            process.exit(1);
        }
    }
}
