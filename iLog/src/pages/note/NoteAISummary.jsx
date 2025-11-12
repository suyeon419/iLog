// NoteAISummary.jsx (형광펜 제거, Prompt 복구 -> 최종 수정)

import React from 'react'; // ✅ useState 제거 (CSS hover로 대체)
import { Row, Col, Card, Button, Pagination } from 'react-bootstrap';

export default function NoteAISummary({
    summaryText,
    meetingId,
    initialMemos = [],
    onMemoAdd,
    onMemoUpdate,
    onMemoDelete,
    currentPage,
    onPageChange,
    memosPerPage,
}) {
    // ❌ [제거] const [hoveredMemoId, setHoveredMemoId] = useState(null);
    // -> 형광펜 기능 및 state 기반 호버 제거

    /**
     * ✅ [수정] 텍스트 선택 시, prompt를 띄워 사용자 입력을 받음
     * (사용자가 직접 입력해야 한다는 요구사항 반영)
     */
    const handleTextSelection = (e) => {
        const selection = window.getSelection();
        if (!selection.rangeCount) return;

        const selectedText = selection.toString().trim();

        // 1. 선택된 텍스트가 있어야만 메모 기능 활성화
        if (selectedText) {
            // 2. [수정] confirm -> prompt로 변경
            //    드래그한 텍스트(selectedText)를 기본값으로 제공
            const memoContent = prompt('추가할 메모 내용을 입력하세요:', selectedText);

            // 3. [수정] 사용자가 '확인'을 누르고, 내용이 비어있지 않을 때만
            if (memoContent && memoContent.trim() !== '') {
                // 부모 컴포넌트의 onMemoAdd 함수 호출 (사용자가 입력한 최종 텍스트 전달)
                onMemoAdd(memoContent.trim());
            }

            // 4. 텍스트 선택 상태 해제
            selection.removeAllRanges();
        }
    };

    // ❌ [제거] renderSummaryWithHighlights() 함수 전체 삭제
    // -> (문제 1) "잘못된 위치 하이라이트" 버그의 원인
    // -> (문제 2) "직접 입력(prompt)" 기능과 호환 불가

    // ==========================================================
    // ✅ 페이지네이션 로직 (변경 없음)
    // ==========================================================
    const totalPages = Math.ceil(initialMemos.length / memosPerPage);
    const indexOfLastMemo = currentPage * memosPerPage;
    const indexOfFirstMemo = indexOfLastMemo - memosPerPage;

    const currentMemos = initialMemos.slice(indexOfFirstMemo, indexOfLastMemo);

    const handlePageChange = (pageNumber) => {
        const newPage = Math.max(1, Math.min(pageNumber, totalPages === 0 ? 1 : totalPages));
        onPageChange(newPage);
    };

    const renderPaginationItems = () => {
        let pageItems = [];
        const total = totalPages === 0 ? 1 : totalPages;
        for (let number = 1; number <= total; number++) {
            pageItems.push(
                <Pagination.Item key={number} active={number === currentPage} onClick={() => handlePageChange(number)}>
                    {number}
                </Pagination.Item>
            );
        }
        return pageItems;
    };
    // ==========================================================
    // 페이지네이션 로직 끝
    // ==========================================================

    return (
        <>
            {/* ✅ [수정] CSS 수정: 
                1. .highlighted-text 관련 규칙 모두 제거 (형광펜 제거)
                2. .memo-card에 :hover 규칙 추가 (갈색 테두리)
            */}
            <style>
                {`
                .memo-card {
                    transition: border 0.2s, box-shadow 0.2s;
                }

                /* 마우스를 올린 메모 카드만 갈색 테두리 적용 */
                .memo-card:hover {
                    border: 2px solid #8B4513; /* SaddleBrown */
                    box-shadow: 0 4px 8px rgba(0,0,0,0.1);
                }
                `}
            </style>

            <Row>
                {/* 1. AI 요약 본문 */}
                <Col md={8} className="ai-summary-content">
                    <h4 className="fw-bold mb-3">
                        <i className="bi bi-robot me-2"></i>AI 요약 피드백
                    </h4>

                    <pre
                        className="ai-summary-pre note-box"
                        style={{
                            fontFamily: 'inherit',
                            fontSize: 'inherit',
                            cursor: 'text',
                        }}
                        // ✅ [유지] 텍스트 선택 완료 시 이벤트 발생
                        onMouseUp={handleTextSelection}
                    >
                        {/* ✅ [수정] 형광펜 함수 대신 원본 텍스트(summaryText) 렌더링 */}
                        {summaryText}
                    </pre>
                </Col>

                {/* 2. 메모 목록 표시 영역 */}
                <Col md={4}>
                    <h4 className="fw-bold mb-3">
                        <i className="bi bi-card-text me-2"></i>메모 목록
                    </h4>

                    {initialMemos.length > 0 ? (
                        <>
                            {currentMemos.map((memo) => (
                                <Card
                                    key={memo.id}
                                    className="mb-2 memo-card" // ✅ memo-card 클래스
                                    // ❌ [제거] onMouseEnter, onMouseLeave, style prop
                                    // -> CSS :hover로 대체
                                >
                                    <Card.Body>
                                        <Card.Subtitle className="mb-2 text-muted">
                                            {memo.name || '참석자'}
                                        </Card.Subtitle>
                                        <Card.Text>{memo.content}</Card.Text>
                                        <div className="d-flex justify-content-end gap-2">
                                            <Button
                                                variant="outline-secondary"
                                                size="sm"
                                                onClick={() => {
                                                    const newContent = prompt(
                                                        '수정할 메모 내용을 입력하세요:',
                                                        memo.content
                                                    );
                                                    if (newContent && newContent.trim() !== '') {
                                                        // ✅ [유지] 메모 수정 기능
                                                        onMemoUpdate(memo.id, newContent.trim());
                                                    }
                                                }}
                                            >
                                                수정
                                            </Button>
                                            <Button
                                                variant="outline-danger"
                                                size="sm"
                                                onClick={() => onMemoDelete(memo.id)}
                                            >
                                                삭제
                                            </Button>
                                        </div>
                                    </Card.Body>
                                </Card>
                            ))}

                            {/* 페이지네이션 UI (변경 없음) */}
                            {totalPages > 1 && (
                                <nav className="mt-3 pagination-nav">
                                    <Pagination className="justify-content-center">
                                        <Pagination.Prev
                                            onClick={() => handlePageChange(currentPage - 1)}
                                            disabled={currentPage === 1}
                                        />
                                        {renderPaginationItems()}
                                        <Pagination.Next
                                            onClick={() => handlePageChange(currentPage + 1)}
                                            disabled={currentPage === (totalPages === 0 ? 1 : totalPages)}
                                        />
                                    </Pagination>
                                </nav>
                            )}
                        </>
                    ) : (
                        <p className="text-muted">요약본의 텍스트를 드래그하여 메모를 추가하세요.</p>
                    )}
                </Col>
            </Row>
        </>
    );
}
