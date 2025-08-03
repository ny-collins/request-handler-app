import express from 'express';
import cors from 'cors';
import { env } from './config/environment';
import { errorHandler } from './middleware/errorHandler.middleware';

// Import routes
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import requestRoutes from './routes/request.routes';
import notificationRoutes from './routes/notification.routes'; // Import notification routes

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/notifications', notificationRoutes); // Add notification routes

// Custom Error Handler
app.use(errorHandler);

const PORT = env.PORT;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
