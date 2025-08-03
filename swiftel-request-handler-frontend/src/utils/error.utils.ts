import { AxiosError } from 'axios';

interface BackendError {
    message: string;
    errors?: { [key: string]: string[] }; // For Zod validation errors
}

export const getErrorMessage = (error: unknown): string => {
    if (error instanceof AxiosError) {
        const backendError = error.response?.data as BackendError;
        if (backendError?.message) {
            return backendError.message;
        } else if (backendError?.errors) {
            // Handle Zod validation errors
            const fieldErrors = Object.values(backendError.errors).flat();
            return fieldErrors.join(', ');
        }
    }
    if (error instanceof Error) {
        return error.message;
    }
    return 'An unexpected error occurred.';
};