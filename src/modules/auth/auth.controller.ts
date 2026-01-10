import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service';

export class AuthController {
    constructor(private authService: AuthService) {}

    login = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { email, password } = req.body;
            const result = await this.authService.login(email, password);

            res.status(200).json({
                status: 'success',
                data: {
                    user: {
                        id: result.user.id,
                        email: result.user.email,
                        first_name: result.user.first_name,
                        last_name: result.user.last_name
                    },
                    token: result.token
                }
            });
        } catch (error) {
            next(error);
        }
    };

    logout = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const token = req.headers.authorization?.replace('Bearer ', '');
            if (!token) throw new Error('Token required');

            await this.authService.logout(token);
            res.status(200).json({ status: 'success', message: 'Logged out' });
        } catch (error) {
            next(error);
        }
    };
}