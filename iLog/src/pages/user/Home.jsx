import React, { useEffect, useState } from 'react';
import { Button, Container, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { getUserById, getNoteHistory } from '../../api/user';
import { jwtDecode } from 'jwt-decode';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';

export default function Home() {
    const navigate = useNavigate();

    const [isLogin, setIsLogin] = useState(false);
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    const [noteHistory, setNoteHistory] = useState([]);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [selectedNotes, setSelectedNotes] = useState([]);

    useEffect(() => {
        if (noteHistory.length > 0) {
            handleDateClick(new Date());
        }
    }, [noteHistory]);

    useEffect(() => {
        const token = localStorage.getItem('accessToken');
        console.log(token);

        if (!token) {
            setIsLoading(false);
            return;
        }

        setIsLogin(true);

        try {
            const decoded = jwtDecode(token);
            const userId = decoded.id;

            Promise.all([getUserById(userId), getNoteHistory()])
                .then(([userData, noteLogs]) => {
                    setUser(userData);
                    setNoteHistory(noteLogs);
                })
                .catch(() => {
                    localStorage.removeItem('accessToken');
                    setIsLogin(false);
                })
                .finally(() => {
                    setIsLoading(false);
                });
        } catch {
            localStorage.removeItem('accessToken');
            setIsLogin(false);
            setIsLoading(false);
        }
    }, []);

    const handleDateClick = (date) => {
        setSelectedDate(date);

        const logs = noteHistory.filter(
            (n) => n.status === 'CREATE' && new Date(n.createdAt).toDateString() === date.toDateString()
        );

        // 제목만 표시
        const detailed = logs
            .filter((log) => log.minutesTitle) // null 제외
            .map((log) => ({
                id: log.id,
                title: log.minutesTitle,
                createdAt: log.createdAt,
            }));

        setSelectedNotes(detailed);
    };

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
            <img className="w-25" src="./images/ko.ilo9.png" alt="iLog Logo" /> <br />
            {isLogin ? (
                <>
                    <h3 className="fw-bold mb-4">나의 스케줄</h3>

                    <div style={{ display: 'flex', gap: '40px', alignItems: 'flex-start' }}>
                        {/* 캘린더 */}
                        <div>
                            <Calendar
                                onClickDay={handleDateClick}
                                value={selectedDate}
                                calendarType="gregory"
                                style={{
                                    border: '1px solid #b66e03',
                                }}
                                tileContent={({ date }) => {
                                    const hasNote = noteHistory.some(
                                        (item) => new Date(item.createdAt).toDateString() === date.toDateString()
                                    );

                                    return (
                                        <div
                                            style={{
                                                display: 'flex',
                                                justifyContent: 'center',
                                                alignItems: 'center',
                                                height: 10,
                                                marginTop: 4,
                                            }}
                                        >
                                            {hasNote && (
                                                <div
                                                    style={{
                                                        width: 6,
                                                        height: 6,
                                                        borderRadius: '50%',
                                                        backgroundColor: '#b66e03',
                                                    }}
                                                />
                                            )}
                                        </div>
                                    );
                                }}
                            />
                        </div>

                        {/* 오른쪽 박스 */}
                        <div
                            style={{
                                width: '350px',
                                background: '#fff',
                                height: '450px',
                                border: '1px solid #b66e03',
                                borderRadius: '10px',
                                padding: '20px',
                                boxShadow: '0 2px 10px rgba(182, 110, 3, 0.15)',
                            }}
                        >
                            <h4>{selectedDate.toLocaleDateString('ko-KR')}</h4>

                            {selectedNotes.length === 0 ? (
                                <p style={{ color: '#999' }}>이 날짜에는 회의록이 없습니다.</p>
                            ) : (
                                selectedNotes.map((note) => (
                                    <div
                                        key={note.id}
                                        style={{
                                            background: '#f5f1ec',
                                            padding: '12px 15px',
                                            borderRadius: '10px',
                                            border: '1px solid #eee',
                                            marginBottom: '12px',
                                            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <i
                                                className="bi bi-file-earmark-text"
                                                style={{ fontSize: '20px', color: '#b66e03' }}
                                            ></i>
                                            <span style={{ fontSize: '14px', color: '#b66e03', fontWeight: 600 }}>
                                                회의록
                                            </span>
                                        </div>

                                        <div
                                            style={{
                                                fontSize: '15px',
                                                fontWeight: 600,
                                                color: '#333',
                                            }}
                                        >
                                            {note.title}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
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
                    <div className="driving-car-container">
                        <div className="car-content">
                            <span>아이로구 회의록 입니다 ~</span>
                            <img src="/images/car.png" alt="움직이는 아이로구 자동차" className="custom-car-img" />
                        </div>
                    </div>
                </>
            )}
        </Container>
    );
}
