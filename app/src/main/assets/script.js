document.addEventListener('DOMContentLoaded', () => {

    // --- Side Menu Functionality ---
    const hamburgerBtn = document.getElementById('hamburger-btn');
    const closeMenuBtn = document.getElementById('close-menu-btn');
    const sideMenu = document.getElementById('side-menu');
    const overlay = document.getElementById('overlay');

    const toggleMenu = (shouldOpen) => {
        const isOpen = sideMenu.classList.contains('open');
        // If shouldOpen is not a boolean, toggle based on current state
        if (typeof shouldOpen !== 'boolean') {
            shouldOpen = !isOpen;
        }

        sideMenu.classList.toggle('open', shouldOpen);
        overlay.classList.toggle('active', shouldOpen);
        document.body.classList.toggle('no-scroll', shouldOpen);
    };

    if (hamburgerBtn) hamburgerBtn.addEventListener('click', () => toggleMenu(true));
    if (closeMenuBtn) closeMenuBtn.addEventListener('click', () => toggleMenu(false));
    if (overlay) overlay.addEventListener('click', () => toggleMenu(false));

    // --- Chatbot Functionality ---
    const chatMain = document.getElementById('chat-main');
    const chatMessages = document.getElementById('chat-messages');
    const userInput = document.getElementById('user-input');
    const sendButton = document.getElementById('send-button');
    const welcomeContainer = document.getElementById('welcome-container');

    if (chatMain && chatMessages && userInput && sendButton) {

        // --- API Details ---
        const groqApiUrl = 'https://api.groq.com/openai/v1/chat/completions';
        // IMPORTANT: Replace with your actual key. Do not expose this key publicly.
        const groqApiKey = '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';
        if (groqApiKey && groqApiKey.startsWith('gsk_')) {
            console.warn("SECURITY WARNING: Groq API Key is hardcoded. For production, use a backend proxy to protect your key.");
        }

        let chatHistory = [];

        // --- Event Listeners ---
        userInput.addEventListener('input', () => {
            userInput.style.height = 'auto';
            userInput.style.height = `${userInput.scrollHeight}px`;
            sendButton.disabled = userInput.value.trim() === '';
        });

        sendButton.addEventListener('click', handleSendMessage);
        userInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
            }
        });

        // --- Core Functions ---
        function handleSendMessage() {
            const userText = userInput.value.trim();
            if (userText) {
                addMessage(userText, 'user');
                userInput.value = '';
                userInput.style.height = 'auto';
                sendButton.disabled = true;
                sendMessageToGroq(userText);
            }
        };

        async function sendMessageToGroq(message) {
            if (!groqApiKey || groqApiKey === "YOUR_GROQ_API_KEY_HERE") {
                addMessage('Error: API Key is not configured. Please add your Groq API key in script.js.', 'bot');
                return;
            }

            const loadingElement = showTypingIndicator();
            userInput.disabled = true;

            const systemPrompt = `You are Eco Assistant, an expert AI focused on environmental issues, water conservation, sustainability, recycling, and climate change. Provide helpful, accurate, and actionable advice. Keep responses concise and easy to understand. Format important points or steps using Markdown (like bullet points *, lists 1., or bold **) when appropriate. Do not engage in topics outside of this scope. Be friendly and encouraging.`;

            // Add current user message to chat history for context
            const currentChat = chatHistory.map(msg => ({
                role: msg.sender === 'user' ? 'user' : 'assistant',
                content: msg.text
            }));

            const payload = {
                model: "llama3-8b-8192",
                messages: [
                    { role: "system", content: systemPrompt },
                    ...currentChat,
                    { role: "user", content: message }
                ]
            };

            try {
                const response = await fetch(groqApiUrl, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${groqApiKey}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                if (!response.ok) throw new Error(`API Error: ${response.statusText}`);

                const data = await response.json();
                const botReply = data.choices[0]?.message?.content;

                if (botReply) {
                    addMessage(botReply.trim(), 'bot');
                } else {
                    addMessage('Sorry, I received an empty response.', 'bot');
                }

            } catch (error) {
                console.error('Error fetching from Groq API:', error);
                addMessage(`Sorry, an error occurred: ${error.message}`, 'bot');
            } finally {
                removeTypingIndicator(loadingElement);
                userInput.disabled = false;
                userInput.focus();
            }
        }

        // --- UI & Storage Helper Functions ---

        function addMessage(text, sender) {
            if (welcomeContainer && window.getComputedStyle(welcomeContainer).display !== 'none') {
                welcomeContainer.style.display = 'none';
            }
            if (!chatMain.classList.contains('chat-active')) {
                chatMain.classList.add('chat-active');
            }

            displayMessage(text, sender);

            // Add message to our history array and save it
            chatHistory.push({ sender, text });
            saveChatHistory();
        };

        function displayMessage(text, sender) {
            const messageWrapper = document.createElement('div');
            messageWrapper.className = `message-wrapper ${sender}`;
            const messageContent = document.createElement('div');
            messageContent.className = 'message-content';

            if (sender === 'bot' && window.marked) {
                messageContent.innerHTML = marked.parse(text, { breaks: true, gfm: true });
            } else {
                messageContent.textContent = text;
            }

            messageWrapper.appendChild(messageContent);
            chatMessages.appendChild(messageWrapper);
            scrollToBottom();
        }

        function saveChatHistory() {
            localStorage.setItem('ecoAssistantChatHistory', JSON.stringify(chatHistory));
        }

        function loadChatHistory() {
            const savedHistory = localStorage.getItem('ecoAssistantChatHistory');
            if (savedHistory) {
                chatHistory = JSON.parse(savedHistory);
                if (chatHistory.length > 0) {
                    if (welcomeContainer) welcomeContainer.style.display = 'none';
                    chatMain.classList.add('chat-active');
                    chatMessages.innerHTML = '';
                    chatHistory.forEach(msg => {
                        displayMessage(msg.text, msg.sender);
                    });
                }
            }
        }

        function showTypingIndicator() {
            const typingWrapper = document.createElement('div');
            typingWrapper.className = 'message-wrapper bot typing-indicator';
            typingWrapper.innerHTML = `
                <div class="message-content">
                    <span></span><span></span><span></span>
                </div>
            `;
            chatMessages.appendChild(typingWrapper);
            scrollToBottom();
            return typingWrapper;
        }

        function removeTypingIndicator(indicator) {
            if (indicator) {
                indicator.remove();
            }
        }

        function scrollToBottom() {
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }

        // --- Mobile Keyboard Handling ---
        const isMobile = window.matchMedia("(max-width: 767px)").matches;
        const inputContainer = document.querySelector('.chat-input-area-container');
        if (isMobile && inputContainer && userInput) {
            userInput.addEventListener('focus', () => {
                setTimeout(() => {
                    inputContainer.classList.add('keyboard-visible');
                    scrollToBottom();
                }, 300);
            });
            userInput.addEventListener('blur', () => {
                inputContainer.classList.remove('keyboard-visible');
            });
        }

        loadChatHistory();
    }
});