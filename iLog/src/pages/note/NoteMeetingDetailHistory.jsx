import React, { useEffect, useState } from 'react';
import { Container, Spinner } from 'react-bootstrap';
import { useParams } from 'react-router-dom';
import { getNoteHistory } from '../../api/note';

export default function NoteMeetingDetailHistory() {
    const { meetingId } = useParams();
    const [groupedHistory, setGroupedHistory] = useState({});
    const [loading, setLoading] = useState(true);

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
            <Container className="history-container text-center mt-4">
                <Spinner />
            </Container>
        );
    }

    return (
        <Container>
            <h3 className="history-title">수정 히스토리</h3>

            <div className="timeline">
                {Object.keys(groupedHistory).map((date) => (
                    <div key={date} className="timeline-group">
                        <div className="timeline-date">{date}</div>

                        {groupedHistory[date].map((item) => (
                            <div key={item.id} className="timeline-item">
                                <div className="timeline-dot"></div>

                                <div className="timeline-card">
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
