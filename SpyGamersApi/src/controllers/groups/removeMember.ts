import { FastifyReply, FastifyRequest } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { tryFindAccountBySessionToken } from '../../utils/tryFindAccountBySessionToken';

export const removeMember = async (request: FastifyRequest, reply: FastifyReply) => {
    const prisma = new PrismaClient();

    try {
        const { auth_token, group_id, target_user_id } = request.body as { auth_token: string; group_id: number; target_user_id: number; };

        const account = await tryFindAccountBySessionToken(auth_token, prisma);
        if (!account) {
            return reply.status(200).send({ status: "BAD_AUTH" });
        }

        // Check if group exists
        const groupExists = await prisma.group.findFirst({
            where: {
                id: group_id
            }
        });

        if (!groupExists){
            return reply.status(200).send({ status: "GROUP_NOT_EXISTS" });
        }

        // Check if the account is an admin member of the specified group
        const isMember = await prisma.groupMember.findFirst({
            where: {
                account_id: account.id,
                group_id: group_id
            }
        });

        if (!isMember) {
            return reply.status(200).send({ status: "NOT_GROUP_MEMBER" });
        }

        if (!isMember.is_admin) {
            return reply.status(200).send({ status: "NOT_GROUP_ADMIN" });
        }

        const targetMember = await prisma.groupMember.findFirst({
            where: {
                account_id: target_user_id,
                group_id: group_id
            }
        });

        if (targetMember == null) {
            return reply.status(200).send({ status: "TARGET_NOT_MEMBER"})
        }

        if (targetMember.account_id == account.id) {
            return reply.status(200).send({ status: "CANT_TARGET_SELF"})
        }

        await prisma.groupMember.deleteMany({
            where: {
                account_id: target_user_id,
                group_id: group_id
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


export const removeMemberSchema = {
    type: 'object',
    required: ['auth_token', 'group_id', 'target_user_id'],
    properties: {
        auth_token: { type: 'string' },
        group_id: { type: 'number' },
        target_user_id: { type: 'number' }
    },
};