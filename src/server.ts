import 'reflect-metadata';
import * as dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import { createServer } from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import cookieParser from 'cookie-parser';

// Mongoose DB
import { Database } from './database/mongoose.js';

// Socket
import { SocketHandler } from './socket/SocketHandler.js';
import { TYPES } from './DI/types/index.js';
import { container } from './DI/container/inversify.config.js';
import setupApiRoutes from './routes/api.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = createServer(app);
const io = new SocketIOServer(server, {
    cors: {
        origin: process.env.CLIENT_URL || 'http://localhost:5000',
        credentials: true
    }
});

// Bind SocketServer
if (!container.isBound(TYPES.SocketServer)) {
    container.bind<SocketIOServer>(TYPES.SocketServer).toConstantValue(io);
}

// Middleware
app.use(cors());
app.use(express.json({ limit: '20mb' }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, '../public')));

// Connect to MongoDB Atlas
Database.connect();

// Setup API Routes
app.use('/api', setupApiRoutes());

// Socket.io
new SocketHandler(io);

// Fallback to index.html for SPA-like behavior (ONLY for non-API routes)
app.use((req, res, next) => {
    if (req.path.startsWith('/api')) {
        return res.status(404).json({ message: 'API endpoint not found' });
    }
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
