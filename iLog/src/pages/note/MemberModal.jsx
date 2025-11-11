// MemberModal.jsx

import React, { useState } from 'react';
import { Modal, Button, Form, Badge, ListGroup, OverlayTrigger, Tooltip, Spinner } from 'react-bootstrap';

// [수정] deleteProjectMember 임포트
import { addProjectMemberByEmail, deleteProjectMember } from '../../api/note';

export default function MemberModal({
    show,
    onHide,
    members = [],
    inviteLink = '',
    folderId,
    onMemberUpdate, // 부모(NoteDetail) 상태 업데이트용 콜백
}) {
    const [email, setEmail] = useState('');
    const [isInviting, setIsInviting] = useState(false);
    const [showCopiedTooltip, setShowCopiedTooltip] = useState(false);

    // [수정] 삭제 로딩 상태를 관리할 state (삭제 중인 participantId 저장)
    const [isDeletingId, setIsDeletingId] = useState(null);

    // [수정] 이메일로 초대 기능 (이전과 동일)
    const handleInviteByEmail = async () => {
        if (!email) {
            alert('이메일을 입력해주세요.');
            return;
        }
        if (!folderId) {
            console.error('folderId가 없습니다.');
            alert('오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
            return;
        }

        setIsInviting(true);
        try {
            const updatedData = await addProjectMemberByEmail(folderId, email);
            if (onMemberUpdate) {
                onMemberUpdate(updatedData);
            }
            setEmail('');
        } catch (error) {
            console.error('Failed to add member by email:', error);
            // note.js에서 throw한 에러 메시지를 사용
            alert(error.message || '초대에 실패했습니다. 이메일을 확인해주세요.');
        } finally {
            setIsInviting(false);
        }
    };

    // [수정] 멤버 삭제 핸들러 구현
    const handleRemoveMember = async (participantId) => {
        // ❗ Postman을 보면 `member.id`가 아닌 `member.participantId`를 사용합니다.

        if (!window.confirm('정말로 이 멤버를 삭제하시겠습니까?')) {
            return;
        }
        if (!folderId) {
            console.error('folderId가 없습니다.');
            alert('오류가 발생했습니다.');
            return;
        }

        setIsDeletingId(participantId); // 해당 멤버 삭제 로딩 시작
        try {
            // [수정] 삭제 API 호출
            const updatedData = await deleteProjectMember(folderId, participantId);

            // 부모(NoteDetail) 상태 업데이트
            if (onMemberUpdate) {
                onMemberUpdate(updatedData);
            }
        } catch (error) {
            console.error('Failed to remove member:', error);
            alert(error.message || '멤버 삭제에 실패했습니다.');
        } finally {
            setIsDeletingId(null); // 로딩 종료
        }
    };

    // ... (handleCopyLink 함수는 동일) ...
    const handleCopyLink = () => {
        if (!inviteLink) {
            alert('초대 링크가 없습니다.');
            return;
        }
        navigator.clipboard
            .writeText(inviteLink)
            .then(() => {
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
                {/* 1. 초대 링크 (동일) */}
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
                            <Button
                                variant={showCopiedTooltip ? 'outline-secondary' : 'secondary'}
                                onClick={handleCopyLink}
                            >
                                복사
                            </Button>
                        </OverlayTrigger>
                    </div>
                </Form.Group>

                {/* 2. 이메일로 초대 (동일) */}
                <Form.Group className="mb-3">
                    <Form.Label>이메일</Form.Label>
                    <div className="d-flex gap-2">
                        <Form.Control
                            type="email"
                            className="form-modal"
                            placeholder="초대할 팀원의 이메일"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            disabled={isInviting}
                        />
                        <Button variant="secondary" onClick={handleInviteByEmail} disabled={isInviting}>
                            {isInviting ? <Spinner as="span" animation="border" size="sm" role="status" /> : '추가'}
                        </Button>
                    </div>
                </Form.Group>

                {/* 3. 조원 목록 */}
                <hr className="brownHr my-1" />

                <ListGroup variant="flush" style={{ overflowY: 'auto' }}>
                    {Array.isArray(members) &&
                        members.map((member) => (
                            // ❗ Key는 Postman 응답의 고유 ID인 `member.id`를 사용
                            <React.Fragment key={member.id}>
                                <ListGroup.Item
                                    className="d-flex align-items-center justify-content-between px-0"
                                    style={{ backgroundColor: 'transparent' }}
                                >
                                    <div className="d-flex align-items-center">
                                        {/* ... (프로필 이미지 렌더링 동일) ... */}
                                        {member.participantImage ? (
                                            <img
                                                src={member.participantImage}
                                                alt="profile"
                                                className="rounded-circle me-3"
                                                style={{ width: '40px', height: '40px', objectFit: 'cover' }}
                                                onError={(e) => {
                                                    console.error(`❌ 이미지 로드 실패: ${member.participantImage}`);
                                                    e.target.src = '/default-profile.png';
                                                }}
                                            />
                                        ) : (
                                            <div
                                                className="rounded-circle me-3"
                                                style={{ width: '40px', height: '40px', backgroundColor: '#e0e0e0' }}
                                            ></div>
                                        )}

                                        <div>
                                            <span className="fw-semibold">{member.participantName}</span>
                                            {member.leader && <Badge className="ms-2 badge-leader">팀장</Badge>}
                                            <br />
                                            <small className="text-muted">{member.participantEmail}</small>
                                        </div>
                                    </div>

                                    {/* [수정] 삭제 버튼 로직 */}
                                    {!member.leader && (
                                        <Button
                                            variant="danger"
                                            // ❗ API가 요구하는 `participantId`를 전달
                                            onClick={() => handleRemoveMember(member.participantId)}
                                            // ❗ 현재 삭제 중인 ID와 일치하면 비활성화
                                            disabled={isDeletingId === member.participantId}
                                        >
                                            {isDeletingId === member.participantId ? (
                                                <Spinner as="span" animation="border" size="sm" />
                                            ) : (
                                                '삭제'
                                            )}
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
