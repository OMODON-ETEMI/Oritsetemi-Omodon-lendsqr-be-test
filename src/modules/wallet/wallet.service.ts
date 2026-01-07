import { Knex } from "knex";
import { v4 as uuidv4 } from "uuid";
import { Wallet } from "./types/wallet.types";
import { FundWalletInput, TransferFundsInput, WithdrawFundsInput } from "./types/wallet-transactions-input.types";
import { WalletTransactionStatus, WalletTransactionType } from "./types/wallet-transactions.types";

export class WalletService {
  private db: Knex;

  constructor(db: Knex) {
    this.db = db;
  }

  /**
   * Create a wallet for a user
   */
  async createWallet(userId: string): Promise<Wallet> {
    if(!userId) throw new Error('User ID is required');

    return this.db.transaction( async (trx) => {
        try {
            const walletId = uuidv4()
            await trx("wallets").insert({
                id: walletId,
                user_id: userId,
                balance: 0.00
            })
            
            const newWallet = await trx("wallets").where({ id: walletId }).first()
            if(!newWallet) throw new Error("Failed to retrieve created wallet") // check if this is not a bug since throwing an error resolves into transaction roll back 
            return newWallet
        } catch (error: any) {
            if (error.code === "ER_DUP_ENTRY" || error.errno === 1062){
                throw new Error("User already has an Active wallet")
            }
            console.error('Wallet Creation Error:', error)
            throw new Error("An unexpected error occured during wallet creation")
        }
    })
  }

  /**
   * Fund an existing wallet
   */
  async fundWallet(input: FundWalletInput): Promise<Wallet> {
    if (!input.walletId) throw new Error("Wallet ID is required");
    if (!input.amount || input.amount <= 0) throw new Error("Amount must be greater than 0");

    return this.db.transaction( async (trx) => {
        try {
            const wallet = await trx("wallets").where({ id: input.walletId }).forUpdate().first();
        
            if (!wallet) throw new Error("Wallet not found");
            await trx("wallets")
                .where({id: input.walletId})
                .increment('balance', input.amount)
            
            const wallet_transaction_id = uuidv4()
            await trx("wallet_transactions")
                .insert({
                    id: wallet_transaction_id,
                    wallet_id: input.walletId,
                    type: "fund" as WalletTransactionType,
                    amount: input.amount,
                    status: 'completed' as WalletTransactionStatus,
                    description: input.description,
                    reference: input.reference
                })
            
            return await trx("wallet_transactions").where({id : wallet_transaction_id}).first()
        } catch (error: any) {
            if (error.code === "ER_DUP_ENTRY" || error.errno === 1062){
                throw new Error("Refrerence already exist")
            }
            console.error('Wallet Fund Error:', error)
            throw error
        }
    })
  }

  /**
   * Transfer funds from one wallet to another
   */
  async transferFunds(input: TransferFundsInput): Promise<void> {
    if (!input.fromWalletId || !input.toWalletId) throw new Error("Source and Destination wallets are required");
    if (input.fromWalletId === input.toWalletId) throw new Error("Cannot transfer to the same wallet");
    if (!input.amount || input.amount <= 0) throw new Error("Amount must be greater than 0");

    return this.db.transaction( async (trx) => {
        try {
            const senderWallet = await trx("wallets").where({ id: input.fromWalletId }).forUpdate().first();
            if (!senderWallet) throw new Error("Sender wallet not found");
            if (Number(senderWallet.balance) < input.amount) throw new Error("Insufficient funds");

            const receiverWallet = await trx("wallets").where({ id: input.toWalletId }).first();
            if (!receiverWallet) throw new Error("Receiver wallet not found");

            await trx('wallets').where({ id: input.fromWalletId}).decrement('balance', input.amount)
            await trx('wallets').where({ id: input.toWalletId}).increment('balance', input.amount)

            const wallet_transaction_id = uuidv4()
            await trx("wallet_transactions")
                .insert({
                    id: wallet_transaction_id,
                    wallet_id: input.fromWalletId,
                    related_wallet_id: input.toWalletId,
                    type: "transfer" as WalletTransactionType,
                    amount: input.amount,
                    status: 'completed' as WalletTransactionStatus,
                    description: input.description,
                    reference: input.reference
                })
        } catch (error: any) {
            if (error.code === "ER_DUP_ENTRY") throw new Error("Transaction reference already exists");
            console.error('Transfer Error:', error);
            throw error;
        }
    })

  }

  /**
   * Withdraw funds from a wallet
   */
  async withdrawFunds(input: WithdrawFundsInput): Promise<void> {
    if (!input.walletId) throw new Error("walletId is required");
    if (!input.amount || input.amount <= 0) throw new Error("Amount must be greater than 0");

    return this.db.transaction( async (trx) => {
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
        } catch (error:any) {
            if (error.code === "ER_DUP_ENTRY") throw new Error("Transaction reference already exists");
            console.error('Withdraw Error:', error);
            throw error;
        }
    })
  }

  /**
   * Get wallet details by user ID
   */
  async getWalletByUserId(userId: string): Promise<Wallet> {
    try {
        if(!userId) throw new Error("User ID is required");
        const userWallet = await this.db('wallets').where({ user_id: userId }).first()
        if (!userWallet) throw new Error("No wallet found for this UserID")
        return userWallet
    } catch (error) {
        console.error('Get Wallet by UserID Error:', error)
        throw new Error("An unexpected error occured during finding wallet by userID")
    }
  }

  /**
   * Get wallet details by wallet ID
   */
  async getWalletById(walletId: string): Promise<Wallet> {
    try {
        if(!walletId) throw new Error("Wallet ID is required");
        const wallet = await this.db('wallets').where({ id: walletId }).first()
        if (!wallet) throw new Error("No wallet found for this ID")
        return wallet
    } catch (error) {
        console.error('Get Wallet by ID Error:', error)
        throw new Error("An unexpected error occured during finding wallet by ID")
    }
  }
}