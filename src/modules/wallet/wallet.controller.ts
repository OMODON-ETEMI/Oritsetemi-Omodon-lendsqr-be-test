import { Request, Response, NextFunction } from 'express';
import { WalletService } from './wallet.service';
import { UserService } from '../user/user.service';

export class WalletController {
    constructor(private walletService: WalletService, private userService: UserService) {}


    fundWallet = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = (req as any).user.id;
            const { amount, reference, description } = req.body;

            const wallet = await this.walletService.getWalletByUserId(userId);
            if (!wallet) throw new Error('Wallet not found');

            await this.walletService.fundWallet({
                walletId: wallet.id,
                amount,
                reference,
                description
            });

            res.status(200).json({ status: 'success', message: 'Wallet funded' });
        } catch (error) {
            next(error);
        }
    };

    transfer = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = (req as any).user.id;
            const { recipientEmail, amount, reference, description } = req.body;

            const senderWallet = await this.walletService.getWalletByUserId(userId);
            if (!senderWallet) throw new Error('Sender wallet not found');

            // Get recipient by email
            const recipient = await  this.userService.findByEmail(recipientEmail);
            if (!recipient) throw new Error('Recipient not found');

            const recipientWallet = await this.walletService.getWalletByUserId(recipient.id);
            if (!recipientWallet) throw new Error('Recipient wallet not found');

            await this.walletService.transferFunds({
                fromWalletId: senderWallet.id,
                toWalletId: recipientWallet.id,
                amount,
                reference,
                description
            });

            res.status(200).json({ status: 'success', message: 'Transfer successful' });
        } catch (error) {
            next(error);
        }
    };

    withdraw = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = (req as any).user.id;
            const { amount, reference, description } = req.body;

            const wallet = await this.walletService.getWalletByUserId(userId);
            if (!wallet) throw new Error('Wallet not found');

            await this.walletService.withdrawFunds({
                walletId: wallet.id,
                amount,
                reference,
                description
            });

            res.status(200).json({ status: 'success', message: 'Withdrawal successful' });
        } catch (error) {
            next(error);
        }
    };

    getBalance = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = (req as any).user.id;
            const wallet = await this.walletService.getWalletByUserId(userId);

            res.status(200).json({
                status: 'success',
                data: { balance: wallet?.balance || 0 }
            });
        } catch (error) {
            next(error);
        }
    };
}