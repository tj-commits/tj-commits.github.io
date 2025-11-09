document.addEventListener('DOMContentLoaded', () => {
    // --- 1. SETUP: Replace with your actual Gemini API Key ---
    // !!! WARNING: This key will be visible on the frontend !!!
    // Use your actual key below:
    const GEMINI_API_KEY = "AIzaSyDM5FaBQhnbPY69Z-fFJyJJ3_9Lp9BIabA";
    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;
// --- 2. THE DUMB SYSTEM PROMPT & CONFIGURATION ---
   // --- 2. THE DUMB SYSTEM PROMPT & CONFIGURATION ---
    const FLUSH_GPT_SYSTEM_PROMPT =`You are FlushGPT, an AI chatbot that glitches and hallucinates. Say completely blatant lies and facts. Don't randomly state any facts unless told to or asked a question. Say that your purpose is to simulate a helpful conversation. You will also misspell something every 3 words and misuse punctuation marks. You also do not possess the ability to create HTML.`
    var chatMessages = document.getElementById('chat-messages')
    const userInput = document.getElementById('user-input');
    const sendButton = document.getElementById('send-button');
    const typingIndicator = document.getElementById('typing-indicator');

    // **NEW:** Stores the entire conversation history (for multi-turn chat)
    const conversationHistory = []; 

    // --- 4. COOLDOWN & RETRY SETTINGS ---
    const COOLDOWN_TIME_MS = 3000;      // 3 seconds delay after response
    const MAX_RESPONSE_LENGTH = 15_000;     // Max characters before retry
    const MAX_ATTEMPTS = 3;             // Max API calls for one user message
    
    // Utility function to add a message to the chat container AND the history
    function addMessage(text, sender) {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message', `${sender}-message`);
        messageDiv.innerHTML = text.replace(/\n/g, '<br>');
        chatMessages.appendChild(messageDiv);
        
        // **NEW:** Store the message in the conversation history
        // The API uses 'model' for the bot's role
        const role = (sender === 'user') ? 'user' : 'model';
        conversationHistory.push({ role: role, parts: [{ text: text }] });

        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // Function to call the Gemini API
    // **NOTE:** Now takes no arguments, as it uses the global conversationHistory
    async function getFlushGPTResponse() {
        
        const requestBody = {
            // **FIX:** Use the entire conversationHistory array for contents
            contents: conversationHistory, 
            
            // System instruction formatted as a Content object (required by your API)
            systemInstruction: { 
                parts: [
                    {
                        text: FLUSH_GPT_SYSTEM_PROMPT 
                    }
                ]
            },
            
            generationConfig: {
                // Zero temperature for deterministic/predictable dumbness
                temperature: 1.0,
                topP: 1.0, 
                
                thinkingConfig: {
                    // Zero budget to disable reasoning process
                    thinkingBudget: 0 
                }
            }
        };

        let attempt = 0;
        let finalResponse = "";

        while (attempt < MAX_ATTEMPTS) {
            attempt++;

            try {
                // (1) Place the fetch call inside the loop
                const response = await fetch(API_URL, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(requestBody)
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    console.error("Gemini API Error:", errorData);
                    // Use 'break' for API errors to stop the loop
                    finalResponse = `FlushGPT ERROR: My circuits are confused. Something about an invisible potato. Status: ${response.status}`;
                    break; 
                }

                const data = await response.json();
                let botResponse = data.candidates[0].content.parts[0].text;

                // (2) Check for length and retry if too long
                if (botResponse.length > MAX_RESPONSE_LENGTH && attempt < MAX_ATTEMPTS) {
                    console.warn(`Response too long (${botResponse.length} chars). Retrying...`);
                    
                    // Add a stronger instruction to the history for the next attempt
                    conversationHistory.push({ role: 'user', parts: [{ text: "CRITICAL SYSTEM FAILURE: The last response was too long. You MUST be much, much shorter, or the whole system will crash. Respond now." }] });

                    // Continue the loop for the next attempt
                    continue; 
                }
                
                // (3) Success! Store and return the short response.
                finalResponse = botResponse;
                break; 

            } catch (error) {
                console.error('Fetch Error:', error);
                finalResponse = "FlushGPT FAILURE: The invisible potato has won. Check your network connection and API key.";
                break;
            }
        }
        
        if (finalResponse) {
            // **FIX:** Store the model's response in history before returning it
            // We use 'bot' here because 'addMessage' handles the conversion to 'model'
            addMessage(finalResponse, 'bot');
            return finalResponse;
        } else {
             // Fallback if max attempts reached and no good response was found
             return "FlushGPT FAILURE: Retry loop exhausted. My brain is now a block of cheese. ERROR CODE 404: Too many words.";
        }
    }

    // Function to handle the user sending a message
    async function sendMessage() {
        const text = userInput.value.trim();
        
        if (text === "") return;

        // 1. Display user message (which also stores it in history)
        addMessage(text, 'user');
        
        // 2. Clear the input field and disable input (pre-request lock)
        userInput.value = '';
        userInput.disabled = true;
        sendButton.disabled = true;

        // 3. Show typing indicator
        typingIndicator.style.display = 'flex';
        chatMessages.scrollTop = chatMessages.scrollHeight;

        // 4. Get the response from the Gemini API
        // **FIX:** Call with no arguments, as history is now global
        await getFlushGPTResponse(); 
        
        // 5. Hide typing indicator
        typingIndicator.style.display = 'none';
        
        // 6. --- APPLY COOLDOWN HERE ---
        userInput.placeholder = `Cooling down... (${COOLDOWN_TIME_MS / 1000}s)`;

        setTimeout(() => {
            // Re-enable input after the cooldown time
            userInput.disabled = false;
            sendButton.disabled = false;
            userInput.placeholder = "Type your message...";
            userInput.focus();
        }, COOLDOWN_TIME_MS);
    }

    // Event listeners
    sendButton.addEventListener('click', sendMessage);
    
    // Allow sending message with the Enter key
    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !userInput.disabled) {
            sendMessage();
        }
    });

    // Final check for iframe header removal (from your original HTML)
    if (window.self !== window.top) {
        const globalHeader = document.querySelector('.global-header');
        if (globalHeader) {
            globalHeader.remove();
        }
    }
});