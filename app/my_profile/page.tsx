"use client";
import OpenAI from "openai";
import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import {
  DndContext,
  useDraggable,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Edit2, Save, CheckCircle2, RefreshCw, Search, X } from "lucide-react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// OpenAI 클라이언트 초기화
const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
});

type Position = {
  x: number;
  y: number;
};

type VideoData = {
  title: string;
  embedId: string;
};

interface ImportedImageData {
  id: string;
  src: string;
  main_keyword: string;
  width: number;
  height: number;
  rotate: number;
  left: string;
  top: string;
  keywords: string[];
  sizeWeight: number;
  relatedVideos: VideoData[];
  category: string;
  mood_keyword: string;
  sub_keyword: string;
  description: string;
  desired_self: boolean;
  desired_self_profile: string | null;
  color?: string;
}

type ImageData = Required<ImportedImageData>;

type HistoryData = {
  timestamp: number;
  positions: Record<string, Position>;
  frameStyles: Record<string, 'healing' | 'inspiration' | 'people' | 'interest' | 'star'>;
  images: ImageData[];
  sessionInfo?: {
    sessionId: string;
    sessionDate: string;
    clusterCount: number;
    description: string;
  };
};

type UnsplashImage = {
  id: string;
  urls: {
    regular: string;
  };
  alt_description: string;
};

type DraggableImageProps = {
  image: ImageData;
  position?: Position;
  isEditing: boolean;
  positions: Record<string, Position>;
  frameStyle: 'healing' | 'inspiration' | 'people' | 'interest' | 'star';
  onFrameStyleChange: (id: string, style: 'healing' | 'inspiration' | 'people' | 'interest' | 'star') => void;
  onImageChange: (id: string, newSrc: string, newKeyword: string) => void;
  onImageSelect: (image: ImageData) => void;
  isSelected: boolean;
  isSearchMode: boolean;
  onImageDelete: (id: string) => void;
};

function DraggableImage({ 
  image, 
  position, 
  isEditing,
  positions,
  frameStyle,
  onFrameStyleChange,
  onImageChange,
  onImageSelect,
  isSelected,
  isSearchMode,
  onImageDelete,
}: DraggableImageProps) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: image.id,
    disabled: !isEditing,
  });

  const [watchedVideos, setWatchedVideos] = useState<string[]>([]);
  const [showImageModal, setShowImageModal] = useState(false);
  const [alternativeImages, setAlternativeImages] = useState<any[]>([]);
  const [isLoadingImages, setIsLoadingImages] = useState(false);
  const [aiRecommendedVideos, setAiRecommendedVideos] = useState<VideoData[]>([]);
  const [isLoadingAiVideos, setIsLoadingAiVideos] = useState(false);
  const router = useRouter();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [panelPosition, setPanelPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [showThumbnailModal, setShowThumbnailModal] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('search');

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0) rotate(${image.rotate}deg)`,
    transition: isEditing ? 'none' : 'transform 0.1s ease-in-out'
  } : {
    transform: `translate3d(${position?.x || 0}px, ${position?.y || 0}px, 0) rotate(${image.rotate}deg)`,
    transition: isEditing ? 'none' : 'transform 0.8s ease-in-out'
  };

  useEffect(() => {
    const generateHaiku = async () => {
      try {
        const completion = await openai.chat.completions.create({
          model: "gpt-3.5-turbo",
          messages: [
            {"role": "user", "content": "write a haiku about ai"},
          ],
        });
        console.log(completion.choices[0].message);
      } catch (error) {
        console.error('OpenAI API 호출 오류:', error);
      }
    };

    // generateHaiku(); // 필요할 때만 주석 해제
  }, []);

  const getClipPath = () => {
    if (image.desired_self) {
      return 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)';
    }
    switch (frameStyle) {
      case 'inspiration':
        // 12개의 꼭지점을 가진 부드러운 별 모양 (꽃 모양)
        return 'polygon(50% 0%, 61% 20%, 75% 20%, 80% 35%, 95% 40%, 90% 55%, 100% 65%, 90% 75%, 85% 90%, 70% 85%, 50% 100%, 30% 85%, 15% 90%, 10% 75%, 0% 65%, 10% 55%, 5% 40%, 20% 35%, 25% 20%, 39% 20%)';
      case 'interest':
        return 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)';
      default:
        return '';
    }
  };

  const getFrameStyle = () => {
    if (image.desired_self) {
      return ''; // star 모양을 위해 빈 문자열 반환
    }
    switch (frameStyle) {
      case 'healing':
        return 'rounded-lg';
      case 'inspiration':
        return '';
      case 'people':
        return 'rounded-full';
      case 'interest':
        return '';
    }
  };

  useEffect(() => {
    // YouTube IFrame API 로드
    const loadYouTubeAPI = () => {
      if (!window.YT) {
        const tag = document.createElement('script');
        tag.src = 'https://www.youtube.com/iframe_api';
        const firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

        return new Promise<void>((resolve) => {
          window.onYouTubeIframeAPIReady = () => {
            resolve();
          };
        });
      }
      return Promise.resolve();
    };

    // 플레이어 초기화
    const initializePlayers = () => {
      // 안전하게 처리: relatedVideos가 존재하고 배열인지 확인
      if (image.relatedVideos && Array.isArray(image.relatedVideos)) {
        image.relatedVideos.forEach((video) => {
          if (!video.embedId) return; // embedId가 없으면 건너뛰기
          
          try {
            const player = new window.YT.Player(`player-${video.embedId}`, {
              events: {
                onStateChange: (event: YouTubeEvent) => {
                  // 영상이 끝났을 때 (상태 코드 0)
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
            console.error('YouTube 플레이어 초기화 오류:', error);
          }
        });
      }
    };

    // API 로드 후 플레이어 초기화
    loadYouTubeAPI().then(() => {
      // window.YT가 로드되었는지 확인
      if (window.YT && window.YT.Player) {
        initializePlayers();
      } else {
        // YT API가 아직 완전히 로드되지 않은 경우 대기
        const checkYT = setInterval(() => {
          if (window.YT && window.YT.Player) {
            clearInterval(checkYT);
            initializePlayers();
          }
        }, 100);
        
        // 일정 시간 후 체크 중단 (5초)
        setTimeout(() => clearInterval(checkYT), 5000);
      }
    });

    // 컴포넌트 언마운트 시 정리
    return () => {
      // 필요한 정리 작업
    };
  }, []);

  const handleVideoClick = (video: VideoData) => {
    // 로컬 스토리지에서 현재 시청 기록 가져오기
    const currentHistory = localStorage.getItem('watchHistory');
    const history = currentHistory ? JSON.parse(currentHistory) : [];
    
    // 이미 있는 영상인지 확인
    const isExist = history.some((item: any) => item.embedId === video.embedId);
    
    if (!isExist) {
      // 새로운 시청 기록 추가
      const newHistory = [
        {
          title: video.title,
          embedId: video.embedId,
          timestamp: Date.now()
        },
        ...history
      ];
      
      // 로컬 스토리지에 저장
      localStorage.setItem('watchHistory', JSON.stringify(newHistory));
      
      // 시청한 영상 목록 업데이트
      setWatchedVideos(prev => [...prev, video.embedId]);
    }
  };

  const handleFrameStyleChange = (e: any) => {
    onFrameStyleChange(image.id, e.target.value as 'healing' | 'inspiration' | 'people' | 'interest' | 'star');
  };

  // 네이버 이미지 검색 함수
  const fetchAlternativeImages = async () => {
    setIsLoadingImages(true);
    try {
      // 검색 키워드 설정
      const searchKeywords = [image.main_keyword, ...image.keywords].slice(0, 2).join(' ');
      console.log('검색 키워드:', searchKeywords);
      
      // 네이버 이미지 검색 API 호출
      const response = await fetch('/api/search-image?' + new URLSearchParams({
        query: searchKeywords
      }));

      if (!response.ok) {
        const errorText = await response.text();
        console.error('이미지 검색 API 에러:', {
          status: response.status,
          statusText: response.statusText,
          error: errorText
        });
        throw new Error(`이미지 검색 실패 (${response.status}): ${errorText}`);
      }

      const data = await response.json();
      console.log('검색 결과:', data);
      
      // 검색 결과가 있는 경우
      if (data.items && data.items.length > 0) {
        // 결과를 랜덤하게 섞어서 최대 4개만 선택
        const shuffledResults = data.items
          .sort(() => Math.random() - 0.5)
          .slice(0, 4)
          .map((item: any) => ({
            id: item.link,
            urls: {
              regular: item.link
            },
            alt_description: item.title.replace(/<\/?b>/g, '')
          }));
        
        setAlternativeImages(shuffledResults);
      } else {
        console.log('검색 결과 없음');
        setAlternativeImages([]);
      }
    } catch (error) {
      console.error('이미지 검색 실패:', error);
      setAlternativeImages([]);
      // 에러 메시지 표시 (toast 라이브러리 미사용, 콘솔로 대체)
      // alert('이미지 검색 실패: ' + (error instanceof Error ? error.message : '이미지를 검색하는 중에 오류가 발생했습니다.'));
    } finally {
      setIsLoadingImages(false);
    }
  };

  // 이미지 모달이 열릴 때 이미지 검색
  useEffect(() => {
    if (showImageModal) {
      fetchAlternativeImages();
    }
  }, [showImageModal]);

  // 이미지 선택 핸들러
  const handleImageSelect = async (selectedImage: any) => {
    try {
      const newSrc = selectedImage.urls.regular;
      const newKeyword = selectedImage.alt_description || image.main_keyword;
      
      // 부모 컴포넌트의 이미지 변경 함수 호출
      onImageChange(image.id, newSrc, newKeyword);
      
      setShowImageModal(false);
    } catch (error) {
      console.error('이미지 업데이트 실패:', error);
    }
  };

  // 이미지 클릭 핸들러 추가
  const handleImageClick = () => {
    if (!isEditing) {
      onImageSelect(image); // 부모 컴포넌트에 선택된 이미지 전달
    }
  };

  // YouTube API로 AI 추천 비디오 가져오기 - 스마트 폴백
  const fetchAiRecommendedVideos = useCallback(async () => {
    setIsLoadingAiVideos(true);
    
    try {
      const API_KEY = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;
      
      if (!API_KEY) {
        console.log('YouTube API 키가 설정되지 않았습니다. 폴백 콘텐츠를 사용합니다.');
        throw new Error('API 키가 없습니다.');
      }

      // 주요 키워드와 랜덤 키워드 조합으로 검색
      const randomKeyword = image.keywords[Math.floor(Math.random() * image.keywords.length)];
      const searchQuery = `${image.main_keyword} ${randomKeyword}`;
      
      console.log(`🔍 YouTube 검색 시도: ${searchQuery}`);
      
      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(searchQuery)}&type=video&maxResults=4&regionCode=KR&key=${API_KEY}`
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.log('YouTube API 응답 오류:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData
        });
        
        // 403 Forbidden (할당량 초과) 처리
        if (response.status === 403) {
          console.log('⚠️ YouTube API 할당량이 초과되었습니다. 폴백 콘텐츠를 제공합니다.');
          throw new Error('QUOTA_EXCEEDED');
        }
        
        throw new Error(`YouTube API 오류: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.items && data.items.length > 0) {
        const videoList = data.items.map((item: any) => ({
          title: item.snippet.title,
          embedId: item.id.videoId
        }));
        setAiRecommendedVideos(videoList);
        console.log(`✅ YouTube 비디오 ${videoList.length}개 로드 성공`);
        return; // 성공 시 폴백 코드 실행하지 않음
      } else {
        console.log('YouTube 검색 결과가 없습니다. 폴백 콘텐츠를 사용합니다.');
        throw new Error('NO_RESULTS');
      }
    } catch (error) {
      console.log('YouTube API 처리 중 오류:', error);
      
      // 폴백 콘텐츠 제공 - 할당량 복구 안내 포함
      const fallbackVideos = [
        {
          title: `${image.main_keyword} 관련 콘텐츠`,
          embedId: 'fallback_1',
          description: 'YouTube API 할당량 제한으로 인해 현재 추천 영상을 가져올 수 없습니다. 내일 다시 시도해보세요!'
        },
        {
          title: `${image.category || '관심사'} 탐색하기`,
          embedId: 'fallback_2',
          description: 'API 할당량은 매일 자정(UTC)에 리셋됩니다.'
        },
        {
          title: '취향 기반 큐레이션 준비 중',
          embedId: 'fallback_3',
          description: '할당량이 복구되면 자동으로 실제 추천 영상을 제공합니다.'
        },
        {
          title: `#${image.main_keyword} 컬렉션`,
          embedId: 'fallback_4',
          description: '이 키워드와 관련된 콘텐츠를 탐색해보세요.'
        }
      ];
      setAiRecommendedVideos(fallbackVideos);
      console.log('✅ 폴백 콘텐츠 설정 완료 (할당량 복구 시 자동 활성화)');
    } finally {
      setIsLoadingAiVideos(false);
    }
  }, [image.main_keyword, image.keywords, image.category]);

  // 프로필 방문 핸들러 추가
  const handleVisitProfile = () => {
    if (image.desired_self_profile) {
      router.push(`/others_profile/${image.desired_self_profile}`);
    }
  };

  // 썸네일 URL 생성 함수
  const getYouTubeThumbnail = (videoId: string) => {
    return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
  };

  // 이미지가 선택되었을 때 AI 추천 비디오 가져오기 - 임시 비활성화
  // useEffect(() => {
  //   if (!isEditing) {
  //     fetchAiRecommendedVideos();
  //   }
  // }, [fetchAiRecommendedVideos, isEditing]);

  return (
    <>
      <Sheet>
        <div
          ref={setNodeRef}
          style={{
            ...style,
            position: 'absolute',
            width: Math.min(150, image.width * image.sizeWeight),
            height: Math.min(150, (image.height + 80) * image.sizeWeight),
            left: image.left,
            top: image.top,
            transform: transform ? 
              `translate3d(${transform.x + (positions[image.id]?.x || 0)}px, ${transform.y + (positions[image.id]?.y || 0)}px, 0) rotate(${image.rotate}deg)` :
              `translate3d(${positions[image.id]?.x || 0}px, ${positions[image.id]?.y || 0}px, 0) rotate(${image.rotate}deg)`,
            transition: isEditing ? 'none' : 'transform 0.8s ease-in-out',
            touchAction: 'none',
            zIndex: isSelected ? 1000 : (showDetails ? 999 : 20), // z-index 개선
          }}
          className={`${isEditing ? "cursor-move" : isSearchMode ? "cursor-pointer" : "cursor-pointer"} ${
            isSelected ? "ring-4 ring-blue-500 ring-opacity-70 shadow-xl scale-105" : ""
          }`}
        >
          {/* 메인 키워드 - 편집 모드와 일반 모드 모두에서 표시 */}
          <div className={`absolute inset-0 transform ${!isEditing && isSearchMode ? 'transition-all duration-300 group hover:scale-110' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              if (!isEditing && isSearchMode) {
                handleImageClick();
              } else if (!isEditing && !isSearchMode) {
                setShowDetails(true);
              }
            }}
          >
            {/* 키워드 */}
            <div 
              className="absolute -top-12 left-1/2 transform -translate-x-1/2 z-20 whitespace-nowrap"
              style={{
                fontSize: `${Math.max(12, 14 * image.sizeWeight)}px`,
              }}
            >
              <div 
                className="px-2 py-1"
                style={{
                  transform: `scale(${Math.max(0.8, image.sizeWeight)})`,
                  transformOrigin: 'center',
                }}
              >
                <span className="font-bold text-gray-800">
                  #{image.main_keyword}
                </span>
              </div>
            </div>

            {/* 이미지 */}
            <SheetTrigger asChild>
              <div 
                className={`relative w-full h-[calc(100%-40px)] ${frameStyle === 'people' ? 'rounded-full overflow-hidden' : ''} ${!isEditing && !isSearchMode ? 'cursor-pointer' : ''}`}
                onClick={(e) => {
                  if (isEditing || isSearchMode) {
                    e.preventDefault();
                  } else {
                    setShowDetails(true);
                  }
                }}
              >
                <div
                  style={{
                    clipPath: getClipPath(),
                  }}
                  className={`relative w-full h-full ${getFrameStyle()} overflow-hidden`}
                >
                  <div className="relative w-full h-full">
                    <img
                      src={getProxiedImageUrl(image.src)}
                      alt={image.main_keyword}
                      className={`w-full h-full object-cover shadow-lg transition-transform duration-300 ${!isEditing && isSearchMode ? 'group-hover:scale-105' : ''} ${image.src === '/images/placeholder.jpg' || image.src === '/images/default_image.png' ? 'opacity-40 grayscale' : ''}`}
                      onClick={(e) => {
                        console.log('🖼️ 이미지 클릭 - 상세 정보:');
                        console.log('   클러스터:', image.main_keyword);
                        console.log('   원본 URL:', image.src);
                        console.log('   프록시 URL:', getProxiedImageUrl(image.src));
                        console.log('   이미지 객체:', {
                          id: image.id,
                          main_keyword: image.main_keyword,
                          src: image.src
                        });
                        e.stopPropagation();
                        if (!isEditing && isSearchMode) {
                          handleImageClick();
                        }
                      }}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        console.error('❌ 이미지 로드 실패 상세:');
                        console.error('   클러스터:', image.main_keyword);
                        console.error('   실패한 URL:', target.src);
                        console.error('   원본 URL:', image.src);
                        if (target.src !== '/images/placeholder.jpg') {
                          console.log('🔄 플레이스홀더로 대체');
                          target.src = '/images/placeholder.jpg';
                        }
                      }}
                      onLoad={() => {
                        console.log('✅ 이미지 로드 성공:');
                        console.log('   클러스터:', image.main_keyword);
                        console.log('   로드된 URL:', getProxiedImageUrl(image.src));
                      }}
                    />
                    {(image.src === '/images/placeholder.jpg' || image.src === '/images/default_image.png') && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="bg-white/80 text-gray-500 px-4 py-2 rounded-lg text-sm font-medium">이미지 없음</span>
                      </div>
                    )}
                  </div>
                  
                  {/* 키워드를 이미지 하단에 배치 */}
                  <div className="absolute bottom-0.5 left-0 right-0 flex flex-wrap gap-1 justify-center items-center p-1">
                    {image.keywords.map((keyword, idx) => (
                      <span
                        key={idx}
                        className="inline-block px-2 py-0.5 text-xs font-medium text-white backdrop-blur-sm rounded-full shadow-sm transition-colors"
                      >
                        #{keyword}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </SheetTrigger>
          </div>

          {isEditing && (
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              {image.desired_self ? (
                <button 
                  className="flex items-center justify-center gap-1.5 py-2 px-4 min-w-[100px] bg-red-500/90 text-white backdrop-blur-sm rounded-full hover:bg-red-600 shadow-sm transition-colors"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowDeleteDialog(true);
                  }}
                  onPointerDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                >
                  <span className="text-sm font-medium">관심사 삭제하기</span>
                </button>
              ) : (
                <button 
                  className="flex items-center justify-center gap-1.5 py-2 px-4 bg-white/20 backdrop-blur-sm rounded-full hover:bg-white shadow-lg transition-all hover:scale-105 z-20"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowImageModal(true);
                  }}
                  onPointerDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                >
                  <RefreshCw className="h-4 w-4" />
                  <span className="text-sm font-medium">이미지 변경</span>
                </button>
              )}
            </div>
          )}
          {isEditing && (
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-white rounded-full shadow-lg px-3 py-1 z-40">
              <select 
                className="text-sm border-none bg-transparent outline-none cursor-pointer"
                value={frameStyle}
                onChange={handleFrameStyleChange}
                onClick={(e) => e.stopPropagation()}
              >
                {image.desired_self ? (
                  <option value="star">⭐️ Desired_self</option>
                ) : (
                  <>
                    <option value="healing">⬛️ 나에게 힐링이 되는 영상</option>
                    <option value="inspiration">⬡ 영감을 주는 영상</option>
                    <option value="people">⚪️ 내가 좋아하는 사람</option>
                    <option value="interest">🔶 나만의 관심사</option>
                  </>
                )}
              </select>
            </div>
          )}
          {isEditing && (
            <div
              className="absolute inset-0 z-10"
              {...listeners}
              {...attributes}
            />
          )}
        </div>
      </Sheet>

      <Dialog open={showImageModal} onOpenChange={setShowImageModal}>
        <DialogContent className="max-w-[80vw] w-[80vw] min-w-[80vw] max-h-[80vh] h-[80vh] min-h-[80vh]">
          <DialogHeader>
            <DialogTitle>이미지 변경</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-12 gap-6 h-[calc(100%-60px)]">
            {/* 기존 이미지 (좌측) */}
            <div className="col-span-6 flex items-center justify-center">
              <div className="w-[80%] aspect-square relative rounded-lg overflow-hidden border-2 border-blue-500 shadow-lg">
                <img
                  src={image.src}
                  alt={image.main_keyword}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {/* 새 이미지 선택 옵션 (우측) */}
            <div className="col-span-6 space-y-4">
              <Tabs defaultValue="search" className="w-full" value={activeTab} onValueChange={setActiveTab}>
                <div className="flex items-center justify-between mb-3">
                  <TabsList>
                    <TabsTrigger value="search" className="flex items-center gap-2">
                      <RefreshCw className="h-4 w-4" />
                      이미지 검색
                    </TabsTrigger>
                    <TabsTrigger value="thumbnails" className="flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                        <circle cx="12" cy="12" r="3"/>
                        <path d="M16 8h.01"/>
                      </svg>
                      관련 영상 썸네일
                    </TabsTrigger>
                  </TabsList>
                  {activeTab === 'search' && (
                    <button
                      onClick={() => fetchAlternativeImages()}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
                    >
                      <RefreshCw className="h-4 w-4" />
                      새로 검색
                    </button>
                  )}
                </div>

                <TabsContent value="search" className="mt-0">
                  {isLoadingImages ? (
                    <div className="grid grid-cols-2 gap-4 p-4">
                      {[1, 2, 3, 4].map((_, index) => (
                        <div key={index} className="aspect-square bg-gray-100 animate-pulse rounded-lg" />
                      ))}
                    </div>
                  ) : alternativeImages.length > 0 ? (
                    <div className="grid grid-cols-2 gap-4 p-4">
                      {alternativeImages.map((altImage) => (
                        <div 
                          key={altImage.id}
                          className="relative aspect-square rounded-lg overflow-hidden border-2 border-transparent hover:border-blue-500 transition-colors cursor-pointer group shadow-md"
                          onClick={() => handleImageSelect(altImage)}
                        >
                          <img
                            src={altImage.urls.regular}
                            alt={altImage.alt_description || '대체 이미지'}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = '/images/placeholder.jpg';
                            }}
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <button className="bg-white/90 backdrop-blur-sm text-gray-800 px-4 py-2 rounded-full font-medium hover:bg-white transition-colors">
                              선택하기
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="text-gray-500">검색된 이미지가 없습니다.</div>
                    </div>
                  )}
                  <div className="bg-blue-50 rounded-lg p-4 mt-4">
                    <div className="text-sm text-blue-600">
                      * 현재 키워드 ({image.keywords.join(', ')})에 맞는 이미지를 보여드립니다.
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="thumbnails" className="mt-0">
                  <div className="grid grid-cols-2 gap-4 p-4">
                    {image.relatedVideos.map((video, index) => (
                      <div key={index} className="relative group">
                        <div 
                          className="aspect-video rounded-lg overflow-hidden shadow-lg cursor-pointer"
                          onClick={() => {
                            const thumbnailUrl = getYouTubeThumbnail(video.embedId);
                            onImageChange(image.id, thumbnailUrl, image.main_keyword);
                            setShowThumbnailModal(false);
                          }}
                        >
                          <img
                            src={getYouTubeThumbnail(video.embedId)}
                            alt={video.title}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = '/images/placeholder.jpg';
                            }}
                          />
                        </div>
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                          <button
                            className="bg-white text-gray-800 px-4 py-2 rounded-full text-sm font-medium hover:bg-gray-100 transition-colors"
                          >
                            이미지로 변경하기
                          </button>
                        </div>
                        <div className="mt-2 text-sm font-medium line-clamp-2">
                          {video.title}
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 드래그 가능한 상세 정보 창 */}
      {showDetails && (
        <div 
          className="fixed top-0 right-0 w-full sm:w-[400px] h-[calc(100vh-20px)] bg-white shadow-xl overflow-hidden transition-all duration-300 z-[9999] border-l border-gray-200"
        >
          <div className="flex items-center justify-between p-4 border-b bg-white sticky top-0 z-10">
            <h2 className="text-base sm:text-lg font-semibold truncate">{image.main_keyword}</h2>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setShowDetails(false)}
              className="flex-shrink-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="h-[calc(100%-64px)] overflow-y-auto px-3 sm:px-4">
            <div className="flex flex-col w-full mx-auto pb-6">
              <div className="relative w-full h-[200px] sm:h-[250px] flex-shrink-0 mt-4">
                <img
                  src={getProxiedImageUrl(image.src)}
                  alt={image.main_keyword}
                  className="w-full h-full object-cover rounded-lg"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    if (target.src !== '/images/placeholder.jpg') {
                      target.src = '/images/placeholder.jpg';
                    }
                  }}
                />
                
                <div className="absolute top-3 right-3">
                  <span className="px-2 sm:px-3 py-1 sm:py-1.5 bg-black/70 backdrop-blur-md rounded-full text-white text-xs sm:text-sm font-medium">
                    {image.category}
                  </span>
                </div>
              </div>
              <div className="mt-3 sm:mt-4 space-y-3 sm:space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
                  <div className="bg-emerald-50 rounded-xl p-2 sm:p-3 text-center">
                    <h4 className="text-xs font-medium text-emerald-600 mb-0.5 sm:mb-1">메인 키워드</h4>
                    <p className="text-xs sm:text-sm font-bold text-emerald-900">#{image.main_keyword}</p>
                  </div>
                  
                  <div className="bg-purple-50 rounded-xl p-2 sm:p-3 text-center">
                    <h4 className="text-xs font-medium text-purple-600 mb-0.5 sm:mb-1">감성/분위기</h4>
                    <p className="text-xs sm:text-sm font-bold text-purple-900">#{image.mood_keyword}</p>
                  </div>
                  
                  <div className="bg-blue-50 rounded-xl p-2 sm:p-3 text-center">
                    <h4 className="text-xs font-medium text-blue-600 mb-0.5 sm:mb-1">서브 키워드</h4>
                    <p className="text-xs sm:text-sm font-bold text-blue-900">#{image.sub_keyword}</p>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-semibold text-gray-800">관심도</h4>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      image.sizeWeight >= 1.2 ? "bg-red-100 text-red-700" :
                      image.sizeWeight >= 0.8 ? "bg-yellow-100 text-yellow-700" :
                      "bg-blue-100 text-blue-700"
                    }`}>
                      {image.sizeWeight >= 1.2 ? "강" :
                      image.sizeWeight >= 0.8 ? "중" : "약"}
                    </span>
                  </div>
                  
                  <div className="relative h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className={`absolute top-0 left-0 h-full rounded-full transition-all duration-500 ${
                        image.sizeWeight >= 1.2 ? "bg-gradient-to-r from-red-400 to-red-500" :
                        image.sizeWeight >= 0.8 ? "bg-gradient-to-r from-yellow-400 to-yellow-500" :
                        "bg-gradient-to-r from-blue-400 to-blue-500"
                      }`}
                      style={{ width: `${Math.min(image.sizeWeight * 50, 100)}%` }}
                    />
                  </div>

                  <p className="mt-2 text-xs text-gray-600">
                    {image.sizeWeight >= 1.2 ? "이 주제에 대한 높은 관심도를 보입니다" :
                    image.sizeWeight >= 0.8 ? "이 주제에 대해 보통 수준의 관심을 가지고 있습니다" :
                    "이 주제에 대해 가볍게 관심을 두고 있습니다"}
                  </p>
                </div>

                <div className="bg-gray-50 rounded-xl p-4">
                  <h4 className="text-sm font-semibold mb-2">이미지 설명</h4>
                  <p className="text-sm text-gray-700">{image.description}</p>
                </div>

                <div>
                  <h4 className="text-sm font-semibold mb-2">관련 키워드</h4>
                  <div className="flex flex-wrap gap-2">
                    {image.keywords.map((keyword, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-full text-xs font-medium hover:bg-gray-200 transition-colors"
                      >
                        #{keyword}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="space-y-6">
                  {!image.desired_self ? (
                    <Tabs defaultValue="history" className="w-full">
                      <div className="bg-gray-70/70 rounded-lg">
                        <TabsList className="w-full grid grid-cols-2 py-0">
                          <TabsTrigger value="history" className="text-base py-1">Where this image from</TabsTrigger>
                          <TabsTrigger value="AI" className="text-base py-1">The way Algorithm see you</TabsTrigger>
                        </TabsList>
                        <br/> <br/>
                        
                        <TabsContent value="history" className="px-4 pb-4">
                          <div className="grid gap-6">
                            {image.relatedVideos.map((video, idx) => (
                              <div key={idx} className="space-y-2">
                                <h5 className="text-sm font-medium text-gray-800 mb-1">{video.title}</h5>
                                <div 
                                  className="relative w-full pt-[56.25%] bg-gray-100 rounded-lg overflow-hidden cursor-pointer"
                                  onClick={() => handleVideoClick(video)}
                                >
                                  <iframe
                                    id={`player-${video.embedId}`}
                                    className="absolute inset-0 w-full h-full"
                                    src={`https://www.youtube.com/embed/${video.embedId}?enablejsapi=1`}
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                  />
                                  <div className={`absolute bottom-2 right-2 flex items-center gap-1 px-2 py-1 rounded-full backdrop-blur-sm transition-all duration-300 ${
                                    watchedVideos.includes(video.embedId) 
                                      ? "bg-green-500/80 text-white" 
                                      : "bg-gray-900/80 text-gray-200"
                                  }`}>
                                    <CheckCircle2 className={`h-3 w-3 ${
                                      watchedVideos.includes(video.embedId)
                                        ? "text-white"
                                        : "text-gray-400"
                                    }`} />
                                    <span className="text-xs font-medium">
                                      {watchedVideos.includes(video.embedId) ? "시청함" : "시청안함"}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </TabsContent>
                        
                        <TabsContent value="AI" className="px-4 pb-4">
                          <div className="grid gap-6">
                            {isLoadingAiVideos ? (
                              <div className="flex justify-center items-center py-8">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                              </div>
                            ) : aiRecommendedVideos.length > 0 ? (
                              aiRecommendedVideos.map((video, idx) => (
                                <div key={idx} className="space-y-2">
                                  <h5 className="text-sm font-medium text-gray-800 mb-1">
                                    <span className="text-blue-500 font-semibold">AI 추천:</span> {video.title}
                                  </h5>
                                  {video.embedId && !video.embedId.startsWith('fallback_') ? (
                                    <div 
                                      className="relative w-full pt-[56.25%] bg-gray-100 rounded-lg overflow-hidden cursor-pointer"
                                      onClick={() => handleVideoClick(video)}
                                    >
                                      <iframe
                                        id={`player-ai-${video.embedId}`}
                                        className="absolute inset-0 w-full h-full"
                                        src={`https://www.youtube.com/embed/${video.embedId}?enablejsapi=1`}
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                        allowFullScreen
                                      />
                                      <div className={`absolute bottom-2 right-2 flex items-center gap-1 px-2 py-1 rounded-full backdrop-blur-sm transition-all duration-300 ${
                                        watchedVideos.includes(video.embedId) 
                                          ? "bg-green-500/80 text-white" 
                                          : "bg-gray-900/80 text-gray-200"
                                      }`}>
                                        <CheckCircle2 className={`h-3 w-3 ${
                                          watchedVideos.includes(video.embedId)
                                            ? "text-white"
                                            : "text-gray-400"
                                        }`} />
                                        <span className="text-xs font-medium">
                                          {watchedVideos.includes(video.embedId) ? "시청함" : "시청안함"}
                                        </span>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="w-full pt-[56.25%] bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg relative overflow-hidden border-2 border-dashed border-blue-200">
                                      <div className="absolute inset-0 flex items-center justify-center p-4">
                                        <div className="text-center space-y-3">
                                          <div className="text-3xl">
                                            {video.embedId === 'fallback_1' ? '🎬' :
                                             video.embedId === 'fallback_2' ? '🔍' :
                                             video.embedId === 'fallback_3' ? '⚙️' :
                                             video.embedId === 'fallback_4' ? '📚' : '🎥'}
                                          </div>
                                          <div className="space-y-2">
                                            <p className="text-sm font-medium text-gray-700">
                                              {video.title}
                                            </p>
                                            {(video as any).description && (
                                              <p className="text-xs text-gray-500 px-2">
                                                {(video as any).description}
                                              </p>
                                            )}
                                          </div>
                                          <button
                                            onClick={fetchAiRecommendedVideos}
                                            className="mt-2 px-3 py-1.5 bg-blue-500 text-white text-xs rounded-md hover:bg-blue-600 transition-colors"
                                          >
                                            다시 시도
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              ))
                            ) : (
                              <div className="text-center py-8">
                                <p className="text-sm text-gray-500">
                                  '{image.main_keyword}' 키워드에 대한 AI 추천 영상을 가져올 수 없습니다.
                                </p>
                                <button
                                  onClick={fetchAiRecommendedVideos}
                                  className="mt-3 px-3 py-1.5 bg-blue-500 text-white text-sm rounded-md hover:bg-blue-600 transition-colors"
                                >
                                  다시 시도
                                </button>
                              </div>
                            )}
                          </div>
                        </TabsContent>
                      </div>
                    </Tabs>
                  ) : (
                    <div className="space-y-6">
                      {/* 프로필 보기 버튼 */}
                      <div className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-xl p-6">
                        <div className="text-center space-y-3">
                          <h3 className="text-base font-semibold text-gray-800">
                            이 이미지의 원본 프로필
                          </h3>
                          <p className="text-sm text-gray-600">
                            이 이미지를 가져온 프로필을 방문하여 더 많은 관심사를 발견해보세요
                          </p>
                          <Button
                            onClick={handleVisitProfile}
                            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-6 py-2 rounded-full text-sm font-semibold shadow-lg transform transition-all duration-300 hover:scale-105"
                          >
                            프로필 방문하기
                          </Button>
                        </div>
                      </div>

                      {/* 추천 영상 섹션 */}
                      <div className="bg-gray-50 rounded-xl p-4">
                        <h3 className="text-sm font-semibold mb-4 text-gray-800">관련된 추천 영상</h3>
                        <div className="grid gap-4">
                          {image.relatedVideos.map((video, idx) => (
                            <div key={idx} className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-shadow">
                              <div className="relative pt-[56.25%]">
                                <iframe
                                  className="absolute inset-0 w-full h-full"
                                  src={`https://www.youtube.com/embed/${video.embedId}`}
                                  title={video.title}
                                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                  allowFullScreen
                                />
                              </div>
                              <div className="p-3">
                                <h4 className="text-sm font-medium text-gray-900 line-clamp-2">{video.title}</h4>
                                <div className="mt-1 flex items-center gap-2">
                                  {watchedVideos.includes(video.embedId) ? (
                                    <span className="inline-flex items-center text-green-600 text-xs">
                                      <CheckCircle2 className="w-3 h-3 mr-1" />
                                      시청 완료
                                    </span>
                                  ) : (
                                    <span className="text-gray-500 text-xs">아직 시청하지 않음</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 썸네일 모달 */}
      <Dialog open={showThumbnailModal} onOpenChange={setShowThumbnailModal}>
        <DialogContent className="max-w-[90vw] w-[90vw] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              {image.main_keyword}의 관련 영상 썸네일
            </DialogTitle>
          </DialogHeader>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-4">
            {image.relatedVideos.map((video, index) => (
              <div key={index} className="relative group">
                <div 
                  className="aspect-video rounded-lg overflow-hidden shadow-lg cursor-pointer"
                  onClick={() => {
                    const thumbnailUrl = getYouTubeThumbnail(video.embedId);
                    onImageChange(image.id, thumbnailUrl, image.main_keyword);
                    setShowThumbnailModal(false);
                  }}
                >
                  <img
                    src={getYouTubeThumbnail(video.embedId)}
                    alt={video.title}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = '/images/placeholder.jpg';
                    }}
                  />
                </div>
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                  <button
                    className="bg-white text-gray-800 px-4 py-2 rounded-full text-sm font-medium hover:bg-gray-100 transition-colors"
                  >
                    이미지로 변경하기
                  </button>
                </div>
                <div className="mt-2 text-sm font-medium line-clamp-2">
                  {video.title}
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

// YouTube IFrame API 타입 선언
declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

interface YouTubeEvent {
  data: number;
  target: any;
}

// 1. Supabase 동기화 함수 추가
async function saveMoodboardToSupabase(userId: string, nickname: string, description: string, images: any[], positions: any, frameStyles: any) {
  await supabase
    .from('moodboard_profiles')
    .upsert({
      user_id: userId,
      nickname,
      description,
      images,
      positions,
      frame_styles: frameStyles,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' });
}

async function loadMoodboardFromSupabase(userId: string) {
  const { data, error } = await supabase
    .from('moodboard_profiles')
    .select('*')
    .eq('user_id', userId)
    .single();
  if (error) return null;
  return data;
}

// 사용자별 무드보드 히스토리를 Supabase에 저장하는 함수
async function saveMoodboardHistory(userId: string, versionName: string, images: any[], positions: any, frameStyles: any) {
  const { error } = await supabase
    .from('moodboard_history')
    .insert({
      user_id: userId,
      version_name: versionName,
      images,
      positions,
      frame_styles: frameStyles,
      created_at: new Date().toISOString(),
    });
  
  if (error) {
    console.error('무드보드 히스토리 저장 실패:', error);
  }
}

// 사용자별 무드보드 히스토리를 Supabase에서 가져오는 함수
async function getMoodboardHistories(userId: string) {
  const { data, error } = await supabase
    .from('moodboard_history')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true });
  
  if (error) {
    console.error('무드보드 히스토리 로드 실패:', error);
    return [];
  }
  
  return data || [];
}

// 사용자별 localStorage 데이터 초기화 함수
function clearUserLocalStorage() {
  localStorage.removeItem('watchHistory');
  localStorage.removeItem('watchClusters');
  localStorage.removeItem('analysisHistory');
  localStorage.removeItem('profileImages');
  localStorage.removeItem('clusterImages');
  // 사용자별 히스토리도 제거 (이제 Supabase 사용)
  localStorage.removeItem('moodboardHistories');
}

// 이미지 프록시 함수
const getProxiedImageUrl = (originalUrl: string) => {
  console.log('🔧 getProxiedImageUrl 호출됨:', originalUrl);
  
  if (originalUrl.startsWith('/images/') || originalUrl.startsWith('data:')) {
    console.log('📁 로컬 이미지 또는 data URI 감지');
    return originalUrl;
  }
  
  // Storage URL 패턴 우선 확인
  if (originalUrl.includes('supabase.co/storage/') || 
      originalUrl.includes('/storage/v1/object/') ||
      originalUrl.includes('cluster-images/')) {
    console.log('🔧 Storage URL 감지, 직접 사용:', originalUrl.substring(0, 100));
    return originalUrl; // Storage URL은 직접 사용
  }
  
  try {
    const url = new URL(originalUrl);
    console.log('🌐 URL 파싱 성공:', url.hostname);
    
    // 문제가 있는 도메인들 (CORS나 Authorization 이슈)
    const problematicDomains = [
      'inven.co.kr',
      'ruliweb.com', 
      'cdn.clien.net',
      'images.chosun.com',
      'pbs.twimg.com'
    ];
    
    // 안전한 도메인들 (프록시 불필요)
    const safeDomains = [
      'pinterest.com',
      'pinimg.com',
      'i.pinimg.com',
      'media.tenor.com',
      'imgur.com',
      'wikimedia.org',
      'supabase.co', // Supabase Storage 도메인 추가
    ];
    
    const hostname = url.hostname;
    
    // 문제가 있는 도메인이면 플레이스홀더 반환
    const isProblematic = problematicDomains.some(domain => hostname.includes(domain));
    if (isProblematic) {
      console.log(`⚠️ 문제가 있는 도메인 감지: ${hostname}, 플레이스홀더 사용`);
      return '/images/placeholder.jpg';
    }
    
    // 안전한 도메인이면 원본 URL 사용
    const isSafe = safeDomains.some(domain => hostname.includes(domain));
    if (isSafe) {
      console.log(`✅ 안전한 도메인 감지: ${hostname}, 원본 URL 사용`);
      return originalUrl;
    }
    
    // 나머지 도메인들은 프록시 사용
    console.log(`🔄 프록시 사용: ${hostname}`);
    return `/api/proxy-image?url=${encodeURIComponent(originalUrl)}`;
  } catch (error) {
    console.error('❌ URL 파싱 실패:', error, 'URL:', originalUrl);
    return '/images/placeholder.jpg';
  }
};

export default function MyProfilePage() {
  const [positions, setPositions] = useState<Record<string, Position>>({});
  const [frameStyles, setFrameStyles] = useState<Record<string, 'healing' | 'inspiration' | 'people' | 'interest' | 'star'>>({});
  const [isEditing, setIsEditing] = useState(false);
  const [histories, setHistories] = useState<HistoryData[]>([]);
  const [currentHistoryIndex, setCurrentHistoryIndex] = useState<number>(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const placeholderImage = '/images/default_image.png';
  const fallbackSvg = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='200' viewBox='0 0 300 200'%3E%3Crect width='300' height='200' fill='%23cccccc'/%3E%3Ctext x='50%25' y='50%25' font-size='18' text-anchor='middle' alignment-baseline='middle' font-family='Arial, sans-serif' fill='%23666666'%3E이미지를 찾을 수 없습니다%3C/text%3E%3C/svg%3E";

  const [images, setImages] = useState<ImageData[]>([]);
  const [visibleImageIds, setVisibleImageIds] = useState<Set<string>>(new Set());

  const [profile, setProfile] = useState({
    nickname: '',
    description: ''
  });
  const [isLoading, setIsLoading] = useState(true); // 초기값을 true로 변경
  const [isGeneratingProfile, setIsGeneratingProfile] = useState(false);
  const [selectedImage, setSelectedImage] = useState<ImageData | null>(null);
  const [selectedImages, setSelectedImages] = useState<ImageData[]>([]);
  const [isSearchMode, setIsSearchMode] = useState(false);
  const router = useRouter();
  const [showGeneratingDialog, setShowGeneratingDialog] = useState(false);
  const [generatingStep, setGeneratingStep] = useState(0);
  const generatingSteps = [
    "당신의 시청 기록을 분석하고 있습니다...",
    "알고리즘이 당신의 취향을 이해하고 있습니다...",
    "흥미로운 패턴을 발견했습니다!",
    "당신만의 특별한 별명을 생성중입니다..."
  ];

  const [bgColor, setBgColor] = useState('bg-white');
  const [nicknameInput, setNicknameInput] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const colorOptions = [
    { name: '화이트', class: 'bg-white' },
    { name: '크림', class: 'bg-amber-50' },
    { name: '라벤더', class: 'bg-purple-50' },
    { name: '민트', class: 'bg-emerald-50' },
    { name: '피치', class: 'bg-rose-50' },
    { name: '스카이', class: 'bg-sky-50' },
  ];

  // 사용자 인증 확인
  useEffect(() => {
    const checkAuth = async () => {
      try {
        console.log('🔐 인증 확인 시작...');
        const { data: sessionData, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('❌ 세션 확인 오류:', error);
          setAuthError('인증 확인 중 오류가 발생했습니다.');
          setIsLoading(false);
          return;
        }

        if (!sessionData?.session?.user) {
          console.log('❌ 로그인되지 않은 사용자');
          setAuthError('로그인이 필요합니다.');
          setIsLoading(false);
          return;
        }

        console.log('✅ 사용자 인증 성공:', sessionData.session.user.id);
        console.log('🏃‍♂️ setIsAuthenticated(true) 호출');
        setIsAuthenticated(true);
        setAuthError(null);
        
      } catch (error) {
        console.error('❌ 인증 확인 중 예외:', error);
        setAuthError('인증 확인 중 오류가 발생했습니다.');
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  // 배경색 저장 및 불러오기
  useEffect(() => {
    // 저장된 배경색 불러오기
    const savedBgColor = localStorage.getItem('moodboard-bg-color');
    if (savedBgColor) {
      setBgColor(savedBgColor);
    }
  }, []);

  // 배경색 변경 핸들러
  const handleBgColorChange = (colorClass: string) => {
    setBgColor(colorClass);
    localStorage.setItem('moodboard-bg-color', colorClass);
  };

  // 데이터 마이그레이션을 위한 useEffect 추가
  useEffect(() => {
    // 로컬 스토리지에서 기존 데이터 마이그레이션
    const migrateLocalStorageData = () => {
      try {
        // 무드보드 히스토리 마이그레이션
        const storedHistories = localStorage.getItem('moodboardHistories');
        if (storedHistories) {
          const parsedHistories = JSON.parse(storedHistories);
          
          // 각 히스토리의 이미지 데이터 마이그레이션
          const migratedHistories = parsedHistories.map((history: any) => {
            // 이미지 배열 마이그레이션
            const migratedImages = history.images?.map((img: any) => {
              // alt 필드가 있고 main_keyword 필드가 없는 경우에만 마이그레이션
              if (img.alt && !img.main_keyword) {
                return {
                  ...img,
                  main_keyword: img.alt, // alt 값을 main_keyword로 복사
                };
              }
              return img;
            });
            
            return {
              ...history,
              images: migratedImages || history.images,
            };
          });
          
          // 마이그레이션된 데이터 저장
          localStorage.setItem('moodboardHistories', JSON.stringify(migratedHistories));
          console.log('무드보드 히스토리 데이터 마이그레이션 완료');
        }
        
        // 클러스터 이미지 마이그레이션
        const storedClusterImages = localStorage.getItem('clusterImages');
        if (storedClusterImages) {
          const parsedClusterImages = JSON.parse(storedClusterImages);
          
          // 각 클러스터 이미지 마이그레이션
          const migratedClusterImages: Record<string, any> = {};
          
          Object.entries(parsedClusterImages).forEach(([key, value]: [string, any]) => {
            migratedClusterImages[key] = {
              ...value,
              main_keyword: key, // 키를 main_keyword로 사용
            };
          });
          
          // 마이그레이션된 데이터 저장
          localStorage.setItem('clusterImages', JSON.stringify(migratedClusterImages));
          console.log('클러스터 이미지 데이터 마이그레이션 완료');
        }
        
        // 마이그레이션 완료 표시
        localStorage.setItem('dataMigrationCompleted', 'true');
      } catch (error) {
        console.error('데이터 마이그레이션 중 오류 발생:', error);
      }
    };
    
    // 마이그레이션이 이미 완료되었는지 확인
    const migrationCompleted = localStorage.getItem('dataMigrationCompleted');
    if (migrationCompleted !== 'true') {
      migrateLocalStorageData();
    }
  }, []);

  // 컴포넌트 마운트 시 Supabase에서 히스토리 불러오기
  useEffect(() => {
    const loadHistoriesFromSupabase = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData?.session?.user?.id;
      if (!userId) return;

      try {
        // 1. Supabase에서 사용자별 히스토리 로드
        const supabaseHistories = await getMoodboardHistories(userId);
        
        // 2. 모든 분석 세션들을 클러스터 테이블에서 가져오기 (히스토리 생성용)
        const { data: allClusters, error: clusterError } = await supabase
          .from('clusters')
          .select('id, main_keyword, sub_keyword, mood_keyword, description, category, keywords, strength, related_videos, created_at, desired_self, metadata, main_image_url')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });
        
        if (clusterError) {
          console.error('❌ 전체 클러스터 히스토리 로드 실패:', clusterError);
        }
        
        let convertedHistories: HistoryData[] = [];
        
        if (supabaseHistories.length > 0) {
          // Supabase 데이터를 로컬 히스토리 형태로 변환
          convertedHistories = supabaseHistories.map((history: any) => ({
            timestamp: new Date(history.created_at).getTime(),
            positions: history.positions || {},
            frameStyles: history.frame_styles || {},
            images: history.images || [],
            sessionInfo: {
              sessionId: history.version_name,
              sessionDate: history.created_at,
              clusterCount: (history.images || []).length,
              description: `분석 결과 ${history.version_name}`
            }
          }));
          
          setHistories(convertedHistories);
          
          // 최신 히스토리 적용
          const latestHistory = convertedHistories[convertedHistories.length - 1];
          if (latestHistory) {
            setPositions(latestHistory.positions);
            setFrameStyles(latestHistory.frameStyles);
            setCurrentHistoryIndex(convertedHistories.length - 1);
            if (latestHistory.images && latestHistory.images.length > 0) {
              setImages(latestHistory.images);
              setVisibleImageIds(new Set(latestHistory.images.map((img: ImageData) => img.id)));
            }
          }
        } else if (allClusters && allClusters.length > 0) {
          // 히스토리가 없으면 클러스터 데이터로부터 히스토리 생성
          console.log('📋 클러스터 데이터로부터 히스토리 생성');
          
          // 클러스터들을 분석 세션별로 그룹화 (5분 임계값 사용)
          const sessionGroups: any[] = [];
          let currentGroup: any[] = [];
          let lastDate: Date | null = null;
          const sessionThreshold = 5 * 60 * 1000; // 5분
          
          allClusters.forEach((cluster) => {
            const clusterDate = new Date(cluster.created_at);
            
            if (!lastDate || Math.abs(clusterDate.getTime() - lastDate.getTime()) > sessionThreshold) {
              // 새로운 세션 시작
              if (currentGroup.length > 0) {
                sessionGroups.push([...currentGroup]);
              }
              currentGroup = [cluster];
              lastDate = clusterDate;
            } else {
              // 같은 세션에 추가
              currentGroup.push(cluster);
            }
          });
          
          // 마지막 그룹 추가
          if (currentGroup.length > 0) {
            sessionGroups.push(currentGroup);
          }
          
          console.log(`📊 발견된 분석 세션: ${sessionGroups.length}개`);
          
          // 각 세션별로 히스토리 생성
          const generatedHistories = sessionGroups.map((sessionClusters, sessionIndex) => {
            const sessionDate = sessionClusters[0].created_at;
            const sessionImages = sessionClusters.map((cluster: any, idx: number) => {
              let imageUrl = cluster.main_image_url;
              
              if (!imageUrl || imageUrl.trim() === '' || imageUrl === '/images/default_image.png' || imageUrl === 'undefined') {
                imageUrl = placeholderImage;
              }
              
              return {
                id: String(cluster.id ?? `session_${sessionIndex}_${idx}`),
                src: imageUrl,
                main_keyword: cluster.main_keyword,
                sub_keyword: cluster.sub_keyword,
                mood_keyword: cluster.mood_keyword,
                description: cluster.description,
                category: cluster.category,
                width: 200,
                height: 200,
                rotate: 0,
                left: '50%',
                top: '50%',
                keywords: Array.isArray(cluster.keywords) ? cluster.keywords : 
                         (cluster.keywords || '').split(',').map((k: string) => k.trim()).filter(Boolean),
                sizeWeight: 0.8,
                relatedVideos: Array.isArray(cluster.related_videos) ? cluster.related_videos : [],
                created_at: cluster.created_at,
                desired_self: cluster.desired_self,
                metadata: cluster.metadata || {},
                desired_self_profile: null,
                color: 'gray',
              };
            });
            
            // 랜덤 위치와 프레임 스타일 생성
            const sessionPositions: Record<string, Position> = {};
            const sessionFrameStyles: Record<string, 'healing' | 'inspiration' | 'people' | 'interest' | 'star'> = {};
            
            sessionImages.forEach((image: ImageData) => {
              sessionPositions[image.id] = {
                x: Math.random() * 600 - 300,
                y: Math.random() * 400 - 200,
              };
              sessionFrameStyles[image.id] = 'healing';
            });
            
            return {
              timestamp: new Date(sessionDate).getTime(),
              positions: sessionPositions,
              frameStyles: sessionFrameStyles,
              images: sessionImages,
              sessionInfo: {
                sessionId: `분석 ${sessionGroups.length - sessionIndex}`,
                sessionDate: sessionDate,
                clusterCount: sessionImages.length,
                description: `${new Date(sessionDate).toLocaleDateString()} 분석 결과`
              }
            };
          }).reverse(); // 최신순으로 정렬
          
          setHistories(generatedHistories);
          setCurrentHistoryIndex(generatedHistories.length - 1);
          
          // 최신 세션을 기본으로 설정
          if (generatedHistories.length > 0) {
            const latestSession = generatedHistories[generatedHistories.length - 1];
            setPositions(latestSession.positions);
            setFrameStyles(latestSession.frameStyles);
            setImages(latestSession.images);
            setVisibleImageIds(new Set(latestSession.images.map((img: ImageData) => img.id)));
          }
          
          console.log(`✅ ${generatedHistories.length}개의 히스토리 생성 완료`);
          
          // 생성된 히스토리들을 Supabase에 저장
          for (const [index, history] of generatedHistories.entries()) {
            await saveMoodboardHistory(
              userId, 
              history.sessionInfo?.sessionId || `자동생성 ${index + 1}`, 
              history.images, 
              history.positions, 
              history.frameStyles
            );
          }
        } else {
          // 아무 데이터도 없을 때 초기 히스토리 생성
          const initialHistory: HistoryData = {
            timestamp: Date.now(),
            positions: {},
            frameStyles: {},
            images: [],
            sessionInfo: {
              sessionId: '초기 상태',
              sessionDate: new Date().toISOString(),
              clusterCount: 0,
              description: '데이터 없음'
            }
          };
          setHistories([initialHistory]);
          setCurrentHistoryIndex(0);
          setVisibleImageIds(new Set());
        }
      } catch (error) {
        console.error('❌ 히스토리 로드 실패:', error);
        // 실패 시 초기 상태로 설정
        const fallbackHistory: HistoryData = {
          timestamp: Date.now(),
          positions: {},
          frameStyles: {},
          images: [],
          sessionInfo: {
            sessionId: '오류 복구',
            sessionDate: new Date().toISOString(),
            clusterCount: 0,
            description: '히스토리 로드 실패'
          }
        };
        setHistories([fallbackHistory]);
        setCurrentHistoryIndex(0);
        setVisibleImageIds(new Set());
      }
    };

    loadHistoriesFromSupabase();
  }, []); // images 의존성 제거하여 한 번만 실행

  // 히스토리 재생 효과 수정
  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    if (isPlaying && histories.length > 0) {
      intervalId = setInterval(() => {
        setCurrentHistoryIndex(prev => {
          const nextIndex = prev + 1;
          if (nextIndex >= histories.length) {
            setIsPlaying(false);
            return prev;
          }
          
          // 다음 히스토리의 이미지 ID 목록 가져오기
          const nextHistoryImageIds = new Set(histories[nextIndex].images.map(img => img.id));
          setVisibleImageIds(nextHistoryImageIds);
          
          setPositions(histories[nextIndex].positions);
          setFrameStyles(histories[nextIndex].frameStyles || {});
          return nextIndex;
        });
      }, 2000);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isPlaying, histories]);

  // 히스토리 클릭 핸들러 수정
  const handleHistoryClick = (index: number) => {
    if (index < 0 || index >= histories.length) return;
    
    const historyItem = histories[index];
    setCurrentHistoryIndex(index);
    
    // 히스토리의 모든 상태 복원
    if (historyItem.positions) {
      setPositions(historyItem.positions);
    }
    if (historyItem.frameStyles) {
      setFrameStyles(historyItem.frameStyles);
    }
    if (historyItem.images) {
      setImages(historyItem.images);
      setVisibleImageIds(new Set(historyItem.images.map(img => img.id)));
    }
    
    console.log('히스토리 복원:', {
      version: index + 1,
      imageCount: historyItem.images?.length || 0,
      positionCount: Object.keys(historyItem.positions || {}).length
    });
  };

  // 히스토리 재생 시작 핸들러 수정
  const handlePlayHistory = () => {
    if (histories.length > 0) {
      // 첫 번째 히스토리의 이미지 ID 목록 가져오기
      const firstHistoryImageIds = new Set(histories[0].images.map(img => img.id));
      setVisibleImageIds(firstHistoryImageIds);
      
      setCurrentHistoryIndex(0);
      setPositions(histories[0].positions);
      setFrameStyles(histories[0].frameStyles || {});
      setIsPlaying(true);
    }
  };

  const handleFrameStyleChange = (id: string, style: 'healing' | 'inspiration' | 'people' | 'interest' | 'star') => {
    setFrameStyles(prev => ({
      ...prev,
      [id]: style
    }));
  };

  // Supabase에서 불러오기 - 프로필 데이터 먼저 로드
  useEffect(() => {
    if (!isAuthenticated) return;
    
    async function loadSavedProfile() {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData?.session?.user?.id;
      if (!userId) return;
      
      try {
        console.log('📱 저장된 프로필 데이터 로드 시작');
        const moodboard = await loadMoodboardFromSupabase(userId);
        if (moodboard && moodboard.nickname) {
          console.log('✅ 저장된 프로필 발견:', moodboard.nickname);
          setProfile({
            nickname: moodboard.nickname || '',
            description: moodboard.description || ''
          });
          setNicknameInput(moodboard.nickname || '');
          
          // 저장된 이미지, 위치, 프레임 스타일도 로드
          if (moodboard.images) {
            setImages(moodboard.images);
            setVisibleImageIds(new Set(moodboard.images.map((img: any) => img.id)));
          }
          if (moodboard.positions) {
            setPositions(moodboard.positions);
          }
          if (moodboard.frame_styles) {
            setFrameStyles(moodboard.frame_styles);
          }
        } else {
          console.log('📭 저장된 프로필이 없음 - 기본값 사용');
          // 로컬 스토리지에서 마지막 프로필 시도
          const lastProfile = localStorage.getItem('lastProfile');
          if (lastProfile) {
            try {
              const parsedProfile = JSON.parse(lastProfile);
              setProfile(parsedProfile);
              setNicknameInput(parsedProfile.nickname || '');
              console.log('✅ 로컬 프로필 로드:', parsedProfile.nickname);
            } catch (error) {
              console.error('로컬 프로필 파싱 실패:', error);
            }
          }
        }
      } catch (error) {
        console.error('❌ 프로필 로드 실패:', error);
      }
    }
    
    loadSavedProfile();
  }, [isAuthenticated]);

  // 자동 프로필 생성 제거 - 사용자가 명시적으로 버튼을 눌렀을 때만 실행되도록 변경
  // useEffect(() => {
  //   generateUserProfile();
  // }, []); // 이 부분 제거

  // 저장(동기화) 함수 수정 - Supabase 히스토리 저장
  const handleSave = async () => {
    try {
      setIsSaving(true);
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData?.session?.user?.id;
      
      if (!userId) {
        setAuthError('로그인이 필요합니다.');
        return;
      }
      
      console.log('💾 무드보드 저장 시작');
      
      // 새로운 히스토리 생성 및 추가
      const newHistory: HistoryData = {
        timestamp: Date.now(),
        positions: positions,
        frameStyles: frameStyles,
        images: images
      };
      
      const updatedHistories = [...histories, newHistory];
      setHistories(updatedHistories);
      setCurrentHistoryIndex(updatedHistories.length - 1);
      setIsEditing(false);
      
      // Supabase에 무드보드 저장
      await saveMoodboardToSupabase(
        userId, 
        nicknameInput || profile.nickname, 
        profile.description || '', 
        images, 
        positions, 
        frameStyles
      );
      
      // Supabase에 히스토리 저장
      await saveMoodboardHistory(
        userId, 
        `버전 ${updatedHistories.length}`, 
        images, 
        positions, 
        frameStyles
      );
      
      // 각 클러스터의 이미지 URL이 Supabase에 제대로 저장되었는지 확인 및 업데이트
      for (const image of images) {
        if (image.src && image.src !== placeholderImage) {
          const { error: updateError } = await supabase
            .from('clusters')
            .update({ main_image_url: image.src })
            .eq('id', image.id)
            .eq('user_id', userId);
          
          if (updateError) {
            console.error(`❌ 클러스터 ${image.id} 이미지 URL 업데이트 실패:`, updateError);
          } else {
            console.log(`✅ 클러스터 ${image.id} 이미지 URL 업데이트 성공`);
          }
        }
      }
      
      setProfile((prev) => ({ ...prev, nickname: nicknameInput || prev.nickname }));
      console.log('✅ 모든 데이터 저장 완료');
      
      // 성공 메시지 표시
      const notification = document.createElement('div');
      notification.innerHTML = '✅ 저장이 완료되었습니다!';
      notification.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50';
      document.body.appendChild(notification);
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 3000);
      
    } catch (error) {
      console.error('❌ 저장 중 오류:', error);
      setAuthError('저장 중 오류가 발생했습니다. 다시 시도해주세요.');
      
      // 에러 메시지 표시
      const notification = document.createElement('div');
      notification.innerHTML = '❌ 저장에 실패했습니다. 다시 시도해주세요.';
      notification.className = 'fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg z-50';
      document.body.appendChild(notification);
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    if (!isEditing) return;
    
    const { active, delta } = event;
    setPositions(prev => {
      const oldPosition = prev[active.id] || { x: 0, y: 0 };
      return {
        ...prev,
        [active.id]: {
          x: oldPosition.x + delta.x,
          y: oldPosition.y + delta.y,
        },
      };
    });
  };

  const onImageChange = (id: string, newSrc: string, newKeyword: string) => {
    // 이미지 배열 업데이트
    const updatedImages = images.map(img => 
      img.id === id ? { ...img, src: newSrc } : img
    );
    
    // 이미지 상태 업데이트
    setImages(updatedImages);
    
    // localStorage의 profileImages도 업데이트
    const profileImagesData = localStorage.getItem('profileImages');
    if (profileImagesData) {
      const profileImages = JSON.parse(profileImagesData);
      const updatedProfileImages = {
        ...profileImages,
        [id]: {
          ...profileImages[id],
          src: newSrc
        }
      };
      localStorage.setItem('profileImages', JSON.stringify(updatedProfileImages));
    }
    
    // 새로운 히스토리 생성 및 저장
    const newHistory: HistoryData = {
      timestamp: Date.now(),
      positions: positions,
      frameStyles: frameStyles,
      images: updatedImages
    };

    const updatedHistories = [...histories, newHistory];
    setHistories(updatedHistories);
    localStorage.setItem('moodboardHistories', JSON.stringify(updatedHistories));
    setCurrentHistoryIndex(updatedHistories.length - 1);
  };

  // 프로필 생성 함수를 별도로 분리
  const generateUserProfile = useCallback(async () => {
    try {
      setIsGeneratingProfile(true);
      setShowGeneratingDialog(true);
      
      // 각 단계별로 딜레이를 주며 진행
      for (let i = 0; i < generatingSteps.length; i++) {
        setGeneratingStep(i);
        await new Promise(resolve => setTimeout(resolve, 1500));
      }

      // localStorage에서 profileImages 데이터 가져오기
      let profileImages: any = null;
      const profileImagesData = localStorage.getItem('profileImages');
      if (profileImagesData) {
        profileImages = JSON.parse(profileImagesData);
      } else if (images && images.length > 0) {
        // images 배열이 있으면 profileImages로 변환
        profileImages = images.reduce((acc: any, img: any, idx: number) => {
          acc[idx] = img;
          return acc;
        }, {});
      }
      if (!profileImages || Object.keys(profileImages).length === 0) {
        const defaultProfile = {
          nickname: '알고리즘 탐험가',
          description: '아직 프로필 이미지가 없습니다. 메인 페이지에서 "Tell me who I am"을 클릭하여 프로필을 생성해보세요!'
        };
        setProfile(defaultProfile);
        return;
      }

      // 프롬프트 생성을 위한 데이터 가공
      const imageData = Object.values(profileImages).map((image: any) => ({
        main_keyword: image.main_keyword,
        category: image.category,
        description: image.description,
        mood_keyword: image.mood_keyword,
        keywords: image.keywords
      }));

      const prompt = `
당신은 사용자의 관심사와 성향을 분석하여 그들의 성격과 취향을 파악하는 전문가입니다.
다음은 사용자의 관심사와 성향을 분석한 정보입니다:

${imageData.map((image: any, index: number) => `
이미지 ${index + 1}:
- 주요 키워드: ${image.main_keyword || '정보 없음'}
- 카테고리: ${image.category || '미분류'}
- 설명: ${image.description || '정보 없음'}
- 감성 키워드: ${image.mood_keyword || '정보 없음'}
- 관련 키워드: ${image.keywords?.join(', ') || '정보 없음'}
`).join('\n')}

위 정보를 바탕으로 다음 두 가지를 한국어로 생성해주세요:

1. 사용자의 대표 관심사를 종합하여 봤을때, 여러가지를 혼합하여 새로운 키워드로 취향과 성격을 반영한 독특하고 창의적인 짧은 명사 별명 (예: "감성적인 여행자", "호기심 많은 지식탐험가" 등)
2. 중요!!: 별명 생성시 재밌는 동물, 물건, 이름등으로 은유법이나 비유 명사를 무조건 활용해야함 ("예: 현아를 좋아하는 사과, 토끼)
3. 사용자의 콘텐츠 소비 패턴, 취향, 관심사를 2-3문장으로 짧게 재밌게 흥미롭게 요약한 설명, 사용자를 예측해도 됨

응답 형식:
별명: [생성된 별명]
설명: [생성된 설명]
`;

      console.log('OpenAI 요청 시작');
      const completion = await openai.chat.completions.create({
        messages: [{ role: "user", content: prompt }],
        model: "gpt-3.5-turbo",
        temperature: 0.9,
      });

      const response = completion.choices[0].message.content || '';
      console.log('OpenAI 응답:', response);
      
      // 응답 파싱 개선
      const nicknameMatch = response.match(/별명:\s*(.*?)(?=\n|$)/);
      const descriptionMatch = response.match(/설명:\s*([\s\S]*?)(?=\n\n|$)/);
      
      const newProfile = {
        nickname: nicknameMatch ? nicknameMatch[1].trim() : '알고리즘 탐험가',
        description: descriptionMatch 
          ? descriptionMatch[1].trim() 
          : '당신만의 독특한 콘텐츠 취향을 가지고 있습니다. 메인 페이지에서 더 많은 관심사를 추가해보세요!'
      };

      console.log('새로운 프로필:', newProfile);
      setProfile(newProfile);
      setNicknameInput(newProfile.nickname); // 닉네임 input도 업데이트
      
      // 마지막 프로필 저장
      saveLastProfile(newProfile);
      
      // Supabase에 nickname/description 저장
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData?.session?.user?.id;
      if (userId) {
        await supabase.from('moodboard_profiles').upsert({
          user_id: userId,
          nickname: newProfile.nickname,
          description: newProfile.description,
          images: images, // 현재 이미지 배열
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });
      }
    } catch (error) {
      console.error('프로필 생성 오류:', error);
      const errorProfile = {
        nickname: '알고리즘 탐험가',
        description: '프로필 생성 중 오류가 발생했습니다. 나중에 다시 시도해주세요.'
      };
      setProfile(errorProfile);
      setNicknameInput(errorProfile.nickname);
      // 에러 시에도 마지막 프로필 저장
      saveLastProfile(errorProfile);
    } finally {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setIsGeneratingProfile(false);
      setShowGeneratingDialog(false);
      setGeneratingStep(0);
    }
  }, []); // 의존성 배열 비움

  // 이미지 선택 핸들러
  const handleImageSelect = (image: ImageData) => {
    setSelectedImage(image);
    
    // 이미 선택된 이미지인지 확인
    const isAlreadySelected = selectedImages.some(img => img.id === image.id);
    
    if (isAlreadySelected) {
      // 이미 선택된 이미지라면 선택 해제
      setSelectedImages(prev => prev.filter(img => img.id !== image.id));
    } else {
      // 새로 선택된 이미지라면 배열에 추가
      setSelectedImages(prev => [...prev, image]);
    }
  };

  // 검색 모드 토글 함수
  const toggleSearchMode = () => {
    setIsSearchMode(!isSearchMode);
    if (isSearchMode) {
      // 검색 모드 종료 시 선택된 이미지들 초기화
      setSelectedImages([]);
      setSelectedImage(null);
    }
  };

  // 검색 버튼 클릭 핸들러
  const handleSearch = () => {
    if (selectedImages.length === 0) return;
    
    // 선택된 키워드들을 쿼리 파라미터로 변환
    const keywords = selectedImages.map(img => img.main_keyword).join(',');
    
    // search 페이지로 이동
    router.push(`/search?keywords=${encodeURIComponent(keywords)}`);
  };

  const handleImageDelete = (id: string) => {
    // 이미지 삭제
    const updatedImages = images.filter(img => img.id !== id);
    setImages(updatedImages);
    
    // 새로운 히스토리 생성 및 저장
    const newHistory: HistoryData = {
      timestamp: Date.now(),
      positions,
      frameStyles,
      images: updatedImages
    };
    
    const updatedHistories = [...histories, newHistory];
    setHistories(updatedHistories);
    localStorage.setItem('moodboardHistories', JSON.stringify(updatedHistories));
    setCurrentHistoryIndex(updatedHistories.length - 1);
    
    // visibleImageIds 업데이트
    setVisibleImageIds(new Set(updatedImages.map(img => img.id)));
  };

  // 컴포넌트 시작 부분에 useEffect 추가
  // useEffect(() => {
  //   // 페이지 로드 시 자동으로 별명 생성
  //   generateUserProfile();
  // }, []); // 빈 의존성 배열로 컴포넌트 마운트 시 한 번만 실행

  // 인증 후 데이터 로딩
  useEffect(() => {
    console.log('🎯 클러스터 데이터 로딩 useEffect 실행');
    console.log('   isAuthenticated:', isAuthenticated);
    console.log('   images.length:', images.length);
    
    if (!isAuthenticated) {
      console.log('❌ 인증되지 않아서 클러스터 로딩 중단');
      return;
    }

    const fetchClusters = async () => {
      // 이미 이미지가 있으면 로딩 종료
      if (images.length > 0) {
        console.log('👍 이미지가 이미 존재함, 로딩 종료');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true); // 로딩 시작 명시적으로 설정
        console.log('📱 클러스터 데이터 로드 시작');
        
        const { data: userData } = await supabase.auth.getUser();
        const userId = userData?.user?.id;
        if (!userId) {
          setAuthError('사용자 정보를 가져올 수 없습니다.');
          setIsLoading(false);
          return;
        }
        
        console.log('🔍 사용자 ID:', userId);
        
        // 1. 모든 클러스터 데이터 가져오기
        const { data, error } = await supabase
          .from('clusters')
          .select('id, main_keyword, sub_keyword, mood_keyword, description, category, keywords, strength, related_videos, created_at, desired_self, metadata, main_image_url')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });
        
        if (error) {
          console.error('❌ 클러스터 데이터 불러오기 실패:', error);
          setAuthError('데이터를 불러오는 중 오류가 발생했습니다.');
          setIsLoading(false);
          return;
        }
        
        if (data && data.length > 0) {
          console.log('✅ 전체 클러스터 데이터:', data.length, '개');
          
          // 2. 최신 분석 세션 찾기 (가장 최근 created_at 날짜를 기준으로)
          const latestCluster = data[0]; // 이미 created_at 내림차순으로 정렬됨
          const latestDate = new Date(latestCluster.created_at);
          
          // 같은 날 또는 5분 이내에 생성된 클러스터들을 같은 세션으로 간주
          const sessionTimeThreshold = 5 * 60 * 1000; // 5분
          const latestSessionClusters = data.filter(cluster => {
            const clusterDate = new Date(cluster.created_at);
            const timeDiff = Math.abs(latestDate.getTime() - clusterDate.getTime());
            return timeDiff <= sessionTimeThreshold;
          });
          
          console.log(`🕒 최신 분석 세션 기준: ${latestDate.toISOString()}`);
          console.log(`📊 최신 세션 클러스터: ${latestSessionClusters.length}개`);
          
          // 최신 세션의 클러스터들만 사용
          console.log('🎯 최신 세션 클러스터 목록:');
          latestSessionClusters.forEach((cluster, idx) => {
            console.log(`   ${idx + 1}. ${cluster.main_keyword} (${cluster.created_at})`);
          });
          
          // 3. 이미지 URL이 있는 클러스터 우선 선택
          const clustersWithImages = latestSessionClusters.filter(cluster => {
            const hasImageUrl = cluster.main_image_url && 
                               cluster.main_image_url.trim() !== '' && 
                               cluster.main_image_url !== 'undefined';
            if (hasImageUrl) {
              console.log(`✅ 이미지 있음: ${cluster.main_keyword} - ${cluster.main_image_url.substring(0, 50)}...`);
            }
            return hasImageUrl;
          });
          
          // 이미지 URL이 없는 클러스터들
          const clustersWithoutImages = latestSessionClusters.filter(cluster => {
            const hasImageUrl = cluster.main_image_url && 
                               cluster.main_image_url.trim() !== '' && 
                               cluster.main_image_url !== 'undefined';
            return !hasImageUrl;
          });
          
          console.log(`📊 최신 세션 - 이미지 있는 클러스터: ${clustersWithImages.length}개`);
          console.log(`📊 최신 세션 - 이미지 없는 클러스터: ${clustersWithoutImages.length}개`);
          
          // 이미지 있는 클러스터 우선, 부족하면 없는 클러스터로 채움 (최대 10개)
          const selectedClusters = [
            ...clustersWithImages.slice(0, 8), 
            ...clustersWithoutImages.slice(0, Math.max(0, 10 - clustersWithImages.length))
          ];
          
          console.log('✅ 선택된 클러스터:', selectedClusters.length, '개');
          
          const newImages = selectedClusters.map((cluster: any, idx: number) => {
            // 이미지 URL 처리
            let imageUrl = cluster.main_image_url;
            
            console.log(`🖼️ 클러스터 ${cluster.main_keyword} 이미지 URL 확인:`);
            console.log(`   원본 URL: "${imageUrl}"`);
            
            // Storage URL이 아니거나 없으면 기본 이미지 사용
            if (!imageUrl || imageUrl.trim() === '' || imageUrl === '/images/default_image.png' || imageUrl === 'undefined') {
              console.log(`⚠️ 클러스터 ${cluster.main_keyword}: 이미지 없음, 기본 이미지 사용`);
              imageUrl = placeholderImage;
            } else {
              console.log(`✅ 클러스터 ${cluster.main_keyword}: 이미지 사용`);
              console.log(`   최종 URL: ${imageUrl.substring(0, 80)}...`);
            }
            
            return {
              id: String(cluster.id ?? idx + 1),
              src: imageUrl,
              main_keyword: cluster.main_keyword,
              sub_keyword: cluster.sub_keyword,
              mood_keyword: cluster.mood_keyword,
              description: cluster.description,
              category: cluster.category,
              width: 200,
              height: 200,
              rotate: 0,
              left: '50%',
              top: '50%',
              keywords: Array.isArray(cluster.keywords) ? cluster.keywords : 
                       (cluster.keywords || '').split(',').map((k: string) => k.trim()).filter(Boolean),
              sizeWeight: 0.8,
              relatedVideos: Array.isArray(cluster.related_videos) ? cluster.related_videos : [],
              created_at: cluster.created_at,
              desired_self: cluster.desired_self,
              metadata: cluster.metadata || {},
              desired_self_profile: null,
              color: 'gray',
            };
          });
          
          console.log('🎯 처리된 이미지 개수:', newImages.length);
          
          setImages(newImages);
          setVisibleImageIds(new Set(newImages.map(img => img.id)));
          
          // 랜덤 위치 생성
          const randomPositions: Record<string, Position> = {};
          const randomFrameStyles: Record<string, 'healing' | 'inspiration' | 'people' | 'interest' | 'star'> = {};
          
          newImages.forEach((imageItem) => {
            randomPositions[imageItem.id] = {
              x: Math.random() * 600 - 300,
              y: Math.random() * 400 - 200,
            };
            randomFrameStyles[imageItem.id] = 'healing';
          });
          
          setPositions(randomPositions);
          setFrameStyles(randomFrameStyles);
          
          console.log('✅ 클러스터 데이터 로드 완료');
          
        } else {
          console.log('📭 저장된 클러스터 데이터가 없습니다.');
        }
        
      } catch (error) {
        console.error('❌ 클러스터 데이터 불러오기 중 오류:', error);
        setAuthError('데이터 로딩 중 예외가 발생했습니다.');
      } finally {
        setIsLoading(false);
        console.log('🏁 클러스터 데이터 로딩 종료');
      }
    };
    
    // 클러스터 데이터 가져오기 실행
    fetchClusters();
  }, [isAuthenticated, images.length]); // 필요한 의존성 다시 추가

  // 로그인 성공 시 localStorage 초기화 - 제거하여 중복 방지
  // useEffect(() => {
  //   clearUserLocalStorage();
  // }, []);

  // 프로필 생성 시 마지막 프로필 저장
  const saveLastProfile = (profileData: any) => {
    localStorage.setItem('lastProfile', JSON.stringify(profileData));
  };

  return (
    <main className={`fixed inset-0 overflow-y-auto transition-colors duration-500 ${bgColor}`}>
      {/* 로딩 상태 */}
      {isLoading && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 shadow-lg">
            <div className="flex items-center gap-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="text-lg font-medium">데이터를 불러오는 중...</span>
            </div>
          </div>
        </div>
      )}

      {/* 인증 오류 */}
      {authError && !isLoading && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 shadow-lg max-w-md text-center">
            <div className="text-red-500 text-xl mb-4">⚠️</div>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">오류가 발생했습니다</h2>
            <p className="text-gray-600 mb-6">{authError}</p>
            <div className="flex gap-3 justify-center">
              <Button onClick={() => window.location.reload()} className="bg-blue-600 hover:bg-blue-700">
                새로고침
              </Button>
              <Button onClick={() => router.push('/upload')} variant="outline">
                업로드 페이지로 이동
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 메인 콘텐츠 */}
      {!isLoading && !authError && (
        <>
          {/* 생성 중 다이얼로그 */}
          <Dialog open={showGeneratingDialog} onOpenChange={setShowGeneratingDialog}>
            {/* ... 기존 Dialog 내용 ... */}
          </Dialog>

          {/* 검색 모드일 때 배경 그라데이션 추가 */}
          {isSearchMode && null}

          <div className="relative z-20 w-full">
            <div className="max-w-[1200px] mx-auto">
              {/* 기존 제목과 설명 (검색 모드가 아닐 때만 표시) */}
              {!isSearchMode && (
                <div className="absolute z-30 pl-8 pr-8 max-w-[800px] space-y-6 pt-8">
                  <div className="flex items-center gap-2 flex-wrap">
                    <input
                      type="text"
                      value={nicknameInput}
                      onChange={e => setNicknameInput(e.target.value)}
                      placeholder="닉네임을 입력하세요"
                      className="text-3xl font-bold tracking-tight border-none outline-none bg-white/80 backdrop-blur-sm rounded-lg px-4 py-2 min-w-[300px] max-w-[500px] flex-1 shadow-lg focus:shadow-xl transition-all duration-200"
                      maxLength={30}
                      disabled={isSaving}
                    />
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      onClick={handleSave} 
                      title="저장" 
                      className="bg-white/80 backdrop-blur-sm hover:bg-white/90 shadow-lg"
                      disabled={isSaving}
                    >
                      {isSaving ? (
                        <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Save className="w-5 h-5 text-blue-600" />
                      )}
                    </Button>
                  </div>
                  <div className="text-gray-700 text-base leading-relaxed mt-2 max-w-[700px] break-words bg-white/70 backdrop-blur-sm rounded-lg px-4 py-3 shadow-lg">
                    {profile?.description || '나만의 알고리즘 프로필을 생성해보세요.'}
                  </div>
                  
                  <div className="flex flex-wrap gap-2 mt-4">
                    <Button 
                      onClick={() => setIsEditing(!isEditing)}
                      variant={isEditing ? "default" : "outline"}
                      className="transition-all duration-200"
                      disabled={isSaving}
                    >
                      {isEditing ? '편집 완료' : '편집 모드'}
                    </Button>
                    
                    <Button 
                      onClick={generateUserProfile}
                      disabled={isGeneratingProfile || isSaving}
                      variant="outline"
                      className="hover:bg-blue-50"
                    >
                      {isGeneratingProfile ? '생성중...' : '새 프로필 생성'}
                    </Button>
                    
                    <Button 
                      onClick={() => {
                        // 상태 초기화 후 페이지 새로고침
                        setImages([]);
                        setHistories([]);
                        setCurrentHistoryIndex(-1);
                        window.location.reload();
                      }}
                      variant="outline"
                      className="hover:bg-green-50"
                      disabled={isSaving}
                    >
                      새로고침
                    </Button>
                    
                    <Button 
                      onClick={toggleSearchMode}
                      variant={isSearchMode ? "default" : "outline"}
                      className="transition-all duration-200"
                      disabled={isSaving}
                    >
                      {isSearchMode ? '검색 완료' : '검색 모드'}
                    </Button>
                    
                    <Button
                      onClick={handlePlayHistory}
                      disabled={histories.length === 0 || isPlaying || isSaving}
                      variant="outline"
                      className="hover:bg-green-50"
                    >
                      {isPlaying ? '재생 중...' : '히스토리 재생'}
                    </Button>
                    
                    <Button
                      onClick={() => router.push('/explore')}
                      variant="outline"
                      className="hover:bg-purple-50 text-purple-600"
                      disabled={isSaving}
                    >
                      다른 사용자 탐색
                    </Button>
                  </div>
                  
                  {/* 배경색 선택 */}
                  <div className="flex flex-wrap gap-2 mt-4">
                    <span className="text-sm text-gray-600 mr-2">배경색:</span>
                    {colorOptions.map((color) => (
                      <button
                        key={color.class}
                        onClick={() => handleBgColorChange(color.class)}
                        className={`w-6 h-6 rounded-full border-2 transition-all ${
                          bgColor === color.class ? 'border-gray-800 scale-110' : 'border-gray-300'
                        } ${color.class}`}
                        title={color.name}
                        disabled={isSaving}
                      />
                    ))}
                  </div>

                  {/* 검색 모드일 때 선택된 이미지 표시 및 검색 버튼 */}
                  {isSearchMode && selectedImages.length > 0 && (
                    <div className="bg-white/90 backdrop-blur-sm rounded-lg p-4 shadow-lg">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-lg font-semibold">선택된 키워드</h3>
                        <Button onClick={handleSearch} className="bg-blue-600 hover:bg-blue-700 text-white" disabled={isSaving}>
                          <Search className="w-4 h-4 mr-2" />
                          검색하기 ({selectedImages.length}개)
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {selectedImages.map((img) => (
                          <span
                            key={img.id}
                            className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
                          >
                            #{img.main_keyword}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* 히스토리 네비게이션 */}
                  {histories.length > 0 && (
                    <div className="bg-white/90 backdrop-blur-sm rounded-lg p-4 shadow-lg">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-lg font-semibold">무드보드 히스토리</h3>
                        <div className="text-sm text-gray-600">
                          {histories.length}개의 분석 세션
                        </div>
                      </div>
                      <div className="flex gap-2 overflow-x-auto pb-2">
                        {histories.map((history, index) => {
                          // 클러스터 개수를 더 정확하게 계산
                          let clusterCount = 0;
                          if (history.sessionInfo?.clusterCount) {
                            clusterCount = history.sessionInfo.clusterCount;
                          } else if (history.images && Array.isArray(history.images)) {
                            clusterCount = history.images.length;
                          } else {
                            clusterCount = 0;
                          }
                          
                          console.log(`🔍 히스토리 ${index}: sessionInfo =`, history.sessionInfo, 'images length =', history.images?.length, 'final count =', clusterCount);
                          
                          return (
                            <button
                              key={history.timestamp}
                              onClick={() => handleHistoryClick(index)}
                              className={`flex-shrink-0 px-3 py-2 rounded-lg text-sm font-medium transition-colors min-w-[120px] ${
                                currentHistoryIndex === index
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                              }`}
                              disabled={isSaving}
                            >
                              <div className="text-left">
                                <div className="font-semibold">
                                  {history.sessionInfo?.sessionId || `버전 ${index + 1}`}
                                </div>
                                <div className="text-xs opacity-70">
                                  {clusterCount}개 클러스터
                                </div>
                                <div className="text-xs opacity-70">
                                  {new Date(history.timestamp).toLocaleDateString()}
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                      {currentHistoryIndex >= 0 && histories[currentHistoryIndex]?.sessionInfo && (
                        <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                          <div className="text-sm text-blue-800">
                            <strong>현재 세션:</strong> {histories[currentHistoryIndex].sessionInfo!.description}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              <div className="relative w-[1000px] h-[800px] mx-auto mt-8">
                {images.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <div className="text-4xl mb-4">📺</div>
                    <h2 className="text-2xl font-semibold text-gray-800 mb-2">아직 데이터가 없습니다</h2>
                    <p className="text-gray-600 mb-6">YouTube 시청 기록을 업로드하여 나만의 프로필을 만들어보세요!</p>
                    <Button onClick={() => router.push('/upload')} className="bg-blue-600 hover:bg-blue-700 text-white">
                      시청 기록 업로드하기
                    </Button>
                  </div>
                ) : (
                  <DndContext onDragEnd={handleDragEnd}>
                    {images.map((image) => (
                      <DraggableImage
                        key={image.id}
                        image={image}
                        position={positions[image.id]}
                        isEditing={isEditing}
                        positions={positions}
                        frameStyle={frameStyles[image.id] || 'healing'}
                        onFrameStyleChange={handleFrameStyleChange}
                        onImageChange={onImageChange}
                        onImageSelect={handleImageSelect}
                        isSelected={visibleImageIds.has(image.id)}
                        isSearchMode={isSearchMode}
                        onImageDelete={handleImageDelete}
                      />
                    ))}
                  </DndContext>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </main>
  );
} 