// NoteMeetingDetail.jsx (페이징 state 제거된 버전)

import React, { useState, useEffect } from 'react';
import { Container, Button, Row, Col, Dropdown, Spinner, Alert } from 'react-bootstrap';
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
} from '../../api/note';

// ✅ [삭제 1] MEMOS_PER_PAGE 상수 제거

export default function NoteMeetingDetail() {
    const [meeting, setMeeting] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [showAiSummary, setShowAiSummary] = useState(false);
    const [aiData, setAiData] = useState(null);
    const [aiLoading, setAiLoading] = useState(false);

    const [showChatbot, setShowChatbot] = useState(false);

    // ✅ [삭제 2] memoCurrentPage state 제거
    // const [memoCurrentPage, setMemoCurrentPage] = useState(1);

    const { meetingId } = useParams();
    const navigate = useNavigate();

    // 1. (API 1) 회의록 본문 정보 로드 (변경 없음)
    useEffect(() => {
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

    // '수정' 버튼 클릭 (변경 없음)
    const handleEdit = () => {
        navigate(`/notes/meeting/${meetingId}/edit`);
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

    // 2. 'AI 요약/본문 보기' 버튼 클릭 핸들러 (변경 없음)
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

    /**
     * ✅ 3. 메모 추가 함수 (페이지네이션 로직 제거)
     */
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

            // ✅ [삭제 3] 새 메모 추가 시 1페이지로 이동하는 로직 제거
            // setMemoCurrentPage(1);
        } catch (error) {
            console.error('메모 생성 실패:', error);
            alert('메모 생성에 실패했습니다. (서버 오류)');
        }
    };

    /**
     * 4. 메모 수정 함수 (변경 없음)
     */
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

    /**
     * ✅ 5. 메모 삭제 함수 (페이지네이션 로직 제거)
     */
    const handleDeleteMemo = async (memoId) => {
        if (window.confirm('정말로 이 메모를 삭제하시겠습니까?')) {
            try {
                // 1. API 호출
                await deleteMemo(meetingId, memoId);

                // 2. state 수동 업데이트
                setAiData((prev) => {
                    // 3. 기존 메모 목록에서 삭제한 ID 필터링
                    const newMemos = prev.memos.filter((memo) => memo.id !== memoId);

                    // ✅ [삭제 4] 페이지네이션 보정 로직 (전부 삭제)

                    // 5. 필터링된 새 배열로 state 덮어쓰기
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
                {/* 생성/수정일자 (변경 없음) */}
                <Row className="mb-3 align-items-center text-secondary">
                    <Col md={6}>
                        <div className="d-flex align-items-center">
                            <CalendarCheck className="me-2" />
                            <span className="me-2 fw-bold">생성일자</span>
                            <span>{meeting.created}</span>
                        </div>
                    </Col>
                    <Col md={6}>
                        <div className="d-flex align-items-center">
                            <CalendarPlus className="me-2" />
                            <span className="me-2 fw-bold">수정일자</span>
                            <span>{meeting.modified}</span>
                        </div>
                    </Col>
                </Row>

                {/* 본문 또는 AI 요약 (조건부 렌더링) */}
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
                                    // ✅ [삭제 5] 페이징 props (currentPage, onPageChange, memosPerPage) 제거
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
