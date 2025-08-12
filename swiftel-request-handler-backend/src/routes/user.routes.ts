import { Router } from 'express';
import { getAllUsers, updateUserByAdmin, getMyAccount, updateMyAccount, getRoles, deleteUserByAdmin } from '../controllers/user.controller';
import { protect, authorize } from '../middleware/auth.middleware';

const router = Router();

router.get('/me', protect, getMyAccount);
router.patch('/me', protect, updateMyAccount);

router.get('/', protect, authorize('admin', 'board_member'), getAllUsers);
router.get('/roles', protect, authorize('admin'), getRoles);
router.patch('/:id', protect, authorize('admin'), updateUserByAdmin);
router.delete('/:id', protect, authorize('admin'), deleteUserByAdmin);


export default router;
