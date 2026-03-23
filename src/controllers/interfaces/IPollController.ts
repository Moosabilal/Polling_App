import { Request, Response } from 'express';

export interface IPollController {
    getPolls(req: Request, res: Response): void;
}
