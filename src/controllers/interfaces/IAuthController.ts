import { Request, Response } from 'express';

export interface IAuthController {
    register(req: Request, res: Response): Promise<void>;
    login(req: Request, res: Response): Promise<void>;
    logout(req: Request, res: Response): Promise<void>;
    me(req: Request, res: Response): Promise<void>;
    profile(req: Request, res: Response): Promise<void>;
}
