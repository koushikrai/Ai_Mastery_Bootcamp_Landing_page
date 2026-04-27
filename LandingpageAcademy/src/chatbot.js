/**
 * AI Rangers Chatbot Logic
 * Handles user queries about the course and falls back to a lead capture form.
 */

const knowledgeBase = [
    {
        keywords: ["price", "cost", "fee", "how much", "amount", "fees"],
        answer: "You're getting an amazing deal! 🌟 The full 4-week program is just **₹7,999** right now (down from ₹11,999). That covers all 8 live sessions, 8 big projects, and a whole year of access to our learning platform. It's a great investment in your future! ✨"
    },
    {
        keywords: ["start", "date", "when", "begins", "schedule", "batch", "timing"],
        answer: "We're starting the adventure on **May 16th**! 🗓️ We have three different times to fit your weekend: \n- Batch 1: 9:30 AM\n- Batch 2: 2:00 PM\n- Batch 3: 6:30 PM\nEach session is 2 hours of pure fun. Which time works best for you? 😊"
    },
    {
        keywords: ["who", "age", "class", "grade", "kids", "old", "level"],
        answer: "We've built this specifically for kids in **Classes 6 to 12**. 🎓 Don't worry about it being too hard—we make the most complex AI secrets easy and super fun to learn for everyone! 🚀"
    },
    {
        keywords: ["parents", "mom", "dad", "join", "together", "family"],
        answer: "Of course parents can join! 👨‍👩‍👧‍👦 In fact, we love it when parents and kids learn together. You can be your child's first 'AI Partner' during the sessions! ❤️"
    },
    {
        keywords: ["project", "build", "create", "make", "deliverables"],
        answer: "You won't just be watching—you'll be **building**! 🛠️ By the end, you'll have 8 epic projects like your own AI Tutor, a 6-panel Comic Strip, and even your own live Website. Your friends won't believe you made them! 🤯"
    },
    {
        keywords: ["tools", "software", "chatgpt", "midjourney", "canva", "stack", "tech"],
        answer: "You'll be using the same tools the pros use! 🛠️ We'll master over 20 tools like ChatGPT, HeyGen for avatars, and ElevenLabs for voice magic. We make sure every tool is 100% safe and kid-friendly. 🛡️"
    },
    {
        keywords: ["certificate", "verified", "degree", "adani", "outcome", "after"],
        answer: "You bet! 📜 You'll earn an **Official Certificate** from the Adani Skill Development Centre. Plus, you'll get a professional portfolio of all your work to show off! It looks amazing on school records. 🌟"
    },
    {
        keywords: ["safe", "security", "privacy", "guardrails", "ethics"],
        answer: "Safety is our #1 priority. 🛡️ We use specially filtered tools and teach you how to use AI responsibly from Day 1. It's a completely safe, monitored space for you to explore and create! ✨"
    },
    {
        keywords: ["prompt", "race", "task", "framework"],
        answer: "We'll teach you the 'Secret Language' of AI! 🧠 Using our **RACE** and **TASK** frameworks, you'll learn how to talk to any AI to get exactly what you want. It's like having a superpower! ⚡"
    },
    {
        keywords: ["vibe coding", "no code", "lovable"],
        answer: "Forget boring code syntax! 🚫💻 We teach 'Vibe Coding'—where you just describe your dream app in plain English, and the AI builds it for you. It's the future of building! 🚀"
    }
];

class AIForKidsChatbot {
    constructor() {
        this.isOpen = false;
        this.isWaitingForLead = false;
        this.init();
    }

    init() {
        // Detect Page Branding
        const isAdani = document.title.toLowerCase().includes('adani') || window.location.pathname.includes('adani') || document.querySelector('img[src*="adani"]');
        this.branding = {
            primary: isAdani ? '#8A1538' : '#FF8C00',
            secondary: isAdani ? '#2C0A15' : '#1E1B4B',
            gradient: isAdani ? 'linear-gradient(135deg, #2C0A15 0%, #8A1538 100%)' : 'linear-gradient(135deg, #1E1B4B 0%, #3D2C8D 100%)',
            shadow: isAdani ? 'rgba(138, 21, 56, 0.4)' : 'rgba(255, 140, 0, 0.4)'
        };

        // Create Chatbot Elements
        const widget = document.createElement('div');
        widget.className = 'chatbot-widget';
        widget.innerHTML = `
            <div class="chatbot-window" id="chatbot-window" style="border-color: ${this.branding.primary}33">
                <div class="chatbot-header" style="background: ${this.branding.gradient}">
                    <img src="/mascots/brainy.svg" class="mascot-icon" alt="Mascot">
                    <div>
                        <h3>Brainy Ranger</h3>
                        <p>Your AI Sidekick</p>
                    </div>
                    <button class="chatbot-close" id="chatbot-close"><i class="fas fa-times"></i></button>
                </div>
                <div class="chatbot-messages" id="chatbot-messages">
                    <div class="message bot">Hi there! I'm Brainy, your AI Ranger sidekick. 🚀 I can help you with questions about our workshop, projects, or pricing. What's on your mind?</div>
                </div>
                <div class="chatbot-input">
                    <input type="text" id="chatbot-input-field" placeholder="Type your question...">
                    <button class="chatbot-send" id="chatbot-send" style="background: ${this.branding.primary}; box-shadow: 0 4px 10px ${this.branding.shadow.replace('0.4', '0.2')}">
                        <i class="fas fa-paper-plane"></i>
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(widget);

        // Update user message styles dynamically
        const style = document.createElement('style');
        style.innerHTML = `
            .message.user { background: ${this.branding.primary} !important; box-shadow: 0 4px 15px ${this.branding.shadow.replace('0.4', '0.2')} !important; }
            .lead-form { border-color: ${this.branding.primary} !important; }
            .lead-form button { background: ${this.branding.primary} !important; }
            .chatbot-input input:focus { border-color: ${this.branding.primary} !important; }
        `;
        document.head.appendChild(style);

        // Event Listeners
        this.elements = {
            window: document.getElementById('chatbot-window'),
            toggle: document.getElementById('floating-mascot-container'),
            mascotSpeech: document.getElementById('mascot-speech'),
            close: document.getElementById('chatbot-close'),
            messages: document.getElementById('chatbot-messages'),
            input: document.getElementById('chatbot-input-field'),
            send: document.getElementById('chatbot-send')
        };

        if (this.elements.toggle) {
            console.log("Chatbot: Mascot container found, binding click event.");
            this.elements.toggle.addEventListener('click', (e) => {
                console.log("Chatbot: Mascot clicked!");
                this.toggleChat();
            });
        } else {
            console.warn("Chatbot: Mascot container NOT found!");
        }

        this.elements.close.addEventListener('click', (e) => {
            console.log("Chatbot: Close button clicked!");
            e.stopPropagation(); // Prevent re-triggering toggle
            this.toggleChat(false);
        });
        this.elements.send.addEventListener('click', () => this.handleUserInput());
        this.elements.input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleUserInput();
        });
        
        // Show notification bubble after a short delay
        setTimeout(() => {
            if (!this.isOpen && this.elements.mascotSpeech) {
                this.elements.mascotSpeech.classList.add('active');
            }
        }, 3000);
    }

    toggleChat(force) {
        this.isOpen = force !== undefined ? force : !this.isOpen;
        if (this.isOpen) {
            this.elements.window.classList.add('active');
            this.elements.input.focus();
            if (this.elements.mascotSpeech) this.elements.mascotSpeech.style.opacity = '0';
        } else {
            this.elements.window.classList.remove('active');
            if (this.elements.mascotSpeech) this.elements.mascotSpeech.style.opacity = '';
        }
    }

    addMessage(text, type = 'bot') {
        const msg = document.createElement('div');
        msg.className = `message ${type}`;
        msg.innerHTML = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>');
        this.elements.messages.appendChild(msg);
        this.elements.messages.scrollTop = this.elements.messages.scrollHeight;
        return msg;
    }

    showTyping() {
        const typing = document.createElement('div');
        typing.className = 'message bot typing';
        typing.innerHTML = `<div class="typing-indicator"><span></span><span></span><span></span></div>`;
        this.elements.messages.appendChild(typing);
        this.elements.messages.scrollTop = this.elements.messages.scrollHeight;
        return typing;
    }

    handleUserInput() {
        const text = this.elements.input.value.trim();
        if (!text) return;

        this.addMessage(text, 'user');
        this.lastQuery = text; // Store last query for WhatsApp redirection
        this.elements.input.value = '';

        if (this.isWaitingForLead) return;

        const typing = this.showTyping();

        setTimeout(() => {
            typing.remove();
            this.processQuery(text);
        }, 800);
    }

    processQuery(query) {
        const lowerQuery = query.toLowerCase();
        let bestMatch = null;

        for (const item of knowledgeBase) {
            if (item.keywords.some(kw => lowerQuery.includes(kw))) {
                bestMatch = item;
                break;
            }
        }

        if (bestMatch) {
            this.addMessage(bestMatch.answer);
        } else {
            this.showFallback();
        }
    }

    showFallback() {
        this.addMessage("That's a great question! For detailed information on this topic, please connect directly with our ASDC Expert Team on WhatsApp.");
        
        const actionDiv = document.createElement('div');
        actionDiv.className = 'chatbot-actions';
        actionDiv.style.cssText = 'display: flex; flex-direction: column; gap: 10px; margin-top: 15px;';
        
        const whatsappBtn = document.createElement('button');
        whatsappBtn.className = 'whatsapp-btn';
        whatsappBtn.innerHTML = '<i class="fab fa-whatsapp"></i> Connect with Expert Team';
        whatsappBtn.style.cssText = 'background: #25D366; color: white; border: none; padding: 14px; border-radius: 12px; font-weight: 800; cursor: pointer; display: flex; items-center; justify-content: center; gap: 10px; font-size: 15px; box-shadow: 0 4px 15px rgba(37, 211, 102, 0.3); transition: transform 0.2s;';
        
        whatsappBtn.onmouseover = () => whatsappBtn.style.transform = 'scale(1.02)';
        whatsappBtn.onmouseout = () => whatsappBtn.style.transform = 'scale(1)';

        whatsappBtn.onclick = () => {
            const phone = "919727257426";
            const message = encodeURIComponent(`Hello ASDC Team, I have a query from the AI Rangers website regarding: "${this.lastQuery || ''}"`);
            window.open(`https://api.whatsapp.com/send?phone=${phone}&text=${message}&lang=en`, '_blank');
        };

        actionDiv.appendChild(whatsappBtn);
        this.elements.messages.appendChild(actionDiv);
        this.elements.messages.scrollTop = this.elements.messages.scrollHeight;
    }
}

// Initialize Chatbot when DOM is ready
const initChatbot = () => {
    if (!window.aiChatbot) {
        console.log("Chatbot: Initializing...");
        window.aiChatbot = new AIForKidsChatbot();
    }
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initChatbot);
} else {
    initChatbot();
}
