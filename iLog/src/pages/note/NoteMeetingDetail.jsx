// NoteMeetingDetail.jsx

import React, { useState, useEffect } from 'react';
import { Container, Button, Row, Col, Dropdown, Spinner, Alert } from 'react-bootstrap';
import { PencilSquare, People, CalendarCheck, CalendarPlus, ThreeDotsVertical, Trash } from 'react-bootstrap-icons';
import { useNavigate, useParams } from 'react-router-dom';
import NoteAISummary from './NoteAISummary';

// API 함수들을 임포트합니다.
import { getMeetingDetail, deleteMeeting, getMeetingSummary } from '../../api/note';

export default function NoteMeetingDetail() {
    const [meeting, setMeeting] = useState(null); // 회의록 본문 정보
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // AI 요약/메모 관련 state
    const [showAiSummary, setShowAiSummary] = useState(false);
    const [aiData, setAiData] = useState(null); // AI 요약/메모 데이터 { summary, memos }
    const [aiLoading, setAiLoading] = useState(false); // AI 요약 로딩 상태

    const { meetingId } = useParams();
    const navigate = useNavigate();

    // 1. (API 1) 회의록 본문 정보 로드 (페이지 첫 로드 시)
    useEffect(() => {
        const fetchMeeting = async () => {
            setLoading(true);
            setError('');
            try {
                // 본문 API 호출 (예: /minutes/19)
                const data = await getMeetingDetail(meetingId);

                // API 응답(data)을 UI 상태(meeting)에 맞게 가공
                const formattedData = {
                    id: data.id,
                    name: data.title || '제목 없음', // API의 'title'을 'name'으로 매핑
                    content: data.content || '', // API의 'content'

                    // TODO: 이 필드들은 백엔드 API 응답에 포함되어야 합니다.
                    // (API 응답에 없다면 임시로 처리)
                    members: data.members || '참가자 정보 없음',
                    created: data.createdAt ? new Date(data.createdAt).toLocaleDateString() : '날짜 정보 없음',
                    modified: data.modifiedAt ? new Date(data.modifiedAt).toLocaleDateString() : '날짜 정보 없음',
                };

                setMeeting(formattedData);
            } catch (err) {
                console.error('Failed to fetch meeting:', err);
                setError('회의록을 불러오는 데 실패했습니다.');
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
                await deleteMeeting(meetingId);
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

    // --- 렌더링 로직 ---

    // (로딩 중)
    if (loading) {
        return (
            <Container fluid className="pt-3 text-center">
                <Spinner animation="border" role="status" />
                <h5 className="mt-2">로딩 중...</h5>
            </Container>
        );
    }

    // (에러 발생)
    if (error) {
        return (
            <Container fluid className="pt-3 text-center">
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
            <Container fluid className="pt-3 text-center">
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
                            <pre className="border p-3 rounded text-break">{meeting.content}</pre>
                        ) : aiLoading ? (
                            // 2. AI 요약 로딩 중
                            <div className="text-center p-5">
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
