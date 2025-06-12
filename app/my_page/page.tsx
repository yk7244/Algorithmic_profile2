'use client'; // 클라이언트 사이드 인터랙션이 필요하면 사용합니다.

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { CheckCircle2 } from 'lucide-react';
import { WatchHistory } from '../types/profile';
import { 
  getProfileData, 
  getClusterImages, 
  getWatchHistory, 
  getCurrentUserId, 
  ensureUserExists,
  saveProfileData,
  getExploreWatchHistory
} from '@/lib/database';
// 페이지 컴포넌트에 전달될 props가 있다면 여기에 타입을 정의할 수 있습니다.
// interface PageProps {
//   // 예: params: { slug: string };
//   // 예: searchParams: { [key: string]: string | string[] | undefined };
// }

interface ProfileData {
  id: string;
  nickname: string;
  description: string;
  created_at: string;
  updated_at: string;
}

interface ProfileImage {
  url: string;
  strength: number;
  [key: string]: any;
}

// 실제 페이지 이름으로 함수 이름을 변경하세요. (예: UpdatePage, SearchMapPage)
export default function MyPage() {
  const { logout } = useAuth();
  const [isProfilePublic, setIsProfilePublic] = useState(true);
  const [activeTab, setActiveTab] = useState<'profile' | 'history'>('profile');
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [profileImages, setProfileImages] = useState<ProfileImage[]>([]);
  const [profileImageUrl, setProfileImageUrl] = useState<string>('images/default.png');
  const [watchHistory, setWatchHistory] = useState<WatchHistory[]>([]);
  const [isSavingPublicSetting, setIsSavingPublicSetting] = useState(false);
  // 🆕 프로필 사진 변경 관련 상태
  const [showImageSelectModal, setShowImageSelectModal] = useState(false);
  const [isChangingProfileImage, setIsChangingProfileImage] = useState(false);

  useEffect(() => {
    const loadProfileData = async () => {
      try {
        const userId = await getCurrentUserId();
        if (!userId) {
          console.log('로그인되지 않음, 빈 상태로 초기화');
          // 🔥 로그인되지 않으면 데이터 초기화
          setProfile(null);
          setProfileImages([]);
          setProfileImageUrl('images/default.png');
          return;
        }

        // DB에서 프로필 데이터 로드
        const profileData = await getProfileData(userId);
        if (profileData) {
          setProfile({
            id: profileData.id || profileData.user_id,
            nickname: profileData.nickname,
            description: profileData.description,
            created_at: profileData.created_at,
            updated_at: profileData.updated_at
          });
          // 🆕 프로필 공개 설정 로드
          setIsProfilePublic(profileData.open_to_connect ?? true);
          console.log('[MyPage] DB에서 프로필 로드 완료');
        } else {
          console.log('[MyPage] DB에 프로필 없음, localStorage 확인');
          loadProfileFromLocalStorage(userId);
        }

        // DB에서 클러스터 이미지 로드
        const clusterImages = await getClusterImages(userId);
        if (clusterImages && clusterImages.length > 0) {
          // DB 데이터를 ProfileImage 형식으로 변환
          const formattedImages = clusterImages.map((item: any) => ({
            url: item.src,
            strength: item.size_weight || 1,
            main_keyword: item.main_keyword,
            id: item.id
          }));
          
          setProfileImages(formattedImages);
          
          // strength가 가장 큰 이미지 찾기
          const maxImg = formattedImages.reduce((prev, curr) =>
            curr.strength > prev.strength ? curr : prev
          );
          setProfileImageUrl(maxImg.url || 'images/default.png');
          
          console.log('[MyPage] DB에서 클러스터 이미지 로드 완료');
        } else {
          console.log('[MyPage] DB에 클러스터 이미지 없음, 사용자별 localStorage 확인');
          loadImagesFromLocalStorage(userId);
        }

      } catch (error) {
        console.error('[MyPage] DB 로드 실패, 빈 상태로 초기화:', error);
        // 🔥 에러 시에도 빈 상태로 초기화
        setProfile(null);
        setProfileImages([]);
        setProfileImageUrl('images/default.png');
      }
    };

    const loadProfileFromLocalStorage = (userId?: string) => {
      if (typeof window !== 'undefined' && userId) {
        const raw = localStorage.getItem(`ProfileData_${userId}`);
        if (raw) {
          try {
            const parsed = JSON.parse(raw);
            setProfile(parsed);
          } catch {
            setProfile(null);
          }
        }
      }
    };

    const loadImagesFromLocalStorage = (userId?: string) => {
      if (typeof window !== 'undefined' && userId) {
        const imgRaw = localStorage.getItem(`profileImages_${userId}`);
        if (imgRaw) {
          try {
            const parsedImgs = JSON.parse(imgRaw);
            if (Array.isArray(parsedImgs) && parsedImgs.length > 0) {
              setProfileImages(parsedImgs);
              // strength가 가장 큰 이미지 찾기
              const maxImg = parsedImgs.reduce((prev, curr) =>
                curr.strength > prev.strength ? curr : prev
              );
              if (maxImg.url) setProfileImageUrl(maxImg.url);
              else setProfileImageUrl('images/default.png');
            } else {
              setProfileImageUrl('images/default.png');
            }
          } catch {
            setProfileImageUrl('images/default.png');
          }
        } else {
          setProfileImageUrl('images/default.png');
        }
      }
    };

    loadProfileData();
  }, []);

  // 🆕 기존 전역 localStorage 키 정리 함수
  const cleanupOldWatchHistoryKeys = () => {
    const keysToRemove = ['watchHistory', 'watchHistory_guest'];
    keysToRemove.forEach(key => {
      if (localStorage.getItem(key)) {
        console.log(`[MyPage] 기존키 삭제: ${key}`);
        localStorage.removeItem(key);
      }
    });
  };

  // 🆕 localStorage 디버깅 함수
  const debugLocalStorageWatchHistory = () => {
    console.log('🔍 [MyPage] localStorage 디버깅:');
    
    // 모든 localStorage 키 검사
    const allKeys = Object.keys(localStorage);
    const watchHistoryKeys = allKeys.filter(key => key.includes('watchHistory') || key.includes('exploreWatch'));
    
    console.log('관련 키들:', watchHistoryKeys);
    
    watchHistoryKeys.forEach(key => {
      try {
        const data = JSON.parse(localStorage.getItem(key) || '[]');
        console.log(`${key}: ${Array.isArray(data) ? data.length : 'not array'}개 항목`);
        if (Array.isArray(data) && data.length > 0) {
          console.log(`${key} 샘플:`, data.slice(0, 2));
        }
      } catch (e) {
        console.log(`${key}: 파싱 오류`);
      }
    });
  };

  // 🆕 사용자별 localStorage에서 시청기록 로드하는 fallback 함수
  const loadWatchHistoryFromLocalStorage = async (userId: string) => {
    try {
      const cacheKey = `watchHistory_${userId}`;
      const savedHistory = localStorage.getItem(cacheKey);
      
      if (savedHistory) {
        const parsedHistory = JSON.parse(savedHistory);
        if (Array.isArray(parsedHistory) && parsedHistory.length > 0) {
          setWatchHistory(parsedHistory);
          console.log('[MyPage] 사용자별 localStorage에서 시청기록 로드 완료:', parsedHistory.length);
        } else {
          setWatchHistory([]);
        }
      } else {
        console.log('[MyPage] 사용자별 localStorage에 시청기록 없음');
        setWatchHistory([]);
      }
    } catch (fallbackError) {
      console.error('[MyPage] localStorage 시청기록 로드 실패:', fallbackError);
      setWatchHistory([]);
    }
  };

  useEffect(() => {
    const loadWatchHistory = async () => {
      try {
        // 🆕 기존 전역 localStorage 키 정리
        cleanupOldWatchHistoryKeys();
        
        // 🆕 localStorage 디버깅
        debugLocalStorageWatchHistory();
        
        const userId = await getCurrentUserId();
        if (!userId) {
          console.log('[MyPage] 로그인되지 않음, 빈 시청 기록으로 초기화');
          setWatchHistory([]);
          return;
        }

        // 🆕 DB-first: 통합된 WatchHistory에서 모든 시청기록 가져오기
        try {
          const dbWatchHistory = await getWatchHistory(userId, 50); // 전체 시청기록 50개
          const exploreWatchHistory = await getExploreWatchHistory(userId, 50); // 🆕 탐색 시청기록 50개

          // 🆕 디버깅용 로깅 추가
          console.log('🔍 [MyPage] DB 시청기록 로드 결과:', {
            'userId': userId,
            'Upload DB에서 가져온 개수': dbWatchHistory?.length || 0,
            'Explore DB에서 가져온 개수': exploreWatchHistory?.length || 0,
            'DB 데이터 샘플': dbWatchHistory?.slice(0, 3) || [],
            'Explore 데이터 샘플': exploreWatchHistory?.slice(0, 3) || [],
            'source 분포': dbWatchHistory?.reduce((acc: any, item: any) => {
              acc[item.source || 'unknown'] = (acc[item.source || 'unknown'] || 0) + 1;
              return acc;
            }, {}) || {}
          });

          let allHistory: any[] = [];

          // watch_history 데이터 변환
          if (dbWatchHistory && dbWatchHistory.length > 0) {
            const formattedHistory = dbWatchHistory.map((item: any) => ({
              id: item.id,
              user_id: item.user_id,
              videoId: item.video_id,
              title: item.title,
              description: item.description,
              source: item.source || 'upload',
              timestamp: item.timestamp
            }));
            allHistory = [...allHistory, ...formattedHistory];
          }

          // 🆕 explore_watch_history 데이터 변환
          if (exploreWatchHistory && exploreWatchHistory.length > 0) {
            const exploreFormatted = exploreWatchHistory.map((item: any) => ({
              id: item.id,
              user_id: item.user_id,
              videoId: item.video_id,
              title: item.title,
              description: item.description,
              source: 'explore', // explore_watch_history는 항상 explore
              timestamp: item.timestamp
            }));
            allHistory = [...allHistory, ...exploreFormatted];
          }

          if (allHistory.length > 0) {
            // 시간순 정렬 (최신순)
            allHistory.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

            // 중복 제거 (같은 videoId)
            const uniqueHistory = allHistory.filter((item, index, self) => 
              index === self.findIndex((t) => t.videoId === item.videoId)
            );

            // 🆕 디버깅용 로깅 추가
            console.log('🔍 [MyPage] 시청기록 처리 결과:', {
              '전체 통합 개수': allHistory.length,
              '중복 제거 후 개수': uniqueHistory.length,
              '중복 제거된 항목들': allHistory.filter((item, index, self) => 
                index !== self.findIndex((t) => t.videoId === item.videoId)
              ).map(item => item.title),
              'source별 개수': uniqueHistory.reduce((acc: any, item: any) => {
                acc[item.source || 'unknown'] = (acc[item.source || 'unknown'] || 0) + 1;
                return acc;
              }, {}),
              '최종 시청기록 첫 5개': uniqueHistory.slice(0, 5).map(item => ({
                title: item.title,
                source: item.source,
                timestamp: item.timestamp
              }))
            });

            setWatchHistory(uniqueHistory);
            console.log('[MyPage] DB에서 통합 시청 기록 로드 완료:', uniqueHistory.length);
            console.log(`- Upload 기록: ${dbWatchHistory?.length || 0}개`);
            console.log(`- Explore 기록: ${exploreWatchHistory?.length || 0}개`);

            // 🆕 사용자별 localStorage에 캐시 저장
            const cacheKey = `watchHistory_${userId}`;
            localStorage.setItem(cacheKey, JSON.stringify(uniqueHistory));
            console.log('[MyPage] 시청기록 localStorage 캐시 저장 완료');

          } else {
            console.log('[MyPage] DB에 시청기록 없음, localStorage fallback');
            await loadWatchHistoryFromLocalStorage(userId);
          }

        } catch (dbError) {
          console.error('[MyPage] DB 시청기록 로드 실패, localStorage fallback:', dbError);
          await loadWatchHistoryFromLocalStorage(userId);
        }

      } catch (error) {
        console.error('[MyPage] 시청 기록 로드 전체 실패:', error);
        setWatchHistory([]);
      }
    };

    loadWatchHistory();
  }, []);

  // 기본값
  const nickname = profile?.nickname || '닉네임';
  const description = profile?.description || '설명';

  // 업데이트 가능 여부 계산
  const canUpdate = !profile?.updated_at
    ? true
    : (Date.now() - new Date(profile.updated_at).getTime()) > 7 * 24 * 60 * 60 * 1000;

  // 🆕 프로필 공개 설정 토글 함수
  const handleProfilePublicToggle = async () => {
    if (isSavingPublicSetting) return; // 이미 저장 중이면 중복 실행 방지
    
    const newPublicState = !isProfilePublic;
    setIsProfilePublic(newPublicState);
    setIsSavingPublicSetting(true);
    
    try {
      const userId = await getCurrentUserId();
      if (userId && profile) {
        await saveProfileData(userId, {
          nickname: profile.nickname,
          description: profile.description,
          open_to_connect: newPublicState
        });
        console.log('[MyPage] 프로필 공개 설정 저장 완료:', newPublicState);
      }
    } catch (error) {
      console.error('[MyPage] 프로필 공개 설정 저장 실패:', error);
      // 에러 시 상태 되돌리기
      setIsProfilePublic(!newPublicState);
    } finally {
      setIsSavingPublicSetting(false);
    }
  };

  return (
    <div className="min-h-screen h-screen bg-gray-50 flex flex-row overflow-hidden">
      {/* 왼쪽 메뉴탭 */}
      <aside className="w-120 min-w-[300px] flex flex-col justify-between pl-10 pt-10">
        <nav className="w-full space-y-2 pt-20 px-8 flex flex-col">
          <button
            className={`text-lg text-left w-full px-4 py-2 font-bold rounded-lg transition-colors ${activeTab === 'profile' ? 'text-gray-900 bg-gray-100' : 'text-gray-400 hover:text-gray-900 hover:bg-gray-50'}`}
            onClick={() => setActiveTab('profile')}
          >
            내 프로필 설정
          </button>
          <button
            className={`text-lg text-left w-full px-4 py-2 font-bold rounded-lg transition-colors ${activeTab === 'history' ? 'text-gray-900 bg-gray-100' : 'text-gray-400 hover:text-gray-900 hover:bg-gray-50'}`}
            onClick={() => setActiveTab('history')}
          >
            시청기록
          </button>
        </nav>
        <div className="w-full px-8 pb-20 mb-10">
          <button
            onClick={logout}
            className="w-full text-lg font-medium rounded-lg px-4 py-3 bg-gray-900 text-white hover:bg-gray-800 transition-colors rounded-[10px]"
          >
            로그아웃
          </button>
        </div>
      </aside>

      {/* 오른쪽 내용 */}
      <main className="flex-1 flex flex-col items-start justify-start w-full box-border pt-20 pr-10 pl-10 mt-10 overflow-hidden">
        {activeTab === 'profile' && (
          <div className="w-full max-w-none bg-white rounded-2xl shadow-sm border border-gray-200 p-10 flex">
            {/* 프로필 사진 */}
            <div className="flex-shrink-0 flex flex-col items-center justify-center mr-12">
              <img
                src={profileImageUrl}
                alt="프로필 사진"
                className="w-48 h-48 rounded-full object-cover"
              />
            </div>
            {/* 프로필 정보 - 2단 pill 라벨 그리드 */}
            <div className="flex-1 flex flex-col justify-center">
              <div className="grid grid-cols-[70px_1fr] gap-y-4 gap-x-6 items-center">
                <span className="text-gray-400 text-sm ">닉네임</span>
                <span className="font-bold text-lg text-gray-900">{nickname}</span>
                <span className="text-gray-400 text-sm">취향 설명</span>
                <span className="text-gray-500 text-base leading-relaxed">{description}</span>
              </div>
              <div className="flex items-center mt-8 mb-2">
                <span className="text-sm text-gray-500">내 프로필 공개</span>
                <button
                  onClick={handleProfilePublicToggle}
                  disabled={isSavingPublicSetting}
                  className={`ml-4 relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    isProfilePublic ? 'bg-blue-500' : 'bg-gray-300'
                  } ${isSavingPublicSetting ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      isProfilePublic ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
                {isSavingPublicSetting && (
                  <span className="ml-2 text-xs text-gray-400">저장 중...</span>
                )}
              </div>
              {/* 프로필 업데이트 안내/버튼 */}
              <div className="flex flex-col items-end mt-6">
                {canUpdate ? (
                  <div className="mb-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg text-xs font-medium">
                    프로필을 업데이트할 수 있습니다!
                  </div>
                ) : (
                  <div className="mb-2 px-4 py-2 bg-gray-100 text-gray-400 rounded-lg text-xs font-medium">
                    프로필은 7일마다 한 번만 수정할 수 있습니다.
                  </div>
                )}
                <Link href={canUpdate ? '/upload' : '#'} tabIndex={canUpdate ? 0 : -1}>
                  <button
                    disabled={!canUpdate}
                    className={`rounded-full px-6 py-1.5 font-semibold shadow text-sm transition
                      ${canUpdate
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      }`}
                    style={{ minWidth: 120 }}
                  >
                    {canUpdate ? '프로필 업데이트 하기' : '아직 업데이트 불가'}
                  </button>
                </Link>
              </div>
            </div>
          </div>
        )}
        {activeTab === 'history' && (
          <div className="w-full max-w-none bg-white rounded-2xl shadow-sm border border-gray-200 p-0 flex flex-col items-center justify-start min-h-[400px] relative">
            <div className="w-full max-w-3xl mx-auto px-4 py-8">
              <h1 className="text-2xl font-bold mb-6 text-gray-900">시청 기록</h1>
              <div className="overflow-y-auto" style={{ maxHeight: '70vh' }}>
                <div className="grid gap-4">
                  {watchHistory.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10">
                      <p className="text-gray-400 text-base">아직 시청 기록이 없습니다.</p>
                    </div>
                  ) : (
                    watchHistory.map((video, idx) => (
                      <div key={idx} className="space-y-2 flex flex-col">
                        <h5 className="text-base font-semibold text-gray-900 mb-1 truncate">{video.title}</h5>
                        <div className="relative h-[300px] w-[600px] bg-gray-200 rounded-lg overflow-hidden">
                          <iframe
                            className="absolute inset-0 w-full h-full"
                            src={`https://www.youtube.com/embed/${video.videoId}`}
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            title={video.title}
                          />
                        </div>
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center gap-2 text-green-500">
                            <CheckCircle2 className="h-4 w-4" />
                            <span className="text-xs font-medium">시청함</span>
                          </div>
                          <span className="text-xs text-gray-400">
                            {new Date(video.timestamp).toLocaleString('ko-KR')}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
} 