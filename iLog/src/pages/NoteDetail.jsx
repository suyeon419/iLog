// NoteMeetingDetail.jsx

import React, { useState, useEffect } from 'react';
import { Container, Button, Row, Col, Dropdown } from 'react-bootstrap';
import { PencilSquare, People, CalendarCheck, CalendarPlus, ThreeDotsVertical, Trash } from 'react-bootstrap-icons';
import { useNavigate, useParams } from 'react-router-dom';
import NoteAISummary from './NoteAISummary';

const DUMMY_MEETING_DETAIL = {
    id: 101,
    name: '개발 진행 회의',
    members: '김가현 김우혁 이수연 최겸',
    created: '2025.00.00.',
    modified: '2025.00.00.',
    content: `오늘은 백엔드와 프론트엔드를 나누어 각자 개발을 합니다.
[기능 회의]
화상회의 AI 회의록 기능은...(이하 생략)`,
    aiSummaryText: `AI 요약
■ 개발 분업
• 프론트엔드: UI 구현 및 사용자 인터랙션
... (이하 생략) ...`,
    initialMemos: [
        { id: 1, person: '이수연', note: '프론트엔드: 공개/비공개 날짜를 캘린더로 할 것' },
        { id: 2, person: '김가현', note: '비용 관련 이슈로 일단 기본 기능만' },
    ],
};

export default function NoteMeetingDetail() {
    const [meeting, setMeeting] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showAiSummary, setShowAiSummary] = useState(false);
    const { meetingId } = useParams();
    const navigate = useNavigate();

    useEffect(() => {
        setLoading(true);
        setMeeting(DUMMY_MEETING_DETAIL);
        setLoading(false);
    }, [meetingId]);

    // '수정하기' 버튼 클릭 시, /edit 경로로 이동합니다. (정상)
    const handleEdit = () => {
        navigate(`/notes/meeting/${meetingId}/edit`);
    };

    const handleDelete = () => {
        alert('삭제 기능 구현 필요');
    };

    const handleGoToList = () => {
        navigate(-1);
    };

    if (loading || !meeting) {
        return (
            <Container fluid className="pt-3 text-center">
                <h5>로딩 중...</h5>
            </Container>
        );
    }

    return (
        <Container fluid className="pt-3 container-left">
            <Row className="mb-3 align-items-center">
                <Col>
                    <div className="d-flex align-items-center">
                        <PencilSquare size={30} className="me-2" />
                        <div className="noteForm py-2">{meeting.name}</div>
                    </div>
                    <hr className="beigeHr" />
                </Col>

                <Col xs="auto" className="d-flex align-items-center">
                    <Button variant="outline-primary" onClick={handleGoToList} className="fw-bold me-1 mini-btn">
                        목록
                    </Button>

                    <Dropdown>
                        <Dropdown.Toggle
                            variant="link"
                            id="note-options-dropdown"
                            className="text-dark text-decoration-none p-0"
                        >
                            <ThreeDotsVertical size={24} />
                        </Dropdown.Toggle>

                        <Dropdown.Menu style={{ backgroundColor: '#f5f1ec' }}>
                            <Dropdown.Item onClick={handleEdit}>
                                <PencilSquare className="me-2" /> 수정하기
                            </Dropdown.Item>

                            <Dropdown.Divider />

                            <Dropdown.Item onClick={handleDelete}>
                                <Trash className="me-2" /> 삭제하기
                            </Dropdown.Item>
                        </Dropdown.Menu>
                    </Dropdown>
                </Col>
            </Row>

            <Row className="mb-2 align-items-center text-secondary">
                <Col md={12}>
                    <div className="d-flex align-items-center">
                        <People className="me-2" />
                        <span className="me-2 fw-bold">참가자</span>
                        <span>{meeting.members}</span>
                    </div>
                </Col>
            </Row>
            <Row className="mb-3 align-items-center text-secondary">
                <Col md={6}>
                    <div className="d-flex align-items-center">
                        <CalendarCheck className="me-2" />
                        <span className="me-2 fw-bold">생성일자</span>
                        <span>{meeting.created}</span>
                    </div>
                </Col>
                <Col md={6}>
                    <div className="d-flex align-items-center">
                        <CalendarPlus className="me-2" />
                        <span className="me-2 fw-bold">수정일자</span>
                        <span>{meeting.modified}</span>
                    </div>
                </Col>
            </Row>
            <Row>
                <Col>
                    {!showAiSummary ? (
                        <pre className="border p-3 rounded text-break">{meeting.content}</pre>
                    ) : (
                        <NoteAISummary summaryText={meeting.aiSummaryText} initialMemos={meeting.initialMemos} />
                    )}
                </Col>
            </Row>

            <Button variant="primary" className="w-100 mt-3" onClick={() => setShowAiSummary(!showAiSummary)}>
                {showAiSummary ? '회의록 본문 보기' : 'AI 요약본 보기'}
            </Button>
        </Container>
    );
}
