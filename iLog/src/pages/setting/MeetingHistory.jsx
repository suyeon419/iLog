// MeetingHistory.jsx

import React, { useState, useEffect } from 'react'; // useEffect import 추가
import { Container, Table, Pagination, Row, Col } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { PencilSquare, CheckSquare, People, CalendarCheck, CalendarPlus } from 'react-bootstrap-icons';

// [삭제] DUMMY_MEETINGS 배열 제거

export default function MeetingHistory() {
    const navigate = useNavigate();

    // Note: 회의록 클릭 시 상세 페이지로 이동
    const handleRowClick = (meetingId) => {
        // TODO: 화상회의 이력 상세 페이지가 있다면 경로 수정
        // navigate(`/meeting-history/${meetingId}`);
        console.log('Clicked meeting:', meetingId);
    };

    // --- 페이지네이션 로직 ---
    const [currentPage, setCurrentPage] = useState(1);
    // [수정] subMeetings state를 빈 배열로 초기화
    const [subMeetings, setSubMeetings] = useState([]);
    const ITEMS_PER_PAGE = 7;

    // [추가] 나중에 백엔드 연동 시 사용할 useEffect 예시
    useEffect(() => {
        // TODO: 여기서 백엔드 API를 호출하여 setSubMeetings로 데이터를 설정합니다.
        // 예: fetchMeetingHistory().then(data => setSubMeetings(data));
        // 지금은 데이터가 없으므로 빈 배열이 유지됩니다.
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
        // [유지] totalPages가 0이어도 1페이지를 렌더링
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
        // Settings.jsx와 동일한 .container-left 스타일 적용
        <Container fluid className="pt-3 container-left">
            {/* 1. 콘텐츠 영역 (flex-grow-1) */}
            <div className="flex-grow-1">
                {/* 제목 (NoteDetail.jsx의 mt-3 적용) */}
                <Row className="mb-3 mt-3 align-items-center">
                    <Col>
                        <h2 className="fw-bold m-0">
                            <PencilSquare className="me-3" />
                            화상회의의 이력
                        </h2>
                    </Col>
                </Row>

                {/* 화상회의 이력 테이블 */}
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
                        {/* [유지] 데이터가 없으면 "이력이 없습니다"가 표시됨 */}
                        {currentMeetings.length === 0 ? (
                            <tr>
                                <td colSpan="4" className="text-center p-4">
                                    화상회의 이력이 없습니다.
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
                {/* [유지] 페이지네이션은 항상 표시됨 */}
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
