import React, { useEffect, useState } from 'react';
import { Button, Card, Col, Container, ListGroup, Row, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { getUserById } from '../../api/user';
import { jwtDecode } from 'jwt-decode';
import FloatingChatButton from '../../components/chatbot/FloatingChatButton';
import ChatbotPanel from '../../components/chatbot/ChatbotPanel';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { getNoteHistory } from '../../api/user';
import { getNoteDetails, getProjectDetails, getProjects } from '../../api/note';

export default function Home() {
    const navigate = useNavigate();

    const [isLogin, setIsLogin] = useState(false);
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    //회의록 이력
    const [noteHistory, setNoteHistory] = useState([]);

    const [selectedDate, setSelectedDate] = useState(new Date());
    const [selectedNotes, setSelectedNotes] = useState([]);
    const [isPanelOpen, setIsPanelOpen] = useState(false);

    const [allProjects, setAllProjects] = useState(null);

    useEffect(() => {
        const token = localStorage.getItem('accessToken');
        // console.log('🧩 [Home] 디코딩된 사용자 ID:', userId);
        console.log(token);

        if (!token) {
            setIsLoading(false);
            return;
        }

        setIsLogin(true);

        try {
            const decoded = jwtDecode(token);
            const userId = decoded.id;

            Promise.all([
                getUserById(userId),
                getNoteHistory(),
                getProjects(), // root + 전체 프로젝트 구조
            ])
                .then(([userData, noteLogs, projects]) => {
                    setUser(userData);
                    setNoteHistory(noteLogs);
                    setAllProjects(projects);
                })
                .catch((err) => {
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

    // ---------------------------
    // 날짜 클릭 → 해당 회의록 상세 목록 만들기
    // ---------------------------
    const handleDateClick = async (date) => {
        setSelectedDate(date);

        if (!allProjects) return;

        // 해당 날짜 회의록 ID 리스트
        const logs = noteHistory.filter((n) => new Date(n.createdAt).toDateString() === date.toDateString());

        const detailed = [];

        for (const log of logs) {
            let foundNote = null;
            let foundFolder = null;

            // 모든 폴더에서 minutesList를 탐색
            for (const folder of allProjects.childFolders) {
                const minutes = folder.minutesList || [];
                const match = minutes.find((m) => m.id === log.id);

                if (match) {
                    foundNote = match;
                    foundFolder = folder;
                    break;
                }
            }

            // 매칭된 회의록만 저장
            if (foundNote && foundFolder) {
                detailed.push({
                    id: foundNote.id,
                    title: foundNote.name,
                    folderName: foundFolder.folderName,
                    createdAt: log.createdAt,
                });
            }
        }

        setSelectedNotes(detailed);
        setIsPanelOpen(true);
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
            <img src="./images/iLogLogo.png" alt="iLog Logo" style={{ width: '200px' }} /> <br />
            {isLogin ? (
                <>
                    <h3 className="fw-bold mb-4">나의 스케줄</h3>

                    <div style={{ display: 'flex', gap: '40px', alignItems: 'flex-start' }}>
                        {/* 왼쪽: 캘린더 */}
                        <div>
                            <Calendar
                                onClickDay={handleDateClick}
                                value={selectedDate}
                                calendarType="gregory"
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

                        {/* 오른쪽: 고정 박스 */}
                        <div
                            style={{
                                width: '350px',
                                background: '#fff',
                                height: '450px',
                                boxShadow: '0 0 12px rgba(0,0,0,0.15)',
                                borderRadius: '10px',
                                padding: '20px',
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
                                            marginBottom: '20px',
                                            borderBottom: '1px solid #eee',
                                            paddingBottom: '10px',
                                        }}
                                    >
                                        <div style={{ fontSize: '17px', fontWeight: 700 }}>{note.title}</div>
                                        <div style={{ fontSize: '13px', color: '#b66e03', marginTop: '3px' }}>
                                            {note.folderName}
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
                </>
            )}
        </Container>
    );
}
