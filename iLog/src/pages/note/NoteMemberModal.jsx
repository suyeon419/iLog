// NoteMemberModal.jsx — MemberModal 디자인 그대로 적용 (삭제 버튼 제거)

import React, { useState } from 'react';
import { Modal, ListGroup, Spinner, Badge } from 'react-bootstrap';

export default function NoteMemberModal({
    show,
    onHide,

    folderId,
    meetingId,

    projectMembers = [], // 위쪽 리스트
    meetingMembers = [], // 아래 리스트

    addMemberApi, // 회의 참석자로 내려보내기
    deleteMemberApi, // 회의 참석자에서 위로 올리기

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

    const handleRemoveFromMeeting = async (member) => {
        setLoadingId(member.participantId);
        try {
            const updated = await deleteMemberApi(meetingId, member.participantId);
            onMemberUpdate(updated);
        } finally {
            setLoadingId(null);
        }
    };

    const isInMeeting = (id) => meetingMembers.some((m) => m.participantId === id);

    return (
        <Modal show={show} onHide={onHide} centered className="modal-custom-bg">
            <Modal.Header closeButton className="border-0">
                <Modal.Title className="fw-bold">참가자 관리</Modal.Title>
            </Modal.Header>

            <Modal.Body style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                {/* 프로젝트 참가자 */}
                <h6 className="fw-bold mb-2">프로젝트 참가자</h6>
                <ListGroup variant="flush" className="mb-3">
                    {projectMembers
                        .filter((pm) => !isInMeeting(pm.participantId))
                        .map((member) => (
                            <React.Fragment key={member.participantId}>
                                <ListGroup.Item
                                    as="div"
                                    className="d-flex align-items-center justify-content-between px-0"
                                    style={{ background: 'transparent', cursor: 'pointer' }}
                                    onClick={() => handleAddFromProject(member)}
                                >
                                    <div className="d-flex align-items-center">
                                        {member.participantProfileImage ? (
                                            <img
                                                src={`https://webkit-ilo9-api.duckdns.org${member.participantProfileImage}`}
                                                alt="profile"
                                                className="rounded-circle me-3"
                                                style={{ width: '40px', height: '40px', objectFit: 'cover' }}
                                                onError={(e) => {
                                                    e.target.src = '../../../publiprofile.png';
                                                }}
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

                                    {loadingId === member.participantId && <Spinner animation="border" size="sm" />}
                                </ListGroup.Item>

                                <hr className="brownHr my-1" />
                            </React.Fragment>
                        ))}
                </ListGroup>

                <hr className="brownHr my-2" />

                {/* 회의 참석자 */}
                <h6 className="fw-bold mb-2">회의 참석자</h6>
                <ListGroup variant="flush">
                    {meetingMembers.map((member) => (
                        <React.Fragment key={member.participantId}>
                            <ListGroup.Item
                                as="div"
                                className="d-flex align-items-center justify-content-between px-0"
                                style={{ background: 'transparent', cursor: 'pointer' }}
                                onClick={() => handleRemoveFromMeeting(member)}
                            >
                                <div className="d-flex align-items-center">
                                    {member.participantProfileImage ? (
                                        <img
                                            src={`https://webkit-ilo9-api.duckdns.org${member.participantProfileImage}`}
                                            alt="profile"
                                            className="rounded-circle me-3"
                                            style={{ width: '40px', height: '40px', objectFit: 'cover' }}
                                            onError={(e) => {
                                                e.target.src = '/images/profile.png';
                                            }}
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

                                {loadingId === member.participantId && <Spinner animation="border" size="sm" />}
                            </ListGroup.Item>

                            <hr className="brownHr my-1" />
                        </React.Fragment>
                    ))}
                </ListGroup>
            </Modal.Body>
        </Modal>
    );
}
