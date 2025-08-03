export interface User {
    id: number;
    username: string;
    email: string;
    password?: string; // Password may not always be selected
    role_id: number;
    created_at: Date;
}

export interface Role {
    id: number;
    name: string;
}

export interface Request {
    id: number;
    user_id: number;
    title: string;
    description: string;
    is_monetary: boolean;
    amount: number | null;
    status: 'pending' | 'approved' | 'rejected';
    created_at: Date;
}

export interface Decision {
    id: number;
    request_id: number;
    board_member_id: number;
    decision: 'approved' | 'rejected';
    created_at: Date;
}
