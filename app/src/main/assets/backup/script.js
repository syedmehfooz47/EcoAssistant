document.addEventListener('DOMContentLoaded', () => {
    const hamburgerBtn = document.getElementById('hamburger-btn');
    const sideMenu = document.getElementById('side-menu');
    const overlay = document.getElementById('overlay');
    const menuLinks = document.querySelectorAll('.menu-link');

    // --- Menu Toggle Functionality ---
    function toggleMenu(forceClose = false) {
        // Check if elements exist before using them
        if (!sideMenu || !overlay) return;
        const isOpen = sideMenu.classList.contains('open');
        if (forceClose || isOpen) {
            sideMenu.classList.remove('open');
            overlay.classList.remove('active');
            if (hamburgerBtn) hamburgerBtn.setAttribute('aria-expanded', 'false');
            sideMenu.setAttribute('aria-hidden', 'true');
        } else {
            sideMenu.classList.add('open');
            overlay.classList.add('active');
            if (hamburgerBtn) hamburgerBtn.setAttribute('aria-expanded', 'true');
            sideMenu.setAttribute('aria-hidden', 'false');
        }
    }

    if (hamburgerBtn && sideMenu && overlay) {
        hamburgerBtn.addEventListener('click', (e) => { e.stopPropagation(); toggleMenu(); });
        overlay.addEventListener('click', () => { toggleMenu(true); });
        menuLinks.forEach(link => { link.addEventListener('click', () => { setTimeout(() => toggleMenu(true), 50); }); });
        document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && sideMenu.classList.contains('open')) { toggleMenu(true); } });
    } else { console.warn("Menu elements missing."); }

    // --- Chat Functionality ---
    const chatMessages = document.getElementById('chat-messages');
    const userInput = document.getElementById('user-input');
    const sendButton = document.getElementById('send-button');
    const chatInputArea = document.getElementById('chat-input-area'); // Get fixed input area

    if (chatMessages && userInput && sendButton && chatInputArea) {
        const groqApiUrl = 'https://api.groq.com/openai/v1/chat/completions';
        const groqApiKey = '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'; // 🚨 Security Warning
        console.warn("SECURITY WARNING: Groq API Key is hardcoded.");

        sendButton.disabled = true;
        userInput.placeholder = "Ask a question...";

        // --- Dynamic Padding for Fixed Input ---
        let lastInputAreaHeight = 0;

        function updateMessagesPadding() {
            if (!chatInputArea || !chatMessages) return; // Ensure elements exist
            const currentHeight = chatInputArea.offsetHeight;
            // Add console log for debugging
            console.log(`DEBUG: Input Area Height = ${currentHeight}px`);
            if (currentHeight > 0 && currentHeight !== lastInputAreaHeight) {
                lastInputAreaHeight = currentHeight;
                const newPadding = currentHeight + 10; // Add 10px buffer
                chatMessages.style.paddingBottom = `${newPadding}px`;
                 // Add console log for debugging
                console.log(`DEBUG: Set chatMessages paddingBottom = ${newPadding}px`);
                // Scroll down when padding changes *only if already near bottom*
                 // Check if scrolled near the bottom before auto-scrolling
                // const isScrolledToBottom = chatMessages.scrollHeight - chatMessages.clientHeight <= chatMessages.scrollTop + currentHeight + 20; // Check within 20px + input height buffer
                // if(isScrolledToBottom){
                     scrollToBottom(); // Scroll when padding updates, assuming user wants to see new space
                // }
            }
        }

        // Use ResizeObserver for accurate height changes
        if (typeof ResizeObserver === 'function') {
            const inputAreaObserver = new ResizeObserver(updateMessagesPadding);
            inputAreaObserver.observe(chatInputArea);
             console.log("DEBUG: ResizeObserver attached to input area."); // DEBUG
        } else {
            // Fallback check (less reliable)
            userInput.addEventListener('input', updateMessagesPadding);
            window.addEventListener('resize', updateMessagesPadding);
            console.warn("DEBUG: ResizeObserver not supported, using fallback for padding adjustment.");
        }
        // Initial padding calculation after a delay for layout rendering
        setTimeout(updateMessagesPadding, 300); // Increased delay slightly


        // --- Keyboard Handling ---
        userInput.addEventListener('focus', () => {
            console.log("DEBUG: User input focused"); // DEBUG
            // On focus, primarily ensure the latest messages are scrolled into view above the input area
            setTimeout(scrollToBottom, 300); // Increased delay
        });

        // --- Helper Functions ---
        function addMessage(sender, text, type = 'text') {
            const messageDiv = document.createElement('div');
            messageDiv.classList.add('message', `${sender}-message`);
            const messageContentDiv = document.createElement('div');
            messageContentDiv.classList.add('message-content');

            if (type === 'loading') { messageContentDiv.innerHTML = `<div class="typing-indicator"><span></span><span></span><span></span></div>`; messageDiv.classList.add('loading'); }
            else if (type === 'text') { messageContentDiv.innerHTML = marked.parse(text, { breaks: true, gfm: true }); }
            else { messageContentDiv.textContent = text; }

            messageDiv.appendChild(messageContentDiv);
            chatMessages.appendChild(messageDiv);

            const initialMsg = chatMessages.querySelector('.initial-message');
             if(initialMsg && !messageDiv.classList.contains('initial-message') && type !== 'loading') { initialMsg.remove(); }

            scrollToBottom();
            return messageDiv;
        }

        function scrollToBottom() {
             setTimeout(() => { if (chatMessages) { chatMessages.scrollTop = chatMessages.scrollHeight; } }, 50);
        }
        function showLoadingIndicator() { return addMessage('bot', '', 'loading'); }
        function removeLoadingIndicator(loadingElement) { if (loadingElement && chatMessages && chatMessages.contains(loadingElement)) { chatMessages.removeChild(loadingElement); } }

        function adjustTextareaHeight() {
            if (!userInput) return;
            userInput.style.height = 'auto';
            let scrollHeight = userInput.scrollHeight;
            const maxHeight = 120; const minHeight = 44;
            let newHeight = Math.max(minHeight, Math.min(scrollHeight, maxHeight));
            userInput.style.height = newHeight + 'px';
            userInput.style.overflowY = scrollHeight > maxHeight ? 'auto' : 'hidden';
            if (sendButton) { sendButton.disabled = userInput.value.trim() === ''; }
            // Trigger padding update because textarea height affects input area height
             updateMessagesPadding(); // Important: update padding when textarea height changes
        }

        // --- API Call ---
        async function sendMessageToGroq(message) {
             // Keep existing API call logic...
            if (!groqApiKey) { addMessage('bot', 'Error: API Key missing.'); return; }
            const loadingElement = showLoadingIndicator();
            if(sendButton) sendButton.disabled = true; if(userInput) userInput.disabled = true;
            const systemPrompt = `You are Eco Assistant, an expert AI focused on environmental issues, water conservation, sustainability, recycling, and climate change. Provide helpful, accurate, and actionable advice. Keep responses concise and easy to understand. Format important points or steps using Markdown (like bullet points *, lists 1., or bold **) when appropriate. Do not engage in topics outside of this scope. Be friendly and encouraging.`;
            const payload = { model: "llama3-8b-8192", messages: [ { role: "system", content: systemPrompt }, { role: "user", content: message } ], temperature: 0.7, max_tokens: 1024 };

            try {
                const response = await fetch(groqApiUrl, { method: 'POST', headers: { 'Authorization': `Bearer ${groqApiKey}`, 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
                removeLoadingIndicator(loadingElement);
                if (!response.ok) { const errorData = await response.json().catch(() => ({})); console.error("API Error:", response.status, errorData); let errMsg = `API Error: ${response.status}.`; if (response.status === 401) { errMsg += " Check API Key."; } else if (response.status === 429) { errMsg += " Rate limit exceeded."; } else { errMsg += ` ${errorData.error?.message || ''}`; } throw new Error(errMsg); }
                const data = await response.json(); const botReply = data.choices[0]?.message?.content;
                 const initialMsg = chatMessages.querySelector('.initial-message');
                 if(initialMsg && botReply){ initialMsg.remove(); }
                if (botReply) { addMessage('bot', botReply.trim()); } else { addMessage('bot', 'Empty response received.'); console.error("Empty response:", data); }
            } catch (error) { console.error('Groq API Error:', error); removeLoadingIndicator(loadingElement); addMessage('bot', `Error: ${error.message}`);
            } finally { if(userInput) userInput.disabled = false; if(sendButton) sendButton.disabled = !userInput || userInput.value.trim() === ''; if(userInput) userInput.focus(); adjustTextareaHeight(); scrollToBottom(); }
        }

        // --- Event Listeners ---
        sendButton.addEventListener('click', () => { const messageText = userInput.value.trim(); if (messageText && !userInput.disabled) { addMessage('user', messageText); sendMessageToGroq(messageText); userInput.value = ''; adjustTextareaHeight(); sendButton.disabled = true; } });
        userInput.addEventListener('keypress', (event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); if (sendButton && !sendButton.disabled) { sendButton.click(); } } });
        userInput.addEventListener('input', adjustTextareaHeight);
        // adjustTextareaHeight(); // Initial call handled by ResizeObserver timeout

    } // End chat specific code
}); // End DOMContentLoaded