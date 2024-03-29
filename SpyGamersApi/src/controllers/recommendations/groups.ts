import { FastifyReply, FastifyRequest } from 'fastify';
import { PrismaClient, Prisma, Group } from '@prisma/client';
import { tryFindAccountBySessionToken } from '../../utils/tryFindAccountBySessionToken';

interface RecommendedGroup {
	id: number;
	name: string;
	description: string
	member_count: number;
	weight: number;
}

async function recommendGroupsForUser(prisma: PrismaClient, accountId: number): Promise<RecommendedGroup[]> {
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
	const prisma = new PrismaClient();
	try {
		const { auth_token, chunk_size = 10 } = request.body as { auth_token: string; chunk_size?: number; };

		const account = await tryFindAccountBySessionToken(auth_token, prisma);
		if (!account) {
			return reply.status(200).send({ status: "BAD_AUTH" });
		}

		const recommendedGroups = (await recommendGroupsForUser(prisma, account.id)).slice(0, chunk_size);
		return { status: "SUCCESS", result: recommendedGroups }
	} catch (error) {
		console.error("Error:", error);
		reply.status(500).send({ status: "FAILURE" });
	} finally {
		await prisma.$disconnect();
	}
};


export const recommedGroupsSchema = {
	type: 'object',
	required: ['auth_token'],
	properties: {
		auth_token: { type: 'string' },
		chunk_size: { type: 'number' }
	},
};