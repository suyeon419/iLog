import React, { useState } from 'react';
import { Container, Form, Button, Row, Col } from 'react-bootstrap';
import { PencilSquare, People, CalendarCheck, CalendarPlus, PersonPlus } from 'react-bootstrap-icons';
import { useNavigate, useLocation } from 'react-router-dom';

export default function NoteCreate() {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [isSaving, setIsSaving] = useState(false); // 1. 저장 중 상태 추가
    const navigate = useNavigate();
    const location = useLocation();

    // 부모 ID (e.g., LCK ID '1')가 있으면 하위 회의, 없으면 새 프로젝트
    const parentId = location.state?.parentId;
    const isNewProject = !parentId;

    const today = new Date().toISOString().split('T')[0].replace(/-/g, '.') + '.';

    const handleSave = async () => {
        if (isSaving) return; // 중복 저장 방지
        setIsSaving(true);

        // 3. 백엔드로 보낼 데이터 (Payload)
        const payload = {
            title: title || '제목 없음',
            content: content,
            members: ['최겸'], // TODO: 참가자 선택 기능
            created: today,
        };

        // 4. 부모가 있는지(새 프로젝트인지)에 따라 다른 API 경로
        const url = isNewProject
            ? '/api/notes' // 새 프로젝트 생성
            : `/api/notes/${parentId}/meetings`; // 하위 회의 생성

        try {
            // TODO: 백엔드 API에 POST 요청
            // const response = await fetch(url, {
            //     method: 'POST',
            //     headers: { 'Content-Type': 'application/json' },
            //     body: JSON.stringify(payload),
            // });

            // if (!response.ok) {
            //     throw new Error('Failed to save');
            // }

            // 5. 성공 시, navigate state로 데이터를 넘기는 대신, 그냥 뒤로 가기
            console.log('Saved successfully (simulation)');
            navigate(-1); // -1은 '이전 페이지로 돌아가기'
        } catch (error) {
            console.error('Failed to save:', error);
            // TODO: 에러 처리
            setIsSaving(false); // 실패 시 버튼 활성화
        }
    };

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
                    {/* 6. 저장 중일 때 버튼 비활성화 */}
                    <Button
                        variant="primary mini-btn"
                        onClick={handleSave}
                        style={{ fontWeight: 'bold' }}
                        disabled={isSaving}
                    >
                        {isSaving ? '저장 중...' : '생성'}
                    </Button>
                </Col>
            </Row>

            <Row className="mb-2 align-items-center" style={{ color: '#555' }}>
                <Col md={12}>
                    <div className="d-flex align-items-center">
                        <People style={{ marginRight: '10px' }} />
                        <span style={{ marginRight: '10px', fontWeight: 'bold' }}>참가자</span>
                        <span style={{ marginRight: '10px' }}>최겸</span>
                        <PersonPlus size={20} style={{ cursor: 'pointer' }} />
                    </div>
                </Col>
            </Row>
            <Row className="mb-3 align-items-center" style={{ color: '#555' }}>
                <Col md={6}>
                    <div className="d-flex align-items-center">
                        <CalendarCheck style={{ marginRight: '10px' }} />
                        <span style={{ marginRight: '10px', fontWeight: 'bold' }}>생성일자</span>
                        <span>{today}</span>
                    </div>
                </Col>
                <Col md={6}>
                    <div className="d-flex align-items-center">
                        <CalendarPlus style={{ marginRight: '10px' }} />
                        <span style={{ marginRight: '10px', fontWeight: 'bold' }}>수정일자</span>
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
