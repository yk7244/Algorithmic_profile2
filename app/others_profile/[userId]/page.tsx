"use client";

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import DraggableImage from '@/app/my_profile/Draggable/DraggableImage';
import ProfileHeader from '@/app/my_profile/Nickname/ProfileHeader';
import { 
ProfileData, 
ImageData,
} from '@/app/types/profile';
import { DndContext } from '@dnd-kit/core';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { getProfileData, getClusterImages, getClusterHistory, getPublicClusterHistory, getPublicClusterImages } from '@/lib/database';
import ClusterDetailPanel from '@/app/my_profile/Modal/ClusterDetailPanel';

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
const [selectedImage, setSelectedImage] = useState<ImageData | null>(null); // 🆕 선택된 이미지 상태 추가

useEffect(() => {
    const loadUserProfile = async () => {
      if (!userId) return;
      
      try {
        setIsLoading(true);
        
        // DB에서 프로필 데이터 가져오기
        const profileData = await getProfileData(userId);

        if (profileData) {
          setProfile({
            id: profileData.user_id || profileData.id,
            nickname: profileData.nickname,
            description: profileData.description,
            created_at: profileData.created_at,
            updated_at: profileData.updated_at
          });
        }

        // 🆕 cluster_images 우선, cluster_history fallback
        let clusterImages = await getPublicClusterImages(userId);
        if (clusterImages && clusterImages.length > 0) {
          console.log(`[OthersProfile] 공개 cluster_images에서 ${clusterImages.length}개 클러스터 로드 (사용자: ${userId})`);
        } else {
          clusterImages = await getPublicClusterHistory(userId);
          console.log(`[OthersProfile] 공개 cluster_history에서 ${clusterImages?.length || 0}개 클러스터 로드 (사용자: ${userId})`);
        }

        if (clusterImages && clusterImages.length > 0) {
          // DB 데이터를 ImageData 형식으로 변환
          const formattedImages: ImageData[] = clusterImages.map((item: any) => ({
            id: item.id,
            user_id: item.user_id,
            main_keyword: item.main_keyword,
            keywords: item.keywords || [],
            mood_keyword: item.mood_keyword || '',
            description: item.description || '',
            category: item.category || '',
            sizeWeight: item.size_weight || 1,
            src: item.src,
            relatedVideos: item.related_videos || [],
            desired_self: item.desired_self || false,
            desired_self_profile: item.desired_self_profile,
            metadata: item.metadata || {},
            rotate: item.rotate || 0,
            width: item.width || 300,
            height: item.height || 200,
            left: item.left_position || '0px',
            top: item.top_position || '0px',
            position: { x: item.position_x || 0, y: item.position_y || 0 },
            frameStyle: item.frame_style || 'normal',
            created_at: item.created_at || new Date().toISOString()
          }));

          setImages(formattedImages);
          
          // 위치 정보 설정
          const positions = formattedImages.reduce((acc, image) => {
            acc[image.id] = image.position;
            return acc;
          }, {} as Record<string, ImageData['position']>);
          setPositions(positions);

          // 프레임 스타일 설정
          const frameStyles = formattedImages.reduce((acc, image) => {
            acc[image.id] = image.frameStyle;
            return acc;
          }, {} as Record<string, string>);
          setFrameStyles(frameStyles);
        } else {
          console.log(`[OthersProfile] 클러스터 데이터 없음 (사용자: ${userId})`);
    }

        console.log('[OthersProfile] 사용자 프로필 로드 완료:', userId);
      } catch (error) {
        console.error('[OthersProfile] 프로필 로드 실패:', error);
      } finally {
    setIsLoading(false);
    }
    };

    loadUserProfile();
}, [userId]);

if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
}

if (!profile) {
    return <div className="flex items-center justify-center h-screen">User not found.</div>;
}

// 다른 사람 프로필에서는 드래그가 동작하지 않도록 빈 함수를 전달합니다.
const handleDragEnd = () => {};

// 🆕 이미지 선택 핸들러 추가 (클러스터 상세 보기용)
const handleImageSelect = (image: ImageData) => {
    setSelectedImage(image);
};

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
                    image={image as any}
                    position={positions[image.id] || { x: 0, y: 0 }}        
                    isEditing={false} // 드래그 및 리사이즈 비활성화
                    isOwner={false} // 다른 사람 프로필이므로 isOwner를 false로 설정
                    ownerId={userId}
                    frameStyle={image.desired_self ? 'star' : (frameStyles[image.id] || 'healing')}
                    onFrameStyleChange={() => {}} // 동작 안 함
                    onImageChange={() => {}} // 동작 안 함
                    onImageSelect={handleImageSelect} // 동작 안 함
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
    
    {/* 🆕 클러스터 상세 정보 패널 */}
    {selectedImage && (
        <ClusterDetailPanel
            image={selectedImage}
            showDetails={!!selectedImage}
            setShowDetails={(show) => setSelectedImage(show ? selectedImage : null)}
            isEditing={false}
            isOwner={false} // 다른 사람의 프로필임
            onImageSelect={handleImageSelect}
            ownerId={userId} // 프로필 소유자 ID 전달
        />
    )}
    </main>
);
} 