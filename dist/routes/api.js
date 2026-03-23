"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupApiRoutes = void 0;
const express_1 = require("express");
const types_1 = require("../DI/types");
const auth_1 = require("../middleware/auth");
const setupApiRoutes = (container) => {
    const router = (0, express_1.Router)();
    // Resolve Controllers
    const authController = container.get(types_1.TYPES.AuthController);
    const pollController = container.get(types_1.TYPES.PollController);
    // Auth Routes
    router.post('/auth/register', authController.register);
    router.post('/auth/login', authController.login);
    router.post('/auth/logout', authController.logout);
    router.get('/auth/me', auth_1.authMiddleware, authController.me);
    // Poll Routes
    router.get('/polls', pollController.getPolls);
    router.post('/polls', pollController.createPoll);
    return router;
};
exports.setupApiRoutes = setupApiRoutes;
