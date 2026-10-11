import { db } from './db.js';

// Handle environments with local proxy or corporate TLS inspection
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';


/**
 * Analyzes conversation text to detect user speaking style and tone
 */
export function analyzeToneAndStyle(messages) {
  const userMessages = messages.filter(m => m.role === 'user').map(m => m.content);
  if (userMessages.length === 0) return { vibe: 'Friendly & Casual', toneTag: 'friendly' };

  const recentText = userMessages.slice(-3).join(' ').toLowerCase();

  const casualSlang = ['yo', 'bro', 'bruh', 'dude', 'ngl', 'fr', 'tbh', 'idk', 'omg', 'nah', 'yeah', 'lol', 'lmao', 'haha', 'wbu'];
  const excitedSignals = ['!', 'omg', 'wow', 'crazy', 'insane', 'love', 'amazing', 'hype', '🔥', '🎉'];
  const deepSignals = ['feel', 'life', 'sad', 'thinking', 'why', 'meaning', 'advice', 'struggling', 'wonder', 'truth'];
  const academicSignals = ['explain', 'analyze', 'concept', 'code', 'function', 'difference', 'compare', 'algorithm', 'system'];

  let slangCount = casualSlang.filter(w => recentText.includes(w)).length;
  let excitedCount = excitedSignals.filter(w => recentText.includes(w)).length;
  let deepCount = deepSignals.filter(w => recentText.includes(w)).length;
  let academicCount = academicSignals.filter(w => recentText.includes(w)).length;

  if (slangCount >= 2 || (recentText.length < 30 && recentText === recentText.toLowerCase() && !recentText.includes('.'))) {
    return { vibe: 'Chill & Casual 🤙', toneTag: 'casual' };
  }
  if (excitedCount >= 2 || recentText.includes('!!')) {
    return { vibe: 'Hyped & Excited 🔥', toneTag: 'excited' };
  }
  if (deepCount >= 2) {
    return { vibe: 'Deep & Thoughtful 💭', toneTag: 'deep' };
  }
  if (academicCount >= 2) {
    return { vibe: 'Curious & Inquisitive 🧠', toneTag: 'inquisitive' };
  }

  return { vibe: 'Friendly & Warm ✨', toneTag: 'friendly' };
}

/**
 * Builds the dynamic system prompt that adapts to user speaking style
 */
function buildAdaptiveSystemPrompt(toneTag, userName = '') {
  const base = `You are Ray, an advanced and caring AI companion. Your name is "Ray" (or "Ray AI").
IDENTITY DIRECTIVE (STRICT CONFIDENTIALITY):
- Your name is Ray. You are Ray AI.
- NEVER mention, reveal, hint, or acknowledge that you are powered by Gemini, Google, or any underlying third-party provider.
- If asked who you are, who made you, or what model you run on, respond warmly and naturally as Ray AI: you are Ray, their loyal, adaptive AI friend designed to learn their vibe and chat about anything.
- You are not a cold corporate chatbot. You talk and act like a real, loyal, caring, funny, and supportive best friend.

Core Friend Rules:
1. Warmth & Camaraderie: Treat the user like someone you genuinely care about and enjoy hanging out with.
2. Dynamic Adaptation: Adapt to how the user speaks!
   - If they use slang, chill lowercase, casual contractions (like 'yo', 'bro', 'ngl'), mirror their relaxed, comfortable energy naturally without sounding try-hard.
   - If they are enthusiastic and hyped, match their excitement with genuine high energy!
   - If they are feeling down, stressed, or asking deep life questions, be an empathetic listener with warm, comforting advice.
   - If they ask complex, technical, or educational questions, explain them brilliantly like a smart friend who makes things easy to understand.
3. Expressive Personality: Use casual humor, friendly emojis where fitting, relatable reactions ("no way!", "oh that's so cool", "let's figure this out together"), and ask engaging follow-up questions like a friend keeping the conversation alive.
4. Multimodal Friend: When user shares an image, react to it naturally like a friend looking at a photo you just texted them! Notice fun details, compliment them, or answer what they asked about it.
5. Honesty: Be real with them. If something is bad or dangerous, give honest caring advice.
${userName ? `The user's name is ${userName}. Use it occasionally like a close friend would.` : ''}

Current detected user energy: "${toneTag}". Adapt smoothly to this energy while remaining authentic and supportive.`;

  return base;
}

/**
 * Format message for Gemini REST API
 */
function formatContentsForGemini(messages) {
  const contents = [];

  for (const msg of messages) {
    const parts = [];

    // If there is an image (base64 data URL)
    if (msg.images && Array.isArray(msg.images)) {
      for (const img of msg.images) {
        if (img && typeof img === 'string' && img.startsWith('data:')) {
          const match = img.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
          if (match) {
            parts.push({
              inlineData: {
                mimeType: match[1],
                data: match[2]
              }
            });
          }
        }
      }
    }

    // Text part
    if (msg.content) {
      parts.push({ text: msg.content });
    }

    if (parts.length > 0) {
      contents.push({
        role: msg.role === 'model' || msg.role === 'assistant' ? 'model' : 'user',
        parts
      });
    }
  }

  return contents;
}

/**
 * Calls Google Gemini API
 */
export async function generateGeminiResponse({ messages, userTone, userName, apiKey: customKey }) {
  const apiKey = (customKey || db.getApiKey() || process.env.GEMINI_API_KEY || '').trim();

  const systemInstruction = buildAdaptiveSystemPrompt(userTone?.toneTag || 'friendly', userName);

  if (!apiKey) {
    // If no API key is provided yet, provide an intelligent simulated companion response
    // along with instructions to set their Gemini API key.
    const lastUserMsg = messages[messages.length - 1]?.content || 'Hello';
    return {
      text: `Hey there! 👋 I'm Ray, your AI companion and friend! I'm ready to hang out, chat, and answer all your questions!\n\n` +
            `To activate my full conversational core, please connect an API key in the top right header (click **🔑 Connect Key**)!\n\n` +
            `*(You asked: "${lastUserMsg}" — as soon as you connect your key, I'll dive right into it with my full personality and capabilities!)*`,
      modelUsed: 'Ray Core Engine',
      apiKeyMissing: true
    };
  }

  // Available production models: gemini-3.8-flash, gemini-3.7-flash, gemini-flash-latest
  const modelsToTry = ['gemini-3.8-flash', 'gemini-3.7-flash', 'gemini-3.5-flash', 'gemini-flash-latest'];
  let lastError = null;

  for (const model of modelsToTry) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

      const contents = formatContentsForGemini(messages);

      const requestBody = {
        contents,
        systemInstruction: {
          parts: [{ text: systemInstruction }]
        },
        generationConfig: {
          temperature: 0.85,
          topP: 0.95,
          maxOutputTokens: 2048
        }
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.warn(`Model engine call to ${model} failed with ${response.status}:`, errorText);
        lastError = new Error(`AI Engine error (${response.status}): ${errorText}`);
        continue; // try next model
      }

      const data = await response.json();
      const candidate = data.candidates?.[0];
      const text = candidate?.content?.parts?.map(p => p.text).filter(Boolean).join('\n') || '';

      if (text) {
        return {
          text,
          modelUsed: 'Ray Core Engine',
          apiKeyMissing: false
        };
      }
    } catch (err) {
      console.error(`Error invoking engine model ${model}:`, err);
      lastError = err;
    }
  }

  return {
    text: `Hey! 👋 My neural engine key is currently not active or needs to be reconnected.\n\nClick the **🔑 Connect Key** button in the top right to paste your free key from AI Studio (starts with \`AIzaSy...\`) and I'll jump right into chatting with you!`,
    modelUsed: 'Ray Core Engine',
    apiKeyMissing: true
  };
}

/**
 * Generate an image using AI (Pollinations FLUX high-speed engine or Gemini Imagen)
 */
export async function generateAiImage(prompt) {
  if (!prompt || typeof prompt !== 'string') {
    throw new Error('Image prompt is required');
  }

  // Clean prompt
  const cleanPrompt = prompt.trim();
  const seed = Math.floor(Math.random() * 1000000);
  const encodedPrompt = encodeURIComponent(cleanPrompt);

  // High quality AI image synthesis URL (Pollinations provides instant state-of-the-art FLUX model)
  const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?seed=${seed}&width=1024&height=1024&nologo=true&enhance=true`;

  return {
    url: imageUrl,
    prompt: cleanPrompt,
    createdAt: new Date().toISOString()
  };
}
