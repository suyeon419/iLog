// MemberModal.jsx

import React, { useState } from 'react';
import { Modal, Button, Form, InputGroup, Badge } from 'react-bootstrap';
import { PersonCircle } from 'react-bootstrap-icons';

// 스크린샷 기반 더미 데이터
const DUMMY_MEMBERS = [
    { id: 1, name: '김가현', email: 'rlarkgus_6@naver.com', isLeader: false },
    { id: 2, name: '김우혁', email: 'dngur521@gmail.com', isLeader: false },
    { id: 3, name: '이수연', email: 'lsyeon030419@kumoh.ac.kr', isLeader: false },
    { id: 4, name: '최겸', email: 'gkskdml7419@gmail.com', isLeader: true },
];

export default function MemberModal({ show, onHide }) {
    const inviteLink = 'https://elyra.ai/meetings/team-lck/ai-pl'; // 스크린샷의 링크
    const [email, setEmail] = useState('');

    const handleSearch = () => {
        console.log('Searching for email:', email);
        // TODO: 이메일 검색 로직
    };

    const handleRemoveMember = (memberId) => {
        console.log('Removing member:', memberId);
        // TODO: 멤버 삭제 로직
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
                {/* 1. 초대 링크 */}
                <Form.Group className="mb-3">
                    <Form.Label>초대 링크</Form.Label>
                    <InputGroup>
                        <Form.Control type="text" value={inviteLink} readOnly />
                        <Button variant="secondary" onClick={handleCopyLink}>
                            복사
                        </Button>
                    </InputGroup>
                </Form.Group>

                {/* 2. 이메일로 초대 */}
                <Form.Group className="mb-4">
                    <Form.Label>이메일로 초대</Form.Label>
                    <InputGroup>
                        <Form.Control
                            type="email"
                            placeholder="이메일"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                        <Button variant="primary" onClick={handleSearch}>
                            검색
                        </Button>
                    </InputGroup>
                </Form.Group>

                {/* 3. 조원 목록 */}
                <div className="member-list">
                    <hr className="brownHr mt-0" />

                    {DUMMY_MEMBERS.map((member) => (
                        <div
                            key={member.id}
                            className="d-flex align-items-center justify-content-between py-3 member-list-item"
                        >
                            <div className="d-flex align-items-center">
                                <PersonCircle className="fs-1 text-secondary me-3" />
                                <div>
                                    <span className="fw-bold">{member.name}</span>
                                    {member.isLeader && (
                                        /* 1. style 속성을 지우고 'badge-leader' 클래스 추가 */
                                        <Badge className="ms-2 badge-leader">팀장</Badge>
                                    )}
                                    <br />
                                    <small className="text-muted">{member.email}</small>
                                </div>
                            </div>
                            {!member.isLeader && (
                                <Button variant="danger" size="sm" onClick={() => handleRemoveMember(member.id)}>
                                    삭제
                                </Button>
                            )}
                        </div>
                    ))}
                </div>
            </Modal.Body>
        </Modal>
    );
}
