"use server";
import { supabase } from "@/lib/db";
import { EmbedBuilder } from "@discordjs/builders";

export const sendDiscordWebhook = async (message: string) => {
    const embed = JSON.parse(message);

    const webhooks = (await supabase.from('guildSettings').select()).data;

    if (!webhooks) {
        return;
    }

    const urlPromises = webhooks.map((webhook: any) => {
        if (!webhook.webhookURL) {
            return;
        }
        
        postToWebhook(webhook.webhookURL, embed);
    });

    await Promise.all(urlPromises);
    return true;
}

const postToWebhook = async (url: string, message: EmbedBuilder) => {
    console.log('Posting to webhook', url, message);

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ embeds: [message] })
        });
        if (!response.ok) {
            return
        }

        return true;
    } catch (error) {
        console.error(error);
    }
}