import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
    await knex.schema.createTable('wallets', (table) => {
        table.uuid('id').primary();
        table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE').unique();
        table.decimal('balance', 15, 2).notNullable().defaultTo(0);
        table.check('balance >= 0', [], 'chk_wallet_positive_balance');
        table.string('currency', 3).notNullable().defaultTo('NGN');
        table.timestamp('created_at').defaultTo(knex.fn.now());
        table.timestamp('updated_at').defaultTo(knex.fn.now());
        table.index('user_id');
    });
}


export async function down(knex: Knex): Promise<void> {
    await knex.schema.dropTableIfExists('wallets');
}

