// NoteMeetingEdit.jsx

import React, { useState, useEffect } from 'react';
import { Container, Form, Button, Row, Col, Spinner, Alert } from 'react-bootstrap'; // Spinner, Alert 추가
import { PencilSquare, People, CalendarCheck, CalendarPlus, PersonPlus } from 'react-bootstrap-icons';
import { useNavigate, useParams } from 'react-router-dom';
import MemberModal from './MemberModal';
// [✅ 수정] API 함수 임포트
import { getMeetingDetail, updateMeetingDetail } from '../../api/note';

export default function NoteMeetingEdit() {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [meetingData, setMeetingData] = useState(null); // 원본 데이터
    const [isSaving, setIsSaving] = useState(false);
    const [showMemberModal, setShowMemberModal] = useState(false);

    // [✅ 수정] 로딩 및 에러 상태 추가
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const navigate = useNavigate();
    const { meetingId } = useParams(); // URL에서 meetingId 가져오기

    // [✅ 수정] 1. 컴포넌트 로드 시 기존 회의록 데이터 불러오기 (API 연동)
    useEffect(() => {
        const fetchMeeting = async () => {
            setLoading(true);
            setError('');
            try {
                // 1. API GET 요청 (응답: { id, title, content, memos })
                const fetchedData = await getMeetingDetail(meetingId);

                // 2. [중요] 원본 데이터(meetingData) 및 수정할 state(title, content) 설정
                // state에 바로 API 응답값(title, content)을 설정
                setTitle(fetchedData.title || '제목 없음');
                setContent(fetchedData.content || '');

                // 3. (수정불가) 하단에 표시할 정보
                const formattedData = {
                    id: fetchedData.id,

                    // --- API에 없는 필드 (임시 처리) ---
                    members: fetchedData.members || '참가자 정보 없음',
                    created: fetchedData.createdAt ? new Date(fetchedData.createdAt).toLocaleDateString() : '날짜 없음',
                    modified: fetchedData.modifiedAt
                        ? new Date(fetchedData.modifiedAt).toLocaleDateString()
                        : '날짜 없음',
                };
                setMeetingData(formattedData); // 하단 정보 표시용
            } catch (err) {
                console.error('Failed to fetch meeting data:', err);
                setError('회의록 원본 데이터를 불러오는 데 실패했습니다.');
            } finally {
                setLoading(false);
            }
        };

        fetchMeeting();
    }, [meetingId]);

    // [✅ 수정] 2. '수정 완료' 버튼 클릭 시 (API 연동)
    const handleSave = async () => {
        if (isSaving) return;
        setIsSaving(true);

        // 백엔드로 전송할 데이터 (title과 content)
        const payload = {
            title: title,
            content: content,
        };

        try {
            // 백엔드 API에 PUT 또는 PATCH 요청
            await updateMeetingDetail(meetingId, payload);

            console.log('Updated successfully (API)');

            // 3. 저장이 성공하면, 한 페이지만 뒤로(NoteMeetingDetail)로 돌아가기
            navigate(-1);
        } catch (error) {
            console.error('Failed to save:', error);
            alert('저장에 실패했습니다.'); // 사용자에게 피드백
            setIsSaving(false);
        }
    };

    const handleShowMemberModal = () => setShowMemberModal(true);
    const handleCloseMemberModal = () => setShowMemberModal(false);

    // [✅ 수정] 로딩 및 에러 UI 처리
    if (loading) {
        return (
            <Container fluid className="pt-3 container-left text-center">
                <Spinner animation="border" role="status" />
                <h5 className="mt-2">원본 데이터 로딩 중...</h5>
            </Container>
        );
    }

    if (error) {
        return (
            <Container fluid className="pt-3 container-left text-center">
                <Alert variant="danger">{error}</Alert>
                <Button variant="outline-primary" onClick={() => navigate(-1)}>
                    이전 페이지로 돌아가기
                </Button>
            </Container>
        );
    }

    // (수정) 원본 데이터가 확실히 로드된 후에 UI를 렌더링
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
                        {isSaving ? '저장 중...' : '완료'}
                    </Button>
                </Col>
            </Row>

            {/* 참가자 및 날짜 정보는 수정 불가(Disabled) 상태로 표시 */}
            <Row className="mb-2 align-items-center text-secondary">
                <Col>
                    <div className="d-flex align-items-center">
                        <People className="me-2" />
                        <span className="me-2 fw-bold">참가자</span>
                        <span className="me-2">{meetingData.members}</span>
                    </div>
                </Col>
                <Col xs="auto">
                    {/* [수정] 참가자 수정은 이 페이지가 아닌 NoteDetail의 모달에서 하므로 비활성화(주석) 처리 
                         (만약 여기서도 수정이 필요하면
                         onClick={handleShowMemberModal} 활성화) */}
                    <PersonPlus size={20} style={{ cursor: 'not-allowed', opacity: 0.5 }} />
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
                        {/* 수정 페이지에서는 저장 전이므로 원본 수정일자를 표시 (저장 시 자동 갱신됨) */}
                        <span>{meetingData.modified}</span>
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

            {/* 이 페이지에서 멤버 수정 모달을 사용하지 않는다면 이 컴포넌트는 제거해도 됩니다. */}
            <MemberModal show={showMemberModal} onHide={handleCloseMemberModal} />
        </Container>
    );
}
