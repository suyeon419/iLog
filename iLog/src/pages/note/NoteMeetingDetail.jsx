// NoteMeetingDetail.jsx (히스토리 모달 + 페이지네이션 기능 추가)

import React, { useState, useEffect } from 'react';
import {
    Container,
    Button,
    Row,
    Col,
    Dropdown,
    Spinner,
    Alert,
    Modal,
    Pagination, // [✅ 추가] Pagination 컴포넌트 import
} from 'react-bootstrap';
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
    getLockStatus, // [✅ 락_1] getLockStatus API 임포트
} from '../../api/note';

// [✅ 추가] 페이지네이션 설정: 한 페이지에 보여줄 히스토리 개수
const ITEMS_PER_PAGE = 1;

export default function NoteMeetingDetail() {
    const [meeting, setMeeting] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // ( ... ai, chatbot 관련 state ... )
    const [showAiSummary, setShowAiSummary] = useState(false);
    const [aiData, setAiData] = useState(null);
    const [aiLoading, setAiLoading] = useState(false);
    const [showChatbot, setShowChatbot] = useState(false);

    // [✅ 수정] 히스토리 모달 관련 state

    const [historyCurrentPage, setHistoryCurrentPage] = useState(1); // [✅ 추가] 히스토리 현재 페이지 state

    const { meetingId } = useParams();
    const navigate = useNavigate();

    // ( ... useEffect, handleDelete, handleGoToList, handleToggleAiSummary ... )
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

    // [✅ 락_2] '수정' 버튼 클릭 시 락 상태 확인 로직 추가
    const handleEdit = async () => {
        try {
            // 1. 락 상태를 *먼저* 조회합니다.
            const lockData = await getLockStatus(meetingId);

            if (lockData.locked) {
                // 2. 락이 걸려있으면 (true) 경고만 띄웁니다.
                alert('다른 사용자가 수정 중입니다. 잠시 후 다시 시도해 주세요.');
            } else {
                // 3. 락이 안 걸려있으면 (false) 편집 페이지로 이동시킵니다.
                navigate(`/notes/meeting/${meetingId}/edit`);
            }
        } catch (error) {
            console.error('락 상태 조회 실패:', error);
            alert('락 상태를 확인하는 중 오류가 발생했습니다.');
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

    // ( ... handleAddMemo, handleUpdateMemo, handleDeleteMemo ... )
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

    // (로딩, 에러, 데이터 없음 렌더링 로직은 변경 없음)
    if (loading) {
        return (
            <Container className="pt-3 text-center">
                <Spinner animation="border" role="status" />
                <h5 className="mt-2">저장 중...</h5>
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
            {/* 1. 콘텐츠 영역 (변경 없음) */}
            <div className="flex-grow-1">
                {/* ( ... 제목, 참가자, 날짜, 본문/AI요약 렌더링 ... ) */}
                {/* 제목 및 목록/드롭다운 버튼 (변경 없음) */}
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

                {/* 참가자 (변경 없음) */}
                <Row className="mb-2 align-items-center text-secondary">
                    <Col md={12}>
                        <div className="d-flex align-items-center">
                            <People className="me-2" />
                            <span className="me-2 fw-bold">참가자</span>
                            <span>{meeting.members}</span>
                        </div>
                    </Col>
                </Row>
                {/* 생성/수정일자 (변경 없음 - 히스토리 아이콘 클릭 포함) */}
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

                {/* 본문 또는 AI 요약 (변경 없음) */}
                <Row>
                    <Col>
                        {!showAiSummary ? (
                            // 1. 본문 보기 (변경 없음)
                            <pre className="border p-3 rounded text-break note-box">
                                {meeting.content.replace(/\\\\n/g, '\n').replace(/\\n/g, '\n').trim()}
                            </pre>
                        ) : aiLoading ? (
                            // 2. AI 요약 로딩 중 (변경 없음)
                            <div className="text-center p-5 ">
                                <Spinner animation="border" />
                                <h5 className="mt-2">AI 요약본을 불러오는 중...</h5>
                            </div>
                        ) : (
                            // 3. AI 요약 보기 (aiData가 있을 때)
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
            {/* --------------------- flex-grow-1 div 끝 --------------------- */}

            {/* 2. 하단 고정 영역 (버튼) (변경 없음) */}
            <div>
                <Button
                    variant="primary"
                    className="w-100 mt-3"
                    onClick={handleToggleAiSummary}
                    disabled={aiLoading} // AI 로딩 중 버튼 비활성화
                >
                    {aiLoading ? '로딩 중...' : showAiSummary ? '회의록 본문 보기' : 'AI 요약본 보기'}
                </Button>
            </div>
            {/* 챗봇 관련 (변경 없음) */}
            {showChatbot && <ChatbotPanel onClose={() => setShowChatbot(false)} meetingId={meetingId} />}
            <FloatingChatButton onClick={() => setShowChatbot(!showChatbot)} />
        </Container>
    );
}
