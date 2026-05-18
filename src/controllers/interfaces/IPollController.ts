import { Request, Response, NextFunction } from 'express';

export interface IPollController {
    getPolls(req: Request, res: Response, next: NextFunction): Promise<void>;
    createPoll(req: Request, res: Response, next: NextFunction): Promise<void>;
    editPoll(req: Request, res: Response, next: NextFunction): Promise<void>;
    deletePoll(req: Request, res: Response, next: NextFunction): Promise<void>;
    getPollResults(req: Request, res: Response, next: NextFunction): Promise<void>;
}
