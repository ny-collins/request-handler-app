import { useState, useMemo, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import api from '../api';
import toast from 'react-hot-toast';
import RequestCard from '../components/RequestCard';
import EditDecisionModal from '../components/EditDecisionModal';
import FilterDropdown from '../components/ui/FilterDropdown';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Request as RequestType, Decision } from '../types';

type StatusFilter = 'all' | 'pending' | 'approved' | 'rejected';

interface EditDecisionPayload {
    requestId: number;
    boardMemberId: number;
    currentDecision: Decision['decision'];
}

const fetchRequests = async (isEmployee: boolean) => {
    const url = isEmployee ? '/requests/my-requests' : '/requests';
    const { data } = await api.get<RequestType[]>(url);
    return data;
};

const makeDecision = async (params: { requestId: number, decision: Decision['decision'], boardMemberId?: number }) => {
    const { requestId, ...payload } = params;
    const { data } = await api.post(`/requests/${requestId}/decide`, payload);
    return data;
};

function getScreenSize() {
    if (window.innerWidth < 768) return 'small';
    return 'large'; // Treat medium and large screens the same for this component
}

const ViewRequests = () => {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const isEmployee = user?.role === 'employee';
    const isAdmin = user?.role === 'admin';

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalPayload, setModalPayload] = useState<EditDecisionPayload | null>(null);
    const [screenSize, setScreenSize] = useState(getScreenSize());

    const handleResize = useCallback(() => {
        setScreenSize(getScreenSize());
    }, []);

    useEffect(() => {
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [handleResize]);

    const { data: requests = [], isLoading, error } = useQuery<RequestType[], Error>({
        queryKey: ['requests', isEmployee],
        queryFn: () => fetchRequests(isEmployee),
    });

    const mutation = useMutation({ 
        mutationFn: makeDecision,
        onSuccess: () => {
            toast.success('Decision submitted successfully!');
            queryClient.invalidateQueries({ queryKey: ['requests'] });
            setIsModalOpen(false);
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to submit decision.');
        }
    });

    const handleOpenModal = (payload: EditDecisionPayload) => {
        setModalPayload(payload);
        setIsModalOpen(true);
    };

    const handleSaveChanges = (newDecision: Decision['decision']) => {
        if (!modalPayload) return;

        const payload: { requestId: number, decision: Decision['decision'], boardMemberId?: number } = {
            requestId: modalPayload.requestId,
            decision: newDecision,
        };

        if (isAdmin) {
            payload.boardMemberId = modalPayload.boardMemberId;
        }
        
        mutation.mutate(payload);
    };

    const defaultFilter: StatusFilter = isEmployee ? 'all' : 'pending';
    const [filter, setFilter] = useState<StatusFilter>(defaultFilter);

    const filterOptions = [
        { value: 'all', label: 'All' },
        { value: 'pending', label: 'Pending' },
        { value: 'approved', label: 'Approved' },
        { value: 'rejected', label: 'Rejected' },
    ];

    const filteredRequests = useMemo(() => {
        if (filter === 'all') return requests;
        return requests.filter(req => req.status === filter);
    }, [requests, filter]);

    if (error) {
        toast.error('Failed to fetch requests.');
    }

    return (
        <div>
            <div className="page-header">
                <h1>{isEmployee ? 'My Requests' : 'All Employee Requests'}</h1>
            </div>

            {screenSize === 'small' ? (
                <FilterDropdown 
                    currentFilter={filter}
                    onFilterChange={(value) => setFilter(value as StatusFilter)}
                    options={filterOptions}
                />
            ) : (
                <div className="filter-tabs">
                    <button onClick={() => setFilter('all')} className={`filter-tab ${filter === 'all' ? 'active' : ''}`}>All</button>
                    <button onClick={() => setFilter('pending')} className={`filter-tab ${filter === 'pending' ? 'active' : ''}`}>Pending</button>
                    <button onClick={() => setFilter('approved')} className={`filter-tab ${filter === 'approved' ? 'active' : ''}`}>Approved</button>
                    <button onClick={() => setFilter('rejected')} className={`filter-tab ${filter === 'rejected' ? 'active' : ''}`}>Rejected</button>
                </div>
            )}
            
            {isLoading && <p>Loading requests...</p>}
            
            {!isLoading && filteredRequests.length === 0 && (
                <p>No requests found for this category.</p>
            )}

            {!isLoading && filteredRequests.map(req => (
                <RequestCard 
                    key={req.id} 
                    request={req} 
                    onDecision={(requestId, decision) => mutation.mutate({ requestId, decision })} 
                    onEditDecision={handleOpenModal}
                />
            ))}

            {isModalOpen && modalPayload && (
                <EditDecisionModal 
                    payload={modalPayload}
                    onClose={() => setIsModalOpen(false)}
                    onSave={handleSaveChanges}
                    isSaving={mutation.isPending}
                />
            )}
        </div>
    );
};

export default ViewRequests;
