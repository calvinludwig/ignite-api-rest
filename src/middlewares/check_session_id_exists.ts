import { FastifyReply, FastifyRequest } from 'fastify';

export async function check_session_id_exists(request: FastifyRequest, reply: FastifyReply) {
	if (!request.cookies.session_id) {
		return reply.status(401).send({ error: 'Unauthorized.' });
	}
}
