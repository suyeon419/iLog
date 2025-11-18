// MeetingHistory.jsx (타임라인 형식 - 중앙 정렬 수정)

import React, { useState, useEffect } from 'react';
// [수정] Row, Col, PencilSquare 제거
import { Container, Alert } from 'react-bootstrap';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { useNavigate } from 'react-router-dom';
import { getMeetingHistory } from '../../api/user';

export default function MeetingHistory() {
    const navigate = useNavigate();

    const handleRowClick = (meetingId) => {
        console.log('Clicked meeting:', meetingId);
    };

    const [groupedMeetings, setGroupedMeetings] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                setLoading(true);
                setError('');

                const data = await getMeetingHistory();

                const grouped = data.reduce((acc, item) => {
                    const date = item.createdAt.split('T')[0];
                    if (!acc[date]) acc[date] = [];
                    acc[date].push(item);
                    return acc;
                }, {});

                Object.keys(grouped).forEach((date) => {
                    grouped[date].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                });

                const sorted = Object.keys(grouped)
                    .sort((a, b) => new Date(b) - new Date(a))
                    .reduce((obj, key) => {
                        obj[key] = grouped[key];
                        return obj;
                    }, {});

                setGroupedMeetings(sorted);
            } catch (err) {
                console.error('❌ [MeetingHistory] 데이터 로드 실패:', err);
                setError('데이터를 불러오는 데 실패했습니다.');
            } finally {
                setLoading(false);
            }
        };

        fetchHistory();
    }, []);

    if (loading) {
        return (
            <Container className="pt-3 text-center">
                <LoadingSpinner animation="border" />
            </Container>
        );
    }

    if (error) {
        return (
            <Container className="pt-3 text-center">
                <Alert variant="danger">{error}</Alert>
            </Container>
        );
    }

    return (
        // [수정] <Container fluid className="pt-3 container-left"> -> <Container className="pt-3">
        <Container className="pt-3">
            {/* [수정] Row/Col 구조 제거, history-title 클래스 적용 */}
            <h3 className="history-title">화상회의 이력</h3>

            {Object.keys(groupedMeetings).length === 0 ? (
                <div className="text-center p-4">화상회의 이력이 없습니다.</div>
            ) : (
                <div className="timeline">
                    {Object.keys(groupedMeetings).map((date) => (
                        <div key={date} className="timeline-date-block">
                            <div className="timeline-date-dot"></div>
                            <div className="timeline-date-line"></div>
                            <div className="timeline-date">{date}</div>

                            {groupedMeetings[date].map((item) => (
                                <div key={item.id} className="timeline-item">
                                    <div
                                        className="timeline-card"
                                        onClick={() => handleRowClick(item.id)}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        <div className="card-title">
                                            회의 ID: {item.id} (상태: {item.status})
                                        </div>
                                        <div className="card-time">
                                            {new Date(item.createdAt).toLocaleTimeString([], {
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
            )}
        </Container>
    );
}
