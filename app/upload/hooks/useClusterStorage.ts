import { useEffect } from 'react';
import { 
  getWatchHistory, 
  getClusterHistory, 
  getClusterImages, 
  getCurrentUserId,
  ensureUserExists 
} from '@/lib/database';

export function useClusterStorage({
    setWatchHistory,
    setClusters,
    setClusterImages,
    clusterImages,
    clusters,
    setAnalysisHistory,
    searchClusterImage
    }: {
    setWatchHistory: (v: any) => void,
    setClusters: (v: any) => void,
    setClusterImages: (v: any) => void,
    clusterImages: any,
    clusters: any[],
    setAnalysisHistory: (v: any) => void,
    searchClusterImage: (cluster: any) => Promise<any>
    }) {
    
    // 🚫 업로드 페이지에서는 기존 시청기록 자동 로드 비활성화
    // 새로운 JSON 파일 업로드 시 기존 데이터가 덮어쓰는 문제 방지
    // useEffect(() => {
    //     const loadWatchHistory = async () => {
    //         try {
    //             const userId = await getCurrentUserId();
    //             if (userId) {
    //                 // DB에서 로드
    //                 const dbWatchHistory = await getWatchHistory(userId, 100); // 최근 100개
    //                 if (dbWatchHistory && dbWatchHistory.length > 0) {
    //                     // DB 데이터를 클라이언트 형식으로 변환
    //                     const formattedHistory = dbWatchHistory.map((item: any) => ({
    //                         title: item.title,
    //                         videoId: item.video_id,
    //                         keywords: item.keywords || [],
    //                         tags: item.tags || [],
    //                         timestamp: item.timestamp,
    //                         description: item.description
    //                     }));
    //                     setWatchHistory(formattedHistory);
    //                     // 🆕 사용자별 캐시용으로 localStorage에도 저장
    //                     localStorage.setItem(`watchHistory_${userId}`, JSON.stringify(formattedHistory));
    //                     console.log('[useClusterStorage] DB에서 시청기록 로드 완료:', formattedHistory.length);
    //                     return;
    //                 }
    //             }
                
    //             // 🆕 사용자별 fallback: localStorage에서 로드
    //             const savedHistory = JSON.parse(localStorage.getItem(`watchHistory_${userId}`) || '[]');
    //     setWatchHistory(savedHistory);
    //             console.log('[useClusterStorage] 사용자별 localStorage에서 시청기록 로드:', savedHistory.length);
    //         } catch (error) {
    //             console.error('[useClusterStorage] 시청기록 로드 실패, localStorage fallback:', error);
    //             // 🔥 에러 시에는 사용자별 localStorage 사용하지 않고 빈 배열
    //             setWatchHistory([]);
    //         }
    //     };
        
    //     loadWatchHistory();
    //     // eslint-disable-next-line
    // }, []);

    // 🆕 DB에서 클러스터 기록 로드 (fallback으로 localStorage)
    useEffect(() => {
        const loadClusterHistory = async () => {
            try {
                const userId = await getCurrentUserId();
                if (userId) {
                    // DB에서 클러스터 히스토리 로드
                    const dbClusterHistory = await getClusterHistory(userId);
                    if (dbClusterHistory && dbClusterHistory.length > 0) {
                        // DB 데이터를 analysisHistory 형식으로 변환
                        const analysisHistory = [{
                            id: 'db-latest',
                            date: 'DB에서 로드',
                            clusters: dbClusterHistory.map((item: any) => ({
                                main_keyword: item.main_keyword,
                                category: item.category,
                                description: item.description,
                                keyword_list: (item.keywords || []).join(', '),
                                mood_keyword: item.mood_keyword,
                                strength: item.size_weight,
                                related_videos: item.related_videos || []
                            }))
                        }];
                        
                        setAnalysisHistory(analysisHistory);
                        // 가장 최근 클러스터를 현재 클러스터로 설정
                        setClusters(analysisHistory[0].clusters);
                        
                        // 🆕 사용자별 캐시용으로 localStorage에도 저장
                        localStorage.setItem(`analysisHistory_${userId}`, JSON.stringify(analysisHistory));
                        console.log('[useClusterStorage] DB에서 클러스터 기록 로드 완료');
                        return;
                    }
                }
                
                // 🆕 사용자별 fallback: localStorage에서 로드
                const savedAnalyses = JSON.parse(localStorage.getItem(`analysisHistory_${userId}`) || '[]');
                setAnalysisHistory(savedAnalyses);
                
                const savedClusters = JSON.parse(localStorage.getItem(`watchClusters_${userId}`) || '[]');
        setClusters(savedClusters);
                console.log('[useClusterStorage] 사용자별 localStorage에서 분석 기록 로드');
            } catch (error) {
                console.error('[useClusterStorage] 클러스터 기록 로드 실패, localStorage fallback:', error);
                // 🔥 에러 시에는 빈 배열
                setAnalysisHistory([]);
                setClusters([]);
            }
        };
        
        loadClusterHistory();
        // eslint-disable-next-line
    }, []);

    // 🆕 DB에서 클러스터 이미지 로드 (fallback으로 localStorage)
    useEffect(() => {
        const loadClusterImages = async () => {
            try {
                const userId = await getCurrentUserId();
                if (userId) {
                    // DB에서 클러스터 이미지 로드
                    const dbClusterImages = await getClusterImages(userId);
                    if (dbClusterImages && dbClusterImages.length > 0) {
                        // DB 데이터를 clusterImages 형식으로 변환
                        const formattedImages: Record<number, any> = {};
                        dbClusterImages.forEach((item: any, index: number) => {
                            formattedImages[index] = {
                                url: item.src,
                                main_keyword: item.main_keyword
                            };
                        });
                        
                        setClusterImages(formattedImages);
                        // 🆕 사용자별 캐시용으로 localStorage에도 저장
                        localStorage.setItem(`clusterImages_${userId}`, JSON.stringify(formattedImages));
                        console.log('[useClusterStorage] DB에서 클러스터 이미지 로드 완료');
                        return;
                    }
                }
                
                // 🆕 사용자별 fallback: localStorage에서 로드  
                const savedImages = JSON.parse(localStorage.getItem(`clusterImages_${userId}`) || '{}');
                setClusterImages(savedImages);
                console.log('[useClusterStorage] 사용자별 localStorage에서 클러스터 이미지 로드');
            } catch (error) {
                console.error('[useClusterStorage] 클러스터 이미지 로드 실패, localStorage fallback:', error);
                // 🔥 에러 시에는 빈 객체
                setClusterImages({});
            }
        };
        
        // clusters가 로드된 후에 이미지 로드
        if (clusters.length > 0) {
            loadClusterImages();
        }
    }, [clusters]);

    // 데이터 마이그레이션 (기존 localStorage 데이터 정리용)
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

    // 클러스터 이미지 자동 검색 (필요시에만)
    useEffect(() => {
        const fetchClusterImages = async () => {
        const newClusterImages = {} as Record<number, any>;
        for (let i = 0; i < clusters.length; i++) {
            // 기존 이미지가 없는 경우에만 새로 검색
            if (!clusterImages[i]) {
            newClusterImages[i] = await searchClusterImage(clusters[i]);
            }
        }
        if (Object.keys(newClusterImages).length > 0) {
            setClusterImages((prev: any) => ({ ...prev, ...newClusterImages }));
        }
        };
        if (clusters.length > 0) {
        fetchClusterImages();
        }
    }, [clusters, searchClusterImage]);
} 