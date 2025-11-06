// Note.jsx

import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { Container, Button, Card, Row, Col, Pagination, Alert, Spinner, Form } from 'react-bootstrap'; // Form 추가
import { useNavigate } from 'react-router-dom';
import { PencilSquare, CheckSquare } from 'react-bootstrap-icons'; // CheckSquare 추가
import {
    getProjects,
    createProject,
    updateProjectImage,
    deleteProjectImage,
    deleteProject,
    updateProjectName, // 이름 수정 API 임포트
} from '../../api/note';

import './Note.css';

const SERVER_BASE_URL = 'https://webkit-ilo9-api.duckdns.org';

export default function Note() {
    const navigate = useNavigate();
    const [items, setItems] = useState([]);
    const [rootFolderId, setRootFolderId] = useState(null);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 4;
    const fileInputRef = useRef(null);

    const [targetItemId, setTargetItemId] = useState(null);
    const [targetItemName, setTargetItemName] = useState(null);

    // 이름 수정을 위한 상태
    const [editingItemId, setEditingItemId] = useState(null);
    const [editingItemName, setEditingItemName] = useState('');

    // ==================================================================
    // [1. 목록 조회] useEffect (디버깅 로그 포함)
    // ==================================================================
    useEffect(() => {
        const fetchProjects = async () => {
            let initialItems = []; // API로부터 받은 원본 데이터를 담을 배열
            try {
                setLoading(true);
                setError('');

                // 1. 프로젝트 목록(텍스트) 우선 가져오기
                const rootFolderData = await getProjects();
                setRootFolderId(rootFolderData.folderId);

                initialItems = rootFolderData.childFolders
                    .map((project) => ({
                        id: project.id,
                        name: project.name,
                        imagePath: project.folderImage, // '/uploads/...'
                        blobUrl: null, // Blob URL은 아직 없음
                        created: project.createdAt
                            ? new Date(project.createdAt).toLocaleDateString()
                            : '날짜 정보 없음',
                        members: project.members || '...',
                    }))
                    .reverse();

                // 2. 스피너를 표시하기 위해 1차 상태 업데이트
                setItems(initialItems);
                setLoading(false);
            } catch (err) {
                console.error('❌ [Note] 데이터 로드 실패:', err);
                setError('프로젝트를 불러오는 데 실패했습니다.');
                setLoading(false);
                return; // 프로젝트 로드 실패 시 이미지 로딩 시도 안 함
            }

            // --- 3. [수정] Blob 이미지 로딩 (순차 요청 + 디버깅 로그) ---
            try {
                const token = localStorage.getItem('token');

                // ================== 🪵 LOG 1 ==================
                console.log('💡 [Note] 1. 이미지 로더 시작. 토큰:', token ? '있음' : '없음');
                // ===============================================

                if (!token) {
                    console.error('❌ [Note] 1-1. 토큰이 없어서 이미지 로드를 중단합니다. (스피너가 계속 돕니다)');
                    return; // 토큰 없으면 중지
                }

                // API에서 방금 받아온 'initialItems' 배열을 순회합니다.
                console.log(`💡 [Note] 2. 총 ${initialItems.length}개 아이템 순회 시작.`);

                for (const itemToLoad of initialItems) {
                    // imagePath가 있는 항목만 대상으로 합니다.
                    if (itemToLoad.imagePath) {
                        // ================== 🪵 LOG 2 ==================
                        console.log(
                            `💡 [Note] 3. (ID: ${itemToLoad.id}) 이미지 로드 필요. 경로: ${itemToLoad.imagePath}`
                        );
                        // ===============================================

                        try {
                            const imageUrl = `${SERVER_BASE_URL}${itemToLoad.imagePath}`;

                            // ================== 🪵 LOG 3 ==================
                            console.log(`💡 [Note] 4. (ID: ${itemToLoad.id}) 다음 URL로 GET 요청 시도: ${imageUrl}`);
                            // ===============================================

                            const res = await axios.get(imageUrl, {
                                headers: { Authorization: `Bearer ${token}` },
                                responseType: 'blob',
                            });

                            const blobUrl = URL.createObjectURL(res.data);

                            // ================== 🪵 LOG 4 ==================
                            console.log(`✅ [Note] 5. (ID: ${itemToLoad.id}) 이미지 로드 성공. Blob URL 생성됨.`);
                            // ===============================================

                            // 성공한 아이템만 즉시 state에 반영합니다.
                            setItems((prevItems) =>
                                prevItems.map((item) =>
                                    item.id === itemToLoad.id ? { ...item, blobUrl: blobUrl } : item
                                )
                            );
                        } catch (err) {
                            // 개별 요청 실패 시 (401, 404, CORS 등)

                            // ================== 🪵 LOG 5 ==================
                            console.error(
                                `❌ [Note] 7. (ID: ${itemToLoad.id}) 이미지 로드 실패:`,
                                err.response || err.message
                            );
                            // ===============================================

                            // 실패한 아이템은 imagePath를 null로 만들어 '이미지 없음'으로 표시합니다.
                            setItems((prevItems) =>
                                prevItems.map((item) =>
                                    item.id === itemToLoad.id ? { ...item, imagePath: null } : item
                                )
                            );
                        }
                    } else {
                        console.log(`💡 [Note] (ID: ${itemToLoad.id}) imagePath가 없으므로 건너뜁니다.`);
                    }
                }
                console.log('💡 [Note] 9. 이미지 로드 순회 완료.');
            } catch (err) {
                console.error('❌ [Note] Blob 이미지 로딩 순회 중 전체 오류:', err);
            }
        };

        fetchProjects();
    }, []); // 마운트 시 1회만 실행
    // ==================================================================
    // useEffect 끝
    // ==================================================================

    // --- 이미지 핸들러 ---
    const handleTriggerFileInput = (e, id, name) => {
        e.stopPropagation();
        setTargetItemId(id);
        setTargetItemName(name);
        fileInputRef.current.click();
    };

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file || !targetItemId || !targetItemName) return;

        console.log('업로드 시도:', file);
        console.log('파일명:', file.name);
        console.log('타겟 폴더 ID:', targetItemId);
        console.log('폴더 이름:', targetItemName);

        const newPreviewUrl = URL.createObjectURL(file);
        try {
            setItems((prevItems) =>
                prevItems.map((item) => (item.id === targetItemId ? { ...item, blobUrl: newPreviewUrl } : item))
            );
            const response = await updateProjectImage(targetItemId, targetItemName, file);
            const newImagePath = response.folderImage;
            setItems((prevItems) =>
                prevItems.map((item) =>
                    item.id === targetItemId ? { ...item, imagePath: newImagePath, blobUrl: newPreviewUrl } : item
                )
            );
        } catch (err) {
            console.error('❌ [Note] 이미지 업로드 실패:', err);
            setItems((prevItems) =>
                prevItems.map((item) =>
                    item.id === targetItemId ? { ...item, blobUrl: item.imagePath ? item.blobUrl : null } : item
                )
            );
            alert('이미지 업로드에 실패했습니다.');
        } finally {
            setTargetItemId(null);
            setTargetItemName(null);
            e.target.value = null;
        }
    };

    const handleDeleteImage = async (e, id) => {
        e.stopPropagation();
        if (!window.confirm('이미지를 삭제하시겠습니까?')) return;
        try {
            await deleteProjectImage(id);
            setItems((prevItems) =>
                prevItems.map((item) => (item.id === id ? { ...item, imagePath: null, blobUrl: null } : item))
            );
        } catch (err) {
            console.error('❌ [Note] 이미지 삭제 실패:', err);
            alert('이미지 삭제에 실패했습니다.');
        }
    };
    // --- 이미지 핸들러 끝 ---

    // --- 이름 수정 핸들러 ---
    const handleEditClick = (e, item) => {
        e.stopPropagation(); // 카드 클릭(이동) 방지
        setEditingItemId(item.id);
        setEditingItemName(item.name);
    };

    const handleCancelEdit = (e) => {
        e.stopPropagation();
        setEditingItemId(null);
        setEditingItemName('');
    };

    const handleNameChange = (e) => {
        setEditingItemName(e.target.value);
    };

    const handleSaveEdit = async (e, id) => {
        e.stopPropagation();
        if (!editingItemName.trim()) {
            alert('프로젝트 이름은 비워둘 수 없습니다.');
            return;
        }
        try {
            // API 호출
            await updateProjectName(id, editingItemName);

            // 로컬 상태 업데이트
            setItems((prevItems) =>
                prevItems.map((item) => (item.id === id ? { ...item, name: editingItemName } : item))
            );

            // 수정 모드 종료
            setEditingItemId(null);
            setEditingItemName('');
        } catch (err) {
            console.error('❌ [Note] 프로젝트 이름 수정 실패:', err);
            alert('이름 수정에 실패했습니다.');
        }
    };
    // --- 이름 수정 핸들러 끝 ---

    // --- 프로젝트 핸들러 ---
    const handleAddMeeting = async () => {
        const newName = window.prompt('새 프로젝트 이름을 입력하세요:', `새 프로젝트 ${items.length + 1}`);
        if (!newName) return;
        if (!rootFolderId) {
            alert('상위 폴더(Root) ID를 찾지 못했습니다. 페이지를 새로고침 해주세요.');
            return;
        }
        try {
            const newProject = await createProject(rootFolderId, newName);
            const mappedProject = {
                id: newProject.folderId,
                name: newProject.folderName,
                imagePath: newProject.folderImage,
                blobUrl: null,
                created: newProject.createdAt ? new Date(newProject.createdAt).toLocaleDateString() : '날짜 정보 없음',
                members: '...',
            };
            setItems((prevItems) => [mappedProject, ...prevItems]);
            setCurrentPage(1);
        } catch (err) {
            console.error('❌ [Note] 프로젝트 생성 실패:', err);
            alert('프로젝트 생성에 실패했습니다.');
        }
    };

    const handleDeleteProject = async (e, id, name) => {
        e.stopPropagation();
        if (!window.confirm(`'${name}' 프로젝트를 정말 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`)) return;
        try {
            await deleteProject(id);
            setItems((prevItems) => prevItems.filter((item) => item.id !== id));

            const newTotalPages = Math.ceil((items.length - 1) / ITEMS_PER_PAGE);
            if (currentPage > newTotalPages && newTotalPages > 0) {
                setCurrentPage(newTotalPages);
            } else if (items.length - 1 === 0) {
                setCurrentPage(1);
            }
        } catch (err) {
            console.error('❌ [Note] 프로젝트 삭제 실패:', err);
            alert('프로젝트 삭제에 실패했습니다.');
        }
    };

    const handleRowClick = (id) => {
        // 수정 모드일 때는 이동 방지
        if (editingItemId === id) return;
        navigate(`/notes/${id}`);
    };
    // --- 프로젝트 핸들러 끝 ---

    // --- 페이지네이션 로직 ---
    const totalPages = Math.ceil(items.length / ITEMS_PER_PAGE);
    const indexOfLastItem = currentPage * ITEMS_PER_PAGE;
    const indexOfFirstItem = indexOfLastItem - ITEMS_PER_PAGE;
    const currentItems = items.slice(indexOfFirstItem, indexOfLastItem);
    const handlePageChange = (pageNumber) => {
        const newPage = Math.max(1, Math.min(pageNumber, totalPages === 0 ? 1 : totalPages));
        setCurrentPage(newPage);
    };
    const renderPaginationItems = () => {
        let pageItems = [];
        const total = totalPages === 0 ? 1 : totalPages;
        for (let number = 1; number <= total; number++) {
            pageItems.push(
                <Pagination.Item key={number} active={number === currentPage} onClick={() => handlePageChange(number)}>
                    {number}
                </Pagination.Item>
            );
        }
        return pageItems;
    };
    // ------------------------

    // 로딩 및 에러 UI 처리
    const renderContent = () => {
        if (loading) {
            return (
                <div className="text-center p-5">
                    <Spinner animation="border" role="status" />
                    <p className="mt-2">프로젝트를 불러오는 중입니다...</p>
                </div>
            );
        }
        if (error) {
            return <Alert variant="danger">{error}</Alert>;
        }
        if (items.length === 0 && !loading) {
            return (
                <div className="text-center p-5">
                    <p>생성된 프로젝트가 없습니다.</p>
                    <p>하단의 '프로젝트 추가하기' 버튼을 눌러 시작하세요.</p>
                </div>
            );
        }

        // 데이터가 있을 경우
        return (
            <Row className="justify-content-center">
                {currentItems.map((item) => (
                    <Col md="auto" lg="auto" className="mb-4" key={item.id}>
                        <Card className="h-100 card-project">
                            {/* --- 이미지 영역 --- */}
                            <div className="card-image-container">
                                {item.blobUrl ? (
                                    (() => {
                                        return (
                                            <Card.Img
                                                className="card-image-placeholder"
                                                variant="top"
                                                src={item.blobUrl}
                                                alt={item.name}
                                            />
                                        );
                                    })()
                                ) : (
                                    <div className="card-image-placeholder">
                                        {item.imagePath
                                            ? (() => {
                                                  return <Spinner animation="border" size="sm" />;
                                              })()
                                            : (() => {
                                                  return <span>사진을 추가해 주세요</span>;
                                              })()}
                                    </div>
                                )}
                                <div className="card-hover-buttons">
                                    {item.blobUrl ? (
                                        <>
                                            <Button
                                                variant="light"
                                                className="btn-change"
                                                onClick={(e) => handleTriggerFileInput(e, item.id, item.name)}
                                            >
                                                변경
                                            </Button>
                                            <Button
                                                variant="danger"
                                                className="btn-delete"
                                                onClick={(e) => handleDeleteImage(e, item.id)}
                                            >
                                                삭제
                                            </Button>
                                        </>
                                    ) : (
                                        !item.imagePath && (
                                            <Button
                                                variant="light"
                                                className="btn-add"
                                                onClick={(e) => handleTriggerFileInput(e, item.id, item.name)}
                                            >
                                                추가
                                            </Button>
                                        )
                                    )}
                                </div>
                            </div>
                            {/* --- 이미지 영역 끝 --- */}

                            <Card.Body
                                onClick={() => handleRowClick(item.id)}
                                style={{ cursor: editingItemId === item.id ? 'default' : 'pointer' }} // 수정 중엔 커서 변경
                                className="text-center d-flex flex-column"
                            >
                                {/* --- 이름 수정 UI (새 버전) --- */}
                                {editingItemId === item.id ? (
                                    <>
                                        {/* 수정 모드일 때 */}
                                        {/* 1. Flex 컨테이너 */}
                                        <div className="d-flex align-items-center">
                                            <Form.Control
                                                type="text"
                                                value={editingItemName}
                                                onChange={handleNameChange}
                                                onClick={(e) => e.stopPropagation()} // 이벤트 버블링 방지
                                                autoFocus
                                                className="form-control-inline-edit" // 2. 커스텀 CSS 클래스
                                            />
                                            {/* 4. '저장' 아이콘 버튼 */}
                                            <CheckSquare
                                                className="ms-2 edit-action-icon save-icon"
                                                onClick={(e) => handleSaveEdit(e, item.id)}
                                            />
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        {/* 일반 모드일 때 */}
                                        <Card.Title style={{ fontWeight: 'bold' }} className="mb-2 card-title-editable">
                                            {item.name}
                                            <PencilSquare
                                                className="ms-2 edit-icon"
                                                onClick={(e) => handleEditClick(e, item)}
                                            />
                                        </Card.Title>
                                        <p style={{ fontSize: '0.95rem', color: '#6c757d' }}>{item.created}</p>
                                    </>
                                )}
                                {/* --- 이름 수정 UI 끝 --- */}

                                <div className="mt-3 flex-grow-1">
                                    {item.members ? (
                                        item.members.split(' ').map((member, index) => (
                                            <p key={index} style={{ marginBottom: '0.25rem', fontWeight: '500' }}>
                                                {member}
                                            </p>
                                        ))
                                    ) : (
                                        <p style={{ fontStyle: 'italic', color: '#aaa' }}>...</p>
                                    )}
                                </div>
                                <Button
                                    variant="outline-danger"
                                    size="sm"
                                    className="mt-3"
                                    onClick={(e) => handleDeleteProject(e, item.id, item.name)}
                                >
                                    프로젝트 삭제
                                </Button>
                            </Card.Body>
                        </Card>
                    </Col>
                ))}
            </Row>
        );
    };

    return (
        <>
            <Container className="pt-3">
                <h2 style={{ fontWeight: 'bold', color: '#333' }} className="mb-4">
                    <PencilSquare className="me-3" />
                    프로젝트
                </h2>

                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                    accept="image/*"
                />

                {renderContent()}

                {totalPages > 1 && (
                    <nav className="mt-3 pagination-nav">
                        <Pagination className="justify-content-center">
                            <Pagination.Prev
                                onClick={() => handlePageChange(currentPage - 1)}
                                disabled={currentPage === 1}
                            />
                            {renderPaginationItems()}
                            <Pagination.Next
                                onClick={() => handlePageChange(currentPage + 1)}
                                disabled={currentPage === (totalPages === 0 ? 1 : totalPages)}
                            />
                        </Pagination>
                    </nav>
                )}

                <Button variant="primary" className="w-100 mt-3" onClick={handleAddMeeting}>
                    프로젝트 추가하기
                </Button>
            </Container>
        </>
    );
}
