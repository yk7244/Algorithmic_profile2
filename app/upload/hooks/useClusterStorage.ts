import { useEffect } from 'react';
import { 
    getWatchHistory, 
    getClusterHistory,
    getActiveUserImages,
    convertDBImagesToLocalStorage
} from '@/lib/database-clean';
import { supabase } from '@/lib/supabase-clean';

export function useClusterStorage({
    setWatchHistory,
    setClusters,
    setClusterImages,
    clusterImages,
    clusters,
    setAnalysisHistory,
    }: {
    setWatchHistory: (v: any) => void,
    setClusters: (v: any) => void,
    setClusterImages: (v: any) => void,
    clusterImages: any,
    clusters: any[],
    setAnalysisHistory: (v: any) => void,
    }) {
    // 시청기록, 클러스터 로드 - DB에서 가져오기 (최초 마운트 시 1회만 실행)
    useEffect(() => {
        const loadUserData = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) {
                    console.log('사용자 인증 없음, localStorage 백업 사용');
                    // 인증되지 않은 경우 localStorage 백업 사용
                    const savedHistory = JSON.parse(localStorage.getItem('watchHistory') || '[]');
                    setWatchHistory(savedHistory);
                    const savedClusters = JSON.parse(localStorage.getItem('watchClusters') || '[]');
                    setClusters(savedClusters);
                    return;
                }

                // DB에서 시청 기록 로드 (현재 사용자)
                const dbWatchHistory = await getWatchHistory();
                if (dbWatchHistory && dbWatchHistory.length > 0) {
                    console.log('✅ DB에서 시청 기록 로드:', dbWatchHistory.length, '개');
                    setWatchHistory(dbWatchHistory);
                } else {
                    // DB에 없으면 localStorage 백업 확인
                    const savedHistory = JSON.parse(localStorage.getItem('watchHistory') || '[]');
                    if (savedHistory.length > 0) {
                        console.log('localStorage에서 시청 기록 백업 로드:', savedHistory.length, '개');
                        setWatchHistory(savedHistory);
                    }
                }

                // DB에서 클러스터 히스토리 로드  
                const dbClusters = await getClusterHistory(user.id);
                if (dbClusters && dbClusters.length > 0) {
                    console.log('✅ DB에서 클러스터 히스토리 로드:', dbClusters.length, '개');
                    setClusters(dbClusters);
                } else {
                    // DB에 없으면 localStorage 백업 확인
                    const savedClusters = JSON.parse(localStorage.getItem('watchClusters') || '[]');
                    if (savedClusters.length > 0) {
                        console.log('localStorage에서 클러스터 백업 로드:', savedClusters.length, '개');
                        setClusters(savedClusters);
                    }
                }

            } catch (error) {
                console.error('DB 데이터 로드 중 오류:', error);
                // 오류 시 localStorage 백업 사용
                const savedHistory = JSON.parse(localStorage.getItem('watchHistory') || '[]');
                setWatchHistory(savedHistory);
                const savedClusters = JSON.parse(localStorage.getItem('watchClusters') || '[]');
                setClusters(savedClusters);
            }
        };

        loadUserData();
        // eslint-disable-next-line
    }, []);

    // 데이터 마이그레이션 (최초 마운트 시 1회만 실행)
    useEffect(() => {
        const migrateLocalStorageData = () => {
        try {
            const storedClusterImages = localStorage.getItem('clusterImages');
            if (storedClusterImages) {
            const parsedClusterImages = JSON.parse(storedClusterImages);
            const migratedClusterImages: Record<string, any> = {};
            Object.entries(parsedClusterImages).forEach(([key, value]: [string, any]) => {
                if (value && typeof value === 'object') {
                migratedClusterImages[key] = {
                    ...value,
                    main_keyword: key,
                };
                } else {
                migratedClusterImages[key] = value;
                }
            });
            localStorage.setItem('clusterImages', JSON.stringify(migratedClusterImages));
            console.log('클러스터 이미지 데이터 마이그레이션 완료');
            }
            localStorage.setItem('clusterDataMigrationCompleted', 'true');
        } catch (error) {
            console.error('데이터 마이그레이션 중 오류 발생:', error);
        }
        };
        const migrationCompleted = localStorage.getItem('clusterDataMigrationCompleted');
        if (migrationCompleted !== 'true') {
        migrateLocalStorageData();
        }
    }, []);


    // 저장된 이미지 로드 - DB에서 가져오기 (clusters가 바뀔 때만 실행)
    useEffect(() => {
        const loadSavedImages = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) {
                    // 인증되지 않은 경우 localStorage 백업 사용
                    const savedImages = JSON.parse(localStorage.getItem('clusterImages') || '{}');
                    const newClusterImages = { ...clusterImages };
                    clusters.forEach((cluster: any, index: number) => {
                        if (savedImages[cluster.main_keyword]) {
                            newClusterImages[index] = savedImages[cluster.main_keyword];
                        }
                    });
                    setClusterImages(newClusterImages);
                    return;
                }

                // DB에서 활성 이미지들 로드
                const dbImages = await getActiveUserImages(user.id);
                if (dbImages && dbImages.length > 0) {
                    console.log('✅ DB에서 이미지 데이터 로드:', dbImages.length, '개');
                    const localStorageImages = convertDBImagesToLocalStorage(dbImages);
                    
                    // 클러스터별로 이미지 매핑
                    const newClusterImages = { ...clusterImages };
                    clusters.forEach((cluster: any, index: number) => {
                        const matchingImage = localStorageImages.find(img => 
                            img.main_keyword === cluster.main_keyword
                        );
                        if (matchingImage) {
                            newClusterImages[index] = matchingImage;
                        }
                    });
                    setClusterImages(newClusterImages);
                } else {
                    // DB에 없으면 localStorage 백업 사용
                    const savedImages = JSON.parse(localStorage.getItem('clusterImages') || '{}');
                    const newClusterImages = { ...clusterImages };
                    clusters.forEach((cluster: any, index: number) => {
                        if (savedImages[cluster.main_keyword]) {
                            newClusterImages[index] = savedImages[cluster.main_keyword];
                        }
                    });
                    setClusterImages(newClusterImages);
                }

            } catch (error) {
                console.error('DB 이미지 로드 중 오류:', error);
                // 오류 시 localStorage 백업 사용
                const savedImages = JSON.parse(localStorage.getItem('clusterImages') || '{}');
                const newClusterImages = { ...clusterImages };
                clusters.forEach((cluster: any, index: number) => {
                    if (savedImages[cluster.main_keyword]) {
                        newClusterImages[index] = savedImages[cluster.main_keyword];
                    }
                });
                setClusterImages(newClusterImages);
            }
        };

        if (clusters.length > 0) {
            loadSavedImages();
        }
    }, [clusters]);

    // 분석 기록 로드 - DB에서 가져오기 (최초 마운트 시 1회만 실행)
    useEffect(() => {
        const loadAnalysisHistory = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) {
                    // 인증되지 않은 경우 localStorage 백업 사용
                    const savedAnalyses = JSON.parse(localStorage.getItem('analysisHistory') || '[]');
                    setAnalysisHistory(savedAnalyses);
                    return;
                }

                // DB에서 클러스터 히스토리를 분석 기록으로 사용
                const dbClusters = await getClusterHistory(user.id);
                if (dbClusters && dbClusters.length > 0) {
                    console.log('✅ DB에서 분석 기록 로드:', dbClusters.length, '개');
                    // 클러스터 히스토리를 분석 기록 형식으로 변환
                    const analysisHistory = dbClusters.map(cluster => ({
                        id: cluster.id,
                        date: cluster.created_at,
                        clusters: cluster.images_data || [],
                        nickname: cluster.nickname,
                        description: cluster.description
                    }));
                    setAnalysisHistory(analysisHistory);
                } else {
                    // DB에 없으면 빈 배열 사용 (더미 데이터 방지)
                    const savedAnalyses = JSON.parse(localStorage.getItem('analysisHistory') || '[]');
                    if (savedAnalyses.length > 0 && !sessionStorage.getItem('analysis_dummy_warning_shown')) {
                        console.log('⚠️ localStorage에 분석 기록이 있지만 더미 데이터일 가능성이 높아 무시합니다');
                        console.log('💡 실제 데이터를 생성하려면 업로드 페이지에서 YouTube 시청 기록을 업로드하세요');
                        sessionStorage.setItem('analysis_dummy_warning_shown', 'true'); // 세션당 한 번만 표시
                    }
                    setAnalysisHistory([]); // 빈 배열로 설정하여 더미 데이터 방지
                }

            } catch (error) {
                console.error('DB 분석 기록 로드 중 오류:', error);
                // 오류 시에도 더미 데이터 방지
                const savedAnalyses = JSON.parse(localStorage.getItem('analysisHistory') || '[]');
                if (savedAnalyses.length > 0) {
                    console.log('⚠️ DB 오류로 인해 localStorage 확인했지만 더미 데이터일 가능성이 높아 무시합니다');
                }
                setAnalysisHistory([]); // 빈 배열로 설정
            }
        };

        loadAnalysisHistory();
        // eslint-disable-next-line
    }, []);
} 