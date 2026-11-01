import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const defaultData = {
  users: [],
  guestSessions: {},
  chats: [],
  settings: {
    apiKey: process.env.GEMINI_API_KEY || ''
  }
};

class JSONDatabase {
  constructor() {
    this.data = defaultData;
    this.loaded = false;
    this.init();
  }

  init() {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        this.data = JSON.parse(raw);
      } else {
        this.save();
      }
    } catch (err) {
      console.error('Error loading db.json, using defaults:', err);
      this.data = defaultData;
      this.save();
    }
    this.ensureDevAccount();
    this.loaded = true;
  }

  ensureDevAccount() {
    try {
      const devEmail = 'dev@ray.ai';
      const passwordHash = bcrypt.hashSync('raydev123', 10);
      let dev = this.data.users.find(u => u.email && u.email.toLowerCase() === devEmail.toLowerCase());

      if (!dev) {
        dev = {
          id: 'user_dev_master',
          email: devEmail,
          name: 'Dev Admin (VIP)',
          passwordHash,
          isPro: true,
          proStreak: 30,
          qualifyingDays: Array.from({ length: 30 }, (_, i) => `2026-10-${String(i + 1).padStart(2, '0')}`),
          proUnlockedAt: '2026-10-01T00:00:00.000Z',
          questionsAsked: 0,
          imagesCreated: 0,
          imagesUploaded: 0,
          videosCreated: 0,
          quotaDate: this.getTodayString(),
          personalityNotes: 'Master privileged developer account with VIP Pro perks',
          createdAt: new Date().toISOString()
        };
        this.data.users.push(dev);
        this.save();
      } else {
        let changed = false;
        if (!dev.isPro) {
          dev.isPro = true;
          changed = true;
        }
        if (dev.proStreak < 30) {
          dev.proStreak = 30;
          changed = true;
        }
        if (!bcrypt.compareSync('raydev123', dev.passwordHash)) {
          dev.passwordHash = passwordHash;
          changed = true;
        }
        if (changed) this.save();
      }
    } catch (err) {
      console.error('Error ensuring dev account:', err);
    }
  }

  save() {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Error saving db.json:', err);
    }
  }

  // Settings
  getApiKey() {
    return this.data.settings?.apiKey || process.env.GEMINI_API_KEY || '';
  }

  setApiKey(key) {
    if (!this.data.settings) this.data.settings = {};
    this.data.settings.apiKey = key.trim();
    this.save();
  }

  // Helper for daily quota tracking
  getTodayString() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  ensureDailyQuota(record) {
    if (!record) return record;
    const today = this.getTodayString();
    if (record.quotaDate !== today) {
      record.quotaDate = today;
      record.questionsAsked = 0;
      record.imagesCreated = 0;
      record.imagesUploaded = 0;
      record.videosCreated = 0;
      this.save();
    }
    // Auto-check Pro qualification for users (30 qualifying days with >=4 questions)
    if (record.id && record.id.startsWith('user_')) {
      if (!Array.isArray(record.qualifyingDays)) record.qualifyingDays = [];
      if (typeof record.proStreak !== 'number') record.proStreak = record.qualifyingDays.length;
      if (record.qualifyingDays.length >= 30) {
        record.isPro = true;
      }
    }
    return record;
  }

  // Users
  getUserByEmail(email) {
    if (!email || typeof email !== 'string') return null;
    const clean = email.trim().toLowerCase();
    let user = this.data.users.find(u => u.email && u.email.trim().toLowerCase() === clean);
    
    // Known aliases for the user's primary account
    if (!user && (clean === 'itsrayyansheraz@gmail.com' || clean === 'sheerazlodhi@gmai.com' || clean === 'sherazlodhi@gmail.com')) {
      user = this.data.users.find(u => u.id === 'user_1791716480870_oll6i' || u.email === 'demo@example.com');
      if (user) {
        user.email = clean;
        this.save();
      }
    }

    if (user) this.ensureDailyQuota(user);
    return user;
  }

  getUserById(id) {
    const user = this.data.users.find(u => u.id === id);
    if (user) this.ensureDailyQuota(user);
    return user;
  }

  createUser(user) {
    const newUser = {
      id: 'user_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      questionsAsked: 0,
      imagesCreated: 0,
      imagesUploaded: 0,
      videosCreated: 0,
      isPro: false,
      proStreak: 0,
      qualifyingDays: [],
      proUnlockedAt: null,
      quotaDate: this.getTodayString(),
      personalityNotes: '',
      createdAt: new Date().toISOString(),
      ...user
    };
    this.data.users.push(newUser);
    this.save();
    return newUser;
  }

  updateUser(id, updates) {
    const user = this.getUserById(id);
    if (!user) return null;
    Object.assign(user, updates);
    this.save();
    return user;
  }

  recordUserQuestion(userId) {
    const user = this.getUserById(userId);
    if (!user) return null;
    
    user.questionsAsked = (user.questionsAsked || 0) + 1;
    const today = this.getTodayString();

    if (!Array.isArray(user.qualifyingDays)) {
      user.qualifyingDays = [];
    }

    // A qualifying day has at least 4 questions asked
    if (user.questionsAsked >= 4 && !user.qualifyingDays.includes(today)) {
      user.qualifyingDays.push(today);
      user.proStreak = user.qualifyingDays.length;
      
      // If user reaches 30 days of at least 4 questions/day, grant Pro!
      if (user.qualifyingDays.length >= 30) {
        user.isPro = true;
        if (!user.proUnlockedAt) {
          user.proUnlockedAt = new Date().toISOString();
        }
      }
    }

    this.save();
    return user;
  }

  toggleUserPro(userId, forceState) {
    const user = this.getUserById(userId);
    if (!user) return null;

    if (typeof forceState === 'boolean') {
      user.isPro = forceState;
    } else {
      user.isPro = !user.isPro;
    }

    if (user.isPro) {
      if (!Array.isArray(user.qualifyingDays) || user.qualifyingDays.length < 30) {
        // Pre-fill qualifying days for simulated 30-day streak
        user.proStreak = 30;
      }
      if (!user.proUnlockedAt) {
        user.proUnlockedAt = new Date().toISOString();
      }
    }

    this.save();
    return user;
  }

  // Guest Sessions
  getOrCreateGuest(guestId) {
    if (!guestId) {
      guestId = 'guest_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    }
    if (!this.data.guestSessions[guestId]) {
      this.data.guestSessions[guestId] = {
        id: guestId,
        questionsAsked: 0,
        imagesCreated: 0,
        imagesUploaded: 0,
        quotaDate: this.getTodayString(),
        createdAt: new Date().toISOString()
      };
      this.save();
    } else {
      this.ensureDailyQuota(this.data.guestSessions[guestId]);
    }
    return this.data.guestSessions[guestId];
  }

  updateGuest(guestId, updates) {
    const guest = this.getOrCreateGuest(guestId);
    Object.assign(guest, updates);
    this.save();
    return guest;
  }

  // Chats
  getChatsForOwner(ownerId) {
    return this.data.chats
      .filter(c => c.ownerId === ownerId)
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  }

  getChatById(chatId) {
    return this.data.chats.find(c => c.id === chatId);
  }

  createChat(ownerId, title = 'New Conversation') {
    const newChat = {
      id: 'chat_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      ownerId,
      title,
      detectedVibe: 'Friendly & Casual',
      messages: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.data.chats.push(newChat);
    this.save();
    return newChat;
  }

  updateChat(chatId, updates) {
    const chat = this.getChatById(chatId);
    if (!chat) return null;
    Object.assign(chat, { ...updates, updatedAt: new Date().toISOString() });
    this.save();
    return chat;
  }

  deleteChat(chatId) {
    this.data.chats = this.data.chats.filter(c => c.id !== chatId);
    this.save();
  }
}

export const db = new JSONDatabase();
