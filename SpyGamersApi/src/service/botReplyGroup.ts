
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

import { isStringEmptyOrWhitespace } from '../utils/isStringEmptyOrWhitespace';
import { UseLLMChat } from '../utils/useLLMChat';

/**
 * Use this function to get a bot to reply back to a Group Message...
 */
export default async function BotReplyGroup(botID: number, groupID: number, userMessage: string) {
    try {

        if (isStringEmptyOrWhitespace(userMessage)) {
            console.warn("Cant reply to an empty content!")
            return false;
        }

        const botAccount = await prisma.account.findFirst({
            where: {
                id: botID,
                is_bot: true
            }
        });

        // Bot or User dont exists, or message is blank...
        if (!botAccount) {
            console.warn("Bot does not exists!")
            return false;
        }

        const botMember = await prisma.groupMember.findFirst({
            where: {
                group_id: groupID,
                account_id: botID
            }
        })

        // Bot doesn't exists in group
        if (!botMember) {
            console.warn("Bot does not exists in group!")
            return false;
        }

        const result = await UseLLMChat(`${botID}-${groupID}`, userMessage);
        if (!result.success){
            return false;
        }
        
        await prisma.groupMessage.create({
            data: {
                sender_id: botID,
                group_id: groupID,
                content: result.content
            }
        });

        return true;
    } catch (error) {
        console.log("Failed to query LLM Stack :: ", error)
        return false;
    }
}