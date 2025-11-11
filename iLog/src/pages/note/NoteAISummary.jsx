// NoteAISummary.jsx (최종 수정본)

import React from 'react';
import { Row, Col, Card } from 'react-bootstrap';

// ✅ 부모로부터 메모 관련 props를 다시 받습니다.
export default function NoteAISummary({
    summaryText,
    meetingId,
    initialMemos = [], // 메모 목록 (기본값: 빈 배열)
    onMemoAdd, // 메모 추가를 처리할 부모 함수
}) {
    /**
     * ✅ AI 요약 본문에서 텍스트 선택(마우스 드래그) 완료 시 실행
     */
    const handleTextSelection = (e) => {
        const selection = window.getSelection();
        const selectedText = selection.toString().trim();

        // 1. 선택된 텍스트가 있어야만 메모 기능 활성화
        if (selectedText) {
            // 2. 간단한 prompt로 메모 내용 입력받기 (팝업 UI로 대체 가능)
            //    "selection 필요없어" 요청에 따라, selectedText는 참고용으로만 사용
            const memoContent = prompt(
                '메모 내용을 입력하세요:',
                selectedText // 선택한 텍스트를 기본값으로 넣어주면 편리함
            );

            // 3. 사용자가 '확인'을 누르고, 내용이 있을 경우
            if (memoContent && memoContent.trim() !== '') {
                // 4. 부모 컴포넌트의 onMemoAdd 함수 호출 (content만 전달)
                onMemoAdd(memoContent.trim());
            }

            // 5. 텍스트 선택 상태 해제
            selection.removeAllRanges();
        }
    };

    return (
        <>
            <Row>
                {/* 1. AI 요약 본문 */}
                {/* ✅ Col 너비를 8로 변경, onMouseUp 이벤트 핸들러 추가 */}
                <Col md={8} className="ai-summary-content">
                    <h4 className="fw-bold mb-3">
                        <i className="bi bi-robot me-2"></i>AI 요약 피드백
                    </h4>

                    <pre
                        className="ai-summary-pre note-box"
                        style={{
                            fontFamily: 'inherit',
                            fontSize: 'inherit',
                            cursor: 'text', // 텍스트 선택 가능 커서
                        }}
                        // ✅ 텍스트 선택 완료 시 이벤트 발생
                        onMouseUp={handleTextSelection}
                    >
                        {summaryText}
                    </pre>
                </Col>

                {/* 2. (추가) 메모 목록 표시 영역 */}
                <Col md={4}>
                    <h4 className="fw-bold mb-3">
                        <i className="bi bi-card-text me-2"></i>메모 목록
                    </h4>
                    {/* initialMemos 배열을 순회하며 메모 표시 */}
                    {initialMemos.length > 0 ? (
                        initialMemos.map((memo) => (
                            <Card key={memo.id} className="mb-2">
                                <Card.Body>
                                    <Card.Subtitle className="mb-2 text-muted">
                                        {/* Postman 응답 기준 'name' 필드 사용 */}
                                        {memo.name || '참석자'}
                                    </Card.Subtitle>
                                    <Card.Text>
                                        {/* Postman 응답 기준 'content' 필드 사용 */}
                                        {memo.content}
                                    </Card.Text>
                                </Card.Body>
                            </Card>
                        ))
                    ) : (
                        <p className="text-muted">요약본의 텍스트를 드래그하여 메모를 추가하세요.</p>
                    )}
                </Col>
            </Row>
        </>
    );
}
