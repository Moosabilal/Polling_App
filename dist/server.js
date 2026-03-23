"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const express_1 = __importDefault(require("express"));
const http_1 = require("http");
const path_1 = __importDefault(require("path"));
const socket_io_1 = require("socket.io");
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
// Mongoose DB
const mongoose_1 = require("./database/mongoose");
// Inversify DI Setup
const inversify_config_1 = require("./DI/container/inversify.config");
const types_1 = require("./DI/types");
// Socket
const SocketHandler_1 = require("./socket/SocketHandler");
const app = (0, express_1.default)();
const server = (0, http_1.createServer)(app);
const io = new socket_io_1.Server(server, { cors: { origin: '*' } });
// Middleware
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use((0, cookie_parser_1.default)());
app.use(express_1.default.static('public'));
// Connect to MongoDB Atlas
mongoose_1.Database.connect();
// Setup API Routes
const api_1 = require("./routes/api");
app.use('/api', (0, api_1.setupApiRoutes)(inversify_config_1.container));
// Fallback to index.html for SPA-like behavior (ONLY for non-API routes)
app.use((req, res, next) => {
    if (req.path.startsWith('/api')) {
        return res.status(404).json({ message: 'API endpoint not found' });
    }
    res.sendFile(path_1.default.join(__dirname, '../public/index.html'));
});
// Socket.io
const pollService = inversify_config_1.container.get(types_1.TYPES.IPollService);
const chatService = inversify_config_1.container.get(types_1.TYPES.IChatService);
new SocketHandler_1.SocketHandler(io, pollService, chatService);
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
