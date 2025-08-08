"use client";

import { useState, useEffect, useRef } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import DraggableImage_others from '@/app/others_profile/Draggable/DraggableImage_others';
import ProfileHeader from '../Nickname/OthersProfileHeader';
import { 
ProfileData, 
ImageData,
UserData
} from '@/app/types/profile';
import { getPublicUserProfile } from '@/lib/database-clean';
import { getUserFullProfileById } from '@/app/utils/get/getUserData';
import { DndContext } from '@dnd-kit/core';
import { restrictToContainer } from '@/app/my_profile/Draggable/Hooks/Drag/useDragConstraints';
import { useRouter } from 'next/navigation';
import { MousePointerClickIcon, Lock } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { calculateUserSimilarity } from '@/lib/similarity';
import { supabase } from '@/lib/supabase-clean';

export default function OthersProfilePage() {
const params = useParams();
const searchParams = useSearchParams();
const userId = params.userId as string;
const router = useRouter();
const { isLoggedIn, isLoading: authLoading } = useAuth();

const [profile, setProfile] = useState<ProfileData | null>(null);
const [user, setUser] = useState<UserData | null>(null);
const [images, setImages] = useState<ImageData[]>([]);
const [positions, setPositions] = useState<Record<string, ImageData['position']>>({});
const [frameStyles, setFrameStyles] = useState<Record<string, string>>({});
const [bgColor, setBgColor] = useState(''); // 기본 배경색
const [isLoading, setIsLoading] = useState(true);
const boardRef = useRef<HTMLDivElement>(null);
const [show, setShow] = useState(true);
const [selectedImage, setSelectedImage] = useState<ImageData | null>(null);

const mainKeyword = searchParams.get('main_keyword');
const searchKeyword = searchParams.get('searchKeyword');
const userIds = searchParams.get('userIds');
const [userSimilarity, setUserSimilarity] = useState<number>(0);

// 이미지 선택 핸들러
const handleImageSelect = (image: ImageData) => {
    console.log('🔍 이미지 선택됨:', image.main_keyword);
    setSelectedImage(image);
};

useEffect(() => {
    const loadUserProfile = async () => {
        try {
            setIsLoading(true);
            
            // DB에서 사용자 전체 프로필 조회 (user, profile, images 포함)
            const fullProfile = await getUserFullProfileById(userId);
            
            if (fullProfile && fullProfile.user && fullProfile.profile) {
                console.log('✅ 공개 사용자 프로필 로드 완료:', userId);
                
                // 사용자 정보 설정
                setUser(fullProfile.user);
                setBgColor(fullProfile.user.background_color || '#ffffff');
                
                // 프로필 정보 설정
                setProfile(fullProfile.profile);
                
                // 이미지 정보 설정 - 완전한 ImageData 매핑
                if (fullProfile.images && fullProfile.images.length > 0) {
                    console.log(`✅ ${fullProfile.user.nickname}님의 이미지 ${fullProfile.images.length}개 로드 완료`);
                    
                    const imageData: ImageData[] = fullProfile.images;
                    
                    setImages(imageData);
                    
                    // 포지션 및 프레임 스타일 설정
                    const newPositions = imageData.reduce((acc, image) => {
                        acc[image.id] = image.position;
                        return acc;
                    }, {} as Record<string, ImageData['position']>);
                    setPositions(newPositions);
                    
                    const newFrameStyles = imageData.reduce((acc, image) => {
                        acc[image.id] = image.frameStyle || '';
                        return acc;
                    }, {} as Record<string, string>);
                    setFrameStyles(newFrameStyles);
                    
                    console.log('✅ others_profile 상태 설정 완료:', imageData.length, '개 이미지');
                } else {
                    console.warn('⚠️ 사용자 이미지가 없음');
                    setImages([]);
                }
                
            } else {
                console.warn('⚠️ 공개 사용자 프로필을 찾을 수 없음:', userId);
                setProfile(null);
                setUser(null);
                setImages([]);
            }
            
        } catch (error) {
            console.error('❌ 공개 사용자 프로필 로드 중 오류:', error);
            setProfile(null);
            setUser(null);
            setImages([]);
        } finally {
            setIsLoading(false);
        }
    };

    loadUserProfile();
}, [userId]);

// 사용자간 유사도 계산
useEffect(() => {
    const calculateSimilarity = async () => {
        try {
            if (!profile || !user || !images.length) return;

            // 현재 로그인한 사용자 정보 가져오기
            const { data: { user: currentUser } } = await supabase.auth.getUser();
            if (!currentUser) return;

            // 현재 사용자의 프로필 가져오기
            const currentUserProfileRaw = await getUserFullProfileById(currentUser.id);
            if (!currentUserProfileRaw.user || !currentUserProfileRaw.profile) {
                console.warn('⚠️ 현재 사용자 프로필이 불완전합니다');
                setUserSimilarity(0);
                return;
            }

            // 타입 안전성을 위한 타입 단언
            const currentUserProfile = {
                user: currentUserProfileRaw.user,
                profile: currentUserProfileRaw.profile,
                images: currentUserProfileRaw.images
            };

            // 타겟 사용자의 프로필 (이미 로드됨)
            // user와 profile이 모두 존재하는지 확인
            if (!user || !profile) {
                console.warn('⚠️ 타겟 사용자 데이터가 불완전하여 유사도 계산을 건너뜁니다');
                setUserSimilarity(0);
                return;
            }

            const targetUserProfile = {
                user,
                profile,
                images
            };

            // 유사도 계산
            const similarity = await calculateUserSimilarity(currentUserProfile, targetUserProfile);
            setUserSimilarity(similarity);
            
            console.log(`✅ 사용자간 유사도: ${(similarity * 100).toFixed(1)}%`);
        } catch (error) {
            console.error('❌ 사용자간 유사도 계산 실패:', error);
            setUserSimilarity(0); // 에러 시 기본값 설정
        }
    };

    calculateSimilarity();
}, [profile, user, images.length]);

// 인증 로딩 중일 때
if (authLoading) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="text-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">로딩 중...</p>
      </div>
    </div>
  );
}

// 로그인하지 않은 사용자
if (!isLoggedIn) {
  return (
    <div className="min-h-screen bg-white">
      <div className="absolute inset-0 overflow-hidden z-0">
        <div className="absolute -top-[10%] left-[10%] w-[40%] h-[30%] rounded-full bg-blue-300/30 blur-[130px] animate-blob" />
        <div className="absolute -bottom-[10%] -right-[5%] w-[40%] h-[40%] rounded-full bg-purple-300/30 blur-[130px] animate-blob animation-delay-20" />
      </div>
      
      <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
        <div className="text-center bg-white/80 backdrop-blur-lg rounded-2xl p-8 shadow-xl max-w-md">
          <Lock className="h-16 w-16 text-blue-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">로그인이 필요합니다</h2>
          <p className="text-gray-600 mb-6">
            다른 사용자의 프로필을 보려면 먼저 로그인해주세요.
          </p>
          <div className="space-y-3">
            <Button 
              onClick={() => router.push('/login')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 w-full"
            >
              로그인하러 가기
            </Button>
            <Button 
              variant="outline"
              onClick={() => router.push('/')}
              className="w-full"
            >
              홈으로 돌아가기
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
}

if (!profile) {
    return <div className="flex items-center justify-center h-screen">User not found.</div>;
}

// 다른 사람 프로필에서는 드래그가 동작하지 않도록 빈 함수를 전달합니다.
const handleDragEnd = () => {};

return (
    <>
    <div className="grid grid-cols-[minmax(320px,380px)_1fr] w-full h-screen overflow-y-hidden"  >
        <div className="absolute inset-0 overflow-hidden z-0 pointer-events-none">
            <div className="z-0 absolute -top-[10%] left-[10%] w-[40%] h-[30%] rounded-full blur-[130px] animate-blob"
            style={{
                backgroundColor: bgColor,
            }}
            />
            <div className="z-0 absolute -bottom-[10%] -right-[5%] w-[40%] h-[40%] rounded-full blur-[130px] animate-blob animation-delay-20"
            style={{
                backgroundColor: bgColor,
            }} />
        </div>
        {/* 왼쪽: 프로필/설명/닉네임 등 */}
        <div className={`flex flex-col z-10`}>
            {profile && (
                <ProfileHeader
                    profile={profile}
                    isEditing={false} // 다른 사람 프로필에서는 항상 false
                    isGeneratingProfile={false}
                    onEditClick={() => {}} // 동작 안 함
                    onSaveClick={() => {}}   // 동작 안 함
                    onGenerateProfile={() => {}} // 동작 안 함
                    isOwner={false} // 본인 프로필이 아님을 명시
                    changeProfile={() => {}} // 동작 안 함
                    isSearchMode={false}
                    searchKeyword={searchKeyword || ''}
                    similarities={[userSimilarity]} // 실제 계산된 사용자간 유사도 사용
                />
            )}
            {!profile && !isLoading && (
                <div className="text-white text-center py-4">
                    <p>프로필을 찾을 수 없거나 비공개 상태입니다.</p>
                </div>
            )}
        </div>
        
        {/* 오른쪽: 무드보드/이미지/카드 등 */}
        <div className="relative flex flex-col h-full w-full"  ref={boardRef}>        
            {/* 안내 문구 */}
            {show && (
            <div
                className={`relative z-1 mt-[100px] w-fit left-1/2 -translate-x-1/2 items-center text-center bg-white/40 backdrop-blur-lg 
                    text-black px-6 py-3 rounded-full shadow-lg flex items-end gap-2 animate-fadeIn `}
                role="alert"
                aria-live="polite"
                >
                <div className="flex flex-col items-center gap-2 p-2">
                    <div className="flex flex-col items-center gap-2">
                        <span className="text-base text-black">
                            발견하신 키워드
                            <span className="text-blue-600 font-bold "> #{mainKeyword} </span>
                            외에도 자유롭게 탐색하며 나와 닮은 점이나 새로운 관점을 발견해보세요. 
                        </span>
                    </div> 
                    <div className="flex flex-row items-center gap-2">
                        <MousePointerClickIcon className="w-6 h-6 text-black animate-pulse " />
                        <div className="text-base text-black">
                        내 시각화에 담고 싶은 키워드는 이미지를 클릭해 추가해보세요 
                        </div>
                    </div>
                </div>
                <button
                    className="ml-2 text-black font-bold text-lg hover:text-blue-200 transition"
                    onClick={() => {setShow(false)}}
                    aria-label="드래그 안내 닫기"
                    type="button"
                    >
                        ×
                </button>
            </div>
            )}
            {/* My_profile 페이지 이미지레이아웃 */}
            <div className="flex-1 flex flex-col items-center justify-start w-full">

                
                <div className="fixed w-full h-full mx-auto mt-8">
                    {/* 이미지가 없을 때 표시할 메시지 */}
                    {!isLoading && images.length === 0 && (
                        <div className="flex items-center justify-center h-full">
                            <div className="text-center p-8 bg-gray-50 rounded-lg shadow-lg max-w-md">
                                <div className="text-6xl mb-4">🔒</div>
                                <h3 className="text-xl font-semibold text-gray-800 mb-2">
                                    이 사용자의 무드보드를 볼 수 없습니다
                                </h3>
                                <p className="text-gray-600 mb-4">
                                    다음 중 하나의 이유일 수 있습니다:
                                </p>
                                <ul className="text-sm text-gray-500 text-left space-y-1">
                                    <li>• 공개 설정이 비활성화되어 있음</li>
                                    <li>• 아직 무드보드를 생성하지 않음</li>
                                    <li>• 모든 이미지가 히스토리로 이동됨</li>
                                </ul>
                                <button
                                    onClick={() => window.history.back()}
                                    className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                                >
                                    뒤로 가기
                                </button>
                            </div>
                        </div>
                    )}
                    
                    {/* 원래 DraggableImage_others 컴포넌트 사용 - 클러스터 선택 기능 포함 */}
                    {images.length > 0 ? (
                        <DndContext>
                            <div className="absolute inset-0 w-full h-full">
                                {images.map((image) => (
                                    <DraggableImage_others
                                        key={image.id}
                                        image={image}
                                        position={image.position} // DB에서 가져온 실제 위치 사용
                                        isEditing={false} // 다른 사람 프로필이므로 편집 불가
                                        frameStyle={frameStyles[image.id] || image.frameStyle || 'normal'}
                                        onImageSelect={handleImageSelect}
                                        isOwner={false} // 다른 사람의 프로필
                                        ownerId={userId}
                                        searchKeyword={searchKeyword || ''}
                                        mainKeyword={mainKeyword || ''} // 클러스터 선택용
                                        profile={profile || {} as ProfileData}
                                    />
                                ))}
                            </div>
                        </DndContext>
                    ) : null}
                </div>
            </div>
        </div>
    </div>
    </>
);
} 