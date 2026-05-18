import { Request, Response, NextFunction } from 'express';
import { injectable, inject } from 'inversify';
import { TYPES } from '../../DI/types/index.js';
import { IPollController } from '../interfaces/IPollController.js';
import { IPollService } from '../../services/interfaces/IPollService.js';
import { IUserService } from '../../services/interfaces/IUserService.js';
import { Server as SocketIOServer } from 'socket.io';
import { HTTP_STATUS, RESPONSE_MESSAGES } from '../../utils/constants.js';
import { AuthRequest } from '../../middleware/auth.js';
import { CustomError } from '../../utils/CustomError.js';

@injectable()
export class PollController implements IPollController {

    constructor(
        @inject(TYPES.IPollService) private pollService: IPollService,
        @inject(TYPES.SocketServer) private io: SocketIOServer,
        @inject(TYPES.IUserService) private userService: IUserService
    ) { }

    getPolls = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 1;

            const { polls, totalCount } = await this.pollService.getPollsPaginated(page, limit);
            res.status(HTTP_STATUS.OK).json({ success: true, polls, totalCount });
        } catch (error: unknown) {
            next(error);
        }
    }

    createPoll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const authReq = req as AuthRequest;
            const { question, options } = req.body;
            const newPoll = await this.pollService.createPoll(question, options, authReq.user!.id);

            this.io.emit('newPollCreated', newPoll);

            res.status(HTTP_STATUS.CREATED).json({ success: true, poll: newPoll });
        } catch (error: unknown) {
            next(error);
        }
    }

    editPoll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const authReq = req as AuthRequest;
            const pollId = req.params.id as string;
            const { question, options } = req.body;

            const updatedPoll = await this.pollService.updatePoll(pollId, authReq.user!.id, question, options);
            if (updatedPoll) {
                this.io.emit('pollUpdated', updatedPoll);
                res.status(HTTP_STATUS.OK).json({ success: true, poll: updatedPoll });
            } else {
                throw new CustomError(RESPONSE_MESSAGES.POLL_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
            }
        } catch (error: unknown) {
            next(error);
        }
    }

    deletePoll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const authReq = req as AuthRequest;
            const pollId = req.params.id as string;

            const success = await this.pollService.deletePoll(pollId, authReq.user!.id);
            if (success) {
                this.io.emit('pollDeleted', { pollId });
                res.status(HTTP_STATUS.OK).json({ success: true });
            } else {
                throw new CustomError(RESPONSE_MESSAGES.POLL_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
            }
        } catch (error: unknown) {
            next(error);
        }
    }

    getPollResults = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const pollId = req.params.id as string;
            const results = await this.pollService.getPollResults(pollId);
            
            if (results) {
                res.status(HTTP_STATUS.OK).json({ success: true, results });
            } else {
                throw new CustomError(RESPONSE_MESSAGES.POLL_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
            }
        } catch (error: unknown) {
            next(error);
        }
    }
}
