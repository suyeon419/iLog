// NoteCreate.jsx

import React, { useState } from 'react';
import { Container, Form, Button, Row, Col } from 'react-bootstrap';
import { PencilSquare, People, CalendarCheck, CalendarPlus, PersonPlus } from 'react-bootstrap-icons';
import { useNavigate, useLocation } from 'react-router-dom';
import MemberModal from './MemberModal';

export default function NoteCreate() {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    const [showMemberModal, setShowMemberModal] = useState(false);

    const parentId = location.state?.parentId;
    const isNewProject = !parentId;

    const today = new Date().toISOString().split('T')[0].replace(/-/g, '.') + '.';

    const handleSave = async () => {
        if (isSaving) return;
        setIsSaving(true);

        const payload = {
            title: title || '제목 없음',
            content: content,
            members: ['최겸'],
            created: today,
        };

        const url = isNewProject ? '/api/notes' : `/api/notes/${parentId}/meetings`;

        try {
            // TODO: 백엔드 API에 POST 요청
            console.log('Saved successfully (simulation)', payload, url);
            navigate(-1);
        } catch (error) {
            console.error('Failed to save:', error);
            setIsSaving(false);
        }
    };

    const handleShowMemberModal = () => setShowMemberModal(true);
    const handleCloseMemberModal = () => setShowMemberModal(false);

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
                        {isSaving ? '저장 중...' : '생성'}
                    </Button>
                </Col>
            </Row>

            <Row className="mb-2 align-items-center text-secondary">
                <Col>
                    <div className="d-flex align-items-center">
                        <People className="me-2" />
                        <span className="me-2 fw-bold">참가자</span>
                        <span className="me-2">최겸</span>
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
                        <span>{today}</span>
                    </div>
                </Col>
                <Col md={6}>
                    <div className="d-flex align-items-center">
                        <CalendarPlus className="me-2" />
                        <span className="me-2 fw-bold">수정일자</span>
                        <span>{today}</span>
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
                            /* 1. 'note-content-textarea' 클래스 추가 */
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
