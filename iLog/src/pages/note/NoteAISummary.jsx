// NoteAISummary.jsx (최종본: 위치 기반 형광펜 + 양방향 호버)

import React, { useState } from 'react'; // ✅ useState 다시 추가
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
    /**
     * ✅ [복원] 현재 호버된 메모 ID (양방향 하이라이트)
     */
    const [hoveredMemoId, setHoveredMemoId] = useState(null);

    /**
     * ✅ [수정] 텍스트 선택 시, 위치(index)를 계산하여 onMemoAdd로 전달
     */
    const handleTextSelection = (e) => {
        const selection = window.getSelection();
        if (!selection.rangeCount) return;

        const range = selection.getRangeAt(0);
        const selectedText = range.toString().trim();

        // 1. 선택된 텍스트가 있어야만 메모 기능 활성화
        if (selectedText) {
            const preNode = e.currentTarget; // <pre> 태그

            // 2. <pre> 태그 시작부터 드래그 시작점까지의 범위를 만들어 길이를 계산
            const preSelectionRange = document.createRange();
            preSelectionRange.selectNodeContents(preNode);
            preSelectionRange.setEnd(range.startContainer, range.startOffset);

            // 3. 시작점과 끝점 계산
            const startIndex = preSelectionRange.toString().length;
            const endIndex = startIndex + selectedText.length;

            // 4. [유지] prompt로 사용자 입력 받기
            const memoContent = prompt('추가할 메모 내용을 입력하세요:', selectedText);

            // 5. [수정] 사용자가 '확인'을 누르면 5개 인자 전달
            if (memoContent && memoContent.trim() !== '') {
                onMemoAdd(
                    memoContent.trim(), // 1. 최종 메모 내용
                    startIndex, // 2. 시작 위치
                    endIndex, // 3. 끝 위치
                    selectedText // 4. 원본 텍스트 (positionContent)
                );
            }

            // 6. 텍스트 선택 상태 해제
            selection.removeAllRanges();
        }
    };

    /**
     * ✅ [신규] 위치(startIndex) 기반으로 형광펜 렌더링
     * (중복 단어 버그 완벽 해결)
     */
    const renderSummaryWithHighlights = () => {
        if (!initialMemos || initialMemos.length === 0 || !summaryText) {
            return summaryText;
        }

        // 1. 위치 정보가 있고, 유효한 메모만 필터링 후 시작 순서로 정렬
        const sortedMemos = initialMemos
            .filter(
                (memo) =>
                    memo.startIndex != null && // null, undefined 체크
                    memo.endIndex != null &&
                    memo.endIndex > memo.startIndex &&
                    memo.endIndex <= summaryText.length // 텍스트 길이 초과 방지
            )
            .sort((a, b) => a.startIndex - b.startIndex);

        if (sortedMemos.length === 0) {
            return summaryText;
        }

        let lastIndex = 0;
        const parts = []; // React 요소 + 문자열 배열

        // 2. 정렬된 메모를 순회하며 텍스트 조각내기
        sortedMemos.forEach((memo) => {
            // (겹치는 메모 방지)
            if (memo.startIndex < lastIndex) {
                return;
            }

            // 1. 형광펜 이전의 일반 텍스트
            if (memo.startIndex > lastIndex) {
                parts.push(summaryText.substring(lastIndex, memo.startIndex));
            }

            // 2. 형광펜 <span>
            parts.push(
                <span
                    key={memo.id}
                    className={`highlighted-text ${memo.id === hoveredMemoId ? 'hovered' : ''}`}
                    onMouseEnter={() => setHoveredMemoId(memo.id)}
                    onMouseLeave={() => setHoveredMemoId(null)}
                >
                    {summaryText.substring(memo.startIndex, memo.endIndex)}
                </span>
            );

            // 3. 다음 시작 위치 업데이트
            lastIndex = memo.endIndex;
        });

        // 4. 마지막 형광펜 이후의 나머지 텍스트
        if (lastIndex < summaryText.length) {
            parts.push(summaryText.substring(lastIndex));
        }

        return parts;
    };

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
            {/* ✅ [복원] 형광펜 + 갈색 테두리 CSS */}
            <style>
                {`
                .highlighted-text {
                    background-color: #fcf8e3; /* 연한 노란색 (형광펜) */
                    cursor: pointer;
                    transition: background-color 0.2s, font-weight 0.2s;
                    border-radius: 3px;
                    padding: 0 2px;
                }
                
                .highlighted-text.hovered {
                    background-color: #f7e6a0; /* 더 진한 노란색 (hover) */
                    font-weight: 600;
                }
                
                .memo-card {
                    transition: border 0.2s, box-shadow 0.2s;
                }
                
                /* :hover 대신 state로 제어 (양방향) */
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
                        onMouseUp={handleTextSelection} // ✅ 수정된 핸들러 연결
                    >
                        {/* ✅ [복원] 하이라이트 함수 호출 */}
                        {renderSummaryWithHighlights()}
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
                                    className="mb-2 memo-card"
                                    // ✅ [복원] 양방향 호버 이벤트
                                    onMouseEnter={() => setHoveredMemoId(memo.id)}
                                    onMouseLeave={() => setHoveredMemoId(null)}
                                    // ✅ [복원] state에 따른 갈색 테두리
                                    style={
                                        memo.id === hoveredMemoId
                                            ? {
                                                  border: '2px solid #8B4513',
                                                  boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
                                              }
                                            : {}
                                    }
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
                                                        // ⚡ 중요: 수정 시 형광펜 연결은 유지됩니다!
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

                            {/* 페이지네이션 (변경 없음) */}
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
