import { Router } from 'express';
import {
    createRequest,
    getMyRequests,
    getAllRequests,
    makeDecision,
    getDashboardStats,
    getRequestById,
    updateRequest,
    deleteRequest,
    adminDeleteRequest,
    adminUpdateRequest
} from '../controllers/request.controller';
import { protect, authorize } from '../middleware/auth.middleware';

const router = Router();

router.route('/')
    .post(protect, authorize('employee'), createRequest)
    .get(protect, authorize('admin', 'board_member'), getAllRequests);

router.get('/my-requests', protect, authorize('employee'), getMyRequests);
router.get('/stats', protect, getDashboardStats);

router.route('/:id')
    .get(protect, getRequestById)
    .patch(protect, authorize('employee'), updateRequest)
    .delete(protect, authorize('employee'), deleteRequest);

router.delete('/:id/admin', protect, authorize('admin'), adminDeleteRequest);
router.patch('/:id/admin', protect, authorize('admin'), adminUpdateRequest);

router.post('/:id/decide', protect, authorize('board_member', 'admin'), makeDecision);

export default router;

