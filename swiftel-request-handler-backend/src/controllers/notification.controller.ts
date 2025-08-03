import { Response } from 'express';
import { AuthenticatedRequest } from '../models/types';
import * as notificationService from '../services/notification.service';

export const getNotifications = async (req:AuthenticatedRequest, res: Response) => {
	try {
        	const notifications = await notificationService.getNotifications(req.user!.id);
        	res.status(200).json(notifications);
	} catch (error) {
		res.status(500).json({ message: 'Failed to retrieve notifications.' });
	}
};

export const markAsRead = async (req: AuthenticatedRequest, res: Response) => {
	try {
		const notification = await notificationService.markAsRead(parseInt(req.params.id, 10));
		res.status(200).json(notification);
	} catch (error) {
		res.status(500).json({ message: 'Failed to mark notification as read.' });
	}
};
