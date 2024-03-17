
import { PrismaClient, Prisma } from '@prisma/client';

import { isStringEmptyOrWhitespace } from '../utils/isStringEmptyOrWhitespace';
import { searchFriendship } from '../utils/searchFriendship';
import { UseLLMChat } from '../utils/useLLMChat';

/**
 * Use this function to get a bot to reply back to a DM...
 */
export default async function BotReplyDM(botID: number, userID: number, userMessage: string) {
    const prisma = new PrismaClient();

    try {

        if (isStringEmptyOrWhitespace(userMessage)) {
            console.warn("Cant reply to an empty content!")
            return false;
        }

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
        if (!botAccount || !userAccount) {
            console.warn("Bot or User does not exists!")
            return false;
        }

        // Dont reply if not a bot, and dont reply to a bot...
        if (!botAccount.is_bot || userAccount.is_bot) {
            console.warn("Either self is not bot, or target is a bot!")
            return false;
        }

        const friendShip = await searchFriendship(prisma, botID, userID);
        // Not friends, dont reply...
        if (!friendShip || !friendShip.request_accepted) {
            console.warn("Bot and User are not friends!")
            return false;
        }

        const result = await UseLLMChat(`${botID}-${userID}`, userMessage);
        if (!result.success){
            return false;
        }
        
        await prisma.directMessage.create({
            data: {
                sender_id: botID,
                contact_id: userID,
                content: result.content
            }
        });

        return true;
    } catch (error) {
        console.log("Failed to query LLM Stack :: ", error)
        return false;
    } finally {
        await prisma.$disconnect();
    }
}