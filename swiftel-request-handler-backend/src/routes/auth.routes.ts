import { Router } from 'express';
import { registerUser, loginUser } from '../controllers/auth.controller';

const router = Router();

router.post('/register', registerUser);
router.post('/login', login);

export default router;
