"use client";

import { useState, useEffect, useRef } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import DraggableImage from '@/app/my_profile/Draggable/DraggableImage';
import ProfileHeader from '@/app/my_profile/Nickname/ProfileHeader';
//유상님✅ 더미 데이터로 가져옴
import { profiles, userImages, users } from '@/app/others_profile/dummy-data';
import { 
ProfileData, 
ImageData,
} from '@/app/types/profile';
import { DndContext } from '@dnd-kit/core';
import { useRouter } from 'next/navigation';
import { restrictToContainer } from '@/app/my_profile/Draggable/Hooks/Drag/useDragConstraints';

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

const mainKeyword = searchParams.get('main_keyword');

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
    <main className="grid grid-cols-[minmax(320px,380px)_1fr] w-full h-screen overflow-y-hidden" style={{ backgroundColor: bgColor }}>
            {/* 왼쪽: 프로필/설명/닉네임 등 */}
            <div className={`flex flex-col px-4 py-12 backdrop-blur-sm z-10 bg-black/20 z-70`}>

                <ProfileHeader
                profile={profile}
                isEditing={false} // 다른 사람 프로필에서는 항상 false
                isGeneratingProfile={false}
                onEditClick={() => {}} // 동작 안 함
                onSaveClick={() => {}}   // 동작 안 함
                onGenerateProfile={() => {}} // 동작 안 함
                isOwner={false} // 본인 프로필이 아님을 명시
            />
                
            </div>
            
            {/* 오른쪽: 무드보드/이미지/카드 등 */}
            <div className="relative flex flex-col h-full w-full" style={{ backgroundColor: bgColor }} ref={boardRef}>        
                {/* 프로필 무드보드 텍스트 */}
                <div
                className={`absolute left-1/2 -translate-x-1/2 top-24  text-center text-black text-md font-bold bg-gradient-to-r 
                    bg-[length:200%_100%] 
                    bg-clip-text text-transparent animate-gradient-move from-gray-700 via-gray-200 to-gray-700`}
                >
                {profile.nickname ? `${profile.nickname}의` : ''} 알고리즘 프로필 무드보드
                {mainKeyword && (
                    <div className="mt-2 text-lg text-blue-700 drop-shadow font-semibold"># {mainKeyword}</div>
                )}
                </div>

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
                                    frameStyle={image.desired_self ? 'star' : (frameStyles[image.id] || 'healing')}
                                    onFrameStyleChange={() => {}} // 동작 안 함
                                    onImageChange={() => {}} // 동작 안 함
                                    onImageSelect={() => {}} // 동작 안 함
                                    isSelected={false}
                                    isSearchMode={false}
                                    onImageDelete={() => {}} // 동작 안 함
                                />
                                </div>
                            ))}
                        </DndContext>
                    </div>
                </div>
                
                
            </div>
        
            
    </main>
);
} 