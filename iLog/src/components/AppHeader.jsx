import React from 'react';
import { Container, Nav, Navbar } from 'react-bootstrap';
import { Link, useLocation } from 'react-router-dom';

export default function AppHeader() {
    const location = useLocation();

    const isHomeActive = ['/', '/login', '/register', '/findPw', '/findEmail'].includes(location.pathname);
    const isNotesActive = ['/notes'].some((path) => location.pathname.startsWith(path));
    const isMeetingActive = ['/meeting'].some((path) => location.pathname.startsWith(path));
    const isSettingsActive = ['/settings'].some((path) => location.pathname.startsWith(path));

    return (
        <Navbar expand="lg" fixed="top" style={{ backgroundColor: '#F5F1EC' }}>
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
                    <img src="./images/iLogLogo.png" alt="iLog Logo" style={{ height: '60px' }} />
                </Navbar.Brand>

                <Navbar.Toggle aria-controls="main-navbar" />
                <Navbar.Collapse id="main-navbar">
                    <Nav
                        className="ms-auto "
                        variant="tabs"
                        activeKey={location.pathname}
                        style={{ marginBottom: '-4px' }}
                    >
                        <Nav.Link className={`nav-item ${isHomeActive ? 'active' : ''}`} as={Link} to="/" eventKey="/">
                            <i className="bi bi-house nav-icon"></i>홈
                        </Nav.Link>
                        <Nav.Link
                            className={`nav-item ${isNotesActive ? 'active' : ''}`}
                            as={Link}
                            to="/notes"
                            eventKey="/notes"
                        >
                            <i className="bi bi-journal-text nav-icon"></i>
                            회의록
                        </Nav.Link>
                        <Nav.Link
                            className={`nav-item ${isMeetingActive ? 'active' : ''}`}
                            as={Link}
                            to="/meeting"
                            eventKey="/meeting"
                        >
                            <i className="bi bi-camera-video nav-icon"></i>
                            화상회의
                        </Nav.Link>
                        <Nav.Link
                            className={`nav-item ${isSettingsActive ? 'active' : ''}`}
                            as={Link}
                            to="/settings"
                            eventKey="/settings"
                        >
                            <i className="bi bi-gear nav-icon"></i>
                            설정
                        </Nav.Link>
                    </Nav>
                </Navbar.Collapse>
            </Container>
        </Navbar>
    );
}
