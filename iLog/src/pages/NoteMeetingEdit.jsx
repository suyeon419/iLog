// NoteMeetingEdit.jsx (새 파일)

import React, { useState, useEffect } from 'react';
import { Container, Form, Button, Row, Col } from 'react-bootstrap';
import { PencilSquare, People, CalendarCheck, CalendarPlus } from 'react-bootstrap-icons';
import { useNavigate, useParams } from 'react-router-dom';

// 1. NoteMeetingDetail에서 가져온 더미 데이터 (원래는 API로 가져와야 함)
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
    // 2. 폼 데이터를 관리할 state (NoteCreate와 유사)
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [members, setMembers] = useState('');
    const [createdDate, setCreatedDate] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const navigate = useNavigate();
    const { meetingId } = useParams(); // 3. URL에서 수정할 meetingId를 가져옴

    // 4. 컴포넌트 마운트 시, 기존 데이터를 불러와 state에 채워넣음
    useEffect(() => {
        // TODO: 실제로는 API로 /api/notes/meeting/${meetingId} 호출
        console.log(`Editing meeting with ID: ${meetingId}`);
        // 더미 데이터를 state에 설정
        setTitle(DUMMY_MEETING_DETAIL.name);
        setContent(DUMMY_MEETING_DETAIL.content);
        setMembers(DUMMY_MEETING_DETAIL.members);
        setCreatedDate(DUMMY_MEETING_DETAIL.created);
    }, [meetingId]); // meetingId가 바뀔 때마다 실행

    // 5. '완료' 버튼 클릭 시
    const handleSave = async () => {
        if (isSaving) return;
        setIsSaving(true);

        const today = new Date().toISOString().split('T')[0].replace(/-/g, '.') + '.';

        // 6. 백엔드로 보낼 수정된 데이터 (Payload)
        const payload = {
            title: title,
            content: content,
            members: members.split(' '), // (예시: 공백으로 나눠 배열로)
            modified: today,
        };

        // 7. 수정 API 경로 (PUT 또는 PATCH)
        const url = `/api/notes/meeting/${meetingId}`;

        try {
            // TODO: 백엔드 API에 PUT 또는 PATCH 요청
            // const response = await fetch(url, {
            //     method: 'PUT', // 또는 'PATCH'
            //     headers: { 'Content-Type': 'application/json' },
            //     body: JSON.stringify(payload),
            // });

            console.log('Saved successfully (simulation)', payload);

            // 8. 요청대로 NoteDetail.jsx (목록)로 돌아가기
            // 경로: NoteDetail (목록) -> NoteMeetingDetail (상세) -> NoteMeetingEdit (수정)
            // -1을 하면 NoteMeetingDetail로 돌아가므로, -2를 해야 NoteDetail로 돌아갑니다.
            navigate(-2);
        } catch (error) {
            console.error('Failed to save:', error);
            setIsSaving(false);
        }
    };

    const today = new Date().toISOString().split('T')[0].replace(/-/g, '.') + '.';

    // 9. 폼 레이아웃은 NoteCreate.jsx와 거의 동일
    return (
        <Container fluid className="pt-3 container-left">
            <Row className="mb-3 align-items_center">
                <Col>
                    <Form.Group>
                        <Form.Label visuallyHidden>제목</Form.Label>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                            <PencilSquare size={30} style={{ marginRight: '10px' }} />
                            <Form.Control
                                className="noteForm"
                                type="text"
                                value={title} // state와 연결
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="제목을 입력하세요"
                                required
                            />
                        </div>
                        <hr className="beigeHr" />
                    </Form.Group>
                </Col>
                <Col xs="auto">
                    {/* 10. 버튼 텍스트 '완료'로 변경 (이미지 참고) */}
                    <Button
                        variant="primary mini-btn"
                        onClick={handleSave}
                        style={{ fontWeight: 'bold' }}
                        disabled={isSaving}
                    >
                        {isSaving ? '저장 중...' : '완료'}
                    </Button>
                </Col>
            </Row>

            <Row className="mb-2 align-items-center" style={{ color: '#555' }}>
                <Col md={12}>
                    <div className="d-flex align-items-center">
                        <People style={{ marginRight: '10px' }} />
                        <span style={{ marginRight: '10px', fontWeight: 'bold' }}>참가자</span>
                        {/* 11. 참가자도 수정 가능하도록 Form.Control 사용 */}
                        <Form.Control
                            type="text"
                            value={members} // state와 연결
                            onChange={(e) => setMembers(e.target.value)}
                            style={{ border: 'none', boxShadow: 'none', padding: 0 }}
                        />
                    </div>
                </Col>
            </Row>
            <Row className="mb-3 align-items-center" style={{ color: '#555' }}>
                <Col md={6}>
                    <div className="d-flex align-items-center">
                        <CalendarCheck style={{ marginRight: '10px' }} />
                        <span style={{ marginRight: '10px', fontWeight: 'bold' }}>생성일자</span>
                        <span>{createdDate}</span> {/* state에서 불러온 생성일자 */}
                    </div>
                </Col>
                <Col md={6}>
                    <div className="d-flex align-items-center">
                        <CalendarPlus style={{ marginRight: '10px' }} />
                        <span style={{ marginRight: '10px', fontWeight: 'bold' }}>수정일자</span>
                        <span>{today}</span> {/* 수정일자는 오늘 날짜로 표시 */}
                    </div>
                </Col>
            </Row>
            <Row>
                <Col>
                    <Form.Group>
                        <Form.Label visuallyHidden>회의록 내용</Form.Label>
                        <Form.Control
                            as="textarea"
                            value={content} // state와 연결
                            onChange={(e) => setContent(e.target.value)}
                            placeholder="회의록을 작성하세요"
                            style={{
                                border: '1px solid #eee',
                                boxShadow: 'none',
                                minHeight: '400px',
                                resize: 'none',
                                fontSize: '1rem',
                                color: '#333',
                            }}
                        />
                    </Form.Group>
                </Col>
            </Row>
        </Container>
    );
}
