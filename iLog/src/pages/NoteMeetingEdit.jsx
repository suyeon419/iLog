// NoteMeetingEdit.jsx

import React, { useState, useEffect } from 'react';
import { Container, Form, Button, Row, Col } from 'react-bootstrap';
import { PencilSquare, People, CalendarCheck, CalendarPlus, PersonPlus } from 'react-bootstrap-icons';
import { useNavigate, useParams } from 'react-router-dom';
import MemberModal from './MemberModal';

// (임시) 상세 페이지의 더미 데이터를 가져왔다고 가정
const DUMMY_MEETING_DETAIL = {
    id: 101,
    name: '개발 진행 회의',
    members: '김가현 김우혁 이수연 최겸',
    created: '2025.00.00.',
    modified: '2025.00.00.',
    content: `오늘은 백엔드와 프론트엔드를 나누어 각자 개발을 합니다.
[기능 회의]
화상회의 AI 회의록 기능은...(이하 생략)`,
};

export default function NoteMeetingEdit() {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [meetingData, setMeetingData] = useState(null); // 원본 데이터
    const [isSaving, setIsSaving] = useState(false);
    const [showMemberModal, setShowMemberModal] = useState(false);

    const navigate = useNavigate();
    const { meetingId } = useParams(); // URL에서 meetingId 가져오기

    // 1. 컴포넌트 로드 시 기존 회의록 데이터 불러오기
    useEffect(() => {
        // TODO: 실제로는 /api/meetings/${meetingId} GET 요청
        const fetchedData = DUMMY_MEETING_DETAIL;

        setMeetingData(fetchedData);
        setTitle(fetchedData.name);
        setContent(fetchedData.content);
    }, [meetingId]);

    // 2. '수정 완료' 버튼 클릭 시
    const handleSave = async () => {
        if (isSaving) return;
        setIsSaving(true);

        const payload = {
            title: title,
            content: content,
        };

        try {
            // TODO: 백엔드 API에 PUT 또는 PATCH 요청
            console.log('Updated successfully (simulation)', payload);

            // 3. 저장이 성공하면, 한 페이지만 뒤로(NoteMeetingDetail)로 돌아가기
            navigate(-1); // <-- -2 에서 다시 -1 로 변경!
        } catch (error) {
            console.error('Failed to save:', error);
            setIsSaving(false);
        }
    };

    const handleShowMemberModal = () => setShowMemberModal(true);
    const handleCloseMemberModal = () => setShowMemberModal(false);

    if (!meetingData) {
        return (
            <Container fluid className="pt-3 container-left">
                로딩 중...
            </Container>
        );
    }

    return (
        <Container fluid className="pt-3 container-left">
            <Row className="mb-3 align-items-center">
                <Col>
                    <Form.Group>
                        <Form.Label visuallyHidden>제목</Form.Label>
                        <div className="d-flex align-items-center">
                            <PencilSquare size={30} className="me-2" />
                            <Form.Control
                                className="noteForm"
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="제목을 입력하세요"
                                required
                            />
                        </div>
                        <hr className="beigeHr" />
                    </Form.Group>
                </Col>
                <Col xs="auto">
                    <Button variant="primary mini-btn" onClick={handleSave} className="fw-bold" disabled={isSaving}>
                        {isSaving ? '저장 중...' : '수정 완료'}
                    </Button>
                </Col>
            </Row>

            <Row className="mb-2 align-items-center text-secondary">
                <Col>
                    <div className="d-flex align-items-center">
                        <People className="me-2" />
                        <span className="me-2 fw-bold">참가자</span>
                        <span className="me-2">{meetingData.members}</span>
                    </div>
                </Col>
                <Col xs="auto">
                    <PersonPlus size={20} style={{ cursor: 'pointer' }} onClick={handleShowMemberModal} />
                </Col>
            </Row>

            <Row className="mb-3 align-items-center text-secondary">
                <Col md={6}>
                    <div className="d-flex align-items-center">
                        <CalendarCheck className="me-2" />
                        <span className="me-2 fw-bold">생성일자</span>
                        <span>{meetingData.created}</span>
                    </div>
                </Col>
                <Col md={6}>
                    <div className="d-flex align-items-center">
                        <CalendarPlus className="me-2" />
                        <span className="me-2 fw-bold">수정일자</span>
                        <span>{new Date().toISOString().split('T')[0].replace(/-/g, '.') + '.'}</span>
                    </div>
                </Col>
            </Row>

            <Row>
                <Col>
                    <Form.Group>
                        <Form.Label visuallyHidden>회의록 내용</Form.Label>
                        <Form.Control
                            as="textarea"
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder="회의록을 작성하세요"
                            className="w-100 note-content-textarea"
                            rows={15}
                        />
                    </Form.Group>
                </Col>
            </Row>

            <MemberModal show={showMemberModal} onHide={handleCloseMemberModal} />
        </Container>
    );
}
