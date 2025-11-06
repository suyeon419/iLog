// MemberModal.jsx

import React, { useState } from 'react';
// [수정 1] OverlayTrigger와 Tooltip을 import 합니다.
import { Modal, Button, Form, Badge, ListGroup, OverlayTrigger, Tooltip } from 'react-bootstrap';

export default function MemberModal({ show, onHide, members = [], inviteLink = '' }) {
    const [email, setEmail] = useState('');
    // [수정 2] '복사됨!' 툴팁을 위한 state 추가
    const [showCopiedTooltip, setShowCopiedTooltip] = useState(false);

    const handleSearch = () => {
        console.log('Searching for email:', email);
        // TODO: 이메일 검색 API 호출 로직 구현
    };

    const handleRemoveMember = (memberId) => {
        console.log('Removing member:', memberId);
        // TODO: 멤버 삭제 API 호출 로직 구현
    };

    // [수정 3] '복사됨!' 툴팁 state를 제어하도록 handleCopyLink 수정
    const handleCopyLink = () => {
        if (!inviteLink) {
            alert('초대 링크가 없습니다.');
            return;
        }
        navigator.clipboard
            .writeText(inviteLink)
            .then(() => {
                // 툴팁을 2초간 보여줍니다.
                setShowCopiedTooltip(true);
                setTimeout(() => {
                    setShowCopiedTooltip(false);
                }, 2000);
            })
            .catch((err) => console.error('Failed to copy: ', err));
    };

    return (
        <Modal show={show} onHide={onHide} centered className="modal-custom-bg">
            <Modal.Header closeButton className="border-0">
                <Modal.Title className="fw-bold">조원 관리</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {/* [수정 4] 초대 링크 영역에 OverlayTrigger 적용 */}
                <Form.Group className="mb-3">
                    <Form.Label>초대 링크</Form.Label>
                    <div className="d-flex gap-2">
                        <Form.Control
                            className="form-modal"
                            type="text"
                            value={inviteLink || '링크 정보가 없습니다.'}
                            readOnly
                        />
                        <OverlayTrigger
                            placement="top"
                            overlay={<Tooltip id="tooltip-copy">{showCopiedTooltip ? '복사됨!' : '복사하기'}</Tooltip>}
                        >
                            {/* 툴팁이 보일 때 버튼 스타일을 다르게 합니다. */}
                            <Button
                                variant={showCopiedTooltip ? 'outline-secondary' : 'secondary'}
                                onClick={handleCopyLink}
                            >
                                복사
                            </Button>
                        </OverlayTrigger>
                    </div>
                </Form.Group>

                {/* 2. 이메일로 초대 (이 모달의 고유 기능이므로 유지) */}
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
                    {Array.isArray(members) &&
                        members.map((member) => (
                            <React.Fragment key={member.id}>
                                <ListGroup.Item
                                    className="d-flex align-items-center justify-content-between px-0"
                                    style={{ backgroundColor: 'transparent' }}
                                >
                                    <div className="d-flex align-items-center">
                                        {/* [수정 5] 이미지 로딩 실패 시 onError 핸들러 추가 */}
                                        {member.participantImage ? (
                                            <img
                                                src={member.participantImage}
                                                alt="profile"
                                                className="rounded-circle me-3"
                                                style={{ width: '40px', height: '40px', objectFit: 'cover' }}
                                                onError={(e) => {
                                                    console.error(`❌ 이미지 로드 실패: ${member.participantImage}`);
                                                    e.target.src = '/default-profile.png'; // TODO: 이 대체 이미지 파일이 public 폴더에 있어야 합니다.
                                                }}
                                            />
                                        ) : (
                                            <div
                                                className="rounded-circle me-3"
                                                style={{ width: '40px', height: '40px', backgroundColor: '#e0e0e0' }}
                                            >
                                                {/* 기본 아이콘이나 빈 공간 */}
                                            </div>
                                        )}

                                        {/* 이름, 이메일, 팀장 배지 (이 모달의 고유 기능) */}
                                        <div>
                                            <span className="fw-semibold">{member.participantName}</span>
                                            {member.leader && <Badge className="ms-2 badge-leader">팀장</Badge>}
                                            <br />
                                            <small className="text-muted">{member.participantEmail}</small>
                                        </div>
                                    </div>

                                    {/* 삭제 버튼 (이 모달의 고유 기능) */}
                                    {!member.leader && (
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
