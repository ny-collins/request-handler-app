import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getNotifications, markNotificationAsRead } from '../api';
import toast from 'react-hot-toast';

export const useNotifications = () => {
    const queryClient = useQueryClient();

    const { data: notifications = [], isLoading } = useQuery({
        queryKey: ['notifications'],
        queryFn: getNotifications,
        staleTime: 1000 * 60 * 5, // 5 minutes
    });

    const mutation = useMutation({
        mutationFn: markNotificationAsRead,
        onSuccess: () => {
            // Invalidate and refetch the notifications query to get the updated list
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
        },
        onError: () => {
            toast.error('Failed to mark notification as read.');
        }
    });

    const unreadCount = notifications.filter(n => !n.is_read).length;

    return {
        notifications,
        isLoading,
        unreadCount,
        markAsRead: mutation.mutate,
    };
};
