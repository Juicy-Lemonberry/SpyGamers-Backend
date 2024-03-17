import { FastifyReply, FastifyRequest } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { tryFindAccountBySessionToken } from '../../utils/tryFindAccountBySessionToken';

const prisma = new PrismaClient();

export const joinGroup = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
        const { auth_token, group_id, target_user_id } = request.body as { auth_token: string; group_id: number; target_user_id: number; };

        const account = await tryFindAccountBySessionToken(auth_token, prisma);
        if (!account) {
            return reply.status(401).send({ status: "BAD_AUTH" });
        }

        // Check if group exists
        const group = await prisma.group.findFirst({
            where: {
                id: group_id
            }
        });

        if (!group){
            return reply.status(406).send({ status: "GROUP_NOT_EXISTS" });
        }
        // Check if target is already a member:
        const targetIsMember = await prisma.groupMember.findFirst({
            where: {
                account_id: target_user_id,
                group_id: group_id
            }
        });

        if (targetIsMember) {
            return reply.status(406).send({ status: "EXISTING_MEMBER"})
        }

        if (!group.is_public) {
            return reply.status(406).send({ status: "GROUP_NOT_PUBLIC" });
        }

        // Add into group...
        await prisma.groupMember.create({
            data: {
                account_id: target_user_id,
                group_id: group_id,
                is_admin: false
            }
        })

        reply.status(200).send({ status: "SUCCESS" });
    } catch (error) {
        console.error("Error:", error);
        reply.status(500).send({ status: "FAILURE" });
    }
};


export const joinGroupSchema = {
    type: 'object',
    required: ['auth_token', 'group_id'],
    properties: {
        auth_token: { type: 'string' },
        group_id: { type: 'number' }
    },
};