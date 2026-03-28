import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';

export const signToken = (payload: object, expiresIn: string | number = '24h'): string => {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: expiresIn });
};

export const verifyToken = <T>(token: string): T => {
    return jwt.verify(token, JWT_SECRET) as T;
};
