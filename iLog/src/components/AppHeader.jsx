import React, { useEffect, useState } from 'react';
import { Container, Nav, Navbar } from 'react-bootstrap';
import { Link, useLocation, useNavigate } from 'react-router-dom';

export default function AppHeader() {
    const location = useLocation();
    const navigate = useNavigate();

    const isLoggedIn = !!localStorage.getItem('accessToken');

    const [expanded, setExpanded] = useState(false);

    useEffect(() => {
        const publicPaths = ['/', '/login', '/register', '/findPw', '/findEmail', '/findPw/changePw'];
        if (!isLoggedIn && !publicPaths.includes(location.pathname)) {
            navigate('/login');
            alert('로그인이 필요합니다.');
        }
    }, [isLoggedIn, location.pathname, navigate]);

    const isHomeActive = ['/', '/login', '/register', '/findPw', '/findEmail', '/findPw/changePw'].includes(
        location.pathname
    );
    const isNotesActive = ['/notes'].some((path) => location.pathname.startsWith(path));
    const isMeetingActive = ['/meeting'].some((path) => location.pathname.startsWith(path));
    const isSettingsActive = ['/settings', '/history'].some((path) => location.pathname.startsWith(path));

    return (
        <Navbar expand="lg" fixed="top" style={{ backgroundColor: '#F5F1EC' }} expanded={expanded}>
            <Container
                fluid
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                }}
            >
                <Navbar.Brand
                    as={Link}
                    to="/"
                    style={{
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        marginLeft: '50px',
                    }}
                >
                    <img src="/images/iLogLogo.png" alt="iLog Logo" style={{ height: '60px' }} />
                </Navbar.Brand>

                {/* 햄버거 버튼 */}
                <Navbar.Toggle aria-controls="main-navbar" onClick={() => setExpanded(!expanded)} />
            </Container>

            <Navbar.Collapse id="main-navbar" in={expanded}>
                <Nav className="ms-auto" variant="tabs" activeKey={location.pathname} style={{ marginBottom: '-4px' }}>
                    <Nav.Link
                        className={`nav-item ${isHomeActive ? 'active' : ''}`}
                        as={Link}
                        to="/"
                        eventKey="/"
                        onClick={() => setExpanded(false)}
                    >
                        <i className="bi bi-house nav-icon"></i>홈
                    </Nav.Link>
                    <Nav.Link
                        className={`nav-item ${isNotesActive ? 'active' : ''}`}
                        as={Link}
                        to="/notes"
                        eventKey="/notes"
                        onClick={() => setExpanded(false)}
                    >
                        <i className="bi bi-journal-text nav-icon"></i>회의록
                    </Nav.Link>
                    <Nav.Link
                        className={`nav-item ${isMeetingActive ? 'active' : ''}`}
                        as={Link}
                        to="/meeting"
                        eventKey="/meeting"
                        onClick={() => setExpanded(false)}
                    >
                        <i className="bi bi-camera-video nav-icon"></i>화상회의
                    </Nav.Link>
                    <Nav.Link
                        className={`nav-item ${isSettingsActive ? 'active' : ''}`}
                        as={Link}
                        to="/settings"
                        eventKey="/settings"
                        onClick={() => setExpanded(false)}
                    >
                        <i className="bi bi-gear nav-icon" onClick={() => setExpanded(false)}></i>설정
                    </Nav.Link>
                </Nav>
            </Navbar.Collapse>
        </Navbar>
    );
}
