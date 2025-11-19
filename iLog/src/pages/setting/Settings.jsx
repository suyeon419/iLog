import React, { useEffect, useState } from 'react';
import { Button, Container, Row, Col, Modal } from 'react-bootstrap';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { Link, useNavigate } from 'react-router-dom';
import { deleteUser, getUserById, loginUser } from '../../api/user';
import { jwtDecode } from 'jwt-decode';
import axios from 'axios'; //이미지 불러올라면 임포트 해주세열

const SERVER_BASE_URL = 'https://webkit-ilo9-api.duckdns.org'; // (임시 예시 주소

export default function Settings() {
    const navigate = useNavigate();
    const [isLogin, setIsLogin] = useState(false);
    const [user, setUser] = useState(null);

    const [profileImageUrl, setProfileImageUrl] = useState('');

    const [isLoading, setIsLoading] = useState(true);
    // ✅ [추가] 모달 상태 관리
    const [showModal, setShowModal] = useState(false);
    const handleClose = () => setShowModal(false);
    const handleShow = () => setShowModal(true);

    const logout = () => {
        localStorage.removeItem('accessToken');
        loginUser();
        navigate('/');
    };
    const confirmDelete = async () => {
        handleClose(); // 모달을 닫습니다.
        try {
            const token = localStorage.getItem('accessToken');
            if (!token) {
                alert('로그인이 필요합니다.');
                return;
            }

            const decoded = jwtDecode(token);
            console.log('🔍 decoded token (전체):', JSON.stringify(decoded, null, 2));

            const userId = decoded.id;
            console.log('🧩 추출된 사용자 ID:', userId);

            // 회원 탈퇴 API 호출 (기존 handleDeleteAccount의 핵심 로직)
            await deleteUser(userId);
            alert('회원 탈퇴가 완료되었습니다.');
            localStorage.removeItem('accessToken');
            navigate('/');
        } catch (error) {
            console.error('❌ 회원 탈퇴 실패:', error);
            alert('회원 탈퇴 중 오류가 발생했습니다.');
        }
    };

    const handleDeleteAccount = () => {
        handleShow(); // ✅ 기존 로직을 지우고 모달 띄우는 함수로 대체
    };

    useEffect(() => {
        window.scrollTo(0, 0);
        const token = localStorage.getItem('accessToken');
        if (token) {
            setIsLogin(true);

            try {
                const decoded = jwtDecode(token);
                console.log('🔍 decoded token (전체):', JSON.stringify(decoded, null, 2)); // ✅ 전체 구조 확인
                const userId = decoded.id;
                console.log('🧩 추출된 사용자 ID:', userId);
                getUserById(userId)
                    .then(async (data) => {
                        setUser(data);
                        // --------이미지 불러오는 거-------------
                        if (data.profileImage) {
                            try {
                                const res = await axios.get(`${SERVER_BASE_URL}${data.profileImage}`, {
                                    headers: { Authorization: `Bearer ${token}` },
                                    responseType: 'blob',
                                });
                                const blobUrl = URL.createObjectURL(res.data);
                                setProfileImageUrl(blobUrl);
                            } catch (err) {
                                console.error('❌ 이미지 불러오기 실패:', err);
                            }
                        }
                        //--------------------
                    })
                    .catch((err) => {
                        console.error('❌ [Setting] 회원 정보 요청 실패:', err);
                        localStorage.removeItem('accessToken');
                        setIsLogin(false);
                    })
                    .finally(() => {
                        setIsLoading(false);
                    });
            } catch (err) {
                console.error('JWT 실패', err);
                localStorage.removeItem('accessToken');
                setIsLogin(false);
            }
        }
    }, []);

    // ⭐️ [Debug 2] 렌더링 직전에 user 상태와 profileImage 경로 확인
    console.log('✅ [Setting Debug 2] 렌더링 시 user 상태:', user);
    console.log('✅ [Setting Debug 3] user.profileImage 값:', user?.profileImage);

    if (isLoading) {
        return (
            <Container
                className="d-flex flex-column justify-content-center align-items-center"
                style={{ height: '100vh' }}
            >
                <LoadingSpinner animation="border" variant="primary" />
            </Container>
        );
    }

    return (
        <div className="container-left">
            <section className="profile-section">
                <h2>
                    <i className="bi bi-person"></i> 내 프로필
                </h2>
                <hr className="brownHr" />
                <div className="d-flex align-items-center justify-content-between mt-3">
                    <div className="d-flex align-items-center gap-3">
                        <img
                            src={profileImageUrl || './images/profile.png'}
                            // src를 동적으로 변경합니다.
                            // src={
                            //     user && user.profileImage
                            //         ? `${SERVER_BASE_URL}${user.profileImage}` // 서버에 이미지가 있으면
                            //         : './images/profile.png' // 없으면 기본 이미지
                            // }
                            alt="프로필 이미지"
                            style={{
                                width: '100px',
                                height: '100px',
                                borderRadius: '50%',
                                objectFit: 'cover',
                                border: '2px solid #b66e03',
                            }}
                        />
                        <div>
                            <div className="h3">{user?.name}</div>
                            <div className="text-muted">{user?.email}</div>
                        </div>
                    </div>
                    <Button as={Link} to="/confirm-password" variant="primary">
                        회원 정보 수정
                    </Button>
                </div>
                <hr className="beigeHr" />
            </section>

            <section>
                <h2>
                    <i class="bi bi-lock"></i> 내 계정 관리
                </h2>
                <hr className="brownHr" />
                <ul className="list-unstyled mt-2 ms-3">
                    <li>
                        <a href="/login-history" className="link" style={{ display: 'block' }}>
                            로그인 이력
                        </a>
                    </li>
                </ul>
                <hr className="beigeHr" />
            </section>

            <section>
                <h2>
                    <i class="bi bi-journal-text"></i> 내 활동
                </h2>
                <hr className="brownHr" />
                <ul className="list-unstyled mt-2 ms-3">
                    <li>
                        <Link to="/history-note" className="link" style={{ display: 'block' }}>
                            회의록
                        </Link>
                    </li>
                    <hr className="beigeHr" />
                    <li>
                        <Link to="/history-meeting" className="link" style={{ display: 'block' }}>
                            화상 회의
                        </Link>
                    </li>
                    <hr className="beigeHr" />
                </ul>
            </section>

            <div className="d-flex justify-content-center gap-3 mt-4">
                <Button variant="primary" onClick={logout}>
                    로그아웃
                </Button>
                <Button variant="danger" onClick={handleDeleteAccount}>
                    회원탈퇴
                </Button>
            </div>
            <Modal show={showModal} onHide={handleClose}>
                <Modal.Header closeButton>
                    <Modal.Title className="text-danger">⚠️ 경고</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <p>정말로 회원 탈퇴하시겠습니까?</p>
                    <p className="text-danger">
                        회원 탈퇴 시 모든 계정 정보 및 활동 기록(회의록, 화상 회의 기록 등)이 영구적으로 삭제되며 복구할
                        수 없습니다.
                    </p>
                    <p className="mt-3">계속 진행하시려면 '회원 탈퇴' 버튼을 눌러주세요.</p>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleClose}>
                        취소
                    </Button>
                    <Button variant="danger" onClick={confirmDelete}>
                        회원 탈퇴
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
}
