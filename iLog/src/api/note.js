//여기에 note관련 api정리해서 하십쇼
import api from './axios';
import axios from 'axios';

const API_BASE_URL = 'https://webkit-ilo9-api.duckdns.org';

// ✅ 공통 헤더 (모든 요청에 적용)
// [수정] Content-Type 제거. Axios가 FormData를 감지하고 자동으로 설정하도록 합니다.
const defaultHeaders = {
    // 'Content-Type': 'multipart/form-data', // <-- ❌ 이 줄을 삭제했습니다.
    'Content-Type': 'application/json',
};

// ✅ 토큰 가져오기 헬퍼
const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
};

/**
 * 1. 프로젝트(폴더) 목록 조회 (Root 폴더 조회)
 */
export const getProjects = async () => {
    try {
        const response = await api.get('/folders');
        return response.data; // Root 폴더 객체 반환
    } catch (error) {
        console.error('❌ 프로젝트 목록 로드 실패:', error);
        throw error;
    }
};

/**
 * [추가] 1-1. 특정 프로젝트(폴더) 상세 조회 (하위 회의록 목록 포함)
 * 이 함수를 NoteDetail.jsx에서 사용합니다.
 */
export const getProjectDetails = async (folderId) => {
    try {
        // 토큰이 필요한 요청이므로 'api' 인스턴스 사용
        const response = await api.get(`/folders/${folderId}`);
        // 응답 데이터 예: { folderId: 9, folderName: "웹킷 팀프로젝트", childMinutes: [...] }
        return response.data;
    } catch (error) {
        console.error(`❌ (ID: ${folderId}) 프로젝트 상세 로드 실패:`, error);
        throw error;
    }
};

/**
 * 2. 새 프로젝트(폴더) 생성 (특정 폴더의 자식으로)
 */
export const createProject = async (parentId, projectName) => {
    try {
        const response = await api.post(`/folders/${parentId}`, { folderName: projectName });
        return response.data;
    } catch (error) {
        console.error('❌ 프로젝트 생성 실패:', error);
        throw error;
    }
};

/**
 * 3. 프로젝트 이미지 업로드 (수정)
 */
export const updateProjectImage = async (id, name, file) => {
    const formData = new FormData(); // 👈 "택배 상자" 생성
    formData.append('folderImage', file); // 👈 상자에 "파일" 담기

    // 'api'가 formData를 감지하고 자동으로 Content-Type: multipart/form-data 헤더를 설정
    const response = await api.patch(`/folders/${id}`, formData);

    return response.data;
};

/**
 * 4. 프로젝트 이미지 삭제
 * (가정) DELETE /folders/{folderId}/image
 */
export const deleteProjectImage = async (folderId) => {
    try {
        const response = await api.delete(`/folders/${folderId}/image`);
        return response.data;
    } catch (error) {
        console.error('❌ 이미지 삭제 실패:', error);
        throw error;
    }
};

/**
 * 5. 프로젝트(폴더) 삭제
 * (가정) DELETE /folders/{folderId}
 */
export const deleteProject = async (folderId) => {
    try {
        const response = await api.delete(`/folders/${folderId}`);
        return response.data;
    } catch (error) {
        console.error('❌ 프로젝트 삭제 실패:', error);
        throw error;
    }
};

/* ==========================
 * 회의록 생성 (로그인 필요)
 * ========================== */
export const createNote = async (folderId, data) => {
    console.group('🧾 [createNote] 회의록 생성 요청 디버그 로그');
    console.log('📁 폴더 ID:', folderId);
    console.log('📝 요청 데이터:', data);
    try {
        const headers = {
            ...defaultHeaders,
            ...getAuthHeader(),
        };

        const res = await api.post(`/minutes/${folderId}`, data, { headers });
        console.log('✅ 회의록 생성 성공:', res.data);

        return res.data;
    } catch (err) {
        if (err.response) {
            console.error('❌ 회의록 생성 실패:', {
                status: err.response.status,
                data: err.response.data,
            });
        } else if (err.request) {
            console.error('🚫 서버 응답 없음:', err.request);
        } else {
            console.error('⚙️ 요청 설정 오류:', err.message);
        }
        throw err;
    } finally {
        console.groupEnd();
    }
};

// [추가] 프로젝트 이름 수정 API
export const updateProjectName = async (folderId, newName) => {
    try {
        // ✅ 1. 'api' 인스턴스 사용 (토큰 자동 주입)
        // ✅ 2. { folderName: newName }으로 변경
        const response = await api.patch(`/folders/${folderId}`, {
            folderName: newName,
        });
        return response.data;
    } catch (error) {
        console.error('API Error updateProjectName:', error);
        throw error;
    }
};
