export function handleDownloadJSON(watchHistory: any[]) {
    // 키워드가 있는 항목만 필터링
    const filteredWatchHistory = watchHistory.filter(item => 
        item.keywords && item.keywords.length > 0
    );

    const data = {
        watchHistory: filteredWatchHistory,
        timestamp: new Date().toISOString(),
        totalVideos: filteredWatchHistory.length,
        totalKeywords: new Set(filteredWatchHistory.flatMap(item => item.keywords)).size,
        originalTotalVideos: watchHistory.length,
        filteredOutVideos: watchHistory.length - filteredWatchHistory.length
    };
    
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `youtube-watch-history-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    // 다운로드 완료 알림
    alert(`총 ${filteredWatchHistory.length}개의 영상 데이터가 다운로드되었습니다.\n(키워드 생성 실패로 ${watchHistory.length - filteredWatchHistory.length}개 제외)`);
    }

    export function handleDownloadClusterJSON(clusters: any[], dateRange: any, maxVideosPerDay: number) {
    if (!clusters || clusters.length === 0) {
        alert('분석된 클러스터 데이터가 없습니다.');
        return;
    }

    const data = {
        clusters,
        timestamp: new Date().toISOString(),
        totalClusters: clusters.length,
        totalVideos: clusters.reduce((sum, cluster) => sum + (cluster.related_videos?.length || 0), 0),
        metadata: {
        dateRange: dateRange,
        maxVideosPerDay: maxVideosPerDay
        }
    };
    
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `youtube-cluster-analysis-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    alert(`총 ${clusters.length}개의 클러스터 데이터가 다운로드되었습니다.`);
} 