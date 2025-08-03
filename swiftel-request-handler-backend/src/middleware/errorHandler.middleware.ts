import { Request, Response, NextFunction } from 'express';

export const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error(err.stack); // Keep detailed logs for the server

    // Send a generic message to the client
    res.status(500).json({ message: 'An unexpected internal server error occurred.' });
};
