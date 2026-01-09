import { Knex } from "knex";
import { v4 as uuidv4 } from "uuid";
import { Wallet } from "./types/wallet.types";
import { FundWalletInput, TransferFundsInput, WithdrawFundsInput } from "./types/wallet-transactions-input.types";
import { WalletTransactionStatus, WalletTransactionType } from "./types/wallet-transactions.types";
import { DatabaseError } from "../../shared/errors/database.errors";


export class WalletService {
  private db: Knex;

  constructor(db: Knex) {
    this.db = db;
  }

  async createWallet(userId: string): Promise<Wallet> {
    if(!userId) throw new Error('User ID is required');

    return this.db.transaction(async (trx) => {
      try {
        const walletId = uuidv4();
        await trx("wallets").insert({
          id: walletId,
          user_id: userId,
          balance: 0.00
        });
        
        const newWallet = await trx("wallets").where({ id: walletId }).first();
        if(!newWallet) throw new Error("Failed to retrieve created wallet");
        return newWallet;
      } catch (error) {
        throw DatabaseError.fromKnexError(error);
      }
    });
  }

  async fundWallet(input: FundWalletInput): Promise<Wallet> {
    if (!input.walletId) throw new Error("Wallet ID is required");
    if (!input.amount || input.amount <= 0) throw new Error("Amount must be greater than 0");

    return this.db.transaction(async (trx) => {
      try {
        const wallet = await trx("wallets").where({ id: input.walletId }).forUpdate().first();
        if (!wallet) throw new Error("Wallet not found");
        
        await trx("wallets")
          .where({id: input.walletId})
          .increment('balance', input.amount);
        
        const wallet_transaction_id = uuidv4();
        await trx("wallet_transactions").insert({
          id: wallet_transaction_id,
          wallet_id: input.walletId,
          type: "fund" as WalletTransactionType,
          amount: input.amount,
          status: 'completed' as WalletTransactionStatus,
          description: input.description,
          reference: input.reference
        });
        
        return await trx("wallet_transactions").where({id: wallet_transaction_id}).first();
      } catch (error) {
        throw DatabaseError.fromKnexError(error);
      }
    });
  }

  async transferFunds(input: TransferFundsInput): Promise<void> {
    if (!input.fromWalletId || !input.toWalletId) throw new Error("Source and Destination wallets are required");
    if (input.fromWalletId === input.toWalletId) throw new Error("Cannot transfer to the same wallet");
    if (!input.amount || input.amount <= 0) throw new Error("Amount must be greater than 0");

    return this.db.transaction(async (trx) => {
      try {
        const senderWallet = await trx("wallets").where({ id: input.fromWalletId }).forUpdate().first();
        if (!senderWallet) throw new Error("Sender wallet not found");
        if (Number(senderWallet.balance) < input.amount) throw new Error("Insufficient funds");

        const receiverWallet = await trx("wallets").where({ id: input.toWalletId }).forUpdate().first();
        if (!receiverWallet) throw new Error("Receiver wallet not found");

        await trx('wallets').where({ id: input.fromWalletId}).decrement('balance', input.amount);
        await trx('wallets').where({ id: input.toWalletId}).increment('balance', input.amount);

        const wallet_transaction_id = uuidv4();
        await trx("wallet_transactions").insert({
          id: wallet_transaction_id,
          wallet_id: input.fromWalletId,
          related_wallet_id: input.toWalletId,
          type: "transfer" as WalletTransactionType,
          amount: input.amount,
          status: 'completed' as WalletTransactionStatus,
          description: input.description,
          reference: input.reference
        });
      } catch (error) {
        throw DatabaseError.fromKnexError(error);
      }
    });
  }

  async withdrawFunds(input: WithdrawFundsInput): Promise<void> {
    if (!input.walletId) throw new Error("walletId is required");
    if (!input.amount || input.amount <= 0) throw new Error("Amount must be greater than 0");

    return this.db.transaction(async (trx) => {
      try {
        const wallet = await trx("wallets").where({ id: input.walletId }).forUpdate().first();
        if (!wallet) throw new Error("Wallet not found");
        if (Number(wallet.balance) < input.amount) throw new Error("Insufficient funds");

        await trx("wallets")
          .where({ id: input.walletId })
          .decrement('balance', input.amount);

        await trx("wallet_transactions").insert({
          id: uuidv4(),
          wallet_id: input.walletId,
          type: "withdraw" as WalletTransactionType,
          amount: input.amount,
          status: 'completed' as WalletTransactionStatus,
          description: input.description,
          reference: input.reference
        });
      } catch (error) {
        throw DatabaseError.fromKnexError(error);
      }
    });
  }

  async getWalletByUserId(userId: string): Promise<Wallet | null> {
    try {
      if(!userId) throw new Error("User ID is required");
      return await this.db('wallets').where({ user_id: userId }).first() || null;
    } catch (error) {
      throw DatabaseError.fromKnexError(error);
    }
  }

  async getWalletById(walletId: string): Promise<Wallet | null> {
    try {
      if(!walletId) throw new Error("Wallet ID is required");
      return await this.db('wallets').where({ id: walletId }).first() || null;
    } catch (error) {
      throw DatabaseError.fromKnexError(error);
    }
  }
}