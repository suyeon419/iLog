// NoteMeetingEdit.jsx

import React, { useState, useEffect } from 'react';
import { Container, Form, Button, Row, Col } from 'react-bootstrap';
import { PencilSquare, People, CalendarCheck, CalendarPlus } from 'react-bootstrap-icons';
import { useNavigate, useParams } from 'react-router-dom';

// 1. 더미 데이터 (이전과 동일)
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
    const [members, setMembers] = useState('');
    const [createdDate, setCreatedDate] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const navigate = useNavigate();
    const { meetingId } = useParams();

    // 2. 컴포넌트 마운트 시 데이터 불러오기 (이전과 동일)
    useEffect(() => {
        // TODO: API 호출
        setTitle(DUMMY_MEETING_DETAIL.name);
        setContent(DUMMY_MEETING_DETAIL.content);
        setMembers(DUMMY_MEETING_DETAIL.members);
        setCreatedDate(DUMMY_MEETING_DETAIL.created);
    }, [meetingId]);

    // 3. '완료' 버튼 클릭 시 저장 및 이동 (이전과 동일)
    const handleSave = async () => {
        if (isSaving) return;
        setIsSaving(true);
        const today = new Date().toISOString().split('T')[0].replace(/-/g, '.') + '.';
        const payload = {
            title: title,
            content: content,
            members: members.split(' '),
            modified: today,
        };
        console.log('Saved successfully (simulation)', payload);

        // 요청하신 대로 NoteDetail (목록) 페이지로 돌아가기
        navigate(-2);
    };

    const today = new Date().toISOString().split('T')[0].replace(/-/g, '.') + '.';

    // 4. 레이아웃 style 속성을 모두 className으로 변경
    return (
        <Container fluid className="pt-3 container-left">
            {/* 5. Bootstrap의 d-flex, align-items-center 사용 */}
            <Row className="mb-3 align-items-center">
                <Col>
                    <Form.Group>
                        <Form.Label visuallyHidden>제목</Form.Label>
                        <div className="d-flex align-items-center">
                            {/* 6. Bootstrap의 me-2 (margin-end: 2) 사용 */}
                            <PencilSquare size={30} className="me-2" />
                            <Form.Control
                                // 7. index.css의 .noteForm 클래스 사용
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
                    {/* 8. Bootstrap의 fw-bold (font-weight: bold) 사용 */}
                    <Button variant="primary mini-btn" onClick={handleSave} className="fw-bold" disabled={isSaving}>
                        {isSaving ? '저장 중...' : '완료'}
                    </Button>
                </Col>
            </Row>

            {/* 9. Bootstrap의 text-secondary (연한 회색) 사용 */}
            <Row className="mb-2 align-items-center text-secondary">
                <Col md={12}>
                    <div className="d-flex align-items-center">
                        <People className="me-2" />
                        {/* 10. Bootstrap의 me-2, fw-bold 사용 */}
                        <span className="me-2 fw-bold">참가자</span>
                        <Form.Control
                            type="text"
                            value={members}
                            onChange={(e) => setMembers(e.target.value)}
                            // 11. .form-control 기본 스타일을 덮어쓰기 위해
                            // Bootstrap의 border-0, shadow-none, p-0 사용
                            className="border-0 shadow-none p-0"
                        />
                    </div>
                </Col>
            </Row>
            {/* 12. Bootstrap의 text-secondary 사용 */}
            <Row className="mb-3 align-items-center text-secondary">
                <Col md={6}>
                    <div className="d-flex align-items-center">
                        <CalendarCheck className="me-2" />
                        <span className="me-2 fw-bold">생성일자</span>
                        <span>{createdDate}</span>
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
                            // 13. index.css의 .form-control(width: 350px)을 덮어쓰기 위해
                            // Bootstrap의 w-100 (width: 100%) 사용
                            className="w-100"
                            // 최소 높이를 위해 rows 속성 사용
                            rows={15}
                        />
                    </Form.Group>
                </Col>
            </Row>
        </Container>
    );
}
