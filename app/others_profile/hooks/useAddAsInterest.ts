import { useRouter } from 'next/navigation';
import { saveSliderHistory } from '../../utils/saveSliderHistory';

export const useAddAsInterest = (setShowDetails: (show: boolean) => void) => {
    const router = useRouter();

    const handleAddAsInterest = (image: any, ownerId?: string) => {
        if (!ownerId) {
            console.error("Owner ID is not available. Cannot add as interest.");
            alert("오류: 프로필 소유자 정보를 찾을 수 없습니다.");
            return;
        }

        console.log("Adding as interest:", image, "from owner:", ownerId);

        const profileImagesRaw = localStorage.getItem('profileImages');
        let profileImages = profileImagesRaw ? JSON.parse(profileImagesRaw) : [];

        // 데이터를 항상 배열 형태로 일관성 있게 처리합니다.
        let imageList: any[] = [];
        if (Array.isArray(profileImages)) {
            imageList = profileImages;
        } else if (typeof profileImages === 'object' && profileImages !== null) {
            // 데이터가 객체 형태일 경우, 배열로 변환하여 기존 데이터를 보존합니다.
            imageList = Object.values(profileImages);
        }

        const newInterestImage = {
            ...image,
            id: `desired_${image.id}_${Date.now()}`,
            desired_self: true,
            desired_self_profile: ownerId,
            frameStyle: 'cokie',
            left: "440px",
            top: "440px",
            position: { x: 440, y: 440 },
            sizeWeight: 0.7,
            rotate: 0,
            user_id: '',
            created_at: new Date().toISOString(),
            metadata: image.metadata || {}
        };
        
        // 이미 추가된 관심사인지 확인 (원본 이미지 src와 프로필 주인을 기준)
        const isAlreadyAdded = imageList.some(
            img => img.desired_self && img.src === newInterestImage.src && img.desired_self_profile === ownerId
        );

        if (isAlreadyAdded) {
            alert('이미 내 프로필에 추가된 관심사입니다.');
            return; // 중복 추가 방지
        }

        // 항상 push를 사용하여 새 관심사를 배열에 추가합니다.
        imageList.push(newInterestImage);
        localStorage.setItem('profileImages', JSON.stringify(imageList));
        
        // 슬라이더 히스토리에도 기록 추가
        const sliderResult = saveSliderHistory(imageList);
        if (sliderResult.success) {
            console.log('✅ 슬라이더 히스토리에 새로운 관심사 기록 추가됨');
        } else {
            console.error('❌ 슬라이더 히스토리 저장 실패:', sliderResult.error);
        }
        
        console.log('✅ 새로운 관심사 이미지 추가됨:', newInterestImage);
        alert('새로운 관심사가 내 프로필에 추가되었습니다.');
        setShowDetails(false);
        router.push('/my_profile');
    };

    return { handleAddAsInterest };
}; 

