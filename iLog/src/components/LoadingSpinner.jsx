// LoadingSpinner.js (또는 해당 컴포넌트)
import React from 'react';
import './LoadingSpinner.css'; // 이 CSS 파일에 애니메이션을 추가할 거예요.
import writingIcon from '../../public/images/writing-icon.png';

export const LoadingSpinner = () => {
    return (
        <div className="loading-wrapper">
            <img
                src={writingIcon}
                alt="로딩 중"
                className="loading-icon" // 이 클래스에 애니메이션을 적용합니다.
            />
            <p>로딩 중</p>
        </div>
    );
};
