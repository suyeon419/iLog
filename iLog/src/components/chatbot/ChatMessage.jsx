import React from 'react';
import './ChatBot.css';

export default function ChatMessage({ sender, text }) {
    return (
        <div className={`chat-msg ${sender}`}>
            <div className="bubble">{text}</div>
        </div>
    );
}
