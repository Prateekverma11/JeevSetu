import { useState, useRef, useEffect } from 'react';
import api from '../api/axios';

const AIChat = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [message, setMessage] = useState('');
    const [chatHistory, setChatHistory] = useState([
        { role: 'ai', text: 'Hi! I am RescueAI, your animal rescue assistant. Ask me anything about navigating the platform or rescue workflows!' }
    ]);
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef(null);

    const quickPrompts = [
        "How do I report an injured animal?",
        "How does rescuer matching work?",
        "What is the allowed rescue radius?"
    ];

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        if (isOpen) scrollToBottom();
    }, [chatHistory, isOpen]);

    const sendUserMessage = async (textToSend) => {
        if (!textToSend || !textToSend.trim()) return;

        setMessage('');
        setChatHistory(prev => [...prev, { role: 'user', text: textToSend }]);
        setLoading(true);

        try {
            const res = await api.post('/api/ai/chat', { message: textToSend });
            setChatHistory(prev => [...prev, { role: 'ai', text: res.data.message }]);
        } catch {
            setChatHistory(prev => [...prev, { role: 'ai', text: 'Sorry, I am currently unable to reach the AI service.' }]);
        } finally {
            setLoading(false);
        }
    };

    const handleSend = (e) => {
        e.preventDefault();
        sendUserMessage(message);
    };

    return (
        <>
            <button 
                className="ai-chat-btn" 
                onClick={() => setIsOpen(!isOpen)}
                title="RescueAI Navigation Assistant"
            >
                🤖
            </button>

            {isOpen && (
                <div className="ai-chat-window animate-fade-in">
                    <div style={{ padding: '1rem', background: '#ffffff', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ fontSize: '1.25rem' }}>🤖</span>
                            <div>
                                <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-main)' }}>RescueAI</h3>
                                <span style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: '600' }}>Smart Assistant</span>
                            </div>
                        </div>
                        <button onClick={() => setIsOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-main)', cursor: 'pointer', fontSize: '1.5rem', lineHeight: '1' }}>&times;</button>
                    </div>
                    
                    <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem', background: '#ffffff' }}>
                        {chatHistory.map((msg, idx) => (
                            <div key={idx} style={{
                                alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                                background: msg.role === 'user' ? 'var(--primary)' : '#f1f5f9',
                                color: msg.role === 'user' ? 'white' : 'var(--text-main)',
                                padding: '0.75rem 1rem',
                                borderRadius: msg.role === 'user' ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
                                maxWidth: '85%',
                                fontSize: '0.9rem',
                                lineHeight: '1.5',
                                border: msg.role === 'ai' ? '1px solid #e2e8f0' : 'none',
                                whiteSpace: 'pre-wrap'
                            }}>
                                {msg.text}
                            </div>
                        ))}
                        {loading && (
                            <div style={{ alignSelf: 'flex-start', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                🤖 RescueAI is typing...
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Quick Suggestions */}
                    {chatHistory.length <= 2 && !loading && (
                        <div style={{ padding: '0.5rem 1rem', display: 'flex', flexWrap: 'wrap', gap: '0.35rem', borderTop: '1px solid #e2e8f0', background: '#ffffff' }}>
                            {quickPrompts.map((prompt, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => sendUserMessage(prompt)}
                                    style={{
                                        background: '#f8fafc',
                                        border: '1px solid #e2e8f0',
                                        color: 'var(--primary)',
                                        padding: '0.25rem 0.6rem',
                                        borderRadius: '12px',
                                        fontSize: '0.75rem',
                                        cursor: 'pointer',
                                        textAlign: 'left'
                                    }}
                                >
                                    💡 {prompt}
                                </button>
                            ))}
                        </div>
                    )}
                    
                    <form onSubmit={handleSend} style={{ padding: '0.75rem 1rem', borderTop: '1px solid #e2e8f0', display: 'flex', gap: '0.5rem', background: '#ffffff' }}>
                        <input 
                            type="text" 
                            className="form-control" 
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="Ask RescueAI..."
                            style={{ flex: 1, fontSize: '0.9rem', background: '#ffffff' }}
                        />
                        <button type="submit" className="btn btn-primary" style={{ padding: '0.5rem 1rem' }} disabled={loading || !message.trim()}>
                            Send
                        </button>
                    </form>
                </div>
            )}
        </>
    );
};

export default AIChat;
