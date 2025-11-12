import React, { useEffect, useState } from 'react';
import { Button, Card, Col, Container, ListGroup, Row, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { getUserById } from '../../api/user';
import { jwtDecode } from 'jwt-decode';
import FloatingChatButton from '../../components/chatbot/FloatingChatButton';
import ChatbotPanel from '../../components/chatbot/ChatbotPanel';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';

export default function Home() {
    const navigate = useNavigate();

    const [isLogin, setIsLogin] = useState(false);
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    const [selectedDate, setSelectedDate] = useState(new Date());

    // ✅ 더미 회의 데이터
    const dummyMeetings = [
        { id: 1, title: '팀 회의 - 프론트 UI 리뷰', date: '2025-11-12' },
        { id: 2, title: '백엔드 API 구조 논의', date: '2025-11-13' },
        { id: 3, title: 'iLog 디자인 피드백 회의', date: '2025-11-12' },
        { id: 4, title: '전체 회의 - Sprint 5 마감', date: '2025-11-15' },
    ];

    const eventsOnSelectedDate = dummyMeetings.filter(
        (m) => new Date(m.date).toDateString() === selectedDate.toDateString()
    );

    useEffect(() => {
        const token = localStorage.getItem('accessToken');

        if (token) {
            console.log('✅ [Home] 토큰이 localStorage에 존재합니다:', token);
            setIsLogin(true);

            try {
                const decoded = jwtDecode(token);
                const userId = decoded.id;
                console.log('🧩 [Home] 디코딩된 사용자 ID:', userId);

                getUserById(userId)
                    .then((data) => {
                        console.log('✅ [Home] 회원 정보 조회 성공:', data);
                        setUser(data);
                    })
                    .catch((err) => {
                        console.error('❌ [Home] 회원 정보 요청 실패:', err);
                        localStorage.removeItem('accessToken');
                        setIsLogin(false);
                    })
                    .finally(() => {
                        setIsLoading(false);
                    });
            } catch (err) {
                console.error('❌ [Home] JWT 디코딩 실패:', err);
                localStorage.removeItem('accessToken');
                setIsLogin(false);
            }
        } else {
            console.warn('⚠️ [Home] 토큰이 없습니다. 비로그인 상태입니다.');
            setIsLoading(false);
        }
    }, []);

    if (isLoading) {
        return (
            <Container
                className="d-flex flex-column justify-content-center align-items-center"
                style={{ height: '100vh' }}
            >
                <Spinner animation="border" variant="primary" />
                <p className="mt-3">회원 정보를 불러오는 중입니다...</p>
            </Container>
        );
    }

    return (
        <Container>
            <img src="./images/iLogLogo.png" alt="iLog Logo" style={{ width: '200px' }} /> <br />
            {isLogin ? (
                <>
                    <h3 className="fw-bold mb-4">나의 스케줄</h3>
                    <Calendar onChange={setSelectedDate} value={selectedDate} calendarType="gregory" />
                </>
            ) : (
                <>
                    <Button
                        variant="primary"
                        style={{ borderRadius: '20px', width: '300px' }}
                        onClick={() => navigate('/login')}
                    >
                        로그인
                    </Button>
                    <p>
                        회원이 아니신가요?
                        <a href="/register" className="signup-link mx-2">
                            회원가입
                        </a>
                    </p>
                </>
            )}
        </Container>
    );
}
