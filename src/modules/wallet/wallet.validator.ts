import { z } from "zod";

export const fundWalletSchema = z.object({
  body: z.object({
    amount: z.number().positive("Amount must be greater than zero"),
    description: z.string().min(1, "Description is required"),
    reference: z.string().min(1, "Reference is required"),
    walletId: z.string().uuid("Invalid Wallet ID"),
  }),
});

export const transferFundsSchema = z.object({
    body: z.object({
        fromWalletId: z.string().uuid("Invalid Wallet ID"),
        toWalletId: z.string().uuid("Invaalid Wallet ID"),
        amount: z.number().positive("Amount must be greater than zero"),
        reference: z.string().min(1, "Reference is required"),
        description: z.string().min(1, "Description is required"),
    })
});

export const withdrawFundsSchema = z.object({
  body: z.object({
    amount: z.number().positive("Amount must be greater than zero"),
    description: z.string().min(1, "Description is required"),
    reference: z.string().min(1, "Reference is required"),
    walletId: z.string().uuid("Invalid Wallet ID"),
  }),
});