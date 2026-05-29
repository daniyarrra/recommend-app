import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import { useLanguage } from "../context/LanguageContext";
import "../styles/chat.css";

const AIChat = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);
    const { language } = useLanguage();
    const navigate = useNavigate();

    // Initial greeting when opened for the first time
    useEffect(() => {
        if (isOpen && messages.length === 0) {
            setMessages([
                {
                    role: "ai",
                    text: language === 'ru' 
                        ? "Привет! Я ваш личный ИИ-ассистент RecMedia. Ищете грустный фильм, бодрящую музыку или эпичную книгу? Просто спросите меня!" 
                        : "Hi! I'm your personal RecMedia AI assistant. Looking for a sad movie, energetic music, or an epic book? Just ask!",
                    items: []
                }
            ]);
        }
    }, [isOpen, messages.length, language]);

    useEffect(() => {
        // Scroll to bottom smoothly when new messages arrive
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages, isLoading]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMsg = input.trim();
        setInput("");
        
        // Prepare history from existing messages (excluding the new user message we are about to add)
        // We exclude the initial greeting if it's the only one, or keep it depending on preference.
        // Let's send all messages that are in state.
        const history = messages.map(m => ({ role: m.role, text: m.text }));

        setMessages(prev => [...prev, { role: "user", text: userMsg }]);
        setIsLoading(true);

        try {
            const response = await fetch(`/api/chat?lang=${language}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: userMsg, history: history })
            });
            
            const data = await response.json();
            
            setMessages(prev => [...prev, { 
                role: "ai", 
                text: data.reply, 
                items: data.items || []
            }]);
        } catch (error) {
            console.error("Chat API failed:", error);
            setMessages(prev => [...prev, { 
                role: "ai", 
                text: `Упс! Произошла ошибка: ${error.message}` 
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="ai-chat-widget">
            <AnimatePresence>
                {isOpen && (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.8, y: 50 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.8, y: 50 }}
                        transition={{ type: "spring", stiffness: 300, damping: 25 }}
                        className="ai-chat-window"
                    >
                        <div className="ai-chat-header">
                            <div className="ai-avatar">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z"/>
                                    <path d="M12 8v4"/>
                                    <path d="M12 16h.01"/>
                                </svg>
                            </div>
                            <div className="ai-header-info">
                                <h3>RecMedia AI</h3>
                                <p>Online</p>
                            </div>
                            <button className="ai-close-btn" onClick={() => setIsOpen(false)}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="18" y1="6" x2="6" y2="18"/>
                                    <line x1="6" y1="6" x2="18" y2="18"/>
                                </svg>
                            </button>
                        </div>

                        <div className="ai-chat-messages">
                            {messages.map((msg, idx) => (
                                <div key={idx} className={`chat-message ${msg.role}`}>
                                    <div className="message-bubble">{msg.text}</div>
                                    
                                    {msg.items && msg.items.length > 0 && (
                                        <div className="message-items">
                                            {msg.items.map(item => (
                                                <div 
                                                    key={item.id} 
                                                    className="chat-item-card"
                                                    onClick={() => navigate(`/item/${item.id}`)}
                                                >
                                                    <img src={item.image} alt={item.title} className="chat-item-image" />
                                                    <div className="chat-item-info">
                                                        <div className="chat-item-title">{item.title}</div>
                                                        <div className="chat-item-genre">{item.genre}</div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                            {isLoading && (
                                <div className="typing-indicator">
                                    <div className="typing-dot"></div>
                                    <div className="typing-dot"></div>
                                    <div className="typing-dot"></div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        <form className="ai-chat-input-area" onSubmit={handleSend}>
                            <div className="chat-input-wrapper">
                                <input 
                                    type="text" 
                                    className="chat-input"
                                    placeholder={language === 'ru' ? "Напишите что-нибудь..." : "Type something..."}
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                />
                                <button type="submit" className="chat-send-btn" disabled={!input.trim() || isLoading}>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <line x1="22" y1="2" x2="11" y2="13"/>
                                        <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                                    </svg>
                                </button>
                            </div>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>

            {!isOpen && (
                <button 
                    className="ai-chat-toggle" 
                    onClick={() => setIsOpen(true)}
                    aria-label="Open AI Assistant"
                >
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                        <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z"/>
                        <path d="M12 8v4"/>
                        <path d="M12 16h.01"/>
                    </svg>
                </button>
            )}
        </div>
    );
};

export default AIChat;
