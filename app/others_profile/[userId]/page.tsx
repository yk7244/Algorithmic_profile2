"use client";

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import DraggableImage from '@/app/my_profile/Draggable/DraggableImage';
import ProfileHeader from '@/app/my_profile/Nickname/ProfileHeader';
import { dummyUsers } from '../dummy-data';
import { 
ProfileData, 
ImageData,
} from '@/app/types/profile';
import { DndContext } from '@dnd-kit/core';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

export default function OthersProfilePage() {
const params = useParams();
const userId = params.userId as string;
const router = useRouter();
const [showSuccessDialog, setShowSuccessDialog] = useState(false);

const [profile, setProfile] = useState<ProfileData | null>(null);
const [images, setImages] = useState<ImageData[]>([]);
const [positions, setPositions] = useState<Record<string, ImageData['position']>>({});
const [frameStyles, setFrameStyles] = useState<Record<string, string>>({});
const [bgColor, setBgColor] = useState('bg-gray-50'); // 기본 배경색
const [isLoading, setIsLoading] = useState(true);

useEffect(() => {
    if (userId) {
    const userData = dummyUsers[userId];
    if (userData) {
        setProfile(userData.profile);
        setImages(userData.images);
        setPositions(userData.images.reduce((acc, image) => {
            acc[image.id] = image.position;
            return acc;
        }, {} as Record<string, ImageData['position']>));

        setFrameStyles(userData.images.reduce((acc, image) => {
            acc[image.id] = image.frameStyle;
            return acc;
        }, {} as Record<string, string>));
    }
    setIsLoading(false);
    }
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
    <main className={`fixed inset-0 overflow-y-auto transition-colors duration-500 ${bgColor}`}>
    <div className="relative z-20 w-full">
        <div className="max-w-[1200px] mx-auto ">
        
        <ProfileHeader
            profile={profile}
            isEditing={false} // 다른 사람 프로필에서는 항상 false
            isGeneratingProfile={false}
            onEditClick={() => {}} // 동작 안 함
            onSaveClick={() => {}}   // 동작 안 함
            onGenerateProfile={() => {}} // 동작 안 함
            isOwner={false} // 본인 프로필이 아님을 명시
        />

        <div className="relative w-[1000px] h-[680px] mx-auto mt-8">
            <DndContext onDragEnd={handleDragEnd}>
            {images.map((image) => (
                <div
                key={image.id || Math.random().toString()}
                className="opacity-100 scale-100 transition-all duration-500"
                >
                <DraggableImage
                    image={image}
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
            {/* 성공 다이얼로그 */}
            <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
                <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>이미지 추가 완료</DialogTitle>
                    <DialogDescription>
                    이미지가 성공적으로 무드보드에 추가되었습니다.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter className="flex justify-end gap-3 sm:justify-end">
                    <Button
                    variant="outline"
                    onClick={() => setShowSuccessDialog(false)}
                    >
                    다음에
                    </Button>
                    <Button
                    onClick={() => router.push('/my_profile')}
                    >
                    마이페이지 가기
                    </Button>
                </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
        </div>
    </div>
    </main>
);
} 