'use client';

import React, { useState } from 'react';
import { ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

interface MapPoint {
  id: number;
  x: number;
  y: number;
  nickname: string;
  isMe?: boolean;
  profileImage: string;
}

export default function SearchMapPage() {
  const [zoomLevel, setZoomLevel] = useState(1.8); // 시작을 사진 모드로
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);

  // 고정된 포인트들 (랜덤하지 않음)
  const mapPoints: MapPoint[] = [
    // 나 (가운데)
    {
      id: 0,
      x: 50,
      y: 50,
      nickname: '나',
      isMe: true,
      profileImage: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face'
    },
    // 다른 유저들
    {
      id: 1,
      x: 30,
      y: 25,
      nickname: '여행가 감자',
      profileImage: 'https://images.unsplash.com/photo-1494790108755-2616c39e1f76?w=150&h=150&fit=crop&crop=face'
    },
    {
      id: 2,
      x: 25,
      y: 60,
      nickname: '고양이 집사',
      profileImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face'
    },
    {
      id: 3,
      x: 70,
      y: 30,
      nickname: '커피 러버',
      profileImage: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face'
    },
    {
      id: 4,
      x: 75,
      y: 70,
      nickname: '책벌레',
      profileImage: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face'
    },
    {
      id: 5,
      x: 50,
      y: 80,
      nickname: '운동광',
      profileImage: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=face'
    }
  ];

  const zoomIn = () => setZoomLevel(prev => Math.min(3, prev + 0.3));
  const zoomOut = () => setZoomLevel(prev => Math.max(0.5, prev - 0.3));
  const resetView = () => setZoomLevel(1.8);

  const zoomPercentage = Math.round(zoomLevel * 100);
  const shouldShowPhoto = zoomPercentage >= 150;

  return (
    <div className="h-screen bg-gray-50 relative overflow-hidden">
      {/* 제목 오버레이 */}
      <div className="fixed top-8 left-1/2 transform -translate-x-1/2 z-20 text-center">
        <div className="bg-white/80 backdrop-blur-sm px-6 py-4 rounded-2xl shadow-sm border border-gray-200">
          <h1 className="text-2xl font-light text-gray-900 tracking-tight mb-1">
            connections
          </h1>
          <p className="text-gray-600 text-sm font-light">
            discover people worth connecting with
          </p>
        </div>
      </div>

      {/* 줌 레벨 표시 */}
      <div className="fixed top-8 left-8 z-20">
        <div className="bg-gray-900/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-sm text-center">
          <span className="text-white text-sm font-medium">{zoomPercentage}%</span>
        </div>
      </div>

      {/* 줌 컨트롤 버튼들 */}
      <div className="fixed bottom-8 right-8 z-20 flex flex-col gap-3">
        <button
          onClick={zoomIn}
          className="w-12 h-12 bg-white border border-gray-200 rounded-full shadow-sm hover:shadow-md flex items-center justify-center text-gray-700 hover:text-gray-900"
        >
          <ZoomIn size={18} />
        </button>
        <button
          onClick={zoomOut}
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
            transform: `scale(${zoomLevel})`,
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
                onMouseEnter={() => setHoveredPoint(point.id)}
                onMouseLeave={() => setHoveredPoint(null)}
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
                {hoveredPoint === point.id && (
                  <div 
                    className="absolute left-1/2 transform -translate-x-1/2 text-gray-900 text-sm font-medium whitespace-nowrap pointer-events-none"
                    style={{
                      top: shouldShowPhoto ? '-35px' : '-25px'
                    }}
                  >
                    {point.nickname}
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


 