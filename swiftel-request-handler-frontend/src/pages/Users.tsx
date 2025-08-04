import api from '../api';
import toast from 'react-hot-toast';
import { useQuery } from '@tanstack/react-query';
import { User } from '../types';
import UserItem from '../components/UserItem'; // Import the new UserItem component

const fetchUsers = async () => {
    const { data } = await api.get<User[]>('/users');
    return data;
};

const Users = () => {

    const { data: users = [], isLoading, error } = useQuery<User[], Error>({
        queryKey: ['users'],
        queryFn: fetchUsers,
    });

    if (error) {
        toast.error('Failed to fetch users.');
    }

    return (
        <div>
            <div className="page-header"><h1>User Management</h1></div>
            {isLoading && <p>Loading users...</p>}
            <div className="users-list-grid">
                {users.map(user => (
                    <UserItem key={user.id} user={user} />
                ))}
            </div>
        </div>
    );
};

export default Users;