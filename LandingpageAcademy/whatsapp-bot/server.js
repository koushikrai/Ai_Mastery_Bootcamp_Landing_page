const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
require('dotenv').config();

const app = express().use(bodyParser.json());

const token = process.env.WHATSAPP_TOKEN;
const verify_token = process.env.VERIFY_TOKEN;
const phone_number_id = process.env.PHONE_NUMBER_ID;

// --- Knowledge Base (Imported/Duplicated for Bot) ---
const knowledgeBase = [
    {
        keywords: ["price", "cost", "fee", "amount"],
        answer: "The 4-week AI Rangers program is ₹7,999 (original ₹11,999). This includes 8 sessions and 8 projects! ✨"
    },
    {
        keywords: ["start", "date", "when", "batch"],
        answer: "Upcoming batches begin on May 16th! We have slots at 9:30 AM, 2:00 PM, and 6:30 PM. 😊"
    },
    {
        keywords: ["age", "class", "grade"],
        answer: "AI Rangers is for kids in Classes 6 to 12. 🎓"
    },
    {
        keywords: ["project", "build"],
        answer: "You'll build 8 projects, including an AI Tutor Bot, Comic Strip, and a Website! 🤖"
    },
    {
        keywords: ["human", "person", "expert", "teacher", "talk to"],
        answer: "Transferring you to a human mentor... please wait! 👨‍🏫"
    }
];

// Webhook Verification (GET)
app.get('/webhook', (req, res) => {
    const mode = req.query['hub.mode'];
    const hub_token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode && hub_token) {
        if (mode === 'subscribe' && hub_token === verify_token) {
            console.log('WEBHOOK_VERIFIED');
            res.status(200).send(challenge);
        } else {
            res.sendStatus(403);
        }
    }
});

// Message Handling (POST)
app.post('/webhook', async (req, res) => {
    if (req.body.object) {
        if (req.body.entry && 
            req.body.entry[0].changes && 
            req.body.entry[0].changes[0].value.messages && 
            req.body.entry[0].changes[0].value.messages[0]) {
            
            const msg = req.body.entry[0].changes[0].value.messages[0];
            const from = msg.from; // Sender's WhatsApp ID
            const text = msg.text ? msg.text.body.toLowerCase() : "";

            console.log(`Received message from ${from}: ${text}`);

            // 1. Check for Human Handoff (This would usually check a DB)
            if (text.includes("human") || text.includes("expert")) {
                await sendWhatsAppMessage(from, "A human mentor has been notified. They will reply here shortly! 👨‍🏫");
                // Here you would notify your team via email/dashboard
                res.sendStatus(200);
                return;
            }

            // 2. Automated Matching
            let responseText = null;
            for (const item of knowledgeBase) {
                if (item.keywords.some(kw => text.includes(kw))) {
                    responseText = item.answer;
                    break;
                }
            }

            // 3. Fallback (The "Bot can't answer" logic)
            if (!responseText) {
                responseText = "I'm not sure about that. 😔 Would you like me to connect you with a human mentor? (Reply 'HUMAN')";
            }

            // 4. Send Response
            await sendWhatsAppMessage(from, responseText);
        }
        res.sendStatus(200);
    } else {
        res.sendStatus(404);
    }
});

// Helper Function: Send Message via Meta Graph API
async function sendWhatsAppMessage(to, text) {
    try {
        await axios({
            method: 'POST',
            url: `https://graph.facebook.com/v17.0/${phone_number_id}/messages`,
            data: {
                messaging_product: "whatsapp",
                to: to,
                text: { body: text },
            },
            headers: { "Authorization": `Bearer ${token}` },
        });
        console.log("Message sent successfully");
    } catch (err) {
        console.error("Error sending message:", err.response ? err.response.data : err.message);
    }
}

const PORT = process.env.PORT || 1337;
app.listen(PORT, () => console.log(`Webhook is listening on port ${PORT}`));
