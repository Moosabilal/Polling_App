import { Router } from 'express';
import { Container } from 'inversify';
import { TYPES } from '../DI/types';
import { IAuthController } from '../controllers/interfaces/IAuthController';
import { IPollController } from '../controllers/interfaces/IPollController';
import { authMiddleware } from '../middleware/auth';
import uploadRouter from './upload';
import https from 'https';
import http from 'http';

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

    // File Upload Route
    router.use('/upload', uploadRouter);

    // Proxy download — fetches Cloudinary URL server-side, avoids CORS on browser download
    router.get('/proxy-download', (req, res) => {
        const url = req.query.url as string;
        const name = (req.query.name as string) || 'file';

        if (!url || !url.startsWith('https://res.cloudinary.com/')) {
            return res.status(400).json({ message: 'Invalid URL' });
        }

        const doFetch = (fetchUrl: string, retried = false) => {
            https.get(fetchUrl, (upstream) => {
                // If we get 401 on an image/upload URL, retry with raw/upload
                // (Cloudinary may have stored the file as raw even if URL says image)
                if (upstream.statusCode === 401 && !retried && fetchUrl.includes('/image/upload/')) {
                    upstream.resume(); // drain the response body
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

    return router;
};


