// AiSummaryView.jsx (새 파일)

import React, { useState } from 'react';
import { Row, Col, Card, Modal, Button, Form } from 'react-bootstrap';

export default function AiSummary({ summaryText, initialMemos }) {
    // 1. 메모 목록, 모달 상태, 입력값, 선택된 텍스트를 state로 관리
    const [memos, setMemos] = useState(initialMemos || []);
    const [showModal, setShowModal] = useState(false);
    const [memoInput, setMemoInput] = useState('');
    const [selectedText, setSelectedText] = useState('');

    // 2. 마우스 드래그가 끝났을 때 (버튼을 뗄 때) 실행
    const handleMouseUp = () => {
        const text = window.getSelection().toString().trim();
        if (text) {
            setSelectedText(text); // 선택된 텍스트를 state에 저장
        }
    };

    // 3. 텍스트 영역에서 우클릭 시 실행
    const handleContextMenu = (e) => {
        e.preventDefault(); // 기본 우클릭 메뉴 방지
        if (selectedText) {
            setShowModal(true); // 선택된 텍스트가 있으면 모달 열기
        }
    };

    // 4. 모달 닫기 (초기화)
    const handleCloseModal = () => {
        setShowModal(false);
        setMemoInput('');
        setSelectedText('');
    };

    // 5. 메모 저장
    const handleSaveMemo = () => {
        const newMemo = {
            id: Date.now(),
            person: '사용자', // (TODO: 실제 사용자 이름으로 변경 필요)
            note: memoInput,
            context: selectedText, // 어떤 텍스트에 대한 메모인지 저장
        };
        setMemos([...memos, newMemo]);
        handleCloseModal(); // 모달 닫기
    };

    return (
        <>
            <Row>
                {/* 6. (좌측) AI 요약본 텍스트 */}
                <Col md={8}>
                    <pre
                        onMouseUp={handleMouseUp} // 마우스 뗄 때
                        onContextMenu={handleContextMenu} // 우클릭 할 때
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
                            cursor: 'text',
                        }}
                    >
                        {summaryText}
                    </pre>
                </Col>

                {/* 7. (우측) 메모 목록 (이미지 참고) */}
                <Col md={4}>
                    {memos.map((memo) => (
                        <Card key={memo.id} className="mb-2" style={{ borderColor: '#b66e03' }}>
                            <Card.Header
                                style={{
                                    backgroundColor: '#f5f1ec',
                                    borderBottom: '1px solid #b66e03',
                                    padding: '0.5rem 1rem',
                                    fontWeight: 'bold',
                                }}
                            >
                                {memo.person}
                            </Card.Header>
                            <Card.Body style={{ padding: '0.75rem' }}>
                                {/* context(선택했던 텍스트)가 있으면 표시 */}
                                {memo.context && (
                                    <blockquote
                                        style={{
                                            fontSize: '0.9rem',
                                            borderLeft: '3px solid #ddd',
                                            paddingLeft: '10px',
                                            margin: '0 0 10px 0',
                                            color: '#555',
                                        }}
                                    >
                                        "{memo.context}"
                                    </blockquote>
                                )}
                                <Card.Text style={{ margin: 0 }}>{memo.note}</Card.Text>
                            </Card.Body>
                        </Card>
                    ))}
                </Col>
            </Row>

            {/* 8. 메모 추가용 모달 (react-bootstrap) */}
            <Modal show={showModal} onHide={handleCloseModal} centered>
                <Modal.Header closeButton>
                    <Modal.Title>메모 추가하기</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form>
                        <Form.Group className="mb-3">
                            <Form.Label style={{ fontWeight: 'bold' }}>선택한 내용</Form.Label>
                            <p
                                style={{
                                    backgroundColor: '#f8f9fa',
                                    padding: '10px',
                                    borderRadius: '5px',
                                    color: '#555',
                                }}
                            >
                                {selectedText}
                            </p>
                        </Form.Group>
                        <Form.Group>
                            <Form.Label style={{ fontWeight: 'bold' }}>메모 내용</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={3}
                                value={memoInput}
                                onChange={(e) => setMemoInput(e.target.value)}
                                placeholder="메모를 입력하세요..."
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
