import React, { useState, useEffect, useRef } from "react";
import { Send, Search, Phone, Video, MoreVertical, Image as ImageIcon, Smile, Paperclip, Check, CheckCheck, Mic, FileText, MapPin, Play, Square, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { io } from "socket.io-client";
import ReportModal from "../components/ReportModal";
import { useAuth } from "../AuthContext";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

function Messages() {
  const { user, token } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [activeChat, setActiveChat] = useState(null); // The other user object
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState("");
  
  // Search State
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  // Socket State
  const [socket, setSocket] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [activeChatOnline, setActiveChatOnline] = useState(false);
  const [activeChatLastSeen, setActiveChatLastSeen] = useState(null);

  // Media State
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [audioChunks, setAudioChunks] = useState([]);
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  // Block & Report State
  const [showMenu, setShowMenu] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);

  const messagesEndRef = useRef(null);

  // Initial load
  useEffect(() => {
    if (token) {
      fetchConversations();
    }
  }, [token]);

  // Socket connection
  useEffect(() => {
    if (!token || !user) return;
    const newSocket = io(API_URL);
    setSocket(newSocket);

    newSocket.on("connect", () => {
      newSocket.emit("join", user.id || user._id);
    });

    newSocket.on("new_message", (msg) => {
      // Play sound alert for new message
      try {
        const audio = new Audio("https://cdn.pixabay.com/download/audio/2021/08/04/audio_0625c1539c.mp3?filename=message-incoming-132042.mp3");
        audio.play().catch(e => console.log("Audio play prevented", e));
      } catch (e) {}

      // If we are currently chatting with the sender, add to messages and mark read
      setActiveChat((currentChat) => {
        if (currentChat && (currentChat._id === msg.sender || currentChat._id === msg.sender._id)) {
          setMessages((prev) => [...prev, msg]);
          fetch(`/api/messages/${currentChat._id}/read`, {
            method: "PUT",
            headers: { Authorization: `Bearer ${token}` }
          }).then(() => {
            newSocket.emit("message_status_update", { messageId: msg._id, status: "seen", senderId: msg.sender._id || msg.sender, receiverId: user.id || user._id });
          });
          return currentChat;
        } else {
          // If not looking at the chat, mark as delivered if not seen
          newSocket.emit("message_status_update", { messageId: msg._id, status: "delivered", senderId: msg.sender._id || msg.sender, receiverId: user.id || user._id });
        }
        return currentChat;
      });
      fetchConversations();
    });
    
    newSocket.on("message_status_update", ({ messageId, status }) => {
      setMessages((prev) => prev.map(m => m._id === messageId ? { ...m, status } : m));
    });

    newSocket.on("typing", (senderId) => {
      setActiveChat((currentChat) => {
        if (currentChat && currentChat._id === senderId) setIsTyping(true);
        return currentChat;
      });
    });

    newSocket.on("stop_typing", (senderId) => {
      setActiveChat((currentChat) => {
        if (currentChat && currentChat._id === senderId) setIsTyping(false);
        return currentChat;
      });
    });

    newSocket.on("user_online", (userId) => {
      setActiveChat((currentChat) => {
        if (currentChat && currentChat._id === userId) {
          setActiveChatOnline(true);
        }
        return currentChat;
      });
    });

    newSocket.on("user_offline", ({ userId, lastSeen }) => {
      setActiveChat((currentChat) => {
        if (currentChat && currentChat._id === userId) {
          setActiveChatOnline(false);
          setActiveChatLastSeen(lastSeen);
        }
        return currentChat;
      });
    });

    return () => newSocket.disconnect();
  }, [token, user]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchConversations = async () => {
    try {
      const res = await fetch("/api/messages", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setConversations(data);
      }
    } catch (err) {
      console.error("Error fetching conversations:", err);
    }
  };

  const fetchChatHistory = async (otherUserId, isInitialLoad = true) => {
    try {
      const res = await fetch(`/api/messages/${otherUserId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
        
        // Mark as read
        const unreadMsgFromOther = data.some(m => m.sender === otherUserId && m.status !== 'seen');
        if (unreadMsgFromOther) {
          await fetch(`/api/messages/${otherUserId}/read`, {
            method: "PUT",
            headers: { Authorization: `Bearer ${token}` }
          });
          // Update local state and conversation list
          if (isInitialLoad) fetchConversations();
          
          if (socket) {
            data.forEach(m => {
              if (m.sender === otherUserId && m.status !== 'seen') {
                socket.emit("message_status_update", { messageId: m._id, status: "seen", senderId: otherUserId, receiverId: user.id || user._id });
              }
            });
          }
        }
      }
    } catch (err) {
      console.error("Error fetching chat history:", err);
    }
  };

  const handleSearch = async (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    if (!query.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }
    
    setIsSearching(true);
    try {
      const res = await fetch(`/api/users/search?q=${query}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data);
      }
    } catch (err) {
      console.error("Search error:", err);
    }
  };

  const handleSelectUser = (selectedUser) => {
    // Check if conversation already exists
    const existingConv = conversations.find(c => c.user._id === selectedUser._id);
    if (!existingConv) {
      // Add fake conversation to top of list until a message is sent
      setConversations([{ user: selectedUser, lastMessage: null, unreadCount: 0 }, ...conversations]);
    }
    
    setActiveChat(selectedUser);
    setSearchQuery("");
    setSearchResults([]);
    setIsSearching(false);
    fetchChatHistory(selectedUser._id);
  };

  const handleSendMessage = async (customContent = null, messageType = "text", mediaUrl = null, mediaName = null, location = null) => {
    const contentToSend = customContent !== null ? customContent : messageInput.trim();
    if (!contentToSend && !mediaUrl && !location) return;
    if (!activeChat) return;
    
    if (customContent === null) setMessageInput(""); 

    const optimisticMsg = {
      _id: Date.now().toString(),
      sender: user.id || user._id,
      receiver: activeChat._id,
      content: contentToSend,
      messageType,
      mediaUrl,
      mediaName,
      location,
      status: "sent",
      createdAt: new Date().toISOString()
    };
    setMessages(prev => [...prev, optimisticMsg]);

    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({
          receiverId: activeChat._id,
          content: contentToSend,
          messageType,
          mediaUrl,
          mediaName,
          location
        })
      });
      
      if (res.ok) {
        const savedMsg = await res.json();
        setMessages(prev => prev.map(m => m._id === optimisticMsg._id ? savedMsg : m));
        fetchConversations();
        if (socket) socket.emit("stop_typing", { senderId: user.id || user._id, receiverId: activeChat._id });
      }
    } catch (err) {
      console.error("Send message error:", err);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !activeChat) return;
    
    setUploading(true);
    const formData = new FormData();
    formData.append("media", file);

    try {
      const res = await fetch("/api/messages/upload", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });
      if (res.ok) {
        const data = await res.json();
        const type = data.mimeType.startsWith("image/") ? "image" : "document";
        handleSendMessage(file.name, type, data.mediaUrl, file.name);
      }
    } catch (err) {
      console.error("Upload error:", err);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const toggleVoiceRecord = async () => {
    if (isRecording && mediaRecorder) {
      mediaRecorder.stop();
      setIsRecording(false);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks = [];
      
      recorder.ondataavailable = e => chunks.push(e.data);
      recorder.onstop = async () => {
        const audioBlob = new Blob(chunks, { type: 'audio/webm' });
        const formData = new FormData();
        formData.append("media", audioBlob, `voice-${Date.now()}.webm`);
        
        setUploading(true);
        try {
          const res = await fetch("/api/messages/upload", {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
            body: formData
          });
          if (res.ok) {
            const data = await res.json();
            handleSendMessage("Voice Note", "audio", data.mediaUrl);
          }
        } catch (err) {
          console.error("Voice upload error", err);
        } finally {
          setUploading(false);
        }
      };

      setMediaRecorder(recorder);
      setAudioChunks([]);
      recorder.start();
      setIsRecording(true);
    } catch (err) {
      alert("Microphone access denied or unavailable.");
    }
  };

  const shareLocation = () => {
    if (!navigator.geolocation) return alert("Geolocation not supported");
    navigator.geolocation.getCurrentPosition((pos) => {
      const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      handleSendMessage("Shared a location", "location", null, null, loc);
    });
  };

  const handleTyping = (e) => {
    setMessageInput(e.target.value);
    if (!socket || !activeChat) return;
    
    if (e.target.value.trim() !== "") {
      socket.emit("typing", { senderId: user.id || user._id, receiverId: activeChat._id });
    } else {
      socket.emit("stop_typing", { senderId: user.id || user._id, receiverId: activeChat._id });
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      // Refresh logic or status updates
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleBlockUser = async () => {
    if (!activeChat) return;
    try {
      await fetch(`/api/users/${activeChat._id}/block`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` }
      });
      setShowMenu(false);
      alert("User blocked successfully.");
      // Optional: Refresh conversations or remove the chat from the list
    } catch (e) {
      console.error(e);
    }
  };

  const formatTime = (isoString) => {
    const date = new Date(isoString);
    const today = new Date();
    if (date.toDateString() === today.toDateString()) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const renderMessageContent = (msg, isMe) => {
    if (msg.messageType === 'image') {
      return (
        <div>
          <img src={`${API_URL}${msg.mediaUrl}`} alt="Attachment" style={{ maxWidth: '100%', borderRadius: '8px', marginBottom: '5px' }} />
        </div>
      );
    }
    if (msg.messageType === 'audio') {
      return (
        <audio controls style={{ height: '40px', maxWidth: '200px' }}>
          <source src={`${API_URL}${msg.mediaUrl}`} type="audio/webm" />
        </audio>
      );
    }
    if (msg.messageType === 'document') {
      return (
        <a href={`${API_URL}${msg.mediaUrl}`} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'inherit', textDecoration: 'none', background: 'rgba(0,0,0,0.1)', padding: '10px', borderRadius: '8px' }}>
          <FileText size={24} />
          <span>{msg.mediaName || 'Document'}</span>
        </a>
      );
    }
    if (msg.messageType === 'location' && msg.location) {
      return (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '5px' }}>
            <MapPin size={16} /> Location Shared
          </div>
          <iframe 
            width="100%" height="150" frameBorder="0" style={{ borderRadius: '8px' }}
            src={`https://maps.google.com/maps?q=${msg.location.lat},${msg.location.lng}&z=15&output=embed`}
          />
        </div>
      );
    }
    return <span>{msg.content}</span>;
  };

  return (
    <div className="container page-container" style={{ height: "calc(100vh - 120px)", paddingBottom: 0 }}>
      <div className="glass-panel" style={{ display: "flex", height: "100%", overflow: "hidden" }}>
        
        {/* Sidebar / Chat List */}
        <div style={{ width: "320px", borderRight: "1px solid var(--border-color)", display: "flex", flexDirection: "column", background: "rgba(0,0,0,0.2)", position: "relative" }}>
          <div style={{ padding: "20px", borderBottom: "1px solid var(--border-color)" }}>
            <h2 style={{ fontSize: "1.5rem", marginBottom: "15px" }}>Messages</h2>
            <div className="filter-input-wrapper" style={{ margin: 0, borderRadius: "8px", background: "rgba(255,255,255,0.05)" }}>
              <Search size={16} style={{ color: "var(--text-secondary)", marginLeft: "10px" }} />
              <input 
                type="text" 
                className="filter-input" 
                placeholder="Search users..." 
                style={{ border: "none", background: "transparent" }} 
                value={searchQuery}
                onChange={handleSearch}
              />
            </div>
          </div>
          
          {/* Search Results Dropdown overlay */}
          <AnimatePresence>
            {isSearching && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                style={{
                  position: "absolute", top: "95px", left: "10px", right: "10px", 
                  background: "var(--bg-card)", border: "1px solid var(--border-color)", 
                  borderRadius: "8px", zIndex: 10, maxHeight: "300px", overflowY: "auto",
                  boxShadow: "0 10px 25px rgba(0,0,0,0.5)"
                }}
              >
                {searchResults.length === 0 ? (
                  <div style={{ padding: "15px", textAlign: "center", color: "var(--text-secondary)", fontSize: "0.9rem" }}>No users found.</div>
                ) : (
                  searchResults.map(resUser => (
                    <div 
                      key={resUser._id} 
                      onClick={() => handleSelectUser(resUser)}
                      style={{ padding: "12px 15px", display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", borderBottom: "1px solid var(--border-color)" }}
                    >
                      <div style={{ width: "35px", height: "35px", borderRadius: "50%", background: "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: "bold", overflow: "hidden", flexShrink: 0 }}>
                        {resUser.profilePicture ? <img src={resUser.profilePicture} alt="Avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : resUser.username.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontSize: "0.95rem", fontWeight: "bold" }}>{resUser.username}</div>
                        <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>{resUser.email}</div>
                      </div>
                    </div>
                  ))
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Conversations List */}
          <div style={{ flex: 1, overflowY: "auto" }}>
            {conversations.length === 0 ? (
              <div style={{ padding: "40px 20px", textAlign: "center", color: "var(--text-secondary)" }}>
                <p>No conversations yet.</p>
                <p style={{ fontSize: "0.85rem", opacity: 0.8 }}>Search for a user to start chatting.</p>
              </div>
            ) : (
              conversations.map(conv => {
                const isActive = activeChat && activeChat._id === conv.user._id;
                return (
                  <div 
                    key={conv.user._id} 
                    onClick={() => handleSelectUser(conv.user)}
                    style={{ 
                      display: "flex", 
                      gap: "15px", 
                      padding: "15px 20px", 
                      cursor: "pointer", 
                      borderBottom: "1px solid rgba(255,255,255,0.05)",
                      background: isActive ? "rgba(99, 102, 241, 0.15)" : "transparent",
                      borderLeft: isActive ? "4px solid var(--primary)" : "4px solid transparent",
                      transition: "all 0.2s"
                    }}
                  >
                    <div style={{ width: "45px", height: "45px", borderRadius: "50%", background: "var(--primary)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold", overflow: "hidden", flexShrink: 0 }}>
                      {conv.user.profilePicture ? <img src={conv.user.profilePicture} alt={conv.user.username} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : conv.user.username.charAt(0).toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "4px" }}>
                        <h4 style={{ margin: 0, fontSize: "1rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{conv.user.username}</h4>
                        {conv.lastMessage && (
                          <span style={{ fontSize: "0.75rem", color: conv.unreadCount > 0 ? "var(--primary)" : "var(--text-secondary)", fontWeight: conv.unreadCount > 0 ? "bold" : "normal" }}>
                            {formatTime(conv.lastMessage.createdAt)}
                          </span>
                        )}
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <p style={{ margin: 0, fontSize: "0.85rem", color: conv.unreadCount > 0 ? "#fff" : "var(--text-secondary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {conv.lastMessage ? (
                            conv.lastMessage.sender === user?.id || conv.lastMessage.sender === user?._id ? `You: ${conv.lastMessage.content}` : conv.lastMessage.content
                          ) : "Start a conversation"}
                        </p>
                        {conv.unreadCount > 0 && (
                          <div style={{ background: "var(--primary)", color: "#fff", fontSize: "0.7rem", fontWeight: "bold", width: "18px", height: "18px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            {conv.unreadCount}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Chat Window */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          {!activeChat ? (
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-secondary)", flexDirection: "column", gap: "15px" }}>
              <div style={{ width: "80px", height: "80px", borderRadius: "50%", background: "rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Send size={32} style={{ color: "var(--text-muted)" }} />
              </div>
              <p>Select a conversation or search for a user to start messaging.</p>
            </div>
          ) : (
            <>
              {/* Chat Header */}
              <div style={{ padding: "15px 25px", borderBottom: "1px solid var(--border-color)", display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(255,255,255,0.02)" }}>
                <div style={{ display: "flex", gap: "15px", alignItems: "center" }}>
                  <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: "var(--primary)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold", overflow: "hidden" }}>
                    {activeChat.profilePicture ? <img src={activeChat.profilePicture} alt="Avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : activeChat.username.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: "1.1rem" }}>{activeChat.username}</h3>
                    <span style={{ fontSize: "0.8rem", color: activeChatOnline ? "var(--secondary)" : "var(--text-secondary)" }}>
                      {activeChatOnline ? "Online" : activeChatLastSeen ? `Last seen ${formatTime(activeChatLastSeen)}` : "Offline"}
                    </span>
                  </div>
                </div>
                <div style={{ display: "flex", gap: "15px", color: "var(--text-secondary)", position: "relative" }}>
                  <button style={{ background: "none", border: "none", color: "inherit", cursor: "pointer" }}><Phone size={20} /></button>
                  <button style={{ background: "none", border: "none", color: "inherit", cursor: "pointer" }}><Video size={20} /></button>
                  <button onClick={() => setShowMenu(!showMenu)} style={{ background: "none", border: "none", color: "inherit", cursor: "pointer" }}><MoreVertical size={20} /></button>
                  
                  <AnimatePresence>
                    {showMenu && (
                      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} style={{ position: "absolute", top: "35px", right: 0, background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: "8px", zIndex: 10, minWidth: "150px", overflow: "hidden", boxShadow: "0 4px 15px rgba(0,0,0,0.3)" }}>
                        <button onClick={() => { setShowReportModal(true); setShowMenu(false); }} style={{ width: "100%", padding: "12px 15px", background: "none", border: "none", borderBottom: "1px solid var(--border-color)", color: "var(--text-primary)", textAlign: "left", cursor: "pointer" }}>Report User</button>
                        <button onClick={handleBlockUser} style={{ width: "100%", padding: "12px 15px", background: "none", border: "none", color: "var(--danger)", textAlign: "left", cursor: "pointer" }}>Block User</button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Chat Messages */}
              <div style={{ flex: 1, padding: "25px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "15px" }}>
                {messages.length === 0 ? (
                  <div style={{ textAlign: "center", color: "var(--text-secondary)", margin: "auto" }}>Say hi to {activeChat.username}!</div>
                ) : (
                  messages.map((msg) => {
                    const isMe = msg.sender === user?.id || msg.sender === user?._id;
                    return (
                      <motion.div 
                        key={msg._id}
                        initial={{ opacity: 0, y: 10 }} 
                        animate={{ opacity: 1, y: 0 }} 
                        style={{ alignSelf: isMe ? "flex-end" : "flex-start", maxWidth: "70%" }}
                      >
                        {msg.isScamSuspicion && !isMe && (
                          <div style={{ background: "rgba(239, 68, 68, 0.2)", color: "#fca5a5", fontSize: "0.75rem", padding: "6px 10px", borderRadius: "8px", marginBottom: "6px", border: "1px solid rgba(239, 68, 68, 0.4)", display: "flex", alignItems: "center", gap: "6px" }}>
                            <span>⚠️</span> This message was flagged as suspicious. Never send money before viewing.
                          </div>
                        )}
                        <div style={{ 
                          background: isMe ? "linear-gradient(135deg, var(--primary), #4f46e5)" : "rgba(255,255,255,0.1)", 
                          color: isMe ? "#fff" : "var(--text-primary)", 
                          padding: "8px 12px", 
                          borderRadius: isMe ? "18px 18px 4px 18px" : "18px 18px 18px 4px", 
                          fontSize: "0.95rem",
                          boxShadow: "0 2px 5px rgba(0,0,0,0.1)"
                        }}>
                          {renderMessageContent(msg, isMe)}
                        </div>
                        <div style={{ fontSize: "0.7rem", color: "var(--text-secondary)", marginTop: "4px", display: "flex", alignItems: "center", justifyContent: isMe ? "flex-end" : "flex-start", gap: "4px" }}>
                          {formatTime(msg.createdAt)}
                          {isMe && (
                            msg.status === 'seen' ? <CheckCheck size={14} style={{ color: "#3b82f6" }} /> : 
                            msg.status === 'delivered' ? <CheckCheck size={14} /> : 
                            <Check size={14} />
                          )}
                        </div>
                      </motion.div>
                    );
                  })
                )}
                {isTyping && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ alignSelf: "flex-start", maxWidth: "70%" }}>
                    <div style={{ background: "rgba(255,255,255,0.1)", color: "var(--text-secondary)", padding: "10px 15px", borderRadius: "18px 18px 18px 4px", fontSize: "0.85rem", fontStyle: "italic" }}>
                      {activeChat.username} is typing...
                    </div>
                  </motion.div>
                )}
                <div ref={messagesEndRef} />
              </div>

              <div style={{ padding: "15px 20px", borderTop: "1px solid var(--border-color)", background: "rgba(0,0,0,0.15)" }}>
                <form onSubmit={e => { e.preventDefault(); handleSendMessage(); }} style={{ display: "flex", gap: "12px", alignItems: "flex-end" }}>
                  <input type="file" ref={fileInputRef} style={{ display: "none" }} onChange={handleFileUpload} />
                  
                  <div style={{ display: "flex", gap: "8px", paddingBottom: "10px", color: "var(--text-secondary)" }}>
                    <button type="button" onClick={() => fileInputRef.current?.click()} style={{ background: "none", border: "none", color: "inherit", cursor: "pointer", padding: "5px" }}><Paperclip size={20} /></button>
                    <button type="button" onClick={shareLocation} style={{ background: "none", border: "none", color: "inherit", cursor: "pointer", padding: "5px" }}><MapPin size={20} /></button>
                  </div>
                  
                  <div style={{ flex: 1, position: "relative" }}>
                    {uploading ? (
                      <div style={{ background: "rgba(0,0,0,0.2)", borderRadius: "24px", padding: "12px", textAlign: "center", fontSize: "0.9rem", color: "var(--text-secondary)" }}>Uploading media...</div>
                    ) : isRecording ? (
                      <div style={{ background: "rgba(239, 68, 68, 0.1)", color: "var(--danger)", borderRadius: "24px", padding: "12px 20px", display: "flex", alignItems: "center", gap: "10px", fontSize: "0.95rem" }}>
                        <span className="spinner" style={{ width: "16px", height: "16px", borderColor: "var(--danger)", borderRightColor: "transparent" }}></span> Recording voice note...
                      </div>
                    ) : (
                      <textarea 
                        className="form-control" 
                        placeholder="Type a message..." 
                        style={{ borderRadius: "24px", padding: "12px 45px 12px 20px", resize: "none", minHeight: "45px", maxHeight: "120px", overflowY: "auto" }}
                        rows={1}
                        value={messageInput}
                        onChange={handleTyping}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage();
                          }
                        }}
                      />
                    )}
                  </div>
                  
                  {messageInput.trim() || uploading ? (
                    <button type="submit" className="btn btn-primary" style={{ width: "45px", height: "45px", borderRadius: "50%", padding: 0, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }} disabled={uploading}>
                      <Send size={18} style={{ marginLeft: "2px" }} />
                    </button>
                  ) : (
                    <button type="button" onClick={toggleVoiceRecord} className={`btn ${isRecording ? 'btn-danger' : 'btn-primary'}`} style={{ width: "45px", height: "45px", borderRadius: "50%", padding: 0, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      {isRecording ? <Square size={16} /> : <Mic size={18} />}
                    </button>
                  )}
                </form>
              </div>
            </>
          )}
        </div>
      </div>
      
      {showReportModal && activeChat && (
        <ReportModal targetId={activeChat._id} targetType="User" onClose={() => setShowReportModal(false)} />
      )}
    </div>
  );
}

export default Messages;
