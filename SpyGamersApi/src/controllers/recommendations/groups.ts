import { FastifyReply, FastifyRequest } from 'fastify';
import { PrismaClient, Prisma, Group } from '@prisma/client';
import { tryFindAccountBySessionToken } from '../../utils/tryFindAccountBySessionToken';

const prisma = new PrismaClient();

interface RecommendedGroup {
    id: number;
    name: string;
    description: string
    member_count: number;
    weight: number;
}

async function recommendGroupsForUser(accountId: number): Promise<RecommendedGroup[]> {
    const targetUser = await prisma.account.findUnique({
      where: { id: accountId },
      include: {
        friends_with: {
          where: { request_accepted: true },
          select: { account1: true, account2: true },
        },
      },
    });
  
    if (!targetUser) {
      throw new Error('Target user not found');
    }
  
  const groups = await prisma.group.findMany({
    where: {
      is_public: true,
      members: {
        none: {
          account_id: accountId,
        },
      },
    },
    include: {
      members: {
        where: {
          account_id: {
            in: targetUser.friends_with.map((friendship) => friendship.account1.id),
          },
        },
      },
    },
  });
  
    const recommendations: RecommendedGroup[] = [];
  
    const allPromises = []
    groups.forEach((group) => {
        const newRecommendation: RecommendedGroup = {
            id: group.id,
            name: group.name,
            description: group.description ? group.description : "",
            member_count: group.members.length,
            weight: group.members.length * 0.5
        };
        recommendations.push(newRecommendation);
    });
  
    return recommendations;
  }
  

export const recommedGroups = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
        const { auth_token } = request.body as { auth_token: string; };

        const account = await tryFindAccountBySessionToken(auth_token, prisma);
        if (!account) {
            return reply.status(401).send({ status: "BAD_AUTH" });
        }

        const recommendedGroups = await recommendGroupsForUser(account.id);
        return { status: "SUCCESS", result: recommendedGroups }
    } catch (error) {
        console.error("Error:", error);
        reply.status(500).send({ status: "FAILURE" });
    }
};


export const recommedGroupsSchema = {
    type: 'object',
    required: ['auth_token'],
    properties: {
        auth_token: { type: 'string' }
    },
};