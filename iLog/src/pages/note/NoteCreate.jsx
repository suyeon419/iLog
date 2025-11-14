// NoteCreate.jsx

import React, { useState, useEffect } from 'react';
import { Container, Form, Button, Row, Col, Alert } from 'react-bootstrap';
import { PencilSquare, People, CalendarCheck, CalendarPlus, PersonPlus } from 'react-bootstrap-icons';
import { useNavigate, useLocation } from 'react-router-dom';
import MemberModal from './MemberModal';
import { createNote, getProjectDetails } from '../../api/note';

import { getUserById } from '../../api/user';
import { jwtDecode } from 'jwt-decode';

export default function NoteCreate() {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    const [error, setError] = useState('');
    const [showMemberModal, setShowMemberModal] = useState(false);

    const [user, setUser] = useState(null);
    const [isLoadingUser, setIsLoadingUser] = useState(true);

    const parentId = location.state?.parentId;
    const today = new Date().toISOString().split('T')[0].replace(/-/g, '.') + '.';

    useEffect(() => {
        const token = localStorage.getItem('accessToken');
        if (token) {
            try {
                const decoded = jwtDecode(token);
                const userId = decoded.id;

                getUserById(userId)
                    .then((data) => {
                        setUser(data);
                    })
                    .catch((err) => {
                        console.error('❌ [NoteCreate] 회원 정보 요청 실패:', err);
                        setError('사용자 정보를 불러오는 데 실패했습니다.');
                    })
                    .finally(() => {
                        setIsLoadingUser(false);
                    });
            } catch (err) {
                console.error('JWT 실패', err);
                setError('로그인 토큰이 유효하지 않습니다.');
                setIsLoadingUser(false);
            }
        } else {
            setError('로그인이 필요합니다.');
            setIsLoadingUser(false);
        }
    }, []);

    // 🚀 회의록 제목 중복 체크 → (1), (2) 붙이기
    const getUniqueTitle = async (parentId, originalTitle) => {
        // 현재 폴더의 기존 회의록 가져오기
        const project = await getProjectDetails(parentId);

        // 기존 회의록의 name 목록 추출
        const existingNames = project.minutesList.map((m) => m.name);

        // 동일 제목 없으면 그대로 사용
        if (!existingNames.includes(originalTitle)) return originalTitle;

        // (1)부터 증가시키며 새로운 제목 찾기
        let counter = 1;
        let newTitle = `${originalTitle} (${counter})`;

        while (existingNames.includes(newTitle)) {
            counter++;
            newTitle = `${originalTitle} (${counter})`;
        }

        return newTitle;
    };

    const handleSave = async () => {
        if (!parentId) {
            setError('상위 폴더 ID가 없습니다. 프로젝트 페이지에서 다시 시도해 주세요.');
            return;
        }
        if (!title.trim()) {
            setError('제목을 입력해야 합니다.');
            return;
        }
        if (isLoadingUser || !user) {
            setError('사용자 정보를 로드 중입니다. 잠시 후 다시 시도해 주세요.');
            return;
        }

        if (isSaving) return;
        setIsSaving(true);
        setError('');

        try {
            const finalTitle = await getUniqueTitle(parentId, title.trim());

            const payload = {
                title: finalTitle || '제목 없음',
                content: content,
                members: [user?.name || '참가자'],
            };

            console.log(`[NoteCreate] API 호출: POST /folders/${parentId}/minutes`);
            const data = await createNote(parentId, payload);

            console.log('[NoteCreate] 저장 성공:', data);
            navigate(-1);
        } catch (err) {
            console.error('❌ [NoteCreate] 저장 실패:', err);
            setError('회의록 저장에 실패했습니다.');
            setIsSaving(false);
        }
    };

    const handleShowMemberModal = () => setShowMemberModal(true);
    const handleCloseMemberModal = () => setShowMemberModal(false);

    const currentUserName = isLoadingUser ? '로딩 중...' : user?.name || '정보 없음';

    return (
        <Container fluid className="pt-3 container-left">
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
                    <Button
                        variant="primary"
                        onClick={handleSave}
                        className="mini-btn fw-bold"
                        disabled={isSaving || isLoadingUser}
                    >
                        {isSaving ? '저장' : '생성'}
                    </Button>
                </Col>
            </Row>

            {/* 참가자 */}
            <Row className="mb-2 align-items-center text-secondary">
                <Col>
                    <div className="d-flex align-items-center">
                        <People className="me-2" />
                        <span className="me-2 fw-bold">참가자</span>
                        <span className="me-2">{currentUserName}</span>
                    </div>
                </Col>
                <Col xs="auto">
                    <PersonPlus size={20} style={{ cursor: 'pointer' }} onClick={handleShowMemberModal} />
                </Col>
            </Row>

            {/* ✅ [수정] 생성일자 Row (수정일자 Col 제거) */}
            <Row className="mb-3 align-items-center text-secondary">
                <Col>
                    {' '}
                    {/* md={6} -> Col로 변경하여 한 줄을 다 쓰도록 함 */}
                    <div className="d-flex align-items-center">
                        <CalendarCheck className="me-2" />
                        <span className="me-2 fw-bold">생성일자</span>
                        <span>{today}</span>
                    </div>
                </Col>
                {/* 수정일자 Col이 삭제되었습니다. */}
            </Row>

            {/* 본문 */}
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
