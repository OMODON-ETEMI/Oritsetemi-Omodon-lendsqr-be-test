jest.mock('uuid', () => ({ v4: () => 'mock-uuid-123' }));

import { WalletService } from '../../src/modules/wallet/wallet.service';

describe('WalletService Unit Tests', () => {
  let walletService: WalletService;
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

  walletService = new WalletService(mockDb as any);
});

  describe('Transaction Rollback', () => {
    it('should rollback if receiver wallet not found', async () => {
      mockTrx.first
        .mockResolvedValueOnce({ id: 'wallet1', balance: 1000 })
        .mockResolvedValueOnce(null);

      await expect(walletService.transferFunds({
        fromWalletId: 'wallet1',
        toWalletId: 'invalid',
        amount: 500,
        reference: 'ref',
        description: 'test'
      })).rejects.toThrow('Receiver wallet not found');

      expect(mockTrx.decrement).not.toHaveBeenCalled();
    });

    it('should complete transfer atomically', async () => {
      mockTrx.first
        .mockResolvedValueOnce({ id: 'wallet1', balance: 1000 })
        .mockResolvedValueOnce({ id: 'wallet2', balance: 0 });

      await walletService.transferFunds({
        fromWalletId: 'wallet1',
        toWalletId: 'wallet2',
        amount: 300,
        reference: 'ref',
        description: 'test'
      });

      expect(mockTrx.decrement).toHaveBeenCalledWith('balance', 300);
      expect(mockTrx.increment).toHaveBeenCalledWith('balance', 300);
      expect(mockTrx.insert).toHaveBeenCalled();
    });

    it('should prevent insufficient funds', async () => {
      mockTrx.first.mockResolvedValue({ id: 'wallet1', balance: 100 });

      await expect(walletService.transferFunds({
        fromWalletId: 'wallet1',
        toWalletId: 'wallet2',
        amount: 500,
        reference: 'ref',
        description: 'test'
      })).rejects.toThrow('Insufficient funds');
    });
  });
});