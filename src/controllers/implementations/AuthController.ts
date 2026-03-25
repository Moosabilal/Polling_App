import { Request, Response } from 'express';
import { injectable, inject } from 'inversify';
import jwt from 'jsonwebtoken';
import { TYPES } from '../../DI/types';
import { IAuthController } from '../interfaces/IAuthController';
import { IUserService } from '../../services/interfaces/IUserService';
import { AuthRequest } from '../../middleware/auth';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';

@injectable()
export class AuthController implements IAuthController {
    constructor(@inject(TYPES.IUserService) private userService: IUserService) { }

    register = async (req: Request, res: Response): Promise<void> => {
        try {
            const { name, email, password } = req.body;
            const user = await this.userService.register(name, email, password);

            this.sendTokenResponse(user, res);
        } catch (error: any) {
            res.status(400).json({ success: false, message: error.message });
        }
    }

    login = async (req: Request, res: Response): Promise<void> => {
        try {
            const { email, password } = req.body;
            const user = await this.userService.login(email, password);

            if (!user) {
                res.status(401).json({ success: false, message: 'Invalid credentials' });
                return;
            }

            this.sendTokenResponse(user, res);
        } catch (error: any) {
            res.status(400).json({ success: false, message: error.message });
        }
    }

    me = async (req: AuthRequest, res: Response): Promise<void> => {
        try {
            if (!req.user) {
                res.status(401).json({ success: false, message: 'Not authenticated' });
                return;
            }
            const user = await this.userService.getUserById(req.user.id);
            res.status(200).json({ success: true, user });
        } catch (error: any) {
            res.status(400).json({ success: false, message: error.message });
        }
    }

    logout = async (req: Request, res: Response): Promise<void> => {
        res.clearCookie('token');
        res.json({ success: true, message: 'Logged out successfully' });
    }

    profile = async (req: AuthRequest, res: Response): Promise<void> => {
        try {
            if (!req.user) {
                res.status(401).json({ success: false, message: 'Not authenticated' });
                return;
            }
            const { name, avatarPublicId, avatarResourceType } = req.body;
            const updatedUser = await this.userService.updateProfile(req.user.id, name, avatarPublicId, avatarResourceType);
            if (!updatedUser) {
                res.status(404).json({ success: false, message: 'User not found' });
                return;
            }
            res.status(200).json({ success: true, user: updatedUser });
        } catch (error: any) {
            res.status(400).json({ success: false, message: error.message });
        }
    }

    private sendTokenResponse(user: any, res: Response) {
        const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, {
            expiresIn: '24h'
        });

        const cookieOptions = {
            expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production'
        };

        res.status(200)
            .cookie('token', token, cookieOptions)
            .json({ success: true, user });
    }
}
