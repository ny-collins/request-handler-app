import api from '../api';
import toast from 'react-hot-toast';
import { Input, Checkbox, Textarea } from '../components/ui/Input';
import Button from '../components/ui/Button';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';

interface RequestForm {
    title: string;
    description: string;
    is_monetary: boolean;
    amount?: number;
}

const MakeRequest = () => {
    const navigate = useNavigate();
    const { register, handleSubmit, watch, formState: { errors } } = useForm<RequestForm>();
    const isMonetary = watch("is_monetary");

    const onSubmit = async (data: RequestForm) => {
        try {
            const requestData = {
                ...data,
                amount: data.is_monetary ? Number(data.amount) : undefined,
            };
            await api.post('/requests', requestData);
            toast.success('Request submitted successfully!');
            navigate('/my-requests');
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to submit request.');
        }
    };

    return (
        <div>
            <div className="page-header">
                <h1>Make a New Request</h1>
            </div>
            <div className="form-card" style={{ maxWidth: '700px' }}>
                <form onSubmit={handleSubmit(onSubmit)}>
                    <div className="form-group">
                        <label htmlFor="title">Request Title</label>
                        <Input id="title" {...register("title", { required: "Title is required" })} />
                        {errors.title && <p className="error-text">{errors.title.message}</p>}
                    </div>
                    <div className="form-group">
                        <label htmlFor="description">Description</label>
                        <Textarea id="description" {...register("description", { required: "Description is required" })} />
                        {errors.description && <p className="error-text">{errors.description.message}</p>}
                    </div>
                    <div className="form-group">
                        <label className="checkbox-label">
                            <Checkbox {...register("is_monetary")} />
                            Is this a monetary request?
                        </label>
                    </div>
                    {isMonetary && (
                        <div className="form-group">
                            <label htmlFor="amount">Amount (KES)</label>
                            <Input type="number" id="amount" {...register("amount", { required: "Amount is required for monetary requests", valueAsNumber: true, min: { value: 1, message: "Amount must be positive" } })} min="0.01" step="0.01" />
                            {errors.amount && <p className="error-text">{errors.amount.message}</p>}
                        </div>
                    )}
                    <Button type="submit" className="w-full">Submit Request</Button>
                </form>
            </div>
        </div>
    );
};

export default MakeRequest;
