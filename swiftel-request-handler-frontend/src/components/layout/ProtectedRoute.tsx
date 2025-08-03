import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

interface ProtectedRouteProps {
    children: ReactNode;
    roles?: string[];
}

const ProtectedRoute = ({ children, roles }: ProtectedRouteProps) => {
    const { user, isLoading } = useAuth();

    if (isLoading) {
        return <div>Loading...</div>; // Or a spinner component
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    if (roles && (!user.role || !roles.includes(user.role))) {
        // User is logged in but doesn't have the required role
        return <Navigate to="/dashboard" replace />; // Or a dedicated "Access Denied" page
    }

    return <>{children}</>;
};

export default ProtectedRoute;
