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
                        <li>프론트엔드: UI 구현 및 사용자 인터랙션</li>
                        <li>백엔드: 서버 로직, 데이터 처리 및 기능 제어</li>
                    </ul>

                    <p className="mt-4 mb-2 fw-bold">
                        <MicFill className="me-2" />
                        기능 회의 요약
                    </p>
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
        </>
    );
}
