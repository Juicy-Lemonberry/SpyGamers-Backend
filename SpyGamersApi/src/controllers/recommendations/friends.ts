import { FastifyReply, FastifyRequest } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { tryFindAccountBySessionToken } from '../../utils/tryFindAccountBySessionToken';
import lerp from '../../utils/lerp';

import { distance, closest } from 'fastest-levenshtein';

const prisma = new PrismaClient();

enum SORTING_MODE {
    DEFAULT = "DEFAULT",
    GAME_PREFERENCE = "GAME_PREFERENCE",
    GROUP = "SAME_GROUP",
    TIMEZONE = "TIMEZONE"
}

interface RecommendedFriend {
    id: number,
    username: string,
    game_preference_weightage: number;
    same_group_weightage: number;
    timezone_weightage: number;
}

function _getSortingMode(input: string): SORTING_MODE {
    const upperInput = input.toUpperCase();

    switch (upperInput) {
        case SORTING_MODE.GAME_PREFERENCE:
            return SORTING_MODE.GAME_PREFERENCE;
        case SORTING_MODE.GROUP:
            return SORTING_MODE.GROUP;
        case SORTING_MODE.TIMEZONE:
            return SORTING_MODE.TIMEZONE;
        default:
            return SORTING_MODE.DEFAULT;
    }
}

function _getTotalWeightage(recommended: RecommendedFriend) {
    return recommended.game_preference_weightage + recommended.same_group_weightage + recommended.timezone_weightage;
}

async function findSimilarUsersByGamePreference(targetUserId: number) {
    const targetUserGames = await prisma.gamePreference.findMany({
        where: {
            account_id: targetUserId,
        },
    });

    const notFriends = await prisma.account.findMany({
        where: {
            id: {
                not: targetUserId
            },
            AND: [
                {
                    friends_as: {
                        none: {
                            OR: [
                                { account_1_id: targetUserId },
                                { account_2_id: targetUserId },
                            ],
                        },
                    },
                },
                {
                    friends_with: {
                        none: {
                            OR: [
                                { account_1_id: targetUserId },
                                { account_2_id: targetUserId },
                            ],
                        },
                    },
                },
            ],
        },
        include: {
            game_preferences: true,
        },
    });

    const similarityScores = notFriends.map(user => {
        let weight = 0;
        user.game_preferences.forEach(userGame => {
            targetUserGames.forEach(targetGame => {
                const similarity = distance(userGame.name, targetGame.name);
                weight += lerp(0.1, 0.9, similarity);
            });
        });

        return {
            id: user.id,
            username: user.username,
            weight,
        };
    });

    return similarityScores;
}

async function getFriendRecommendations(targetUserId: number, sortingMode: SORTING_MODE, chunkSize: number): Promise<RecommendedFriend[]> {
    try {
        // Fetch the target user's game preferences
        const targetUser = await prisma.account.findUnique({
            where: {
                id: targetUserId
            },
            include: {
                game_preferences: {
                    select: {
                        name: true
                    }
                },
                group_members: {
                    select: {
                        group_id: true
                    }
                }
            }
        });

        if (!targetUser) {
            throw new Error('Target user not found.');
        }

        const findRecommendationsPromises = []
        const mergedRecommendations = new Map<number, RecommendedFriend>();

        // Find other accounts in same group...
        const sameGroupPromise = prisma.account.findMany({
            where: {
                id: {
                    not: targetUserId
                },
                friends_as: {
                    none: {
                        account_2_id: targetUserId
                    }
                },
                group_members: {
                    some: {
                        group_id: {
                            in: targetUser.group_members.map((groupMember) => groupMember.group_id)
                        }
                    }
                }
            }
        }).then((recommendeds) => {
            recommendeds.forEach((recommended) => {
                if (mergedRecommendations.has(recommended.id)) {
                    // Already exists, add to weightage...
                    const existing = mergedRecommendations.get(recommended.id) as RecommendedFriend;
                    existing.same_group_weightage += 0.25;
                    mergedRecommendations.set(recommended.id, existing);
                } else {
                    // Doesn't exist, create new weightage...
                    mergedRecommendations.set(recommended.id, { 
                        id: recommended.id,
                        username: recommended.username,
                        game_preference_weightage: 0,
                        same_group_weightage: 0.25,
                        timezone_weightage: 0
                    });
                }
            });
        })

        findRecommendationsPromises.push(sameGroupPromise)
        
        if (targetUser.timezone_code != "A") {
            // Fetch accounts with the same timezone code as the target user
            const timezonePromise = prisma.account.findMany({
                where: {
                    id: {
                        not: targetUserId
                    },
                    friends_as: {
                        none: {
                            account_2_id: targetUserId
                        }
                    },
                    timezone_code: targetUser.timezone_code
                }
            }).then((recommendeds) => {
                recommendeds.forEach((recommended) => {
                    if (mergedRecommendations.has(recommended.id)) {
                        // Already exists, add to weightage...
                        const existing = mergedRecommendations.get(recommended.id) as RecommendedFriend;
                        existing.timezone_weightage += 0.6;
                        mergedRecommendations.set(recommended.id, existing);
                    } else {
                        // Doesn't exist, create new weightage...
                        mergedRecommendations.set(recommended.id, { 
                            id: recommended.id,
                            username: recommended.username,
                            game_preference_weightage: 0,
                            same_group_weightage: 0,
                            timezone_weightage: 0.6
                        });
                    }
                });
            })

            findRecommendationsPromises.push(timezonePromise)
        }

        // Find same game preferences...
        const sameGamePreference = findSimilarUsersByGamePreference(targetUserId).then((recommendeds) => {
            recommendeds.forEach((recommended) => {
                if (mergedRecommendations.has(recommended.id)) {
                    // Already exists, add to weightage...
                    const existing = mergedRecommendations.get(recommended.id) as RecommendedFriend;
                    existing.game_preference_weightage += recommended.weight;
                    mergedRecommendations.set(recommended.id, existing);
                } else {
                    // Doesn't exist, create new weightage...
                    mergedRecommendations.set(recommended.id, { 
                        id: recommended.id,
                        username: recommended.username,
                        game_preference_weightage: recommended.weight,
                        same_group_weightage: 0,
                        timezone_weightage: 0
                    });
                }
            });
        });
        findRecommendationsPromises.push(sameGamePreference)

        let sortingFunction = (a: RecommendedFriend, b: RecommendedFriend) => _getTotalWeightage(b) - _getTotalWeightage(a);
        if (sortingMode == SORTING_MODE.TIMEZONE) {
            sortingFunction = (a, b) => b.timezone_weightage - a.timezone_weightage;
        } else if (sortingMode == SORTING_MODE.GAME_PREFERENCE) {
            sortingFunction = (a, b) => b.game_preference_weightage - a.game_preference_weightage;
        } else if (sortingMode == SORTING_MODE.GROUP) {
            sortingFunction = (a, b) => b.same_group_weightage - a.same_group_weightage;
        }

        await Promise.all(findRecommendationsPromises);

        const recommendations = Array.from(mergedRecommendations.values()).sort(sortingFunction).slice(0, chunkSize);
        return recommendations;
    } catch (error) {
        console.error('Error:', error);
        throw error;
    }
}

export const recommendFriends = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
        const { auth_token, sort_by = "DEFAULT", chunk_size = 25 } = request.body as { auth_token: string; sort_by?: string; chunk_size: number; };

        const account = await tryFindAccountBySessionToken(auth_token, prisma);
        if (account == undefined) {
            reply.status(401).send({ status: "BAD_AUTH" });
        }

        const sortingMode = _getSortingMode(sort_by);
        const recommendedFriends = await getFriendRecommendations(account!.id, sortingMode, chunk_size);

        reply.status(201).send({ status: "SUCCESS", result: recommendedFriends });
    } catch (error) {
        reply.status(500).send({ status: "FAILURE" });
    }
};

export const recommendFriendsSchema = {
    type: 'object',
    required: ['auth_token'],
    properties: {
        auth_token: { type: 'string' },
        sort_by: { type: 'string' },
        chunk_size: { type: 'number' }
    },
};