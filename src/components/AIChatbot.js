import React, { useState, useEffect, useRef } from "react";
import { MessageSquare, X, Send, Bot, Sparkles, User as UserIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

function AIChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { sender: "bot", text: "Hi there! I'm FindMyRoom's AI Assistant. Are you looking for a room, a roommate, or do you have a question about the platform?", time: new Date() }
  ]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isOpen]);

  const handleSend = () => {
    if (!input.trim()) return;

    // Add user message
    const userMsg = { sender: "user", text: input, time: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput("");

    // Simulate AI thinking and responding
    setTimeout(() => {
      let botResponse = "I can help you with that! Our AI engine is currently analyzing the best matches for you.";
      
      const lowerInput = userMsg.text.toLowerCase();
      if (lowerInput.includes("roommate") || lowerInput.includes("flatmate")) {
        botResponse = "We have a great Roommate Finder! Have you checked out the 'Find Roommates' tab? I can also filter profiles based on your lifestyle preferences.";
      } else if (lowerInput.includes("rent") || lowerInput.includes("price") || lowerInput.includes("budget")) {
        botResponse = "I can filter our listings based on your budget. The average rent for a 1BHK in major cities is around ₹12,000-₹20,000. What's your max budget?";
      } else if (lowerInput.includes("safety") || lowerInput.includes("verified")) {
        botResponse = "All our listed properties and owners go through a strict verification process. Look for the blue 'Verified' shield on listings!";
      }

      setMessages(prev => [...prev, { sender: "bot", text: botResponse, time: new Date() }]);
    }, 1000);
  };

  return (
    <>
      {/* Floating Chat Button */}
      <motion.button 
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(true)}
        style={{
          position: "fixed",
          bottom: "30px",
          right: "30px",
          width: "60px",
          height: "60px",
          borderRadius: "50%",
          background: "linear-gradient(135deg, var(--primary), var(--secondary))",
          color: "#fff",
          border: "none",
          boxShadow: "0 10px 25px rgba(99, 102, 241, 0.4)",
          display: isOpen ? "none" : "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          zIndex: 1000
        }}
      >
        <Bot size={28} />
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            style={{
              position: "fixed",
              bottom: "30px",
              right: "30px",
              width: "350px",
              height: "500px",
              borderRadius: "20px",
              background: "var(--bg-card)",
              border: "1px solid var(--border-color)",
              boxShadow: "0 15px 35px rgba(0,0,0,0.5)",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
              zIndex: 1000,
              backdropFilter: "blur(20px)"
            }}
          >
            {/* Header */}
            <div style={{ background: "linear-gradient(135deg, var(--primary), var(--secondary))", padding: "15px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", color: "#fff" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <Bot size={24} />
                <div>
                  <h4 style={{ margin: 0, fontSize: "1rem", display: "flex", alignItems: "center", gap: "4px" }}>
                    AI Support <Sparkles size={14} style={{ color: "#fbbf24" }} />
                  </h4>
                  <span style={{ fontSize: "0.75rem", opacity: 0.8 }}>Online</span>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} style={{ background: "none", border: "none", color: "#fff", cursor: "pointer" }}>
                <X size={20} />
              </button>
            </div>

            {/* Messages */}
            <div style={{ flex: 1, padding: "20px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "15px" }}>
              {messages.map((msg, idx) => (
                <div key={idx} style={{ alignSelf: msg.sender === "user" ? "flex-end" : "flex-start", maxWidth: "80%", display: "flex", gap: "8px", flexDirection: msg.sender === "user" ? "row-reverse" : "row" }}>
                  <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: msg.sender === "bot" ? "rgba(99,102,241,0.2)" : "rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: msg.sender === "bot" ? "var(--primary)" : "#fff" }}>
                    {msg.sender === "bot" ? <Bot size={16} /> : <UserIcon size={16} />}
                  </div>
                  <div style={{
                    background: msg.sender === "user" ? "var(--primary)" : "rgba(255,255,255,0.05)",
                    color: msg.sender === "user" ? "#fff" : "var(--text-primary)",
                    padding: "10px 15px",
                    borderRadius: msg.sender === "user" ? "18px 4px 18px 18px" : "4px 18px 18px 18px",
                    fontSize: "0.9rem",
                    lineHeight: "1.5",
                    border: msg.sender === "bot" ? "1px solid var(--border-color)" : "none"
                  }}>
                    {msg.text}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div style={{ padding: "15px", borderTop: "1px solid var(--border-color)", background: "rgba(0,0,0,0.2)" }}>
              <form onSubmit={e => { e.preventDefault(); handleSend(); }} style={{ display: "flex", gap: "10px" }}>
                <input 
                  type="text" 
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  placeholder="Ask something..." 
                  style={{ flex: 1, background: "rgba(255,255,255,0.05)", border: "1px solid var(--border-color)", color: "#fff", padding: "10px 15px", borderRadius: "20px", outline: "none" }} 
                />
                <button type="submit" style={{ width: "40px", height: "40px", borderRadius: "50%", background: "var(--primary)", border: "none", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}>
                  <Send size={16} style={{ marginLeft: "2px" }} />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default AIChatbot;
