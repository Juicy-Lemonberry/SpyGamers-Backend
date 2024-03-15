
import { LLM_STACK_SETTINGS } from "../config/settings";

export async function UseLLMChat(sessionID: string, message: string) {
    if (!LLM_STACK_SETTINGS.BASE_LLM_API_ROUTE || !LLM_STACK_SETTINGS.BEARER_KEY || !LLM_STACK_SETTINGS.CHATTING_PREDICTIONS) {
        console.warn("No enviornment variable set for LLM Stack Routes...")
        return {
            content: "BAD_ENV",
            success: false
        };
    }

    const queryData = {
        "question": message,
        "overrideConfig": {
            "sessionId": sessionID
        }
    }

    console.log(`${LLM_STACK_SETTINGS.BEARER_KEY}`);
    console.log(`${LLM_STACK_SETTINGS.BASE_LLM_API_ROUTE}${LLM_STACK_SETTINGS.CHATTING_PREDICTIONS}`)
    const response = await fetch(
        `${LLM_STACK_SETTINGS.BASE_LLM_API_ROUTE}${LLM_STACK_SETTINGS.CHATTING_PREDICTIONS}`,
        {
            headers: {
                Authorization: `Bearer ${LLM_STACK_SETTINGS.BEARER_KEY}`,
                "Content-Type": "application/json"
            },
            method: "POST",
            body: JSON.stringify(queryData)
        }
    );


    if (!response.ok) {
        console.error(`Bad Response (${response.status}) :: ${response.statusText}`)
        return {
            content: "BAD_RESPONSE",
            success: false
        };;
    }

    const data = await response.json();
    return {
        content: data.text,
        success: true
    };
}