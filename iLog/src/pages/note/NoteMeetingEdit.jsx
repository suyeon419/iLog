// NoteMeetingEdit.jsx

import React, { useState, useEffect } from 'react';
import { Container, Form, Button, Row, Col, Spinner, Alert } from 'react-bootstrap';
import { PencilSquare, People, CalendarCheck, CalendarPlus, PersonPlus } from 'react-bootstrap-icons';
import { useNavigate, useParams } from 'react-router-dom';
import MemberModal from './MemberModal';
// [✅ 수정] note.js에 정의된 'getNoteDetails'와 'updateNote'로 임포트 변경
import { getNoteDetails, updateNote } from '../../api/note';

export default function NoteMeetingEdit() {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [meetingData, setMeetingData] = useState(null); // 원본 데이터
    const [isSaving, setIsSaving] = useState(false);
    const [showMemberModal, setShowMemberModal] = useState(false);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const navigate = useNavigate();
    const { meetingId } = useParams();

    // [✅ 수정] 1. 컴포넌트 로드 시 기존 회의록 데이터 불러오기
    useEffect(() => {
        const fetchMeeting = async () => {
            setLoading(true);
            setError('');
            try {
                // [✅ 수정] 'getMeetingDetail' -> 'getNoteDetails'로 함수명 변경
                const fetchedData = await getNoteDetails(meetingId);

                setTitle(fetchedData.title || '제목 없음');
                setContent(fetchedData.content || '');

                const formattedData = {
                    id: fetchedData.id,
                    members: fetchedData.members || '참가자 정보 없음',
                    created: fetchedData.createdAt ? new Date(fetchedData.createdAt).toLocaleDateString() : '날짜 없음',
                    modified: fetchedData.modifiedAt
                        ? new Date(fetchedData.modifiedAt).toLocaleDateString()
                        : '날짜 없음',
                };
                setMeetingData(formattedData);
            } catch (err) {
                console.error('Failed to fetch meeting data:', err);
                setError('회의록 원본 데이터를 불러오는 데 실패했습니다.');
            } finally {
                setLoading(false);
            }
        };

        fetchMeeting();
    }, [meetingId]);

    // [✅ 수정] 2. '수정 완료' 버튼 클릭 시
    const handleSave = async () => {
        if (isSaving) return;
        setIsSaving(true);

        const payload = {
            title: title,
            content: content,
        };

        // ----------------------------------------------------
        // [중요] 이 디버그 코드를 추가하세요
        console.log('DEBUG: 서버로 전송할 실제 payload:', payload);
        // ----------------------------------------------------

        try {
            // [✅ 수정] 'updateMeetingDetail' -> 'updateNote'로 함수명 변경
            await updateNote(meetingId, payload); //

            console.log('Updated successfully (API)');
            navigate(-1);
        } catch (error) {
            console.error('Failed to save:', error);
            alert('저장에 실패했습니다.');
            setIsSaving(false);
        }
    };

    const handleShowMemberModal = () => setShowMemberModal(true);
    const handleCloseMemberModal = () => setShowMemberModal(false);

    // --- 로딩 및 에러 UI (수정 없음) ---
    if (loading) {
        return (
            <Container className="pt-3 text-center">
                <Spinner animation="border" role="status" />
                <h5 className="mt-2">원본 데이터 불러오는 중...</h5>
            </Container>
        );
    }

    if (error) {
        return (
            <Container className="pt-3 container-left text-center">
                <Alert variant="danger">{error}</Alert>
                <Button variant="outline-primary" onClick={() => navigate(-1)}>
                    이전 페이지로 돌아가기
                </Button>
            </Container>
        );
    }

    if (!meetingData) {
        return <Container className="pt-3 container-left">로딩 중...</Container>;
    }
    // --- ------------------------- ---

    return (
        <Container fluid className="pt-3 container-left">
            {/* 제목 및 완료 버튼 (수정 없음) */}
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
                        {isSaving ? '저장' : '완료'}
                    </Button>
                </Col>
            </Row>

            {/* 참가자 및 날짜 정보 */}
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
                        <span>{meetingData.modified}</span>
                    </div>
                </Col>
            </Row>

            {/* 본문 (수정 없음) */}
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

            {/* 모달 (수정 없음) */}
            <MemberModal show={showMemberModal} onHide={handleCloseMemberModal} />
        </Container>
    );
}
