import { Request, Response } from 'express';
import { injectable, inject } from 'inversify';
import { TYPES } from '../../DI/types/index.js';
import { IPollController } from '../interfaces/IPollController.js';
import { IPollService } from '../../services/interfaces/IPollService.js';
import { IUserService } from '../../services/interfaces/IUserService.js';
import { Server as SocketIOServer } from 'socket.io';
import { HTTP_STATUS, RESPONSE_MESSAGES } from '../../utils/constants.js';

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
            res.status(HTTP_STATUS.OK).json({ success: true, polls, totalCount });
        } catch (error: unknown) {
            if (error instanceof Error) {
                res.status(HTTP_STATUS.BAD_REQUEST).json({ success: false, message: error.message });
                return;
            }
            res.status(HTTP_STATUS.BAD_REQUEST).json({ success: false, message: RESPONSE_MESSAGES.UNKNOWN_ERROR });
        }
    }

    createPoll = async (req: Request, res: Response): Promise<void> => {
        try {

            const { question, options } = req.body;
            const newPoll = await this.pollService.createPoll(question, options);

            this.io.emit('newPollCreated', newPoll);

            res.status(HTTP_STATUS.CREATED).json({ success: true, poll: newPoll });
        } catch (error: unknown) {
            if (error instanceof Error) {
                res.status(HTTP_STATUS.BAD_REQUEST).json({ success: false, message: error.message });
                return;
            }
            res.status(HTTP_STATUS.BAD_REQUEST).json({ success: false, message: RESPONSE_MESSAGES.UNKNOWN_ERROR });
        }
    }

    editPoll = async (req: Request, res: Response): Promise<void> => {
        try {
            const pollId = req.params.id as string;
            const { question, options } = req.body;

            const updatedPoll = await this.pollService.updatePoll(pollId, question, options);
            if (updatedPoll) {
                this.io.emit('pollUpdated', updatedPoll);
                res.status(HTTP_STATUS.OK).json({ success: true, poll: updatedPoll });
            } else {
                res.status(HTTP_STATUS.NOT_FOUND).json({ success: false, message: RESPONSE_MESSAGES.POLL_NOT_FOUND });
            }
        } catch (error: unknown) {
            if (error instanceof Error) {
                res.status(HTTP_STATUS.BAD_REQUEST).json({ success: false, message: error.message });
                return;
            }
            res.status(HTTP_STATUS.BAD_REQUEST).json({ success: false, message: RESPONSE_MESSAGES.UNKNOWN_ERROR });
        }
    }

    deletePoll = async (req: Request, res: Response): Promise<void> => {
        try {
            const pollId = req.params.id as string;

            const success = await this.pollService.deletePoll(pollId);
            if (success) {
                this.io.emit('pollDeleted', { pollId });
                res.status(HTTP_STATUS.OK).json({ success: true });
            } else {
                res.status(HTTP_STATUS.NOT_FOUND).json({ success: false, message: RESPONSE_MESSAGES.POLL_NOT_FOUND });
            }
        } catch (error: unknown) {
            if (error instanceof Error) {
                res.status(HTTP_STATUS.BAD_REQUEST).json({ success: false, message: error.message });
                return;
            }
            res.status(HTTP_STATUS.BAD_REQUEST).json({ success: false, message: RESPONSE_MESSAGES.UNKNOWN_ERROR });
        }
    }
}
