import React from 'react';
import { Container, Nav, Navbar } from 'react-bootstrap';
import { Link, useLocation } from 'react-router-dom';

export default function AppHeader() {
    const location = useLocation();

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
                    }}
                >
                    <img src="./images/iLogLogo.png" alt="iLog Logo" style={{ height: '60px' }} />
                </Navbar.Brand>

                <Navbar.Toggle aria-controls="main-navbar" />
                <Navbar.Collapse id="main-navbar">
                    <Nav
                        className="mx-auto"
                        variant="tabs"
                        activeKey={location.pathname} // ✅ URL 기반으로 활성화
                    >
                        <Nav.Link as={Link} to="/" eventKey="/">
                            홈
                        </Nav.Link>
                        <Nav.Link as={Link} to="/notes" eventKey="/notes">
                            회의록
                        </Nav.Link>
                        <Nav.Link as={Link} to="/meeting" eventKey="/meeting">
                            화상회의
                        </Nav.Link>
                        <Nav.Link as={Link} to="/settings" eventKey="/settings">
                            설정
                        </Nav.Link>
                    </Nav>
                </Navbar.Collapse>
            </Container>
        </Navbar>
    );
}
