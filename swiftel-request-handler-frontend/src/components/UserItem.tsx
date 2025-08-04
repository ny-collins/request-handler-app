import React, { useState } from 'react';
import api from '../api';
import toast from 'react-hot-toast';
import { useAuth } from '../hooks/useAuth';
import Button from './ui/Button';
import { Input } from './ui/Input';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { User } from '../types';
import { useForm } from 'react-hook-form';

interface UserItemProps {
    user: User;
}

const updateUser = async (userData: User) => {
    const { data } = await api.patch(`/users/${userData.id}`, userData);
    return data;
};

const UserForm = ({ user, onSave, onCancel }: { user: User, onSave: (data: User) => void, onCancel: () => void }) => {
    const { register, handleSubmit, formState: { errors } } = useForm<User>({ defaultValues: user });

    return (
        <form onSubmit={handleSubmit(onSave)} className="user-edit-form">
            <div className="form-group">
                <label>Username</label>
                <Input {...register("username", { required: "Username is required" })} />
                {errors.username && <p className="error-text">{errors.username.message}</p>}
            </div>
            <div className="form-group">
                <label>Email</label>
                <Input type="email" {...register("email", { required: "Email is required" })} />
                {errors.email && <p className="error-text">{errors.email.message}</p>}
            </div>
            <div className="form-group">
                <label>Role</label>
                <select className="input-field" {...register("role", { required: "Role is required" })}>
                    <option value="employee">Employee</option>
                    <option value="board_member">Board Member</option>
                    <option value="admin">Admin</option>
                </select>
            </div>
            <div className="form-actions">
                <Button type="submit" className="btn-sm">Save</Button>
                <Button variant="secondary" onClick={onCancel} className="btn-sm">Cancel</Button>
            </div>
        </form>
    );
};

const UserItem: React.FC<UserItemProps> = ({ user }) => {
    const { user: currentUser } = useAuth();
    const queryClient = useQueryClient();
    const [isEditing, setIsEditing] = useState(false);

    const mutation = useMutation({
        mutationFn: updateUser,
        onSuccess: () => {
            toast.success("User updated successfully!");
            setIsEditing(false);
            queryClient.invalidateQueries({ queryKey: ['users'] });
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || "Failed to update user.");
        }
    });

    const handleEditClick = () => {
        if (user.role === 'admin') {
            toast.error("Admin accounts cannot be modified.");
            return;
        }
        setIsEditing(true);
    };

    const handleSave = (data: User) => {
        mutation.mutate(data);
    };

    const handleCancel = () => {
        setIsEditing(false);
    };

    return (
        <div className="user-item-card">
            {isEditing ? (
                <UserForm user={user} onSave={handleSave} onCancel={handleCancel} />
            ) : (
                <div className="user-item-display">
                    <div className="user-details">
                        <h3>{user.username}</h3>
                        <p className="user-email">{user.email}</p>
                        <span className={`user-role role-${user.role!}`}>{user.role!.replace('_', ' ').toUpperCase()}</span>
                    </div>
                    {currentUser?.role === 'admin' && user.role !== 'admin' && (
                        <Button onClick={handleEditClick} className="btn-sm">Edit</Button>
                    )}
                </div>
            )}
        </div>
    );
};

export default UserItem;