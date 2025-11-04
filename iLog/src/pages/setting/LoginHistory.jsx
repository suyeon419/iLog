// LoginHistory.jsx

import React, { useState, useEffect } from 'react';
import {
    Container,
    Table,
    Pagination, // Pagination 컴포넌트 사용
    Button,
    Spinner,
    Alert,
} from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { getLoginHistory } from '../../api/user';

// 날짜/시간을 보기 좋게 포맷팅하는 헬퍼 함수
const formatDateTime = (isoString) => {
    if (!isoString) return '';
    return new Date(isoString).toLocaleString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
};

export default function LoginHistory() {
    const navigate = useNavigate();

    const [logs, setLogs] = useState([]); // 모든 로그인 이력 (원본)
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // [추가] 1. 페이지네이션을 위한 상태
    const [currentPage, setCurrentPage] = useState(1); // 현재 페이지
    const itemsPerPage = 10; // 페이지당 10개 항목

    const handleGoBack = () => {
        navigate(-1);
    };

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                setLoading(true);
                setError(null);
                const response = await getLoginHistory();
                const historyData = response.logs || [];

                const loginLogs = historyData.filter((log) => log.status === 'LOGIN');
                loginLogs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

                setLogs(loginLogs); // 모든 로그를 원본 state에 저장
            } catch (err) {
                console.error('로그인 이력 조회 실패:', err);
                setError('이력을 불러오는 데 실패했습니다. 잠시 후 다시 시도해주세요.');
            } finally {
                setLoading(false);
            }
        };

        fetchHistory();
    }, []);

    // [추가] 2. 페이지네이션 계산 로직
    // 총 페이지 수
    const totalPages = Math.ceil(logs.length / itemsPerPage);
    // 현재 페이지에 보여줄 항목의 마지막 인덱스
    const indexOfLastItem = currentPage * itemsPerPage;
    // 현재 페이지에 보여줄 항목의 첫 번째 인덱스
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    // 현재 페이지에 표시할 로그 데이터 (10개씩 자르기)
    const currentLogs = logs.slice(indexOfFirstItem, indexOfLastItem);

    const handlePageClick = (pageNumber) => {
        setCurrentPage(pageNumber);
    };

    const renderTableBody = () => {
        if (loading) {
            return (
                <tr>
                    <td colSpan="1" className="text-center p-5">
                        <Spinner animation="border" />
                    </td>
                </tr>
            );
        }

        if (error) {
            return (
                <tr>
                    <td colSpan="1" className="text-center p-5">
                        <Alert variant="danger">{error}</Alert>
                    </td>
                </tr>
            );
        }

        if (logs.length === 0) {
            return (
                <tr>
                    <td colSpan="1" className="text-center p-5 text-muted">
                        로그인 이력이 없습니다.
                    </td>
                </tr>
            );
        }

        // [중요] 'currentLogs' (10개씩 잘린 데이터)로 테이블 row 생성
        return currentLogs.map((log) => (
            <tr key={log.id}>
                <td className="text-center">{formatDateTime(log.createdAt)}</td>
            </tr>
        ));
    };

    // [추가] 5. 페이지네이션 컴포넌트를 동적으로 렌더링하는 함수
    const renderPagination = () => {
        // 데이터가 없거나 1페이지 뿐이면 페이지네이션을 표시하지 않음
        if (totalPages <= 1) {
            return null;
        }

        const pageItems = [];
        for (let number = 1; number <= totalPages; number++) {
            pageItems.push(
                <Pagination.Item key={number} active={number === currentPage} onClick={() => handlePageClick(number)}>
                    {number}
                </Pagination.Item>
            );
        }

        return (
            <nav className="mt-3 pagination-nav">
                <Pagination className="justify-content-center">
                    <Pagination.Prev disabled={currentPage === 1} onClick={() => handlePageClick(currentPage - 1)} />
                    {pageItems}
                    <Pagination.Next
                        disabled={currentPage === totalPages}
                        onClick={() => handlePageClick(currentPage + 1)}
                    />
                </Pagination>
            </nav>
        );
    };

    return (
        <Container className="pt-3">
            <h2 className="fw-bold text-center my-4">로그인 이력</h2>

            <Table style={{ width: '300px' }}>
                <tbody>{renderTableBody()}</tbody>
            </Table>

            {renderPagination()}

            <div className="d-flex justify-content-center">
                <Button variant="primary" onClick={handleGoBack}>
                    설정으로
                </Button>
            </div>
        </Container>
    );
}
