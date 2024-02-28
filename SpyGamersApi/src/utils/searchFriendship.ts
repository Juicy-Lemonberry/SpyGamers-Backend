import { PrismaClient } from '@prisma/client';

/**
 * Database to search for friendship status between 2 acounts.
 * (Order of user_a and user_b does not matter)
 * @param prismaClient 
 * @param user_a_id ID of first account.
 * @param user_b_id ID of second account.
 * @returns Friendship object, represented in Prisma table; Undefined if not found.
 */
export async function searchFriendship(prismaClient: PrismaClient, user_a_id: number, user_b_id: number) {
    const friendship = await prismaClient.friendship.findFirst({
        where: {
            OR: [
                { account_1_id: user_a_id, account_2_id: user_b_id },
                { account_1_id: user_b_id, account_2_id: user_a_id }
            ]
        }
    });

    if (friendship == null){
        return undefined;
    }

    return friendship;
}