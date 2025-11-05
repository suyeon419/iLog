// Settings.jsx

import React, { useEffect, useState } from 'react';
import { Button, Container, Row, Col } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { getUserById, loginUser } from '../../api/user';

const SERVER_BASE_URL = 'https://webkit-ilo9-api.duckdns.org';

export default function Settings() {
    const navigate = useNavigate();
    const [isLogin, setIsLogin] = useState(false);
    const [user, setUser] = useState(null);

    const logout = () => {
        localStorage.removeItem('accessToken');
        loginUser();
        navigate('/');
    };

    useEffect(() => {
        const token = localStorage.getItem('accessToken');
        if (token) {
            setIsLogin(true);
            getUserById()
                .then((data) => {
                    // ⭐️ [Debug 1] API에서 실제로 어떤 데이터를 받았는지 확인
                    console.log('✅ [Setting Debug 1] API 응답 원본 데이터:', data);

                    if (data) {
                        setUser(data);
                    } else {
                        console.warn('⚠️ [Setting] 회원 정보 조회는 성공했으나 데이터가 비어있습니다.');
                    }
                })
                .catch((err) => {
                    console.error('❌ [Setting] 회원 정보 요청 실패:', err);
                    localStorage.removeItem('accessToken');
                    setIsLogin(false);
                });
        } else {
            setIsLogin(false);
            console.log('🔌 [Setting] 토큰이 없어 로그인 상태가 아닙니다.');
        }
    }, []);

    // ⭐️ [Debug 2] 렌더링 직전에 user 상태와 profileImage 경로 확인
    console.log('✅ [Setting Debug 2] 렌더링 시 user 상태:', user);
    console.log('✅ [Setting Debug 3] user.profileImage 값:', user?.profileImage);

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
                            // src를 동적으로 변경합니다.
                            src={
                                user && user.profileImage
                                    ? `${SERVER_BASE_URL}${user.profileImage}` // 서버에 이미지가 있으면
                                    : './images/profile.png' // 없으면 기본 이미지
                            }
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

            {/* ... (이하 나머지 코드는 동일) ... */}

            <section>
                <h2>🔐 내 계정 관리</h2>
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
                <h2>📘 내 활동</h2>
                <hr className="brownHr" />
                <ul className="list-unstyled mt-2 ms-3">
                    <li>
                        <Link to="/note-history" className="link" style={{ display: 'block' }}>
                            회의록
                        </Link>
                    </li>
                    <hr className="beigeHr" />
                    <li>
                        <Link to="/meeting-history" className="link" style={{ display: 'block' }}>
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
                <Button variant="danger">회원탈퇴</Button>
            </div>
        </div>
    );
}
