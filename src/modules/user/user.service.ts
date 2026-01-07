import { Knex } from "knex";
import { v4 as uuidv4 } from "uuid";
import { createUser, fetchUser } from "./types/user-input.types";
import { User } from "./types/uer.types";

export class UserService {
    private db: Knex;

    constructor(db: Knex){
        this.db = db;
    }

    async createUser (input: createUser): Promise<User>{
        if (!input || !input.first_name 
            || !input.last_name || !input.email 
            || !input.phone_number || !input.password) throw new Error("All inputs are required")

        return this.db.transaction( async (trx) => {
           try {
             const userId = uuidv4()
            await trx("users").insert({
                id: userId,
                first_name: input.first_name,
                last_name: input.last_name,
                email: input.email,
                phone_number: input.phone_number,
                password: input.password,
                status: 'active'
            })

            const walletId = uuidv4();
            await trx("wallets").insert({
                id: walletId,
                user_id: userId,
                balance: 0.00
            });

            const user = await trx("users")
                .where({ id: userId})
                .first()
            if(!user) throw new Error("Failed to retrive creted User")
            return user
           } catch (error: any) {
            if (error.code === "ER_DUP_ENTRY" || error.errno === 1062) throw new Error("User already exist")
            throw error
           }
        })
    }
    
    async fetchUser (input: fetchUser): Promise<User>{
        if(!input) throw new Error("All input fields are required");
        const user = await this.db("users").where({ email: input.email, password: input.password }).first();
        if (!user) throw new Error("Invalid credentials");
        return user
    }
}