// NoteAISummary.jsx (옵션 2: DOM 순회 및 직접 조작 방식)

import React, { useState, useLayoutEffect, useRef, useEffect } from 'react';
import { Row, Col, Card, Button, Form } from 'react-bootstrap';
import { marked } from 'marked';

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

    // AI 요약본문 <div>에 연결할 ref
    const summaryContainerRef = useRef(null);

    useEffect(() => {
        window.scrollTo(0, 0);
    });
    /**
     * [수정] 텍스트 선택(드래그)시 호출되는 핸들러
     * 복잡한 HTML 구조 안에서도 정확한 텍스트 인덱스를 계산합니다.
     */
    const handleTextSelection = (e) => {
        const selection = window.getSelection();
        if (!selection.rangeCount) return;

        const range = selection.getRangeAt(0);
        const selectedText = range.toString().trim();

        // summaryContainerRef.current (요약 본문 div) 내부에서 일어난 selection인지 확인
        if (!summaryContainerRef.current || !summaryContainerRef.current.contains(range.startContainer)) {
            return;
        }

        if (selectedText) {
            const containerNode = summaryContainerRef.current;

            // container의 시작부터 selection의 시작점까지의 범위를 만듭니다.
            const preSelectionRange = document.createRange();
            preSelectionRange.selectNodeContents(containerNode);
            preSelectionRange.setEnd(range.startContainer, range.startOffset);

            // 해당 범위의 텍스트 길이를 계산하여 startIndex를 구합니다.
            const startIndex = preSelectionRange.toString().length;
            const endIndex = startIndex + selectedText.length;

            setPendingMemo({
                startIndex: startIndex,
                endIndex: endIndex,
                positionContent: selectedText,
            });
            // [요청사항] 드래그 시 메모 내용은 빈 칸으로 설정
            setNewMemoContent('');

            selection.removeAllRanges();
        }
    };

    /**
     * [신규] React의 렌더링이 DOM에 반영된 직후 실행되는 Hook.
     * 마크다운을 렌더링하고, 그 위에 하이라이트를 덧씌웁니다.
     */
    useLayoutEffect(() => {
        const container = summaryContainerRef.current;
        if (!container) return;

        // 1. [초기화]
        // summaryText를 기반으로 마크다운 HTML을 생성하여 <div> 내부에 렌더링합니다.
        // 이 작업은 이펙트가 실행될 때마다(데이터가 바뀔 때마다) 항상 새로 수행하여
        // 이전에 적용된 하이라이트를 모두 제거하고 깨끗한 상태에서 시작합니다.
        container.innerHTML = marked.parse(summaryText || '');

        // 2. [메모 필터링]
        // 유효하고 정렬된 메모 목록을 준비합니다.
        if (!initialMemos || initialMemos.length === 0) {
            return; // 적용할 메모가 없으면 종료
        }

        const sortedMemos = initialMemos
            .filter(
                (memo) =>
                    memo.startIndex != null &&
                    memo.endIndex != null &&
                    memo.endIndex > memo.startIndex &&
                    memo.endIndex <= summaryText.length
            )
            // [중요] 인덱스 꼬임을 방지하기 위해 *뒤에서부터* (내림차순) 정렬합니다.
            .sort((a, b) => b.startIndex - a.startIndex);

        // 3. [DOM 순회 및 하이라이트 적용]
        for (const memo of sortedMemos) {
            // TreeWalker로 <div> 내부의 텍스트 노드(Text Node)만 순회합니다.
            const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, null, false);

            let charIndex = 0;
            const nodesToModify = []; // 이번 메모에 해당되는 노드 조각들
            let currentNode;

            // 모든 텍스트 노드를 순회하며 인덱스 계산
            while ((currentNode = walker.nextNode())) {
                const nodeLength = currentNode.textContent.length;
                const nodeStart = charIndex;
                const nodeEnd = nodeStart + nodeLength;

                // 현재 텍스트 노드가 메모 범위와 겹치는지 확인
                const overlapStart = Math.max(nodeStart, memo.startIndex);
                const overlapEnd = Math.min(nodeEnd, memo.endIndex);

                if (overlapStart < overlapEnd) {
                    // 겹치는 부분이 있다면, 해당 노드와 범위를 저장
                    nodesToModify.push({
                        node: currentNode,
                        start: overlapStart - nodeStart, // 노드 내부에서의 시작 오프셋
                        end: overlapEnd - nodeStart, // 노드 내부에서의 끝 오프셋
                    });
                }
                charIndex = nodeEnd;
            }

            // [중요] 실제 DOM 변경은 노드 순회가 끝난 후 *뒤에서부터* 수행합니다.
            // (앞에서부터 변경하면 textContent가 쪼개져 인덱스가 밀림)
            for (const item of nodesToModify.reverse()) {
                const { node, start, end } = item;

                // 텍스트 노드를 범위(range)로 감싸고
                const range = document.createRange();
                range.setStart(node, start);
                range.setEnd(node, end);

                // 하이라이트용 <span> 태그 생성
                const highlightSpan = document.createElement('span');
                highlightSpan.className = `highlighted-text ${memo.id === hoveredMemoId ? 'hovered' : ''}`;

                // React state와 연동되는 이벤트 리스너 직접 연결
                highlightSpan.onmouseenter = () => setHoveredMemoId(memo.id);
                highlightSpan.onmouseleave = () => setHoveredMemoId(null);

                // range.surroundContents()로 <span> 태그 삽입
                // (이 과정에서 텍스트 노드가 쪼개짐)
                try {
                    range.surroundContents(highlightSpan);
                } catch (e) {
                    console.error('하이라이트 적용 중 오류:', e, memo);
                }
            }
        }

        // summaryText, initialMemos, hoveredMemoId가 변경될 때마다 이 로직을 다시 실행
    }, [summaryText, initialMemos, hoveredMemoId]);

    // --- (이하 메모 저장/수정/삭제 핸들러 - 변경 없음) ---

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

    const sortedMemoList = initialMemos.slice().sort((a, b) => {
        if (a.startIndex == null) return 1;
        if (b.startIndex == null) return -1;
        return a.startIndex - b.startIndex;
    });

    // --- (이하 JSX 렌더링 부분) ---

    return (
        <>
            <Row>
                {/* 1. AI 요약 본문 */}
                <Col md={8} className="ai-summary-content">
                    <h4 className="fw-bold mb-3">
                        <i className="bi bi-robot me-2"></i>AI 요약 피드백
                    </h4>

                    {/* [수정] 
                        - ref 추가
                        - onMouseUp 이벤트 핸들러 연결
                        - renderSummaryWithHighlights() 호출 제거 (useLayoutEffect가 처리)
                    */}
                    <div
                        ref={summaryContainerRef} // DOM 조작을 위한 ref 연결
                        className="ai-summary-box note-box"
                        style={{
                            cursor: 'text',
                            whiteSpace: 'pre-wrap',
                            wordWrap: 'break-word',
                        }}
                        onMouseUp={handleTextSelection} // 수정된 핸들러 연결
                    >
                        {/* 이곳의 내용은 useLayoutEffect가 
                          summaryText를 기반으로 동적으로 채워넣습니다. 
                        */}
                    </div>
                </Col>

                {/* 2. 메모 목록 표시 영역 (변경 없음) */}
                <Col md={4} style={{ backgroundColor: '#f5f1ec' }}>
                    <h4 className="fw-bold mb-3 mt-2">
                        <i className="bi bi-card-text me-2"></i>메모 목록
                    </h4>

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

                    {initialMemos.length > 0 ? (
                        <div className="memo-list-container pt-2">
                            {sortedMemoList.map((memo) =>
                                editingMemoId === memo.id ? (
                                    <Card key={memo.id} className="mb-2 memo-card">
                                        {/* (수정 폼 렌더링) */}
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
                                        {/* (일반 메모 카드 렌더링) */}
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
