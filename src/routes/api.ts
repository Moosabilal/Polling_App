import { Router } from 'express';
import { Container } from 'inversify';
import { TYPES } from '../DI/types/index.js';
import { IAuthController } from '../controllers/interfaces/IAuthController.js';
import { IPollController } from '../controllers/interfaces/IPollController.js';
import { authMiddleware } from '../middleware/auth.js';
import uploadRouter from './upload.js';
import { container } from '../DI/container/inversify.config.js';
import https from 'https';
import http from 'http';

const router = Router();

export default function setupApiRoutes() {

    const authController = container.get<IAuthController>(TYPES.AuthController);
    const pollController = container.get<IPollController>(TYPES.PollController);

    router.post('/auth/register', authController.register);
    router.post('/auth/login', authController.login);
    router.post('/auth/logout', authController.logout);
    router.get('/auth/me', authMiddleware, authController.me);
    router.put('/auth/profile', authMiddleware, authController.profile);

    router.get('/polls', pollController.getPolls);
    router.post('/polls', authMiddleware, pollController.createPoll);
    router.put('/polls/:id', authMiddleware, pollController.editPoll);
    router.delete('/polls/:id', authMiddleware, pollController.deletePoll);

    router.use('/upload', uploadRouter);

    router.get('/proxy-download', (req, res) => {
        const url = req.query.url as string;
        const name = (req.query.name as string) || 'file';

        if (!url || !url.startsWith('https://res.cloudinary.com/')) {
            return res.status(400).json({ message: 'Invalid URL' });
        }

        const doFetch = (fetchUrl: string, retried = false) => {
            https.get(fetchUrl, (upstream) => {
                if (upstream.statusCode === 401 && !retried && fetchUrl.includes('/image/upload/')) {
                    upstream.resume();
                    const rawUrl = fetchUrl.replace('/image/upload/', '/raw/upload/');
                    return doFetch(rawUrl, true);
                }

                if (upstream.statusCode && upstream.statusCode >= 400) {
                    res.status(upstream.statusCode).send('Could not fetch file from Cloudinary');
                    return;
                }

                const contentType = upstream.headers['content-type'] || 'application/octet-stream';
                res.setHeader('Content-Type', contentType);
                res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(name)}"`);
                if (upstream.headers['content-length']) {
                    res.setHeader('Content-Length', upstream.headers['content-length']);
                }
                upstream.pipe(res);
            }).on('error', (err) => {
                console.error('[PROXY] Download error:', err.message);
                res.status(500).send('Download failed');
            });
        };

        doFetch(url);
    });

    return router

}


