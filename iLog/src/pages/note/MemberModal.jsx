// MemberModal.jsx

import React, { useState } from 'react';
import { Modal, Button, Form, Badge, ListGroup, OverlayTrigger, Tooltip, Spinner } from 'react-bootstrap';

// ❗ note.js의 API 함수를 여기서 직접 임포트하지 않습니다.
// 대신 props로 받아옵니다.

export default function MemberModal({
    show,
    onHide,
    members = [],
    inviteLink = '',
    onMemberUpdate, // 부모 상태 업데이트용 콜백

    // [✅ 1. 재사용을 위한 Props]
    entityId, // 폴더 ID(folderId) 또는 회의록 ID(meetingId)
    addMemberApi, // 멤버 추가 API 함수 (e.g., addProjectMemberByEmail)
    deleteMemberApi, // 멤버 삭제 API 함수 (e.g., deleteProjectMember)
}) {
    const [email, setEmail] = useState('');
    const [isInviting, setIsInviting] = useState(false);
    const [showCopiedTooltip, setShowCopiedTooltip] = useState(false);
    const [isDeletingId, setIsDeletingId] = useState(null);

    // [✅ 2. props로 받은 API 함수 사용하도록 수정]
    const handleInviteByEmail = async () => {
        if (!email) {
            alert('이메일을 입력해주세요.');
            return;
        }
        // entityId와 addMemberApi 함수가 있는지 확인
        if (!entityId || typeof addMemberApi !== 'function') {
            console.error('필수 props(entityId, addMemberApi)가 없습니다.');
            alert('오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
            return;
        }

        setIsInviting(true);
        try {
            // props로 받은 API 함수 호출
            const updatedData = await addMemberApi(entityId, email);

            if (onMemberUpdate) {
                onMemberUpdate(updatedData); // 부모 컴포넌트 상태 업데이트
            }
            setEmail('');
        } catch (error) {
            console.error('Failed to add member by email:', error);
            alert(error.message || '초대에 실패했습니다. 이메일을 확인해주세요.');
        } finally {
            setIsInviting(false);
        }
    };

    // [✅ 3. props로 받은 API 함수 사용하도록 수정]
    const handleRemoveMember = async (participantId) => {
        if (!window.confirm('정말로 이 멤버를 삭제하시겠습니까?')) {
            return;
        }
        // entityId와 deleteMemberApi 함수가 있는지 확인
        if (!entityId || typeof deleteMemberApi !== 'function') {
            console.error('필수 props(entityId, deleteMemberApi)가 없습니다.');
            alert('오류가 발생했습니다.');
            return;
        }

        setIsDeletingId(participantId); // 해당 멤버 삭제 로딩 시작
        try {
            // props로 받은 API 함수 호출
            const updatedData = await deleteMemberApi(entityId, participantId);

            if (onMemberUpdate) {
                onMemberUpdate(updatedData); // 부모 컴포넌트 상태 업데이트
            }
        } catch (error) {
            console.error('Failed to remove member:', error);
            alert(error.message || '멤버 삭제에 실패했습니다.');
        } finally {
            setIsDeletingId(null); // 로딩 종료
        }
    };

    // 모달이 닫힐 때 입력값 초기화
    const handleModalHide = () => {
        setEmail('');
        setIsInviting(false);
        setIsDeletingId(null);
        onHide(); // 부모의 onHide 함수 호출
    };

    return (
        <Modal show={show} onHide={handleModalHide} centered className="modal-custom-bg">
            <Modal.Header closeButton className="border-0">
                <Modal.Title className="fw-bold">참가자 관리</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {/* 1. 이메일로 초대 */}
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
                    {Array.isArray(members) && members.length > 0 ? (
                        members.map((member) => (
                            <React.Fragment key={member.id}>
                                <ListGroup.Item
                                    className="d-flex align-items-center justify-content-between px-0"
                                    style={{ backgroundColor: 'transparent' }}
                                >
                                    <div className="d-flex align-items-center">
                                        {/* ... (프로필 이미지 렌더링) ... */}
                                        {member.participantImage ? (
                                            <img
                                                src={member.participantImage}
                                                alt="profile"
                                                className="rounded-circle me-3"
                                                style={{ width: '40px', height: '40px', objectFit: 'cover' }}
                                                onError={(e) => {
                                                    e.target.src = '/default-profile.png'; // 기본 이미지
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

                                    {/* 삭제 버튼 로직 */}
                                    {!member.leader && (
                                        <Button
                                            variant="danger"
                                            onClick={() => handleRemoveMember(member.participantId)}
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
                        ))
                    ) : (
                        <ListGroup.Item
                            className="text-center text-muted px-0"
                            style={{ backgroundColor: 'transparent' }}
                        >
                            참가자가 없습니다.
                        </ListGroup.Item>
                    )}
                </ListGroup>
            </Modal.Body>
        </Modal>
    );
}
