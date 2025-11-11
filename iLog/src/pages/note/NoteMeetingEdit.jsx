// NoteMeetingEdit.jsx

import React, { useState, useEffect } from 'react';
import { Container, Form, Button, Row, Col, Spinner, Alert } from 'react-bootstrap';
import { PencilSquare, People, CalendarCheck, CalendarPlus, PersonPlus } from 'react-bootstrap-icons';
import { useNavigate, useParams } from 'react-router-dom';
import MemberModal from './MemberModal';

// [✅ 1. note.js에서 '회의록용' API 함수 임포트]
import {
    getNoteDetails,
    updateNote,
    getMeetingMembers,
    addMeetingMemberByEmail,
    deleteMeetingMember,
} from '../../api/note';

export default function NoteMeetingEdit() {
    // 1. 회의록 본문 State
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [meetingData, setMeetingData] = useState(null); // 원본 데이터
    const [isSaving, setIsSaving] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // [✅ 2. '회의록' 멤버 관리를 위한 State]
    const [showMemberModal, setShowMemberModal] = useState(false);
    const [meetingMembers, setMeetingMembers] = useState([]); // '회의록' 참가자 배열
    const [meetingInviteLink, setMeetingInviteLink] = useState(''); // '회의록' 초대 링크
    const [memberError, setMemberError] = useState(''); // '회의록' 참가자 로딩 에러

    const navigate = useNavigate();
    const { meetingId } = useParams(); // URL에서 meetingId 가져오기

    // [✅ 3. 컴포넌트 로드 시 '회의록 본문'과 '회의록 멤버' 데이터 불러오기]
    useEffect(() => {
        const fetchMeetingData = async () => {
            if (!meetingId) return;

            setLoading(true);
            setError('');
            setMemberError('');

            try {
                // --- 1. 회의록 본문 정보 로드 ---
                const fetchedData = await getNoteDetails(meetingId);
                setTitle(fetchedData.title || '제목 없음');
                setContent(fetchedData.content || '');

                const formattedData = {
                    id: fetchedData.id,
                    created: fetchedData.createdAt ? new Date(fetchedData.createdAt).toLocaleDateString() : '날짜 없음',
                    modified: fetchedData.modifiedAt
                        ? new Date(fetchedData.modifiedAt).toLocaleDateString()
                        : '날짜 없음',
                };
                setMeetingData(formattedData);

                // --- 2. 회의록 멤버 정보 로드 (getMeetingMembers 사용) ---
                try {
                    const memberData = await getMeetingMembers(meetingId);
                    setMeetingMembers(memberData.participants || []);
                    // '회의록' API가 초대 링크를 반환한다면 (Postman 응답에는 없었음)
                    setMeetingInviteLink(memberData.inviteLink || '');
                } catch (memberErr) {
                    console.error('Failed to fetch meeting members:', memberErr);
                    // 본문 로드는 성공했으나 멤버 로드만 실패한 경우
                    setMemberError('참가자 정보를 불러오는 데 실패했습니다.');
                }
            } catch (err) {
                console.error('Failed to fetch meeting data:', err);
                setError('회의록 원본 데이터를 불러오는 데 실패했습니다.');
            } finally {
                setLoading(false);
            }
        };

        fetchMeetingData();
    }, [meetingId]);

    // '수정 완료' 버튼 클릭 (기존과 동일)
    const handleSave = async () => {
        if (isSaving) return;
        setIsSaving(true);

        const payload = {
            title: title,
            content: content,
        };

        try {
            await updateNote(meetingId, payload);
            navigate(-1); // 이전 페이지로 이동
        } catch (error) {
            console.error('Failed to save:', error);
            alert('저장에 실패했습니다.');
            setIsSaving(false);
        }
    };

    // [✅ 4. 모달 핸들러 및 콜백]
    const handleShowMemberModal = () => setShowMemberModal(true);
    const handleCloseMemberModal = () => setShowMemberModal(false);

    // 모달에서 멤버가 변경(추가/삭제)되었을 때 호출될 콜백
    const handleMemberUpdate = (updatedMeetingMemberData) => {
        setMeetingMembers(updatedMeetingMemberData.participants || []);
        // 초대 링크도 갱신될 수 있으므로
        setMeetingInviteLink(updatedMeetingMemberData.inviteLink || '');
        console.log('회의록 멤버 목록이 갱신되었습니다.');
    };

    // --- 로딩 및 에러 UI (기존과 동일) ---
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
            {/* 제목 및 완료 버튼 */}
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

            {/* [✅ 5. 참가자 및 날짜 정보 수정] */}
            <Row className="mb-2 align-items-center text-secondary">
                <Col>
                    <div className="d-flex align-items-center">
                        <People className="me-2" />
                        <span className="me-2 fw-bold">참가자</span>

                        {/* '회의록' 멤버 목록 표시 */}
                        {memberError ? (
                            <span className="text-danger small">{memberError}</span>
                        ) : (
                            <span className="me-2">
                                {meetingMembers.length > 0
                                    ? meetingMembers.map((m) => m.participantName).join(', ')
                                    : '참가자 없음'}
                            </span>
                        )}
                    </div>
                </Col>
                <Col xs="auto">
                    {/* PersonPlus 아이콘 클릭 시 모달 열기 */}
                    <PersonPlus size={20} style={{ cursor: 'pointer' }} onClick={handleShowMemberModal} />
                </Col>
            </Row>

            {/* 날짜 정보 (기존과 동일) */}
            <Row className="mb-3 align-items-center text-secondary">
                <Col md={6}>
                    <div className="d-flex align-itemsCen-ter">
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

            {/* 본문 (기존과 동일) */}
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

            {/* [✅ 6. 모달에 '회의록용' Props 전달] */}
            <MemberModal
                show={showMemberModal}
                onHide={handleCloseMemberModal}
                // 1. ID 전달 (meetingId)
                entityId={meetingId}
                // 2. State 전달
                members={meetingMembers}
                inviteLink={meetingInviteLink} // (회의록용 초대링크가 있다면)
                onMemberUpdate={handleMemberUpdate}
                // 3. "회의록용" API 함수들을 props로 전달
                addMemberApi={addMeetingMemberByEmail}
                deleteMemberApi={deleteMeetingMember}
            />
        </Container>
    );
}
