// EditProfile.jsx

import React, { useState, useEffect } from 'react';
import { Alert, Button, Container, Form } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { getUserById, updateUserInfo } from '../../api/user';

const SERVER_BASE_URL = 'https://webkit-ilo9-api.duckdns.org'; // (임시 예시 주소)

export default function EditProfile() {
    const navigate = useNavigate();

    const [form, setForm] = useState({
        email: '',
        name: '',
        password: '',
        checkPassword: '',
    });

    const [error, setError] = useState('');
    const [isLogin, setIsLogin] = useState(false);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(false);

    // ⭐️ [2] 이미지 파일과 미리보기 URL을 위한 상태 추가
    const [profileImageFile, setProfileImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null); // 이미지 미리보기 URL

    useEffect(() => {
        const token = localStorage.getItem('accessToken');
        if (token) {
            setIsLogin(true);
            getUserById()
                .then((data) => {
                    console.log('✅ [EditProfile] 회원 정보 조회 성공:', data);
                    if (data) {
                        setUser(data);
                    } else {
                        console.warn('⚠️ [EditProfile] 회원 정보 조회는 성공했으나 데이터가 비어있습니다.');
                    }
                })
                .catch((err) => {
                    console.error('❌ [EditProfile] 회원 정보 요청 실패:', err);
                    localStorage.removeItem('accessToken');
                    setIsLogin(false);
                });
        } else {
            setIsLogin(false);
            console.log('🔌 [EditProfile] 토큰이 없어 로그인 상태가 아닙니다.');
        }
    }, []);

    useEffect(() => {
        if (user) {
            setForm((prevForm) => ({
                ...prevForm,
                email: user.email,
                name: user.name,
            }));

            // ⭐️ [3] 사용자 정보 로드 시, 기존 프로필 이미지를 미리보기로 설정
            if (user.profileImage) {
                setImagePreview(`${SERVER_BASE_URL}${user.profileImage}`);
            }
        }
    }, [user]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm({ ...form, [name]: value });
    };

    // ⭐️ [4] 이미지 파일 변경 시 호출될 핸들러 추가
    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setProfileImageFile(file); // 실제 파일 객체 저장
            setImagePreview(URL.createObjectURL(file)); // 미리보기용 임시 URL 생성
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        if (form.password && form.password !== form.checkPassword) {
            setError('비밀번호가 일치하지 않습니다.');
            setLoading(false);
            return;
        }

        const formData = new FormData();
        formData.append('name', form.name);

        if (form.password) {
            formData.append('newPassword', form.password);
            formData.append('checkPassword', form.checkPassword);
        }

        // ⭐️ [5] 새 이미지 파일이 있으면 FormData에 추가
        if (profileImageFile) {
            formData.append('profileImage', profileImageFile);
        }

        try {
            console.log('Step: 회원 정보 수정 시도...');
            await updateUserInfo(formData);
            console.log('✅ 회원 정보 수정 성공');

            alert('회원 정보가 성공적으로 수정되었습니다.');
            navigate('/settings');
        } catch (err) {
            console.error('❌ 회원 정보 수정 실패:', err);
            setError('정보 수정 중 오류가 발생했습니다. 다시 시도해 주세요.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container className="pt-3">
            <h2 className="fw-bold text-center my-4">회원 정보 수정</h2>

            {error && <Alert variant="danger">{error}</Alert>}

            {/* ⭐️ [6] 프로필 이미지 미리보기 영역 추가 */}
            <div className="text-center mb-4">
                <img
                    src={imagePreview || './images/profile.png'} // 미리보기가 있거나, 없으면 기본 이미지
                    alt="프로필 미리보기"
                    style={{
                        width: '150px',
                        height: '150px',
                        borderRadius: '50%',
                        objectFit: 'cover',
                        border: '3px solid #b66e03',
                    }}
                />
            </div>

            <Form onSubmit={handleSubmit}>
                {/* ⭐️ [7] 프로필 사진 변경을 위한 파일 입력 필드 추가 */}
                <Form.Group className="mb-3">
                    <Form.Label>프로필 사진 변경</Form.Label>
                    <Form.Control
                        type="file"
                        onChange={handleImageChange}
                        accept="image/*" // 이미지 파일만 선택 가능하도록 설정
                    />
                </Form.Group>

                <Form.Group>
                    <Form.Label>이메일</Form.Label>
                    <Form.Control
                        type="text"
                        name="email"
                        value={form.email}
                        onChange={handleChange}
                        placeholder="이메일을 입력하세요"
                        required
                        readOnly
                    />
                </Form.Group>
                <Form.Group>
                    <Form.Label>이름</Form.Label>
                    <Form.Control
                        type="text"
                        name="name"
                        value={form.name}
                        onChange={handleChange}
                        placeholder="이름을 입력하세요"
                        required
                    />
                </Form.Group>
                <Form.Group>
                    <Form.Label>비밀번호</Form.Label>
                    <Form.Control
                        type="password"
                        name="password"
                        value={form.password}
                        onChange={handleChange}
                        placeholder="새 비밀번호 (변경 시에만 입력)"
                    />
                </Form.Group>
                <Form.Group className="mb-3">
                    <Form.Label>비밀번호 확인</Form.Label>
                    <Form.Control
                        type="password"
                        name="checkPassword"
                        value={form.checkPassword}
                        onChange={handleChange}
                        placeholder="새 비밀번호 확인"
                    />
                </Form.Group>

                <Button type="submit" variant="primary" className="user-btn" disabled={loading}>
                    {loading ? '수정 중...' : '수정 완료'}
                </Button>
            </Form>
        </Container>
    );
}
