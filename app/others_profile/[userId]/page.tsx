"use client";

import { useState, useEffect, useRef } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import DraggableImage from '@/app/others_profile/Draggable/DraggableImage_others';
import ProfileHeader from '../Nickname/OthersProfileHeader';
//유상님✅ 더미 데이터로 가져옴
import { profiles, userImages, users } from '@/app/others_profile/dummy-data';
import { 
ProfileData, 
ImageData,
} from '@/app/types/profile';
import { DndContext } from '@dnd-kit/core';
import { useRouter } from 'next/navigation';
import { restrictToContainer } from '@/app/my_profile/Draggable/Hooks/Drag/useDragConstraints';
import { MousePointerClickIcon } from 'lucide-react';

export default function OthersProfilePage() {
const params = useParams();
const searchParams = useSearchParams();
const userId = params.userId as string;
const router = useRouter();

const [profile, setProfile] = useState<ProfileData | null>(null);
const [images, setImages] = useState<ImageData[]>([]);
const [positions, setPositions] = useState<Record<string, ImageData['position']>>({});
const [frameStyles, setFrameStyles] = useState<Record<string, string>>({});
const [bgColor, setBgColor] = useState(''); // 기본 배경색
const [isLoading, setIsLoading] = useState(true);
const boardRef = useRef<HTMLDivElement>(null);
const [show, setShow] = useState(true);

const mainKeyword = searchParams.get('main_keyword');
const searchKeyword = searchParams.get('searchKeyword');
const userIds = searchParams.get('userIds');
const similarities = [0.8];

useEffect(() => {
    const profile = profiles.find(p => p.id === userId);
    const images = userImages[userId] || [];
    const user = users.find(u => u.id === userId);
    if (profile) {
        setProfile(profile);
        setImages(images);
        setPositions(images.reduce((acc, image) => {
            acc[image.id] = image.position;
            return acc;
        }, {} as Record<string, ImageData['position']>));
        if (user && user.background_color) {
            setBgColor(user.background_color); // hex값만 저장
            console.log('🔥 user.background_color:', user.background_color);
        }
    }
    setIsLoading(false);
}, [userId]);

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
            <div className="z-20 absolute -top-[10%] left-[10%] w-[40%] h-[30%] rounded-full blur-[130px] animate-blob"
            style={{
                backgroundColor: bgColor,
            }}
            />
            <div className="absolute -bottom-[10%] -right-[5%] w-[40%] h-[40%] rounded-full blur-[130px] animate-blob animation-delay-20"
            style={{
                backgroundColor: bgColor,
            }} />
        </div>
        {/* 왼쪽: 프로필/설명/닉네임 등 */}
        <div className={`flex flex-col z-10`}>

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
            //유상님과 의논 후 수정 필요
            similarities={similarities}
        />
            
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
                            외에도 아래의 알고리즘 정체성 키워드들이 있어요!
                        </span>
                    </div> 
                    <div className="flex flex-row items-center gap-2">
                        <MousePointerClickIcon className="w-6 h-6 text-black animate-pulse " />
                        <div className="text-base text-black">
                            끌리는 알고리즘 정체성 키워드는 이미지를 클릭해 내 자화상에 담아보세요
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
                    <DndContext
                        onDragEnd={handleDragEnd}
                        modifiers={[restrictToContainer]}
                        >
                        {images.map((image) => (
                            <div
                            key={image.id || Math.random().toString()}
                            className="transition-all duration-500 opacity-100 scale-100"
                            >
                            <DraggableImage
                                image={image as any}
                                position={positions[image.id] || { x: 0, y: 0 }}        
                                isEditing={false} // 드래그 및 리사이즈 비활성화
                                isOwner={false} // 다른 사람 프로필이므로 isOwner를 false로 설정
                                ownerId={userId}
                                frameStyle={image.desired_self ? 'cokie' : (frameStyles[image.id] || 'normal')}
                                onImageSelect={() => {}} // 동작 안 함
                                searchKeyword={searchKeyword || ''}
                                mainKeyword={mainKeyword || ''}
                                profile={profile}
                            />
                            </div>
                        ))}
                    </DndContext>
                </div>
            </div>
        </div>
    </div>
    </>
);
} 