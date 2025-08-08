import { Router } from 'express';
import { registerUser, loginUser } from '../controllers/auth.controller';

const router = Router();

router.post('/register', registerUser);
router.post('/login', login);

// Health check route for Railway
router.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

export default router;
