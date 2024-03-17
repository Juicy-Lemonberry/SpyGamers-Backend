import { FastifyReply, FastifyRequest } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { tryFindAccountBySessionToken } from '../../utils/tryFindAccountBySessionToken';

export const logLocation = async (request: FastifyRequest, reply: FastifyReply) => {
    const prisma = new PrismaClient();

    try {
        const { auth_token, lat, lng } = request.body as { 
            auth_token: string; lat: number; lng: number;
        };

        const account = await tryFindAccountBySessionToken(auth_token, prisma);
        if (!account) {
            return reply.status(401).send({ status: "BAD_AUTH" });
        }

        await prisma.locationLog.create({
            data: {
                account_id: account.id,
                lat: lat,
                lng: lng,
                timestamp: new Date()
            }
        })

        reply.status(200).send({ status: "SUCCESS" });
    } catch (error) {
        console.error("Error:", error);
        reply.status(500).send({ status: "FAILURE" });
    } finally {
        await prisma.$disconnect();
    }
};


export const logLocationSchema = {
    type: 'object',
    required: ['auth_token', 'lat', 'lng'],
    properties: {
        auth_token: { type: 'string' },
        lat: { type: 'number' },
        lng: { type: 'number' }
    },
};