'use client';

import React, { useState, useEffect } from 'react';
import { ZoomIn, ZoomOut, RotateCcw, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { getAllPublicProfiles, getClusterImages, getCurrentUserId, getProfileData } from '@/lib/database';

interface MapPoint {
  id: string;
  x: number;
  y: number;
  nickname: string;
  isMe?: boolean;
  profileImage: string;
}

const ConnectionMap = () => {
  const [zoomLevel, setZoomLevel] = useState(100);
  const [hoveredUser, setHoveredUser] = useState<string | null>(null);
  const [mapPoints, setMapPoints] = useState<MapPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const loadMapData = async () => {
      try {
        const [currentUserId, publicProfiles] = await Promise.all([
          getCurrentUserId(),
          getAllPublicProfiles()
        ]);

        const points: MapPoint[] = [];

        // 현재 사용자 정보 추가 (중앙에 배치)
        if (currentUserId) {
          try {
            const currentUserProfile = await getProfileData(currentUserId);
            const currentUserImages = await getClusterImages(currentUserId);
            
            const profileImage = currentUserImages?.[0]?.src || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face';
            
            points.push({
              id: currentUserId,
              x: 50,
              y: 50,
              nickname: currentUserProfile?.nickname || '나',
              isMe: true,
              profileImage
            });
          } catch (error) {
            console.error('현재 사용자 정보 로드 실패:', error);
          }
        }

        // 공개된 프로필들을 랜덤 위치에 배치
        if (publicProfiles && publicProfiles.length > 0) {
          const otherUsers = await Promise.all(
            publicProfiles
              .filter(profile => profile.user_id !== currentUserId) // 현재 사용자 제외
              .slice(0, 10) // 최대 10명
              .map(async (profile, index) => {
                try {
                  const userImages = await getClusterImages(profile.user_id);
                  const profileImage = userImages?.[0]?.src || 'https://images.unsplash.com/photo-1494790108755-2616c39e1f76?w=150&h=150&fit=crop&crop=face';
                  
                  // 랜덤 위치 생성 (중앙 근처 피하기)
                  const angle = (index / Math.max(publicProfiles.length - 1, 1)) * 2 * Math.PI;
                  const radius = 30 + Math.random() * 20; // 30-50% 거리
                  const x = 50 + radius * Math.cos(angle);
                  const y = 50 + radius * Math.sin(angle);
                  
                  return {
                    id: profile.user_id,
                    x: Math.max(10, Math.min(90, x)), // 10-90% 범위 제한
                    y: Math.max(10, Math.min(90, y)),
                    nickname: profile.nickname,
                    isMe: false,
                    profileImage
                  };
                } catch (error) {
                  console.error(`사용자 ${profile.user_id} 정보 로드 실패:`, error);
                  return null;
                }
              })
          );

          // null이 아닌 유효한 사용자들만 추가
          const validUsers = otherUsers.filter(user => user !== null) as MapPoint[];
          points.push(...validUsers);
        }

        setMapPoints(points);
        console.log('[ConnectionMap] 지도 데이터 로드 완료:', points.length);
      } catch (error) {
        console.error('[ConnectionMap] 지도 데이터 로드 실패:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadMapData();
  }, []);

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 25, 200));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 25, 50));
  };

  const resetView = () => setZoomLevel(100);

  const zoomPercentage = Math.round(zoomLevel);
  const shouldShowPhoto = zoomPercentage >= 150;

  return (
    <div className="h-screen bg-gray-50 relative overflow-hidden">
      {/* 로딩 상태 */}
      {isLoading && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-8 flex flex-col items-center">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-gray-700">연결 가능한 사용자들을 찾고 있어요...</p>
          </div>
        </div>
      )}

      {/* 제목 오버레이 */}
      <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-20 text-center">
          <h1 className="text-2xl font-light text-gray-900 tracking-tight mb-1">
            connections
          </h1>
          <p className="text-gray-600 text-sm font-light">
            discover people worth connecting with
          </p>
          {/* 줌 레벨 표시 */}
          <div className="fixed top-20 left-20 z-20">
            <div className="bg-gray-900/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-sm text-center">
              <span className="text-white text-sm font-medium">{zoomPercentage}%</span>
            </div>
          </div>
      </div>

      {/* 줌 컨트롤 버튼들 */}
      <div className="fixed bottom-20 right-20 z-20 flex flex-col gap-3">
        <button
          onClick={handleZoomIn}
          className="w-12 h-12 bg-white border border-gray-200 rounded-full shadow-sm hover:shadow-md flex items-center justify-center text-gray-700 hover:text-gray-900"
        >
          <ZoomIn size={18} />
        </button>
        <button
          onClick={handleZoomOut}
          className="w-12 h-12 bg-white border border-gray-200 rounded-full shadow-sm hover:shadow-md flex items-center justify-center text-gray-700 hover:text-gray-900"
        >
          <ZoomOut size={18} />
        </button>
        <button
          onClick={resetView}
          className="w-12 h-12 bg-white border border-gray-200 rounded-full shadow-sm hover:shadow-md flex items-center justify-center text-gray-700 hover:text-gray-900"
        >
          <RotateCcw size={18} />
        </button>
      </div>

      {/* 안내 문구 */}
      <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-20">
        <div className="bg-white/80 backdrop-blur-sm border border-gray-200 px-4 py-2 rounded-full shadow-sm">
          <p className="text-sm font-light text-gray-500">
            explore with scroll to zoom • drag to navigate • hover for details
          </p>
        </div>
      </div>

      {/* 메인 지도 영역 */}
      <div className="absolute inset-0 bg-white">
        {/* 배경 그리드 */}
        <div className="absolute inset-0 opacity-20">
          <div 
            className="w-full h-full" 
            style={{
              backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(156,163,175,0.3) 1px, transparent 0)',
              backgroundSize: '30px 30px'
            }} 
          />
        </div>

        {/* 지도 내용 */}
        <div 
          className="w-full h-full relative"
          style={{
            transform: `scale(${zoomLevel/100})`,
            transformOrigin: 'center center'
          }}
        >
          {/* 유저 포인트들 */}
          {mapPoints.map((point) => {
            const size = shouldShowPhoto ? 80 : 12;
            
            return (
              <div
                key={point.id}
                className="absolute"
                style={{
                  left: `calc(${point.x}% - ${size/2}px)`,
                  top: `calc(${point.y}% - ${size/2}px)`,
                  width: `${size}px`,
                  height: `${size}px`,
                }}
                onMouseEnter={() => setHoveredUser(point.nickname)}
                onMouseLeave={() => setHoveredUser(null)}
              >
                {shouldShowPhoto ? (
                  /* 사진 모드 */
                  <div className="w-full h-full relative">
                    <img
                      src={point.profileImage}
                      alt={point.nickname}
                      className="w-full h-full rounded-full object-cover shadow-lg border-4 border-white"
                    />
                    {/* 나인 경우 초록색 온라인 표시 */}
                    {point.isMe && (
                      <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 border-2 border-white rounded-full"></div>
                    )}
                  </div>
                ) : (
                  /* 점 모드 */
                  <div 
                    className={`w-full h-full rounded-full shadow-sm ${point.isMe ? 'border-2 border-white shadow-lg' : ''}`}
                    style={{ 
                      backgroundColor: point.isMe ? '#3B82F6' : '#6B7280' 
                    }}
                  />
                )}
                
                {/* 호버시 나타나는 닉네임 */}
                {hoveredUser === point.nickname && (
                  <div 
                    className="absolute left-1/2 transform -translate-x-1/2 text-gray-900 text-sm font-medium whitespace-nowrap pointer-events-none"
                    style={{
                      top: shouldShowPhoto ? '-35px' : '-25px'
                    }}
                  >
                    <div className="bg-black/80 text-white px-2 py-1 rounded-full flex items-center gap-2">
                      {point.nickname}
                    </div>
                    <Button
                      onClick={() => router.push(`/others_profile/${point.id}`)}
                      className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-6 py-2 rounded-full text-sm font-semibold shadow-lg transform transition-all duration-300 hover:scale-105"
                      >
                      프로필 방문하기
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default ConnectionMap; 


 