import { useEffect } from "react";
import type { VideoData } from "../../../../types/profile"; 

/**
 * useYouTubePlayer
 * - DraggableImage 등에서 유튜브 관련 영상 시청 상태를 관리하는 커스텀 훅
 * - YouTube IFrame API를 동적으로 로드하고, 각 영상별로 플레이어를 초기화하여 시청 완료(끝까지 본 영상)를 추적합니다.
 * - 영상이 끝까지 재생되면 setWatchedVideos를 통해 시청 완료 목록에 추가합니다.
 *
 * @param image 현재 클러스터/이미지 객체 (관련 영상 목록 포함)
 * @param setWatchedVideos 시청 완료된 영상 embedId를 관리하는 setState 함수
 */

export function useYouTubePlayer(
    image: any,
    setWatchedVideos: (cb: (prev: string[]) => string[]) => void
    ) {
    useEffect(() => {
        // 1. YouTube IFrame API를 동적으로 로드하는 함수
        const loadYouTubeAPI = () => {
        // window.YT가 없으면(아직 로드 안 됨) 스크립트 태그를 추가
        if (!window.YT) {
            const tag = document.createElement('script');
            tag.src = 'https://www.youtube.com/iframe_api';
            const firstScriptTag = document.getElementsByTagName('script')[0];
            firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

            // API가 준비되면 resolve
            return new Promise<void>((resolve) => {
            window.onYouTubeIframeAPIReady = () => {
                resolve();
            };
            });
        }
        // 이미 로드되어 있으면 바로 resolve
        return Promise.resolve();
        };

        // 2. 각 관련 영상에 대해 YouTube Player를 초기화하는 함수
        const initializePlayers = () => {
        // image.relatedVideos가 배열이면 각 영상에 대해 Player 생성
        if (image.relatedVideos && Array.isArray(image.relatedVideos)) {
            image.relatedVideos.forEach((video: VideoData) => {
            if (!video.embedId) return; // embedId가 없으면 건너뜀
            try {
                // YouTube Player 객체 생성 (id는 player-embedId)
                const player = new window.YT.Player(`player-${video.embedId}`, {
                events: {
                    // 영상 상태 변화 이벤트
                    onStateChange: (event: any) => {
                    // 영상이 끝까지 재생된 경우 (상태 코드 0)
                    if (event.data === 0) {
                        setWatchedVideos(prev => {
                        if (prev.includes(video.embedId)) return prev;
                        return [...prev, video.embedId];
                        });
                    }
                    }
                }
                });
            } catch (error) {
                // Player 생성 실패 시 무시 (이미 생성된 경우 등)
            }
            });
        }
        };

        // 3. API 로드 후 플레이어 초기화
        loadYouTubeAPI().then(() => {
        if (window.YT && window.YT.Player) {
            // API가 이미 준비된 경우 바로 초기화
            initializePlayers();
        } else {
            // 아직 준비 안 됐으면 0.1초마다 체크, 준비되면 초기화
            const checkYT = setInterval(() => {
            if (window.YT && window.YT.Player) {
                clearInterval(checkYT);
                initializePlayers();
            }
            }, 100);
            // 5초 후 강제 중단 (API 로드 실패 방지)
            setTimeout(() => clearInterval(checkYT), 5000);
        }
        });

        // 언마운트 시 정리 (현재는 별도 정리 필요 없음)
        return () => {};
    }, [image, setWatchedVideos]);
} 