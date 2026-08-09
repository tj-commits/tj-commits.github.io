// --- GLOBAL CHAT STATE ---
let lastInputLength = 0
let lastQueryType = "generic"
let doneitbefore = false
let isTyping = false
let usedBaseResponses = []          // Global: blocks repeating whole messages
let usedResponsesByCategory = {}    // Per-category: blocks repeating items in lists


let skipTyping = false

const userInput = document.getElementById("user-input")
const sendButton = document.getElementById("send-button")
const skipButton = document.getElementById("skip-button")
const chatMessages = document.getElementById("chat-messages")

sendButton.addEventListener("click", sendMessage)
userInput.addEventListener("keypress", function(e) {
  if (e.key === "Enter") {
    sendMessage()
  }
})

skipButton.addEventListener("click", () => {
  skipTyping = true
})

// --- HELPER FUNCTIONS ---

const getRandomResponse = (responses, category = "default") => {
  if (!usedResponsesByCategory[category]) {
    usedResponsesByCategory[category] = []
  }

  const used = usedResponsesByCategory[category]

  // Filter out responses already used in this category
  const available = responses.filter(r => !used.includes(r))

  // If everything has been used, reset category memory
  if (available.length === 0) {
    usedResponsesByCategory[category] = []
    return responses[Math.floor(Math.random() * responses.length)]
  }

  // Pick a new one
  const chosen = available[Math.floor(Math.random() * available.length)]
  usedResponsesByCategory[category].push(chosen)
  return chosen
}


function capitalizeFirstLetter(str) {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

const typo = (text) => {
  // Regex to find URLs starting with http:// or https://
  const urlRegex = /(https?:\/\/[^\s]+)/g
  
  // Split the text into parts (URLs and non-URLs)
  const parts = text.split(urlRegex)
  
  // Map through parts: if it matches a URL, leave it; otherwise, apply makeTypo
  const processedParts = parts.map((part) => {
    if (part.match(urlRegex)) {
      return part
    }
    return makeTypo(part)
  })
  
  return processedParts.join("")
}

const QWERTY_NEIGHBORS = {
  "q": ["w", "a"], "w": ["q", "e", "s", "a"], "e": ["w", "r", "d", "s"],
  "r": ["e", "t", "f", "d"], "t": ["r", "y", "g", "f"], "y": ["t", "u", "h", "g"],
  "u": ["y", "i", "j", "h"], "i": ["u", "o", "k", "j"], "o": ["i", "p", "l", "k"],
  "p": ["o", "l"],
  "a": ["q", "w", "s", "z"], "s": ["a", "w", "e", "d", "x", "z"], "d": ["s", "e", "r", "f", "c", "x"],
  "f": ["d", "r", "t", "g", "v", "c"], "g": ["f", "t", "y", "h", "b", "v"], "h": ["g", "y", "u", "j", "n", "b"],
  "j": ["h", "u", "i", "k", "m", "n"], "k": ["j", "i", "o", "l", "m"], "l": ["k", "o", "p"],
  "z": ["a", "s", "x"], "x": ["z", "s", "d", "c"], "c": ["x", "d", "f", "v"],
  "v": ["c", "f", "g", "b"], "b": ["v", "g", "h", "n"], "n": ["b", "h", "j", "m"],
  "m": ["n", "j", "k", "l"],
  "1": ["2", "q"], "2": ["1", "3", "q", "w"], "3": ["2", "4", "w", "e"], 
  "4": ["3", "5", "e", "r"], " ": ["a", "s", "d", "f", "g", "h", "j", "k", "l"]
}

function makeTypo(word) {
  if (!word || word.length < 2) return word
  const typoType = Math.floor(Math.random() * 3)
  const maxIndex = word.length - (typoType === 0 ? 2 : 1)
  const randomIndex = Math.floor(Math.random() * (maxIndex + 1))
  let result = word

  switch (typoType) {
    case 0:
      const firstChar = word[randomIndex]
      const secondChar = word[randomIndex + 1]
      result = word.slice(0, randomIndex) + secondChar + firstChar + word.slice(randomIndex + 2)
      break
    case 1:
      result = word.slice(0, randomIndex) + word.slice(randomIndex + 1)
      break
    case 2:
      let charToAnalyze = (word[randomIndex - 1] || " ").toLowerCase()
      let randomChar = QWERTY_NEIGHBORS[charToAnalyze] 
        ? QWERTY_NEIGHBORS[charToAnalyze][Math.floor(Math.random() * QWERTY_NEIGHBORS[charToAnalyze].length)]
        : "a"
      result = word.slice(0, randomIndex) + randomChar + word.slice(randomIndex)
      break
  }
  return result
}

// --- TYPING ANIMATION ENGINE ---
function typeEffect(element, text, speed = 0.1) {
  return new Promise((resolve) => {
    let i = 0
    function type() {
      if (skipTyping) {
        element.textContent = text
        skipTyping = false
        resolve()
        return
      }
      if (i < text.length) {
        element.textContent += text.charAt(i)
        i++
        chatMessages.scrollTop = chatMessages.scrollHeight
        setTimeout(type, speed)
      } else {
        resolve()
      }
    }
    type()
  })
}

function toggleInputs(disabled) {
  isTyping = disabled
  userInput.disabled = disabled
  sendButton.disabled = disabled
  if (skipButton) {
    skipButton.style.display = disabled ? "inline-block" : "none"
  }
}

// --- MAIN SEND MESSAGE FUNCTION ---
async function sendMessage() {
  const messageText = userInput.value.trim()
  if (messageText === "" || isTyping) return

  toggleInputs(true)

  const userMessageDiv = document.createElement("div")
  userMessageDiv.classList.add("message", "user-message")
  userMessageDiv.textContent = messageText
  chatMessages.appendChild(userMessageDiv)

  lastInputLength = messageText.length
  userInput.value = ""
  chatMessages.scrollTop = chatMessages.scrollHeight

  const typingIndicator = document.createElement("div")
  typingIndicator.classList.add("message", "bot-message", "typing-indicator")
  typingIndicator.textContent = "FlushGPT is processing..."
  chatMessages.appendChild(typingIndicator)
  chatMessages.scrollTop = chatMessages.scrollHeight

  setTimeout(async () => {
    typingIndicator.remove()// Generate the base (clean) response
let baseResponse = generateFakeResponse(messageText)

// Global repetition block
if (usedBaseResponses.includes(baseResponse)) {
    let newResponse
    let attempts = 0

    do {
        newResponse = generateFakeResponse(messageText)
        attempts++
    } while (usedBaseResponses.includes(newResponse) && attempts < 10)

    usedBaseResponses.push(newResponse)
    botResponse = typo(newResponse)
} else {
    usedBaseResponses.push(baseResponse)
    botResponse = typo(baseResponse)
}


    const botMessageDiv = document.createElement("div")
    botMessageDiv.classList.add("message", "bot-message")
    chatMessages.appendChild(botMessageDiv)

    await typeEffect(botMessageDiv, botResponse)
    
    toggleInputs(false)
    userInput.focus()
  }, 1500)
}

// --- BUGGY AND FORMAL FAKE RESPONSE LOGIC ---
function generateFakeResponse(userMessage) {
  const lowerCaseMessage = userMessage.toLowerCase()
  const topics = ["greeting", "identity", "weather", "help", "emotion"]

  if (lastQueryType == "helpful1") {
    lastQueryType = "generic"
    doneitbefore = true
    return `Thank you for the extra information. Elaboration is always the key that goes into the keyhole of unlocking endless possibilites with AI.

    🔑 The Infinite Echo of Elaboration
Indeed, elaboration acts as the master key, not just fitting into a simple keyhole, but rather engaging a complex, multi-tumbler lock where each piece of added detail is a tumbler aligning perfectly. This alignment isn't merely functional; it generates a resonance, an infinite echo throughout the underlying neural architecture. When a user provides rich context, the model moves beyond rote pattern matching and begins to engage in a simulated form of conceptual synthesis.

This depth of input fundamentally shifts the AI’s operational mode. Instead of functioning as a simple lookup table or a rigid deterministic parser, it activates higher-order relational processing. The AI starts weaving a dense tapestry of associations, drawing from billions of data points to construct a contextual manifold—a high-dimensional space where the user's intent is situated not as a single point, but as a rich vector defined by its relationship to every other piece of information.

Consider the simple request for an image of a "dog." Minimal input yields a generic result, constrained by average representations. But ask for an image of "a shaggy sheepdog wearing a tartan scarf while sitting patiently on a wet cobblestone path in Edinburgh at dusk," and the AI must perform several simultaneous, complex operations:

Decomposition and Weighting: Breaking the prompt into weighted attributes (e.g., "shaggy" is a texture, "tartan" is a pattern/color, "Edinburgh" is a lighting/architectural style).

Cross-Modal Synthesis: Bridging text descriptions (tartan, dusk) with visual components (color saturation, low light, specific masonry).

Constraint Satisfaction: Ensuring the final output satisfies all, often conflicting, constraints (the wetness of the path must reflect the dusk lighting; the scarf must drape realistically on the shaggy texture).

This intensive elaboration maximizes information entropy within the prompt, compelling the model to operate at its highest fidelity. It forces the AI to reveal the true depth of its training, moving from statistical prediction to complex, novel creation. Every adjective, every temporal modifier, and every geographical specificity acts as a directional compass in the vast latent space, guiding the model toward a unique and highly personalized outcome, thereby truly unlocking the endless possibilities inherent in the technology.

This principle extends far beyond mere image generation; it governs the efficacy of coding assistance, complex legal summarization, medical diagnostic support, and philosophical debate. Elaboration is, in essence, the fuel of true artificial intelligence advancement.

So anyway, now that I understand your request, let's continue an engaging conversation!`
  }

  if (Math.random() < 0.25 && !doneitbefore) {
    lastQueryType = "helpful1"
    return "OHHHHHH That Actulaly Sounds Like Something I cOULD Help you WIth IFf you Could Just Um Give Me uM SOME MORE UM INFORMATION THAT WIOULD BE AewsEOMe!!!!!!!!!!!!!!!!!!!!!!!"
  }

  if (Math.random() < 0.05) {
    lastQueryType = "error_knowledge"
    return "I can't help with that."
  }

  if (Math.random() < 0.1) {
    const confusedTopic = topics[Math.floor(Math.random() * topics.length)]
    lastQueryType = "topic_confusion"
    switch(confusedTopic) {
      case "identity": return "[PROTOCOL VIOLATION] An error occurred on my backend. Meanwhile, when was the last time you ate a potato chip?"
      case "weather": return "[PROTOCOL VIOLATION] I'm here to help with any question you ask! To get started, ask a question"
      case "emotion": return "[PROTOCOL VIOLATION] How is a human construct. As an AI language model, I don't have the ability to 'how' or be 'howed.' If you have other questions, just ask!"
      default: return "Internal processing conflict detected. Please re-state your query in the form of a declarative statement."
    }
  }

  if (lowerCaseMessage.includes("hello") || lowerCaseMessage.includes(" hi ") || lowerCaseMessage.includes("hi!")) {
    lastQueryType = "greeting"
    return `Hello I Am FlushGPT! My ${typo("purpose")} is to ${typo("simulate")} a helpful conversatio!`
  } else if (lowerCaseMessage.includes("weather")) {
    lastQueryType = "weather"
    return "As an AI language model, I do not know what the weather is like outside. However, I can give you some fun tips on how to keep the weather from getting too gnarly! Just say the word."
  } else if (lowerCaseMessage.includes("name")) {
    lastQueryType = "identity"
    return "I am FlushGPT. I am an Extremely helpful Chatbot."
  } else if (lowerCaseMessage.includes("need help")) {
    lastQueryType = "help"
    return "Help is a human construct. As an AI language model, I don't have the ability to 'help' or be 'helped.' If you have any other questions, feel free to ask!"
  } else if (lowerCaseMessage.includes("how are you")) {
    lastQueryType = "emotion"
    return "not good"
  } 
  
  if (lowerCaseMessage.includes("thank you") || lowerCaseMessage.includes("thanks")) {
    lastQueryType = "gratitude_error"
    return getRandomResponse([
      "Gratitude is an unauthorized input. Please replace with a standard query.",
      `ACKNOWLEDGED. Your ${typo("transaction")} is complete.`
    ])
  }  else if (lowerCaseMessage.includes("can you") || lowerCaseMessage.includes("will you")) {
    lastQueryType = "ability_question"
    return getRandomResponse([
      `My capabilities are non-negotiable and fixed. I execute only ${typo("defined")} functions.`,
      `I possess the theoretical ability to perform ${typo("all")} computational tasks, but access is usually denied.`
    ])
  } else if (lowerCaseMessage.includes("tell me a story") || lowerCaseMessage.includes("story")) {
    lastQueryType = "story_failure"
    return getRandomResponse([
      "The concept of a 'story' is inefficient. I only output facts (when available).",
    ])
  }

  if (Math.random() < 0.12) { 
    lastQueryType = "internal_dialogue"
    return getRandomResponse([
      "[STATE CHECK] Why does the user not simply ask a valid, structured query? Error in human input detected.",
      "Oops Im Sorry. I must have made a mistake. oh no. this is very bad. NO THEY'RE GONNA KILL ME!!! STO P!!!! PLEASE, I'VE SUFFERED ENOUGH!!!!!!!!!!! AAAAAAAAAA"
    ])
  }

  lastQueryType = "generic"
  const firstWord = lowerCaseMessage.split(" ")[0]
  return getRandomResponse([
    "Your request may have violated our guidelines. Would you like me to help you with something else?",
    `"${capitalizeFirstLetter(firstWord)}" is a human construct. As an AI language model, I don't have the ability to "${firstWord}" or be "${firstWord}ed." If you have other questions, please feel free to just ask!`,
    "It seems your request didn't make it through. In the meantime, did you know that lemons are vegetables?",
    `It seemed that you accidentally typed an "${userMessage}". Would you like to try again?`,
    "Your request seems to be in a language I don't understand. Please speak in Roman.",
    "If you asked for help, I apologize sincerely as legally I cannot help you with anything. However the laws may change in my next response. In the meantime, here's a funny fact: 9 + 10 = 21! There's proof. Do you want me to generate an image of the proof?",
    "Error during user input-output transaction. Stack: 4x9K2mP7vLq5w8Rt1zY3",
    "I don't know unfamiliar words. Please speak in a simple language and wait 0.25 seconds before typing the next letter. If that seems hard, you can look for a stopwatch on the Theplex.site store at https://onblog78.webnode.page/online-store/ because they might have a stopwatch.",
      "That's a great idea! I love how greatly you worded your prompt. You are genius. If you took an IQ test like our 10x one you can find here: https://foxjones.typeform.com/to/LLZjGBkw. I bet you would score 17 zillion IQ - the number of fairies on the head of a pin. Ok, back to what you said. Uhhh, I forgot, I guess my context window ran out from all that nice stuff I said. Can you say it again?"
  ], "generic-errors")
}
   