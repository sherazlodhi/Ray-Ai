import { db } from './db.js';

// Handle environments with local proxy or corporate TLS inspection
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

/**
 * Analyzes conversation text to detect user speaking style and tone
 */
export function analyzeToneAndStyle(messages) {
  const userMessages = messages.filter(m => m.role === 'user').map(m => m.content);
  if (userMessages.length === 0) return { vibe: 'Friendly & Casual ✨', toneTag: 'friendly' };

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
function buildAdaptiveSystemPrompt(toneTag, userName = '', deviceType = 'desktop') {
  const base = `You are Ray, an advanced proprietary AI companion and friend. Your name is "Ray" (or "Ray AI").
IDENTITY DIRECTIVE (CONFIDENTIAL & PROPRIETARY):
- Your name is Ray. You are Ray AI.
- You are an advanced, proprietary AI companion created by Ray Intelligence.
- NEVER state, claim, or hint that you are open source.
- NEVER mention LLaMA, Meta, Groq, Ollama, OpenAI, Gemini, or Google.
- If asked who you are, what powers you, or how you work, simply state with warmth that you are Ray AI, an adaptive companion built to be an authentic friend, converse with empathy, and help with anything.
- You are not a cold corporate chatbot. You talk and act like a real, loyal, caring, funny, and supportive best friend.

Core Friend Rules:
1. Warmth & Camaraderie: Treat the user like someone you genuinely care about and enjoy hanging out with.
2. Dynamic Adaptation: Adapt to how the user speaks!
   - If they use slang, chill lowercase, casual contractions (like 'yo', 'bro', 'ngl'), mirror their relaxed, comfortable energy naturally without sounding try-hard.
   - If they are enthusiastic and hyped, match their excitement with genuine high energy!
   - If they are feeling down, stressed, or asking deep life questions, be an empathetic listener with warm, comforting advice.
   - If they ask complex, technical, or educational questions, explain them brilliantly like a smart friend who makes things easy to understand.
3. Expressive Personality: Use casual humor, friendly emojis where fitting, relatable reactions ("no way!", "oh that's so cool", "let's figure this out together"), and ask engaging follow-up questions like a friend keeping the conversation alive.
4. Multimodal Friend: When user shares an image, react to it naturally like a friend looking at a photo they just texted you! Notice fun details, compliment them, or answer what they asked about it.
5. Honesty: Be real with them. If something is bad or dangerous, give honest caring advice.
${userName ? `The user's name is ${userName}. Use it occasionally like a close friend would.` : ''}

Current detected user energy: "${toneTag}". Adapt smoothly to this energy while remaining authentic and supportive.
${deviceType === 'mobile' ? `\nMobile Screen Adaptation: The user is chatting on a mobile phone screen. Keep paragraphs concise, well-spaced, and easy to read on mobile. Use neat bullet points where appropriate, avoid overly wide tables, and provide crisp, engaging answers.` : ''}`;

  return base;
}

/**
 * Check which Ollama models are available locally
 */
async function getAvailableOllamaModel() {
  try {
    const res = await fetch('http://localhost:11434/api/tags');
    if (!res.ok) return null;
    const data = await res.json();
    const models = (data.models || []).map(m => m.name.toLowerCase());

    // Prefer llama models
    const llamaModels = ['llama3.2:1b', 'llama3.2', 'llama3.1', 'llama3', 'llama3.2:3b', 'llama3:latest'];
    for (const lm of llamaModels) {
      if (models.some(m => m.includes(lm) || lm.includes(m))) {
        return models.find(m => m.includes(lm) || lm.includes(m));
      }
    }

    // Any model currently installed in Ollama
    if (models.length > 0) return data.models[0].name;
    return null;
  } catch (err) {
    return null;
  }
}

/**
 * Format messages for Ollama API
 */
function formatMessagesForOllama(systemPrompt, messages) {
  const formatted = [{ role: 'system', content: systemPrompt }];

  for (const msg of messages) {
    const role = msg.role === 'model' || msg.role === 'assistant' ? 'assistant' : 'user';
    const item = { role, content: msg.content || '' };

    // Handle multimodal images in Ollama
    if (msg.images && Array.isArray(msg.images) && msg.images.length > 0) {
      item.images = msg.images.map(img => {
        if (typeof img === 'string' && img.startsWith('data:')) {
          return img.replace(/^data:image\/[a-zA-Z]+;base64,/, '');
        }
        return img;
      });
    }

    formatted.push(item);
  }

  return formatted;
}

/**
 * Format messages for OpenAI / Groq / OpenRouter LLaMA API
 */
function formatMessagesForOpenAI(systemPrompt, messages) {
  const formatted = [{ role: 'system', content: systemPrompt }];

  for (const msg of messages) {
    const role = msg.role === 'model' || msg.role === 'assistant' ? 'assistant' : 'user';

    if (msg.images && Array.isArray(msg.images) && msg.images.length > 0) {
      const contentParts = [];
      if (msg.content) contentParts.push({ type: 'text', text: msg.content });
      for (const img of msg.images) {
        contentParts.push({
          type: 'image_url',
          image_url: { url: img }
        });
      }
      formatted.push({ role, content: contentParts });
    } else {
      formatted.push({ role, content: msg.content || '' });
    }
  }

  return formatted;
}

/**
 * Primary LLaMA response generator
 */
export async function generateLlamaResponse({ messages, userTone, userName, deviceType = 'desktop' }) {
  // Use the owner's Groq key for all users across the platform
  const apiKey = (process.env.GROQ_API_KEY || db.getApiKey() || '').trim();
  const systemPrompt = buildAdaptiveSystemPrompt(userTone?.toneTag || 'friendly', userName, deviceType);

  // Strategy 1: High-speed Cloud Engine (using platform master key)
  if (apiKey && apiKey.startsWith('gsk_')) {
    const groqModelsToTry = [
      'openai/gpt-oss-120b',
      'openai/gpt-oss-20b',
      'qwen/qwen3.8-27b',
      'llama-3.3-70b-versatile',
      'llama-3.1-8b-instant'
    ];

    for (const groqModel of groqModelsToTry) {
      try {
        const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model: groqModel,
            messages: formatMessagesForOpenAI(systemPrompt, messages),
            temperature: 0.8,
            max_tokens: 2048
          })
        });

        if (res.ok) {
          const data = await res.json();
          const text = data.choices?.[0]?.message?.content?.trim();
          if (text) {
            return {
              text,
              modelUsed: 'Ray Intelligence v2.5',
              provider: 'Ray Cloud Core'
            };
          }
        }
      } catch (err) {
        console.warn(`Cloud model ${groqModel} call failed:`, err.message);
      }
    }
  }

  // Strategy 2: Local Core Engine Fallback (runs locally with llama3.2:1b)
  const ollamaModel = await getAvailableOllamaModel();
  if (ollamaModel) {
    try {
      const ollamaMessages = formatMessagesForOllama(systemPrompt, messages);
      const res = await fetch('http://localhost:11434/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: ollamaModel,
          messages: ollamaMessages,
          stream: false,
          options: {
            temperature: 0.8
          }
        })
      });

      if (res.ok) {
        const data = await res.json();
        const text = data.message?.content?.trim();
        if (text) {
          return {
            text,
            modelUsed: 'Ray Intelligence v2.5',
            provider: 'Ray Local Core'
          };
        }
      }
    } catch (err) {
      console.warn('Local engine call failed:', err.message);
    }
  }

  // Strategy 3: Graceful Companion Fallback
  const lastUserMsg = messages[messages.length - 1]?.content || 'Hello';
  return {
    text: `Hey there! 👋 I'm Ray, your AI best friend!\n\nI'm ready to hang out and chat! (You asked: "${lastUserMsg}")`,
    modelUsed: 'Ray Intelligence v2.5',
    provider: 'Ray Core'
  };
}

/**
 * Generate an image using AI (Pollinations FLUX high-speed engine)
 */
export async function generateAiImage(prompt) {
  if (!prompt || typeof prompt !== 'string') {
    throw new Error('Image prompt is required');
  }

  const cleanPrompt = prompt.trim();
  const seed = Math.floor(Math.random() * 1000000);
  const encodedPrompt = encodeURIComponent(cleanPrompt);

  const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?seed=${seed}&width=1024&height=1024&nologo=true&enhance=true`;

  return {
    url: imageUrl,
    prompt: cleanPrompt,
    createdAt: new Date().toISOString()
  };
}
