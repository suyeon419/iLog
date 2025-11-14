import React from 'react';

export default function Footer() {
    return (
        <footer
            style={{
                backgroundColor: '#f5f1ec',
                padding: '20px 0',
                marginTop: '40px',
                borderTop: '1px solid #e0dcd5',
                textAlign: 'center',
                fontFamily: 'Pretendard, sans-serif',
            }}
        >
            <div style={{ fontWeight: '600', color: '#b66e03', marginBottom: '4px' }}>
                회의록 서비스 iLo9 © {new Date().getFullYear()}
            </div>
            <div style={{ color: '#7a7a7a', fontSize: '14px' }}>
                문의:{' '}
                <a href="mailto:ilo9.help@gmail.com" style={{ color: '#b66e03', textDecoration: 'none' }}>
                    ilo9.help@gmail.com
                </a>
            </div>
            <div style={{ marginTop: '8px', fontSize: '13px' }}>
                <a href="/privacy" style={{ color: '#7a7a7a', margin: '0 10px', textDecoration: 'none' }}>
                    개인정보 처리방침
                </a>
                |
                <a href="/terms" style={{ color: '#7a7a7a', margin: '0 10px', textDecoration: 'none' }}>
                    이용약관
                </a>
            </div>
        </footer>
    );
}
