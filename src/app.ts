import fastify from 'fastify';
import cookie from '@fastify/cookie';
import { env } from './env';
import { transactions_routes } from './routes/transactions';

export const app = fastify();
app.register(cookie);
app.register(transactions_routes, { prefix: 'transactions', });
