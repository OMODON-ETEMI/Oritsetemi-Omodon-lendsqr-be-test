import { Knex } from "knex";
import { v4 as uuidv4 } from "uuid";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { createUser } from "./types/user-input.types";
import { User } from "./types/uer.types";
import { DatabaseError } from "../../shared/errors/database.errors";

export class UserService {
    private db: Knex;
    private TOKEN_EXPIRY = 7 * 24 * 60 * 60 * 1000;

    constructor(db: Knex){
        this.db = db;
    }

    async createUser (input: createUser): Promise<{user: User, token:string}>{
        if (!input || !input.first_name 
            || !input.last_name || !input.email 
            || !input.phone_number || !input.password) throw new Error("All inputs are required")

        return this.db.transaction( async (trx) => {
           try {
             const userId = uuidv4()
             const hashedPassword = await bcrypt.hash(input.password, 10);
            await trx("users").insert({
                id: userId,
                first_name: input.first_name,
                last_name: input.last_name,
                email: input.email,
                phone_number: input.phone_number,
                password: hashedPassword,
                status: 'active'
            })


            await trx("wallets").insert({
                id: uuidv4(),
                user_id: userId,
                balance: 0.00
            });

            const token = jwt.sign({ userId }, process.env.JWT_SECRET!);
            const expiresAt = new Date(Date.now() + this.TOKEN_EXPIRY);
            await trx("auth_tokens").insert({
                user_id: userId,
                token: token,
                expires_at: expiresAt
            })

            const user = await trx("users")
                .where({ id: userId})
                .first()
            const faux_token = await trx("auth_tokens").where({ user_id: userId }).first()
            if(!user) throw new Error("Failed to retrive creted User");
            if(!faux_token) throw new Error("Failed to retrive User token")
            return {user, token}
           } catch (error) {
            throw DatabaseError.fromKnexError(error)
           }
        })
    }
    
    async findById (userId: string): Promise<User | null>{
        try {
            return await this.db("users").where({ id: userId }).first() || null;
        } catch (error) {
            throw DatabaseError.fromKnexError(error)
        }
    }

    async findByEmail(email: string): Promise<User | null> {
        try {
            return await this.db("users").where({ email }).first() || null;
        } catch (error) {
            throw DatabaseError.fromKnexError(error)
        }
    }
}