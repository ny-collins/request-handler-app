import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api';
import toast from 'react-hot-toast';
import { Input, Textarea } from './ui/Input';
import Button from './ui/Button';

interface QuickRequestFormFields {
    title: string;
    description: string;
}

const QuickRequestForm = () => {
    const queryClient = useQueryClient();
    const { register, handleSubmit, reset, formState: { errors } } = useForm<QuickRequestFormFields>();

    const mutation = useMutation({
        mutationFn: (newData: QuickRequestFormFields) => 
            api.post('/requests', { ...newData, is_monetary: false }),
        onSuccess: () => {
            toast.success('Quick request submitted!');
            reset();
            queryClient.invalidateQueries({ queryKey: ['requests', true] }); // Invalidate employee's requests
            queryClient.invalidateQueries({ queryKey: ['dashboardStats'] }); // Invalidate stats
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Submission failed.');
        }
    });

    const onSubmit = (data: QuickRequestFormFields) => {
        mutation.mutate(data);
    };

    return (
        <div className="quick-request-form-card">
            <h3>Make a Quick (Non-Monetary) Request</h3>
            <form onSubmit={handleSubmit(onSubmit)}>
                <div className="form-group">
                    <label>Title</label>
                    <Input {...register('title', { required: 'Title is required' })} />
                    {errors.title && <p className="error-text">{errors.title.message}</p>}
                </div>
                <div className="form-group">
                    <label>Description</label>
                    <Textarea {...register('description', { required: 'Description is required' })} />
                    {errors.description && <p className="error-text">{errors.description.message}</p>}
                </div>
                <Button type="submit" disabled={mutation.isPending} className="w-full">
                    {mutation.isPending ? 'Submitting...' : 'Submit Quick Request'}
                </Button>
            </form>
        </div>
    );
};

export default QuickRequestForm;
