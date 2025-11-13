// NoteAISummary.jsx (스크롤, 인라인 폼, *메모 목록 정렬* 적용)

import React, { useState } from 'react';
import { Row, Col, Card, Button, Form } from 'react-bootstrap';

export default function NoteAISummary({
    summaryText,
    meetingId,
    initialMemos = [],
    onMemoAdd,
    onMemoUpdate,
    onMemoDelete,
}) {
    const [hoveredMemoId, setHoveredMemoId] = useState(null);
    const [pendingMemo, setPendingMemo] = useState(null);
    const [newMemoContent, setNewMemoContent] = useState('');
    const [editingMemoId, setEditingMemoId] = useState(null);
    const [editingMemoContent, setEditingMemoContent] = useState('');

    // ... (handleTextSelection, handleSaveNewMemo, handleCancelNewMemo 함수 변경 없음) ...
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

            setPendingMemo({
                startIndex: startIndex,
                endIndex: endIndex,
                positionContent: selectedText,
            });
            setNewMemoContent(selectedText);

            selection.removeAllRanges();
        }
    };

    const handleSaveNewMemo = () => {
        if (!pendingMemo || !newMemoContent.trim()) {
            handleCancelNewMemo();
            return;
        }
        onMemoAdd(newMemoContent.trim(), pendingMemo.startIndex, pendingMemo.endIndex, pendingMemo.positionContent);
        handleCancelNewMemo();
    };

    const handleCancelNewMemo = () => {
        setPendingMemo(null);
        setNewMemoContent('');
    };

    // ... (renderSummaryWithHighlights 함수 변경 없음) ...
    const renderSummaryWithHighlights = () => {
        if (!initialMemos || initialMemos.length === 0 || !summaryText) {
            return summaryText;
        }

        // ⚠️ 참고: 이 함수는 '형광펜'을 그리기 위한 정렬 (이미 startIndex 기준)
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

    // ... (handleEditClick, handleUpdateSave, handleUpdateCancel 함수 변경 없음) ...
    const handleEditClick = (memo) => {
        setEditingMemoId(memo.id);
        setEditingMemoContent(memo.content);
        setPendingMemo(null);
    };

    const handleUpdateSave = () => {
        if (!editingMemoId || !editingMemoContent.trim()) {
            handleUpdateCancel();
            return;
        }
        onMemoUpdate(editingMemoId, editingMemoContent.trim());
        handleUpdateCancel();
    };

    const handleUpdateCancel = () => {
        setEditingMemoId(null);
        setEditingMemoContent('');
    };

    // ========================================================
    // ✅ [신규] 1. '메모 목록'을 startIndex 기준으로 정렬
    // ========================================================
    // .sort()는 원본 배열(props)을 변경할 수 있으므로, .slice()로 복사본을 만들어 정렬합니다.
    const sortedMemoList = initialMemos
        .slice() // 원본 배열(props)을 변경하지 않기 위해 복사
        .sort((a, b) => {
            // startIndex가 없는 경우(null, undefined)를 대비해 맨 뒤로 보냅니다.
            if (a.startIndex == null) return 1;
            if (b.startIndex == null) return -1;
            return a.startIndex - b.startIndex;
        });

    return (
        <>
            {/* <style> 태그 (변경 없음) */}
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
                
                .memo-card {
                    border: none;
                    transition: border-color 0.2s, box-shadow 0.2s, transform 0.2s;
                    position: relative;
                    z-index: 1;
                }
                
                .memo-card.hovered {
                    border: 2px solid #b66e03;
                    box-shadow: 0 6px 12px rgba(0,0,0,0.15);
                    z-index: 10;
                    transform: translateY(-2px);
                }

                .memo-list-container {
                    max-height: 60vh; 
                    overflow-y: auto;
                    padding-right: 5px;
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
                <Col md={4} style={{ backgroundColor: '#f5f1ec' }}>
                    <h4 className="fw-bold mb-3 mt-2">
                        <i className="bi bi-card-text me-2"></i>메모 목록
                    </h4>

                    {/* '새 메모' 입력 폼 (변경 없음) */}
                    {pendingMemo && (
                        <Card className="mb-3 memo-card">
                            <Card.Header className="bg-transparent border-bottom-0">
                                <h5 className="cardHeader-memo">새 메모 추가</h5>
                            </Card.Header>
                            <Card.Body className="pt-2 px-3 pb-3">
                                <Form.Control
                                    as="textarea"
                                    rows={3}
                                    value={newMemoContent}
                                    onChange={(e) => setNewMemoContent(e.target.value)}
                                    autoFocus
                                    className="w-100"
                                />
                                <div className="d-flex justify-content-end gap-2 mt-2">
                                    <Button variant="outline-primary" size="sm" onClick={handleCancelNewMemo}>
                                        취소
                                    </Button>
                                    <Button variant="primary" size="sm" onClick={handleSaveNewMemo}>
                                        저장
                                    </Button>
                                </div>
                            </Card.Body>
                        </Card>
                    )}
                    {/* --- 새 메모 입력 폼 끝 --- */}

                    {/* 기존 메모 목록 렌더링 */}
                    {initialMemos.length > 0 ? (
                        <div className="memo-list-container pt-2">
                            {/* ✅ [수정] 2. initialMemos.map -> sortedMemoList.map */}
                            {sortedMemoList.map((memo) =>
                                // 현재 맵의 memo.id가 수정 중인 ID와 같다면,
                                editingMemoId === memo.id ? (
                                    /* --- '수정 폼' 렌더링 (변경 없음) --- */
                                    <Card key={memo.id} className="mb-2 memo-card">
                                        <Card.Header className="bg-transparent border-bottom-0">
                                            <h5 className="cardHeader-memo">{memo.name || '참석자'}</h5>
                                        </Card.Header>
                                        <Card.Body className="pt-2 px-3 pb-3">
                                            <Form.Control
                                                as="textarea"
                                                rows={3}
                                                value={editingMemoContent}
                                                onChange={(e) => setEditingMemoContent(e.target.value)}
                                                autoFocus
                                                className="w-100"
                                            />
                                            <div className="d-flex justify-content-end gap-2 mt-2">
                                                <Button
                                                    variant="outline-primary"
                                                    size="sm"
                                                    onClick={handleUpdateCancel}
                                                >
                                                    취소
                                                </Button>
                                                <Button variant="primary" size="sm" onClick={handleUpdateSave}>
                                                    저장
                                                </Button>
                                            </div>
                                        </Card.Body>
                                    </Card>
                                ) : (
                                    /* --- '일반 메모 카드' 렌더링 (변경 없음) --- */
                                    <Card
                                        key={memo.id}
                                        className={`mb-2 memo-card ${memo.id === hoveredMemoId ? 'hovered' : ''}`}
                                        onMouseEnter={() => setHoveredMemoId(memo.id)}
                                        onMouseLeave={() => setHoveredMemoId(null)}
                                    >
                                        <Card.Header className="bg-transparent border-bottom-0">
                                            <h5 className="cardHeader-memo">{memo.name || '참석자'}</h5>
                                        </Card.Header>
                                        <Card.Body className="pt-0">
                                            <Card.Text>{memo.content}</Card.Text>
                                            <div className="d-flex justify-content-end gap-2">
                                                <Button
                                                    variant="outline-secondary"
                                                    size="sm"
                                                    onClick={() => handleEditClick(memo)}
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
                                )
                            )}
                        </div>
                    ) : (
                        !pendingMemo && <p className="text-muted">요약본의 텍스트를 드래그하여 메모를 추가하세요.</p>
                    )}
                </Col>
            </Row>
        </>
    );
}
