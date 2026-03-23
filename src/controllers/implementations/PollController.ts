import { Request, Response } from 'express';
import { injectable, inject } from 'inversify';
import { TYPES } from '../../DI/types';
import { IPollController } from '../interfaces/IPollController';
import { IPollService } from '../../services/interfaces/IPollService';

export interface IPollControllerExtended extends IPollController {
    createPoll(req: Request, res: Response): Promise<void>;
}

@injectable()
export class PollController implements IPollControllerExtended {
    constructor(@inject(TYPES.IPollService) private pollService: IPollService) { }

    getPolls = async (req: Request, res: Response): Promise<void> => {
        try {
            const polls = await this.pollService.getAllPolls();
            res.status(200).json({ success: true, polls });
        } catch (error: any) {
            res.status(400).json({ success: false, message: error.message });
        }
    }

    createPoll = async (req: Request, res: Response): Promise<void> => {
        try {
            const { question, options } = req.body;
            const newPoll = await this.pollService.createPoll(question, options);
            res.status(201).json({ success: true, poll: newPoll });
        } catch (error: any) {
            res.status(400).json({ success: false, message: error.message });
        }
    }
}
