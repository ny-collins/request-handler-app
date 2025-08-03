export interface User {
    id: number;
    username: string;
    email: string;
    role?: 'employee' | 'board_member' | 'admin';
    created_at: string;
}

export interface Decision {
    board_member_id: number;
    username: string;
    decision: 'approved' | 'rejected';
}

export interface Request {
    id: number;
    title: string;
    description: string;
    status: 'pending' | 'approved' | 'rejected';
    created_at: string;
    is_monetary: boolean;
    amount?: number;
    employee_username?: string;
    decisions?: Decision[];
}

export interface Stats {
    totalRequests: number;
    approvedRequests: number;
    rejectedRequests: number;
    pendingRequests: number;
    totalEmployees: number;
}

export interface EmployeeStats {
    totalRequests: number;
    approved: number;
    rejected: number;
    pending: number;
}

export interface Notification {
    id: number;
    user_id: number;
    message: string;
    is_read: boolean;
    created_at: string;
}
