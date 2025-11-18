import React, { useState } from 'react';
import { Modal, ListGroup, Spinner } from 'react-bootstrap';

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
        <Modal show={show} onHide={onHide} centered>
            <Modal.Header closeButton className="border-0">
                <Modal.Title className="fw-bold">조원 관리</Modal.Title>
            </Modal.Header>

            <Modal.Body style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                {/* 프로젝트 참가자 */}
                <h6 className="fw-bold mb-2">프로젝트 참가자</h6>
                <ListGroup variant="flush" className="mb-3">
                    {projectMembers
                        .filter((pm) => !isInMeeting(pm.participantId))
                        .map((member) => (
                            <ListGroup.Item
                                key={member.participantId}
                                as="div"
                                className="d-flex align-items-center justify-content-between px-0"
                                style={{ background: 'transparent', cursor: 'pointer' }}
                                onClick={() => !isInMeeting(member.participantId) && handleAddFromProject(member)}
                            >
                                <span>{member.participantName}</span>
                                {loadingId === member.participantId && <Spinner animation="border" size="sm" />}
                            </ListGroup.Item>
                        ))}
                </ListGroup>

                <hr className="brownHr my-2" />

                {/* 회의 참석자 */}
                <h6 className="fw-bold mb-2">회의 참석자</h6>
                <ListGroup variant="flush">
                    {meetingMembers.map((member) => (
                        <ListGroup.Item
                            key={member.participantId}
                            as="div"
                            className="d-flex align-items-center justify-content-between px-0"
                            style={{ background: 'transparent', cursor: 'pointer' }}
                            onClick={() => handleRemoveFromMeeting(member)}
                        >
                            <span>{member.participantName}</span>
                            {loadingId === member.participantId && <Spinner animation="border" size="sm" />}
                        </ListGroup.Item>
                    ))}
                </ListGroup>
            </Modal.Body>
        </Modal>
    );
}
