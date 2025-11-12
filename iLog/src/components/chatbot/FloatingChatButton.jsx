import React from 'react';
import { MessageSquare } from 'lucide-react';
import './ChatBot.css';

export default function FloatingChatButton({ onClick }) {
    return (
        <button className="floating-chat-btn" onClick={onClick}>
            <MessageSquare size={22} />
        </button>
    );
}
