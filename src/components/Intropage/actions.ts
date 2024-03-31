"use server";
import {  supabase } from "@/lib/db";
import { EmbedBuilder } from "@discordjs/builders";

export const sendDiscordWebhook = async (message: EmbedBuilder) => { 
    console.log('Sending Discord webhook', message);

    const webhooks =  (await supabase.from('guildSettings').select()).data; 

    if (!webhooks) {
        return;
    }

    const urlPromises = webhooks.map((webhook: any) => {
         postToWebhook(webhook.webhookURL, message);
    });

   try {
         await Promise.all(urlPromises);
         return true; 
    } catch (error) {
        console.error(error);
        return false;
    }  
}

const postToWebhook = async (url: string, message: EmbedBuilder) => { 
    console.log('Posting to webhook', url, message);
    
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ embeds: [message]})
        });
        if (!response.ok) {  
            throw new Error('Failed to send Discord webhook') 
        }

        return true; 
    } catch (error) {
        console.error(error);
    }
}