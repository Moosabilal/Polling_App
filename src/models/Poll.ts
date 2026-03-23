import mongoose, { Schema, Document } from 'mongoose';

export interface IPollOption {
    id: string;
    text: string;
    votes: number;
}

export interface IPollVoter {
    userId: string;
    optionId: string;
}

export interface IPollModel extends Document {
    question: string;
    options: IPollOption[];
    voters: IPollVoter[];
}

const PollVoterSchema = new Schema({
    userId: { type: String, required: true },
    optionId: { type: String, required: true }
});

const PollOptionSchema: Schema = new Schema({
    id: { type: String, required: true },
    text: { type: String, required: true },
    votes: { type: Number, default: 0 }
});

const PollSchema: Schema = new Schema({
    question: { type: String, required: true },
    options: { type: [PollOptionSchema], required: true },
    voters: { type: [PollVoterSchema], default: [] }
}, { timestamps: true });

export const PollModel = mongoose.model<IPollModel>('Poll', PollSchema);
