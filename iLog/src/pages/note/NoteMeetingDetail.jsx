// NoteMeetingDetail.jsx (회의록 상세 페이지)

import React, { useState, useEffect } from 'react';
import {
    Container,
    Button,
    Row,
    Col,
    Dropdown,
    Alert,
    Modal, // [✅ 수정] Modal 컴포넌트 임포트
    Pagination,
} from 'react-bootstrap';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { PencilSquare, People, CalendarCheck, CalendarPlus, ThreeDotsVertical, Trash } from 'react-bootstrap-icons';
import { useNavigate, useParams } from 'react-router-dom';
import NoteAISummary from './NoteAISummary';
import FloatingChatButton from '../../components/chatbot/FloatingChatButton';
import ChatbotPanel from '../../components/chatbot/ChatbotPanel';

import {
    getNoteDetails,
    deleteNote,
    getMeetingSummary,
    getMeetingMembers,
    createMemo,
    updateMemo,
    deleteMemo,
    getNoteHistory,
    getLockStatus,
} from '../../api/note';

const ITEMS_PER_PAGE = 1;

export default function NoteMeetingDetail() {
    const [meeting, setMeeting] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [showAiSummary, setShowAiSummary] = useState(false);
    const [aiData, setAiData] = useState(null);
    const [aiLoading, setAiLoading] = useState(false);
    const [showChatbot, setShowChatbot] = useState(false);

    const [historyCurrentPage, setHistoryCurrentPage] = useState(1);

    // [✅ 추가] 락 알림 모달 상태
    const [showLockAlertModal, setShowLockAlertModal] = useState(false);

    const { meetingId } = useParams();
    const navigate = useNavigate();

    // 1. (API 1) 회의록 본문 정보 로드 (변경 없음)
    useEffect(() => {
        window.scrollTo(0, 0);

        const fetchMeeting = async () => {
            setLoading(true);
            setError('');
            try {
                const data = await getNoteDetails(meetingId);
                const membersData = await getMeetingMembers(meetingId);

                const formattedData = {
                    id: data.id,
                    name: data.title || '제목 없음',
                    content: data.content || '',
                    members:
                        membersData.participants?.length > 0
                            ? membersData.participants.map((m) => m.participantName).join(', ')
                            : '참가자 정보 없음',
                    created: data.createdAt ? new Date(data.createdAt).toLocaleDateString() : '날짜 정보 없음',
                    modified: data.updatedAt ? new Date(data.updatedAt).toLocaleDateString() : '날짜 정보 없음',
                };

                setMeeting(formattedData);
            } catch (err) {
                console.error('Failed to fetch meeting:', err);
                setError('삭제된 회의록입니다.');
            } finally {
                setLoading(false);
            }
        };

        fetchMeeting();
    }, [meetingId]);

    // [✅ 락_2] '수정' 버튼 클릭 시 락 상태 확인 로직 수정 (alert -> Modal)
    const handleEdit = async () => {
        try {
            const lockData = await getLockStatus(meetingId);

            if (lockData.locked) {
                // 락이 걸려있으면 alert 대신 모달을 띄웁니다.
                setShowLockAlertModal(true); // [✅ 수정] 모달 표시
            } else {
                navigate(`/notes/meeting/${meetingId}/edit`);
            }
        } catch (error) {
            console.error('락 상태 조회 실패:', error);
            alert('락 상태를 확인하는 중 오류가 발생했습니다.'); // 이 에러는 기존 alert 유지
        }
    };

    // 히스토리 목록으로 감 (변경 없음)
    const handleHistroy = () => {
        navigate(`/notes/meeting/${meetingId}/history`);
    };

    // '삭제' 버튼 클릭 (변경 없음)
    const handleDelete = async () => {
        if (window.confirm('정말로 이 회의록을 삭제하시겠습니까?')) {
            try {
                await deleteNote(meetingId);
                alert('회의록이 삭제되었습니다.');
                navigate(-1);
            } catch (err) {
                console.error('Failed to delete meeting:', err);
                alert('삭제에 실패했습니다.');
            }
        }
    };

    // '목록' 버튼 클릭 (변경 없음)
    const handleGoToList = () => {
        navigate(-1);
    };

    // 'AI 요약' 버튼 클릭 (변경 없음)
    const handleToggleAiSummary = async () => {
        if (showAiSummary) {
            setShowAiSummary(false);
            return;
        }

        if (aiData) {
            setShowAiSummary(true);
        } else {
            setAiLoading(true);
            try {
                const data = await getMeetingSummary(meetingId);
                setAiData(data);
                setShowAiSummary(true);
            } catch (err) {
                console.error('Failed to fetch summary:', err);
                alert('AI 요약본을 불러오는 데 실패했습니다.');
            } finally {
                setAiLoading(false);
            }
        }
    };

    // 메모 관련 핸들러 (변경 없음)
    const handleAddMemo = async (memoContent, startIndex, endIndex, selectedText) => {
        try {
            const payload = {
                content: memoContent,
                memoType: 'SELF',
                startIndex: startIndex,
                endIndex: endIndex,
                positionContent: selectedText,
            };
            console.log('📤 [메모 생성 요청] payload:', payload);

            const updatedMemos = await createMemo(meetingId, payload);

            setAiData((prevData) => ({
                ...prevData,
                memos: updatedMemos,
            }));
        } catch (error) {
            console.error('메모 생성 실패:', error);
            alert('메모 생성에 실패했습니다. (서버 오류)');
        }
    };

    const handleUpdateMemo = async (memoId, newContent) => {
        try {
            const updatedMemos = await updateMemo(meetingId, memoId, newContent);

            setAiData((prevData) => ({
                ...prevData,
                memos: updatedMemos,
            }));
        } catch (error) {
            console.error('메모 수정 실패:', error);
            alert('메모 수정에 실패했습니다. (서버 오류)');
        }
    };

    const handleDeleteMemo = async (memoId) => {
        if (window.confirm('정말로 이 메모를 삭제하시겠습니까?')) {
            try {
                await deleteMemo(meetingId, memoId);
                setAiData((prev) => {
                    const newMemos = prev.memos.filter((memo) => memo.id !== memoId);
                    return {
                        ...prev,
                        memos: newMemos,
                    };
                });
            } catch (err) {
                console.error('메모 삭제 실패:', err);
                alert('메모 삭제에 실패했습니다.');
            }
        }
    };
    // --- 렌더링 로직 ---

    if (loading) {
        return (
            <Container className="pt-3 text-center">
                <LoadingSpinner animation="border" role="status" />
                <h5 className="mt-2">로딩 중</h5>
            </Container>
        );
    }

    if (error) {
        return (
            <Container className="pt-3 text-center">
                <Alert variant="danger">{error}</Alert>
                <Button variant="outline-primary" onClick={handleGoToList}>
                    목록으로 돌아가기
                </Button>
            </Container>
        );
    }

    if (!meeting) {
        return (
            <Container className="pt-3 text-center">
                <Alert variant="warning">회의록 데이터를 찾을 수 없습니다.</Alert>
                <Button variant="outline-primary" onClick={handleGoToList}>
                    목록으로 돌아가기
                </Button>
            </Container>
        );
    }

    // (정상 렌더링)
    return (
        <Container fluid className="pt-3 container-left">
            <div className="flex-grow-1">
                <Row className="mb-3 align-items-center">
                    <Col>
                        <div className="d-flex align-items-center">
                            <PencilSquare size={30} className="me-2" />
                            <div className="noteForm py-2">{meeting.name}</div>
                        </div>
                    </Col>
                    <Col xs="auto" className="d-flex align-items-center">
                        <Button variant="outline-primary" onClick={handleGoToList} className="fw-bold me-1 mini-btn">
                            목록
                        </Button>
                        <Dropdown>
                            <Dropdown.Toggle variant="link" className="text-decoration-none dropdown-toggle">
                                <ThreeDotsVertical size={24} />
                            </Dropdown.Toggle>
                            <Dropdown.Menu style={{ backgroundColor: '#f5f1ec' }}>
                                {/* [✅ 락_3] 수정된 handleEdit 함수가 여기 연결됩니다. */}
                                <Dropdown.Item onClick={handleEdit}>
                                    <PencilSquare className="me-2" /> 수정하기
                                </Dropdown.Item>
                                <Dropdown.Divider />
                                <Dropdown.Item onClick={handleDelete}>
                                    <Trash className="me-2" /> 삭제하기
                                </Dropdown.Item>
                            </Dropdown.Menu>
                        </Dropdown>
                    </Col>
                </Row>

                <Row className="mb-2 align-items-center text-secondary">
                    <Col md={12}>
                        <div className="d-flex align-items-center">
                            <People className="me-2" />
                            <span className="me-2 fw-bold">참가자</span>
                            <span>{meeting.members}</span>
                        </div>
                    </Col>
                </Row>

                <Row className="mb-3 align-items-center text-secondary">
                    <Col md={6}>
                        <div className="d-flex align-items-center">
                            <CalendarCheck className="me-2" />
                            <span className="me-2 fw-bold">생성일자</span>
                            <span>{meeting.created}</span>
                        </div>
                    </Col>
                    <Col md={5}>
                        <div className="d-flex align-items-center">
                            <CalendarPlus className="me-2" />
                            <span className="me-2 fw-bold">수정일자</span>
                            <span>{meeting.modified}</span>
                        </div>
                    </Col>
                    <Col md={1} className="text-end">
                        <i
                            className="bi bi-clock-history fs-4 fw-bold"
                            style={{ cursor: 'pointer' }}
                            title="수정 히스토리 보기"
                            onClick={handleHistroy}
                        ></i>
                    </Col>
                </Row>

                <Row>
                    <Col>
                        {!showAiSummary ? (
                            <pre className="border p-3 rounded text-break note-box">
                                {meeting.content.replace(/\\\\n/g, '\n').replace(/\\n/g, '\n').trim()}
                            </pre>
                        ) : aiLoading ? (
                            <div className="text-center p-5 ">
                                <LoadingSpinner animation="border" />
                            </div>
                        ) : (
                            aiData && (
                                <NoteAISummary
                                    summaryText={aiData.summary}
                                    initialMemos={aiData.memos}
                                    meetingId={meetingId}
                                    onMemoAdd={handleAddMemo}
                                    onMemoUpdate={handleUpdateMemo}
                                    onMemoDelete={handleDeleteMemo}
                                />
                            )
                        )}
                    </Col>
                </Row>
            </div>

            <div>
                <Button variant="primary" className="w-100 mt-3" onClick={handleToggleAiSummary} disabled={aiLoading}>
                    {aiLoading ? '' : showAiSummary ? '회의록 본문 보기' : 'AI 요약본 보기'}
                </Button>
            </div>

            {showChatbot && <ChatbotPanel onClose={() => setShowChatbot(false)} meetingId={meetingId} />}
            <FloatingChatButton onClick={() => setShowChatbot(!showChatbot)} />

            {/* [✅ 추가] 락 알림 모달 컴포넌트 */}
            <Modal
                show={showLockAlertModal}
                onHide={() => setShowLockAlertModal(false)}
                centered
                contentClassName="lock-alert-modal-content"
            >
                {/* [✅ 스타일_2] 헤더 스타일링 */}
                <Modal.Header closeButton style={{ backgroundColor: '#f5f1ec', borderBottom: 'none' }}>
                    <Modal.Title className="fw-bold" style={{ color: '#b66e03' }}>
                        알림
                    </Modal.Title>
                </Modal.Header>
                {/* [✅ 스타일_3] 바디 스타일링 */}
                <Modal.Body className="text-center" style={{ backgroundColor: '#f5f1ec', color: '#333' }}>
                    다른 사용자가 수정 중입니다. 잠시 후 다시 시도해 주세요.
                </Modal.Body>
                {/* [✅ 스타일_4] 푸터 스타일링 */}
                <Modal.Footer style={{ backgroundColor: '#f5f1ec', borderTop: 'none' }}>
                    <Button
                        // [✅ 스타일_5] 버튼 스타일링
                        style={{ backgroundColor: '#b66e03', borderColor: '#b66e03', color: 'white' }}
                        onClick={() => setShowLockAlertModal(false)}
                    >
                        확인
                    </Button>
                </Modal.Footer>
            </Modal>
        </Container>
    );
}
