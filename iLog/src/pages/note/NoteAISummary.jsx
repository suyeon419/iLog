// NoteAISummary.jsx (마크다운 렌더링 및 기존 기능 유지)

import React, { useState } from 'react';
import { Row, Col, Card, Button, Form } from 'react-bootstrap';
import { marked } from 'marked'; // [1. 수정] marked 라이브러리 임포트

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
        //
        const selection = window.getSelection();
        if (!selection.rangeCount) return;

        const range = selection.getRangeAt(0);
        const selectedText = range.toString().trim();

        if (selectedText) {
            // [2. 수정] <pre>가 아닌 <div>이므로 'preNode' -> 'containerNode'로 변수명 변경 (기능 동일)
            const containerNode = e.currentTarget; //

            const preSelectionRange = document.createRange();
            preSelectionRange.selectNodeContents(containerNode);
            preSelectionRange.setEnd(range.startContainer, range.startOffset);

            const startIndex = preSelectionRange.toString().length; //
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
        //
        if (!pendingMemo || !newMemoContent.trim()) {
            handleCancelNewMemo();
            return;
        }
        onMemoAdd(newMemoContent.trim(), pendingMemo.startIndex, pendingMemo.endIndex, pendingMemo.positionContent);
        handleCancelNewMemo();
    };

    const handleCancelNewMemo = () => {
        //
        setPendingMemo(null);
        setNewMemoContent('');
    };

    // [3. 수정] 마크다운을 렌더링하도록 함수 수정
    const renderSummaryWithHighlights = () => {
        //
        if (!summaryText) return null;

        // 메모가 없으면 전체 텍스트를 마크다운으로 변환
        if (!initialMemos || initialMemos.length === 0) {
            // marked.parse()는 전체 문서를 파싱 (예: <p> 태그 등 생성)
            return <div dangerouslySetInnerHTML={{ __html: marked.parse(summaryText) }} />;
        }

        const sortedMemos = initialMemos
            .filter(
                (memo) =>
                    memo.startIndex != null &&
                    memo.endIndex != null &&
                    memo.endIndex > memo.startIndex &&
                    memo.endIndex <= summaryText.length
            )
            .sort((a, b) => a.startIndex - b.startIndex); //

        if (sortedMemos.length === 0) {
            return <div dangerouslySetInnerHTML={{ __html: marked.parse(summaryText) }} />;
        }

        let lastIndex = 0;
        const parts = [];

        sortedMemos.forEach((memo) => {
            if (memo.startIndex < lastIndex) {
                return;
            }

            if (memo.startIndex > lastIndex) {
                // 하이라이트 아닌 부분 (마크다운 *인라인*으로 변환)
                const textPart = summaryText.substring(lastIndex, memo.startIndex);
                // marked.parseInline()은 <p> 같은 블록 태그를 만들지 않아 문장 흐름에 적합
                parts.push(
                    <span
                        key={`part-${lastIndex}`}
                        dangerouslySetInnerHTML={{ __html: marked.parseInline(textPart) }}
                    />
                );
            }

            // 하이라이트 된 부분 (마크다운 *인라인*으로 변환)
            const highlightedTextPart = summaryText.substring(memo.startIndex, memo.endIndex);
            parts.push(
                <span
                    key={memo.id}
                    className={`highlighted-text ${memo.id === hoveredMemoId ? 'hovered' : ''}`}
                    onMouseEnter={() => setHoveredMemoId(memo.id)}
                    onMouseLeave={() => setHoveredMemoId(null)}
                >
                    <span dangerouslySetInnerHTML={{ __html: marked.parseInline(highlightedTextPart) }} />
                </span>
            );

            lastIndex = memo.endIndex;
        });

        if (lastIndex < summaryText.length) {
            // 마지막 남은 부분 (마크다운 *인라인*으로 변환)
            const lastTextPart = summaryText.substring(lastIndex);
            parts.push(
                <span
                    key={`part-${lastIndex}`}
                    dangerouslySetInnerHTML={{ __html: marked.parseInline(lastTextPart) }}
                />
            );
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

    // ... (sortedMemoList 정렬 로직 변경 없음) ...
    const sortedMemoList = initialMemos.slice().sort((a, b) => {
        if (a.startIndex == null) return 1;
        if (b.startIndex == null) return -1;
        return a.startIndex - b.startIndex;
    });

    return (
        <>
            <Row>
                {/* 1. AI 요약 본문 */}
                <Col md={8} className="ai-summary-content">
                    <h4 className="fw-bold mb-3">
                        <i className="bi bi-robot me-2"></i>AI 요약 피드백
                    </h4>

                    {/* [5. 수정] <pre> 태그를 <div>로 변경 */}
                    <div
                        className="ai-summary-box note-box" // 클래스명 변경 (CSS 적용 위함)
                        style={{
                            cursor: 'text',
                            whiteSpace: 'pre-wrap', // <pre>의 동작(줄바꿈 유지)을 CSS로 구현
                            wordWrap: 'break-word', // 긴 단어 줄바꿈
                            // fontFamily, fontSize는 note-box 클래스나 부모 스타일을 따름
                        }}
                        onMouseUp={handleTextSelection} //
                    >
                        {renderSummaryWithHighlights()}
                    </div>
                </Col>

                {/* 2. 메모 목록 표시 영역 (변경 없음) */}
                <Col md={4} style={{ backgroundColor: '#f5f1ec' }}>
                    {/* ... (h4, pendingMemo 폼, memo-list-container 렌더링 로직 모두 동일) ... */}
                    <h4 className="fw-bold mb-3 mt-2">
                        <i className="bi bi-card-text me-2"></i>메모 목록
                    </h4>

                    {pendingMemo && ( //
                        <Card className="mb-3 memo-card">
                            {/* ... (새 메모 폼 내용) ... */}
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

                    {initialMemos.length > 0 ? (
                        <div className="memo-list-container pt-2">
                            {/* sortedMemoList.map을 사용 */}
                            {sortedMemoList.map((memo) =>
                                editingMemoId === memo.id ? (
                                    <Card key={memo.id} className="mb-2 memo-card">
                                        {/* ... (수정 폼) ... */}
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
                                    <Card
                                        key={memo.id}
                                        className={`mb-2 memo-card ${memo.id === hoveredMemoId ? 'hovered' : ''}`}
                                        onMouseEnter={() => setHoveredMemoId(memo.id)}
                                        onMouseLeave={() => setHoveredMemoId(null)}
                                    >
                                        {/* ... (일반 메모 카드) ... */}
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
