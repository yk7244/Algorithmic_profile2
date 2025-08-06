import { ThumbnailData } from "../../types/profile";
import { saveThumbnail } from "../../utils/save/saveThumnail";

// YouTube 썸네일 URL 생성 함수
export function getYouTubeThumbnail(videoId: string) {
  return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
}

export function getThumbnailData(main_keyword: string) {
    const thumbnailData = localStorage.getItem('thumbnailData');
    return thumbnailData ? JSON.parse(thumbnailData).find((item: ThumbnailData) => item.main_keyword === main_keyword) : null;
}

// 클러스터에서 점수 높은 영상 1개까지 썸네일 저장
export function saveTopThumbnails(cluster: any) {
    const clusterKeywords = (cluster.main_keyword || "").toLowerCase().split(/\s+/);

    // 각 영상의 제목과 키워드 매칭 점수 계산
    const scoredVideos = (cluster.related_videos || [])
        .filter((video: any) => video.title && video.embedId)
        .map((video: any) => {
        const videoTitle = video.title.toLowerCase();
        let matches = 0;
        clusterKeywords.forEach((keyword: string) => {
            if (videoTitle.includes(keyword)) {
            matches++;
            }
        });
        return { video, matches };
        });

    // 점수 내림차순 정렬 후 상위 1개만 추출
    const topVideos = scoredVideos
        .sort((a: { matches: number }, b: { matches: number }) => b.matches - a.matches)
        .slice(0, 1)
        .map((item: { video: any; matches: number }) => item.video);

    // 썸네일 URL 배열 생성 (1개만 포함)
    const srcArray = topVideos.map((video: any) => getYouTubeThumbnail(video.embedId));

    // ThumbnailData 객체 생성
    const thumbnailData: ThumbnailData = {
        main_keyword: cluster.main_keyword,
        keyword: cluster.main_keyword, // keyword와 main_keyword를 동일하게 설정
        src: srcArray,
    };

    // 저장
    saveThumbnail(cluster.main_keyword, thumbnailData);
    console.log('저장된 썸네일 데이터:', thumbnailData);
    return thumbnailData;
}

// 키워드 매칭으로 가장 적합한 썸네일 찾기
export const findBestThumbnail = (cluster: any) => {
    
    const thumbnailData = saveTopThumbnails(cluster);
    console.log('정렬된 썸네일 데이터:', thumbnailData);
    return thumbnailData && thumbnailData.src && thumbnailData.src.length > 0
    ? thumbnailData.src[0]
    : '/images/default_image.png'; // 없으면 기본 이미지
};



