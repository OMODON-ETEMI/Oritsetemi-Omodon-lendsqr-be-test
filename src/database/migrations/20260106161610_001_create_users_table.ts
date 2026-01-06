import type { Knex } from "knex";
import { table } from "node:console";


export async function up(knex: Knex): Promise<void> {
    await knex.schema.createTable('users', (table) => {
        table.uuid('id').primary().defaultTo(knex.raw('(UUID())'));
        table.string('first_name',100).notNullable();
        table.string('last_name',100).notNullable();
        table.string('email', 225).notNullable().unique();
        table.string('phone_number',50).notNullable().unique();
        table.string('password', 225).notNullable();
        table.string('status',50).notNullable().defaultTo('active');
        table.timestamp('created_at').defaultTo(knex.fn.now());
        table.timestamp('updated_at').defaultTo(knex.fn.now());
        table.index('email');
        table.index('status')
    });

}


export async function down(knex: Knex): Promise<void> {
    await knex.schema.dropTableIfExists('users');
}

