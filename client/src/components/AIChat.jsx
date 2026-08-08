import { useState, useContext, useRef, useEffect } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';

const AIChat = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [message, setMessage] = useState('');
    const [chatHistory, setChatHistory] = useState([
        { role: 'ai', text: 'Hi! I am RescueAI. How can I help you navigate Animal Rescuer today?' }
    ]);
    const [loading, setLoading] = useState(false);
    const { user } = useContext(AuthContext);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        if (isOpen) scrollToBottom();
    }, [chatHistory, isOpen]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!message.trim()) return;

        const userMsg = message;
        setMessage('');
        setChatHistory(prev => [...prev, { role: 'user', text: userMsg }]);
        setLoading(true);

        try {
            const res = await axios.post('http://localhost:5000/api/ai/chat', { message: userMsg }, {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            
            setChatHistory(prev => [...prev, { role: 'ai', text: res.data.message }]);
        } catch (error) {
            setChatHistory(prev => [...prev, { role: 'ai', text: 'Sorry, I am having trouble connecting to my server right now.' }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <button className="ai-chat-btn" onClick={() => setIsOpen(!isOpen)}>
                🤖
            </button>

            {isOpen && (
                <div className="glass-panel" style={{
                    position: 'fixed',
                    bottom: '6rem',
                    right: '2rem',
                    width: '350px',
                    height: '500px',
                    display: 'flex',
                    flexDirection: 'column',
                    zIndex: 100,
                    overflow: 'hidden'
                }}>
                    <div style={{ padding: '1rem', background: 'rgba(79, 70, 229, 0.2)', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between' }}>
                        <h3 style={{ margin: 0 }}>RescueAI</h3>
                        <button onClick={() => setIsOpen(false)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: '1.2rem' }}>&times;</button>
                    </div>
                    
                    <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {chatHistory.map((msg, idx) => (
                            <div key={idx} style={{
                                alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                                background: msg.role === 'user' ? 'var(--primary)' : 'rgba(30, 41, 59, 0.8)',
                                padding: '0.75rem 1rem',
                                borderRadius: '12px',
                                maxWidth: '85%',
                                border: msg.role === 'ai' ? '1px solid var(--glass-border)' : 'none'
                            }}>
                                {msg.text}
                            </div>
                        ))}
                        {loading && (
                            <div style={{ alignSelf: 'flex-start', color: 'var(--text-muted)' }}>AI is thinking...</div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>
                    
                    <form onSubmit={handleSend} style={{ padding: '1rem', borderTop: '1px solid var(--glass-border)', display: 'flex', gap: '0.5rem' }}>
                        <input 
                            type="text" 
                            className="form-control" 
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="Ask a question..."
                            style={{ flex: 1 }}
                        />
                        <button type="submit" className="btn btn-primary" disabled={loading || !message.trim()}>
                            Send
                        </button>
                    </form>
                </div>
            )}
        </>
    );
};

export default AIChat;
