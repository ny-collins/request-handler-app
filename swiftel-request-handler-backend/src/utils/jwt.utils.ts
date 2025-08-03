import jwt from 'jsonwebtoken';
import { env } from '../config/environment';
import { convertTimeToSeconds } from './time.utils';

export const generateToken = (id: number, role: string, username: string, rememberMe: boolean): string => {
    const expiresInString = rememberMe ? env.JWT_REMEMBER_ME_EXPIRES_IN : env.JWT_EXPIRES_IN;
    const expiresIn = convertTimeToSeconds(expiresInString);
    return jwt.sign({ id, role, username }, env.JWT_SECRET as string, { expiresIn });
};
