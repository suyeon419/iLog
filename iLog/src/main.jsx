import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';

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
import Note from './pages/Note.jsx';
import NoteCreate from './pages/NoteCreate.jsx';
import NoteDetail from './pages/NoteDetail.jsx';
import NoteMeetingDetail from './pages/NoteMeetingDetail.jsx';
import NoteMeetingEdit from './pages/NoteMeetingEdit.jsx';
import Settings from './pages/Settings.jsx';
import FindPw from './pages/FindPw.jsx';
import FindEmail from './pages/FindEmail.jsx';
import ChangePw from './pages/ChangePw.jsx';

createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <BrowserRouter>
            <Routes>
                <Route element={<MainLayout />}>
                    {/* 여기 안에 페이지 넣으쇼 */}
                    <Route path="/" element={<Home />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/findPw" element={<FindPw />} />
                    <Route path="/findPw/changePw" element={<ChangePw />} />
                    <Route path="/findEmail" element={<FindEmail />} />

                    <Route path="/notes" element={<Note />} />
                    <Route path="/notes/new" element={<NoteCreate />} />
                    <Route path="/notes/:id" element={<NoteDetail />} />
                    <Route path="/notes/meeting/:meetingId" element={<NoteMeetingDetail />} />
                    <Route path="/notes/meeting/:meetingId/edit" element={<NoteMeetingEdit />} />

                    <Route path="/meeting" element={<JoinMeeting />} />
                    <Route path="/meeting/create" element={<CreateMeeting />} />
                    <Route path="/meeting/:meetingId" element={<Meeting />} />

                    <Route path="/settings" element={<Settings />} />
                </Route>
            </Routes>
        </BrowserRouter>
    </React.StrictMode>
);
