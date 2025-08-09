import { Request } from 'express';

export interface AuthenticatedRequest extends Request {
    user?: {
        id: number;
        role: string;
        username: string;
    };
}

export interface Notification {
	id: number;
	user_id: number;
	message: string;
	link?: string;
	is_read: boolean;
	created_at: string;
}
