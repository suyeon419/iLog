import React, { useState } from 'react';
import { Container, Nav, Navbar } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';

export default function AppHeader() {
    const navigate = useNavigate();

    const [activeTab, setActiveTab] = useState('public');

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
                <Navbar.Brand as={Link} to="/" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                    <img src="./images/iLogLogo.png" alt="Tripory Logo" style={{ height: '60px' }} />
                </Navbar.Brand>

                <Navbar.Toggle aria-controls="main-navbar" />
                <Navbar.Collapse id="main-navbar">
                    <Nav className="mx-auto" variant="tabs" activeKey={activeTab} onSelect={setActiveTab}>
                        <Nav.Link as={Link} to="/">
                            홈
                        </Nav.Link>
                        <Nav.Link as={Link} to="/">
                            회의록
                        </Nav.Link>
                        <Nav.Link as={Link} to="/meeting">
                            화상회의
                        </Nav.Link>
                        <Nav.Link as={Link} to="/">
                            설정
                        </Nav.Link>
                    </Nav>
                </Navbar.Collapse>
            </Container>
        </Navbar>
    );
}
