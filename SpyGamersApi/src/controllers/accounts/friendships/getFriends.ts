import { FastifyReply, FastifyRequest } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { tryFindAccountBySessionToken } from '../../../utils/tryFindAccountBySessionToken';
import { distance } from 'fastest-levenshtein';


export const getFriends = async (request: FastifyRequest, reply: FastifyReply) => {
    const prisma = new PrismaClient();
    const { auth_token, filter } = request.body as { auth_token: string; filter?: string; };
    try {
        const account = await tryFindAccountBySessionToken(auth_token, prisma);
        if (!account) {
            return reply.status(401).send({ status: "BAD_AUTH" });
        }

        let friendships
        if (!filter) {
            friendships = await prisma.friendship.findMany({
                where: {
                    OR: [
                        { account_1_id: account.id },
                        { account_2_id: account.id }
                    ]
                }
            });
        } else {
            // Search with username filter....
            friendships = await prisma.friendship.findMany({
                where: {
                    AND: [
                        {
                            OR: [
                                { account_1_id: account.id },
                                { account_2_id: account.id },
                            ],
                        },
                        {
                            OR: [
                                { account1: { username: { contains: filter } } },
                                { account2: { username: { contains: filter } } },
                            ],
                        }
                    ],
                },
                include: {
                    account1: true,
                    account2: true,
                },
            });
        }

        // Map all of the friendships into username and status (accepted, or pending request)
        const friendshipDetails = await Promise.all(friendships.map(async (friendship) => {
            const isRequestorOfFriendship = friendship.account_1_id === account.id;
            const friendAccount = await prisma.account.findUnique({
                where: {
                    id: isRequestorOfFriendship ? friendship.account_2_id : friendship.account_1_id
                },
                select: {
                    id: true,
                    username: true
                }
            });

            let friendshipStatus = "INCOMING_REQUEST";
            if (friendship.request_accepted) {
                friendshipStatus = "ACCEPTED";
            } else if (isRequestorOfFriendship) {
                friendshipStatus = "OUTGOING_REQUEST";
            }

            return {
                account_id: friendAccount!.id,
                username: friendAccount!.username,
                status: friendshipStatus
            };
        }));

        if (filter) {
            friendshipDetails.sort((a, b) => distance(a.username, filter) - distance(b.username, filter))
        }

        return reply.status(201).send({ status: "SUCCESS", friends: friendshipDetails });
    } catch (error) {
        console.error("Error:", error);
        return reply.status(500).send({ status: "FAILURE" });
    } finally {
        await prisma.$disconnect();
    }
};


export const getFriendsSchema = {
    type: 'object',
    required: ['auth_token'],
    properties: {
        auth_token: { type: 'string' },
        filter: { type: 'string' }
    },
};