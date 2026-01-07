import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
    await knex.schema.createTable('wallet_transactions', (table) => {
        table.uuid('id').primary();
        table.uuid('wallet_id').notNullable().references('id').inTable('wallets').onDelete('CASCADE');
        table.uuid('related_wallet_id').nullable().references('id').inTable('wallets').onDelete('CASCADE');
        table.string('type', 50).notNullable();
        table.decimal('amount', 15, 2).notNullable();
        table.check('amount > 0', [], 'chk_transaction_positive_amount');
        table.string('status', 50).notNullable().defaultTo('pending');
        table.string('description', 255).notNullable();
        table.string('reference', 100).notNullable().unique();
        table.timestamp('created_at').defaultTo(knex.fn.now());
        table.index('wallet_id');
        table.index('related_wallet_id');
        table.index('reference');
        table.index('status');
        table.index(['wallet_id', 'created_at']);
    });
}


export async function down(knex: Knex): Promise<void> {
    await knex.schema.dropTableIfExists('wallet_transactions');
}

