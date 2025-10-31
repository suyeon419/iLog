import React, { createContext, useEffect, useState } from 'react';
import { jwtDecode } from 'jwt-decode';
import { getUserById } from '../api/user';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isLogin, setIsLogin] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem('accessToken');
        if (token) {
            try {
                const decoded = jwtDecode(token);
                const userId = decoded.id;
                console.log('🔐 [AuthContext] 토큰 감지됨:', decoded);

                getUserById(userId)
                    .then((data) => {
                        setUser(data);
                        setIsLogin(true);
                        console.log('✅ [AuthContext] 사용자 정보 불러옴:', data);
                    })
                    .catch((err) => {
                        console.error('❌ [AuthContext] 사용자 정보 요청 실패:', err);
                        localStorage.removeItem('accessToken');
                        setIsLogin(false);
                    });
            } catch (err) {
                console.error('❌ [AuthContext] 토큰 디코딩 실패:', err);
                localStorage.removeItem('accessToken');
                setIsLogin(false);
            }
        }
    }, []);

    const logout = () => {
        localStorage.removeItem('accessToken');
        setUser(null);
        setIsLogin(false);
    };

    return (
        <AuthContext.Provider value={{ user, isLogin, setUser, setIsLogin, logout }}>{children}</AuthContext.Provider>
    );
};
