// NoteMemberModal.jsx
import React, { useState } from 'react';
import { Modal, ListGroup, Badge, Spinner, Button } from 'react-bootstrap';

export default function NoteMemberModal({
    show,
    onHide,

    folderId,
    meetingId,

    projectMembers = [],
    meetingMembers = [],

    addMemberApi, // 프로젝트 → 회의로 추가
    deleteMeetingMember, // 회의 → 프로젝트로 회수할 때 필요하면 사용, 지금은 버튼 없음
    onMemberUpdate,
}) {
    const [loadingId, setLoadingId] = useState(null);

    const handleAddFromProject = async (member) => {
        setLoadingId(member.participantId);
        try {
            const updated = await addMemberApi(meetingId, member.participantId);
            onMemberUpdate(updated);
        } finally {
            setLoadingId(null);
        }
    };

    // UI 렌더링 공통 함수
    const renderMemberRow = (member, showButton = false, onClickAction = null) => (
        <React.Fragment key={member.participantId}>
            <ListGroup.Item
                className="d-flex align-items-center justify-content-between px-0"
                style={{ backgroundColor: 'transparent' }}
            >
                <div className="d-flex align-items-center">
                    {/* 프로필 이미지 */}
                    {member.participantImage ? (
                        <img
                            src={member.participantImage}
                            alt="profile"
                            className="rounded-circle me-3"
                            style={{ width: '40px', height: '40px', objectFit: 'cover' }}
                            onError={(e) => (e.target.src = '/default-profile.png')}
                        />
                    ) : (
                        <div
                            className="rounded-circle me-3"
                            style={{
                                width: '40px',
                                height: '40px',
                                backgroundColor: '#e0e0e0',
                            }}
                        />
                    )}

                    <div>
                        <span className="fw-semibold">{member.participantName}</span>
                        {member.leader && <Badge className="ms-2 badge-leader">팀장</Badge>}
                        <br />
                        <small className="text-muted">{member.participantEmail}</small>
                    </div>
                </div>

                {/* 버튼 필요할 때만 */}
                {showButton && (
                    <Button
                        variant="primary"
                        onClick={() => onClickAction(member)}
                        disabled={loadingId === member.participantId}
                    >
                        {loadingId === member.participantId ? (
                            <Spinner as="span" animation="border" size="sm" />
                        ) : (
                            '추가'
                        )}
                    </Button>
                )}
            </ListGroup.Item>

            <hr className="brownHr my-1" />
        </React.Fragment>
    );

    return (
        <Modal show={show} onHide={onHide} centered>
            <Modal.Header closeButton className="border-0">
                <Modal.Title className="fw-bold">조원 관리</Modal.Title>
            </Modal.Header>

            <Modal.Body style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                {/* 프로젝트 멤버 → 추가 가능 */}
                <h6 className="fw-bold mb-2">프로젝트 참가자</h6>
                <ListGroup variant="flush" className="mb-3">
                    {projectMembers
                        .filter((pm) => !meetingMembers.some((m) => m.participantId === pm.participantId))
                        .map((member) => renderMemberRow(member, true, handleAddFromProject))}
                </ListGroup>

                <hr className="brownHr my-2" />

                {/* 회의 참석자 → 버튼 없이 목록만 */}
                <h6 className="fw-bold mb-2">회의 참석자</h6>
                <ListGroup variant="flush">{meetingMembers.map((member) => renderMemberRow(member))}</ListGroup>
            </Modal.Body>
        </Modal>
    );
}
