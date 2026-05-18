import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt.js';
import { CustomError } from '../utils/CustomError.js';
import { HTTP_STATUS } from '../utils/constants.js';

export interface AuthRequest extends Request {
    user?: {
        id: string;
        email: string;
    };
}

export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction): void => {
    const token = req.cookies.token;

    if (!token) {
        next(new CustomError('Authentication required', HTTP_STATUS.UNAUTHORIZED));
        return;
    }

    try {
        const decoded = verifyToken<{ id: string; email: string }>(token);
        req.user = decoded;
        next();
    } catch (error) {
        next(new CustomError('Invalid or expired token', HTTP_STATUS.UNAUTHORIZED));
    }
};
