jest.mock('uuid', () => ({ v4: () => 'mock-uuid-123' }));
jest.mock('bcryptjs', () => ({ hash: jest.fn(() => '$2b$10$hashedpassword') }));

import { UserService } from '../../src/modules/user/user.service';

describe('UserService Unit Tests', () => {
  let userService: UserService;
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
  };

  mockTrx = jest.fn(() => queryBuilder);
  Object.assign(mockTrx, queryBuilder);

  mockDb = jest.fn(() => queryBuilder);
  mockDb.transaction = jest.fn((callback) => callback(mockTrx));

  userService = new UserService(mockDb as any);
});

  describe('createUser', () => {
    it('should create user, wallet, and token atomically', async () => {
      mockTrx.first.mockResolvedValue({
        id: 'mock-uuid-123',
        email: 'john@test.com',
        first_name: 'John',
        password: '$2b$10$hashedpassword'
      });

      const result = await userService.createUser({
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@test.com',
        phone_number: '+2341234567890',
        password: 'password123'
      });

      expect(mockTrx.insert).toHaveBeenCalledTimes(3); // user, wallet, token
      expect(result.user.email).toBe('john@test.com');
      expect(result.token).toBeDefined();
    });

    it('should hash password', async () => {
      mockTrx.first.mockResolvedValue({
        id: 'mock-uuid-123',
        password: '$2b$10$hashedpassword'
      });

      await userService.createUser({
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@test.com',
        phone_number: '+2341234567890',
        password: 'password123'
      });

      const bcrypt = require('bcryptjs');
      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
    });

    it('should throw error for missing fields', async () => {
      await expect(userService.createUser({
        first_name: '',
        last_name: 'Doe',
        email: 'john@test.com',
        phone_number: '+2341234567890',
        password: 'password123'
      })).rejects.toThrow('All inputs are required');
    });

    it('should handle duplicate email error', async () => {
      const dupError: any = new Error('Duplicate');
      dupError.code = 'ER_DUP_ENTRY';
      mockTrx.insert.mockRejectedValue(dupError);

      await expect(userService.createUser({
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@test.com',
        phone_number: '+2341234567890',
        password: 'password123'
      })).rejects.toThrow();
    });
  });

  describe('findById', () => {
    it('should return user by ID', async () => {
      mockTrx.first.mockResolvedValue({ id: 'user-id', email: 'john@test.com' });

      const user = await userService.findById('user-id');
      expect(user?.email).toBe('john@test.com');
    });

    it('should return null for non-existent ID', async () => {
      mockTrx.first.mockResolvedValue(null);

      const user = await userService.findById('non-existent');
      expect(user).toBeNull();
    });
  });

  describe('findByEmail', () => {
    it('should return user by email', async () => {
      mockTrx.first.mockResolvedValue({ email: 'john@test.com', first_name: 'John' });

      const user = await userService.findByEmail('john@test.com');
      expect(user?.first_name).toBe('John');
    });

    it('should return null for non-existent email', async () => {
      mockTrx.first.mockResolvedValue(null);

      const user = await userService.findByEmail('nonexistent@test.com');
      expect(user).toBeNull();
    });
  });
});