import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import 'bootstrap/dist/css/bootstrap.min.css';
import './index.css';

import App from './App.jsx';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import MainLayout from './layout/MainLayout.jsx';
import Login from './pages/Login.jsx';
import Home from './pages/Home.jsx';
import Register from './pages/Register.jsx';
import Meeting from './pages/Meeting.jsx';
import JoinMeeting from './pages/JoinMeeting.jsx';
import CreateMeeting from './pages/CreateMeeting.jsx';

createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <BrowserRouter>
            <Routes>
                <Route element={<MainLayout />}>
                    {/* 여기 안에 페이지 넣으면 됩니다 */}
                    <Route path="/" element={<Home />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/meeting" element={<JoinMeeting />} />
                    <Route path="/meeting/create" element={<CreateMeeting />} />
                    <Route path="/meeting/:meetingId" element={<Meeting />} />
                </Route>
            </Routes>
        </BrowserRouter>
    </React.StrictMode>
);
