import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useDraggableImage } from './useDraggableImage';
import { Sheet, SheetTrigger } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { RefreshCw, X, CheckCircle2 } from 'lucide-react';
import OpenAI from 'openai';

const openai = new OpenAI({
    apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
    dangerouslyAllowBrowser: true
});

// VideoData 타입 추가
export type VideoData = {
    title: string;
    embedId: string;
};

// DraggableImageProps 타입 정의 (필요에 따라 수정)
export interface DraggableImageProps {
    image: any;
    position?: { x: number; y: number };
    isEditing: boolean;
    positions?: any;
    frameStyle: string;
    onFrameStyleChange: (id: string, style: 'healing' | 'inspiration' | 'people' | 'interest' | 'star') => void;
    onImageChange: (id: string, src: string, keyword: string) => void;
    onImageSelect: (image: any) => void;
    isSelected: boolean;
    isSearchMode: boolean;
    onImageDelete: (id: string) => void;
}

const DraggableImage: React.FC<DraggableImageProps> = ({ 
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
}) => {
    const { attributes, listeners, setNodeRef, style } = useDraggableImage(
        image.id,
        isEditing,
        position,
        image.rotate
    );

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
        image.relatedVideos.forEach((video: VideoData) => {
            if (!video.embedId) return; // embedId가 없으면 건너뛰기
            
            try {
            const player = new window.YT.Player(`player-${video.embedId}`, {
                events: {
                onStateChange: (event: any) => {
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

    const handleFrameStyleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
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

    // YouTube API로 AI 추천 비디오 가져오기
    const fetchAiRecommendedVideos = useCallback(async () => {
    if (!image.main_keyword) return;
    
    setIsLoadingAiVideos(true);
    try {
        const API_KEY = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;
        
        if (!API_KEY) {
        console.error('YouTube API 키가 설정되지 않았습니다.');
        throw new Error('API 키가 없습니다.');
        }

        // 주요 키워드와 랜덤 키워드 조합으로 검색
        const randomKeyword = image.keywords[Math.floor(Math.random() * image.keywords.length)];
        const searchQuery = `${image.main_keyword} ${randomKeyword}`;
        
        const response = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(searchQuery)}&type=video&maxResults=4&regionCode=KR&key=${API_KEY}`
        );

        if (!response.ok) {
        const errorData = await response.json();
        console.error('YouTube API 오류:', errorData);
        throw new Error(`YouTube API 오류: ${response.status}`);
        }

        const data = await response.json();
        
        if (data.items) {
        const videoList = data.items.map((item: any) => ({
            title: item.snippet.title,
            embedId: item.id.videoId
        }));
        setAiRecommendedVideos(videoList);
        }
    } catch (error) {
        console.error('AI 추천 비디오 가져오기 오류:', error);
        setAiRecommendedVideos([]);
        
        // 에러 발생 시 대체 콘텐츠 표시
        const fallbackVideos = [
        {
            title: '추천 영상을 불러올 수 없습니다.',
            embedId: ''
        }
        ];
        setAiRecommendedVideos(fallbackVideos);
    } finally {
        setIsLoadingAiVideos(false);
    }
    }, [image.main_keyword, image.keywords]);

    // 이미지가 선택되었을 때 AI 추천 비디오 가져오기
    useEffect(() => {
    if (!isEditing) {
        fetchAiRecommendedVideos();
    }
    }, [fetchAiRecommendedVideos, isEditing]);

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

    return (
    <>
    <Sheet>
    <div
        ref={setNodeRef}
        //이미지 띄우기
        style={{
        ...style,
        position: 'absolute',
        width: image.width * (image.desired_self ? image.sizeWeight * 2 : image.sizeWeight * 10),
        height: (image.height + 80) * (image.desired_self ? image.sizeWeight * 2 : image.sizeWeight * 10),
        left: image.left,
        top: image.top,
        //transform: 'translate(-100%, 80%)',
        transition: isEditing ? 'none' : 'transform 0.8s ease-in-out',
        touchAction: 'none',
        zIndex: isSelected ? 30 : 10,
        }}
        className={`${isEditing ? "cursor-move" : isSearchMode ? "cursor-pointer" : ""} ${
        isSelected ? "ring-4 ring-blue-500 ring-opacity-70 shadow-xl scale-105" : ""
        }`}
    >
        {/* 메인 키워드 - 편집 모드와 일반 모드 모두에서 표시 */}
        <div className={`absolute inset-0 transform ${!isEditing && isSearchMode ? 'transition-all duration-300 group hover:scale-110 hover:z-30' : ''}`}
        onClick={() => !isEditing && isSearchMode && handleImageClick()}
        >
        {/* 키워드 */}
        <div 
            className="absolute -top-28 left-1/2 transform -translate-x-1/2 z-20 whitespace-nowrap 5"
            style={{
            fontSize: `${Math.max(80, 100 * image.sizeWeight)}px`,
            }}
        >
            <div 
            className="px-8 py-4 "
            style={{
                transform: `scale(${image.sizeWeight})`,
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
                <img
                src={image.src || '/images/placeholder.jpg'}
                alt={image.main_keyword}
                className={`w-full h-full object-cover shadow-lg transition-transform duration-300 ${!isEditing && isSearchMode ? 'group-hover:scale-105' : ''}`}
                onClick={(e) => {
                    console.log('이미지 정보:', image);
                    e.stopPropagation();
                    if (!isEditing && isSearchMode) {
                    handleImageClick();
                    }
                }}
                onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    console.error('이미지 로드 실패:', target.src);
                    target.src = '/images/placeholder.jpg';
                }}
                />
            </div>
            
            {/* 키워드를 이미지 하단에 배치 */}
            <div className="absolute bottom-0.5 left-0 right-0 flex flex-wrap gap-1 justify-center items-center p-1">
                {image.keywords.map((keyword: string, idx: number) => (
                <span
                    key={idx}
                    className="inline-block px-2 py-0.5 text-xs font-medium text-white backdrop-blur-sm rounded-full shadow-sm transition-colors"
                >
                    #{keyword}
                </span>
                ))}
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
                {image.relatedVideos.map((video: VideoData, idx: number) => (
                    <div key={idx} className="relative group">
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
        className="fixed top-0 right-0 w-[400px] h-[calc(100vh-150px)] bg-white shadow-xl overflow-hidden transition-all duration-300"
        style={{
        zIndex: 99999,
        transform: 'translateX(0)',
        transition: 'all 0.3s ease-in-out',
        top: '0px',
        right: '-80px'
        
        }}
    >
        <div className="flex items-center justify-between p-4 border-b bg-white">
        <h2 className="text-base sm:text-lg font-semibold">{image.main_keyword}</h2>
        <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setShowDetails(false)}
        >
            <X className="h-4 w-4" />
        </Button>
        </div>

        <div className="h-[calc(100%-60px)] overflow-y-auto px-2 sm:px-4">
        <div className="flex flex-col w-full mx-auto pb-8">
            <div className="relative w-full h-[150px] sm:h-[300px] flex-shrink-0">
            <img
                src={image.src}
                alt={image.main_keyword}
                className="w-full h-full object-cover rounded-lg"
            />
            
            <div className="absolute top-4 right-4">
                <span className="px-2 sm:px-3 py-1 sm:py-1.5 bg-black/50 backdrop-blur-md rounded-full text-white text-xs sm:text-sm font-medium">
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
                {image.keywords.map((keyword: string, idx: number) => (
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
                        {image.relatedVideos.map((video: VideoData, idx: number) => (
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
                            aiRecommendedVideos.map((video: VideoData, idx: number) => (
                            <div key={idx} className="space-y-2">
                                <h5 className="text-sm font-medium text-gray-800 mb-1">
                                <span className="text-blue-500 font-semibold">AI 추천:</span> {video.title}
                                </h5>
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
                        {image.relatedVideos.map((video: VideoData, idx: number) => (
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
        {image.relatedVideos.map((video: VideoData, idx: number) => (
            <div key={idx} className="relative group">
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
};

export default DraggableImage; 


// YouTube IFrame API 타입 선언
declare global {
    interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
    }
}