// NoteMeetingDetail.jsx (수정됨)

import React, { useState, useEffect } from 'react';
import { Container, Button, Row, Col } from 'react-bootstrap';
import { PencilSquare, People, CalendarCheck, CalendarPlus } from 'react-bootstrap-icons';
import { useNavigate, useParams } from 'react-router-dom';
// 1. 새로 만든 AiSummaryView 컴포넌트를 import 합니다.
import AiSummary from './AISummary';

// 2. 더미 데이터에 aiSummaryText와 initialMemos 추가 (이미지 기반)
const DUMMY_MEETING_DETAIL = {
    id: 101,
    name: '개발 진행 회의',
    members: '김가현 김우혁 이수연 최겸',
    created: '2025.00.00.',
    modified: '2025.00.00.',
    content: `오늘은 백엔드와 프론트엔드를 나누어 각자 개발을 합니다.
[기능 회의]
화상회의 AI 회의록 기능은...(이하 생략)`,
    // AI 요약 텍스트
    aiSummaryText: `AI 요약
■ 개발 분업
• 프론트엔드: UI 구현 및 사용자 인터랙션
• 백엔드: 서버 로직, 데이터 처리 및 기능 제어
• 기능 회의

주제: 화상회의 AI 회의록 기능 개선
핵심 내용
1. AI 회의록 기능 온-오프 설정 추가
    • 사용자가 회의 중에 AI 기록 기능을 활성화/비활성화할 수 있도록 구현
    • UI 내 명확한 토글 스위치 또는 버튼 제공
2. 발화자 구분 기능 추가
    • AI가 회의 음성을 분석하여 누가 말했는지 식별
    • 회의록에 화자 이름 또는 프로필 표시

■ 개발 목표
• 사용자에게 선택권과 명확성 제공
• 회의록의 정확도와 신뢰성 향상`,
    // 초기 메모 데이터
    initialMemos: [
        {
            id: 1,
            person: '이수연',
            note: '프론트엔드: 공개/비공개 날짜를 캘린더로 할 것',
        },
        {
            id: 2,
            person: '김가현',
            note: '비용 관련 이슈로 일단 기본 기능만',
        },
    ],
};

export default function NoteMeetingDetail() {
    const [meeting, setMeeting] = useState(null);
    const [loading, setLoading] = useState(true);
    // 3. AI 요약본 표시 여부를 관리하는 state
    const [showAiSummary, setShowAiSummary] = useState(false);
    const { meetingId } = useParams();
    const navigate = useNavigate();

    useEffect(() => {
        setLoading(true);
        setMeeting(DUMMY_MEETING_DETAIL);
        setLoading(false);
    }, [meetingId]);

    const handleEdit = () => {
        alert('수정 기능 구현 필요');
    };

    const handleDelete = () => {
        alert('삭제 기능 구현 필요');
    };

    if (loading || !meeting) {
        return (
            <Container fluid className="pt-3 text-center">
                <h5>로딩 중...</h5>
            </Container>
        );
    }

    return (
        <Container fluid className="pt-3 container-left">
            <Row className="mb-3 align-items-center">
                <Col>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        <PencilSquare size={30} style={{ marginRight: '10px' }} />
                        <div className="noteForm" style={{ padding: '0.375rem 0' }}>
                            {meeting.name}
                        </div>
                    </div>
                    <hr className="beigeHr" />
                </Col>
                <Col xs="auto">
                    <Button
                        variant="outline-primary mini-btn"
                        onClick={handleEdit}
                        style={{ fontWeight: 'bold', marginRight: '5px' }}
                    >
                        수정
                    </Button>
                    <Button variant="danger mini-btn" onClick={handleDelete} style={{ fontWeight: 'bold' }}>
                        삭제
                    </Button>
                </Col>
            </Row>

            {/* 참가자, 생성일자, 수정일자 */}
            <Row className="mb-2 align-items-center" style={{ color: '#555' }}>
                <Col md={12}>
                    <div className="d-flex align-items-center">
                        <People style={{ marginRight: '10px' }} />
                        <span style={{ marginRight: '10px', fontWeight: 'bold' }}>참가자</span>
                        <span>{meeting.members}</span>
                    </div>
                </Col>
            </Row>
            <Row className="mb-3 align-items-center" style={{ color: '#555' }}>
                <Col md={6}>
                    <div className="d-flex align-items-center">
                        <CalendarCheck style={{ marginRight: '10px' }} />
                        <span style={{ marginRight: '10px', fontWeight: 'bold' }}>생성일자</span>
                        <span>{meeting.created}</span>
                    </div>
                </Col>
                <Col md={6}>
                    <div className="d-flex align-items-center">
                        <CalendarPlus style={{ marginRight: '10px' }} />
                        <span style={{ marginRight: '10px', fontWeight: 'bold' }}>수정일자</span>
                        <span>{meeting.modified}</span>
                    </div>
                </Col>
            </Row>

            {/* 4. showAiSummary 값에 따라 본문 또는 AI 요약본을 표시 */}
            {!showAiSummary ? (
                // (A) 회의록 본문
                <Row>
                    <Col>
                        <pre
                            style={{
                                border: '1px solid #eee',
                                borderRadius: '10px',
                                padding: '1rem',
                                minHeight: '400px',
                                fontSize: '1rem',
                                color: '#333',
                                fontFamily: 'inherit',
                                whiteSpace: 'pre-wrap',
                                wordWrap: 'break-word',
                            }}
                        >
                            {meeting.content}
                        </pre>
                    </Col>
                </Row>
            ) : (
                // (B) AI 요약본 (새 컴포넌트)
                <AiSummary summaryText={meeting.aiSummaryText} initialMemos={meeting.initialMemos} />
            )}

            {/* 5. 버튼 텍스트와 기능 변경 */}
            <Button
                variant="primary"
                className="w-100 mt-3"
                onClick={() => setShowAiSummary(!showAiSummary)} // state 토글
            >
                {showAiSummary ? '회의록 본문 보기' : 'AI 요약본 보기'}
            </Button>
        </Container>
    );
}
