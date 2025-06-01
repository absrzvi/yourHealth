// components/ai-coach/ChatInterface.tsx
'use client';

import React, { useState, useEffect, useRef } from 'react';
// We'll create a CSS module for this component's styles
// import styles from './ChatInterface.module.css';

interface Message {
    id: string;
    role: 'USER' | 'ASSISTANT'; // Aligned with backend roles
    content: string;
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
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<null | HTMLDivElement>(null);

    // Mock initial message
    useEffect(() => {
        setMessages([
            { id: '1', role: 'ASSISTANT', content: 'Welcome to your AI Health Coach! How can I assist you today?', timestamp: new Date() }
        ]);
    }, []);

    // Scroll to bottom when new messages are added
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendMessage = async () => {
        if (inputText.trim() === '') return;

        const currentUserMessageText = inputText;
        setInputText(''); // Clear input immediately

        const userMessage: Message = {
            id: Date.now().toString(), // Simple ID generation for local display
            role: 'USER',
            content: currentUserMessageText,
            timestamp: new Date()
        };
        setMessages(prev => [...prev, userMessage]);

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ message: currentUserMessageText }), // Temporarily removed chatSessionId
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error('API Error:', errorData.error || response.statusText);
                // Optionally, add an error message to the chat
                const errorMessage: Message = {
                    id: (Date.now() + 1).toString(),
                    role: 'ASSISTANT',
                    content: `Error: ${errorData.error || 'Failed to get response from Aria.'}`,
                    timestamp: new Date(),
                };
                setMessages(prev => [...prev, errorMessage]);
                return;
            }

            const aiResponseData = await response.json();
            
            const aiMessage: Message = {
                id: aiResponseData.id,
                role: aiResponseData.role, // Should be 'ASSISTANT'
                content: aiResponseData.content,
                timestamp: new Date(aiResponseData.timestamp) // Convert ISO string to Date
            };
            setMessages(prev => [...prev, aiMessage]);

        } catch (error) {
            console.error('Failed to send message or process response:', error);
            const errorMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'ASSISTANT',
                content: 'Sorry, I encountered an issue connecting to the server. Please try again.',
                timestamp: new Date(),
            };
            setMessages(prev => [...prev, errorMessage]);
        }
    };

    // Basic inline styles for now, to be replaced by CSS module or global styles
    const panelStyle: React.CSSProperties = {
        position: 'fixed',
        left: isOpen ? '0px' : '-400px',
        top: '64px', // Position below the navigation bar (assuming standard height)
        width: '400px',
        height: 'calc(100vh - 64px)', // Full viewport height minus navigation height
        backgroundColor: '#ffffff',
        boxShadow: '2px 0 5px rgba(0,0,0,0.1)',
        display: 'flex',
        flexDirection: 'column',
        transition: 'left 0.3s ease-in-out',
        zIndex: 1000,
        borderRight: '1px solid #e0e0e0'
    };

    const messagesContainerStyle: React.CSSProperties = {
        flexGrow: 1,
        padding: '15px',
        overflowY: 'auto',
        paddingTop: '15px', // Add some top padding since we removed the header
        fontFamily: 'var(--font-open-sans), sans-serif',
        fontSize: '0.875rem',
        color: '#374151' // text-neutral-700 equivalent
    };

    const inputContainerStyle: React.CSSProperties = {
        display: 'flex',
        padding: '15px',
        borderTop: '1px solid #e0e0e0',
        fontFamily: 'var(--font-open-sans), sans-serif',
        fontSize: '0.875rem',
        color: '#374151' // text-neutral-700 equivalent
    };
    
    const inputStyle: React.CSSProperties = {
        flexGrow: 1,
        padding: '10px',
        border: '1px solid #ccc',
        borderRadius: '5px',
        marginRight: '10px',
        fontFamily: 'var(--font-open-sans), sans-serif',
        fontSize: '0.875rem',
        color: '#374151', // text-neutral-700 equivalent
        backgroundColor: '#fff',
        transition: 'border-color 0.2s ease',
        outline: 'none'
    };

    // Base button style
    const buttonStyle: React.CSSProperties = {
        padding: '10px 15px',
        backgroundColor: '#007bff',
        color: 'white',
        border: 'none',
        borderRadius: '5px',
        cursor: 'pointer',
        fontFamily: 'var(--font-open-sans), sans-serif',
        fontSize: '0.875rem',
        fontWeight: 500,
        transition: 'background-color 0.2s ease',
    };

    const buttonHoverStyle: React.CSSProperties = {
        backgroundColor: '#0056b3'
    };

    const buttonFocusStyle: React.CSSProperties = {
        outline: '2px solid #93c5fd',
        outlineOffset: '2px'
    };

    return (
        <div style={panelStyle} className={/* styles.chatPanel */ ''} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
            <div style={messagesContainerStyle} className={/* styles.messagesContainer */ ''}>
                {messages.map((msg) => (
                    <div key={msg.id} style={{
                        marginBottom: '12px',
                        display: 'flex',
                        justifyContent: msg.role === 'USER' ? 'flex-end' : 'flex-start',
                        fontFamily: 'var(--font-open-sans), sans-serif',
                        fontSize: '0.875rem',
                        color: '#374151' // text-neutral-700 equivalent
                    }}>
                        <div style={{
                            padding: '8px 12px',
                            borderRadius: '15px',
                            backgroundColor: msg.role === 'USER' ? '#007bff' : '#e9ecef',
                            color: msg.role === 'USER' ? 'white' : '#333',
                            maxWidth: '80%',
                            wordWrap: 'break-word'
                        }}>
                            <div><strong>{msg.role === 'USER' ? 'You' : 'Aria'}</strong></div>
                            <div>{msg.content}</div>
                            <div style={{ fontSize: '0.75em', color: msg.role === 'USER' ? '#f0f0f0' : '#666', textAlign: 'right', marginTop: '4px' }}>
                                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>
            <div style={inputContainerStyle}>
                <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Type your message..."
                    style={inputStyle}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                />
                <button 
                    onClick={handleSendMessage}
                    style={buttonStyle}
                    onMouseEnter={() => {
                        Object.assign(buttonStyle, buttonHoverStyle);
                    }}
                    onMouseLeave={() => {
                        delete buttonStyle.backgroundColor;
                    }}
                    onFocus={() => {
                        Object.assign(buttonStyle, buttonFocusStyle);
                    }}
                    onBlur={() => {
                        delete buttonStyle.outline;
                        delete buttonStyle.outlineOffset;
                    }}
                    disabled={isLoading}
                >
                    {isLoading ? 'Sending...' : 'Send'}
                </button>
            </div>
        </div>
    );
};

export default ChatInterface;
