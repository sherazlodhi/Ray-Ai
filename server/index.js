import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from './db.js';
import { generateLlamaResponse, analyzeToneAndStyle, generateAiImage } from './llama.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'gemini-friend-secret-token';

// Middleware
app.use(cors());
app.use(express.json({ limit: '25mb' })); // Allow image base64 uploads

// Helper: extract authenticated user or null
function getAuthUser(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return db.getUserById(decoded.id) || null;
  } catch (err) {
    return null;
  }
}

// Helper: get owner identity (either authenticated user or guest)
function getOwnerIdentity(req) {
  const user = getAuthUser(req);
  if (user) {
    return {
      isAuth: true,
      user,
      id: user.id,
      name: user.name,
      quotaDate: user.quotaDate,
      questionsAsked: user.questionsAsked || 0,
      imagesCreated: user.imagesCreated || 0,
      imagesUploaded: user.imagesUploaded || 0
    };
  }

  const guestId = req.headers['x-guest-id'] || req.body?.guestId || 'guest_default';
  const guest = db.getOrCreateGuest(guestId);
  return {
    isAuth: false,
    guest,
    id: guest.id,
    name: 'Guest',
    quotaDate: guest.quotaDate,
    questionsAsked: guest.questionsAsked || 0,
    imagesCreated: guest.imagesCreated || 0,
    imagesUploaded: guest.imagesUploaded || 0
  };
}

// -------------------------------------------------------------
// Authentication Endpoints
// -------------------------------------------------------------

app.post('/api/auth/register', (req, res) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, password, and name are required.' });
    }

    const existing = db.getUserByEmail(email);
    if (existing) {
      return res.status(400).json({ error: 'An account with this email already exists.' });
    }

    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(password, salt);

    const user = db.createUser({
      email,
      name,
      passwordHash
    });

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '30d' });

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        questionsAsked: user.questionsAsked,
        imagesCreated: user.imagesCreated,
        imagesUploaded: user.imagesUploaded
      }
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Failed to create account.' });
  }
});

app.post('/api/auth/login', (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const user = db.getUserByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const valid = bcrypt.compareSync(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '30d' });

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        questionsAsked: user.questionsAsked,
        imagesCreated: user.imagesCreated,
        imagesUploaded: user.imagesUploaded
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Failed to login.' });
  }
});

app.get('/api/auth/me', (req, res) => {
  const user = getAuthUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  res.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      questionsAsked: user.questionsAsked || 0,
      imagesCreated: user.imagesCreated || 0,
      imagesUploaded: user.imagesUploaded || 0
    }
  });
});

// -------------------------------------------------------------
// Usage Status Endpoint
// -------------------------------------------------------------

app.get('/api/user/status', (req, res) => {
  const identity = getOwnerIdentity(req);
  res.json({
    isAuthenticated: identity.isAuth,
    userName: identity.name,
    quotaDate: identity.quotaDate,
    questionsAsked: identity.questionsAsked,
    questionLimit: identity.isAuth ? null : 4,
    questionsRemaining: identity.isAuth ? 'unlimited' : Math.max(0, 4 - identity.questionsAsked),
    canCreateImages: identity.isAuth,
    imageCreationLimit: identity.isAuth ? 5 : 0,
    imagesCreated: identity.imagesCreated,
    imagesCreatedRemaining: identity.isAuth ? Math.max(0, 5 - identity.imagesCreated) : 0,
    canUploadImages: identity.isAuth,
    imageUploadLimit: identity.isAuth ? 5 : 0,
    imagesUploaded: identity.imagesUploaded,
    imagesUploadedRemaining: identity.isAuth ? Math.max(0, 5 - identity.imagesUploaded) : 0,
    resetsDaily: true
  });
});

// -------------------------------------------------------------
// Chat & Gemini Connection
// -------------------------------------------------------------

app.get('/api/chats', (req, res) => {
  const identity = getOwnerIdentity(req);
  const chats = db.getChatsForOwner(identity.id);
  res.json({ chats });
});

app.post('/api/chats', (req, res) => {
  const identity = getOwnerIdentity(req);
  const title = req.body?.title || 'New Chat';
  const chat = db.createChat(identity.id, title);
  res.json({ chat });
});

app.get('/api/chats/:id', (req, res) => {
  const chat = db.getChatById(req.params.id);
  if (!chat) return res.status(404).json({ error: 'Chat not found' });
  res.json({ chat });
});

app.delete('/api/chats/:id', (req, res) => {
  const identity = getOwnerIdentity(req);
  const chat = db.getChatById(req.params.id);
  if (!chat) return res.status(404).json({ error: 'Chat not found' });
  if (chat.ownerId !== identity.id) {
    return res.status(403).json({ error: 'Unauthorized to delete this chat' });
  }
  db.deleteChat(req.params.id);
  res.json({ success: true });
});

app.post('/api/chat', async (req, res) => {
  try {
    const identity = getOwnerIdentity(req);
    const { chatId, message, images } = req.body;

    if (!message && (!images || images.length === 0)) {
      return res.status(400).json({ error: 'Message text or image is required.' });
    }

    // 1. CHECK GUEST QUESTION LIMIT (MAX 4 QUESTIONS PER DAY WITHOUT SIGNING IN)
    if (!identity.isAuth) {
      if (identity.questionsAsked >= 4) {
        return res.status(403).json({
          error: 'QUESTION_LIMIT_REACHED',
          code: 'LIMIT_4_REACHED',
          message: 'You have used your 4 free questions for today! The limit resets daily, or you can sign in to ask unlimited questions right now.'
        });
      }
    }

    // 2. CHECK IMAGE UPLOAD RULES (GUESTS CANNOT UPLOAD; SIGNED-IN USERS MAX 5 PER DAY)
    const newUploadCount = Array.isArray(images) ? images.length : 0;
    if (newUploadCount > 0) {
      if (!identity.isAuth) {
        return res.status(403).json({
          error: 'GUEST_IMAGE_UPLOAD_NOT_ALLOWED',
          code: 'GUEST_IMAGE_UPLOAD_NOT_ALLOWED',
          message: 'Guests cannot upload images. Please sign in or create an account to upload photos to Ray!'
        });
      }

      if (identity.imagesUploaded + newUploadCount > 5) {
        return res.status(403).json({
          error: 'IMAGE_UPLOAD_LIMIT_REACHED',
          code: 'LIMIT_IMAGE_UPLOAD_REACHED',
          message: `You have reached your daily limit of 5 image uploads. You have already uploaded ${identity.imagesUploaded} image(s) today. Resets tomorrow!`
        });
      }
    }

    // Get or create chat
    let chat = chatId ? db.getChatById(chatId) : null;
    if (!chat) {
      const title = message ? (message.length > 30 ? message.substring(0, 30) + '...' : message) : 'Image inquiry';
      chat = db.createChat(identity.id, title);
    }

    // Append user message
    const userMsg = {
      id: 'msg_' + Date.now() + '_user',
      role: 'user',
      content: message || '',
      images: images || [],
      timestamp: new Date().toISOString()
    };
    chat.messages.push(userMsg);

    // Analyze conversation tone and style to adapt personality
    const userTone = analyzeToneAndStyle(chat.messages);
    chat.detectedVibe = userTone.vibe;

    // Device detection (User-Agent header + optional client payload)
    const ua = req.headers['user-agent'] || '';
    const isMobileUA = /Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
    const isTabletUA = /iPad|Tablet|PlayBook|Silk/i.test(ua);
    const clientDevice = req.body?.deviceType;
    let deviceType = clientDevice;
    if (!deviceType) {
      if (isMobileUA) deviceType = 'mobile';
      else if (isTabletUA) deviceType = 'tablet';
      else deviceType = 'desktop';
    }

    // Call LLaMA Engine (Local Ollama or Cloud)
    const llamaResult = await generateLlamaResponse({
      messages: chat.messages,
      userTone,
      userName: identity.isAuth ? identity.name : '',
      deviceType
    });

    // Append AI response
    const aiMsg = {
      id: 'msg_' + Date.now() + '_ai',
      role: 'model',
      content: llamaResult.text,
      modelUsed: llamaResult.modelUsed,
      provider: llamaResult.provider,
      timestamp: new Date().toISOString(),
      vibe: userTone.vibe
    };
    chat.messages.push(aiMsg);

    // Increment question count
    if (identity.isAuth) {
      db.updateUser(identity.user.id, {
        questionsAsked: (identity.user.questionsAsked || 0) + 1,
        imagesUploaded: (identity.user.imagesUploaded || 0) + newUploadCount
      });
    } else {
      db.updateGuest(identity.guest.id, {
        questionsAsked: (identity.guest.questionsAsked || 0) + 1,
        imagesUploaded: (identity.guest.imagesUploaded || 0) + newUploadCount
      });
    }

    // Update chat title if it's the first message
    if (chat.messages.length === 2 && message) {
      chat.title = message.length > 35 ? message.substring(0, 35) + '...' : message;
    }

    db.updateChat(chat.id, { messages: chat.messages, detectedVibe: userTone.vibe, title: chat.title });

    // Refresh status
    const updatedIdentity = getOwnerIdentity(req);

    res.json({
      chatId: chat.id,
      userMessage: userMsg,
      reply: aiMsg,
      detectedVibe: userTone.vibe,
      apiKeyMissing: !llamaResult.text,
      userStats: {
        isAuthenticated: updatedIdentity.isAuth,
        quotaDate: updatedIdentity.quotaDate,
        questionsAsked: updatedIdentity.questionsAsked,
        questionsRemaining: updatedIdentity.isAuth ? 'unlimited' : Math.max(0, 4 - updatedIdentity.questionsAsked),
        canCreateImages: updatedIdentity.isAuth,
        imagesCreated: updatedIdentity.imagesCreated,
        imagesCreatedRemaining: updatedIdentity.isAuth ? Math.max(0, 5 - updatedIdentity.imagesCreated) : 0,
        canUploadImages: updatedIdentity.isAuth,
        imagesUploaded: updatedIdentity.imagesUploaded,
        imagesUploadedRemaining: updatedIdentity.isAuth ? Math.max(0, 5 - updatedIdentity.imagesUploaded) : 0,
        resetsDaily: true
      }
    });
  } catch (err) {
    console.error('Chat error:', err);
    res.status(500).json({ error: err.message || 'Failed to process chat message.' });
  }
});

// -------------------------------------------------------------
// Image Creation Endpoint (Max 5 images allowed per day)
// -------------------------------------------------------------

app.post('/api/generate-image', async (req, res) => {
  try {
    const identity = getOwnerIdentity(req);
    const { prompt, chatId } = req.body;

    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'Prompt is required for image creation.' });
    }

    // 1. GUESTS CANNOT CREATE IMAGES
    if (!identity.isAuth) {
      return res.status(403).json({
        error: 'GUEST_IMAGE_CREATION_NOT_ALLOWED',
        code: 'GUEST_IMAGE_CREATION_NOT_ALLOWED',
        message: 'Guests cannot create images. Please sign in or create an account to generate AI images!'
      });
    }

    // 2. CHECK IMAGE CREATION LIMIT (MAX 5 CREATED IMAGES PER DAY)
    if (identity.imagesCreated >= 5) {
      return res.status(403).json({
        error: 'IMAGE_CREATION_LIMIT_REACHED',
        code: 'LIMIT_IMAGE_CREATION_REACHED',
        message: 'You have created 5 images today (daily limit reached). This limit resets every day!'
      });
    }

    // Generate image
    const imageResult = await generateAiImage(prompt);

    // Increment count
    db.updateUser(identity.user.id, {
      imagesCreated: (identity.user.imagesCreated || 0) + 1
    });

    // If a chatId was provided, append this generated image to chat history as AI creation
    if (chatId) {
      const chat = db.getChatById(chatId);
      if (chat) {
        const imgMsg = {
          id: 'msg_' + Date.now() + '_image',
          role: 'model',
          content: `Here is the image I created for you based on: "${prompt}"! 🎨`,
          generatedImage: imageResult.url,
          timestamp: new Date().toISOString()
        };
        chat.messages.push(imgMsg);
        db.updateChat(chatId, { messages: chat.messages });
      }
    }

    const updatedIdentity = getOwnerIdentity(req);

    res.json({
      image: imageResult,
      userStats: {
        isAuthenticated: updatedIdentity.isAuth,
        quotaDate: updatedIdentity.quotaDate,
        imagesCreated: updatedIdentity.imagesCreated,
        imagesCreatedRemaining: Math.max(0, 5 - updatedIdentity.imagesCreated),
        imagesUploaded: updatedIdentity.imagesUploaded,
        imagesUploadedRemaining: Math.max(0, 5 - updatedIdentity.imagesUploaded),
        questionsAsked: updatedIdentity.questionsAsked,
        questionsRemaining: updatedIdentity.isAuth ? 'unlimited' : Math.max(0, 4 - updatedIdentity.questionsAsked),
        resetsDaily: true
      }
    });
  } catch (err) {
    console.error('Image generation error:', err);
    res.status(500).json({ error: err.message || 'Failed to generate image.' });
  }
});

// -------------------------------------------------------------
// Settings / API Key Management
// -------------------------------------------------------------

app.get('/api/settings', (req, res) => {
  res.json({
    status: 'online',
    model: 'Ray Intelligence v2.5'
  });
});

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.join(__dirname, '../dist');

// Serve static frontend assets
app.use(express.static(distPath));

// Fallback to index.html for SPA routing
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  res.sendFile(path.join(distPath, 'index.html'));
});

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 Ray AI Server running on http://localhost:${PORT}`);
});

