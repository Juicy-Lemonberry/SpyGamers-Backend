
import { PrismaClient, Prisma } from '@prisma/client';
const prisma = new PrismaClient();

import { LLM_STACK_SETTINGS } from 'src/config/settings';
import { isStringEmptyOrWhitespace } from 'src/utils/isStringEmptyOrWhitespace';
import { searchFriendship } from 'src/utils/searchFriendship';

/**
 * Use this function to get a bot to reply back to a DM...
 */
export default async function BotReplyDM(botID: number, userID: number, userMessage: string) {
    if (!LLM_STACK_SETTINGS.BASE_LLM_API_ROUTE || !LLM_STACK_SETTINGS.BEARER_KEY || !LLM_STACK_SETTINGS.CHATTING_PREDICTIONS) {
        return false;
    }

    try {
        const userAccount = await prisma.account.findFirst({
            where: {
                id: userID
            }
        });

        const botAccount = await prisma.account.findFirst({
            where: {
                id: botID
            }
        });

        // Bot or User dont exists, or message is blank...
        if (!botAccount || !userAccount || isStringEmptyOrWhitespace(userMessage)) {
            return false;
        }

        // Dont reply if not a bot, and dont reply to a bot...
        if (!botAccount.is_bot || userAccount.is_bot) {
            return false;
        }

        const friendShip = await searchFriendship(prisma, botID, userID);
        // Not friends, dont reply...
        if (!friendShip || !friendShip.request_accepted) {
            return false;
        }

        const queryData = {
            "question": userMessage,
            "overrideConfig": {
                "sessionId": `${botID}-${userID}`
            }
        }

        const response = await fetch(
            `${LLM_STACK_SETTINGS.BASE_LLM_API_ROUTE}/${LLM_STACK_SETTINGS.CHATTING_PREDICTIONS}`,
            {
                headers: {
                    Authorization: `Bearer ${LLM_STACK_SETTINGS.BEARER_KEY}`,
                    "Content-Type": "application/json"
                },
                method: "POST",
                body: JSON.stringify(queryData)
            }
        );

        const result = await response.json();
        await prisma.directMessage.create({
            data: {
                sender_id: botID,
                contact_id: userID,
                content: result.text
            }
        });

        return true;
    } catch (error) {
        console.log("Failed to query LLM Stack", error)
        return false;
    }
}