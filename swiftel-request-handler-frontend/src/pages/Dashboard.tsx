import { useAuth } from '../hooks/useAuth';
import api from '../api';
import StatCard from '../components/ui/StatCard';
import QuickRequestForm from '../components/QuickRequestForm';
import StatCardSkeleton from '../components/ui/StatCardSkeleton';

import { FiArchive, FiCheckCircle, FiXCircle, FiClock, FiUsers } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { useQuery } from '@tanstack/react-query';
import { EmployeeStats, Stats } from '../types';
const Dashboard = () => {
    const { user } = useAuth();

    const fetchStats = async () => {
        const { data } = await api.get('/requests/stats');
        return data;
    };

    const { data: stats, error, isLoading } = useQuery<EmployeeStats & Stats, Error>({
        queryKey: ['dashboardStats'],
        queryFn: fetchStats,
    });

    if (error) {
        toast.error('Could not load dashboard statistics.');
    }

    const employeeStats = stats && (
        <>
            <StatCard title="Total Requests" value={stats.totalRequests} icon={<FiArchive />} />
            <StatCard title="Approved" value={stats.approved} icon={<FiCheckCircle />} />
            <StatCard title="Rejected" value={stats.rejected} icon={<FiXCircle />} />
            <StatCard title="Pending" value={stats.pending} icon={<FiClock />} />
        </>
    );

    const adminBoardMemberStats = stats && (
        <>
            <StatCard title="Total Requests" value={stats.totalRequests} icon={<FiArchive />} />
            <StatCard title="Pending Review" value={stats.pendingRequests} icon={<FiClock />} />
            <StatCard title="Total Employees" value={stats.totalEmployees} icon={<FiUsers />} />
            <StatCard title="Resolved" value={stats.approvedRequests + stats.rejectedRequests} icon={<FiCheckCircle />} />
        </>
    );

    const renderStats = () => {
        if (isLoading) {
            return (
                <div className="stats-grid">
                    {[...Array(4)].map((_, index) => (
                        <StatCardSkeleton key={index} />
                    ))}
                </div>
            );
        }

        if (!stats) {
            return <p>No dashboard statistics available.</p>;
        }

        const statCards = user?.role === 'employee' ? employeeStats : adminBoardMemberStats;

        return (
            <div className="stats-grid">
                {statCards}
            </div>
        );
    };

    return (
        <div>
            <div className="page-header">
                <h1>Dashboard</h1>
                <p>Welcome back, {user?.username || 'Guest'}!</p>
            </div>

            {renderStats()}

            {user?.role === 'employee' && (
                <div className="dashboard-quick-request">
                    <QuickRequestForm />
                </div>
            )}
        </div>
    );
};

export default Dashboard;
