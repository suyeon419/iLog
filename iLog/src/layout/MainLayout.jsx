import React from 'react';
import AppHeader from '../components/AppHeader';
import { Outlet } from 'react-router-dom';
import Footer from '../components/Footer';

export default function MainLayout() {
    return (
        <>
            <AppHeader />
            <div style={{ paddingTop: '12vh' }}>
                <Outlet />
            </div>
            <Footer />
        </>
    );
}
