import { Request, Response } from 'express';
import { injectable, inject } from 'inversify';
import { TYPES } from '../../DI/types/index.js';
import { IPollController } from '../interfaces/IPollController.js';
import { IPollService } from '../../services/interfaces/IPollService.js';
import { IUserService } from '../../services/interfaces/IUserService.js';
import { Server as SocketIOServer } from 'socket.io';

@injectable()
export class PollController implements IPollController {

    constructor(
        @inject(TYPES.IPollService) private pollService: IPollService,
        @inject(TYPES.SocketServer) private io: SocketIOServer,
        @inject(TYPES.IUserService) private userService: IUserService
    ) { }

    getPolls = async (req: Request, res: Response): Promise<void> => {
        try {
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 1;

            const { polls, totalCount } = await this.pollService.getPollsPaginated(page, limit);
            res.status(200).json({ success: true, polls, totalCount });
        } catch (error: unknown) {
            if (error instanceof Error) {
                res.status(400).json({ success: false, message: error.message });
                return;
            }
            res.status(400).json({ success: false, message: 'An unknown error occurred' });
        }
    }

    createPoll = async (req: Request, res: Response): Promise<void> => {
        try {

            const { question, options } = req.body;
            const newPoll = await this.pollService.createPoll(question, options);

            this.io.emit('newPollCreated', newPoll);

            res.status(201).json({ success: true, poll: newPoll });
        } catch (error: unknown) {
            if (error instanceof Error) {
                res.status(400).json({ success: false, message: error.message });
                return;
            }
            res.status(400).json({ success: false, message: 'An unknown error occurred' });
        }
    }

    editPoll = async (req: Request, res: Response): Promise<void> => {
        try {
            const pollId = req.params.id as string;
            const { question, options } = req.body;

            const updatedPoll = await this.pollService.updatePoll(pollId, question, options);
            if (updatedPoll) {
                this.io.emit('pollUpdated', updatedPoll);
                res.status(200).json({ success: true, poll: updatedPoll });
            } else {
                res.status(404).json({ success: false, message: 'Poll not found' });
            }
        } catch (error: unknown) {
            if (error instanceof Error) {
                res.status(400).json({ success: false, message: error.message });
                return;
            }
            res.status(400).json({ success: false, message: 'An unknown error occurred' });
        }
    }

    deletePoll = async (req: Request, res: Response): Promise<void> => {
        try {
            const pollId = req.params.id as string;

            const success = await this.pollService.deletePoll(pollId);
            if (success) {
                this.io.emit('pollDeleted', { pollId });
                res.status(200).json({ success: true });
            } else {
                res.status(404).json({ success: false, message: 'Poll not found' });
            }
        } catch (error: unknown) {
            if (error instanceof Error) {
                res.status(400).json({ success: false, message: error.message });
                return;
            }
            res.status(400).json({ success: false, message: 'An unknown error occurred' });
        }
    }
}
