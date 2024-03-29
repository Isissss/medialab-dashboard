"use server";
import { EmbedBuilder } from "@discordjs/builders";

export const sendDiscordWebhook = async (message: EmbedBuilder) => {
    const url = process.env.DISCORD_WEBHOOK_URL!;

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ embeds: [message] }),
        });
        if (!response.ok) {
            throw new Error('Failed to send Discord webhook');
        }
    } catch (error) {
        console.error(error);
    }
}