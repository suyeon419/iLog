// NoteMeetingDetail.jsx (전체 코드)

import React, { useState, useEffect } from 'react';
// ✅ Pagination 임포트는 NoteAISummary.jsx에서 하므로 여기선 필요 없습니다.
import { Container, Button, Row, Col, Dropdown, Spinner, Alert } from 'react-bootstrap';
import { PencilSquare, People, CalendarCheck, CalendarPlus, ThreeDotsVertical, Trash } from 'react-bootstrap-icons';
import { useNavigate, useParams } from 'react-router-dom';
import NoteAISummary from './NoteAISummary';

import {
    getNoteDetails,
    deleteNote,
    getMeetingSummary,
    getMeetingMembers,
    createMemo,
    updateMemo,
    deleteMemo,
} from '../../api/note';

// ✅ (신규) 한 페이지에 보여줄 메모 개수
const MEMOS_PER_PAGE = 3;

export default function NoteMeetingDetail() {
    const [meeting, setMeeting] = useState(null); // 회의록 본문 정보
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // AI 요약/메모 관련 state
    const [showAiSummary, setShowAiSummary] = useState(false);
    const [aiData, setAiData] = useState(null); // AI 요약/메모 데이터 { summary, memos }
    const [aiLoading, setAiLoading] = useState(false); // AI 요약 로딩 상태

    // ✅ (신규) 메모 목록의 현재 페이지 state
    const [memoCurrentPage, setMemoCurrentPage] = useState(1);

    const { meetingId } = useParams();
    const navigate = useNavigate();

    // 1. (API 1) 회의록 본문 정보 로드 (페이지 첫 로드 시)
    useEffect(() => {
        const fetchMeeting = async () => {
            setLoading(true);
            setError('');
            try {
                // 본문 API 호출 (예: /minutes/19)
                const data = await getNoteDetails(meetingId);

                const membersData = await getMeetingMembers(meetingId);

                // API 응답(data)을 UI 상태(meeting)에 맞게 가공
                const formattedData = {
                    id: data.id,
                    name: data.title || '제목 없음', // API의 'title'을 'name'으로 매핑
                    content: data.content || '', // API의 'content'

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

    // '수정' 버튼 클릭
    const handleEdit = () => {
        navigate(`/notes/meeting/${meetingId}/edit`);
    };

    // '삭제' 버튼 클릭 (API 연동)
    const handleDelete = async () => {
        if (window.confirm('정말로 이 회의록을 삭제하시겠습니까?')) {
            try {
                await deleteNote(meetingId);
                alert('회의록이 삭제되었습니다.');
                navigate(-1); // 목록으로 돌아가기
            } catch (err) {
                console.error('Failed to delete meeting:', err);
                alert('삭제에 실패했습니다.');
            }
        }
    };

    // '목록' 버튼 클릭
    const handleGoToList = () => {
        navigate(-1);
    };

    // 2. (API 2) 'AI 요약/본문 보기' 버튼 클릭 핸들러
    const handleToggleAiSummary = async () => {
        if (showAiSummary) {
            // 2-1. AI 요약 -> 본문 보기 (API 호출 불필요)
            setShowAiSummary(false);
            return;
        }

        // 2-2. 본문 -> AI 요약 보기
        if (aiData) {
            // 이미 불러온 데이터가 있으면 그냥 토글
            setShowAiSummary(true);
        } else {
            // 처음 누르는 경우, 요약 API 호출 (예: /minutes/19/summary)
            setAiLoading(true);
            try {
                // getMeetingSummary가 { id, title, summary, memos }를 반환
                const data = await getMeetingSummary(meetingId);
                setAiData(data); // { id, title, summary, memos } 저장
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
     * ✅ 3. 메모 추가 함수 (API 페이로드 수정)
     */
    const handleAddMemo = async (memoContent, startIndex, endIndex, selectedText) => {
        try {
            // ✅ API가 요구하는 최종 payload (백엔드 필드명에 맞춤)
            const payload = {
                content: memoContent, // 사용자가 prompt에 최종 입력한 내용
                memoType: 'SELF',
                startIndex: startIndex, // 드래그 시작 위치
                endIndex: endIndex, // 드래그 끝 위치
                positionContent: selectedText, // 드래그한 원본 텍스트
            };
            console.log('📤 [메모 생성 요청] payload:', payload);

            const updatedMemos = await createMemo(meetingId, payload);

            // aiData 상태를 API가 반환한 최신 메모 목록으로 업데이트
            setAiData((prevData) => ({
                ...prevData,
                memos: updatedMemos, // API가 반환한 배열을 그대로 덮어쓰기
            }));

            // ✅ (신규) 새 메모 추가 시 1페이지로 이동
            setMemoCurrentPage(1);
        } catch (error) {
            console.error('메모 생성 실패:', error);
            // 500 에러 등 API 실패 시 알림
            alert('메모 생성에 실패했습니다. (서버 오류)');
        }
    };
    /**
     * ✅ 4. 메모 수정 함수 (note.js의 updateMemo를 사용하도록 수정)
     */
    const handleUpdateMemo = async (memoId, newContent) => {
        try {
            // ⚡ note.js의 updateMemo 함수 호출
            // ⚡ meetingId는 이 컴포넌트의 useParams()에서 가져온 값을 사용
            const updatedMemos = await updateMemo(meetingId, memoId, newContent);

            // ⚡ aiData 상태를 API가 반환한 최신 메모 목록으로 업데이트
            setAiData((prevData) => ({
                ...prevData,
                memos: updatedMemos, // API가 반환한 배열로 덮어쓰기
            }));
        } catch (error) {
            console.error('메모 수정 실패:', error);
            alert('메모 수정에 실패했습니다. (서버 오류)');
        }
    };

    /**
     * ✅ 5. 메모 삭제 함수 (페이지네이션 로직 추가)
     */
    const handleDeleteMemo = async (memoId) => {
        if (window.confirm('정말로 이 메모를 삭제하시겠습니까?')) {
            try {
                // 1. API 호출
                await deleteMemo(meetingId, memoId);

                // 2. state 수동 업데이트 (이전 답변에서 수정된 내용)
                setAiData((prev) => {
                    // 3. 기존 메모 목록에서 삭제한 ID 필터링
                    const newMemos = prev.memos.filter((memo) => memo.id !== memoId);

                    // ✅ (신규) 페이지네이션 보정 로직 (Note.jsx와 동일)
                    const newTotalPages = Math.ceil(newMemos.length / MEMOS_PER_PAGE);

                    if (memoCurrentPage > newTotalPages && newTotalPages > 0) {
                        // 마지막 페이지의 마지막 항목을 지웠을 경우
                        setMemoCurrentPage(newTotalPages);
                    } else if (newMemos.length === 0) {
                        // 모든 항목을 지웠을 경우
                        setMemoCurrentPage(1);
                    }
                    // --- 페이지네이션 로직 끝 ---

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

    // (로딩 중)
    if (loading) {
        return (
            <Container className="pt-3 text-center">
                <Spinner animation="border" role="status" />
                <h5 className="mt-2">저장 중...</h5>
            </Container>
        );
    }

    // (에러 발생)
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

    // (데이터 없음)
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
            {/* 1. 콘텐츠 영역 (flex-grow-1) */}
            <div className="flex-grow-1">
                {/* 제목 및 목록/드롭다운 버튼 */}
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

                {/* 참가자 */}
                <Row className="mb-2 align-items-center text-secondary">
                    <Col md={12}>
                        <div className="d-flex align-items-center">
                            <People className="me-2" />
                            <span className="me-2 fw-bold">참가자</span>
                            <span>{meeting.members}</span>
                        </div>
                    </Col>
                </Row>
                {/* 생성/수정일자 */}
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
                            // 1. 본문 보기
                            <pre className="border p-3 rounded text-break note-box">
                                {meeting.content
                                    .replace(/\\\\n/g, '\n') // 1️⃣ 첫 번째 인코딩 해제: '\\n' → '\n'
                                    .replace(/\\n/g, '\n') // 2️⃣ 두 번째 인코딩 해제: '\n' → 실제 줄바꿈
                                    .trim()}
                            </pre>
                        ) : aiLoading ? (
                            // 2. AI 요약 로딩 중
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
                                    meetingId={meetingId} // 메모 생성을 위해 ID 전달
                                    onMemoAdd={handleAddMemo}
                                    onMemoUpdate={handleUpdateMemo} // ✅ 수정된 핸들러 전달
                                    onMemoDelete={handleDeleteMemo} // ✅ (변경 없음)
                                    // ✅ (신규) 페이지네이션 props 전달
                                    currentPage={memoCurrentPage}
                                    onPageChange={setMemoCurrentPage}
                                    memosPerPage={MEMOS_PER_PAGE}
                                />
                            )
                        )}
                    </Col>
                </Row>
            </div>
            {/* --------------------- flex-grow-1 div 끝 --------------------- */}

            {/* 2. 하단 고정 영역 (버튼) */}
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
        </Container>
    );
}
