"use client";
import OpenAI from "openai";
import { useState, useEffect, useRef, Dispatch, SetStateAction } from 'react';
import {DndContext} from '@dnd-kit/core';
import { restrictToWindowEdges } from '@dnd-kit/modifiers';
import { restrictToContainer } from './Draggable/Hooks/Drag/useDragConstraints';

//Refactoring
import DraggableImage from './Draggable/DraggableImage';
import ColorPaletteBoard from './CustomEdit/ColorPaletteBoard';
import { useBgColor } from './CustomEdit/hooks/useBgColor';
import HistorySlider from './HistorySlider/HistorySlider';
import GeneratingDialog from './GeneratingDialog/GeneratingDialog';
import { useHistorySlider } from './HistorySlider/Hooks/useHistorySlider';
import { colorOptions } from './CustomEdit/hooks/colorOptions';
import SearchModeUI from '../search/SearchMode/SearchModeUI';
import { useSearchMode } from '../search/SearchMode/Hooks/useSearchMode';
import ProfileHeader from './Nickname/ProfileHeader';
import SearchFloatingButton from '../search/SearchMode/SearchFloatingButton';
import BottomActionBar from './Edit/BottomActionBar';
import { useMoodboardHandlers } from './useMoodboardHandlers';
import { useImageDelete } from "./Draggable/Hooks/Image/useImageDelete";
import { useProfileStorage } from './Nickname/Hooks/useProfileStorage';
import { useProfileImagesLoad } from './HistorySlider/Hooks/useProfileImagesLoad';
import { useInitialProfileLoad } from './Nickname/Hooks/useInitialProfileLoad';
import { getCurrentUserId } from '@/lib/database';
import { 
  ImageData,
  HistoryData,
} from '../types/profile';

// OpenAI 클라이언트 초기화
const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
});

export default function MyProfilePage() {
  // --- 상태 선언 ---
  const [visibleImageIds, setVisibleImageIds] = useState<Set<string>>(new Set());
  const [profile, setProfile] = useState({ nickname: '', description: '' });
  const [showGeneratingDialog, setShowGeneratingDialog] = useState(false);
  const [generatingStep, setGeneratingStep] = useState(0);
  const { bgColor, handleBgColorChange } = useBgColor();
  const [images, setImages] = useState<ImageData[]>([]);
  const [positions, setPositions] = useState<Record<string, {x: number, y: number}>>({});
  const [frameStyles, setFrameStyles] = useState<Record<string, string>>({});
  const [isEditing, setIsEditing] = useState(false);
  const [histories, setHistories] = useState<HistoryData[]>([]);  
  const [currentHistoryIndex, setCurrentHistoryIndex] = useState<number>(-1);
  const placeholderImage = "../../../public/images/default_image.png"
  
  // [새로고침시] ProfileImages 로드 훅 사용
  const { reloadFromDB } = useProfileImagesLoad({
    setImages: setImages as Dispatch<SetStateAction<ImageData[]>>,
    setVisibleImageIds,
    setFrameStyles,
    setPositions,
    placeholderImage,
  });

  const historySlider = useHistorySlider({
    images: images as ImageData[],
    positions,
    frameStyles,
    setPositions,
    setFrameStyles,
    setVisibleImageIds,
    setImages,
    placeholderImage,
  });
  const {
    histories: sliderHistories,
    setHistories: setSliderHistories,
    currentHistoryIndex: sliderCurrentHistoryIndex,
    setCurrentHistoryIndex: setSliderCurrentHistoryIndex,
    isPlaying: sliderIsPlaying,
    setIsPlaying: setSliderIsPlaying,
    handleHistoryClick,
    handlePlayHistory,
    isTransitioning: sliderIsTransitioning,
  } = historySlider;

  const {
    handleFrameStyleChange,
    handleSave,
    handleDragEnd,
    handleImageChange,
    generateProfile,
  } = useMoodboardHandlers({
    setFrameStyles,
    positions,
    frameStyles,
    images,
    histories,
    setHistories,
    setCurrentHistoryIndex,
    setIsEditing,
    isEditing,
    setPositions,
    setImages,
    openai,
    setShowGeneratingDialog,
    setGeneratingStep,
    setProfile,
  });

  const {
    isSearchMode,
    selectedImage,
    selectedImages,
    handleImageSelect,
    toggleSearchMode,
    handleSearch,
    setSelectedImage,
    setSelectedImages,
    setIsSearchMode,
  } = useSearchMode(images as ImageData[]); 

  const handleImageDelete = useImageDelete({
    images,
    setImages: setImages as Dispatch<SetStateAction<ImageData[]>>,
    positions,
    frameStyles,
    histories,
    setHistories,
    setCurrentHistoryIndex,
    setVisibleImageIds,
  });

  // localStorage 프로필 관리 훅 사용
  const { loadProfileFromStorage, isProfileExpired } = useProfileStorage();

  // 🆕 DB-first 프로필 데이터 로딩
  useEffect(() => {
    const loadLatestProfile = async () => {
      try {
        const latestProfile = await loadProfileFromStorage();
        if (latestProfile) {
          setProfile({
            nickname: latestProfile.nickname,
            description: latestProfile.description
          });
          console.log('[MyProfile] 최신 프로필 로드 완료:', latestProfile);
        }
      } catch (error) {
        console.error('[MyProfile] 프로필 로드 실패:', error);
      }
    };

    loadLatestProfile();
  }, []); // 컴포넌트 마운트 시 1회 실행

  // 🆕 개발용: localStorage 강제 정리 함수 (콘솔에서 호출 가능)
  useEffect(() => {
    // @ts-ignore - 개발용 전역 함수
    window.clearAllTubeLensData = async () => {
      console.log('🧹 TubeLens 모든 데이터 정리 시작...');
      
      // localStorage 모든 관련 키 정리
      const allKeys = Object.keys(localStorage);
      const tubeLensKeys = allKeys.filter(key => 
        key.includes('profileImages') || 
        key.includes('moodboardHistories') || 
        key.includes('SliderHistory') || 
        key.includes('exploreWatchHistory') || 
        key.includes('watchHistory') || 
        key.includes('ProfileData') ||
        key.includes('moodboard-bg-color')
      );
      
      tubeLensKeys.forEach(key => {
        localStorage.removeItem(key);
        console.log(`삭제: ${key}`);
      });
      
      // 상태 초기화
      setImages([]);
      setVisibleImageIds(new Set());
      setFrameStyles({});
      setPositions({});
      setHistories([]);
      setCurrentHistoryIndex(-1);
      
      console.log('✅ TubeLens 모든 데이터 정리 완료!');
      console.log('새로고침하여 확인하세요.');
    };
    
    // 🆕 DB 상태 확인 함수 추가
    // @ts-ignore - 개발용 전역 함수
    window.checkDBStatus = async () => {
      try {
        const userId = await getCurrentUserId();
        console.log('🔍 DB 상태 확인:', {
          'userId': userId,
          'DB 연결 상태': '확인 중...'
        });

        if (!userId) {
          console.log('❌ 로그인되지 않음');
          return;
        }

        const { getClusterImages, getSliderHistory, getProfileData } = await import('@/lib/database');
        
        const clusterImages = await getClusterImages(userId);
        const sliderHistory = await getSliderHistory(userId);
        const profileData = await getProfileData(userId);

        // 🆕 SliderHistory 상세 분석
        const sliderAnalysis = sliderHistory?.map((item: any, index: number) => ({
          index,
          id: item.id,
          version_type: item.version_type,
          created_at: item.created_at,
          nickname: item.nickname,
          images_count: item.images?.length || 0,
          has_desired_self: item.images?.some((img: any) => img.desired_self === true),
          desired_self_count: item.images?.filter((img: any) => img.desired_self === true).length || 0
        })) || [];

        console.log('🔍 DB 상태 확인 결과:', {
          'userId': userId,
          'ClusterImages 개수': clusterImages?.length || 0,
          'SliderHistory 개수': sliderHistory?.length || 0,
          'ProfileData 존재': !!profileData,
          'SliderHistory 상세 분석': sliderAnalysis,
          '별모양 슬라이더 개수': sliderAnalysis.filter(s => s.has_desired_self).length,
          'ClusterImages 샘플': clusterImages?.slice(0, 2),
          'ProfileData': profileData
        });

      } catch (error) {
        console.error('❌ DB 상태 확인 실패:', error);
      }
    };

    // 🆕 슬라이더 히스토리 디버깅 함수
    // @ts-ignore - 개발용 전역 함수
    window.debugSliderHistory = async (historyIndex = -1) => {
      try {
        const userId = await getCurrentUserId();
        if (!userId) {
          console.log('❌ 로그인되지 않음');
          return;
        }

        console.log('🎚️ === 슬라이더 히스토리 디버깅 ===');
        
        // localStorage에서 히스토리 확인
        const localStorageKey = `SliderHistory_${userId}`;
        const localHistories = JSON.parse(localStorage.getItem(localStorageKey) || '[]');
        console.log(`📦 localStorage 히스토리 개수: ${localHistories.length}`);
        
        // DB에서 히스토리 확인
        const { getSliderHistory } = await import('@/lib/database');
        const dbHistories = await getSliderHistory(userId);
        console.log(`🗄️ DB 히스토리 개수: ${dbHistories?.length || 0}`);
        
        if (historyIndex === -1) {
          // 모든 히스토리 요약
          console.log('=== 모든 히스토리 요약 ===');
          localHistories.forEach((history: any, index: number) => {
            console.log(`[${index}] 타임스탬프: ${new Date(history.timestamp).toLocaleString()}`);
            console.log(`     이미지 개수: ${history.images?.length || 0}`);
            console.log(`     버전 타입: ${history.version_type || 'unknown'}`);
            console.log(`     별모양 이미지: ${history.images?.filter((img: any) => img.desired_self).length || 0}개`);
          });
        } else if (historyIndex >= 0 && historyIndex < localHistories.length) {
          // 특정 히스토리 상세
          const target = localHistories[historyIndex];
          console.log(`=== 히스토리 [${historyIndex}] 상세 ===`);
          console.log('타임스탬프:', new Date(target.timestamp).toLocaleString());
          console.log('버전 타입:', target.version_type);
          console.log('이미지 개수:', target.images?.length || 0);
          console.log('이미지 데이터:', target.images);
          console.log('포지션 개수:', Object.keys(target.positions || {}).length);
          console.log('프레임스타일 개수:', Object.keys(target.frameStyles || {}).length);
          
          // 이미지 상세 분석
          if (target.images && target.images.length > 0) {
            target.images.forEach((img: any, idx: number) => {
              console.log(`  이미지[${idx}]:`, {
                id: img.id,
                src: img.src?.substring(0, 50) + '...',
                desired_self: img.desired_self,
                position: img.position,
                frameStyle: img.frameStyle
              });
            });
          }
        }
        
        // 현재 상태와 비교
        console.log('=== 현재 상태 ===');
        console.log('현재 이미지 개수:', images.length);
        console.log('현재 visible 이미지 개수:', visibleImageIds.size);
        console.log('현재 positions 개수:', Object.keys(positions).length);
        console.log('현재 frameStyles 개수:', Object.keys(frameStyles).length);
        
      } catch (error) {
        console.error('❌ 슬라이더 히스토리 디버깅 실패:', error);
      }
    };
    
    // 🆕 MyPage 시청기록 디버깅 함수
    // @ts-ignore - 개발용 전역 함수
    window.debugMyPageWatchHistory = async () => {
      try {
        const userId = await getCurrentUserId();
        if (!userId) {
          console.log('❌ 로그인되지 않음');
          return;
        }

        console.log('📺 === MyPage 시청기록 디버깅 ===');
        
        // localStorage 확인
        const exploreKey = `exploreWatchHistory_${userId}`;
        const exploreHistory = JSON.parse(localStorage.getItem(exploreKey) || '[]');
        console.log(`📦 localStorage 탐색 시청기록: ${exploreHistory.length}개`);
        
        // DB 확인
        const { getExploreWatchHistory } = await import('@/lib/database');
        const dbHistory = await getExploreWatchHistory(userId);
        console.log(`🗄️ DB 탐색 시청기록: ${dbHistory?.length || 0}개`);
        
        if (exploreHistory.length > 0) {
          console.log('최근 localStorage 기록:', exploreHistory.slice(0, 3));
        }
        if (dbHistory && dbHistory.length > 0) {
          console.log('최근 DB 기록:', dbHistory.slice(0, 3));
        }
        
      } catch (error) {
        console.error('❌ MyPage 시청기록 디버깅 실패:', error);
      }
    };

    // 🆕 업로드 슬라이더 문제 임시 해결 스크립트
    // @ts-ignore - 개발용 전역 함수
    window.fixUploadSliderIssue = async () => {
      try {
        console.log('🔧 업로드 슬라이더 문제 해결 시도...');
        
        const userId = await getCurrentUserId();
        if (!userId) {
          console.log('❌ 로그인되지 않음');
          return;
        }

        const { getSliderHistory, updateClusterImages } = await import('@/lib/database');
        
        // 1. SliderHistory에서 최신 upload 타입 데이터 가져오기
        const sliderHistory = await getSliderHistory(userId, 'upload');
        console.log('🎚️ SliderHistory 조회 결과:', sliderHistory?.length || 0);
        
        if (!sliderHistory || sliderHistory.length === 0) {
          console.log('❌ SliderHistory에 upload 타입 데이터가 없음');
          return;
        }
        
        // 가장 최신 히스토리 사용
        const latestHistory = sliderHistory[0];
        console.log('📋 최신 히스토리 선택:', {
          'id': latestHistory.id,
          'created_at': latestHistory.created_at,
          'images 개수': latestHistory.images?.length || 0,
          'version_type': latestHistory.version_type
        });
        
        if (!latestHistory.images || latestHistory.images.length === 0) {
          console.log('❌ 최신 히스토리에 이미지 데이터가 없음');
          return;
        }
        
        // 🆕 데이터 구조 안전성 검사 및 변환
        console.log('🔍 원본 데이터 구조 확인:', {
          '첫 번째 이미지': latestHistory.images[0],
          'position 필드 존재': !!latestHistory.images[0]?.position,
          'left 필드 존재': !!latestHistory.images[0]?.left,
          'top 필드 존재': !!latestHistory.images[0]?.top
        });
        
        // 🆕 안전한 데이터 변환
        const safeImages = latestHistory.images.map((img: any, index: number) => {
          // position 필드가 없는 경우 기본값 생성
          let position = img.position;
          if (!position || typeof position.x === 'undefined' || typeof position.y === 'undefined') {
            // left, top에서 추출 시도
            if (img.left && img.top) {
              position = {
                x: Number(img.left.replace('px', '')) || 0,
                y: Number(img.top.replace('px', '')) || 0
              };
            } else {
              // 완전히 없으면 랜덤 중앙 위치 생성
              position = {
                x: 400 + (Math.random() - 0.5) * 200,
                y: 300 + (Math.random() - 0.5) * 200
              };
            }
            console.log(`🔧 이미지 [${index}] position 보정:`, position);
          }
          
          return {
            ...img,
            // 필수 필드들 보장
            id: img.id || `img_${index}_${Date.now()}`,
            user_id: img.user_id || userId,
            position: position,
            left: img.left || `${position.x}px`,
            top: img.top || `${position.y}px`,
            frameStyle: img.frameStyle || 'normal',
            sizeWeight: img.sizeWeight || 0.5,
            width: img.width || 300,
            height: img.height || 200,
            rotate: img.rotate || 0,
            created_at: img.created_at || new Date().toISOString()
          };
        });
        
        console.log('✅ 안전한 데이터 변환 완료:', {
          '원본 개수': latestHistory.images.length,
          '변환 후 개수': safeImages.length,
          '변환된 샘플': safeImages.slice(0, 2)
        });
        
        // 2. 히스토리 데이터를 현재 상태(ClusterImages)로 복사
        console.log('🔄 히스토리 데이터를 현재 상태로 복사 중...');
        const result = await updateClusterImages(userId, safeImages);
        console.log('✅ ClusterImages 업데이트 완료:', result?.length || 0);
        
        // 3. localStorage도 업데이트
        const storageKey = `profileImages_${userId}`;
        localStorage.setItem(storageKey, JSON.stringify(safeImages));
        console.log('✅ localStorage 업데이트 완료');
        
        // 4. 새로고침 권장
        console.log('🔄 페이지를 새로고침하여 변경사항을 확인하세요.');
        if (confirm('업로드 슬라이더 문제 해결 완료!\n페이지를 새로고침하시겠습니까?')) {
          window.location.reload();
        }
        
      } catch (error) {
        console.error('❌ 업로드 슬라이더 문제 해결 실패:', error);
      }
    };

    // 🆕 Videos 캐시 관리 도구들
    // @ts-ignore - 개발용 전역 함수
    window.checkVideosCache = async () => {
      try {
        console.log('📹 === Videos 캐시 상태 확인 ===');
        
        const { getCacheStats } = await import('@/lib/database');
        const stats = await getCacheStats();
        
        console.log('📊 캐시 통계:', {
          '총 캐시된 영상': stats.total,
          '유효한 캐시': stats.recent,
          '만료된 캐시': stats.expired,
          '유효율': `${stats.total > 0 ? ((stats.recent / stats.total) * 100).toFixed(1) : 0}%`
        });
        
        return stats;
      } catch (error) {
        console.error('❌ Videos 캐시 상태 확인 실패:', error);
      }
    };

    // @ts-ignore - 개발용 전역 함수
    window.cleanVideosCache = async (maxAgeInDays = 30) => {
      try {
        console.log(`🧹 ${maxAgeInDays}일 이상 된 Videos 캐시 정리 중...`);
        
        const { cleanExpiredCache } = await import('@/lib/database');
        const deletedCount = await cleanExpiredCache(maxAgeInDays);
        
        console.log(`✅ ${deletedCount}개의 만료된 캐시 삭제 완료`);
        return deletedCount;
      } catch (error) {
        console.error('❌ Videos 캐시 정리 실패:', error);
      }
    };

    // @ts-ignore - 개발용 전역 함수
    window.prefetchRelatedVideos = async () => {
      try {
        console.log('🎬 현재 프로필의 관련 영상들 사전 캐싱 시작...');
        
        // 현재 이미지들의 관련 영상 ID 수집
        const allVideoIds: string[] = [];
        images.forEach(img => {
          if (img.relatedVideos && Array.isArray(img.relatedVideos)) {
            img.relatedVideos.forEach((video: any) => {
              if (video.embedId) {
                allVideoIds.push(video.embedId);
              }
            });
          }
        });

        if (allVideoIds.length === 0) {
          console.log('⚠️ 사전 캐싱할 관련 영상이 없습니다');
          return;
        }

        const uniqueVideoIds = [...new Set(allVideoIds)];
        console.log(`🔍 총 ${uniqueVideoIds.length}개의 고유 영상 ID 발견`);

        const { prefetchVideos } = await import('@/lib/database');
        const result = await prefetchVideos(uniqueVideoIds);
        
        console.log('✅ 사전 캐싱 완료:', {
          '성공': result.success.length,
          '실패': result.failed.length,
          '총 처리': uniqueVideoIds.length
        });
        
        return result;
      } catch (error) {
        console.error('❌ 관련 영상 사전 캐싱 실패:', error);
      }
    };

    // @ts-ignore - 개발용 전역 함수
    window.testVideoCache = async (videoId = 'dQw4w9WgXcQ') => {
      try {
        console.log(`🧪 비디오 캐시 테스트 시작: ${videoId}`);
        
        const { getCachedVideo, isCacheExpired } = await import('@/lib/database');
        
        // 캐시 확인
        const cached = await getCachedVideo(videoId);
        if (cached) {
          const isExpired = isCacheExpired(cached.last_fetched_at);
          console.log('📄 캐시 상태:', {
            '캐시 존재': true,
            '제목': cached.title,
            '캐시 일시': new Date(cached.last_fetched_at).toLocaleString(),
            '만료 여부': isExpired
          });
        } else {
          console.log('📄 캐시 상태: 캐시 없음');
        }
        
        // fetchVideoInfo로 테스트 (캐시 로직 포함)
        const { fetchVideoInfo } = await import('@/app/upload/VideoAnalysis/videoKeyword');
        const startTime = Date.now();
        const result = await fetchVideoInfo(videoId);
        const endTime = Date.now();
        
        console.log('⏱️ 성능 테스트:', {
          '처리 시간': `${endTime - startTime}ms`,
          '결과': result ? '성공' : '실패',
          '제목': result?.title
        });
        
        return result;
      } catch (error) {
        console.error('❌ 비디오 캐시 테스트 실패:', error);
      }
    };
    
    console.log('💡 개발용 함수들이 등록되었습니다:');
    console.log('   - window.clearAllTubeLensData() : 모든 데이터 정리');
    console.log('   - window.checkDBStatus() : DB 상태 확인');
    console.log('   - window.debugSliderHistory(index) : 슬라이더 히스토리 디버깅');
    console.log('   - window.debugMyPageWatchHistory() : MyPage 시청기록 디버깅');
    console.log('   - window.fixUploadSliderIssue() : 업로드 슬라이더 문제 해결');
    console.log('   🆕 Videos 캐시 관리:');
    console.log('   - window.checkVideosCache() : Videos 캐시 상태 확인');
    console.log('   - window.cleanVideosCache(maxDays) : 만료된 캐시 정리');
    console.log('   - window.prefetchRelatedVideos() : 관련 영상 사전 캐싱');
    console.log('   - window.testVideoCache(videoId) : 캐시 시스템 테스트');
  }, []);

  //새로고침시 별명 생성/로드 훅 사용
  useInitialProfileLoad({
    loadProfileFromStorage,
    isProfileExpired,
    generateProfile,
    setProfile,
  });

  // 🆕 frameStyles 상태 디버깅
  useEffect(() => {
    console.log('[MyProfile] frameStyles 상태 변경:', frameStyles);
  }, [frameStyles]);

  // 🆕 positions 동기화 최적화 - 중복 업데이트 방지
  useEffect(() => {
    if (images.length === 0) return; // 이미지가 없으면 스킵
    
    setPositions(prevPositions => {
      const newPositions = { ...prevPositions };
      let hasChanges = false;
      const imageIdSet = new Set(images.map(img => img.id).filter(id => id)); // undefined 제거

      // images 배열에 있는 각 이미지에 대해
      images.forEach(image => {
        // id가 없으면 건너뛰기
        if (!image.id) return;
        
        // positions에 해당 이미지가 없으면 초기 위치 설정
        if (!newPositions[image.id]) {
          newPositions[image.id] = {
            x: Number(image.left?.replace('px', '') || 0),
            y: Number(image.top?.replace('px', '') || 0),
          };
          hasChanges = true;
        }
      });

      // positions에 있지만 현재 images 배열에는 없는 이미지 정보 삭제
      for (const id in newPositions) {
        if (!imageIdSet.has(id)) {
          delete newPositions[id];
          hasChanges = true;
        }
      }
      
      // 변경사항이 있을 때만 새 객체 반환
      return hasChanges ? newPositions : prevPositions;
    });
  }, [images]); // images가 변경될 때만 실행

  return (
    <main className={`fixed inset-0 overflow-y-auto transition-colors duration-500 ${bgColor}`}>
      {/* 생성 중 다이얼로그 -> GeneratingDialog.tsx 
      <GeneratingDialog
        open={showGeneratingDialog}
        onOpenChange={setShowGeneratingDialog}
        generatingStep={generatingStep}
      />
      */}

      {/* 검색 모드 UI -> SearchModeUI.tsx */}
      <SearchModeUI
        isSearchMode={isSearchMode}
        selectedImage={selectedImage}
        selectedImages={selectedImages}
        handleSearch={handleSearch}
        toggleSearchMode={toggleSearchMode}
        setIsSearchMode={setIsSearchMode}
      />

      {/* My_profile 페이지 레이아웃 */}
      <div className="relative z-20 w-full">
        <div className="max-w-[1200px] mx-auto ">

          {/* 닉넴/설명/버튼 헤더 분리 -> ProfileHeader.tsx */}
          {!isSearchMode && (
            <ProfileHeader
              profile={profile}
              isEditing={isEditing}
              isGeneratingProfile={showGeneratingDialog}
              onEditClick={() => setIsEditing(true)}
              onSaveClick={handleSave}
              onGenerateProfile={generateProfile}
            />
          )}

          {/* DraggableImage 컴포넌트 렌더링 -> DraggableImage.tsx */}
          <div className="relative w-[1000px] h-[680px] mx-auto mt-8">
            <DndContext onDragEnd={handleDragEnd} modifiers={[restrictToContainer]}>
              {images.map((image) => {
                // 🆕 DB에서 로드한 frameStyle을 우선적으로 사용
                const currentFrameStyle = image.desired_self 
                  ? 'cokie' 
                  : (image.frameStyle || frameStyles[image.id] || 'normal');
                
                console.log(`[MyProfile] 이미지 ${image.id} frameStyle 전달:`, {
                  'image.frameStyle': image.frameStyle,
                  'frameStyles[image.id]': frameStyles[image.id],
                  'currentFrameStyle': currentFrameStyle
                });
                
                return (
                <div
                  key={image.id || Math.random().toString()}
                  className={`transition-all duration-500 ${
                    isEditing || (image.id && visibleImageIds.has(image.id))
                      ? 'opacity-100 scale-100'
                      : 'opacity-0 scale-95 pointer-events-none'
                  }`}
                >
                  <DraggableImage
                    image={image}
                    position={positions[image.id] || image.position}
                    isEditing={isEditing && !isSearchMode}
                    frameStyle={currentFrameStyle}
                    onFrameStyleChange={handleFrameStyleChange}
                    onImageChange={handleImageChange}
                    onImageSelect={handleImageSelect}
                    isSelected={selectedImages.some(img => img.id === image.id)}
                    isSearchMode={isSearchMode}
                    onImageDelete={handleImageDelete}
                    isTransitioning={sliderIsTransitioning}
                  />
                </div>
                )
              })}
            </DndContext>
          </div>

          {/* 플로팅 검색 버튼 분리 */}
          {!isEditing && !isSearchMode &&(
            <SearchFloatingButton
            isSearchMode={isSearchMode}
            toggleSearchMode={toggleSearchMode}
          />
          )}
          

          {/* 히스토리 슬라이더 (검색 모드가 아닐 때만 표시)->HistorySlider.tsx */}
          {!isEditing && !isSearchMode && (
            <HistorySlider
              histories={sliderHistories}
              currentHistoryIndex={sliderCurrentHistoryIndex}
              isPlaying={sliderIsPlaying}
              handlePlayHistory={handlePlayHistory}
              handleHistoryClick={handleHistoryClick}
              handleProfileImagesClick={async () => {
                // 🆕 파란 점 클릭 시 DB에서 최신 상태 로드
                console.log('🔵 현재 꾸민 상태로 돌아가기 - DB에서 최신 데이터 로드');
                try {
                  await reloadFromDB();
                  console.log('✅ DB에서 최신 상태 로드 완료');
                } catch (error) {
                  console.error('❌ DB 로드 실패:', error);
                  // 실패 시 새로고침으로 fallback
                  window.location.reload();
                }
              }}
              isTransitioning={sliderIsTransitioning}
            />
          )}
        </div>
      </div>

      {/* 컬러 팔레트 보드 (편집 모드일 때만 표시)->ColorPaletteBoard.tsx */}
      {isEditing && !isSearchMode && (
        <ColorPaletteBoard
          colorOptions={colorOptions}
          bgColor={bgColor}
          onChange={handleBgColorChange}
        />
      )}

      {/* 하단 액션 버튼들 - 검색 모드가 아닐 때만 표시 */}
      {!isSearchMode && (
      <BottomActionBar
        isEditing={isEditing}
          isGeneratingProfile={showGeneratingDialog}
        onEditClick={() => setIsEditing(true)}
        onSaveClick={handleSave}
          onGenerateProfile={generateProfile}
          sliderCurrentHistoryIndex={sliderCurrentHistoryIndex}
      />
      )}

    </main>
  );
} 