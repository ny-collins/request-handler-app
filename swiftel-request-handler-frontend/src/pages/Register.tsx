import api from '../api';
import toast from 'react-hot-toast';
import { Link, useNavigate } from 'react-router-dom';
import { Input } from '../components/ui/Input';
import Button from '../components/ui/Button';
import { useForm } from 'react-hook-form';
import { getErrorMessage } from '../utils/error.utils';

interface RegisterForm {
    name: string;
    email: string;
    password: string;
}

const Register = () => {
    const navigate = useNavigate();
    const { register, handleSubmit, formState: { errors } } = useForm<RegisterForm>();

    const onSubmit = async (data: RegisterForm) => {
        try {
            await api.post('/auth/register', data);
            toast.success('Registration successful! Please log in.');
            navigate('/login');
        } catch (error: any) {
            toast.error(getErrorMessage(error));
        }
    };

    return (
        <div className="form-card">
            <h2>Create an Account</h2>
            <form onSubmit={handleSubmit(onSubmit)}>
                <div className="form-group">
                    <label htmlFor="name">Name</label>
                    <Input type="text" id="name" {...register("name", { required: "Name is required" })} />
                    {errors.name && <p className="error-text">{errors.name.message}</p>}
                </div>
                <div className="form-group">
                    <label htmlFor="email">Email</label>
                    <Input type="email" id="email" {...register("email", { required: "Email is required" })} />
                    {errors.email && <p className="error-text">{errors.email.message}</p>}
                </div>
                <div className="form-group">
                    <label htmlFor="password">Password</label>
                    <Input type="password" id="password" {...register("password", { required: "Password is required", minLength: { value: 6, message: "Password must be at least 6 characters" } })} />
                    {errors.password && <p className="error-text">{errors.password.message}</p>}
                </div>
                <Button type="submit" className="w-full">Register</Button>
            </form>
            <p style={{ textAlign: 'center', marginTop: '1rem' }}>
                Already have an account? <Link to="/login">Login here</Link>
            </p>
        </div>
    );
};

export default Register;
