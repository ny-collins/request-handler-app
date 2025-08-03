import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import api from '../api';
import StatCard from '../components/ui/StatCard';
import QuickRequestForm from '../components/QuickRequestForm';
import Carousel from '../components/ui/Carousel'; // Import Carousel
import StatCardSkeleton from '../components/ui/StatCardSkeleton'; // Import StatCardSkeleton
import { FiArchive, FiCheckCircle, FiXCircle, FiClock, FiUsers } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { useQuery } from '@tanstack/react-query';
import { EmployeeStats, Stats } from '../types';

function getScreenSize() {
    if (window.innerWidth < 768) return 'small';
    return 'large';
}

const Dashboard = () => {
    const { user } = useAuth();
    const [screenSize, setScreenSize] = useState(getScreenSize());

    const fetchStats = async () => {
        const { data } = await api.get('/requests/stats');
        return data;
    };

    const handleResize = useCallback(() => {
        setScreenSize(getScreenSize());
    }, []);

    useEffect(() => {
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [handleResize]);

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

    return (
        <div>
            <div className="page-header">
                <h1>Dashboard</h1>
                <p>Welcome back, {user?.username || 'Guest'}!</p>
            </div>

            {isLoading ? (
                <div className="stats-grid">
                    {[...Array(4)].map((_, index) => (
                        <StatCardSkeleton key={index} />
                    ))}
                </div>
            ) : stats ? (
                <div className="stats-grid">
                    {screenSize === 'small' ? (
                        <Carousel slidesToShow={1}> {/* Show one card at a time on small screens */}
                            {user?.role === 'employee' ? employeeStats : adminBoardMemberStats}
                        </Carousel>
                    ) : (
                        user?.role === 'employee' ? employeeStats : adminBoardMemberStats
                    )}
                </div>
            ) : (
                <p>No dashboard statistics available.</p>
            )}

            {user?.role === 'employee' && (
                <div className="dashboard-quick-request">
                    <QuickRequestForm />
                </div>
            )}
        </div>
    );
};

export default Dashboard;
