// NoteCreate.jsx

import React, { useState } from 'react';
// [수정] Alert 추가
import { Container, Form, Button, Row, Col, Alert } from 'react-bootstrap';
import { PencilSquare, People, CalendarCheck, CalendarPlus, PersonPlus } from 'react-bootstrap-icons';
import { useNavigate, useLocation } from 'react-router-dom';
import MemberModal from './MemberModal';
// [수정] API 함수 임포트
import { createMeetingNote } from '../../api/note'; // 경로 확인

export default function NoteCreate() {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    // [수정] 에러 상태 추가
    const [error, setError] = useState('');

    const [showMemberModal, setShowMemberModal] = useState(false);

    // (중요) 이 parentId가 상위 폴더의 ID (예: 21)일 것입니다.
    const parentId = location.state?.parentId;

    // [수정] API 응답을 기다리므로 today를 미리 만들 필요가 없을 수 있습니다.
    // (백엔드가 생성일자를 저장한다고 가정)
    const today = new Date().toISOString().split('T')[0].replace(/-/g, '.') + '.';

    // [수정] 백엔드 연동 handleSave
    const handleSave = async () => {
        if (!parentId) {
            setError('상위 폴더 ID가 없습니다. 프로젝트 페이지에서 다시 시도해 주세요.');
            return;
        }
        if (!title.trim()) {
            setError('제목을 입력해야 합니다.');
            return;
        }

        if (isSaving) return;
        setIsSaving(true);
        setError('');

        // [수정] 백엔드로 보낼 데이터 (API 명세에 맞게 key 이름 수정 필요)
        const payload = {
            title: title || '제목 없음', // (가정) API가 'title'을 받음
            content: content, // (가정) API가 'content'를 받음
            members: ['최겸'], // (가정) API가 'members' 배열을 받음
        };

        try {
            // [수정] API 호출
            console.log(`[NoteCreate] API 호출: POST /folders/${parentId}/minutes`);
            const data = await createMeetingNote(parentId, payload);

            console.log('[NoteCreate] 저장 성공:', data);

            // 저장이 성공하면 이전 페이지(아마도 해당 폴더의 회의록 목록)로 이동
            navigate(-1);
        } catch (err) {
            console.error('❌ [NoteCreate] 저장 실패:', err);
            setError('회의록 저장에 실패했습니다.');
            setIsSaving(false); // 실패 시 버튼 활성화
        }
    };

    const handleShowMemberModal = () => setShowMemberModal(true);
    const handleCloseMemberModal = () => setShowMemberModal(false);

    return (
        <Container fluid className="pt-3 container-left">
            {/* [수정] 에러 발생 시 Alert 표시 */}
            {error && <Alert variant="danger">{error}</Alert>}

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

            {/* ... (참가자, 생성일자 등 나머지 UI는 동일) ... */}
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
                        <span>{today}</span> {/* (참고) 실제로는 저장 후 API 응답값으로 표시하는 것이 더 정확합니다 */}
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
