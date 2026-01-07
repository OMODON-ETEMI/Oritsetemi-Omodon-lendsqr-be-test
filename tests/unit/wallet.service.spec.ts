// src/tests/unit/wallet.service.spec.ts
jest.mock('uuid', () => ({
  v4: () => 'mock-uuid-123'
}));

import { FundWalletInput, TransferFundsInput, WithdrawFundsInput,  } from "../../src/modules/wallet/types/wallet-transactions-input.types";
import { WalletService } from "../../src/modules/wallet/wallet.service";
import { Knex } from "knex";

describe("WalletService", () => {
  let walletService: WalletService;
  let trx: any;
  let queryBuilder: any;
  let db: any;

  beforeEach(() => {
    const trx_builder = {
      where: jest.fn().mockReturnThis(),
      increment: jest.fn().mockResolvedValue(undefined),
      decrement: jest.fn().mockResolvedValue(undefined),
      forUpdate: jest.fn().mockReturnThis(),
      insert: jest.fn().mockResolvedValue([1]),
      first: jest.fn().mockResolvedValue({
        id: "wallet-id",
        user_id: "user-id",
        balance: 1000,
      }),
    };

     queryBuilder = {
      where: jest.fn().mockReturnThis(),
      first: jest.fn().mockResolvedValue({
        walletId: "wallet-id",
        userId: "user-id",
        balance: 1000,
      }),
    };

  db = jest.fn(() => queryBuilder);
  trx = jest.fn(() => trx_builder)
  db.transaction = jest.fn(async (cb) => cb(trx));

    walletService = new WalletService(db as any);
  });


  // -------------------
  // CREATE WALLET
  // -------------------
  describe("createWallet", () => {
    it("should create a wallet for a valid user ID", async () => {
      // Implement test logic later
      await expect(walletService.createWallet("user-uuid")).resolves.not.toThrow();
    });

    it("should throw an error if userId is invalid", async () => {
      await expect(walletService.createWallet("")).rejects.toThrow();
    });
  });

  // -------------------
  // FUND WALLET
  // -------------------
  describe("fundWallet", () => {
    it("should increase wallet balance for valid input", async () => {
      const input: FundWalletInput = {
        walletId: "wallet-uuid",
        amount: 1000,
        reference: "ref123",
        description: "Test funding",
      };
      await expect(walletService.fundWallet(input)).resolves.not.toThrow();
    });

    it("should throw an error if wallet does not exist", async () => {
      const input: FundWalletInput = {
        walletId: "",
        amount: 1000,
        reference: "ref123",
        description: "Test funding",
      };
      await expect(walletService.fundWallet(input)).rejects.toThrow();
    });

    it("should throw an error if amount is negative or zero", async () => {
      const input: FundWalletInput = {
        walletId: "wallet-uuid",
        amount: 0,
        reference: "ref123",
        description: "Test funding",
      };
      await expect(walletService.fundWallet(input)).rejects.toThrow();
    });
  });

  // -------------------
  // TRANSFER FUNDS
  // -------------------
  describe("transferFunds", () => {
    it("should transfer funds between wallets successfully", async () => {
      const input: TransferFundsInput = {
        fromWalletId: "wallet1",
        toWalletId: "wallet2",
        amount: 500,
        reference: "transfer-ref",
        description: "Test transfer",
      };
      await expect(walletService.transferFunds(input)).resolves.not.toThrow();
    });

    it("should fail if sender has insufficient funds", async () => {
      const input: TransferFundsInput = {
        fromWalletId: "wallet1",
        toWalletId: "wallet2",
        amount: 999999,
        reference: "transfer-ref",
        description: "Test transfer",
      };
      await expect(walletService.transferFunds(input)).rejects.toThrow();
    });

    it("should fail if sender or receiver wallet is invalid", async () => {
      const input: TransferFundsInput = {
        fromWalletId: "",
        toWalletId: "",
        amount: 100,
        reference: "transfer-ref",
        description: "Test transfer",
      };
      await expect(walletService.transferFunds(input)).rejects.toThrow();
    });
  });

  // -------------------
  // WITHDRAW FUNDS
  // -------------------
  describe("withdrawFunds", () => {
    it("should decrease wallet balance for valid withdrawal", async () => {
      const input: WithdrawFundsInput = {
        walletId: "wallet-uuid",
        amount: 100,
        reference: "withdraw-ref",
        description: "Test withdraw",
      };
      await expect(walletService.withdrawFunds(input)).resolves.not.toThrow();
    });

    it("should fail if insufficient balance", async () => {
      const input: WithdrawFundsInput = {
        walletId: "wallet-uuid",
        amount: 999999,
        reference: "withdraw-ref",
        description: "Test withdraw",
      };
      await expect(walletService.withdrawFunds(input)).rejects.toThrow();
    });

    it("should fail if wallet is invalid", async () => {
      const input: WithdrawFundsInput = {
        walletId: "",
        amount: 100,
        reference: "withdraw-ref",
        description: "Test withdraw",
      };
      await expect(walletService.withdrawFunds(input)).rejects.toThrow();
    });
  });

  // -------------------
  // GET WALLET
  // -------------------
  describe("getWalletByUserId", () => {
    it("should return wallet details for a valid userId", async () => {
      await expect(walletService.getWalletByUserId("user-id")).resolves.not.toBeNull();
    });

    it("should throw error if userId is invalid", async () => {
      await expect(walletService.getWalletByUserId("")).rejects.toThrow();
    });
  });

  describe("getWalletById", () => {
    it("should return wallet details for a valid walletId", async () => {
      await expect(walletService.getWalletById("wallet-id")).resolves.not.toBeNull();
    });

    it("should throw error if walletId is invalid", async () => {
      await expect(walletService.getWalletById("")).rejects.toThrow();
    });
  });
});
