// NoteMeetingDetail.jsx (히스토리 모달 기능 추가)

import React, { useState, useEffect } from 'react';
import {
    Container,
    Button,
    Row,
    Col,
    Dropdown,
    Spinner,
    Alert,
    Modal, // [✅ 추가] Modal 컴포넌트 import
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
    getNoteHistory, // [✅ 추가] getNoteHistory API import
} from '../../api/note';

// ( ... )

export default function NoteMeetingDetail() {
    const [meeting, setMeeting] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [showAiSummary, setShowAiSummary] = useState(false);
    const [aiData, setAiData] = useState(null);
    const [aiLoading, setAiLoading] = useState(false);

    const [showChatbot, setShowChatbot] = useState(false);

    // [✅ 추가] 히스토리 모달 관련 state
    const [showHistoryModal, setShowHistoryModal] = useState(false);
    const [historyData, setHistoryData] = useState(null);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [historyError, setHistoryError] = useState('');

    const { meetingId } = useParams();
    const navigate = useNavigate();

    // 1. (API 1) 회의록 본문 정보 로드 (변경 없음)
    useEffect(() => {
        // ( ... 기존 useEffect 내용 ... )
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

    // '수정' 버튼 클릭 (변경 없음)
    // ( ... handleEdit, handleDelete, handleGoToList ... )
    const handleEdit = () => {
        navigate(`/notes/meeting/${meetingId}/edit`);
    };

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

    const handleGoToList = () => {
        navigate(-1);
    };

    // 2. 'AI 요약/본문 보기' 버튼 클릭 핸들러 (변경 없음)
    const handleToggleAiSummary = async () => {
        // ( ... 기존 handleToggleAiSummary 내용 ... )
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
     * [✅ 추가] 히스토리 아이콘 클릭 핸들러
     */
    const handleShowHistory = async () => {
        setShowHistoryModal(true); // 모달을 먼저 엽니다.
        setHistoryLoading(true);
        setHistoryError('');
        setHistoryData(null); // 이전 데이터를 비웁니다.

        try {
            const data = await getNoteHistory(meetingId);
            setHistoryData(data); // API는 배열을 반환
        } catch (err) {
            console.error('Failed to fetch history:', err);
            setHistoryError('히스토리 로드에 실패했습니다.');
        } finally {
            setHistoryLoading(false);
        }
    };

    /**
     * ✅ 3. 메모 추가 함수 (변경 없음)
     */
    const handleAddMemo = async (memoContent, startIndex, endIndex, selectedText) => {
        // ( ... 기존 handleAddMemo 내용 ... )
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

    /**
     * 4. 메모 수정 함수 (변경 없음)
     */
    const handleUpdateMemo = async (memoId, newContent) => {
        // ( ... 기존 handleUpdateMemo 내용 ... )
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
     * ✅ 5. 메모 삭제 함수 (변경 없음)
     */
    const handleDeleteMemo = async (memoId) => {
        // ( ... 기존 handleDeleteMemo 내용 ... )
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
        // ( ... )
        return (
            <Container className="pt-3 text-center">
                <Spinner animation="border" role="status" />
                <h5 className="mt-2">저장 중...</h5>
            </Container>
        );
    }

    if (error) {
        // ( ... )
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
        // ( ... )
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
                    {/* ( ... ) */}
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
                    {/* ( ... ) */}
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
                    {/* ( ... ) */}
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
                        {/* [✅ 수정] 아이콘에 onClick, style, title 추가 */}
                        <i
                            className="bi bi-clock-history fs-4 fw-bold"
                            onClick={handleShowHistory}
                            style={{ cursor: 'pointer' }}
                            title="수정 히스토리 보기"
                        ></i>
                    </Col>
                </Row>

                {/* 본문 또는 AI 요약 (변경 없음) */}
                <Row>
                    {/* ( ... ) */}
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
                {/* ( ... ) */}
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

            {/* [✅ 추가] 히스토리 조회 모달 */}
            <Modal show={showHistoryModal} onHide={() => setShowHistoryModal(false)} size="lg" centered>
                <Modal.Header closeButton>
                    <Modal.Title>회의록 수정 히스토리</Modal.Title>
                </Modal.Header>
                <Modal.Body style={{ maxHeight: '60vh', overflowY: 'auto' }}>
                    {historyLoading ? (
                        <div className="text-center">
                            <Spinner animation="border" />
                            <p className="mt-2">히스토리를 불러오는 중...</p>
                        </div>
                    ) : historyError ? (
                        <Alert variant="danger">{historyError}</Alert>
                    ) : historyData && historyData.length > 0 ? (
                        historyData.map((item) => (
                            <div key={item.historyId} className="mb-3 border-bottom pb-3">
                                <h5 className="mb-2">{item.title}</h5>
                                <p className="text-muted mb-2">
                                    {/* Postman 응답을 보면 createdAt이 있으므로 표시 */}
                                    수정일: {new Date(item.createdAt).toLocaleString()}
                                </p>
                                {/* Postman의 content에 \n 이스케이프 문자가 있으므로 pre 태그로 렌더링합니다. */}
                                {/* 기존 본문 렌더링 로직을 동일하게 적용합니다. */}
                                <pre
                                    className="border p-3 rounded bg-light"
                                    style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}
                                >
                                    {item.content.replace(/\\\\n/g, '\n').replace(/\\n/g, '\n').trim()}
                                </pre>
                            </div>
                        ))
                    ) : (
                        // 로딩이 끝났는데 데이터가 없는 경우
                        <Alert variant="info">수정 히스토리가 없습니다.</Alert>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowHistoryModal(false)}>
                        닫기
                    </Button>
                </Modal.Footer>
            </Modal>
        </Container>
    );
}
