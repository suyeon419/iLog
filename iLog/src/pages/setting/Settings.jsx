// Settings.jsx

import React, { useEffect, useState } from 'react';
import { Button, Container, Row, Col } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { getUserById, loginUser } from '../../api/user';
import { jwtDecode } from 'jwt-decode';

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
            try {
                const decoded = jwtDecode(token);
                const userId = decoded.id;
                getUserById(userId)
                    .then((data) => {
                        setUser(data);
                    })
                    .catch((err) => {
                        console.error('❌ [Setting] 회원 정보 요청 실패:', err);
                        localStorage.removeItem('accessToken');
                        setIsLogin(false);
                    });
            } catch (err) {
                console.error('❌ [Setting] JWT 디코딩 실패:', err);
                localStorage.removeItem('accessToken');
                setIsLogin(false);
            }
        }
    }, []);

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
                            src="./images/profile.png"
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
