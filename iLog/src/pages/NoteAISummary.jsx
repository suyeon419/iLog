// AISummary.jsx

import React, { useState } from 'react';
import { Row, Col, Card, Modal, Button, Form } from 'react-bootstrap';

// 1. 컴포넌트 이름 변경 (파일 이름과 일치)
export default function NoteAISummary({ summaryText, initialMemos }) {
    const [memos, setMemos] = useState(initialMemos || []);
    const [showModal, setShowModal] = useState(false);
    const [memoInput, setMemoInput] = useState('');
    const [selectedText, setSelectedText] = useState('');

    // (핸들러 함수들은 동일)
    const handleMouseUp = () => {
        const text = window.getSelection().toString().trim();
        if (text) {
            setSelectedText(text);
        }
    };

    const handleContextMenu = (e) => {
        e.preventDefault();
        if (selectedText) {
            setShowModal(true);
        }
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setMemoInput('');
        setSelectedText('');
    };

    const handleSaveMemo = () => {
        const newMemo = {
            id: Date.now(),
            person: '사용자',
            note: memoInput,
            context: selectedText,
        };
        setMemos([...memos, newMemo]);
        handleCloseModal();
    };

    return (
        <>
            <Row>
                <Col md={8}>
                    {/* 2. <pre> 태그에 style 대신 Bootstrap 클래스 적용 */}
                    <pre
                        onMouseUp={handleMouseUp}
                        onContextMenu={handleContextMenu}
                        className="border p-3 rounded text-break"
                    >
                        {summaryText}
                    </pre>
                </Col>

                <Col md={4}>
                    {memos.map((memo) => (
                        // 3. index.css의 .card 클래스 사용
                        <Card key={memo.id} className="mb-2">
                            {/* 4. index.css의 .cardHeader 클래스 사용 */}
                            <Card.Header className="cardHeader py-2 px-3 fw-bold">{memo.person}</Card.Header>
                            {/* 5. Bootstrap 클래스로 본문 스타일링 */}
                            <Card.Body className="p-2">
                                {memo.context && (
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

            {/* 6. 모달 내부는 Bootstrap 클래스로 스타일링 */}
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
                                // 7. index.css의 .form-control 너비를 덮어쓰기 위해 w-100 사용
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
