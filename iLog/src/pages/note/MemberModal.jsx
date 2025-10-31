// MemberModal.jsx

import React, { useState } from 'react';
import { Modal, Button, Form, Badge, ListGroup } from 'react-bootstrap';

// ... (DUMMY_MEMBERS, export default ... handle... 함수들은 기존과 동일) ...
const DUMMY_MEMBERS = [
    { id: 1, name: '김가현', email: 'rlarkgus_6@naver.com', isLeader: false },
    { id: 2, name: '김우혁', email: 'dngur521@gmail.com', isLeader: false },
    { id: 3, name: '이수연', email: 'lsyeon030419@kumoh.ac.kr', isLeader: false },
    { id: 4, name: '최겸', email: 'gkskdml7419@gmail.com', isLeader: true },
];

export default function MemberModal({ show, onHide }) {
    const inviteLink = 'https://elyra.ai/meetings/team-lck/ai-pl';
    const [email, setEmail] = useState('');

    const handleSearch = () => {
        console.log('Searching for email:', email);
    };

    const handleRemoveMember = (memberId) => {
        console.log('Removing member:', memberId);
    };

    const handleCopyLink = () => {
        navigator.clipboard
            .writeText(inviteLink)
            .then(() => alert('초대 링크가 복사되었습니다!'))
            .catch((err) => console.error('Failed to copy: ', err));
    };

    return (
        <Modal show={show} onHide={onHide} centered className="modal-custom-bg">
            <Modal.Header closeButton className="border-0">
                <Modal.Title className="fw-bold">조원 관리</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {/* 1. 초대 링크 (d-flex로 간격 분리) */}
                <Form.Group className="mb-3">
                    <Form.Label>초대 링크</Form.Label>
                    <div className="d-flex">
                        <Form.Control type="text" className="form-modal" value={inviteLink} readOnly />
                        <Button variant="secondary" onClick={handleCopyLink} className="ms-2">
                            복사
                        </Button>
                    </div>
                </Form.Group>

                {/* 2. 이메일로 초대 (d-flex로 간격 분리) */}
                <Form.Group className="mb-4">
                    <Form.Label>이메일</Form.Label>
                    <div className="d-flex">
                        <Form.Control
                            type="email"
                            className="form-modal"
                            placeholder="이메일"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                        {/* [수정] '검색' 버튼을 secondary (회색)로 변경 */}
                        <Button variant="secondary" onClick={handleSearch} className="ms-2">
                            검색
                        </Button>
                    </div>
                </Form.Group>

                {/* 3. 조원 목록 (ListGroup 사용) */}
                <hr className="brownHr my-1" />

                <ListGroup variant="flush">
                    {DUMMY_MEMBERS.map((member) => (
                        <>
                            <ListGroup.Item
                                key={member.id}
                                // [수정] px-0 클래스를 추가하여 좌우 패딩 제거 (라인 맞춤)
                                className="d-flex align-items-center justify-content-between px-0"
                                style={{ backgroundColor: 'transparent' }}
                            >
                                <div className="d-flex align-items-center">
                                    <div
                                        className="rounded-circle me-3"
                                        style={{ width: '40px', height: '40px', backgroundColor: '#e0e0e0' }}
                                    ></div>
                                    <div>
                                        <span className="fw-semibold">{member.name}</span>
                                        {member.isLeader && <Badge className="ms-2 badge-leader">팀장</Badge>}
                                        <br />
                                        <small className="text-muted">{member.email}</small>
                                    </div>
                                </div>

                                {!member.isLeader && (
                                    <Button variant="danger" onClick={() => handleRemoveMember(member.id)}>
                                        삭제
                                    </Button>
                                )}
                            </ListGroup.Item>
                            <hr className="brownHr my-1" />
                        </>
                    ))}
                </ListGroup>
            </Modal.Body>
        </Modal>
    );
}
