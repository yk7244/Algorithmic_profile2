'use client';

import React, { useState } from 'react';
import { ZoomIn, ZoomOut, RotateCcw, Info } from 'lucide-react';
import { mapPoints, MapPoint } from './mockData';
import { Button } from '@/components/ui/button';
import router from 'next/router';

const ConnectionMap = () => {
  const [zoomLevel, setZoomLevel] = useState(100);
  const [hoveredUser, setHoveredUser] = useState<string | null>(null);

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


 