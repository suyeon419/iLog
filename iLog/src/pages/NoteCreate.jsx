// NoteCreate.jsx

import React, { useState } from 'react';
import { Container, Form, Button, Row, Col } from 'react-bootstrap';
import { PencilSquare, People, CalendarCheck, CalendarPlus, PersonPlus } from 'react-bootstrap-icons';
import { useNavigate, useLocation } from 'react-router-dom';

export default function NoteCreate() {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

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

    return (
        <Container fluid className="pt-3 container-left">
            <Row className="mb-3 align-items-center">
                <Col>
                    <Form.Group>
                        <Form.Label visuallyHidden>제목</Form.Label>
                        {/* 1. style을 d-flex, align-items-center 클래스로 대체 */}
                        <div className="d-flex align-items-center">
                            {/* 2. style을 me-2 클래스로 대체 */}
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
                    {/* 3. style을 fw-bold 클래스로 대체 */}
                    <Button variant="primary mini-btn" onClick={handleSave} className="fw-bold" disabled={isSaving}>
                        {isSaving ? '저장 중...' : '생성'}
                    </Button>
                </Col>
            </Row>

            {/* 4. style을 text-secondary (연한 회색) 클래스로 대체 */}
            <Row className="mb-2 align-items-center text-secondary">
                <Col md={12}>
                    <div className="d-flex align-items-center">
                        <People className="me-2" />
                        <span className="me-2 fw-bold">참가자</span>
                        <span className="me-2">최겸</span>
                        {/* 5. style (cursor) 제거, 필요시 Bootstrap 'c-pointer' 등 사용 */}
                        <PersonPlus size={20} />
                    </div>
                </Col>
            </Row>
            {/* 6. style을 text-secondary 클래스로 대체 */}
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
                        {/* 7. 요청하신 style 속성 수정 */}
                        <Form.Control
                            as="textarea"
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder="회의록을 작성하세요"
                            // 8. w-100: index.css의 width: 350px를 덮어쓰기 위해 추가
                            className="w-100"
                            // 9. rows: min-height: 400px 를 대체
                            rows={15}
                        />
                    </Form.Group>
                </Col>
            </Row>
        </Container>
    );
}
