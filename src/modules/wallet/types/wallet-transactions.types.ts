export type WalletTransactionType =
  | "fund"
  | "transfer"
  | "withdraw";

export type WalletTransactionStatus =
  | "pending"
  | "completed"
  | "failed";

export interface WalletTransaction {
  id: string;
  wallet_id: string;
  related_wallet_id: string | null;
  type: WalletTransactionType;
  amount: string;
  status: WalletTransactionStatus;
  description: string;
  reference: string;
  created_at: Date;
}
