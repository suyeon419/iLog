// LoginHistory.jsx (타임라인 + 페이지네이션 + IP 주소 적용)

import React, { useState, useEffect } from 'react';
import { Container, Pagination, Button, Alert } from 'react-bootstrap';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { useNavigate } from 'react-router-dom';
import { getLoginHistory } from '../../api/user';

const formatTime = (isoString) => {
    if (!isoString) return '';
    return new Date(isoString).toLocaleTimeString('ko-KR', {
        hour: '2-digit',
        minute: '2-digit',
    });
};

const groupLogsByDate = (logsToGroup) => {
    return logsToGroup.reduce((acc, item) => {
        const date = item.createdAt.split('T')[0]; // YYYY-MM-DD
        if (!acc[date]) acc[date] = [];
        acc[date].push(item);
        return acc;
    }, {});
};

export default function LoginHistory() {
    const navigate = useNavigate();

    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

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

                setLogs(loginLogs);
            } catch (err) {
                console.error('로그인 이력 조회 실패:', err);
                setError('이력을 불러오는 데 실패했습니다. 잠시 후 다시 시도해주세요.');
            } finally {
                setLoading(false);
            }
        };

        fetchHistory();
    }, []);

    const totalPages = Math.ceil(logs.length / itemsPerPage);
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentLogs = logs.slice(indexOfFirstItem, indexOfLastItem);

    const handlePageClick = (pageNumber) => {
        setCurrentPage(pageNumber);
    };

    const renderPagination = () => {
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

    const groupedCurrentLogs = groupLogsByDate(currentLogs);

    return (
        <Container className="pt-3">
            <h3 className="history-title">로그인 이력</h3>

            {loading && (
                <div className="text-center p-5">
                    <LoadingSpinner animation="border" />
                </div>
            )}

            {error && (
                <div className="text-center p-5">
                    <Alert variant="danger">{error}</Alert>
                </div>
            )}

            {!loading && !error && logs.length === 0 && (
                <div className="text-center p-5 text-muted">로그인 이력이 없습니다.</div>
            )}

            {!loading && !error && logs.length > 0 && (
                <div className="timeline">
                    {Object.keys(groupedCurrentLogs).map((date) => (
                        <div key={date} className="timeline-date-block">
                            <div className="timeline-date-dot"></div>
                            <div className="timeline-date-line"></div>
                            <div className="timeline-date">{date}</div>

                            {groupedCurrentLogs[date].map((item) => (
                                <div key={item.id} className="timeline-item">
                                    <div className="timeline-card">
                                        {/* [수정] '로그인' 텍스트 대신 IP 주소를 표시합니다. */}
                                        <div className="card-title">{item.ipAddress || '자동 로그아웃'}</div>
                                        <div className="card-time">{formatTime(item.createdAt)}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
            )}

            {renderPagination()}

            <div className="d-flex justify-content-center">
                <Button variant="primary" onClick={handleGoBack}>
                    설정으로
                </Button>
            </div>
        </Container>
    );
}
