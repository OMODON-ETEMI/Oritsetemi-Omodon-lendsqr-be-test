jest.mock('bcryptjs', () => ({
  compare: jest.fn(),
  hash: jest.fn(() => '$2b$10$hashedpassword')
}));
jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(() => 'mock-jwt-token'),
  verify: jest.fn()
}));
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mock-uuid-123')
}));

import { AuthService } from '../../src/modules/auth/auth.service';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

describe('AuthService Unit Tests', () => {
  let authService: AuthService;
  let mockDb: any;
  let mockTrx: any;

beforeEach(() => {
  const queryBuilder = {
    where: jest.fn().mockReturnThis(),
    forUpdate: jest.fn().mockReturnThis(),
    first: jest.fn(),
    insert: jest.fn().mockResolvedValue(['mock-uuid-123']),
    increment: jest.fn().mockResolvedValue(1),
    decrement: jest.fn().mockResolvedValue(1),
    del: jest.fn()
  };

  mockTrx = jest.fn(() => queryBuilder);
  Object.assign(mockTrx, queryBuilder);

  mockDb = jest.fn(() => queryBuilder);
  mockDb.transaction = jest.fn((callback) => callback(mockTrx));

  authService = new AuthService(mockDb as any);
});

  describe('login', () => {
    it('should login with valid credentials', async () => {
      mockTrx.first
        .mockResolvedValueOnce({ id: 'user-id', email: 'john@test.com', password: 'hashed' })
        .mockResolvedValueOnce(null);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await authService.login('john@test.com', 'password123');

      expect(result.user.email).toBe('john@test.com');
      expect(result.token).toBe('mock-jwt-token');
    });

    it('should fail with invalid email', async () => {
      mockTrx.first.mockResolvedValue(null);

      await expect(authService.login('wrong@test.com', 'password123'))
        .rejects.toThrow('Invalid credentials');
    });

    it('should fail with invalid password', async () => {
      mockTrx.first.mockResolvedValue({ email: 'john@test.com', password: 'hashed' });
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(authService.login('john@test.com', 'wrongpassword'))
        .rejects.toThrow('Invalid credentials');
    });
  });

  describe('validateToken', () => {
    it('should validate valid token', async () => {
      (jwt.verify as jest.Mock).mockReturnValue({ userId: 'user-id' });
      mockTrx.first
        .mockResolvedValueOnce({ token: 'valid-token', expires_at: new Date('2099-01-01') })
        .mockResolvedValueOnce({ id: 'user-id', email: 'john@test.com' });

      const user = await authService.validateToken('valid-token');
      expect(user.email).toBe('john@test.com');
    });

    it('should reject invalid token', async () => {
      (jwt.verify as jest.Mock).mockImplementation(() => { throw new Error('Invalid'); });

      await expect(authService.validateToken('invalid-token')).rejects.toThrow();
    });

    it('should reject expired token', async () => {
      (jwt.verify as jest.Mock).mockReturnValue({ userId: 'user-id' });
      mockTrx.first.mockResolvedValue(null);

      await expect(authService.validateToken('expired-token')).rejects.toThrow();
    });
  });

  describe('logout', () => {
    it('should delete token', async () => {
      await authService.logout('token');
      expect(mockTrx.del).toHaveBeenCalled();
    });
  });
});