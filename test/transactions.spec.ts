import { execSync } from 'node:child_process';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { app } from '../src/app';

describe('Transactions routes', () => {
	beforeAll(async () => {
		await app.ready();
	});

	afterAll(async () => {
		await app.close();
	});

	beforeEach(async () => {
		execSync('npm run knex migrate:rollback --all');
		execSync('npm run knex migrate:latest');
	});

	it('should be able to create a new transaction', async () => {
		await request(app.server).post('/transactions').send({
			title: 'New transaction',
			amount: 5000,
			type: 'credit',
		}).expect(201);
	});

	it('should be able to list all transactions', async () => {
		const create_transaction_response = await request(app.server).post('/transactions').send({
			title: 'New transaction',
			amount: 5000,
			type: 'credit',
		});
		const cookies = create_transaction_response.get('Set-Cookie');

		const list_transactions_response = await request(app.server)
			.get('/transactions')
			.set('Cookie', cookies)
			.expect(200);
		expect(list_transactions_response.body.transactions).toEqual([
			expect.objectContaining({
				title: 'New transaction',
				amount: 5000,
			}),
		]);
	});

	it('should be able to show a specific transaction', async () => {
		const create_transaction_response = await request(app.server).post('/transactions').send({
			title: 'New transaction',
			amount: 5000,
			type: 'credit',
		});
		const cookies = create_transaction_response.get('Set-Cookie');

		const list_transactions_response = await request(app.server)
			.get('/transactions')
			.set('Cookie', cookies)
			.expect(200);
		const transaction_id = list_transactions_response.body.transactions[0].id;

		const show_transaction_response = await request(app.server)
			.get(`/transactions/${transaction_id}`)
			.set('Cookie', cookies)
			.expect(200);
		expect(show_transaction_response.body.transaction).toEqual(
			expect.objectContaining({
				title: 'New transaction',
				amount: 5000,
			})
		);
	});

	it('should be able to show the summary', async () => {
		const create_transaction_response = await request(app.server)
			.post('/transactions')
			.send({
				title: 'Credit transaction',
				amount: 5000,
				type: 'credit',
			});
		const cookies = create_transaction_response.get('Set-Cookie');

		await request(app.server)
			.post('/transactions')
			.set('Cookie', cookies)
			.send({
				title: 'Debit transaction',
				amount: 2000,
				type: 'debit',
			});

		const summary_response = await request(app.server)
			.get('/transactions/summary')
			.set('Cookie', cookies)
			.expect(200);

		expect(summary_response.body.summary).toEqual({ amount: 3000 });
	});
});
