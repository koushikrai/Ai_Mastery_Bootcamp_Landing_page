/**
 * AI Rangers Chatbot Logic
 * Handles user queries about the course and falls back to a lead capture form.
 */

const knowledgeBase = [
    {
        keywords: ["price", "cost", "fee", "how much", "amount", "fees"],
        answer: "The 4-week AI Rangers program is currently available at a special offer price of **₹7,999** (original price ₹11,999). This includes 8 live sessions, 8 projects, and 1 year of LMS access! ✨"
    },
    {
        keywords: ["start", "date", "when", "begins", "schedule", "batch"],
        answer: "Our upcoming batches begin on **May 16th**! We have 3 weekend slots: \n- Batch 1: 9:30 AM Induction\n- Batch 2: 2:00 PM Induction\n- Batch 3: 6:30 PM Induction\nWhich one works best for you? 😊"
    },
    {
        keywords: ["who", "age", "class", "grade", "kids", "old"],
        answer: "AI Rangers is specially designed for kids in **Classes 6 to 12**. We make complex AI concepts simple and fun for every age group! 🎓"
    },
    {
        keywords: ["project", "build", "create", "make", "what will i learn"],
        answer: "You'll build **8 amazing projects**, including:\n- Your own AI Tutor Bot 🤖\n- An AI Comic Strip 🎨\n- A Live Published Website 🌐\n- A Talking AI Avatar 🗣️\nAnd 4 more epic creations! No coding required."
    },
    {
        keywords: ["tools", "software", "chatgpt", "midjourney", "canva"],
        answer: "You'll master over **20+ professional AI tools** like ChatGPT, Midjourney, DALL-E, Claude, Canva AI, and even 'Vibe Coding' tools. We use only safe, age-appropriate platforms. 🛠️"
    },
    {
        keywords: ["certificate", "verified", "degree", "adani"],
        answer: "Yes! Every graduate receives an **Official Certificate of Completion** from the Adani Skill Development Centre, along with a professionally compiled digital portfolio of their projects. 📜"
    },
    {
        keywords: ["contact", "phone", "whatsapp", "support", "help", "number"],
        answer: "You can reach our team anytime via **WhatsApp at +91 9723604009**. We're happy to help with any questions! 📱"
    },
    {
        keywords: ["safe", "security", "privacy", "guardrails"],
        answer: "Safety is our priority. We use tools with built-in content guardrails and teach AI ethics from Day 1. The program is **100% Kid Safe**. 🛡️"
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
        this.addMessage("I'm sorry, I don't have that information currently. 😔");
        this.addMessage("Would you like to speak with a human mentor on WhatsApp or leave your details for a callback?");
        
        const actionDiv = document.createElement('div');
        actionDiv.className = 'chatbot-actions';
        actionDiv.style.cssText = 'display: flex; flex-direction: column; gap: 10px; margin-top: 10px;';
        
        const whatsappBtn = document.createElement('button');
        whatsappBtn.className = 'whatsapp-btn';
        whatsappBtn.innerHTML = '<i class="fab fa-whatsapp"></i> Chat on WhatsApp';
        whatsappBtn.style.cssText = 'background: #25D366; color: white; border: none; padding: 12px; border-radius: 12px; font-weight: 800; cursor: pointer; display: flex; items-center; justify-content: center; gap: 8px; font-size: 14px;';
        
        whatsappBtn.onclick = () => {
            const phone = "919723604009";
            const message = encodeURIComponent(`Hi Brainy! I have a question: "${this.lastQuery || ''}"`);
            window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
        };

        const formBtn = document.createElement('button');
        formBtn.innerHTML = '<i class="fas fa-envelope"></i> Leave a Message';
        formBtn.style.cssText = 'background: #F1F5F9; color: #1E1B4B; border: 2px solid #E2E8F0; padding: 12px; border-radius: 12px; font-weight: 800; cursor: pointer; font-size: 14px;';
        
        formBtn.onclick = () => {
            formBtn.style.display = 'none';
            whatsappBtn.style.display = 'none';
            this.showLeadForm();
        };

        actionDiv.appendChild(whatsappBtn);
        actionDiv.appendChild(formBtn);
        this.elements.messages.appendChild(actionDiv);
        this.elements.messages.scrollTop = this.elements.messages.scrollHeight;
    }

    showLeadForm() {
        const formDiv = document.createElement('div');
        formDiv.className = 'lead-form';
        formDiv.innerHTML = `
            <input type="text" id="lead-name" placeholder="Student/Parent Name" required>
            <input type="email" id="lead-email" placeholder="Email Address" required>
            <input type="tel" id="lead-phone" placeholder="WhatsApp Number" required>
            <button id="lead-submit">Request Call Back</button>
        `;
        this.elements.messages.appendChild(formDiv);
        this.elements.messages.scrollTop = this.elements.messages.scrollHeight;

        document.getElementById('lead-submit').addEventListener('click', () => this.handleLeadSubmit());
    }

    handleLeadSubmit() {
        const name = document.getElementById('lead-name').value;
        const email = document.getElementById('lead-email').value;
        const phone = document.getElementById('lead-phone').value;

        if (!name || !email || !phone) {
            alert("Please fill all details! ✨");
            return;
        }

        const submitBtn = document.getElementById('lead-submit');
        submitBtn.disabled = true;
        submitBtn.innerText = "Sending...";

        // Simulate Email Sending
        // In a real scenario, you'd call an API or EmailJS here
        console.log("Sending lead to ASDC Admin:", { name, email, phone });

        setTimeout(() => {
            const form = document.querySelector('.lead-form');
            if (form) form.remove();
            this.addMessage("Thank you! Your details have been sent to the ASDC team admin. We'll reach out to you very soon! 🚀");
            
            // Optional: Actually send via EmailJS if configured
            this.sendEmailNotification({ name, email, phone });
        }, 1500);
    }

    sendEmailNotification(data) {
        // Placeholder for EmailJS or other service
        // Example:
        /*
        emailjs.send("service_id", "template_id", {
            from_name: data.name,
            from_email: data.email,
            phone: data.phone,
            message: "Chatbot Lead - Information unavailable",
            to_email: "asdc.admin@example.com"
        });
        */
       console.log("Lead captured for admin notification:", data);
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
