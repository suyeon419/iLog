// NoteAISummary.jsx

import React, { useState, useMemo } from 'react';
import { Row, Col, Card, Modal, Button, Form } from 'react-bootstrap';

export default function NoteAISummary({ summaryText, initialMemos }) {
    const [memos, setMemos] = useState(initialMemos || []);
    const [showModal, setShowModal] = useState(false);
    const [memoInput, setMemoInput] = useState('');
    const [selectedText, setSelectedText] = useState('');
    const [selectionRange, setSelectionRange] = useState(null); // 선택 범위 저장

    // 2. HTML 문자열 대신 React 노드 배열을 생성하는 함수 (보안)
    const renderHighlightedText = useMemo(() => {
        if (!summaryText) return '';
        if (memos.length === 0) return [summaryText];

        const points = [0, summaryText.length];
        memos.forEach((memo) => {
            if (memo.startIndex !== undefined) points.push(memo.startIndex);
            if (memo.endIndex !== undefined) points.push(memo.endIndex);
        });
        const splitPoints = [...new Set(points)].sort((a, b) => a - b);

        const segments = [];
        for (let i = 0; i < splitPoints.length - 1; i++) {
            const start = splitPoints[i];
            const end = splitPoints[i + 1];

            if (start === end) continue;

            const textSegment = summaryText.substring(start, end);
            const midpoint = start + (end - start) / 2;

            const coveringMemo = memos.find((memo) => memo.startIndex <= midpoint && memo.endIndex >= midpoint);

            if (coveringMemo) {
                // 3. [변경] 형광펜 클래스 대신, '굵게' + '갈색' 클래스 적용
                segments.push(
                    <span
                        key={start}
                        className="fw-bold signup-link" // index.css의 .signup-link 사용
                    >
                        {textSegment}
                    </span>
                );
            } else {
                segments.push(textSegment);
            }
        }
        return segments;
    }, [summaryText, memos]);

    const handleMouseUp = () => {
        const selection = window.getSelection();
        const text = selection.toString().trim();

        if (text) {
            setSelectedText(text);

            // (참고: 이 방식은 동일한 텍스트가 여러 번 나올 경우 한계가 있습니다)
            const startIndex = summaryText.indexOf(text);

            if (startIndex !== -1) {
                const endIndex = startIndex + text.length;
                setSelectionRange({ startIndex, endIndex });
            } else {
                setSelectionRange(null);
            }
        } else {
            setSelectedText('');
            setSelectionRange(null);
        }
    };

    const handleContextMenu = (e) => {
        e.preventDefault();
        if (selectedText && selectionRange) {
            setShowModal(true);
        }
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setMemoInput('');
        setSelectedText('');
        setSelectionRange(null);
    };

    const handleSaveMemo = () => {
        if (!selectedText || !selectionRange) return;

        const newMemo = {
            id: Date.now(),
            person: '사용자',
            note: memoInput,
            context: selectedText,
            startIndex: selectionRange.startIndex,
            endIndex: selectionRange.endIndex,
            // 4. colorIndex 제거됨
        };
        setMemos([...memos, newMemo]);
        handleCloseModal();
    };

    return (
        <>
            <Row>
                <Col md={8}>
                    {/* 5. dangerouslySetInnerHTML을 사용하지 않고 안전하게 렌더링 */}
                    <pre
                        onMouseUp={handleMouseUp}
                        onContextMenu={handleContextMenu}
                        className="border p-3 rounded text-break"
                        style={{ cursor: 'text' }}
                    >
                        {renderHighlightedText}
                    </pre>
                </Col>

                <Col md={4}>
                    {memos.map((memo) => (
                        <Card key={memo.id} className="mb-2">
                            <Card.Header className="cardHeader py-2 px-3 fw-bold">{memo.person}</Card.Header>
                            <Card.Body className="p-2">
                                {memo.context && (
                                    // 6. [변경] 색상 사각형 제거, blockquote만 남김
                                    <blockquote className="border-start border-3 ps-2 m-0 mb-2 text-secondary">
                                        <small>"{memo.context}"</small>
                                    </blockquote>
                                )}
                                <Card.Text className="m-0">{memo.note}</Card.Text>
                            </Card.Body>
                        </Card>
                    ))}
                </Col>
            </Row>

            {/* (모달창 코드는 동일) */}
            <Modal show={showModal} onHide={handleCloseModal} centered>
                <Modal.Header closeButton>
                    <Modal.Title>메모 추가하기</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form>
                        <Form.Group className="mb-3">
                            <Form.Label className="fw-bold">선택한 내용</Form.Label>
                            <p className="bg-light p-2 rounded text-secondary">{selectedText}</p>
                        </Form.Group>
                        <Form.Group>
                            <Form.Label className="fw-bold">메모 내용</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={3}
                                value={memoInput}
                                onChange={(e) => setMemoInput(e.target.value)}
                                placeholder="메모를 입력하세요..."
                                className="w-100"
                            />
                        </Form.Group>
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleCloseModal}>
                        취소
                    </Button>
                    <Button variant="primary" onClick={handleSaveMemo}>
                        저장하기
                    </Button>
                </Modal.Footer>
            </Modal>
        </>
    );
}
