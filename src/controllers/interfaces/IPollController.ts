import { Request, Response } from 'express';

export interface IPollController {
    getPolls(req: Request, res: Response): Promise<void>;
    createPoll(req: Request, res: Response): Promise<void>;
    editPoll(req: Request, res: Response): Promise<void>;
    deletePoll(req: Request, res: Response): Promise<void>;
}
