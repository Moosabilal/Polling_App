import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt.ts';
import { CustomError } from '../utils/CustomError.ts';
import { HTTP_STATUS } from '../utils/constants.ts';
import { RESPONSE_MESSAGES } from '../utils/constants.ts';

export interface AuthRequest extends Request {
    user?: {
        id: string;
        email: string;
    };
}

export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction): void => {
    const token = req.cookies.token;

    if (!token) {
        next(new CustomError(RESPONSE_MESSAGES.AUTH_REQUIRED, HTTP_STATUS.UNAUTHORIZED));
        return;
    }

    try {
        const decoded = verifyToken<{ id: string; email: string }>(token);
        req.user = decoded;
        next();
    } catch (error) {
        next(new CustomError(RESPONSE_MESSAGES.INVALID_TOKEN, HTTP_STATUS.UNAUTHORIZED));
    }
};
