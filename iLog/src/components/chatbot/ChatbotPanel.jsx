import React, { useState } from 'react';
import { Send } from 'lucide-react';
import ChatMessage from './ChatMessage';
import { askQuestion } from '../../api/rag';
import { Button } from 'react-bootstrap';
import './ChatBot.css';

export default function ChatbotPanel({ onClose, meetingId }) {
    const [messages, setMessages] = useState([{ sender: 'bot', text: '어떤 도움을 드릴까요?' }]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSend = async () => {
        console.log('📡 현재 meetingId:', meetingId);
        if (!input.trim()) return;
        const userMessage = input.trim();
        setMessages((prev) => [...prev, { sender: 'user', text: userMessage }]);
        setInput('');
        setLoading(true);

        try {
            const { answer } = await askQuestion(meetingId, userMessage);
            setMessages((prev) => [...prev, { sender: 'bot', text: answer || '답변을 불러오지 못했어요.' }]);
        } catch (err) {
            console.error('❌ RAG 질문 요청 실패:', err);
            setMessages((prev) => [...prev, { sender: 'bot', text: '서버 요청 중 오류가 발생했습니다.' }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="chatbot-panel">
            <div className="chatbot-header">
                <span>AI 어시스턴트</span>
                <Button onClick={onClose} className="x-btn">
                    X
                </Button>
            </div>

            <div className="chatbot-messages">
                {messages.map((msg, i) => (
                    <ChatMessage key={i} sender={msg.sender} text={msg.text} />
                ))}
                {loading && <div className="loading-msg">답변 생성 중...</div>}
            </div>

            <div className="chatbot-input">
                <input
                    placeholder="회의 관련 질문을 입력하세요..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                />
                <button onClick={handleSend}>
                    <Send size={18} />
                </button>
            </div>
        </div>
    );
}
