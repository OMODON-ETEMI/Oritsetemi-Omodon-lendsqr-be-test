import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../modules/auth/auth.service';

export const authenticate = (authService: AuthService) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            const token = req.headers.authorization?.replace('Bearer ', '');
            if (!token) {
                return res.status(401).json({ status: 'error', message: 'Authentication required' });
            }

            const user = await authService.validateToken(token);
            (req as any).user = user;
            next();
        } catch (error) {
            res.status(401).json({ status: 'error', message: 'Invalid token' });
        }
    };
};