import { FastifyReply, FastifyRequest } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { tryFindAccountBySessionToken } from '../../../utils/tryFindAccountBySessionToken';
import { searchFriendship } from '../../../utils/searchFriendship';

const prisma = new PrismaClient();

export const removeFriend = async (request: FastifyRequest, reply: FastifyReply) => {
    const { auth_token, target_account_id } = request.body as { auth_token: string; target_account_id: number; };
    try {
        const account = await tryFindAccountBySessionToken(auth_token, prisma);
        if (!account) {
            return reply.status(401).send({ status: "BAD_AUTH" });
        }

        const target_account = await prisma.account.findFirst({
            where: {
                id: target_account_id
            }
        });

        if (target_account == null) {
            return reply.status(406).send({ status: "TARGET_NOT_FOUND" });
        }

        if (account.id == target_account.id) {
            return reply.status(406).send({ status: "CANT_TARGET_SELF" });
        }

        const current_friendship = await searchFriendship(prisma, account.id, target_account.id);

        if (current_friendship == undefined) {
            return reply.status(406).send({ status: "NOT_FRIENDS" });
        }


        let status = "FRIEND_REMOVED";
        if (!current_friendship.request_accepted) {
            // Friend request not yet to be accepted...
            if (current_friendship.account_1_id == account.id) {
                // Self is sender of friend request, revoke the friend request...
               status = "REQUEST_REVOKED";
            }

            // Self is not sender of friend request, reject it instead...
            status = "REQUEST_REJECTED";
        }

        await prisma.friendship.deleteMany({
            where: {
                OR: [
                    { account_1_id: account.id, account_2_id: target_account.id },
                    { account_1_id: target_account.id, account_2_id: account.id }
                ]
            }
        });

        return reply.status(201).send({ status: status });
    } catch (error) {
        console.error("Error:", error);
        return reply.status(500).send({ status: "FAILURE" });
    }
};


export const removeFriendSchemas = {
    type: 'object',
    required: ['auth_token', 'target_account_id'],
    properties: {
        auth_token: { type: 'string' },
        target_account_id: { type: 'number' }
    },
};