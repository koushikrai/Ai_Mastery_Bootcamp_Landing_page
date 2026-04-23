import axios from 'axios';

const token = process.env.WHATSAPP_TOKEN;
const verify_token = process.env.VERIFY_TOKEN;
const phone_number_id = process.env.PHONE_NUMBER_ID;

const knowledgeBase = [
    {
        keywords: ["price", "cost", "fee", "how much", "amount", "fees"],
        answer: "You're getting an amazing deal! 🌟 The full 4-week program is just ₹7,999 right now (down from ₹11,999). That covers all 8 live sessions, 8 big projects, and a whole year of access to our learning platform. It's a great investment in your future! ✨"
    },
    {
        keywords: ["start", "date", "when", "begins", "schedule", "batch", "timing"],
        answer: "We're starting the adventure on May 16th! 🗓️ We have three different times to fit your weekend: \n- Batch 1: 9:30 AM\n- Batch 2: 2:00 PM\n- Batch 3: 6:30 PM\nEach session is 2 hours of pure fun. Which time works best for you? 😊"
    },
    {
        keywords: ["who", "age", "class", "grade", "kids", "old", "level"],
        answer: "We've built this specifically for kids in Classes 6 to 12. 🎓 Don't worry about it being too hard—we make the most complex AI secrets easy and super fun to learn for everyone! 🚀"
    },
    {
        keywords: ["parents", "mom", "dad", "join", "together", "family"],
        answer: "Of course parents can join! 👨‍👩‍👧‍👦 In fact, we love it when parents and kids learn together. You can be your child's first 'AI Partner' during the sessions! ❤️"
    },
    {
        keywords: ["project", "build", "create", "make", "deliverables"],
        answer: "You won't just be watching—you'll be building! 🛠️ By the end, you'll have 8 epic projects like your own AI Tutor, a 6-panel Comic Strip, and even your own live Website. Your friends won't believe you made them! 🤯"
    },
    {
        keywords: ["tools", "software", "chatgpt", "midjourney", "canva", "stack", "tech"],
        answer: "You'll be using the same tools the pros use! 🛠️ We'll master over 20 tools like ChatGPT, HeyGen for avatars, and ElevenLabs for voice magic. We make sure every tool is 100% safe and kid-friendly. 🛡️"
    },
    {
        keywords: ["certificate", "verified", "degree", "adani", "outcome", "after"],
        answer: "You bet! 📜 You'll earn an Official Certificate from the Adani Skill Development Centre. Plus, you'll get a professional portfolio of all your work to show off! It looks amazing on school records. 🌟"
    },
    {
        keywords: ["safe", "security", "privacy", "guardrails", "ethics"],
        answer: "Safety is our #1 priority. 🛡️ We use specially filtered tools and teach you how to use AI responsibly from Day 1. It's a completely safe, monitored space for you to explore and create! ✨"
    },
    {
        keywords: ["prompt", "race", "task", "framework"],
        answer: "We'll teach you the 'Secret Language' of AI! 🧠 Using our RACE and TASK frameworks, you'll learn how to talk to any AI to get exactly what you want. It's like having a superpower! ⚡"
    },
    {
        keywords: ["vibe coding", "no code", "lovable"],
        answer: "Forget boring code syntax! 🚫💻 We teach 'Vibe Coding'—where you just describe your dream app in plain English, and the AI builds it for you. It's the future of building! 🚀"
    }
];

export default async function handler(req, res) {
    // 1. Webhook Verification (GET)
    if (req.method === 'GET') {
        const mode = req.query['hub.mode'];
        const hub_token = req.query['hub.verify_token'];
        const challenge = req.query['hub.challenge'];

        if (mode && hub_token) {
            if (mode === 'subscribe' && hub_token === verify_token) {
                console.log('WEBHOOK_VERIFIED');
                return res.status(200).send(challenge);
            } else {
                return res.status(403).send('Forbidden');
            }
        }
    }

    // 2. Message Handling (POST)
    if (req.method === 'POST') {
        if (req.body.object) {
            if (req.body.entry && 
                req.body.entry[0].changes && 
                req.body.entry[0].changes[0].value.messages && 
                req.body.entry[0].changes[0].value.messages[0]) {
                
                const msg = req.body.entry[0].changes[0].value.messages[0];
                const from = msg.from;
                const text = msg.text ? msg.text.body.toLowerCase() : "";

                console.log(`Received message from ${from}: ${text}`);

                // Human Handoff Check
                if (text.includes("human") || text.includes("expert")) {
                    await sendWhatsAppMessage(from, "A human mentor has been notified. They will reply here shortly! 👨‍🏫");
                    return res.status(200).json({ status: 'human_notified' });
                }

                // Automated Matching
                let responseText = null;
                for (const item of knowledgeBase) {
                    if (item.keywords.some(kw => text.includes(kw))) {
                        responseText = item.answer;
                        break;
                    }
                }

                if (!responseText) {
                    responseText = "That's a great question! For detailed information on this topic, please connect directly with our ASDC Expert Team on WhatsApp. They will be happy to assist you! 👨‍🏫";
                }

                await sendWhatsAppMessage(from, responseText);
            }
            return res.status(200).json({ status: 'ok' });
        } else {
            return res.status(404).send('Not Found');
        }
    }

    return res.status(405).send('Method Not Allowed');
}

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
    } catch (err) {
        console.error("Error sending message:", err.response ? err.response.data : err.message);
    }
}
