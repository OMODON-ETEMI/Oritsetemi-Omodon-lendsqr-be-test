import { Knex } from "knex";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { DatabaseError } from "../../shared/errors/database.errors";
import { User } from "../user/types/uer.types";

export class AuthService {
    private db: Knex;
    private JWT_SECRET: string;
    private TOKEN_EXPIRY = 7 * 24 * 60 * 60 * 1000; // 7 days

    constructor(db: Knex) {
        this.db = db;
        this.JWT_SECRET = process.env.JWT_SECRET!;
    }

    async login(email: string, password: string): Promise<{ user: User; token: string }> {
    try {
        const user = await this.db("users").where({ email }).first();
        if (!user) throw new Error("Invalid credentials");

        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) throw new Error("Invalid credentials");

        await this.db("auth_tokens").where({ user_id: user.id }).del();

        const token = jwt.sign({ userId: user.id, timestamp: Date.now() }, this.JWT_SECRET);
        const expiresAt = new Date(Date.now() + this.TOKEN_EXPIRY);

        await this.db("auth_tokens").insert({
            id: require('uuid').v4(),
            user_id: user.id,
            token,
            expires_at: expiresAt
        });
        return { user, token };
        } catch (error) {
            throw DatabaseError.fromKnexError(error);
        }
    }

    async validateToken(token: string): Promise<User> {
        try {
            const decoded = jwt.verify(token, this.JWT_SECRET) as { userId: string };
            
            const authToken = await this.db("auth_tokens")
                .where({ token })
                .where('expires_at', '>', new Date())
                .first();

            if (!authToken) throw new Error("Invalid or expired token");

            const user = await this.db("users").where({ id: decoded.userId }).first();
            if (!user) throw new Error("User not found");

            return user;
        } catch (error) {
            throw DatabaseError.fromKnexError(error);
        }
    }

    async logout(token: string): Promise<void> {
        try {
            await this.db("auth_tokens").where({ token }).del();
        } catch (error) {
            throw DatabaseError.fromKnexError(error);
        }
    }
}