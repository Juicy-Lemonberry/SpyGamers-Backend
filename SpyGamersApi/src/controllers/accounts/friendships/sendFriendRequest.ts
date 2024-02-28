import { FastifyReply, FastifyRequest } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { tryFindAccountBySessionToken } from '../../../utils/tryFindAccountBySessionToken';
import { searchFriendship } from '../../../utils/searchFriendship';

const prisma = new PrismaClient();

export const sendFriendRequest = async (request: FastifyRequest, reply: FastifyReply) => {
    const { auth_token, target_username } = request.body as { auth_token: string; target_username: string; };
    try {
        const account = await tryFindAccountBySessionToken(auth_token, prisma);
        if (!account) {
            return reply.status(401).send({ status: "FAILURE" });
        }

        const target_account = await prisma.account.findFirst({
            where: {
                username: target_username
            }
        });

        if (target_account == null) {
            return reply.status(406).send({ status: "TARGET_NOT_FOUND" });
        }

        if (account.id == target_account.id) {
            return reply.status(406).send({ status: "CANT_FRIEND_SELF" });
        }

        const current_friendship = await searchFriendship(prisma, account.id, target_account.id);

        if (current_friendship == undefined) {
            // Send a new friend request...
            await prisma.friendship.create({
                data: {
                    account_1_id: account.id,
                    account_2_id: target_account.id,
                    request_accepted: false
                }
            })

            return reply.status(201).send({ status: "REQUEST_SENT" });
        }

        if (!current_friendship.request_accepted) {
            // Friend request not yet to be accepted...
            if (current_friendship.account_1_id == account.id) {
                // Self is sender of friend request, revoke the friend request...
                await prisma.friendship.deleteMany({
                    where: {
                        account_1_id: account.id,
                        account_2_id: target_account.id
                    }
                });
                return reply.status(201).send({ status: "REQUEST_REVOKED" });
            }

            // Self is not sender of friend request, accept it instead
            await prisma.friendship.updateMany({
                data: {
                    request_accepted: true
                },
                where: {
                    account_1_id: target_account.id,
                    account_2_id: account.id 
                }
            })
            return reply.status(201).send({ status: "REQUEST_ACCEPTED" });
        }

        if (current_friendship.request_accepted) {
            return reply.status(406).send({ status: "ALREADY_ACCEPTED" });
        }

        // Shouldn't really reach here...
        return reply.status(500).send({ status: "FAILURE" });
    } catch (error) {
        console.error("Error:", error);
        return reply.status(500).send({ status: "FAILURE" });
    }
};


export const sendFriendRequestSchema = {
    type: 'object',
    required: ['auth_token', 'target_username'],
    properties: {
        auth_token: { type: 'string' },
        target_username: { type: 'string' }
    },
};