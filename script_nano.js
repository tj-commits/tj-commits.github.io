document.addEventListener('DOMContentLoaded', () => {
    const userInput = document.getElementById('user-input');
    const sendButton = document.getElementById('send-button');
    const chatMessages = document.getElementById('chat-messages');
    const typingIndicator = document.getElementById('typing-indicator');
    
    // Function to scroll to the bottom of the chat
    function scrollToBottom() {
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // Function to simulate a bot response that sounds helpful but isn't
    function generateBotResponse(userMessage) {
        // High-jargon, low-substance responses suitable for FlushGPT Nano
        const responses = [
            "We appreciate your engagement. We are actively cross-referencing this input against our validated data silos for strategic feedback assimilation.",
            "That query involves complex, multi-layered data architecture. Our current model iteration suggests a comprehensive review of operational parameters.",
            "Thank you for raising this. Your concern has been flagged for prioritized resource allocation within our core competency matrix.",
            "We are committed to delivering optimized user outcomes. Please proceed with further contextual inputs to refine our predictive modeling capabilities.",
            "The data stream is currently undergoing a necessary calibration process. A definitive answer cannot be generated at this operational juncture.",
            "Acknowledged. We are scaling our response efficiency to maximize synergistic information retrieval, which may require a moment.",
            "That's a high-value question. We recommend migrating this complex request to FlushGPT 3.0 Pro for enhanced algorithmic clarity and resolution.",
            "Understood. Your inquiry validates the necessity of perpetual iterative scaling. We are here to facilitate continuous informational throughput."
        ];

        // Pick a random response from the array
        const responseText = responses[Math.floor(Math.random() * responses.length)];

        // Simulate typing delay
        typingIndicator.style.display = 'block';
        scrollToBottom();

        setTimeout(() => {
            // Hide typing indicator
            typingIndicator.style.display = 'none';

            // Create and append the new bot message
            const botMessageDiv = document.createElement('div');
            botMessageDiv.className = 'message bot-message';
            botMessageDiv.textContent = responseText;
            chatMessages.appendChild(botMessageDiv);

            scrollToBottom();
        }, 1800); // Slightly longer delay to give the fake-jargon more impact
    }

    // Function to handle sending a message (remains the same)
    function sendMessage() {
        const messageText = userInput.value.trim();

        if (messageText !== "") {
            // 1. Create and display the user's message
            const userMessageDiv = document.createElement('div');
            userMessageDiv.className = 'message user-message';
            userMessageDiv.textContent = messageText;
            chatMessages.appendChild(userMessageDiv);

            // 2. Clear the input field
            userInput.value = '';
            
            // 3. Scroll to show the new message
            scrollToBottom();

            // 4. Generate the bot's response
            generateBotResponse(messageText);
        }
    }

    // Event listeners
    sendButton.addEventListener('click', sendMessage);

    userInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            sendMessage();
        }
    });
});