import React, { useEffect, useState } from 'react';
import { Container, Spinner } from 'react-bootstrap';
import { useParams } from 'react-router-dom';
import { getNoteHistory } from '../../api/note';
import { useNavigate } from 'react-router-dom';

export default function NoteMeetingDetailHistory() {
    const { meetingId } = useParams();
    const [groupedHistory, setGroupedHistory] = useState({});
    const [loading, setLoading] = useState(true);

    const navigate = useNavigate();

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const data = await getNoteHistory(meetingId);

                const grouped = data.reduce((acc, item) => {
                    const date = item.updatedAt.split('T')[0];
                    if (!acc[date]) acc[date] = [];
                    acc[date].push(item);
                    return acc;
                }, {});

                Object.keys(grouped).forEach((date) => {
                    grouped[date].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
                });

                const sorted = Object.keys(grouped)
                    .sort((a, b) => new Date(b) - new Date(a))
                    .reduce((obj, key) => {
                        obj[key] = grouped[key];
                        return obj;
                    }, {});

                setGroupedHistory(sorted);
            } catch (err) {
                console.error('히스토리 로드 실패:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchHistory();
    }, [meetingId]);

    if (loading) {
        return (
            <Container className="text-center mt-4">
                <Spinner />
            </Container>
        );
    }

    return (
        <Container>
            <h3 className="history-title">수정 히스토리</h3>

            <div className="timeline">
                {Object.keys(groupedHistory).map((date) => (
                    <div key={date} className="timeline-date-block">
                        {/* 날짜 dot */}
                        <div className="timeline-date-dot"></div>

                        {/* 날짜 아래로 이어지는 세로선 */}
                        <div className="timeline-date-line"></div>

                        {/* 날짜 텍스트 */}
                        <div className="timeline-date">{date}</div>

                        {/* 아이템들 */}
                        {groupedHistory[date].map((item) => (
                            <div key={item.id} className="timeline-item">
                                {/* 아이템 카드 */}
                                <div
                                    className="timeline-card"
                                    onClick={() => navigate(`/notes/meeting/${item.minutesId}/history/${item.id}`)}
                                >
                                    <div className="card-title">{item.title}</div>
                                    <div className="card-time">
                                        {new Date(item.updatedAt).toLocaleTimeString([], {
                                            hour: '2-digit',
                                            minute: '2-digit',
                                        })}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ))}
            </div>
        </Container>
    );
}
