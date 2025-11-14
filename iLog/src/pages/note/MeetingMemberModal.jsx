// MeetingMemberModal.jsx
// [목적] 특정 회의록(Minute) 레벨의 참석자를 관리
// (프로젝트 조원을 -> 회의 참석자로 추가 / 회의 참석자에서 삭제)

import React, { useState } from 'react';
import { Modal, Button, Form, Badge, ListGroup, Spinner } from 'react-bootstrap';

export default function MeetingMemberModal({
    show,
    onHide,
    // ✅ 2개의 목록이 필요
    meetingMembers = [], // (현재 회의 참석자)
    projectMembers = [], // (전체 프로젝트 조원 - 후보)
    onMemberUpdate, // 부모 상태 업데이트용 콜백

    // API Props
    entityId, // ✅ minuteId
    addMemberApi, // ✅ addMeetingMemberByEmail
    deleteMemberApi, // ✅ deleteMeetingMember
}) {
    const [email, setEmail] = useState('');
    const [isInviting, setIsInviting] = useState(false);
    const [isDeletingId, setIsDeletingId] = useState(null);
    const [isAddingId, setIsAddingId] = useState(null);

    // 1. 이메일 폼으로 초대 (외부 인원)
    const handleInviteByEmail = async () => {
        if (!email) {
            alert('이메일을 입력해주세요.');
            return;
        }
        if (!entityId || typeof addMemberApi !== 'function') {
            console.error('필수 props(entityId, addMemberApi)가 없습니다.');
            return;
        }

        setIsInviting(true);
        try {
            const updatedData = await addMemberApi(entityId, email); // minuteId, email
            if (onMemberUpdate) {
                onMemberUpdate(updatedData);
            }
            setEmail('');
        } catch (error) {
            console.error('Failed to add member by email:', error);
            alert(error.message || '초대에 실패했습니다.');
        } finally {
            setIsInviting(false);
        }
    };

    // 2. '프로젝트 조원'을 '회의 참석자'로 추가
    const handleAddProjectMember = async (member) => {
        if (!entityId || typeof addMemberApi !== 'function') {
            console.error('필수 props(entityId, addMemberApi)가 없습니다.');
            return;
        }

        const memberEmail = member.participantEmail;
        if (!memberEmail) {
            alert('멤버의 이메일 정보가 없습니다.');
            return;
        }

        setIsAddingId(member.participantId);
        try {
            const updatedData = await addMemberApi(entityId, memberEmail); // minuteId, email
            if (onMemberUpdate) {
                onMemberUpdate(updatedData);
            }
        } catch (error) {
            console.error('Failed to add project member to meeting:', error);
            alert(error.message || '멤버 추가에 실패했습니다.');
        } finally {
            setIsAddingId(null);
        }
    };

    // 3. '회의 참석자' 목록에서 삭제
    const handleRemoveMember = async (participantId) => {
        if (!window.confirm('정말로 이 멤버를 삭제하시겠습니까?')) {
            return;
        }
        if (!entityId || typeof deleteMemberApi !== 'function') {
            console.error('필수 props(entityId, deleteMemberApi)가 없습니다.');
            return;
        }

        setIsDeletingId(participantId);
        try {
            const updatedData = await deleteMemberApi(entityId, participantId); // minuteId, participantId
            if (onMemberUpdate) {
                onMemberUpdate(updatedData);
            }
        } catch (error) {
            console.error('Failed to remove member:', error);
            alert(error.message || '멤버 삭제에 실패했습니다.');
        } finally {
            setIsDeletingId(null);
        }
    };

    // 모달 닫힐 때 상태 초기화
    const handleModalHide = () => {
        setEmail('');
        setIsInviting(false);
        setIsDeletingId(null);
        setIsAddingId(null);
        onHide();
    };

    // 두 개의 목록으로 분리
    const meetingMemberIds = new Set(meetingMembers.map((m) => m.participantId));

    // 프로젝트 멤버 중, 아직 회의에 없는 멤버
    const projectMembersNotInMeeting = projectMembers.filter((pm) => !meetingMemberIds.has(pm.participantId));

    // 이미 회의에 참석한 멤버
    const meetingParticipants = meetingMembers;

    // 공통 멤버 렌더링 함수
    const renderMemberItem = (member, type) => {
        const isLoading = type === 'add' ? isAddingId === member.participantId : isDeletingId === member.participantId;
        const buttonVariant = type === 'add' ? 'outline-secondary' : 'danger';
        const buttonText = type === 'add' ? '추가' : '삭제';
        const buttonAction =
            type === 'add' ? () => handleAddProjectMember(member) : () => handleRemoveMember(member.participantId);
        const showButton = type === 'add' || (type === 'delete' && !member.leader);

        return (
            <React.Fragment key={member.participantId}>
                <ListGroup.Item
                    className="d-flex align-items-center justify-content-between px-0"
                    style={{ backgroundColor: 'transparent' }}
                >
                    <div className="d-flex align-items-center">
                        {/* (프로필 이미지 렌더링) ... */}
                        {member.participantImage ? (
                            <img
                                src={member.participantImage}
                                alt="profile"
                                className="rounded-circle me-3"
                                style={{ width: '40px', height: '40px', objectFit: 'cover' }}
                                onError={(e) => {
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
                    {showButton && (
                        <Button variant={buttonVariant} size="sm" onClick={buttonAction} disabled={isLoading}>
                            {isLoading ? <Spinner as="span" animation="border" size="sm" /> : buttonText}
                        </Button>
                    )}
                </ListGroup.Item>
                <hr className="brownHr my-1" />
            </React.Fragment>
        );
    };

    return (
        <Modal show={show} onHide={handleModalHide} centered className="modal-custom-bg">
            <Modal.Header closeButton className="border-0">
                <Modal.Title className="fw-bold">참가자 관리</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {/* 1. 이메일로 초대 (외부 인원) */}
                <Form.Group className="mb-3">
                    <Form.Label>이메일로 초대</Form.Label>
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
                            {isInviting ? <Spinner as="span" animation="border" size="sm" /> : '추가'}
                        </Button>
                    </div>
                </Form.Group>

                {/* 2. 프로젝트 조원 목록 (회의에 없는 사람) */}
                <h5 className="fw-bold mt-4" style={{ fontSize: '1.1rem' }}>
                    프로젝트 조원
                </h5>
                <hr className="brownHr my-1" />
                <ListGroup variant="flush" style={{ maxHeight: '150px', overflowY: 'auto' }}>
                    {projectMembersNotInMeeting.length > 0 ? (
                        projectMembersNotInMeeting.map((member) => renderMemberItem(member, 'add'))
                    ) : (
                        <ListGroup.Item
                            className="text-center text-muted px-0"
                            style={{ backgroundColor: 'transparent' }}
                        >
                            모든 조원이 회의에 참석했습니다.
                        </ListGroup.Item>
                    )}
                </ListGroup>

                {/* 3. 회의 참석자 목록 */}
                <h5 className="fw-bold mt-4" style={{ fontSize: '1.1rem' }}>
                    회의 참석자
                </h5>
                <hr className="brownHr my-1" />
                <ListGroup variant="flush" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                    {meetingParticipants.length > 0 ? (
                        meetingParticipants.map((member) => renderMemberItem(member, 'delete'))
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
