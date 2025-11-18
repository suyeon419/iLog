import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Button, Alert } from 'react-bootstrap';
import { PencilSquare, CalendarCheck, CalendarPlus } from 'react-bootstrap-icons';
import { useParams, useNavigate } from 'react-router-dom';
import { getNoteHistory } from '../../api/note';
import NoteAISummary from './NoteAISummary';
import { LoadingSpinner } from '../../components/LoadingSpinner';

export default function NoteMeetingDetailHistoryDetail() {
    const { meetingId, historyId } = useParams();
    const navigate = useNavigate();

    const [history, setHistory] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // MeetingDetail과 동일하게 토글 상태 추가
    const [showAiSummary, setShowAiSummary] = useState(false);

    useEffect(() => {
        window.scrollTo(0, 0);

        const fetchHistoryDetail = async () => {
            try {
                const list = await getNoteHistory(meetingId);
                const item = list.find((h) => String(h.id) === String(historyId));

                if (!item) {
                    setError('해당 히스토리를 찾을 수 없습니다.');
                    return;
                }

                setHistory({
                    id: item.id,
                    title: item.title,
                    content: item.content,
                    summary: item.summary,
                    created: new Date(item.createdAt).toLocaleString(),
                    modified: new Date(item.updatedAt).toLocaleString(),
                    memos: item.memos || [],
                });
            } catch (err) {
                console.error('히스토리 로드 실패:', err);
                setError('히스토리 데이터를 가져오는 중 오류가 발생했습니다.');
            } finally {
                setLoading(false);
            }
        };

        fetchHistoryDetail();
    }, [meetingId, historyId]);

    const handleGoBack = () => navigate(-1);

    const handleToggleAiSummary = () => {
        setShowAiSummary((prev) => !prev);
    };

    // 로딩 화면
    if (loading) {
        return (
            <Container className="pt-3 text-center">
                <LoadingSpinner animation="border" />
            </Container>
        );
    }

    // 에러
    if (error) {
        return (
            <Container className="pt-3 text-center">
                <Alert variant="danger">{error}</Alert>
                <Button variant="outline-primary" onClick={handleGoBack}>
                    뒤로가기
                </Button>
            </Container>
        );
    }

    // 정상 화면
    return (
        <Container fluid className="pt-3 container-left">
            <div className="flex-grow-1">
                {/* 제목 */}
                <Row className="mb-3 align-items-center">
                    <Col>
                        <div className="d-flex align-items-center">
                            <PencilSquare size={30} className="me-2" />
                            <div className="noteForm py-2">{history.title}</div>
                        </div>
                    </Col>

                    {/* 오른쪽 버튼 */}
                    <Col xs="auto" className="d-flex align-items-center">
                        <Button variant="outline-primary" className="fw-bold me-1 mini-btn" onClick={handleGoBack}>
                            목록
                        </Button>
                    </Col>
                </Row>

                {/* 생성/수정일 */}
                <Row className="mb-3 align-items-center text-secondary">
                    <Col md={6}>
                        <div className="d-flex align-items-center">
                            <CalendarCheck className="me-2" />
                            <span className="fw-bold me-2">생성일자</span>
                            <span>{history.created}</span>
                        </div>
                    </Col>

                    <Col md={6}>
                        <div className="d-flex align-items-center">
                            <CalendarPlus className="me-2" />
                            <span className="fw-bold me-2">수정일자</span>
                            <span>{history.modified}</span>
                        </div>
                    </Col>
                </Row>

                {/* 본문 / AI 요약 토글 */}
                <Row>
                    <Col>
                        {!showAiSummary ? (
                            // 본문 화면
                            <pre className="border p-3 rounded text-break note-box">
                                {history.content.replace(/\\\\n/g, '\n').replace(/\\n/g, '\n').trim()}
                            </pre>
                        ) : (
                            // AI 요약 화면 — NoteAISummary 그대로 사용
                            <NoteAISummary
                                summaryText={history.summary}
                                initialMemos={history.memos}
                                meetingId={meetingId}
                                // 메모 편집 기능 OFF (읽기 전용)
                                onMemoAdd={null}
                                onMemoUpdate={null}
                                onMemoDelete={null}
                            />
                        )}
                    </Col>
                </Row>
            </div>

            {/* 하단 버튼 (MeetingDetail과 동일) */}
            <div>
                <Button variant="primary" className="w-100 mt-3" onClick={handleToggleAiSummary}>
                    {showAiSummary ? '본문 보기' : 'AI 요약본 보기'}
                </Button>
            </div>
        </Container>
    );
}
