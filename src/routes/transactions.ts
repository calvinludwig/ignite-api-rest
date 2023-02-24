import {type FastifyInstance} from 'fastify';
import {randomUUID} from 'node:crypto';
import {z} from 'zod';
import {knex} from '../database';
import {checkSessionIdExists} from '../middlewares/check_session_id_exists';

type Transaction = {
	id: string;
	title: string;
	amount: number;
	session_id: string;
	type: string;
};

export async function transactionsRoutes(app: FastifyInstance) {
	app.get('/', {preHandler: [checkSessionIdExists]}, async (request, reply) => {
		const {sessionId} = request.cookies;
		const transactions = await knex<Transaction>('transactions')
			.where('session_id', sessionId)
			.select();
		return reply.status(200).send({transactions});
	});

	app.get('/:id', {preHandler: [checkSessionIdExists]}, async (request, reply) => {
		const {id} = z.object({
			id: z.string().uuid(),
		}).parse(request.params);
		const {sessionId} = request.cookies;
		const transaction = await knex<Transaction>('transactions')
			.where(
				{
					session_id: sessionId,
					id,
				})
			.first();
		return reply.status(200).send({transaction});
	});

	app.post('/', async (request, reply) => {
		const {title, amount, type} = z.object({
			title: z.string(),
			amount: z.number(),
			type: z.enum(['credit', 'debit']),
		}).parse(request.body);
		let {sessionId} = request.cookies;
		if (!sessionId) {
			sessionId = randomUUID();
			void reply.cookie('sessionId', sessionId, {
				path: '/',
				maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
			});
		}

		await knex<Transaction>('transactions').insert({
			id: randomUUID(),
			title,
			amount: type === 'credit' ? amount : amount * -1,
			session_id: sessionId,
		});
		return reply.status(201).send();
	});

	app.get('/summary', {preHandler: [checkSessionIdExists]}, async (request, reply) => {
		const {sessionId} = request.cookies;
		const summary = await knex<Transaction>('transactions')
			.where({session_id: sessionId})
			.sum('amount', {as: 'amount'})
			.first();
		return reply.status(200).send({summary});
	});
}
