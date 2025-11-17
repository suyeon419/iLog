// NoteHistory.jsx (타임라인 형식 - 중앙 정렬 수정)

import React, { useState, useEffect } from 'react';
// [수정] Row, Col, PencilSquare 제거
import { Container, Alert, Spinner } from 'react-bootstrap';
import { getNoteHistory } from '../../api/user';

export default function NoteHistory() {
    const [groupedNotes, setGroupedNotes] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                setLoading(true);
                setError('');
                console.log('[NoteHistory] 회의록 이력 로드 시작...');

                const data = await getNoteHistory();
                console.log('[NoteHistory] 데이터 로드 성공:', data);

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

                setGroupedNotes(sorted);
            } catch (err) {
                console.error('❌ [NoteHistory] 데이터 로드 실패:', err);
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
                <Spinner animation="border" />
                <h5 className="mt-2">데이터를 불러오는 중입니다...</h5>
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
        // [수정] <Container fluid className="pt-3"> -> <Container className="pt-3">
        <Container className="pt-3">
            {/* [수정] Row/Col 구조 제거, history-title 클래스 적용 */}
            <h3 className="history-title">회의록 이력</h3>

            {Object.keys(groupedNotes).length === 0 ? (
                <div className="text-center p-4">회의록 이력이 없습니다.</div>
            ) : (
                <div className="timeline">
                    {Object.keys(groupedNotes).map((date) => (
                        <div key={date} className="timeline-date-block">
                            <div className="timeline-date-dot"></div>
                            <div className="timeline-date-line"></div>
                            <div className="timeline-date">{date}</div>

                            {groupedNotes[date].map((item) => (
                                <div key={item.id} className="timeline-item">
                                    <div className="timeline-card">
                                        <div className="card-title">
                                            회의록 ID: {item.id} (상태: {item.status})
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
