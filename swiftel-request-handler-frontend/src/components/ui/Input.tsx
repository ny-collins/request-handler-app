import { forwardRef, InputHTMLAttributes, useState } from 'react';
import { FiEye, FiEyeOff } from 'react-icons/fi';

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(({ type, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const isPassword = type === 'password';

    const togglePasswordVisibility = () => {
        setShowPassword(prev => !prev);
    };

    return (
        <div className="input-wrapper">
            <input 
                className="input-field" 
                type={isPassword && !showPassword ? 'password' : 'text'}
                {...props} 
                ref={ref} 
            />
            {isPassword && (
                <span className="password-toggle-icon" onClick={togglePasswordVisibility}>
                    {showPassword ? <FiEyeOff /> : <FiEye />}
                </span>
            )}
        </div>
    );
});

export const Textarea = forwardRef<HTMLTextAreaElement, InputHTMLAttributes<HTMLTextAreaElement>>((props, ref) => {
    return <textarea className="input-field textarea-field" {...props} ref={ref} />;
});

export const Checkbox = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>((props, ref) => {
    return <input type="checkbox" {...props} ref={ref} />;
});
