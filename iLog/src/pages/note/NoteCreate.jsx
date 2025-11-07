// NoteCreate.jsx

import React, { useState, useEffect } from 'react'; // 1. useEffect 추가
import { Container, Form, Button, Row, Col, Alert } from 'react-bootstrap';
import { PencilSquare, People, CalendarCheck, CalendarPlus, PersonPlus } from 'react-bootstrap-icons';
import { useNavigate, useLocation } from 'react-router-dom';
import MemberModal from './MemberModal';
import { createNote } from '../../api/note';

// 2. Settings.jsx에서 사용한 API와 라이브러리를 그대로 가져옵니다.
import { getUserById } from '../../api/user'; // (Settings.jsx 4줄 참고)
import { jwtDecode } from 'jwt-decode'; // (Settings.jsx 5줄 참고)

export default function NoteCreate() {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    const [error, setError] = useState('');
    const [showMemberModal, setShowMemberModal] = useState(false);

    // 3. Settings.jsx처럼 사용자 정보를 담을 state를 만듭니다.
    const [user, setUser] = useState(null);
    // (선택) 사용자 정보 로딩 중인지 확인
    const [isLoadingUser, setIsLoadingUser] = useState(true);

    const parentId = location.state?.parentId;
    const today = new Date().toISOString().split('T')[0].replace(/-/g, '.') + '.';

    // 4. Settings.jsx의 useEffect 로직을 적용합니다.
    useEffect(() => {
        const token = localStorage.getItem('accessToken');
        if (token) {
            try {
                const decoded = jwtDecode(token);
                const userId = decoded.id; // 토큰에서 사용자 ID 추출

                // 사용자 ID로 API 호출
                getUserById(userId)
                    .then((data) => {
                        setUser(data); // state에 사용자 정보 저장
                    })
                    .catch((err) => {
                        console.error('❌ [NoteCreate] 회원 정보 요청 실패:', err);
                        setError('사용자 정보를 불러오는 데 실패했습니다.');
                    })
                    .finally(() => {
                        setIsLoadingUser(false); // 로딩 완료
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
    }, []); // 페이지 로드 시 1회만 실행

    const handleSave = async () => {
        if (!parentId) {
            setError('상위 폴더 ID가 없습니다. 프로젝트 페이지에서 다시 시도해 주세요.');
            return;
        }
        if (!title.trim()) {
            setError('제목을 입력해야 합니다.');
            return;
        }
        // 5. 사용자 정보가 로드되기 전이면 저장 방지
        if (isLoadingUser || !user) {
            setError('사용자 정보를 로드 중입니다. 잠시 후 다시 시도해 주세요.');
            return;
        }

        if (isSaving) return;
        setIsSaving(true);
        setError('');

        const payload = {
            title: title || '제목 없음',
            content: content,
            // 6. state에 저장된 user의 이름을 사용합니다.
            members: [user?.name || '참가자'],
        };

        try {
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

    // 7. 사용자 정보 로딩 상태에 따라 이름을 표시합니다.
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
                    {/* 8. 사용자 로딩 중일 때도 '생성' 버튼 비활성화 */}
                    <Button
                        variant="primary"
                        className="mini-btn fw-bold"
                        onClick={handleSave}
                        disabled={isSaving || isLoadingUser}
                    >
                        {isSaving ? '저장 중...' : '생성'}
                    </Button>
                </Col>
            </Row>

            {/* 참가자 */}
            <Row className="mb-2 align-items-center text-secondary">
                <Col>
                    <div className="d-flex align-items-center">
                        <People className="me-2" />
                        <span className="me-2 fw-bold">참가자</span>
                        {/* 9. state 기반의 사용자 이름 표시 */}
                        <span className="me-2">{currentUserName}</span>
                    </div>
                </Col>
                <Col xs="auto">
                    <PersonPlus size={20} style={{ cursor: 'pointer' }} onClick={handleShowMemberModal} />
                </Col>
            </Row>

            {/* 생성일자 / 수정일자 */}
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
