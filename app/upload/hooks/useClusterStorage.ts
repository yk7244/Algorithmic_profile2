import { useEffect } from 'react';

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
    // 시청기록, 클러스터 로드 (최초 마운트 시 1회만 실행)
    useEffect(() => {
        const savedHistory = JSON.parse(localStorage.getItem('watchHistory') || '[]');
        setWatchHistory(savedHistory);
        const savedClusters = JSON.parse(localStorage.getItem('watchClusters') || '[]');
        setClusters(savedClusters);
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


    // 저장된 이미지 로드 (clusters가 바뀔 때만 실행)
    useEffect(() => {
        const loadSavedImages = () => {
        const savedImages = JSON.parse(localStorage.getItem('clusterImages') || '{}');
        const newClusterImages = { ...clusterImages };
        clusters.forEach((cluster: any, index: number) => {
            if (savedImages[cluster.main_keyword]) {
            newClusterImages[index] = savedImages[cluster.main_keyword];
            }
        });
        setClusterImages(newClusterImages);
        };
        loadSavedImages();
    }, [clusters]);

    // 분석 기록 로드 (최초 마운트 시 1회만 실행)
    useEffect(() => {
        const savedAnalyses = JSON.parse(localStorage.getItem('analysisHistory') || '[]');
        setAnalysisHistory(savedAnalyses);
        // eslint-disable-next-line
    }, []);
} 