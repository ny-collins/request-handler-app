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
const allowedOrigins = [env.FRONTEND_URL];

const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // Log the origin for debugging
    console.log("Incoming request from origin:", origin);

    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) {
      return callback(null, true);
    }

    const trimmedOrigin = origin.trim();
    console.log("Trimmed origin for comparison:", trimmedOrigin);

    if (allowedOrigins.indexOf(trimmedOrigin) !== -1) {
      callback(null, true);
    } else {
      console.error(`CORS error: Origin ${origin} not allowed.`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};

app.use(cors(corsOptions));

// Explicitly handle preflight requests
app.options('*', cors(corsOptions));
app.use(express.json());

// Railway health check route
app.get('/', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

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
