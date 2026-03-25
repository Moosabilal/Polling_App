import { Router } from 'express';
import { Container } from 'inversify';
import { TYPES } from '../DI/types';
import { IAuthController } from '../controllers/interfaces/IAuthController';
import { IPollController } from '../controllers/interfaces/IPollController';
import { authMiddleware } from '../middleware/auth';

export const setupApiRoutes = (container: Container): Router => {
    const router = Router();

    // Resolve Controllers
    const authController = container.get<IAuthController>(TYPES.AuthController);
    const pollController = container.get<IPollController>(TYPES.PollController);

    // Auth Routes
    router.post('/auth/register', authController.register);
    router.post('/auth/login', authController.login);
    router.post('/auth/logout', authController.logout);
    router.get('/auth/me', authMiddleware as any, authController.me as any);
    router.put('/auth/profile', authMiddleware as any, authController.profile as any);

    // Poll Routes
    router.get('/polls', pollController.getPolls);
    router.post('/polls', pollController.createPoll);

    return router;
};
