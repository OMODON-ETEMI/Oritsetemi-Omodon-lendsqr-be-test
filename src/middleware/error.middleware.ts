import { Request, Response, NextFunction } from 'express';
import { DuplicateEntryError, DatabaseError } from '../shared/errors/database.errors';

export function errorHandler(err: Error, req: Request, res: Response, next: NextFunction) {
    console.error('Error:', err);

    if (err instanceof DuplicateEntryError) {
        return res.status(409).json({ status: 'error', message: err.message });
    }

    if (err instanceof DatabaseError) {
        return res.status(500).json({ status: 'error', message: 'Database error' });
    }

    if (err.message.includes('required') || err.message.includes('invalid')) {
        return res.status(400).json({ status: 'error', message: err.message });
    }

    res.status(500).json({ status: 'error', message: 'Internal server error' });
}