import { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    children: ReactNode;
    variant?: 'primary' | 'secondary' | 'approve' | 'reject';
}

const Button = ({ children, variant = 'primary', className, ...props }: ButtonProps) => {
    const baseClasses = 'btn';
    const variantClasses = {
        primary: 'btn-primary',
        secondary: 'btn-secondary',
        approve: 'btn-approve',
        reject: 'btn-reject'
    };
    
    return (
        <button className={`${baseClasses} ${variantClasses[variant]} ${className || ''}`} {...props}>
            {children}
        </button>
    );
};

export default Button;
