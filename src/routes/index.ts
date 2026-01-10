import { Router } from 'express';

import { UserService } from '../modules/user/user.service';
import { AuthService } from '../modules/auth/auth.service';
import { WalletService } from '../modules/wallet/wallet.service';

import { authenticate } from '../middleware/auth.middleware';
import { WalletController } from '../modules/wallet/wallet.controller';
import { AuthController } from '../modules/auth/auth.controller';
import { UserController } from '../modules/user/user.controller';
import config from '../database/knexfile';
import knex from 'knex';

const db = knex(config.development);

const router = Router();

const userService = new UserService(db);
const authService = new AuthService(db);
const walletService = new WalletService(db);

const userController = new UserController(userService);
const authController = new AuthController(authService);
const walletController = new WalletController(walletService, userService);

// Auth routes
router.post('/auth/register', userController.register);
router.post('/auth/login', authController.login);
router.post('/auth/logout', authenticate(authService), authController.logout);

// Wallet routes
router.post('/wallets/fund', authenticate(authService), walletController.fundWallet);
router.post('/wallets/transfer', authenticate(authService), walletController.transfer);
router.post('/wallets/withdraw', authenticate(authService), walletController.withdraw);
router.get('/wallets/balance', authenticate(authService), walletController.getBalance);

export default router;