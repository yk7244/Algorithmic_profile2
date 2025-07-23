import { useState } from "react";
import { useRouter } from "next/navigation";
import { ImageData } from '@/app/types/profile';
import { profiles } from '@/app/others_profile/dummy-data';

// 3D 카드 스택 컴포넌트
interface CardStack3DProps {
    cards: ImageData[];
}

const CardStack3D: React.FC<CardStack3DProps> = ({ cards }) => {
    const [centerIdx, setCenterIdx] = useState(0);
    const total = cards.length;
    const cardWidth = 288; // w-72
    const gap = 32; // 카드 간격(px)
    const router = useRouter();

    // 중앙 카드 이동 함수 (좌우 화살표 등에서 사용)
    const moveCenter = (dir: number) => {
    setCenterIdx((prev) => {
        let next = prev + dir;
        if (next < 0) next = 0;
        if (next > total - 1) next = total - 1;
        return next;
    });
    };

    return (
    <div className="relative w-full h-[500px] flex items-center justify-center select-none bg-transparent">
        {/* 좌측 화살표 */}
        <button
        className="absolute left-0 top-1/2 -translate-y-1/2 z-20 p-2 text-white/60 hover:text-white text-3xl"
        onClick={() => moveCenter(-1)}
        disabled={centerIdx === 0}
        style={{ opacity: centerIdx === 0 ? 0.2 : 1 }}
        aria-label="이전"
        >
        &#8592;
        </button>
        {/* 카드들 */}
        {cards.map((image, idx) => {
            const offset = idx - centerIdx;
            const isCenter = offset === 0;
            const imageSrc = image.src || '/images/default_image.png';
            const userId = image.user_id;
            // 유상님✅ userId로 프로필 찾기
            const profile = profiles.find(p => p.id === userId);
            return (
                <div
                key={image.id || idx}
                onClick={() => {
                    if (!isCenter) {
                    setCenterIdx(idx);
                    } else if (userId) {
                    router.push(`/others_profile/${userId}?main_keyword=${encodeURIComponent(image.main_keyword || '')}`);
                    }
                }}
                className={`absolute top-1/2 left-1/2 transition-all duration-500 cursor-pointer ${isCenter ? 'z-20' : 'z-10'}`}
                style={{
                    transform: `
                    translate(-50%, -50%)
                    translateX(${offset * (cardWidth + gap)}px)
                    scale(${isCenter ? 1.18 : 0.85})
                    `,
                    opacity: isCenter ? 1 : 0.5,
                    filter: isCenter ? 'none' : 'grayscale(1)',
                    boxShadow: 'none',
                    transition: 'all 0.5s cubic-bezier(.4,2,.6,1)',
                }}
                >
                <div className="w-72 h-48 object-cover rounded-xl flex flex-col items-start relative">
                    {/* main_keyword */}
                    <span className="mb-2 ml-2 font-semibold text-gray-200 text-base">
                    #{image.main_keyword}
                    </span>
                    <img src={imageSrc} alt="" className="w-72 h-44 object-cover shadow-lg" />
                </div>
                {isCenter && (
                    <div className="text-left mt-6 w-72">
                    <div className="font-bold text-sm text-white ">{profile?.nickname || '이름 없음'} 님과</div>
                    {/* 유상님✅ 비슷한 알고리즘 자화상 유사도*/}
                    <div className="font-bold text-sm text-white">52% 비슷한 알고리즘이예요.</div>
                    </div>      
                )}
                </div>
            );
        })}
        {/* 우측 화살표 */}
        <button
        className="absolute right-0 top-1/2 -translate-y-1/2 z-20 p-2 text-white/60 hover:text-white text-3xl"
        onClick={() => moveCenter(1)}
        disabled={centerIdx === total - 1}
        style={{ opacity: centerIdx === total - 1 ? 0.2 : 1 }}
        aria-label="다음"
        >
        &#8594;
        </button>
    </div>
    );
};

export default CardStack3D;        