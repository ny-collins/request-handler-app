import { Router } from 'express';
import * as notificationController from '../controllers/notification.controller';
import { protect } from '../middleware/auth.middleware';

const router = Router();

router.get('/', protect, notificationController.getNotifications);
router.put('/mark-all-read', protect, notificationController.markAllAsRead);
router.put('/:id/read', protect, notificationController.markAsRead);

export default router;
