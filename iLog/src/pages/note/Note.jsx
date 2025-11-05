// Note.jsx

import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { Container, Button, Card, Row, Col, Pagination, Alert, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { PencilSquare } from 'react-bootstrap-icons';
import { getProjects, createProject, updateProjectImage, deleteProjectImage, deleteProject } from '../../api/note';

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

    // [수정] ID와 Name을 함께 저장
    const [targetItemId, setTargetItemId] = useState(null);
    const [targetItemName, setTargetItemName] = useState(null);

    // [1. 목록 조회] useEffect (Blob 로딩 로직 포함)
    useEffect(() => {
        const fetchProjects = async () => {
            let initialItems = [];
            try {
                setLoading(true);
                setError('');

                const rootFolderData = await getProjects();
                setRootFolderId(rootFolderData.folderId);

                initialItems = rootFolderData.childFolders
                    .map((project) => ({
                        id: project.id,
                        name: project.name,
                        imagePath: project.folderImage,
                        blobUrl: null,
                        created: project.createdAt
                            ? new Date(project.createdAt).toLocaleDateString()
                            : '날짜 정보 없음',
                        members: project.members || '...',
                    }))
                    .reverse();

                setItems(initialItems);
                setLoading(false);
            } catch (err) {
                console.error('❌ [Note] 데이터 로드 실패:', err);
                setError('프로젝트를 불러오는 데 실패했습니다.');
                setLoading(false);
                return;
            }

            // --- 3. [신규] Blob 이미지 로딩 (EditProfile.jsx 방식) ---
            try {
                const token = localStorage.getItem('token');
                if (!token) return;

                const imageFetchPromises = initialItems
                    .filter((item) => item.imagePath)
                    .map((item) =>
                        axios
                            .get(`${SERVER_BASE_URL}${item.imagePath}`, {
                                headers: { Authorization: `Bearer ${token}` },
                                responseType: 'blob',
                            })
                            .then((res) => {
                                const blobUrl = URL.createObjectURL(res.data);
                                return { id: item.id, blobUrl };
                            })
                            .catch((err) => {
                                console.error(`❌ [Note] 이미지 로드 실패 (ID: ${item.id}):`, err);
                                return null;
                            })
                    );

                const loadedImages = (await Promise.all(imageFetchPromises)).filter(Boolean);

                setItems((prevItems) =>
                    prevItems.map((item) => {
                        const loadedImage = loadedImages.find((img) => img.id === item.id);
                        return loadedImage ? { ...item, blobUrl: loadedImage.blobUrl } : item;
                    })
                );
            } catch (err) {
                console.error('❌ [Note] Blob 이미지 로딩 중 전체 오류:', err);
            }
        };

        fetchProjects();
    }, []);

    // --- 이미지 핸들러 ---

    // [수정] ID와 Name을 모두 저장
    const handleTriggerFileInput = (e, id, name) => {
        e.stopPropagation();
        setTargetItemId(id);
        setTargetItemName(name); // <-- name도 저장
        fileInputRef.current.click();
    };

    // [2. 이미지 업로드] (백엔드 연동)
    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        // [수정] targetItemName도 확인
        if (!file || !targetItemId || !targetItemName) return;

        const newPreviewUrl = URL.createObjectURL(file);

        try {
            setItems((prevItems) =>
                prevItems.map((item) => (item.id === targetItemId ? { ...item, blobUrl: newPreviewUrl } : item))
            );

            // [수정] API 호출 시 id, name, file을 모두 전달
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
            setTargetItemName(null); // <-- 초기화
            e.target.value = null;
        }
    };

    // [3. 이미지 삭제] (백엔드 연동)
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

    // --- 프로젝트 핸들러 (이하 동일) ---

    // [4. 프로젝트 추가]
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

    // [5. 프로젝트 삭제]
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
        navigate(`/notes/${id}`);
    };

    // --- 페이지네이션 로직 (동일) ---
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

    // [수정] 로딩 및 에러 UI 처리
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
                            <div className="card-image-container">
                                {/* {item.blobUrl ? (
                                    <Card.Img
                                        className="card-image-placeholder"
                                        variant="top"
                                        src={item.blobUrl}
                                        alt={item.name}
                                    />
                                ) : (
                                    <div className="card-image-placeholder">
                                        {item.imagePath ? (
                                            <Spinner animation="border" size="sm" />
                                        ) : (
                                            <span>사진을 추가해 주세요</span>
                                        )}
                                    </div>
                                )} */}
                                {item.blobUrl ? (
                                    // [1] blobUrl이 있으면 (로딩 최종 완료)
                                    (() => {
                                        console.log(`✅ [Render ${item.id} / ${item.name}]: 1. blobUrl 표시`);
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
                                    // [2] blobUrl이 없으면
                                    <div className="card-image-placeholder">
                                        {item.imagePath
                                            ? // [3] imagePath는 있으면 (로딩 중)
                                              (() => {
                                                  console.log(
                                                      `⌛ [Render ${item.id} / ${item.name}]: 2. 로딩 중 (imagePath만 있음)`
                                                  );
                                                  return <Spinner animation="border" size="sm" />;
                                              })()
                                            : // [4] imagePath도 없으면 (이미지 없음)
                                              (() => {
                                                  console.log(`⚪ [Render ${item.id} / ${item.name}]: 3. 이미지 없음`);
                                                  return <span>사진을 추가해 주세요</span>;
                                              })()}
                                    </div>
                                )}

                                <div className="card-hover-buttons">
                                    {item.blobUrl ? (
                                        <>
                                            {/* [수정] onClick에 item.name 전달 */}
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
                                            /* [수정] onClick에 item.name 전달 */
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

                            <Card.Body
                                onClick={() => handleRowClick(item.id)}
                                style={{ cursor: 'pointer' }}
                                className="text-center d-flex flex-column"
                            >
                                <Card.Title style={{ fontWeight: 'bold' }} className="mb-2">
                                    {item.name}
                                </Card.Title>
                                <p style={{ fontSize: '0.95rem', color: '#6c757d' }}>{item.created}</p>
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
