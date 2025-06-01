// components/ai-coach/ChatInterface.tsx
'use client';

import React, { useState, useEffect, useRef } from 'react';
// We'll create a CSS module for this component's styles
// import styles from './ChatInterface.module.css';

interface Message {
    id: string;
    sender: 'User' | 'Aria';
    text: string;
    timestamp: Date;
}

interface ChatInterfaceProps {
    isOpen: boolean;
    onMouseEnter?: () => void;
    onMouseLeave?: () => void;
    // We'll add more props later, e.g., onSendMessage
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ isOpen, onMouseEnter, onMouseLeave }) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputText, setInputText] = useState('');
    const messagesEndRef = useRef<null | HTMLDivElement>(null);

    // Mock initial message
    useEffect(() => {
        setMessages([
            { id: '1', sender: 'Aria', text: 'Welcome to your AI Health Coach! How can I assist you today?', timestamp: new Date() }
        ]);
    }, []);

    // Scroll to bottom when new messages are added
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendMessage = () => {
        if (inputText.trim() === '') return;

        const userMessage: Message = {
            id: Date.now().toString(), // Simple ID generation
            sender: 'User',
            text: inputText,
            timestamp: new Date()
        };
        setMessages(prev => [...prev, userMessage]);
        
        // Mock Aria response
        setTimeout(() => {
            const ariaResponse: Message = {
                id: (Date.now() + 1).toString(),
                sender: 'Aria',
                text: `I'm processing: \"${inputText}\". More advanced responses coming soon!`,
                timestamp: new Date()
            };
            setMessages(prev => [...prev, ariaResponse]);
        }, 1000);

        setInputText('');
        // TODO: Call actual backend API
    };

    // Basic inline styles for now, to be replaced by CSS module or global styles
    const panelStyle: React.CSSProperties = {
        position: 'fixed', // Or absolute, depending on parent
        left: isOpen ? '0px' : '-400px', // Slides from left
        top: '0', // Adjust as needed, e.g., below header or aligned with sidebar trigger
        width: '400px',
        height: '100vh', // Or a portion of it, e.g., calc(100vh - headerHeight)
        backgroundColor: '#ffffff',
        boxShadow: '2px 0 5px rgba(0,0,0,0.1)', // Shadow on the right now
        display: 'flex',
        flexDirection: 'column',
        transition: 'left 0.3s ease-in-out', // Transition for left property
        zIndex: 1000, // Ensure it's above other content
        borderRight: '1px solid #e0e0e0' // Border on the right now
    };

    const headerStyle: React.CSSProperties = {
        padding: '15px',
        backgroundColor: '#f5f5f5',
        borderBottom: '1px solid #e0e0e0',
        textAlign: 'center'
    };

    const messagesContainerStyle: React.CSSProperties = {
        flexGrow: 1,
        padding: '15px',
        overflowY: 'auto'
    };

    const inputAreaStyle: React.CSSProperties = {
        display: 'flex',
        padding: '15px',
        borderTop: '1px solid #e0e0e0'
    };
    
    const inputStyle: React.CSSProperties = {
        flexGrow: 1,
        padding: '10px',
        border: '1px solid #ccc',
        borderRadius: '5px',
        marginRight: '10px'
    };

    const buttonStyle: React.CSSProperties = {
        padding: '10px 15px',
        backgroundColor: '#007bff',
        color: 'white',
        border: 'none',
        borderRadius: '5px',
        cursor: 'pointer'
    };

    return (
        <div style={panelStyle} className={/* styles.chatPanel */ ''} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
            <div style={headerStyle} className={/* styles.chatHeader */ ''}>
                <h4>AI Health Coach</h4>
            </div>
            <div style={messagesContainerStyle} className={/* styles.messagesContainer */ ''}>
                {messages.map((msg) => (
                    <div key={msg.id} style={{ marginBottom: '12px', display: 'flex', justifyContent: msg.sender === 'User' ? 'flex-end' : 'flex-start' }}>
                        <div style={{
                            padding: '8px 12px',
                            borderRadius: '15px',
                            backgroundColor: msg.sender === 'User' ? '#007bff' : '#e9ecef',
                            color: msg.sender === 'User' ? 'white' : '#333',
                            maxWidth: '80%',
                            wordWrap: 'break-word'
                        }}>
                            <div><strong>{msg.sender}</strong></div>
                            <div>{msg.text}</div>
                            <div style={{ fontSize: '0.75em', color: msg.sender === 'User' ? '#f0f0f0' : '#666', textAlign: 'right', marginTop: '4px' }}>
                                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>
            <div style={inputAreaStyle} className={/* styles.inputArea */ ''}>
                <input
                    type="text"
                    style={inputStyle}
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Ask Aria..."
                />
                <button style={buttonStyle} onClick={handleSendMessage}>Send</button>
            </div>
        </div>
    );
};

export default ChatInterface;
