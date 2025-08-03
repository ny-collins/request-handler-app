import api from '../api';
import toast from 'react-hot-toast';
import { Input } from '../components/ui/Input';
import Button from '../components/ui/Button';
import { useForm } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { User } from '../types';

interface AccountForm {
    username?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
}

const fetchAccountDetails = async () => {
    const { data } = await api.get<User>('/users/me');
    return data;
};

const updateAccount = async (data: Partial<AccountForm>) => {
    const { data: response } = await api.patch('/users/me', data);
    return response;
};

const Account = () => {
    const queryClient = useQueryClient();
    const { data: user, isLoading } = useQuery<User, Error>({
        queryKey: ['account'],
        queryFn: fetchAccountDetails,
    });

    const { register, handleSubmit, watch, reset, formState: { errors } } = useForm<AccountForm>({
        values: user, // Pre-fill form with fetched data
    });

    const mutation = useMutation({ 
        mutationFn: updateAccount,
        onSuccess: () => {
            toast.success("Account updated successfully!");
            reset();
            queryClient.invalidateQueries({ queryKey: ['account'] });
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || "Failed to update account.");
        }
    });

    const onSubmit = (data: AccountForm) => {
        const { confirmPassword, ...updateData } = data;
        if (!updateData.password) {
            delete updateData.password;
        }
        mutation.mutate(updateData);
    };

    return (
        <div>
            <div className="page-header">
                <h1>My Account</h1>
            </div>
            {isLoading && <p>Loading account details...</p>}
            {user && (
                <div className="form-card" style={{ maxWidth: '600px' }}>
                    <form onSubmit={handleSubmit(onSubmit)}>
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
                        <hr style={{ margin: '2rem 0' }} />
                        <p>Update Password (leave blank to keep current password)</p>
                        <div className="form-group">
                            <label>New Password</label>
                            <Input type="password" {...register("password")} />
                        </div>
                         <div className="form-group">
                            <label>Confirm New Password</label>
                            <Input type="password" {...register("confirmPassword", { 
                                validate: value => value === watch('password') || "Passwords do not match"
                            })} />
                            {errors.confirmPassword && <p className="error-text">{errors.confirmPassword.message}</p>}
                        </div>
                        <Button type="submit" disabled={mutation.isPending} className="w-full">Update Account</Button>
                    </form>
                </div>
            )}
        </div>
    );
};

export default Account;
