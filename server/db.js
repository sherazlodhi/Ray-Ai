import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

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
    this.loaded = true;
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
      this.save();
    }
    return record;
  }

  // Users
  getUserByEmail(email) {
    const user = this.data.users.find(u => u.email.toLowerCase() === email.toLowerCase());
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
