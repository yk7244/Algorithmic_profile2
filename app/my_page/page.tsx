'use client'; // 클라이언트 사이드 인터랙션이 필요하면 사용합니다.

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { CheckCircle2 } from 'lucide-react';
import { ExploreWatchHistory, WatchHistory } from '../types/profile';
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

  useEffect(() => {
    if (typeof window !== 'undefined') {
      // 프로필 데이터
      const raw = localStorage.getItem('ProfileData');
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          setProfile(parsed);
        } catch {
          setProfile(null);
        }
      }
      // 프로필 이미지
      const imgRaw = localStorage.getItem('profileImages');
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
  }, []);
  const [watchHistory, setWatchHistory] = useState<ExploreWatchHistory[]>([]);

  useEffect(() => {
    // 로컬 스토리지에서 시청 기록 불러오기
    const history = localStorage.getItem('exploreWatchHistory');
    if (history) {
      setWatchHistory(JSON.parse(history));
    }
  }, []);

  // 기본값
  const nickname = profile?.nickname || '닉네임';
  const description = profile?.description || '설명';

  // 업데이트 가능 여부 계산
  const canUpdate = !profile?.updated_at
    ? true
    : (Date.now() - new Date(profile.updated_at).getTime()) > 7 * 24 * 60 * 60 * 1000;

  return (
    <div className="min-h-screen h-screen bg-gray-50 flex flex-row overflow-hidden">
      {/* 왼쪽 메뉴탭 */}
      <aside className="w-120 min-w-[300px] flex flex-col justify-between pl-10 pt-10">
        <nav className="w-full space-y-2 pt-20 px-8 flex flex-col">
          <button
            className={`text-lg text-left w-full px-4 py-2 font-bold rounded-lg transition-colors ${activeTab === 'profile' ? 'text-gray-900 bg-gray-100' : 'text-gray-400 hover:text-gray-900 hover:bg-gray-50'}`}
            onClick={() => setActiveTab('profile')}
          >
            나의 알고리즘 설정
          </button>
          <button
            className={`text-lg text-left w-full px-4 py-2 font-bold rounded-lg transition-colors ${activeTab === 'history' ? 'text-gray-900 bg-gray-100' : 'text-gray-400 hover:text-gray-900 hover:bg-gray-50'}`}
            onClick={() => setActiveTab('history')}
          >
            나의 시청기록
          </button>
        </nav>
        <div className="w-full px-8 pb-20 mb-10">
          <button
            onClick={logout}
            className="w-full text-lg font-medium rounded-lg px-4 py-3 bg-gray-900 text-white hover:bg-gray-800 transition-colors rounded-[10px]"
          >
            로그아웃 하기
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
                  onClick={() => setIsProfilePublic(!isProfilePublic)}
                  className={`ml-4 relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    isProfilePublic ? 'bg-blue-500' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      isProfilePublic ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
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