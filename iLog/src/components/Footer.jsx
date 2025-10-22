import React from 'react';

export default function Footer() {
    return (
        <div style={{ backgroundColor: '#F5F1EC' }}>
            <div style={{ marginBottom: '6px', fontWeight: '600', color: '#b66e03' }}>
                iLog © {new Date().getFullYear()}
            </div>
            <div style={{ color: '#7a7a7a' }}>
                문의:{' '}
                <a href="mailto:ilog.help@gmail.com" style={{ color: '#b66e03', textDecoration: 'none' }}>
                    ilog.help@gmail.com
                </a>
            </div>
            <div style={{ marginTop: '5px' }}>
                <a href="/privacy" style={{ color: '#7a7a7a', margin: '0 10px', textDecoration: 'none' }}>
                    개인정보 처리방침
                </a>{' '}
                |
                <a href="/terms" style={{ color: '#7a7a7a', margin: '0 10px', textDecoration: 'none' }}>
                    이용약관
                </a>
            </div>
        </div>
    );
}
