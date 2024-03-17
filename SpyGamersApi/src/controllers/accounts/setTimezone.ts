import { FastifyReply, FastifyRequest } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { tryFindAccountBySessionToken } from '../../utils/tryFindAccountBySessionToken';

import { isIBMCompatibleTimeZone } from '../../utils/isIBMCompatibleTimeZone';

export const setTimezone = async (request: FastifyRequest, reply: FastifyReply) => {
    const prisma = new PrismaClient();
    try {
        const { auth_token, timezone_code } = request.body as { auth_token: string; timezone_code: string; };
        if (!isIBMCompatibleTimeZone(timezone_code.toUpperCase())){
            return reply.status(406).send({ status: "INVALID_TIMEZONE_CODE" });
        }

        const account = await tryFindAccountBySessionToken(auth_token, prisma);
        if (!account) {
            return reply.status(401).send({ status: "BAD_AUTH" });
        }

        await prisma.account.update({
            data: {
                timezone_code: timezone_code
            },
            where: {
                id: account.id
            }
        });

        return reply.status(201).send({ status: "SUCCESS" });
    } catch (error) {
        console.error("Error:", error);
        return reply.status(500).send({ status: "FAILURE" });
    } finally {
        await prisma.$disconnect();
    }
};


export const setTimezoneSchema = {
    type: 'object',
    required: ['auth_token', 'timezone_code'],
    properties: {
        auth_token: { type: 'string' },
        timezone_code: { type: 'string' }
    },
};