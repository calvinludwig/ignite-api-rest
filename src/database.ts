import { knex as setup_knex, Knex } from 'knex';
import { env } from './env';

export const config: Knex.Config = {
	client: 'sqlite',
	connection: {
		filename: env.DATABASE_URL,
	},
	useNullAsDefault: true,
	migrations: {
		extension: 'ts',
		directory: './db/migrations',
	}
};

export const knex = setup_knex(config);
