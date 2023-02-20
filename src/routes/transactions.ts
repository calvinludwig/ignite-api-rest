import { FastifyInstance } from 'fastify';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { knex } from '../database';
import { check_session_id_exists } from '../middlewares/check_session_id_exists';

export async function transactions_routes(app: FastifyInstance) {

	app.get('/', { preHandler: [check_session_id_exists] }, async (request, reply) => {
		const { session_id } = request.cookies;
		const transactions = await knex('transactions')
			.where('session_id', session_id)
			.select();
		return reply.status(200).send({ transactions });
	});

	app.get('/:id', { preHandler: [check_session_id_exists] }, async (request, reply) => {
		const { id } = z.object({
			id: z.string().uuid(),
		}).parse(request.params);
		const { session_id } = request.cookies;
		const transaction = await knex('transactions')
			.where({ session_id, id })
			.first();
		return reply.status(200).send({ transaction });
	});

	app.post('/', async (request, reply) => {
		const { title, amount, type } = z.object({
			title: z.string(),
			amount: z.number(),
			type: z.enum(['credit', 'debit'])
		}).parse(request.body);
		let { session_id } = request.cookies;
		if (!session_id) {
			session_id = randomUUID();
			reply.cookie('session_id', session_id, {
				path: '/',
				maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
			});
		}
		await knex('transactions').insert({
			id: randomUUID(),
			title,
			amount: type === 'credit' ? amount : amount * -1,
			session_id
		});
		return reply.status(201).send();
	});

	app.get('/summary', { preHandler: [check_session_id_exists] }, async (request, reply) => {
		const { session_id } = request.cookies;
		const summary = await knex('transactions')
			.where({ session_id })
			.sum('amount', { as: 'amount' })
			.first();
		return reply.status(200).send({ summary });
	});
}
