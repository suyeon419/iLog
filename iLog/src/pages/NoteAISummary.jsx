// NoteAISummary.jsx

import React, { useState } from 'react';
import { Row, Col, Card, Modal, Button, Form } from 'react-bootstrap';
import { MicFill, Bullseye } from 'react-bootstrap-icons';

export default function NoteAISummary({ summaryText, initialMemos }) {
    const [memos, setMemos] = useState(initialMemos || []);
    const [showMemoModal, setShowMemoModal] = useState(false);
    const [selectedText, setSelectedText] = useState('');
    const [memoContent, setMemoContent] = useState('');

    const handleMouseUp = () => {
        const selection = window.getSelection().toString().trim();
        if (selection.length > 0) {
            setSelectedText(selection);
        }
    };

    const handleContextMenu = (e) => {
        if (selectedText) {
            e.preventDefault();
            setShowMemoModal(true);
        }
    };

    const handleSaveMemo = () => {
        const newMemo = {
            id: Date.now(),
            person: '사용자',
            note: `${memoContent}\n\n(인용: "${selectedText}")`,
        };
        setMemos([...memos, newMemo]);

        setShowMemoModal(false);
        setMemoContent('');
        setSelectedText('');
    };

    const handleCloseModal = () => {
        setShowMemoModal(false);
        setMemoContent('');
        setSelectedText('');
    };

    return (
        <>
            <Row>
                <Col md={8} className="ai-summary-content" onMouseUp={handleMouseUp} onContextMenu={handleContextMenu}>
                    <h4 className="fw-bold mb-3">
                        <i className="bi bi-robot me-2"></i>AI 요약 피드백
                    </h4>

                    <p className="mb-2 fw-bold">
                        <MicFill className="me-2" />
                        개발 분업
                    </p>
                    <ul>
                        {/* 1. <mark> 태그 제거 */}
                        <li>프론트엔드: UI 구현 및 사용자 인터랙션</li>
                        <li>백엔드: 서버 로직, 데이터 처리 및 기능 제어</li>
                    </ul>

                    <p className="mt-4 mb-2 fw-bold">
                        <MicFill className="me-2" />
                        기능 회의 요약
                    </p>
                    <div>
                        <strong>주제:</strong> 화상회의의 AI 회의록 기능 개선
                        <br />
                        <strong>핵심 내용:</strong>
                        <ol className="mt-1">
                            <li>
                                {/* 2. <mark> 태그 제거 */}
                                AI 회의록 기능 온·오프 설정 추가
                                <ul>
                                    <li>사용자가 회의 중에 AI 기록 기능을 활성화/비활성화할 수 있도록 구현</li>
                                    <li>UI 내 명확한 토글 스위치 또는 버튼 제공</li>
                                </ul>
                            </li>
                            <li className="mt-2">
                                발화자 구분 기능 추가
                                <ul>
                                    <li>AI가 회의 음성을 분석하여 누가 말했는지 식별</li>
                                    <li>회의록에 화자 이름 또는 프로필 표시</li>
                                </ul>
                            </li>
                        </ol>
                    </div>

                    <p className="mt-4 mb-2 fw-bold">
                        <Bullseye className="me-2" />
                        개발 목표
                    </p>
                    <ul>
                        <li>사용자에게 선택권과 명확성 제공</li>
                        <li>회의록의 정확도와 신뢰성 향상</li>
                    </ul>
                </Col>

                <Col md={4}>
                    {memos.map((memo) => (
                        <Card key={memo.id} className="mb-3 memo-card">
                            <Card.Body>
                                <strong className="d-block">{memo.person}</strong>
                                <hr className="brownHr my-2" />

                                <Card.Text>
                                    {memo.note.split('\n').map((line, idx) => (
                                        <React.Fragment key={idx}>
                                            {line}
                                            <br />
                                        </React.Fragment>
                                    ))}
                                </Card.Text>
                            </Card.Body>
                        </Card>
                    ))}
                </Col>
            </Row>

            {/* --- (메모 추가 모달은 동일) --- */}
            <Modal show={showMemoModal} onHide={handleCloseModal} centered className="modal-custom-bg">
                <Modal.Header closeButton className="border-0">
                    <Modal.Title className="fw-bold">새 메모 추가</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form.Group>
                        <Form.Label>선택한 텍스트</Form.Label>
                        <blockquote
                            className="blockquote-footer"
                            style={{ backgroundColor: '#e9e4db', padding: '10px', borderRadius: '5px' }}
                        >
                            {selectedText}
                        </blockquote>
                    </Form.Group>
                    <Form.Group className="mt-3">
                        <Form.Label>메모 내용</Form.Label>
                        <Form.Control
                            as="textarea"
                            rows={3}
                            value={memoContent}
                            onChange={(e) => setMemoContent(e.target.value)}
                            className="note-content-textarea"
                        />
                    </Form.Group>
                </Modal.Body>
                <Modal.Footer className="border-0">
                    <Button variant="secondary" onClick={handleCloseModal}>
                        취소
                    </Button>
                    <Button variant="primary" onClick={handleSaveMemo}>
                        메모 저장
                    </Button>
                </Modal.Footer>
            </Modal>
        </>
    );
}
