import 'reflect-metadata';
import * as dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import { createServer } from 'http';
import path from 'path';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import cookieParser from 'cookie-parser';

// Mongoose DB
import { Database } from './database/mongoose';

// Socket
import { SocketHandler } from './socket/SocketHandler';
import { TYPES } from './DI/types';
import { container } from './DI/container/inversify.config';

const app = express();
const server = createServer(app);
const io = new SocketIOServer(server, {
    cors: {
        origin: 'http://localhost:5000',
        credentials: true
    }
});

// Bind SocketServer
container.bind<SocketIOServer>(TYPES.SocketServer).toConstantValue(io);

// Middleware
app.use(cors());
app.use(express.json({ limit: '20mb' }));
app.use(cookieParser());
app.use(express.static('public'));

// Connect to MongoDB Atlas
Database.connect();

// Setup API Routes
import setupApiRoutes from './routes/api';
app.use('/api', setupApiRoutes);

// Fallback to index.html for SPA-like behavior (ONLY for non-API routes)
app.use((req, res, next) => {
    if (req.path.startsWith('/api')) {
        return res.status(404).json({ message: 'API endpoint not found' });
    }
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Socket.io
new SocketHandler(io);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
