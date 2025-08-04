import { useAuth } from '../hooks/useAuth';
import api from '../api';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { Input, Checkbox } from '../components/ui/Input';
import Button from '../components/ui/Button';
import { useForm } from 'react-hook-form';
import { getErrorMessage } from '../utils/error.utils';

interface LoginForm {
    email: string;
    password: string;
    rememberMe: boolean;
}

const Login = () => {
    const { login } = useAuth();
    const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>();

    const onSubmit = async (data: LoginForm) => {
        try {
            const { data: response } = await api.post('/auth/login', data);
            login(response.token);
            toast.success('Logged in successfully!');
        } catch (error: any) {
            toast.error(getErrorMessage(error));
        }
    };

    return (
        <div className="form-card">
            <h2>Login to Swiftel</h2>
            <form onSubmit={handleSubmit(onSubmit)}>
                <div className="form-group">
                    <label htmlFor="email">Email</label>
                    <Input type="email" id="email" {...register("email", { required: "Email is required" })} />
                    {errors.email && <p className="error-text">{errors.email.message}</p>}
                </div>
                <div className="form-group">
                    <label htmlFor="password">Password</label>
                    <Input type="password" id="password" {...register("password", { required: "Password is required" })} />
                    {errors.password && <p className="error-text">{errors.password.message}</p>}
                </div>
                <div className="form-group">
                   <label className="checkbox-label">
                     <Checkbox {...register("rememberMe")} />
                     Remember Me
                   </label>
                </div>
                <Button type="submit" className="w-full">Login</Button>
            </form>
            <p style={{ textAlign: 'center', marginTop: '1rem' }}>
                No account? <Link to="/register">Register here</Link>
            </p>
        </div>
    );
};

export default Login;
