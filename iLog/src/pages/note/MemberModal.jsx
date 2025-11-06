// MemberModal.jsx

import React, { useState } from 'react';
import { Modal, Button, Form, Badge, ListGroup } from 'react-bootstrap';

// [수정] DUMMY_MEMBERS 배열을 삭제합니다.

// [수정] 부모 컴포넌트로부터 'members' 목록을 prop으로 받습니다.
// members = [] : members prop이 전달되지 않을 경우를 대비해 빈 배열을 기본값으로 설정합니다.
export default function MemberModal({ show, onHide, members = [] }) {
    const inviteLink = 'https://elyra.ai/meetings/team-lck/ai-pl';
    const [email, setEmail] = useState('');

    const handleSearch = () => {
        console.log('Searching for email:', email);
        // TODO: 이메일 검색 API 호출 로직 구현
    };

    const handleRemoveMember = (memberId) => {
        console.log('Removing member:', memberId);
        // TODO: 멤버 삭제 API 호출 로직 구현
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
                    <div className="d-flex gap-2">
                        <Form.Control className="form-modal" type="text" value={inviteLink} readOnly />
                        <Button variant="secondary" onClick={handleCopyLink}>
                            복사
                        </Button>
                    </div>
                </Form.Group>

                {/* 2. 이메일로 초대 */}
                <Form.Group className="mb-3">
                    <Form.Label>이메일</Form.Label>
                    <div className="d-flex gap-2">
                        <Form.Control
                            type="email"
                            className="form-modal"
                            placeholder="이메일"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                        <Button variant="secondary" onClick={handleSearch}>
                            검색
                        </Button>
                    </div>
                </Form.Group>

                {/* 3. 조원 목록 */}
                <hr className="brownHr my-1" />

                <ListGroup variant="flush" style={{ overflowY: 'auto' }}>
                    {/* [수정] DUMMY_MEMBERS 대신 props로 받은 'members'를 사용합니다. */}
                    {members.map((member) => (
                        // [수정] <React.Fragment> 또는 <>...</>로 감싸고 key를 최상단에 줍니다.
                        <React.Fragment key={member.id}>
                            <ListGroup.Item
                                className="d-flex align-items-center justify-content-between px-0"
                                style={{ backgroundColor: 'transparent' }}
                            >
                                <div className="d-flex align-items-center">
                                    <div
                                        className="rounded-circle me-3"
                                        style={{ width: '40px', height: '40px', backgroundColor: '#e0e0e0' }}
                                    >
                                        {/* TODO: 사용자 프로필 이미지 */}
                                    </div>
                                    <div>
                                        {/* TODO: API 응답에 맞게 'member.name', 'member.email' 등으로 수정 */}
                                        <span className="fw-semibold">{member.name}</span>
                                        {member.isLeader && <Badge className="ms-2 badge-leader">팀장</Badge>}
                                        <br />
                                        <small className="text-muted">{member.email}</small>
                                    </div>
                                </div>

                                {/* TODO: API 응답에 맞게 'member.isLeader' 등으로 수정 */}
                                {!member.isLeader && (
                                    <Button variant="danger" onClick={() => handleRemoveMember(member.id)}>
                                        삭제
                                    </Button>
                                )}
                            </ListGroup.Item>
                            <hr className="brownHr my-1" />
                        </React.Fragment>
                    ))}
                </ListGroup>
            </Modal.Body>
        </Modal>
    );
}
