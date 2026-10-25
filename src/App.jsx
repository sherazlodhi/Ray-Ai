import React, { useState, useEffect, useCallback, useRef } from 'react';
import Sidebar from './components/Sidebar.jsx';
import Navbar from './components/Navbar.jsx';
import ChatArea from './components/ChatArea.jsx';
import InputBar from './components/InputBar.jsx';
import AuthModal from './components/AuthModal.jsx';
import ImageGenModal from './components/ImageGenModal.jsx';
import VideoGenModal from './components/VideoGenModal.jsx';
import ProModal from './components/ProModal.jsx';
import LimitModal from './components/LimitModal.jsx';
import { renderCinematicVideoBlob } from './utils/videoRenderer.js';
import { X } from 'lucide-react';
import { useDevice } from './utils/useDevice.js';

function getOrSetGuestId() {
  let gid = localStorage.getItem('ray_guest_id') || localStorage.getItem('gemini_guest_id');
  if (!gid) {
    gid = 'guest_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8);
    localStorage.setItem('ray_guest_id', gid);
  }
  return gid;
}

export default function App() {
  const device = useDevice();
  const [guestId] = useState(getOrSetGuestId);
  const [token, setToken] = useState(() => localStorage.getItem('ray_auth_token') || localStorage.getItem('gemini_auth_token') || '');
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('ray_auth_user') || localStorage.getItem('gemini_auth_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [chats, setChats] = useState([]);
  const [currentChatId, setCurrentChatId] = useState(null);
  const [currentChat, setCurrentChat] = useState({ messages: [], detectedVibe: 'Friendly & Casual ✨' });
  const [isGenerating, setIsGenerating] = useState(false);
  const initialLoadDone = useRef(false);

  // Limits & Status
  const [userStats, setUserStats] = useState({
    questionsAsked: 0,
    imagesCreated: 0,
    imagesUploaded: 0,
    isPro: false,
    proDaysCount: 0,
    proDaysTarget: 30,
    proStreak: 0,
    videosCreated: 0
  });

  // Modals
  const [authModal, setAuthModal] = useState({ open: false, mode: 'signin' });
  const [imageGenModalOpen, setImageGenModalOpen] = useState(false);
  const [videoGenModalOpen, setVideoGenModalOpen] = useState(false);
  const [proModalOpen, setProModalOpen] = useState(false);
  const [limitModal, setLimitModal] = useState({ open: false, type: 'questions' });
  const [viewingImage, setViewingImage] = useState(null);

  // Build headers for requests
  const getHeaders = useCallback(() => {
    const headers = { 'Content-Type': 'application/json' };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    } else {
      headers['x-guest-id'] = guestId;
    }
    return headers;
  }, [token, guestId]);

  // Load user status and usage stats
  const fetchUserStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/user/status', { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        setUserStats(data);
      }
    } catch (err) {
      console.error('Error fetching user status:', err);
    }
  }, [getHeaders]);

  const loadChat = useCallback(async (id) => {
    try {
      setCurrentChatId(id);
      const res = await fetch(`/api/chats/${id}`, { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        setCurrentChat(data.chat);
      }
    } catch (err) {
      console.error('Error loading chat:', err);
    }
  }, [getHeaders]);

  // Load chats (only auto-select first chat on very first page mount)
  const fetchChats = useCallback(async (autoSelectFirst = false) => {
    try {
      const res = await fetch('/api/chats', { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        const chatList = data.chats || [];
        setChats(chatList);
        if (autoSelectFirst && chatList.length > 0) {
          loadChat(chatList[0].id);
        }
      }
    } catch (err) {
      console.error('Error fetching chats:', err);
    }
  }, [getHeaders, loadChat]);

  useEffect(() => {
    fetchUserStatus();
    if (!initialLoadDone.current) {
      initialLoadDone.current = true;
      fetchChats(true);
    } else {
      fetchChats(false);
    }
  }, [fetchUserStatus, fetchChats]);

  // New Chat
  const handleNewChat = () => {
    setCurrentChatId(null);
    setCurrentChat({ messages: [], detectedVibe: 'Friendly & Casual ✨' });
    if (sidebarOpen && window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  };

  // Delete Chat
  const handleDeleteChat = async (id) => {
    try {
      await fetch(`/api/chats/${id}`, { method: 'DELETE', headers: getHeaders() });
      setChats(prev => prev.filter(c => c.id !== id));
      if (currentChatId === id) {
        handleNewChat();
      }
    } catch (err) {
      console.error('Error deleting chat:', err);
    }
  };

  // Send message
  const handleSendMessage = async (text, images = []) => {
    // 1. Guest question limit check in client (4 questions per day)
    if (!user && (userStats?.questionsAsked >= 4)) {
      setLimitModal({ open: true, type: 'questions' });
      return;
    }

    // 2. Upload image check: guests cannot upload images; signed-in users max 5/day (unless Pro)
    if (images.length > 0) {
      if (!user) {
        setLimitModal({ open: true, type: 'guest_image_upload' });
        return;
      }
      if (!userStats?.isPro && (userStats?.imagesUploaded + images.length > 5)) {
        setLimitModal({ open: true, type: 'upload_image' });
        return;
      }
    }

    setIsGenerating(true);

    // Optimistically show user message
    const tempUserMsg = {
      id: 'temp_' + Date.now(),
      role: 'user',
      content: text,
      images,
      timestamp: new Date().toISOString()
    };
    setCurrentChat(prev => ({
      ...prev,
      messages: [...(prev.messages || []), tempUserMsg]
    }));

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          chatId: currentChatId,
          message: text,
          images,
          deviceType: device.deviceType
        })
      });

      const data = await res.json();

      if (!res.ok) {
        // Revert optimistic message if blocked
        setCurrentChat(prev => ({
          ...prev,
          messages: prev.messages.filter(m => m.id !== tempUserMsg.id)
        }));

        if (data.code === 'GUEST_IMAGE_UPLOAD_NOT_ALLOWED') {
          setLimitModal({ open: true, type: 'guest_image_upload' });
        } else if (data.code === 'GUEST_IMAGE_CREATION_NOT_ALLOWED') {
          setLimitModal({ open: true, type: 'guest_image_gen' });
        } else if (data.code === 'LIMIT_IMAGE_UPLOAD_REACHED') {
          setLimitModal({ open: true, type: 'upload_image' });
        } else if (data.code === 'PRO_REQUIRED') {
          setProModalOpen(true);
        } else if (data.code === 'LIMIT_4_REACHED' || res.status === 403) {
          setLimitModal({ open: true, type: 'questions' });
        }
        return;
      }

      // Update state with server response
      setCurrentChatId(data.chatId);
      setCurrentChat(prev => ({
        ...prev,
        id: data.chatId,
        detectedVibe: data.detectedVibe,
        messages: [
          ...prev.messages.filter(m => m.id !== tempUserMsg.id),
          data.userMessage,
          data.reply
        ]
      }));

      if (data.userStats) {
        setUserStats(data.userStats);
      }

      // Refresh chat list
      fetchChats();
    } catch (err) {
      console.error('Chat error:', err);
      // Append friendly error note
      setCurrentChat(prev => ({
        ...prev,
        messages: [
          ...prev.messages,
          {
            id: 'err_' + Date.now(),
            role: 'model',
            content: `⚠️ Oops! Something went wrong: ${err.message}. Please check your connection or Ray Engine key.`,
            timestamp: new Date().toISOString()
          }
        ]
      }));
    } finally {
      setIsGenerating(false);
    }
  };

  // Generate image
  const handleGenerateImage = async (prompt) => {
    if (!user) {
      setLimitModal({ open: true, type: 'guest_image_gen' });
      return;
    }

    // Pro members have unlimited image generation
    if (!userStats?.isPro && (userStats?.imagesCreated >= 5)) {
      setLimitModal({ open: true, type: 'create_image' });
      return;
    }

    setIsGenerating(true);
    try {
      const res = await fetch('/api/generate-image', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          prompt,
          chatId: currentChatId
        })
      });

      const data = await res.json();
      if (!res.ok) {
        if (data.code === 'GUEST_IMAGE_CREATION_NOT_ALLOWED') {
          setLimitModal({ open: true, type: 'guest_image_gen' });
          return;
        }
        if (data.code === 'LIMIT_IMAGE_CREATION_REACHED') {
          setLimitModal({ open: true, type: 'create_image' });
          return;
        }
        throw new Error(data.error || 'Failed to generate image');
      }

      if (data.userStats) {
        setUserStats(data.userStats);
      }

      // Append image message to chat
      const imgMsg = {
        id: 'img_' + Date.now(),
        role: 'model',
        content: `Here is the image I created for you based on "${prompt}"! 🎨`,
        generatedImage: data.image.url,
        timestamp: new Date().toISOString()
      };

      setCurrentChat(prev => ({
        ...prev,
        messages: [...(prev.messages || []), imgMsg]
      }));
    } catch (err) {
      console.error('Image gen error:', err);
      throw err;
    } finally {
      setIsGenerating(false);
    }
  };

  // Generate AI Video (Ray Pro Exclusive)
  const handleGenerateVideo = async (prompt, style = 'Cinematic 4K', motion = 'zoom') => {
    if (!user) {
      setLimitModal({ open: true, type: 'pro_required' });
      return;
    }

    if (!userStats?.isPro) {
      setProModalOpen(true);
      return;
    }

    setIsGenerating(true);
    try {
      const res = await fetch('/api/generate-video', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          prompt,
          style,
          motion,
          chatId: currentChatId
        })
      });

      const data = await res.json();
      if (!res.ok) {
        if (data.code === 'PRO_REQUIRED') {
          setProModalOpen(true);
          return;
        }
        throw new Error(data.error || 'Failed to generate video');
      }

      if (data.userStats) {
        setUserStats(data.userStats);
      }

      // Render native cinematic motion video blob
      const keyframeUrl = data.video?.url;
      const motionRes = await renderCinematicVideoBlob({
        imageUrl: keyframeUrl,
        prompt,
        motion,
        durationSeconds: data.video?.duration || 4.5
      });

      const finalVideoUrl = motionRes?.videoUrl || keyframeUrl;

      // Append video message to chat
      const vidMsg = {
        id: 'vid_' + Date.now(),
        role: 'model',
        content: `🎬 Here is the AI motion video I generated for you based on "${prompt}"! (${style}, motion: ${motion})`,
        generatedVideo: finalVideoUrl,
        videoMetadata: {
          prompt,
          style,
          motion,
          keyframe: keyframeUrl,
          duration: data.video?.duration || 4.5,
          timestamp: new Date().toISOString()
        },
        timestamp: new Date().toISOString()
      };

      setCurrentChat(prev => ({
        ...prev,
        messages: [...(prev.messages || []), vidMsg]
      }));

      // Refresh chats list if new chat
      if (data.chatId && data.chatId !== currentChatId) {
        setCurrentChatId(data.chatId);
        fetchChats();
      }
    } catch (err) {
      console.error('Video gen error:', err);
      throw err;
    } finally {
      setIsGenerating(false);
    }
  };

  // Auth Handlers
  const handleAuthSuccess = (data) => {
    setToken(data.token);
    setUser(data.user);
    localStorage.setItem('ray_auth_token', data.token);
    localStorage.setItem('ray_auth_user', JSON.stringify(data.user));
    initialLoadDone.current = false;
    fetchUserStatus();
    fetchChats(true);
  };

  const handleLogout = () => {
    setToken('');
    setUser(null);
    localStorage.removeItem('ray_auth_token');
    localStorage.removeItem('ray_auth_user');
    initialLoadDone.current = false;
    fetchUserStatus();
    handleNewChat();
    fetchChats(false);
  };

  return (
    <div className="flex h-full h-[100dvh] max-h-[100dvh] w-full bg-[#131314] text-[#e3e3e3] overflow-hidden overscroll-none">
      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
        chats={chats}
        currentChatId={currentChatId}
        onSelectChat={loadChat}
        onNewChat={handleNewChat}
        onDeleteChat={handleDeleteChat}
        userStats={userStats}
        user={user}
        device={device}
        onOpenAuth={(mode) => setAuthModal({ open: true, mode })}
        onLogout={handleLogout}
        onOpenImageGen={() => setImageGenModalOpen(true)}
        onOpenVideoGen={() => (userStats?.isPro ? setVideoGenModalOpen(true) : setProModalOpen(true))}
        onOpenProModal={() => setProModalOpen(true)}
        onLimitExceeded={(type) => setLimitModal({ open: true, type })}
      />

      {/* Main Chat Interface */}
      <div className="flex-1 flex flex-col min-w-0 h-full relative overflow-hidden">
        <Navbar
          onToggleSidebar={() => setSidebarOpen(prev => !prev)}
          detectedVibe={currentChat.detectedVibe}
          user={user}
          userStats={userStats}
          device={device}
          onOpenAuth={(mode) => setAuthModal({ open: true, mode })}
          onOpenProModal={() => setProModalOpen(true)}
          onNewChat={handleNewChat}
          onLogout={handleLogout}
        />

        <ChatArea
          messages={currentChat.messages || []}
          detectedVibe={currentChat.detectedVibe}
          isGenerating={isGenerating}
          device={device}
          onSelectSuggestion={(sug) => handleSendMessage(sug)}
          onOpenImageGen={() => setImageGenModalOpen(true)}
          onOpenVideoGen={() => (userStats?.isPro ? setVideoGenModalOpen(true) : setProModalOpen(true))}
          onOpenProModal={() => setProModalOpen(true)}
          userStats={userStats}
          user={user}
          onOpenAuth={(mode) => setAuthModal({ open: true, mode })}
          onViewImage={(url) => setViewingImage(url)}
          onLimitExceeded={(type) => setLimitModal({ open: true, type })}
        />

        <InputBar
          onSendMessage={handleSendMessage}
          onOpenImageGen={() => setImageGenModalOpen(true)}
          onOpenVideoGen={() => (userStats?.isPro ? setVideoGenModalOpen(true) : setProModalOpen(true))}
          onOpenProModal={() => setProModalOpen(true)}
          userStats={userStats}
          user={user}
          device={device}
          disabled={isGenerating}
          onLimitExceeded={(type) => setLimitModal({ open: true, type })}
        />
      </div>

      {/* Lightbox image preview modal */}
      {viewingImage && (
        <div 
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn"
          onClick={() => setViewingImage(null)}
        >
          <button
            onClick={() => setViewingImage(null)}
            className="absolute top-5 right-5 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src={viewingImage}
            alt="Expanded view"
            className="max-w-[95vw] max-h-[90vh] object-contain rounded-xl shadow-2xl border border-white/10"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModal.open}
        initialMode={authModal.mode}
        onClose={() => setAuthModal({ open: false, mode: 'signin' })}
        onAuthSuccess={handleAuthSuccess}
      />

      {/* Image Gen Modal */}
      <ImageGenModal
        isOpen={imageGenModalOpen}
        onClose={() => setImageGenModalOpen(false)}
        imagesCreated={userStats?.imagesCreated || 0}
        onGenerateImage={handleGenerateImage}
      />

      {/* AI Video Studio Modal */}
      <VideoGenModal
        isOpen={videoGenModalOpen}
        onClose={() => setVideoGenModalOpen(false)}
        isPro={!!userStats?.isPro}
        onOpenProModal={() => {
          setVideoGenModalOpen(false);
          setProModalOpen(true);
        }}
        onGenerateVideo={handleGenerateVideo}
      />

      {/* Ray Pro Subscription Modal */}
      <ProModal
        isOpen={proModalOpen}
        onClose={() => setProModalOpen(false)}
        userStats={userStats}
        user={user}
        onOpenAuth={(mode) => {
          setProModalOpen(false);
          setAuthModal({ open: true, mode });
        }}
        onToggleProSuccess={(updatedStats) => {
          if (updatedStats) {
            setUserStats(updatedStats);
          } else {
            fetchUserStatus();
          }
        }}
      />

      {/* Limit Modal */}
      <LimitModal
        isOpen={limitModal.open}
        limitType={limitModal.type}
        onClose={() => setLimitModal({ open: false, type: 'questions' })}
        onOpenAuth={(mode) => setAuthModal({ open: true, mode })}
        onOpenProModal={() => {
          setLimitModal({ open: false, type: 'questions' });
          setProModalOpen(true);
        }}
      />
    </div>
  );
}
