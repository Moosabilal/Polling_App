import { Request, Response } from 'express';
import { injectable, inject } from 'inversify';
import { signToken } from '../../utils/jwt.js';
import { TYPES } from '../../DI/types/index.js';
import { IAuthController } from '../interfaces/IAuthController.js';
import { IUserService } from '../../services/interfaces/IUserService.js';
import { AuthRequest } from '../../middleware/auth.js';
import { User } from '../../types/index.js';
import { HTTP_STATUS, RESPONSE_MESSAGES } from '../../utils/constants.js';

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
                res.status(HTTP_STATUS.BAD_REQUEST).json({ success: false, message: error.message });
                return;
            } else {
                res.status(HTTP_STATUS.BAD_REQUEST).json({ success: false, message: RESPONSE_MESSAGES.UNKNOWN_ERROR });
            }
        }
    }

    login = async (req: Request, res: Response): Promise<void> => {
        try {
            const { email, password } = req.body;
            const user = await this.userService.login(email, password);

            if (!user) {
                res.status(HTTP_STATUS.UNAUTHORIZED).json({ success: false, message: RESPONSE_MESSAGES.INVALID_CREDENTIALS });
                return;
            }

            this.sendTokenResponse(user, res);
        } catch (error: unknown) {
            if (error instanceof Error) {
                res.status(HTTP_STATUS.BAD_REQUEST).json({ success: false, message: error.message });
                return;
            } else {
                res.status(HTTP_STATUS.BAD_REQUEST).json({ success: false, message: RESPONSE_MESSAGES.UNKNOWN_ERROR });
            }
        }
    }

    me = async (req: AuthRequest, res: Response): Promise<void> => {
        try {
            if (!req.user) {
                res.status(HTTP_STATUS.UNAUTHORIZED).json({ success: false, message: RESPONSE_MESSAGES.NOT_AUTHENTICATED });
                return;
            }
            const user = await this.userService.getUserById(req.user.id);
            res.status(HTTP_STATUS.OK).json({ success: true, user });
        } catch (error: unknown) {
            if (error instanceof Error) {
                res.status(HTTP_STATUS.BAD_REQUEST).json({ success: false, message: error.message });
                return;
            } else {
                res.status(HTTP_STATUS.BAD_REQUEST).json({ success: false, message: RESPONSE_MESSAGES.UNKNOWN_ERROR });
            }
        }
    }

    logout = async (req: Request, res: Response): Promise<void> => {
        res.clearCookie('token');
        res.status(HTTP_STATUS.OK).json({ success: true, message: RESPONSE_MESSAGES.LOGGED_OUT });
    }

    profile = async (req: AuthRequest, res: Response): Promise<void> => {
        try {
            if (!req.user) {
                res.status(HTTP_STATUS.UNAUTHORIZED).json({ success: false, message: RESPONSE_MESSAGES.NOT_AUTHENTICATED });
                return;
            }
            const { name, avatarPublicId, avatarResourceType } = req.body;
            const updatedUser = await this.userService.updateProfile(req.user.id, name, avatarPublicId, avatarResourceType);
            if (!updatedUser) {
                res.status(HTTP_STATUS.NOT_FOUND).json({ success: false, message: RESPONSE_MESSAGES.USER_NOT_FOUND });
                return;
            }
            res.status(HTTP_STATUS.OK).json({ success: true, user: updatedUser });
        } catch (error: unknown) {
            if (error instanceof Error) {
                res.status(HTTP_STATUS.BAD_REQUEST).json({ success: false, message: error.message });
                return;
            } else {
                res.status(HTTP_STATUS.BAD_REQUEST).json({ success: false, message: RESPONSE_MESSAGES.UNKNOWN_ERROR });
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

        res.status(HTTP_STATUS.OK)
            .cookie('token', token, cookieOptions)
            .json({ success: true, user });
    }
}
