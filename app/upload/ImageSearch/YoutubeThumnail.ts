// YouTube 썸네일 URL 생성 함수
export const getYouTubeThumbnail = (embedId: string) => {
if (!embedId) return '/images/default_image.png';
return `https://img.youtube.com/vi/${embedId}/mqdefault.jpg`;
};

// 키워드 매칭으로 가장 적합한 썸네일 찾기
export const findBestThumbnail = (cluster: any) => {
if (!cluster.related_videos || cluster.related_videos.length === 0) {
    return '/images/default_image.png';
}

// 클러스터 키워드들을 배열로 변환
const clusterKeywords = cluster.keyword_list
    ?.split(',')
    .map((k: string) => k.trim().toLowerCase().replace(/\s*\(\d+회?\)\s*/g, '')) // "(12회)" 같은 빈도 제거
    .filter(Boolean) || [];

if (clusterKeywords.length === 0) {
    // 키워드가 없으면 첫 번째 영상 사용
    return getYouTubeThumbnail(cluster.related_videos[0].embedId);
}

let bestVideo = cluster.related_videos[0];
let maxMatches = 0;

// 각 영상의 제목과 키워드 매칭 점수 계산
cluster.related_videos.forEach((video: any) => {
    if (!video.title) return;
    
    const videoTitle = video.title.toLowerCase();
    let matches = 0;
    
    clusterKeywords.forEach((keyword: string) => {
    if (videoTitle.includes(keyword)) {
        matches++;
    }
    });
    
    if (matches > maxMatches) {
    maxMatches = matches;
    bestVideo = video;
    }
});

console.log(`클러스터 "${cluster.keyword_list}" 최적 썸네일: ${bestVideo.title} (매칭: ${maxMatches}개)`);
return getYouTubeThumbnail(bestVideo.embedId);
};

// 고화질 썸네일 (maxresdefault) 시도 후 실패시 기본 화질로 fallback
export const getYouTubeThumbnailHQ = (embedId: string) => {
if (!embedId) return '/images/default_image.png';

// 고화질 먼저 시도
const hqUrl = `https://img.youtube.com/vi/${embedId}/maxresdefault.jpg`;
const defaultUrl = `https://img.youtube.com/vi/${embedId}/mqdefault.jpg`;

// 실제 사용시에는 이미지 로드 체크가 필요하지만, 일단 기본 화질 반환
return defaultUrl;
};

