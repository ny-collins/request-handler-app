import { Router } from 'express';
import {
    createRequest,
    getMyRequests,
    getAllRequests,
    makeDecision,
    adminUpdateDecision,
    getDashboardStats
} from '../controllers/request.controller';
import { protect, authorize } from '../middleware/auth.middleware';

const router = Router();

router.route('/')
    .post(protect, authorize('employee'), createRequest)
    .get(protect, authorize('admin', 'board_member'), getAllRequests);

router.get('/my-requests', protect, authorize('employee'), getMyRequests);
router.get('/stats', protect, getDashboardStats);

router.post('/:id/decide', protect, authorize('board_member', 'admin'), makeDecision);



export default router;
