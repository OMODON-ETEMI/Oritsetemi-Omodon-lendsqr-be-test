export interface FundWalletInput{
    walletId: string;
    amount: number;
    reference: string;
    description: string;
}

export interface TransferFundsInput {
  fromWalletId: string;
  toWalletId: string;
  amount: number;
  reference: string;
  description: string;
}

export interface WithdrawFundsInput {
  walletId: string;
  amount: number;
  reference: string;
  description: string;
}