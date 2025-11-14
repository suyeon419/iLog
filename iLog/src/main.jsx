import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import { AuthContext } from './context/AuthContext.jsx';

import './index.css';

import { BrowserRouter, Route, Routes } from 'react-router-dom';
import MainLayout from './layout/MainLayout.jsx';
import Login from './pages/user/Login.jsx';
import Home from './pages/user/Home.jsx';
import Register from './pages/user/Register.jsx';
import Meeting from './pages/meeting/Meeting.jsx';
import JoinMeeting from './pages/meeting/JoinMeeting.jsx';
import CreateMeeting from './pages/meeting/CreateMeeting.jsx';
import Note from './pages/note/Note.jsx';
import NoteCreate from './pages/note/NoteCreate.jsx';
import NoteDetail from './pages/note/NoteDetail.jsx';
import NoteMeetingDetail from './pages/note/NoteMeetingDetail.jsx';
import NoteMeetingEdit from './pages/note/NoteMeetingEdit.jsx';
import Settings from './pages/setting/Settings.jsx';
import FindPw from './pages/user/FindPw.jsx';
import FindEmail from './pages/user/FindEmail.jsx';
import ChangePw from './pages/user/ChangePw.jsx';
import EditProfile from './pages/setting/EditProfile.jsx';
import LoginHistory from './pages/setting/LoginHistory.jsx';
import ConfirmPw from './pages/setting/ConfirmPw.jsx';
import MeetingHistory from './pages/setting/MeetingHistory.jsx';
import NoteHistory from './pages/setting/NoteHistory.jsx';
import NoteMeetingDetailHistory from './pages/note/NoteMeetingDetailHistory.jsx';

createRoot(document.getElementById('root')).render(
    // <React.StrictMode>
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
                <Route path="/notes/meeting/:meetingId/history" element={<NoteMeetingDetailHistory />} />

                <Route path="/meeting" element={<JoinMeeting />} />
                <Route path="/meeting/create" element={<CreateMeeting />} />
                <Route path="/meeting/:meetingId" element={<Meeting />} />

                <Route path="/settings" element={<Settings />} />
                <Route path="/edit-profile" element={<EditProfile />} />
                <Route path="/confirm-password" element={<ConfirmPw />} />
                <Route path="login-history" element={<LoginHistory />} />
                <Route path="/history-meeting" element={<MeetingHistory />} />
                <Route path="/history-note" element={<NoteHistory />} />
            </Route>
        </Routes>
    </BrowserRouter>
    // </React.StrictMode>
);
