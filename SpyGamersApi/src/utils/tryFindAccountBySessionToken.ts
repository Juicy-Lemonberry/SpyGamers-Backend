import { PrismaClient } from '@prisma/client';

export async function tryFindAccountBySessionToken(sessionToken: string, prismaClient: PrismaClient) {
    const session = await prismaClient.session.findUnique({
        where: {
            token: sessionToken
        },
    });

    if (!session || session.expiry_date < new Date()) {
        return undefined;
    }

    const account = await prismaClient.account.findUnique({
        where: {
        id: session.accountId,
        },
    });

    return account || undefined;
}