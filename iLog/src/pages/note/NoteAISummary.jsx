// NoteAISummary.jsx (최종본: CSS 클래스 방식 + slice 오타 수정)

import React, { useState } from 'react';
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
    const [hoveredMemoId, setHoveredMemoId] = useState(null);

    const handleTextSelection = (e) => {
        const selection = window.getSelection();
        if (!selection.rangeCount) return;

        const range = selection.getRangeAt(0);
        const selectedText = range.toString().trim();

        if (selectedText) {
            const preNode = e.currentTarget;

            const preSelectionRange = document.createRange();
            preSelectionRange.selectNodeContents(preNode);
            preSelectionRange.setEnd(range.startContainer, range.startOffset);

            const startIndex = preSelectionRange.toString().length;
            const endIndex = startIndex + selectedText.length;

            const memoContent = prompt('추가할 메모 내용을 입력하세요:', selectedText);

            if (memoContent && memoContent.trim() !== '') {
                onMemoAdd(memoContent.trim(), startIndex, endIndex, selectedText);
            }

            selection.removeAllRanges();
        }
    };

    const renderSummaryWithHighlights = () => {
        if (!initialMemos || initialMemos.length === 0 || !summaryText) {
            return summaryText;
        }

        const sortedMemos = initialMemos
            .filter(
                (memo) =>
                    memo.startIndex != null &&
                    memo.endIndex != null &&
                    memo.endIndex > memo.startIndex &&
                    memo.endIndex <= summaryText.length
            )
            .sort((a, b) => a.startIndex - b.startIndex);

        if (sortedMemos.length === 0) {
            return summaryText;
        }

        let lastIndex = 0;
        const parts = [];

        sortedMemos.forEach((memo) => {
            if (memo.startIndex < lastIndex) {
                return;
            }

            if (memo.startIndex > lastIndex) {
                parts.push(summaryText.substring(lastIndex, memo.startIndex));
            }

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

            lastIndex = memo.endIndex;
        });

        if (lastIndex < summaryText.length) {
            parts.push(summaryText.substring(lastIndex));
        }

        return parts;
    };

    // ==========================================================
    // 페이지네이션 로직
    // ==========================================================
    const totalPages = Math.ceil(initialMemos.length / memosPerPage);
    const indexOfLastMemo = currentPage * memosPerPage;
    const indexOfFirstMemo = indexOfLastMemo - memosPerPage;

    // ==========================================================
    // ✅✅✅ [오타 수정] ✅✅✅
    // `indexOfFirstMemo` -> `indexOfLastMemo`로 수정
    // ==========================================================
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
            {/* [수정 1] <style> 태그 (11:27AM과 동일) */}
            <style>
                {`
.highlighted-text {
    background-color: #fcf8e3;
    cursor: pointer;
    transition: background-color 0.2s, font-weight 0.2s;
    border-radius: 3px;
    padding: 0 2px;
}

.highlighted-text.hovered {
    background-color: #f7e6a0;
    font-weight: 600;
}

/* ✅ 수정된 메모 카드 스타일 */
.memo-card {
    border: none; /* 기본 상태: 테두리 제거 */
    transition: border-color 0.2s, box-shadow 0.2s, transform 0.2s;
    position: relative;
    z-index: 1;
}

/* ✅ 커서 올렸을 때만 갈색 테두리 + 위로 띄우기 */
.memo-card.hovered {
    border: 2px solid #b66e03;
    box-shadow: 0 6px 12px rgba(0,0,0,0.15);
    z-index: 10; /* 위로 올라오게 */
    transform: translateY(-2px); /* 살짝 떠보이게 */
}
`}
            </style>
            <Row>
                {/* 1. AI 요약 본문 (변경 없음) */}
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
                        onMouseUp={handleTextSelection}
                    >
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
                            {/* [수정 2] map (11:27AM과 동일) */}
                            {currentMemos.map((memo) => (
                                <Card
                                    key={memo.id}
                                    className={`mb-2 memo-card ${memo.id === hoveredMemoId ? 'hovered' : ''}`}
                                    onMouseEnter={() => setHoveredMemoId(memo.id)}
                                    onMouseLeave={() => setHoveredMemoId(null)}
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
