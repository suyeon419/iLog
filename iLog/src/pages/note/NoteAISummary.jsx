// NoteAISummary.jsx

import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Modal, Button, Form, Spinner } from 'react-bootstrap';
import { MicFill, Bullseye } from 'react-bootstrap-icons';
import { createMemo } from '../../api/note'; // 메모 생성 API 임포트

export default function NoteAISummary({ summaryText, initialMemos, meetingId }) {
    const [memos, setMemos] = useState(initialMemos || []);
    const [showMemoModal, setShowMemoModal] = useState(false);
    const [selectedText, setSelectedText] = useState('');
    const [memoContent, setMemoContent] = useState('');
    const [isSavingMemo, setIsSavingMemo] = useState(false); // 메모 저장 로딩

    // 부모의 API 호출로 initialMemos가 변경될 수 있으므로 동기화
    useEffect(() => {
        setMemos(initialMemos || []);
    }, [initialMemos]);

    // 요약 본문 드래그 시 인용할 텍스트 저장
    const handleMouseUp = () => {
        const selection = window.getSelection().toString().trim();
        if (selection.length > 0) {
            setSelectedText(selection);
        }
    };

    // 우클릭 시 메모 모달 표시
    const handleContextMenu = (e) => {
        if (selectedText) {
            e.preventDefault();
            setShowMemoModal(true);
        }
    };

    // '메모 저장' (API 연동)
    const handleSaveMemo = async () => {
        if (isSavingMemo) return;
        setIsSavingMemo(true);

        // API로 보낼 payload
        const payload = {
            content: memoContent,
            selection: selectedText,
            // (백엔드 API 규격에 맞게 수정 필요)
        };

        try {
            // API 호출 (예: POST /minutes/19/memos)
            const newMemo = await createMemo(meetingId, payload);

            // API가 반환한 새 메모 객체(newMemo)를 state에 추가
            // (백엔드가 { id, person, note } 같은 형식을 반환한다고 가정)
            setMemos([...memos, newMemo]);

            handleCloseModal(); // 모달 닫기 및 초기화
        } catch (err) {
            console.error('Failed to save memo:', err);
            alert('메모 저장에 실패했습니다.');
            setIsSavingMemo(false); // 저장 실패 시 로딩 해제
        }
    };

    // 모달 닫기 (및 state 초기화)
    const handleCloseModal = () => {
        setShowMemoModal(false);
        setMemoContent('');
        setSelectedText('');
        setIsSavingMemo(false); // 로딩 상태 초기화
    };

    return (
        <>
            <Row>
                {/* 1. AI 요약 본문 (하드코딩 제거) */}
                <Col md={8} className="ai-summary-content" onMouseUp={handleMouseUp} onContextMenu={handleContextMenu}>
                    <h4 className="fw-bold mb-3">
                        <i className="bi bi-robot me-2"></i>AI 요약 피드백
                    </h4>

                    {/* Postman에서 \n으로 줄바꿈된 텍스트를 그대로 렌더링하기 위해 
                      <pre> 태그 사용 (부트스트랩 기본 스타일 리셋 필요 시 css 추가) 
                    */}
                    <pre
                        className="ai-summary-pre note-box"
                        style={{
                            fontFamily: 'inherit' /* 부모 폰트 상속 */,
                            fontSize: 'inherit' /* 부모 폰트 크기 상속 */,
                        }}
                    >
                        {summaryText}
                    </pre>
                </Col>

                {/* 2. 메모 목록 (API로 받은 memos 렌더링) */}
                <Col md={4}>
                    {memos.map((memo) => (
                        <Card key={memo.id} className="mb-3 memo-card">
                            <Card.Body>
                                {/* TODO: memo.person도 API에서 받아와야 함 */}
                                <strong className="d-block">{memo.person || '사용자'}</strong>
                                <hr className="brownHr my-2" />
                                <Card.Text>
                                    {/* TODO: API에서 memo.note 형식을 확인하세요 */}
                                    {(memo.note || memo.content).split('\n').map((line, idx) => (
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

            {/* 3. 메모 추가 모달 (로딩 상태 반영) */}
            <Modal show={showMemoModal} onHide={handleCloseModal} centered>
                <Modal.Header closeButton>
                    <Modal.Title>메모 추가</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form>
                        <Form.Group className="mb-3">
                            <Form.Label>인용된 텍스트</Form.Label>
                            <Form.Control as="textarea" rows={3} value={selectedText} readOnly disabled />
                        </Form.Group>
                        <Form.Group>
                            <Form.Label>메모 내용</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={3}
                                value={memoContent}
                                onChange={(e) => setMemoContent(e.target.value)}
                                placeholder="메모를 입력하세요..."
                                disabled={isSavingMemo}
                                autoFocus
                            />
                        </Form.Group>
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleCloseModal} disabled={isSavingMemo}>
                        취소
                    </Button>
                    <Button variant="primary" onClick={handleSaveMemo} disabled={isSavingMemo}>
                        {isSavingMemo ? <Spinner as="span" size="sm" /> : '저장'}
                    </Button>
                </Modal.Footer>
            </Modal>
        </>
    );
}
