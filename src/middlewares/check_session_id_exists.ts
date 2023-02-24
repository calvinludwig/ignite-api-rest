import {type FastifyReply, type FastifyRequest} from 'fastify';

export async function checkSessionIdExists(request: FastifyRequest, reply: FastifyReply) {
	if (!request.cookies.session_id) {
		return reply.status(401).send({error: 'Unauthorized.'});
	}
}
