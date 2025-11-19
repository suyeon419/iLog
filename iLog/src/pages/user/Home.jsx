import React, { useEffect, useState } from 'react';
import { Button, Container } from 'react-bootstrap';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { useNavigate } from 'react-router-dom';
import { getUserById } from '../../api/user';
import { getCalendarMinutes } from '../../api/note';
import { jwtDecode } from 'jwt-decode';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';

export default function Home() {
    const navigate = useNavigate();

    const [isLogin, setIsLogin] = useState(false);
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    const [calendarData, setCalendarData] = useState([]);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [selectedNotes, setSelectedNotes] = useState([]);

    useEffect(() => {
        window.scrollTo(0, 0);
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

            getUserById(userId)
                .then((userData) => {
                    setUser(userData);
                })
                .catch(() => {
                    localStorage.removeItem('accessToken');
                    setIsLogin(false);
                });
        } catch {
            localStorage.removeItem('accessToken');
            setIsLogin(false);
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        if (!isLogin) return;

        const loadCalendar = async () => {
            try {
                const list = await getCalendarMinutes();
                const grouped = convertToCalendarMap(list);

                setCalendarData(grouped);

                // 오늘 날짜 자동 표시
                const today = new Date().toISOString().split('T')[0];
                const todayData = grouped.find((g) => g.date === today);

                if (todayData) {
                    setSelectedNotes(todayData.minutes);
                }
            } catch (error) {
                console.error(error);
            } finally {
                setIsLoading(false);
            }
        };

        loadCalendar();
    }, [isLogin]);

    const convertToCalendarMap = (list) => {
        const map = {};

        list.forEach((item) => {
            const dateStr = item.createdAt.split('T')[0];
            if (!map[dateStr]) map[dateStr] = [];
            map[dateStr].push(item);
        });

        return Object.entries(map).map(([date, minutes]) => ({
            date,
            minutes,
        }));
    };

    const handleDateClick = (date) => {
        setSelectedDate(date);
        const dateStr = toLocalDateString(date);

        const target = calendarData.find((d) => d.date === dateStr);
        if (target) setSelectedNotes(target.minutes);
        else setSelectedNotes([]);
    };

    const toLocalDateString = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    if (isLoading) {
        return (
            <Container
                className="d-flex flex-column justify-content-center align-items-center"
                style={{ height: '100vh' }}
            >
                <LoadingSpinner animation="border" variant="primary" />
            </Container>
        );
    }

    return (
        <Container>
            <img className="w-25" src="./images/ko.ilo9.png" alt="iLog Logo" /> <br />
            {isLogin ? (
                <>
                    <h3 className="fw-bold mb-4">나의 스케줄</h3>

                    <div className="home-flex" style={{ display: 'flex', gap: '40px', alignItems: 'flex-start' }}>
                        {/* 캘린더 */}
                        <div className="home-calendar">
                            <Calendar
                                onClickDay={handleDateClick}
                                value={selectedDate}
                                calendarType="gregory"
                                style={{
                                    border: '1px solid #b66e03',
                                }}
                                tileContent={({ date }) => {
                                    const dateStr = toLocalDateString(date);
                                    const hasNote = calendarData.some((d) => d.date === dateStr);

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
                            className="home-right-box"
                            style={{
                                width: '350px',
                                background: '#fff',
                                height: '450px',
                                border: '1px solid #b66e03',
                                borderRadius: '10px',
                                padding: '20px',
                                boxShadow: '0 2px 10px rgba(182, 110, 3, 0.15)',

                                display: 'flex',
                                flexDirection: 'column',
                            }}
                        >
                            <div style={{ marginBottom: '10px', flexShrink: 0 }}>
                                <h4 className="mb-0">{selectedDate.toLocaleDateString('ko-KR')}</h4>
                            </div>

                            {/* 스크롤 영역 */}
                            <div
                                style={{
                                    overflowY: 'auto',
                                    flexGrow: 1,
                                    paddingRight: '5px',
                                    marginTop: '10px',
                                }}
                            >
                                {selectedNotes.length === 0 ? (
                                    <p style={{ color: '#999' }}>이 날짜에는 회의록이 없습니다.</p>
                                ) : (
                                    selectedNotes.map((note) => (
                                        <div
                                            key={note.id}
                                            onClick={() => navigate(`/notes/meeting/${note.id}`)}
                                            style={{
                                                background: '#f5f1ec',
                                                padding: '12px 15px',
                                                borderRadius: '10px',
                                                border: '1px solid #eee',
                                                marginBottom: '12px',
                                                boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.transform = 'translateY(-2px)';
                                                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.12)';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.transform = 'none';
                                                e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)';
                                            }}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <i
                                                    className="bi bi-file-earmark-text"
                                                    style={{ fontSize: '20px', color: '#b66e03' }}
                                                ></i>
                                                <span style={{ fontSize: '14px', color: '#b66e03', fontWeight: 600 }}>
                                                    {note.folderName}
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
