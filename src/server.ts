import 'reflect-metadata';
import express from 'express';
import { createServer } from 'http';
import path from 'path';
import { Server } from 'socket.io';
import cors from 'cors';
import cookieParser from 'cookie-parser';

// Mongoose DB
import { Database } from './database/mongoose';

// Inversify DI Setup
import { container } from './DI/container/inversify.config';
import { TYPES } from './DI/types';

// Services
import { IPollService } from './services/interfaces/IPollService';
import { IChatService } from './services/interfaces/IChatService';
import { IUserService } from './services/interfaces/IUserService';

// Controllers
import { AuthController } from './controllers/implementations/AuthController';
import { PollController } from './controllers/implementations/PollController';
import { IAuthController } from './controllers/interfaces/IAuthController';
import { IPollController } from './controllers/interfaces/IPollController';

// Middleware
import { authMiddleware } from './middleware/auth';

// Socket
import { SocketHandler } from './socket/SocketHandler';

const app = express();
const server = createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

// Middleware
app.use(cors());
app.use(express.json());
app.use(cookieParser());
app.use(express.static('public'));

// Connect to MongoDB Atlas
Database.connect();

// Setup API Routes
import { setupApiRoutes } from './routes/api';
app.use('/api', setupApiRoutes(container));

// Fallback to index.html for SPA-like behavior (ONLY for non-API routes)
app.use((req, res, next) => {
    if (req.path.startsWith('/api')) {
        return res.status(404).json({ message: 'API endpoint not found' });
    }
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Socket.io
const pollService = container.get<IPollService>(TYPES.IPollService);
const chatService = container.get<IChatService>(TYPES.IChatService);
const userService = container.get<IUserService>(TYPES.IUserService);

// Auto-seed admin user
userService.register('admin', 'admin@gmail.com', 'admin12345').then(() => {
    console.log('Seeded admin user');
}).catch(() => {
    // Already exists or uniqueness conflict, which is fine
});

new SocketHandler(io, pollService, chatService, userService);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
