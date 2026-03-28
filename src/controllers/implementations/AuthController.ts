import { Request, Response } from 'express';
import { injectable, inject } from 'inversify';
import { signToken } from '../../utils/jwt.js';
import { TYPES } from '../../DI/types/index.js';
import { IAuthController } from '../interfaces/IAuthController.js';
import { IUserService } from '../../services/interfaces/IUserService.js';
import { AuthRequest } from '../../middleware/auth.js';
import { User } from '../../types/index.js';

@injectable()
export class AuthController implements IAuthController {

    constructor(@inject(TYPES.IUserService) private userService: IUserService) { }

    register = async (req: Request, res: Response): Promise<void> => {
        try {
            const { name, email, password } = req.body;
            const user = await this.userService.register(name, email, password);

            this.sendTokenResponse(user, res);
        } catch (error: unknown) {
            if (error instanceof Error) {
                res.status(400).json({ success: false, message: error.message });
                return;
            } else {
                res.status(400).json({ success: false, message: 'An unknown error occurred' });
            }
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
        } catch (error: unknown) {
            if (error instanceof Error) {
                res.status(400).json({ success: false, message: error.message });
                return;
            } else {
                res.status(400).json({ success: false, message: 'An unknown error occurred' });
            }
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
        } catch (error: unknown) {
            if (error instanceof Error) {
                res.status(400).json({ success: false, message: error.message });
                return;
            } else {
                res.status(400).json({ success: false, message: 'An unknown error occurred' });
            }
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
        } catch (error: unknown) {
            if (error instanceof Error) {
                res.status(400).json({ success: false, message: error.message });
                return;
            } else {
                res.status(400).json({ success: false, message: 'An unknown error occurred' });
            }
        }
    }

    private sendTokenResponse(user: User, res: Response) {
        const token = signToken({ id: user.id });

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
