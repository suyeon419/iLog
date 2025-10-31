// NoteHistory.jsx

import React, { useState, useEffect } from 'react';
import { Container, Table, Pagination, Row, Col } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { PencilSquare, CheckSquare, People, CalendarCheck, CalendarPlus } from 'react-bootstrap-icons';

export default function NoteHistory() {
    const navigate = useNavigate();

    // Note: 회의록 클릭 시 상세 페이지로 이동
    const handleRowClick = (meetingId) => {
        // TODO: 회의록 상세 페이지 경로로 수정
        navigate(`/notes/meeting/${meetingId}`);
        // console.log('Clicked meeting:', meetingId);
    };

    // --- 페이지네이션 로직 ---
    const [currentPage, setCurrentPage] = useState(1);
    const [subMeetings, setSubMeetings] = useState([]); // 빈 배열로 초기화
    const ITEMS_PER_PAGE = 7;

    useEffect(() => {
        // TODO: 여기서 백엔드 API를 호출하여 setSubMeetings로 데이터를 설정합니다.
    }, []); // 페이지 로드 시 1회 실행

    const totalPages = Math.ceil(subMeetings.length / ITEMS_PER_PAGE);
    const indexOfLastItem = currentPage * ITEMS_PER_PAGE;
    const indexOfFirstItem = indexOfLastItem - ITEMS_PER_PAGE;
    const currentMeetings = subMeetings.slice(indexOfFirstItem, indexOfLastItem);

    const handlePageChange = (pageNumber) => {
        const newPage = Math.max(1, Math.min(pageNumber, totalPages === 0 ? 1 : totalPages));
        setCurrentPage(newPage);
    };

    const renderPaginationItems = () => {
        let pageItems = [];
        const total = totalPages === 0 ? 1 : totalPages;
        for (let number = 1; number <= total; number++) {
            pageItems.push(
                <Pagination.Item key={number} active={number === currentPage} onClick={() => handlePageChange(number)}>
                    {number}
                </Pagination.Item>
            );
        }
        return pageItems;
    };
    // ---------------------------------------------

    return (
        // .container-left 스타일 적용
        <Container fluid className="pt-3 container-left">
            {/* 1. 콘텐츠 영역 (flex-grow-1) */}
            <div className="flex-grow-1">
                {/* [수정] 제목 변경 */}
                <Row className="mb-3 mt-3 align-items-center">
                    <Col>
                        <h2 className="fw-bold m-0">
                            <PencilSquare className="me-3" />
                            회의록 이력
                        </h2>
                    </Col>
                </Row>

                {/* 회의록 이력 테이블 */}
                <Table className="align-middle">
                    <thead>
                        <tr>
                            <th>
                                <CheckSquare className="me-2" /> 회의 이름
                            </th>
                            <th>
                                <People className="me-2" /> 참가자
                            </th>
                            <th>
                                <CalendarCheck className="me-2" /> 생성일자
                            </th>
                            <th>
                                <CalendarPlus className="me-2" /> 수정일자
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {/* 데이터가 없으면 "이력이 없습니다"가 표시됨 */}
                        {currentMeetings.length === 0 ? (
                            <tr>
                                <td colSpan="4" className="text-center p-4">
                                    회의록 이력이 없습니다.
                                </td>
                            </tr>
                        ) : (
                            currentMeetings.map((meeting) => (
                                <tr
                                    key={meeting.id}
                                    onClick={() => handleRowClick(meeting.id)}
                                    style={{ cursor: 'pointer' }}
                                >
                                    <td>{meeting.name}</td>
                                    <td>{meeting.members}</td>
                                    <td>{meeting.created}</td>
                                    <td>{meeting.modified}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </Table>
            </div>

            {/* 2. 하단 고정 영역 (페이지네이션) */}
            <div>
                <nav className="mt-3 pagination-nav">
                    <Pagination className="justify-content-center">
                        <Pagination.Prev
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                        />
                        {renderPaginationItems()}
                        <Pagination.Next
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage === (totalPages === 0 ? 1 : totalPages)}
                        />
                    </Pagination>
                </nav>
            </div>
        </Container>
    );
}
