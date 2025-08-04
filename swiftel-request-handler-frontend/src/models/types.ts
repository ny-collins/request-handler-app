

export interface AuthenticatedRequest extends Request {
    user?: {
        id: number;
        role: string;
    };
}

export interface Notification {
    id: number;
    user_id: number;
    message: string;
    is_read: boolean;
    created_at: string;
}
