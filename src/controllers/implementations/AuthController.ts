import { Request, Response, NextFunction } from 'express';
import { injectable, inject } from 'inversify';
import { signToken } from '../../utils/jwt.js';
import { TYPES } from '../../DI/types/index.js';
import { IAuthController } from '../interfaces/IAuthController.js';
import { IUserService } from '../../services/interfaces/IUserService.js';
import { AuthRequest } from '../../middleware/auth.js';
import { User } from '../../types/index.js';
import { HTTP_STATUS, RESPONSE_MESSAGES } from '../../utils/constants.js';
import { CustomError } from '../../utils/CustomError.js';

@injectable()
export class AuthController implements IAuthController {

    constructor(@inject(TYPES.IUserService) private userService: IUserService) { }

    register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { name, email, password } = req.body;
            const user = await this.userService.register(name, email, password);

            this.sendTokenResponse(user, res);
        } catch (error: unknown) {
            next(error);
        }
    }

    login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { email, password } = req.body;
            const user = await this.userService.login(email, password);

            this.sendTokenResponse(user, res);
        } catch (error: unknown) {
            next(error);
        }
    }

    me = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
        try {
            const user = await this.userService.getUserById(req.user!.id);
            res.status(HTTP_STATUS.OK).json({ success: true, user });
        } catch (error: unknown) {
            next(error);
        }
    }

    logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            res.clearCookie('token');
            res.status(HTTP_STATUS.OK).json({ success: true, message: RESPONSE_MESSAGES.LOGGED_OUT });
        } catch (error: unknown) {
            next(error);
        }
    }

    profile = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { name, avatarPublicId, avatarResourceType } = req.body;
            const updatedUser = await this.userService.updateProfile(req.user!.id, name, avatarPublicId, avatarResourceType);
            res.status(HTTP_STATUS.OK).json({ success: true, user: updatedUser });
        } catch (error: unknown) {
            next(error);
        }
    }

    private sendTokenResponse(user: User, res: Response) {
        const token = signToken({ id: user.id });

        const cookieOptions = {
            expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production'
        };

        res.status(HTTP_STATUS.OK)
            .cookie('token', token, cookieOptions)
            .json({ success: true, user });
    }
}
