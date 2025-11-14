// NoteMeetingEdit.jsx

// [✅ 락_1] React에서 'useRef' 임포트
import React, { useState, useEffect, useRef } from 'react';
import { Container, Form, Button, Row, Col, Spinner, Alert } from 'react-bootstrap';
import { PencilSquare, People, CalendarCheck, CalendarPlus, PersonPlus } from 'react-bootstrap-icons';
import { useNavigate, useParams } from 'react-router-dom';
import MemberModal from './MemberModal';

// [✅ 락_2] note.js에서 '락 API' 함수 3개 임포트
import {
    getNoteDetails,
    updateNote,
    getMeetingMembers,
    addMeetingMemberByEmail,
    deleteMeetingMember,
    acquireLock, // 락 획득
    refreshLock, // 락 갱신
    releaseLock, // 락 해제
} from '../../api/note';

export default function NoteMeetingEdit() {
    // 1. 회의록 본문 State
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [meetingData, setMeetingData] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // 2. '회의록' 멤버 관리를 위한 State
    const [showMemberModal, setShowMemberModal] = useState(false);
    const [meetingMembers, setMeetingMembers] = useState([]);
    const [meetingInviteLink, setMeetingInviteLink] = useState('');
    const [memberError, setMemberError] = useState('');

    // [✅ 락_3] 락(Lock) 관리를 위한 State 추가
    const [lockToken, setLockToken] = useState(null); // 서버에서 받은 락 토큰
    const [isReadOnly, setIsReadOnly] = useState(false); // 락 획득 실패 시 '읽기 전용'
    const [lockError, setLockError] = useState(''); // 락 관련 에러 메시지
    const lockTokenRef = useRef(null); // unmount 시 해제를 위한 ref

    const navigate = useNavigate();
    const { meetingId } = useParams();

    // [✅ 락_4] 컴포넌트 로드 시 '데이터 로드'와 '락 획득' 동시 수행
    useEffect(() => {
        // ref 업데이트 (useEffect cleanup에서 최신 토큰을 참조하기 위함)
        lockTokenRef.current = lockToken;
    }, [lockToken]);

    useEffect(() => {
        const fetchAndLock = async () => {
            if (!meetingId) return;

            setLoading(true);
            setError('');
            setMemberError('');

            try {
                // --- 1. 회의록 본문 정보 로드 (기존) ---
                const fetchedData = await getNoteDetails(meetingId);
                setTitle(fetchedData.title || '제목 없음');
                setContent(fetchedData.content || '');
                // ... (기존 formattedData 설정)
                const formattedData = {
                    id: fetchedData.id,
                    created: fetchedData.createdAt ? new Date(fetchedData.createdAt).toLocaleDateString() : '날짜 없음',
                    modified: fetchedData.modifiedAt
                        ? new Date(fetchedData.modifiedAt).toLocaleDateString()
                        : '날짜 없음',
                };
                setMeetingData(formattedData);

                // --- 2. 회의록 멤버 정보 로드 (기존) ---
                try {
                    const memberData = await getMeetingMembers(meetingId);
                    setMeetingMembers(memberData.participants || []);
                    setMeetingInviteLink(memberData.inviteLink || '');
                } catch (memberErr) {
                    // ... (기존 멤버 에러 처리)
                    console.error('Failed to fetch meeting members:', memberErr);
                    setMemberError('참가자 정보를 불러오는 데 실패했습니다.');
                }

                // --- 3. [✅ 락_5] 락 획득 시도 ---
                try {
                    const lockData = await acquireLock(meetingId);
                    if (lockData.token) {
                        setLockToken(lockData.token);
                        console.log('🔒 락 획득 성공:', lockData.token);
                    }
                } catch (lockErr) {
                    console.error('❌ 락 획득 실패:', lockErr.response?.data || lockErr.message);
                    setLockError('다른 사용자가 수정 중입니다. (읽기 전용)');
                    setIsReadOnly(true); // 락 획득 실패 시 읽기 전용
                }
            } catch (err) {
                console.error('Failed to fetch meeting data:', err);
                setError('회의록 원본 데이터를 불러오는 데 실패했습니다.');
            } finally {
                setLoading(false);
            }
        };

        fetchAndLock();
    }, [meetingId]);

    // [✅ 락_6] 락 갱신(refresh) 및 해제(release)를 위한 별도 Effect
    useEffect(() => {
        // 락 토큰이 없으면 아무것도 안 함
        if (!lockToken) return;

        // 1. 락 갱신 (15초마다)
        const refreshIntervalId = setInterval(async () => {
            console.log('🔄 락 갱신 시도...');
            try {
                await refreshLock(meetingId, lockToken);
                console.log('✅ 락 갱신 성공');
            } catch (err) {
                console.error('❌ 락 갱신 실패:', err);
                // 갱신 실패 시 (예: 토큰 만료, 서버 문제)
                // 락을 잃은 것으로 간주하고, 읽기 전용으로 전환
                setLockToken(null);
                setIsReadOnly(true);
                setLockError('수정 권한(락)을 잃었습니다. 페이지를 새로고침 하세요.');
                clearInterval(refreshIntervalId); // 갱신 중단
            }
        }, 15000); // 15초 (API 명세에서 10~15초 권장)

        // 2. 락 해제 (Cleanup 함수)
        const release = () => {
            // ref에 저장된 토큰을 사용 (컴포넌트 unmount 시 state가 닫힐 수 있음)
            if (lockTokenRef.current) {
                console.log('🔓 락 해제 시도...');
                // fire-and-forget (페이지 이탈이라 응답을 기다릴 수 없음)
                releaseLock(meetingId, lockTokenRef.current);
                lockTokenRef.current = null; // 중복 해제 방지
            }
        };

        // 브라우저 종료/새로고침 시 락 해제
        window.addEventListener('beforeunload', release);

        // 컴포넌트 unmount 시 (예: 뒤로가기) 락 해제
        return () => {
            clearInterval(refreshIntervalId); // 인터벌 정리
            window.removeEventListener('beforeunload', release); // 이벤트 리스너 정리
            release(); // unmount 시에도 해제
        };
    }, [meetingId, lockToken]); // lockToken이 생기거나 바뀔 때만 실행

    // '수정 완료' 버튼 클릭
    const handleSave = async () => {
        // [✅ 락_7] 읽기 전용이거나 락이 없으면 저장 불가
        if (isReadOnly || !lockToken) {
            alert(lockError || '수정 권한이 없습니다.');
            return;
        }

        if (isSaving) return;
        setIsSaving(true);

        const payload = {
            title: title,
            content: content,
            token: lockToken, // [✅ 락_8] 저장 시 락 토큰 포함
        };

        try {
            await updateNote(meetingId, payload);
            navigate(-1); // 이전 페이지로 이동 (이동 시 unmount되어 락 해제)
        } catch (error) {
            console.error('Failed to save:', error);
            // [✅ 락_9] 403 LOCK_DENIED 등 락 관련 에러 처리
            if (error.response?.status === 403) {
                setLockError('저장 실패: 수정 권한(락)이 만료되었거나 유효하지 않습니다.');
                setIsReadOnly(true);
            } else {
                alert('저장에 실패했습니다.');
            }
            setIsSaving(false);
        }
    };

    // ... (모달 핸들러, 로딩/에러 UI는 기존과 동일) ...
    const handleShowMemberModal = () => setShowMemberModal(true);
    const handleCloseMemberModal = () => setShowMemberModal(false);

    const handleMemberUpdate = (updatedMeetingMemberData) => {
        setMeetingMembers(updatedMeetingMemberData.participants || []);
        setMeetingInviteLink(updatedMeetingMemberData.inviteLink || '');
        console.log('회의록 멤버 목록이 갱신되었습니다.');
    };

    if (loading) {
        // ... (로딩 UI) ...
        return (
            <Container className="pt-3 text-center">
                <Spinner animation="border" role="status" />
                <h5 className="mt-2">원본 데이터 불러오는 중...</h5>
            </Container>
        );
    }

    if (error) {
        // ... (에러 UI) ...
        return (
            <Container className="pt-3 container-left text-center">
                <Alert variant="danger">{error}</Alert>
                <Button variant="outline-primary" onClick={() => navigate(-1)}>
                    이전 페이지로 돌아가기
                </Button>
            </Container>
        );
    }
    // ...

    return (
        <Container fluid className="pt-3 container-left">
            {/* [✅ 락_10] 락 획득 실패 시 에러 메시지 표시 */}
            {lockError && <Alert variant="warning">{lockError}</Alert>}

            {/* 제목 및 완료 버튼 */}
            <Row className="mb-3 align-items-center">
                <Col>
                    <Form.Group>
                        {/* ... */}
                        <div className="d-flex align-items-center">
                            <PencilSquare size={30} className="me-2" />
                            <Form.Control
                                className="noteForm"
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="제목을 입력하세요"
                                required
                                readOnly={isReadOnly} // [✅ 락_11] 읽기 전용 적용
                            />
                        </div>
                        <hr className="beigeHr" />
                    </Form.Group>
                </Col>
                <Col xs="auto">
                    <Button
                        variant="primary mini-btn"
                        onClick={handleSave}
                        className="fw-bold"
                        // [✅ 락_12] 읽기 전용일 때 버튼 비활성화
                        disabled={isSaving || isReadOnly}
                    >
                        {isSaving ? '저장' : '완료'}
                    </Button>
                </Col>
            </Row>

            {/* 참가자 및 날짜 정보 */}
            <Row className="mb-2 align-items-center text-secondary">
                {/* ... (기존 참가자 정보) ... */}
                <Col>
                    <div className="d-flex align-items-center">
                        <People className="me-2" />
                        <span className="me-2 fw-bold">참가자</span>

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
                    {/* [✅ 락_13] 읽기 전용일 때 멤버 추가 막기 */}
                    <PersonPlus
                        size={20}
                        style={{ cursor: isReadOnly ? 'not-allowed' : 'pointer', opacity: isReadOnly ? 0.5 : 1 }}
                        onClick={!isReadOnly ? handleShowMemberModal : undefined}
                    />
                </Col>
            </Row>

            {/* ... (기존 날짜 정보) ... */}
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
                            readOnly={isReadOnly} // [✅ 락_14] 읽기 전용 적용
                        />
                    </Form.Group>
                </Col>
            </Row>

            {/* 모달 */}
            <MemberModal
                show={showMemberModal}
                onHide={handleCloseMemberModal}
                entityId={meetingId}
                members={meetingMembers}
                inviteLink={meetingInviteLink}
                onMemberUpdate={handleMemberUpdate}
                addMemberApi={addMeetingMemberByEmail}
                deleteMemberApi={deleteMeetingMember}
            />
        </Container>
    );
}
